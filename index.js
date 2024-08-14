import 'dotenv/config';
import mysql from 'mysql2/promise';

// create database if not exists test_lat_long;
// create table testpoint(pos point NOT NULL) ENGINE=InnoDB;
// insert into testpoint values (st_geomfromtext('POINT(-33.3109317 117.3461733)', 4326));
// -- Following INSERT FAILS in mysql8 because lat-long validation is enforced for SRID 4326.
// -- insert into testpoint values (st_geomfromtext('POINT(100 -33)', 4326));
// insert into testpoint values (st_geomfromtext('POINT(-35.3109317 101.3461733)', 0));
// insert into testpoint values (st_geomfromtext('POINT(101 -35)', 0));

const queryXYAsConvertedByMySql2Driver = async conn => {
    const sql = 'SELECT pos as pos_as_converted_by_mysql2 FROM testpoint';
    const [results, _fields] = await conn.execute(sql);
    return results;
}

const queryXYAsInterpretedByMySql = async conn => {
    const sql = 'SELECT st_x(pos), st_y(pos), st_srid(pos) FROM testpoint';
    const [results, _fields] = await conn.execute(sql);
    return results;
}

const queryLatLongAsInterpretedByMySql = async conn => {
    const sql = 'SELECT st_latitude(pos), st_longitude(pos) FROM testpoint';
    const [results, _fields] = await conn.execute(sql);
    return results;
}

const main = async () => {
    const conn = await mysql.createConnection(process.env.MYSQL_VERSION === '5' ? {
        host: process.env.MYSQL5_HOST,
        port: process.env.MYSQL5_PORT,
        database: process.env.MYSQL5_SCHEMA,
        user: process.env.MYSQL5_USER,
        password: process.env.MYSQL5_PASSWORD,
    } : {
        host: process.env.MYSQL8_HOST,
        port: process.env.MYSQL8_PORT,
        database: process.env.MYSQL8_SCHEMA,
        user: process.env.MYSQL8_USER,
        password: process.env.MYSQL8_PASSWORD,
    });

    console.log(`Testing with MySQL v${process.env.MYSQL_VERSION}...`, '\n');

    const xy = await queryXYAsInterpretedByMySql(conn);
    console.log(xy, '\n');

    const results = await queryXYAsConvertedByMySql2Driver(conn);
    console.log(results, '\n');

    if (process.env.MYSQL_VERSION === '8') {
        // const latLong = await queryLatLongAsInterpretedByMySql(conn);
        // console.log(latLong);
        console.log('NOTE: st_latitude() and st_longitude() version omitted because some records contain Point with SRID 0, i.e., not 4326.');
    } else {
        console.log('NOTE: st_latitude() and st_longitude() version omitted because these functions do not exist in v5.');
    }

    await conn.end();
}

main();