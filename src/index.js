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
    middleware: async (ctx, next) => {
        ctx.state.prometheus = client;
        if (ctx.path === '/metrics') {
            debug('GET /metrics');
            if (!ctx.headers['x-forwarded-for']) {
                ctx.set('Content-Type', client.register.contentType);
                ctx.body = client.register.metrics();
            } else {
                ctx.throw(403, 'Forbidden');
            }
        }
        await next();
    },
    httpMetricMiddleware: async (ctx, next) => {
        const startEpoch = Date.now();
        await next();
        httpRequestDurationMicroseconds
            .labels(ctx.request.method, ctx.request.path, ctx.response.status)
            .observe(Date.now() - startEpoch);
    },
};
