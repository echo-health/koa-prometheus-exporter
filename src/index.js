const client = require('prom-client');
const debug = require('debug')('prometheus:middleware');
require('prometheus-gc-stats')(client.register)();

client.collectDefaultMetrics();
// setup metrics.
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500],
});

module.exports = {
    client,
    middleware: (options = {}) => {
        const path = options.path || '/metrics';
        const { headerBlacklist } = options;
        return async (ctx, next) => {
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
                        return null;
                    }
                    ctx.throw(403, 'Forbidden');
                }
                ctx.throw(405, 'Method not allowed');
            } else {
                await next();
            }
        };
    },
    httpMetricMiddleware: async (ctx, next) => {
        const startEpoch = Date.now();
        await next();
        httpRequestDurationMicroseconds
            .labels(ctx.request.method, ctx.request.path, ctx.response.status)
            .observe(Date.now() - startEpoch);
    },
};
