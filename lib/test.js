
const uuidv1 = require('uuid/v1');
const { jStat } = require('jstat');
const ora = require('ora');
const fs = require('fs');
const Config = require('../config');

// Number of requests to make per test
const N_REQUESTS = Config.test_requests;

// Number of rows of fake data to create
const N_ROWS = Config.sample_data_rows;

// Number of concurrent requests to make at a time
const REQ_CON = Config.request_concurrency;

exports.run = async (testName, client) => {

  let _spinner, i = 0, clientId;
  const samples = [];

  ////////////////////////////////////////////////////////
  // Load sample data
  ////////////////////////////////////////////////////////

  _spinner = ora(`Loading test data`).start();

  await client.execute('truncate test');

  const promises = [];

  for (i=0;i<N_ROWS;i++) {
    clientId = uuidv1();

    samples.push(clientId);
    promises.push(
      client.execute('INSERT INTO test (client, identity) VALUES (?,?)', [ clientId, uuidv1() ])
    )
  }

  await Promise.all(promises);
  _spinner.stop();

  ////////////////////////////////////////////////////////
  // Run test
  ////////////////////////////////////////////////////////

  _spinner = ora(`Running test: ${ testName }`).start();

  const times = [];

  async function makeRequest() {
    // Get random client ID from the array
    const clientId = samples[Math.floor(Math.random() * samples.length)];

    const hrstart = process.hrtime();
    await client.getOne('SELECT * FROM test where client = ?', [clientId]);
    const hrend = process.hrtime(hrstart);

    // First one is always slowest
    if (i > 0) {
      times.push((hrend[0] * 1000) + (hrend[1] / 1000000));
    }
  }

  let requests = [];
  for (i = 0; i < N_REQUESTS; i++) {
    requests.push( makeRequest() );

    if (requests.length === REQ_CON) {
      await Promise.all(requests);
      requests = [];
    }
  }
  await Promise.all(requests);

  ////////////////////////////////////////////////////////
  // Write Results
  ////////////////////////////////////////////////////////

  await new Promise((resolve) => {
    let writeStream = fs.createWriteStream(`result-${ testName }.txt`);
    times.map(t => writeStream.write(t + '\n'));
    writeStream.on('finish', resolve);
    writeStream.end();
  });

  _spinner.stop();

  console.log(`
======================================================
 ${ testName }
======================================================
Requests: ${ i }
Mean: ${ parseFloat(jStat.mean(times)).toFixed(2) }ms
Slowest: ${ parseFloat(jStat.max(times)).toFixed(2) }ms
Fastest: ${ parseFloat(jStat.min(times)).toFixed(2) }ms
99th Percentile: ${ parseFloat(jStat.percentile(times, 0.99)).toFixed(2) }ms
  `)
}
