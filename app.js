/**
 * app.js
 *
 */

const util = require("util");

const Bacnet = require('node-bacnet');

const Scanner = require("./lib/scanner");
const client = require("client");

module.exports = async function (plugin) {
  const bacnetClient = new Bacnet({apduTimeout: plugin.params.data.apduTimeout});
  client.init(bacnetClient);
  const scanner = new Scanner(plugin);
  const channelsValue = {};
  //plugin.onCommnad(async data => parseCommand(data))
  plugin.onAct(data => {
    //console.log('Write recieve', message);
    plugin.log('ACT data=' + util.inspect(data));
    write(data);
  });
  plugin.channels.onChange(async function () {
    const channels = await plugin.channels.get();
    monitor(channels);
  });

  bacnetClient.on('error', (err) => {
    console.error(err);
    bacnetClient.close();
  });

  async function monitor(channels) {
      for (i =0; i<channels.length; i++) {
        if (channels[i].r) {
          let result = await client.unsubscribe(channels[i].address, JSON.parse(channels[i].chan));
        plugin.log('UnsubscribeCOV' + result, 2);
        result = await client.subscribe(channels[i].address, JSON.parse(channels[i].chan));
        plugin.log('SubscribeCOV' + result, 2);
        }    
      }
      
      bacnetClient.on('covNotifyUnconfirmed', (data) => {
        //plugin.log('Received COV: ' + JSON.stringify(data, null, 2));
        if (channelsValue[JSON.stringify(data.payload.monitoredObjectId)] != data.payload.values[0].value[0].value) {
          channelsValue[JSON.stringify(data.payload.monitoredObjectId)] = data.payload.values[0].value[0].value;
          plugin.sendData([{ id: JSON.stringify(data.payload.monitoredObjectId), value: data.payload.values[0].value[0].value}]);
        } 
      });
  }

  async function write(message) {
    try {
      for (i=0; i<message.data.length; i++) {
        await client.write(message.data[i]);
      }
      
    } catch (e) {
    plugin.log('Write ERROR: ' + util.inspect(e));
    }
  }
  function main() {
    monitor(plugin.channels.data);
  }

  main();

  // --- События плагина ---
  // Сканирование
  plugin.onScan((scanObj) => {
    if (!scanObj) return;
    if (scanObj.stop) {
      //
    } else {
      plugin.log("Запуск сканирования")
      scanner.request(bacnetClient, scanObj.uuid);
    }
  });

  process.on("SIGTERM", () => {
    plugin.exit();
  });
};

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
