const mysql = require('mysql');

const createPool = env => {
	const { DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT } = env;
	const pool = mysql.createPool({
		host: DB_HOST,
		port: DB_PORT,
		user: DB_USER,
		password: DB_PASS,
		database: DB_NAME,
		connectionLimit : 1000,
		charset: 'utf8mb4'
	});
	return pool;
}

module.exports = createPool;
