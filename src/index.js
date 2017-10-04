const client = require('prom-client');
const debug = require('debug')('prometheus:middleware');
require('prometheus-gc-stats')(client.register)();

client.collectDefaultMetrics();

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
};
