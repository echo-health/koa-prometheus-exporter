const client = require('prom-client');
const debug = require('debug')('prometheus:middleware');
require('prometheus-gc-stats')(client.register)();

client.collectDefaultMetrics();

module.exports = {
    client,
    middleware: async (ctx, next) => {
        ctx.state.prometheus = client;
        if (ctx.path === '/metrics') {
            debug('GET /metrics');
            if (!ctx.headers["x-forwarded-for"]) {
                ctx.set('Content-Type', client.register.contentType);
                ctx.body = client.register.metrics();
            } else {
                ctx.throw(403, "Forbidden");
            }
        }
        await next();
    },
};