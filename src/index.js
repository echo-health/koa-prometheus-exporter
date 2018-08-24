const client = require('prom-client');
const debug = require('debug')('prometheus:middleware');
require('prometheus-gc-stats')(client.register)();

client.collectDefaultMetrics();

function getMicroseconds() {
    const now = process.hrtime();
    return now[0] * 1000000 + now[1] / 1000;
}

function httpTimingEnabled(options) {
    return !options.httpTimingDisable || options.httpTimingDisable === false;
}

function getBuckets(options) {
    if (options.httpTimingBuckets) {
        return options.httpTimingBuckets;
    }
    return client.exponentialBuckets(0.05, 1.3, 20);
}

function prometheusMetricsExporterWrapper(options = {}) {
    const path = options.path || '/metrics';
    const { headerBlacklist } = options;
    return async function prometheusMetricsExporter(ctx, next) {
        ctx.state.prometheus = client;
        if (ctx.path === path) {
            if (ctx.method.toLowerCase() === 'get') {
                debug('GET /%s', path);
                if (
                    !headerBlacklist ||
                    headerBlacklist.filter(h => {
                        return Object.keys(ctx.headers).includes(h);
                    }).length === 0
                ) {
                    ctx.set('Content-Type', client.register.contentType);
                    ctx.body = client.register.metrics();
                } else {
                    ctx.throw(403, 'Forbidden');
                }
            } else {
                ctx.throw(403, 'Method not allowed');
            }
        } else {
            await next();
        }
    };
}

function httpMetricMiddlewareWrapper(options = {}) {
    // setup metrics.
    const labelNames = ['method', 'uri', 'code'];
    const httpRequestsTotal = new client.Counter({
        labelNames,
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
    });

    let httpServerRequestsSeconds;
    if (httpTimingEnabled(options)) {
        httpServerRequestsSeconds = new client.Histogram({
            labelNames: ['method', 'uri', 'code'],
            name: 'http_server_requests_seconds',
            help: 'Duration of HTTP requests in seconds',
            buckets: getBuckets(options),
        });
    }

    const httpRequestSizeBytes = new client.Summary({
        labelNames,
        name: 'http_request_size_bytes',
        help: 'Duration of HTTP requests size in bytes',
    });

    const httpResponseSizeBytes = new client.Summary({
        labelNames,
        name: 'http_response_size_bytes',
        help: 'Duration of HTTP response size in bytes',
    });

    let pathTransformFunction = path => {
        return path;
    };
    if (options.pathTransform) {
        pathTransformFunction = options.pathTransform;
    }
    return async function httpMetricMiddleware(ctx, next) {
        const startEpoch = getMicroseconds();
        await next();
        const path = pathTransformFunction(ctx.request.path);
        if (ctx.request.length) {
            httpRequestSizeBytes
                .labels(ctx.request.method, path, ctx.response.status)
                .observe(ctx.request.length);
        }
        if (ctx.response.length) {
            httpResponseSizeBytes
                .labels(ctx.request.method, path, ctx.response.status)
                .observe(ctx.response.length);
        }
        if (httpTimingEnabled(options)) {
            httpServerRequestsSeconds
                .labels(ctx.request.method, path, ctx.response.status)
                .observe((getMicroseconds() - startEpoch) / 1000000);
        }
        httpRequestsTotal
            .labels(ctx.request.method, path, ctx.response.status)
            .inc();
    };
}

module.exports = {
    client,
    httpMetricMiddleware: httpMetricMiddlewareWrapper,
    middleware: prometheusMetricsExporterWrapper,
};
