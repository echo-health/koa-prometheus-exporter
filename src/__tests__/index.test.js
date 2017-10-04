const prometheus = require('../index');

test("Should block any request that isn't a GET", async () => {
    expect.assertions(1);
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
            null
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
