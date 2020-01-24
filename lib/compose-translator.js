
const util = require('util');
const cassandra = require('cassandra-driver');

function ComposeAddressTranslator() {}

util.inherits(ComposeAddressTranslator, cassandra.policies.addressResolution.AddressTranslator);

ComposeAddressTranslator.prototype.translate = function(address, port, callback) {
    origAddress = address + ":" + port;
    // newAddress = ComposeAddressTranslator.address_map[origAddress] || origAddress;
    newAddress = ComposeAddressTranslator.address_map.get(origAddress) || origAddress;
    callback(newAddress);
};


ComposeAddressTranslator.prototype.setMap = function (addresses) {
  ComposeAddressTranslator.address_map = new Map();

  if(Array.isArray(addresses)) {
    for (address of addresses) {
      var key=Object.keys(address)[0];
      ComposeAddressTranslator.address_map.set(key,address[key]);
    }
    return;
  }

  Object.keys(addresses).forEach(key => {
      ComposeAddressTranslator.address_map.set(key, addresses[key]);
  });
};

ComposeAddressTranslator.prototype.getMap = function () {
  return ComposeAddressTranslator.address_map;
};

ComposeAddressTranslator.prototype.getContactPoints = function () {
  return Array.from(ComposeAddressTranslator.address_map.values());
};

module.exports.ComposeAddressTranslator=ComposeAddressTranslator;
