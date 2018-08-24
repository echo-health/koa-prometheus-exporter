# koa-prometheus-exporter


##Installation

Requires koa to run

Using npm

```
npm install @echo-health/koa-prometheus-exporter
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

Options can be passed into the middleware.

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
const app = new Koa();

// this has to be before any other middleware if you want accurate timing of request duration.
app.use(prometheus.httpMetricMiddleware());
app.use(prometheus.middleware());
```
###Options can be passed into the middleware
```
Name: httpTimingDisable
Type: Boolean
Desciption: turns off tracking HTTP timing information, histograms are expensive and can produce a lot of data.
e.g. true
```
```
Name: pathTransform
Type: function
Desciption: Can transform the path before it's set as the URI label. This is important if you're submitting unbounded metrics like rest API's with id's in the path. You need to strip this out to make sure you don't make a very large amount of unique metrics.
e.g.
function(path) {
	if (path && path.includes("/")) {
		return `/${path.split("/")[1]}`;
	}
	return p;
}
```
```
Name: httpTimingBuckets: 
Type: Array
Description: Override the histogram buckets used to track quantiles, this is so you can specify your own bucket configuration. 
Defaault: array produced by calling require('prom-client').exponentialBuckets(0.05, 1.3, 20)
e.g. [
  0.05,
  0.065,
  0.0845,
  0.10985000000000002,
  0.14280500000000002,
  0.18564650000000002,
  0.24134045000000004,
  0.3137425850000001,
  0.4078653605000001,
  0.5302249686500001,
  0.6892924592450002,
  0.8960801970185003,
  1.1649042561240504,
  1.5143755329612656,
  1.9686881928496454,
  2.559294650704539,
  3.327083045915901,
  4.325207959690672,
  5.622770347597873,
  7.309601451877235
]
```


This exposes four metrics: 

     - name: http_server_requests_seconds
       type: Histogram
     - name: http_request_size_bytes
       type: Summary
     - name: http_response_size_bytes
       type: Summary
     - name: http_requests_total
       type: Counter

These mirror the same HTTP metrics exported by the prometheus server itself.