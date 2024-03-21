/**
 * app.js
 *
 */

const util = require("util");

const Bacnet = require('node-bacnet');

const Scanner = require("./lib/scanner");
const client = require("client");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async function (plugin) {
  const bacnetClient = new Bacnet({
    port: plugin.params.data.port || 47808,                          
    broadcastAddress: plugin.params.data.broadcastAddress  || '255.255.255.255',
    apduTimeout: plugin.params.data.apduTimeout
  });
  client.init(bacnetClient);
  const scanner = new Scanner(plugin);
  const channelsValue = {};
  //plugin.onCommnad(async data => parseCommand(data))
  plugin.onAct(data => {
    //console.log('Write recieve', message);
    plugin.log('ACT data=' + util.inspect(data));
    write(data);
  });
  plugin.channels.onChange(async function (data) {
    plugin.log('Change' + util.inspect(data));
    for (i =0; i<data.length; i++) {
      if (data[i].op == 'delete') {
        let result = await client.unsubscribe(data[i].address, JSON.parse(data[i].chan).objectId);
        plugin.log('UnsubscribeCOV' + result, 2);
        delete channelsValue[data[i].chan];
        await sleep(200);
      }
      if (data[i].op == 'add') {
        let result = await client.subscribe(data[i].address, JSON.parse(data[i].chan).objectId);
        plugin.log('SubscribeCOV' + result, 2);
        channelsValue[data[i].id] = null;
        await sleep(200);
      }    
    }
  });

  bacnetClient.on('error', (err) => {
    console.error(err);
    bacnetClient.close();
  });

  async function monitor(channels) {
      for (i =0; i<channels.length; i++) {
        if (channels[i].r) {
        result = await client.subscribe(channels[i].address, JSON.parse(channels[i].chan).objectId);
        plugin.log('SubscribeCOV' + result, 2);
        await sleep(200);
        }    
      }

      bacnetClient.on('covNotifyUnconfirmed', async (data) => {
        //plugin.log('Received COV: ' + JSON.stringify(data, null, 2));
        let id = {};
        id.objectId = data.payload.monitoredObjectId; 
        id.address = data.header.sender.address;

        if (channelsValue[JSON.stringify(id)] === undefined) {
          let result = await client.unsubscribe(id.address, id.objectId);
          plugin.log('UnsubscribeCOV' + result, 2);
        }
        if (channelsValue[JSON.stringify(id)] != data.payload.values[0].value[0].value) {
          channelsValue[JSON.stringify(id)] = data.payload.values[0].value[0].value;
          plugin.sendData([{ id: JSON.stringify(id), value: data.payload.values[0].value[0].value}]);
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
  async function main(channels) {  
    for (i =0; i<channels.length; i++) {
      if (channels[i].r) {
      const value =  await client.readProperty(channels[i].address, JSON.parse(channels[i].chan).objectId);
      channelsValue[channels[i].id] = value.values[0].value;
      await sleep(100);
      }    
    }
    const arr = Object.keys(channelsValue).map(i => ({id:i, value:channelsValue[i]}));
    plugin.sendData(arr);
    monitor(channels);
  }

  main(plugin.channels.data);

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
