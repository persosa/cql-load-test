
const uuidv1 = require('uuid/v1');
const { jStat } = require('jstat');
const ora = require('ora');

const N_TESTS = 100;

const N_ROWS = 1000;

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

  const times = [];

  let hrstart, hrend;

  _spinner = ora(`Running test: ${ testName }`).start();

  i = 0;
  while (i < N_TESTS) {
    // Get random client ID from the array
    clientId = samples[Math.floor(Math.random() * samples.length)];

    hrstart = process.hrtime();
    await client.getOne('SELECT * FROM test where client = ?', [clientId]);
    hrend = process.hrtime(hrstart);

    // First one is always slowest
    if (i > 0) {
      times.push((hrend[0] * 1000) + (hrend[1] / 1000000));
    }

    i++;
  }
  _spinner.stop();

  // console.log(times);

  console.log(`
======================================================
 ${ testName }
======================================================
Mean: ${ jStat.mean(times) }ms
Slowest: ${ jStat.max(times) }ms
Fastest: ${ jStat.min(times) }ms
  `)
}
