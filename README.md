# koa-prometheus-exporter


##Installation

Requires koa to run

Using npm

```
npm install @echo-health/koa-prometheus-exporter
```

Using yarn

```
yarn add @echo-health/koa-prometheus-exporter
```

To use the prometheus middlware the module exports a async middleware function called `middleware`

e.g.

```
const Koa = require('koa');
const prometheus = require('koa-prometheus-exporter');
const app = new Koa();

// middleware is a function that returns the middleware async 
// function, this is so you can pass configuration settings into
// the middleware.
app.use(prometheus.middleware({}));
```

Options can be passed into the middlware.

```
Name: path
Type: String
Desciption: overrides the path the middleware listens on.
e.g. "/overriden_path_to_export_metrics_on

Name: headerBlacklist: 
Type: Array
Description: will block any access to the metrics path if the
request has a header in this list
e.g. ["x-forwarded-for"]
```

This intercepts the path /metrics and will export the default [prom-client](https://github.com/siimon/prom-client) metrics for nodejs, plus the additional gc stats via [node-prometheus-gc-stats](https://github.com/SimenB/node-prometheus-gc-stats)

if you want to add additional metrics you can access the client in two ways.

```const client = require('koa-prometheus-exporter').client;```

Is a reference to the underlining prom-client module.

the same client is also exposed via the ctx objet pased through the middleware chain. So will be available to any middleware included after the prometheus.middleware is included.

```
const Koa = require('koa');
const prometheus = require('koa-prometheus-exporter');
const app = new Koa();

app.use(prometheus.middleware());
app.use(async (ctx, next) => {
	const counter = ctx.state.prometheus.Counter('counter', 'counter');
	counter.inc();
})
```

##Tracking HTTP Metrics

If you would like to track HTTP metrics you can add an additional piece of middleware via.

```
const Koa = require('koa');
const prometheus = require('koa-prometheus-exporter');
const httpMetrics = prometheus.httpMetricMiddleware;
const app = new Koa();

// this has to be before any other middleware if you want accurate timing of request duration.
app.use(httpMetrics);
app.use(prometheus.middleware());
```

This exposes four metrics: 

     - name: http_request_duration_microseconds
       type: Summary
     - name: http_request_size_bytes
       type: Summary
     - name: http_response_size_bytes
       type: Summary
     - name: http_requests_total
       type: Counter

These mirror the same HTTP metrics exported by the prometheus server itself.