## Problem

node-mysql2 seems to swap x and y values of a geographic Point stored in mysql8 when it is retrieved through node-mysql2 without special parsing. 

## Repository that demonstrates the bug

https://github.com/justbhoot/poc-node-mysql2-bug-srid-4326-mysql8

## How to reproduce

1. Ensure that a MySQL8 instance is running.
2. Clone the above mentioned repository.
3. Ensure that a schema as described in `db.sql` exists.
4. Set up a `.env` file according to the `.env.template`.
5. `npm ci`
6. Run the index.js script `MYSQL_VERSION=8 node index.js`.

The last step above – script execution – should produce the following output:

```
$ MYSQL_VERSION=8 node index.js
Testing with MySQL v8...

AS INTERPRETED BY MYSQL8's ST_X, ST_Y functions:
┌─────────┬─────────────┬────────────────────┬──────────────┐
│ (index) │  st_x(pos)  │     st_y(pos)      │ st_srid(pos) │
├─────────┼─────────────┼────────────────────┼──────────────┤
│    0    │ -33.3109317 │ 117.34617329999999 │     4326     │
│    1    │ -35.3109317 │    101.3461733     │      0       │
└─────────┴─────────────┴────────────────────┴──────────────┘

AS INTERPRETED BY node-mysql2:
┌─────────┬─────────────┬─────────────┐
│ (index) │      x      │      y      │
├─────────┼─────────────┼─────────────┤
│    0    │ 117.3461733 │ -33.3109317 │
│    1    │ -35.3109317 │ 101.3461733 │
└─────────┴─────────────┴─────────────┘
```

## Expected result

For all the rows:

- `x` column in the second table should show the value in `st_x` column of first table.
- `y` column in the second table should show the value in `st_y` column of first table.

To demonstrate the same from MySQL CLI Shell:

```
mysql> select st_astext(pos), st_x(pos), st_latitude(pos) from testpoint where st_srid(pos) = 4326;

+--------------------------------+-------------+------------------+
| st_astext(pos)                 | st_x(pos)   | st_latitude(pos) |
+--------------------------------+-------------+------------------+
| POINT(-33.3109317 117.3461733) | -33.3109317 |      -33.3109317 |
+--------------------------------+-------------+------------------+
1 row in set (0.00 sec)

```

In the above query result, `st_x()` and `st_latitude()` point to the first value in the Point, which is in accordance with how SRID 4326 is defined in MySQL.

## Actual result

For the first row 0 (containing data for SRID 4326):

- `x` column in the second table shows the value in `st_y` column of first table.
- `y` column in the second table shows the value in `st_x` column of first table.

In other words, node-msyql2 apparently swaps the values for x and y in a retrieved geographic point.

```
AS INTERPRETED BY MYSQL8's ST_X, ST_Y functions:
┌─────────┬─────────────┬────────────────────┬──────────────┐
│ (index) │  st_x(pos)  │     st_y(pos)      │ st_srid(pos) │
├─────────┼─────────────┼────────────────────┼──────────────┤
│    0    │ -33.3109317 │ 117.34617329999999 │     4326     │ <---- correct: x is lat, y is long
└─────────┴─────────────┴────────────────────┴──────────────┘

AS INTERPRETED BY node-mysql2:
┌─────────┬─────────────┬─────────────┐
│ (index) │      x      │      y      │
├─────────┼─────────────┼─────────────┤
│    0    │ 117.3461733 │ -33.3109317 │ <---- incorrect: x is long, y is lat
└─────────┴─────────────┴─────────────┘
```

## Relevant observations

node-mysql2 behaves as expected, i.e., no swapped x and y, for a point with SRID 0.

node-mysql2 also behaves correctly for *both* SRIDs in *mysql5* (probably because mysql5 ignores SRID anyway).
