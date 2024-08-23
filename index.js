import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import mysqlx from '@mysql/xdevapi';
import mysql from 'mysql';
import util from 'util';

const get_node_mysql_conn = () => {
    const conn = mysql.createConnection(process.env.MYSQL_VERSION === '5' ? {
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
    return conn;
}

const get_node_mysql2_conn = async () => {
    const conn = await mysql2.createConnection(process.env.MYSQL_VERSION === '5' ? {
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
    return conn;
}

const point_as_parsed_by_node_mysql2_driver_parser = async () => {
    const conn = await get_node_mysql2_conn();
    const sql = 'SELECT pos FROM testpoint';
    const [results, _fields] = await conn.execute(sql);

    console.log("POINT AS PARSED BY node-mysql2's PACKET PARSER:")
    console.table(results.map(r => r.pos));

    await conn.end();
}

const point_as_parsed_by_node_mysql_driver_parser = async () => {
    const conn = await get_node_mysql_conn();
    conn.connect();
    const query = util.promisify(conn.query).bind(conn);
    const result = await query('SELECT pos FROM testpoint');
    console.log("POINT AS PARSED BY node-mysql's PACKET PARSER:")
    console.log("node-mysql faces the same problem as node-mysql2, probably because the latter re-uses the former's parser code.")
    console.table(result.map(r => r.pos));
    conn.end();
}

const point_as_parsed_by_st_x_st_y = async () => {
    const conn = await get_node_mysql2_conn();
    const sql = 'SELECT st_x(pos), st_y(pos), st_srid(pos) FROM testpoint';
    const [results, _fields] = await conn.execute(sql);

    console.log("POINT AS PARSED BY st_x(), st_y() FUNCTIONS OF MySQL:")
    console.table(results);

    await conn.end();
}

const point_as_parsed_by_st_latitude_st_longitude = async () => {
    console.log("POINT AS PARSED BY st_latitude(), st_longitude() FUNCTIONS OF MySQL:")
    if (process.env.MYSQL_VERSION === '8') {
        console.log('NOTE: st_latitude() and st_longitude() version omitted because some records contain Point with SRID 0, i.e., not 4326.');
    } else {
        console.log('NOTE: st_latitude() and st_longitude() version omitted because these functions do not exist in v5.');
    }

    // const conn = await get_node_mysql2_conn();
    // const sql = 'SELECT st_latitude(pos), st_longitude(pos) FROM testpoint';
    // const [results, _fields] = await conn.execute(sql);
    //
    // console.log("POINT AS PARSED BY st_latitude(), st_longitude() FUNCTIONS OF MySQL:")
    // console.table(results);
    //
    // await conn.end();
}

const point_as_parsed_by_official_mysql_connector_nodejs_devxapi = async () => {
    const mysqlxConn = await mysqlx.getSession(process.env.MYSQL_VERSION === '5' ? {
        host: process.env.MYSQL5_HOST,
        port: 33060,
        user: process.env.MYSQL5_USER,
        password: process.env.MYSQL5_PASSWORD,
    } : {
        host: process.env.MYSQL8_HOST,
        port: 33060,
        user: process.env.MYSQL8_USER,
        password: process.env.MYSQL8_PASSWORD,
    });

    const mysqlxSchema = mysqlxConn.getSchema(
        process.env.MYSQL_VERSION === '5'
            ? process.env.MYSQL5_SCHEMA
            : process.env.MYSQL8_SCHEMA);

    const mysqlxTable = mysqlxSchema.getTable('testpoint');

    const query = mysqlxTable.select(['pos']);
    const resultCursor = await query.execute();
    const result = resultCursor.fetchAll();

    console.log('POINT AS PARSED BY OFFICIAL mysql-connector-nodejs devxapi:');
    console.log('This connector does not parse a Point at all. It just returns the raw array of bytes yet to be parsed.');
    console.log('jdbc probably does the same.');
    console.log(result);

    await mysqlxConn.close();
}

const main = async () => {
    const line = '\n' + '='.repeat(process.stdout.columns);

    console.log(`Testing with MySQL v${process.env.MYSQL_VERSION}...`, '\n');

    console.log(line);
    await point_as_parsed_by_st_x_st_y();

    console.log(line);
    await point_as_parsed_by_node_mysql2_driver_parser();

    console.log(line);
    await point_as_parsed_by_node_mysql_driver_parser();

    console.log(line);
    await point_as_parsed_by_st_latitude_st_longitude();

    console.log(line);
    await point_as_parsed_by_official_mysql_connector_nodejs_devxapi();
}

await main();