# README

This is a complementary script intended to provide jdbc driver's perspective [on this problem]([https://github.com/justbhoot/poc-node-mysql2-bug-srid-4326-mysql8](https://github.com/sidorares/node-mysql2/issues/2959)) titled *[Bug?] node-mysql2 seems to swap x and y values of a geographic Point (SRID 4326) stored in mysql8 #2959*.

## How-to

1. Install [scala 3.5.0](https://docs.scala-lang.org/getting-started/index.html) or above. Prior versions do not support running a script with inline dependencies.

2. Run the script with the required env vars:

```
$ MYSQL_USERNAME="user" MYSQL_PASSWORD="password" MYSQL_PORT=3306 MYSQL_SCHEMA=test_lat_long scala run main.scala

Incorrect: when the stored order (long,lat) is read mistakenly into (x,y):
x = 117.346173, y = -33.310932
x = 120.000000, y = -40.000000
x = -140.000000, y = -90.000000

Correct: when the stored order (long,lat) is read correctly into (y,x):
x = -33.310932, y = 117.346173
x = -40.000000, y = 120.000000
x = -90.000000, y = -140.000000

Done
```

## Credits

Code adapted and improved from:

- JDBC connection: https://www.oreilly.com/library/view/scala-cookbook/9781449340292/ch16s02.html
- Parsing of Point: https://stackoverflow.com/a/51820739/663911
