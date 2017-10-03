const prometheus = require('../index');

test('Should allow direct connections', () => {
    const next = jest.fn();
    prometheus.middleware({
        headers: {},
        state: {},
    }, next);
    expect(next.mock.calls.length).toBe(1);
});

test('Should allow direct connections to /metrics', () => {
    const next = jest.fn();
    const vals = {};
    prometheus.middleware({
        headers: {},
        state: {},
        path: "/metrics",
        set: (key, value) => {
           vals[key] = value;
        }
    }, next);
    expect(next.mock.calls.length).toBe(1);
    expect(Object.keys(vals).includes('Content-Type'));
    expect(vals['Content-Type']).toBeDefined();
});

test('Should deny direct connections to /metrics with x-forwarded-header', () => {
    const next = jest.fn();
    expect(prometheus.middleware({
        state: {},
        headers: {
            "x-forwarded-for": "192.168.0.1",
        },
        path: "/metrics",
        throw: (code, message) => {
            throw new Error(message)
        },
    }, next)).rejects.toBeInstanceOf(Error);
});