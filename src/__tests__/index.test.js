const prometheus = require('../index');

beforeEach(() => {
    prometheus.client.register.clear();
});

test("Should block any request that isn't a GET", async () => {
    expect.assertions(1);
    const next = jest.fn();
    try {
        await prometheus.middleware()(
            {
                headers: {},
                state: {},
                path: '/metrics',
                method: 'post',
                throw: (code, message) => {
                    throw new Error(message);
                },
            },
            next
        );
    } catch (err) {
        expect(err.message).toBe('Method not allowed');
    }
});

test('Should allow direct connections', () => {
    const next = jest.fn();
    prometheus.middleware()(
        {
            headers: {},
            state: {},
        },
        next
    );
    expect(next.mock.calls.length).toBe(1);
});

test('Should return metrics for overriden path', async () => {
    const next = jest.fn();
    const vals = {};
    const path = '/test';
    await prometheus.middleware({
        path,
    })(
        {
            path,
            headers: {},
            state: {},
            method: 'get',
            set: (key, value) => {
                vals[key] = value;
            },
        },
        next
    );
    expect(next.mock.calls.length).toBe(0);
    expect(Object.keys(vals).includes('Content-Type')).toBe(true);
    expect(vals['Content-Type']).toBeDefined();
});

test('Should return metrics for default path /metrics', async () => {
    const next = jest.fn();
    const vals = {};
    await prometheus.middleware()(
        {
            headers: {},
            state: {},
            method: 'get',
            path: '/metrics',
            set: (key, value) => {
                vals[key] = value;
            },
        },
        next
    );
    expect(next.mock.calls.length).toBe(0);
    expect(Object.keys(vals).includes('Content-Type')).toBe(true);
    expect(vals['Content-Type']).toBeDefined();
});

test('Should deny direct connections to /metrics with blacklisted header', async () => {
    const next = jest.fn();
    const header = 'x-forwarded-for';
    expect.assertions(1);
    try {
        await prometheus.middleware({
            headerBlacklist: [header],
        })(
            {
                state: {},
                method: 'get',
                headers: {
                    [header]: '192.168.0.1',
                },
                path: '/metrics',
                throw: (code, message) => {
                    throw new Error(message);
                },
            },
            next
        );
    } catch (err) {
        expect(err.message).toBe('Forbidden');
    }
});

test('Should deny direct connections to /metrics if token doesnt match', async () => {
    const next = jest.fn();
    const token = '12345';
    expect.assertions(1);
    try {
        await prometheus.middleware({
            token
        })(
            {
                state: {},
                method: 'get',
                path: '/metrics',
                request: {
                    query: {},
                },
                throw: (code, message) => {
                    throw new Error(message);
                },
            },
            next
        );
    } catch (err) {
        expect(err.message).toBe('Forbidden');
    }
});

test('Should return metrics with a single matching token is supplied', async () => {
    const next = jest.fn();
    const vals = {};
    const token = '12345';
    await prometheus.middleware({
        token
    })(
        {
            headers: {},
            state: {},
            method: 'get',
            path: '/metrics',
            request: {
                query: {
                    token,
                },
            },
            set: (key, value) => {
                vals[key] = value;
            },
        },
        next
    );
    expect(next.mock.calls.length).toBe(0);
    expect(Object.keys(vals).includes('Content-Type')).toBe(true);
    expect(vals['Content-Type']).toBeDefined();
});

test('Should return metrics when multiple tokens are supplied and one matches', async () => {
    const next = jest.fn();
    const vals = {};
    const token = '12345';
    await prometheus.middleware({
        token
    })(
        {
            headers: {},
            state: {},
            method: 'get',
            path: '/metrics',
            request: {
                query: {
                    token: [token, '67890'],
                },
            },
            set: (key, value) => {
                vals[key] = value;
            },
        },
        next
    );
    expect(next.mock.calls.length).toBe(0);
    expect(Object.keys(vals).includes('Content-Type')).toBe(true);
    expect(vals['Content-Type']).toBeDefined();
});

test('Should track HTTP metrics as a Prometheus histogram', async () => {
    const next = jest.fn();
    const path = '/test';
    await prometheus.httpMetricMiddleware()(
        {
            request: {
                path,
                method: 'get',
                length: 1000,
            },
            response: {
                status: 200,
                length: 1000,
            },
            state: {},
            path,
        },
        next
    );
    const metricsToExist = {
        http_server_requests_seconds: prometheus.client.Histogram,
        http_request_size_bytes: prometheus.client.Summary,
        http_response_size_bytes: prometheus.client.Summary,
        http_requests_total: prometheus.client.Counter,
    };
    Object.keys(metricsToExist).forEach(k => {
        const metric = prometheus.client.register.getSingleMetric(k);
        const metrics = Object.keys(metric.hashMap);
        expect(metric).toBeInstanceOf(metricsToExist[k]);
        expect(metrics.length).toBe(1);
        expect(metrics[0]).toBe('code:200,method:get,uri:/test');
    });
});

test('Should track HTTP metrics as a Prometheus histogram and transform the URI', async () => {
    const next = jest.fn();
    const path = '/test/1234/get';
    await prometheus.httpMetricMiddleware({
        pathTransform: p => {
            if (p && p.includes('/')) {
                return `/${p.split('/')[1]}`;
            }
            return p;
        },
    })(
        {
            request: {
                path,
                method: 'get',
                length: 1000,
            },
            response: {
                status: 200,
                length: 1000,
            },
            state: {},
            path,
        },
        next
    );
    const metricsToExist = {
        http_server_requests_seconds: prometheus.client.Histogram,
        http_request_size_bytes: prometheus.client.Summary,
        http_response_size_bytes: prometheus.client.Summary,
        http_requests_total: prometheus.client.Counter,
    };
    Object.keys(metricsToExist).forEach(k => {
        const metric = prometheus.client.register.getSingleMetric(k);
        const metrics = Object.keys(metric.hashMap);
        expect(metric).toBeInstanceOf(metricsToExist[k]);
        expect(metrics.length).toBe(1);
        expect(metrics[0]).toBe('code:200,method:get,uri:/test');
    });
});

test('Should track HTTP metrics as a Prometheus histogram and include 2 custom labels', async () => {
    const next = jest.fn();
    const path = '/test/1234/get';
    await prometheus.httpMetricMiddleware({
        customLabels: {
            dynamic: ctx => 'dynamic',
            static: 'static'
        }
    })(
        {
            request: {
                path,
                method: 'get',
                length: 1000,
            },
            response: {
                status: 200,
                length: 1000,
            },
            state: {},
            path,
        },
        next
    );
    const metricsToExist = {
        http_server_requests_seconds: prometheus.client.Histogram,
        http_request_size_bytes: prometheus.client.Summary,
        http_response_size_bytes: prometheus.client.Summary,
        http_requests_total: prometheus.client.Counter,
    };
    Object.keys(metricsToExist).forEach(k => {
        const metric = prometheus.client.register.getSingleMetric(k);
        const metrics = Object.keys(metric.hashMap);
        expect(metric).toBeInstanceOf(metricsToExist[k]);
        expect(metrics.length).toBe(1);
        expect(metrics[0]).toBe(`code:200,dynamic:dynamic,method:get,static:static,uri:${path}`);
    });
});
