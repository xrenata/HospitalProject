const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

db.connect(err => {
    if (err) {
        console.error(err);
    } else {
        console.log('Database connected.');
    }
});

module.exports = db;
