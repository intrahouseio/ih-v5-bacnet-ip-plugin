const Bacnet = require('node-bacnet');
const util = require('util');
const bacnetClient = new Bacnet({apduTimeout: 6000});


bacnetClient.on('iAm', (msg) => {
   console.log("msg" + util.inspect(msg)) 
  console.log(
    'address: ', msg.header.sender.address,
    ' - deviceId: ', msg.payload.deviceId,
    ' - maxApdu: ', msg.payload.maxApdu,
    ' - segmentation: ', msg.payload.segmentation,
    ' - vendorId: ', msg.payload.vendorId
  );
});
bacnetClient.whoIs();
const requestArray = [
    {objectId: {type: 8, instance: 4194303}, properties: [{id: Bacnet.enum.PropertyIds.PROP_ALL}]}
  ];
  bacnetClient.readPropertyMultiple('192.168.1.121', requestArray, Bacnet.enum.PropertyIdentifier.OBJECT_NAME, (err, value) => {
   // value.values[0].values.forEach(item => {
        console.log('value: ', JSON.stringify(value, null, 2));
   // })
    
  });
  
 // emitted on errors

 /*const requestArray = [
   {objectId: {type: 8, instance: 4194303}, properties: [{id: 8}]}
 ];
 bacnetClient.readPropertyMultiple('192.168.1.121', requestArray, (err, value) => {
   console.log('value: ', util.inspect(value.values[0].values));
 });

 client.readProperty('192.168.1.121', {type: 8, instance: 44301}, 28, (err, value) => {
    console.log('value: ', value);
  });
*/
 /*
bacnetClient.on('error', (err) => {
    console.error(err);
    bacnetClient.close();
  });
  
  // emmitted when Bacnet server listens for incoming UDP packages
  bacnetClient.on('listening', () => {
    console.log('discovering devices for 30 seconds ...');
    // discover devices once we are listening
    bacnetClient.whoIs();
  
    setTimeout(() => {
      bacnetClient.close();
      console.log('closed transport ' + Date.now());
    }, 30000);
  
  });
  
  const knownDevices = [];
  
  // emitted when a new device is discovered in the network
  bacnetClient.on('iAm', (device) => {
    // address object of discovered device,
    // just use in subsequent calls that are directed to this device
    const address = device.header.sender.address;
  
    //discovered device ID
    const deviceId = device.payload.deviceId;
    if (knownDevices.includes(deviceId)) return;
  const requestArray = [
    {objectId: {type: 8, instance: 4194303}, properties: [{id: 8}]}
  ];
    bacnetClient.readProperty(address, {type: 8, instance: deviceId}, Bacnet.enum.PropertyIdentifier.OBJECT_NAME, (err, value) => {
      if (err) {
        console.log('Found Device ' + deviceId + ' on ' + JSON.stringify(address));
        console.log(err);
      } else {
        bacnetClient.readProperty(address, {type: 8, instance: deviceId}, Bacnet.enum.PropertyIdentifier.OBJECT_NAME, (err2, valueVendor) => {
  
          if (value && value.values && value.values[0].value) {
            console.log('Found Device ' + deviceId + ' on ' + JSON.stringify(address) + ': ' + value.values[0].value);
          } else {
            console.log('Found Device ' + deviceId + ' on ' + JSON.stringify(address));
            console.log('value: ', JSON.stringify(value));
          }
          if (!err2 && valueVendor && valueVendor.values && valueVendor.values[0].value) {
            console.log('Vendor: ' + valueVendor.values[0].value);
          }
          console.log();
        });
      }
    });
    knownDevices.push(deviceId);
  });
  */