const oracledb = require("oracledb");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 1
};

let pool;

async function initPool() {
    if (!pool) {
        pool = await oracledb.createPool(dbConfig);
    }
    return pool;
}

async function getConnection() {
    const p = await initPool();
    return await p.getConnection();
}

module.exports = getConnection;