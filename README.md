# cql-load-test
Rudimentary script to test load difference between various Cassandra/Scylla clusters.

Requires a `config.json` file in the root that looks like this:

```json
{
  "sample_data_rows": 1000,
  "test_requests": 1000,
  "request_concurrency": 100,
  "tests": [{
    "name": "Test utilizing address map (e.g., Scylla on Compose)",
    "conn": {
      "dc": "us-east1",
      "keyspace": "<KEYSPACE>",
      "user": "scylla",
      "pass": "<PASSWORD>",
      "addressMap": {
        "1.2.3.5:9042": "some.host.4:1234",
        "1.2.3.6:9042": "some.host.2:1235",
        "1.2.3.7:9042": "some.host.3:1236"
      }
    }
  }, {
    "name": "Test utilizing basic contact points (e.g., Scylla Cloud)",
    "conn": {
      "dc": "AWS_US_EAST_1",
      "keyspace": "<KEYSPACE>",
      "user": "scylla",
      "pass": "<PASSWORD>",
      "contactPoints": ["1.2.3.4","1.2.3.5","1.2.3.6"]
    }
  }]
}
```
