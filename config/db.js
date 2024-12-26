// Koneksi database
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nestle pure life jk1'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Koneksi database berhasil.');
});

module.exports = db;
