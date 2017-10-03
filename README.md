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

app.use(prometheus.middleware);
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

app.use(prometheus.middleware);
app.use(async (ctx, next) => {
	const counter = ctx.state.prometheus.Counter('counter', 'counter');
	counter.inc();
})
```


