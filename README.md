# Cube

**Cube** is a system for collecting timestamped events and deriving metrics. By collecting events rather than metrics, Cube lets you compute aggregate statistics *post hoc*. It also enables richer analysis, such as quantiles and histograms of arbitrary event sets. Cube is built on [MongoDB](http://www.mongodb.org) and available under the [Apache License](/square/cube/blob/master/LICENSE).

Want to learn more? [See the wiki.](https://github.com/square/cube/wiki)

## Development
- Start server
node bin/collector.js
node bin/evaluator.js

- http://localhost:1081/index.html
- http://localhost:1081/random/index.html
- http://localhost:1081/collectd/index.html

## Test
- node test/collector-test.js

