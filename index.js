import 'dotenv/config';
import mysql from 'mysql2/promise';

const queryXYAsConvertedByMySql2Driver = async conn => {
    const sql = "SELECT pos, st_x(pos) as x, st_y(pos) as y, st_srid(pos) as srid, ST_GeomFromWKB(ST_AsWKB(pos)) as pos2 FROM testpoint where st_srid(pos) = 4326";
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

    const results = await queryXYAsConvertedByMySql2Driver(conn);

    console.log("AS READ DIRECTLY BY node-mysql2:")
    console.table(results.map(r => r.pos));

    console.log("AS ST_X, ST_Y functions:")
    console.table(results.map(r => ({x: r.x, y: r.y, srid: r.srid})));

    console.log("AS wkb->geom:")
    console.table(results.map(r => r.pos2));

    if (process.env.MYSQL_VERSION === '8') {
        console.log('NOTE: st_latitude() and st_longitude() version omitted because some records contain Point with SRID 0, i.e., not 4326.');
    } else {
        console.log('NOTE: st_latitude() and st_longitude() version omitted because these functions do not exist in v5.');
    }

    await conn.end();
}

main();