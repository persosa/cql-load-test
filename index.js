
const ScyllaClient = require('./lib/scylla');
const Test = require('./lib/test.js');
const Config = require('./config');


(async () => {

  for (const test of Config.tests) {
    const scyllaConn = new ScyllaClient(test.conn);
    await Test.run(test.name, scyllaConn.client);
  }

  process.exit(0);

})()
