const prometheus = require('../index');

test('Should allow direct connections', () => {
    const next = jest.fn();
    prometheus.middleware(
        {
            headers: {},
            state: {},
        },
        next
    );
    expect(next.mock.calls.length).toBe(1);
});

test('Should allow direct connections to /metrics', () => {
    const next = jest.fn();
    const vals = {};
    prometheus.middleware(
        {
            headers: {},
            state: {},
            path: '/metrics',
            set: (key, value) => {
                vals[key] = value;
            },
        },
        next
    );
    expect(next.mock.calls.length).toBe(1);
    expect(Object.keys(vals).includes('Content-Type'));
    expect(vals['Content-Type']).toBeDefined();
});

test('Should deny direct connections to /metrics with x-forwarded-header', () => {
    const next = jest.fn();
    expect(
        prometheus.middleware(
            {
                state: {},
                headers: {
                    'x-forwarded-for': '192.168.0.1',
                },
                path: '/metrics',
                throw: (code, message) => {
                    throw new Error(message);
                },
            },
            next
        )
    ).rejects.toBeInstanceOf(Error);
});

test('Should track HTTP metrics as a Prometheus histogram', async () => {
    const next = jest.fn();
    const path = '/test';
    await prometheus.httpMetricMiddleware(
        {
            request: {
                path,
                method: 'get',
            },
            response: {
                status: 200,
            },
            state: {},
            path,
        },
        next
    );
    const metric = prometheus.client.register.getSingleMetric(
        'http_request_duration_ms'
    );
    const metrics = Object.keys(metric.hashMap);
    expect(metric).toBeInstanceOf(prometheus.client.Histogram);
    expect(metrics.length).toBe(1);
    expect(metrics[0]).toBe('code:200,method:get,route:/test');
});
