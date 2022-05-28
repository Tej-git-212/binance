async function main() {
  const chartDataRaw = await getInitialData(0.3);
  this.chartData = chartDataRaw.map(item => this.transformDataBinance(item));

  // Create chart
  chart = Highcharts.stockChart('container', {
    rangeSelector: {
      buttons: [ // top left buttons for chart zoom range
      {
        count: 1,
        type: 'minute',
        text: '1m'
      },{
          count: 3,
          type: 'minute',
          text: '3m'
        },{
          count: 5,
          type: 'minute',
          text: '5m'
        }, {
          count: 15,
          type: 'minute',
          text: '15m'
        }, {
          type: 'all',
          text: 'All'
        }
        // ,{
        //   "assetFullName": "USD coin",
        //   "assetName": "USDC",
        //   text: 'USD'
        // },{
        //   "assetFullName": "BNB coin",
        //   "assetName": "BNB",
        //   text: 'BNB'
        //   },{
        //     "assetFullName": "Tether",
        //   "assetName": "USDT",
        //   text: 'USDT'
        //   }, {
        //     "assetFullName": "etherum",
        //   "assetName": "ETH",
        //   text: 'ETH'
        //   }, {
        //     "assetFullName": "Bitcoin",
        //   "assetName": "BTC",
        //   text: 'BTC'
        //   }
      ],
      selected: 0
    },

    title: {
      text: 'Bitcoin price'
    },

    series: [{
      type: 'candlestick',
      name: 'Bitcoin price',
      data: this.chartData
    }],

    chart: {
      events: {
        // Set up chart updates
        load: () => {
          if (typeof (worker) === 'undefined') {
            worker = new Worker('WebSocketWebWorker.js');
          }

          let candle;

          // Add a new candle every minute
          setInterval(() => {
            const series = chart.series[0];
            const now = new Date();

            if (now.getSeconds() === 0 && candle) {
              now.setSeconds(0, 0);
              candle[0] = now.getTime();
              series.addPoint(candle, true, false);
            }
          }, 1000);

          worker.onmessage = event => {
            candle = this.transformDataKraken(event.data);
          }
        }
      }
    },

    time: {
      useUTC: false
    }
  });
}

// Transform Kraken to D3 data format
function transformDataKraken(item) {
  return [
    parseFloat(item[0]) * 1000, // Timestamp
    parseFloat(item[2]), // Open
    parseFloat(item[3]), // High
    parseFloat(item[4]), // Low
    parseFloat(item[5]), // Close
  ];
}

// Transform Binance to D3 data format
function transformDataBinance(item) {
  return [
    parseFloat(item[0]), // Timestamp
    parseFloat(item[1]), // Open
    parseFloat(item[2]), // High
    parseFloat(item[3]), // Low
    parseFloat(item[4]), // Close
  ];
}

// Fetch price history
async function getInitialData(numberOfDays) {
  const now = new Date().getTime();
  const offset = (24 * 60 * 60 * 1000) * numberOfDays;
  const start = new Date().setTime(now - offset);

  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.append('symbol', 'BTCEUR');
  url.searchParams.append('interval', '1m');
  url.searchParams.append('startTime', start);
  url.searchParams.append('endTime', now);
  // url.searchParams.append('limit', 1000);

  const response = await fetch(url.href)
  return await response.json();
}

window.onbeforeunload = () => {
  worker.postMessage({ status: 'closing' });
}

let chart;
main();

// [
//   {
//       "assetFullName": "USD coin",
//       "assetName": "USDC",
//       "isBorrowable": true,
//       "isMortgageable": true,
//       "userMinBorrow": "0.00000000",
//       "userMinRepay": "0.00000000"
//   },
//   {
//       "assetFullName": "BNB-coin",
//       "assetName": "BNB",
//       "isBorrowable": true,
//       "isMortgageable": true,
//       "userMinBorrow": "1.00000000",
//       "userMinRepay": "0.00000000"
//   },
//   {
//       "assetFullName": "Tether",
//       "assetName": "USDT",
//       "isBorrowable": true,
//       "isMortgageable": true,
//       "userMinBorrow": "1.00000000",
//       "userMinRepay": "0.00000000"
//   },
//   {
//       "assetFullName": "etherum",
//       "assetName": "ETH",
//       "isBorrowable": true,
//       "isMortgageable": true,
//       "userMinBorrow": "0.00000000",
//       "userMinRepay": "0.00000000"
//   },
//   {
//       "assetFullName": "Bitcoin",
//       "assetName": "BTC",
//       "isBorrowable": true,
//       "isMortgageable": true,
//       "userMinBorrow": "0.00000000",
//       "userMinRepay": "0.00000000"
//   }
// ]
