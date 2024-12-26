const db = require('../config/db');
const { promisify } = require('util');

// Promisify db.query untuk mendukung async/await
const query = promisify(db.query).bind(db);

// Mencari user berdasarkan email
const findUserByEmail = async (email) => {
    try {
        const results = await query('SELECT * FROM users WHERE email = ?', [email]);
        return results[0]; // Mengembalikan user pertama jika ada
    } catch (err) {
        throw new Error('Gagal mencari user berdasarkan email: ' + err.message);
    }
};

// Menyimpan token reset password
const saveResetToken = async (email, token, expiry) => {
    try {
        const results = await query('UPDATE users SET reset_token = ?, token_expiry = ? WHERE email = ?', [token, expiry, email]);
        return results; // Mengembalikan hasil query
    } catch (err) {
        throw new Error('Gagal menyimpan reset token: ' + err.message);
    }
};

module.exports = { findUserByEmail, saveResetToken };

