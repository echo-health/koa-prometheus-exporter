# koa-prometheus-exporter


##Installation

Requires koa to run

```
$ npm install koa-prometheus-exporter
```

To use the prometheus middlware the module exports a async middleware function called `middleware`

e.g.

```
const Koa = require('koa');
const prometheus = require('koa-prometheus-exporter');
const app = new Koa();

//middleware is a function that returns the middleware async function, this is so you can pass configuration settings into the middleware.
app.use(prometheus.middleware({}));
```

Options can be passed into the middlware. 

```
Name: path
Type: String
Desciption: overrides the path the middleware listens on.
e.g. "/overriden_path_to_export_metrics_on
```
	
```
Name: headerBlacklist: 
Type: Array
Description: will block any access to the metrics path if the request has a header in this list
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
   // bear in mind you need to gaurd against making a metric with the same name in the same registry, this will error upon a refresh.
	const counter = ctx.state.prometheus.Counter('counter', 'counter');
	counter.inc();
})
```


