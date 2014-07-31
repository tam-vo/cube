function isNOE(value) {
  return value === null || value === '';
}

function chronological(a, b) {
  return a.time - b.time;
}

function currencyPairCode(currency) {
  if (currency.length == 3)
    return "BTC" + currency;
  return currency;
}

// Query for metrics.
exports.getter = function(db) {
  var event = require("./event").getter(db),
      metric = require("./metric").getter(db);

  function getter(request, callback) {
    var data = {};
    var openCallbackCount = 0;
    var closeCallbackCount = 0;

    var start = new Date(request.start),
        stop = new Date(request.stop),
        id = request.id;

    // Validate the dates.
    if (isNaN(start)) return callback({error: "invalid start"}), -1;
    if (isNaN(stop)) return callback({error: "invalid stop"}), -1;
    if (isNOE(request.currency)) return callback({error: "invalid currency"}), -1;

    function highLowMetricData(currency, dimension, step, start, stop, preCallback) {
      var metrics = {
        "high": "max(marketdata_bidask_" + currency + "(bid)",
        "low": "min(marketdata_bidask_" + currency + "(ask)"
      }
      var requestMetricParams = {
        "expression": metrics[dimension] + ".eq(currency_pair,'" + currencyPairCode(currency) + "'))",
        "limit": 50,
        "start": start,
        "stop": stop,
        "step": step
      }
      console.log(requestMetricParams);
      function callbackHighLowMetric(d) {
        var time = d["time"].getTime()/1000;
        console.log(time + " " + d["value"])
        if (!data[time]) data[time] = {}
        data[time][dimension] = (d["value"] || 0)
        // if (d.time >= stop) {
        // // data.sort(chronological);
        // } else {
        // }
      }

      // openCallbackCount++;
      // metric(requestMetricParams, callbackHighLowMetric, function() {
      // closeCallbackCount++;
      // console.log(openCallbackCount + " " + closeCallbackCount);
      // if (openCallbackCount == closeCallbackCount) preCallback();
      // });
    }

    function openCloseMetricData(currency, dimension, step, start, stop, preCallback) {
      var metrics = {
        "open": "min",
        "close": "max"
      }
      var requestMetricParams = {
        "expression": metrics[dimension] + "(marketdata_bidask_" + currency + "(time).eq(currency_pair,'" + currencyPairCode(currency) + "'))",
        "limit": 50,
        "start": start,
        "stop": stop,
        "step": step
      }
      function callbackOpenCloseMetric(d) {
        var time = d["time"].getTime()/1000;
        if (!data[time]) data[time] = {}
        if (d["value"])
          eventByTime(currency, time, dimension, d["value"], callback)
        else
          data[time][dimension] = 0
        // if (d.time >= stop) {
        // } else {
        // }
      }

      openCallbackCount++;
      metric(requestMetricParams, callbackOpenCloseMetric, function() {
        closeCallbackCount++;
        console.log(openCallbackCount + " " + closeCallbackCount);
        if (openCallbackCount == closeCallbackCount) preCallback(data);
      });
    }

    function eventByTime(currency, dataTimeKey, dimension, time, callback) {
      var requestEventParams = {
        "expression": "marketdata_bidask_" + currency + "(bid,ask).eq(time,"+ time + ").eq(currency_pair,'" + currencyPairCode(currency) + "')",
        "limit": 1
      }
      function callbackEventMetric(d) {
        if (d == null) {
          console.log("null")
        } else {
          data[dataTimeKey][dimension] = d["data"]["bid"];
        }

        closeCallbackCount++;
        console.log(openCallbackCount + " " + closeCallbackCount);
        if (openCallbackCount == closeCallbackCount) callback(data);
      }
      openCallbackCount++;
      event(request, callbackEventMetric);
    }

    function preCallback() {
      console.log("--preCallback");
      var time = null;
      var lastTime = null;
      for (time in data) {
        var hashTimeFrame = data[time];
        if (lastTime != null) {
          hashTimeFrame["open"] = data[lastTime]["close"];
          if (hashTimeFrame["close"] == 0) hashTimeFrame["close"] = hashTimeFrame["open"];
          if (hashTimeFrame["high"] == 0) hashTimeFrame["high"] = hashTimeFrame["open"];
          if (hashTimeFrame["low"] == 0) hashTimeFrame["low"] = hashTimeFrame["open"];
        }
        lastTime = time;
      }
      console.log(data);
      callback(data);
    }
    highLowMetricData(request.currency, "high", request.step, start, stop, preCallback);
    highLowMetricData(request.currency, "low", request.step, start, stop, preCallback);
    openCloseMetricData(request.currency, "close", request.step, start, stop, preCallback);
    return 1;
  }

  return getter;
};

