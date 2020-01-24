
const cassandra = require('cassandra-driver');
const compose = require('./compose-translator.js');

class ScyllaClient {

  constructor(conn) {

    const options = {
      keyspace: conn.keyspace,
      localDataCenter: conn.dc
    };

    try {
      if (conn.addressMap) {
        const translator = new compose.ComposeAddressTranslator();
        translator.setMap(conn.addressMap);

        options.contactPoints = translator.getContactPoints();
        options.policies = {
          addressResolution: translator,
          loadBalancing : new cassandra.policies.loadBalancing.DCAwareRoundRobinPolicy(conn.dc)
        };
      } else {
        options.contactPoints = conn.contactPoints;
      }

    } catch(e) {
      console.error('Could not parse cassandra hosts for address translator.');
    }

    // Authenticate, if provided
    if (conn.user && conn.pass) {
      options.authProvider = new cassandra.auth.PlainTextAuthProvider(conn.user, conn.pass)
    }

    cassandra.Client.prototype.getOne = async function() {
      const rst = await this.execute.apply(this, arguments);

      if (rst && Array.isArray(rst.rows) && rst.rows.length === 1) {
        return rst.rows[0];
      } else {
        return null;
      }
    };

    this.client = new cassandra.Client(options);

    this.client.on('log', function(level, className, message, furtherInfo) {
      if (level === 'warning') {
        console.log('[scylladb] ' + message);
      } else if (level === 'error') {
        console.error('[scylladb] ' + message);
      }
    });
  }

}

module.exports = ScyllaClient;
