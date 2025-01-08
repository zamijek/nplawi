const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { promisify } = require('util');
const JWT_SECRET = process.env.JWT_SECRET;
const crypto = require('crypto');
const { findUserByEmail, saveResetToken } = require('../models/userModel');
require('dotenv').config();

// Promisify db.query
const query = promisify(db.query).bind(db);

// Membuat promise untuk query database
const queryPromise = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Register
// Register
async function register(req, res) {
    const { 
        nama_lengkap, 
        ttl, 
        alamat, 
        no_telp, 
        email, 
        password, 
        nama_toko, 
        wilayah_toko, 
        alamat_toko, 
        jenis_toko 
    } = req.body;

    // Validasi wilayah toko
    const validWilayah = ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur'];
    if (!validWilayah.includes(wilayah_toko)) {
        return res.status(400).json({ message: 'Wilayah toko tidak valid.' });
    }

    try {
        // Periksa apakah email atau nomor telepon sudah digunakan
        const existingUser = await query('SELECT * FROM users WHERE email = ? OR no_telp = ?', [email, no_telp]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email atau nomor telepon sudah digunakan.' });
        }

        // Enkripsi password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cari sales berdasarkan wilayah toko
        const salesQuery = 'SELECT sales_id FROM sales WHERE wilayah_tugas = ? LIMIT 1';
        const salesResults = await query(salesQuery, [wilayah_toko]);
        if (salesResults.length === 0) {
            return res.status(404).json({ message: 'Sales untuk wilayah ini tidak ditemukan.' });
        }
        const salesId = salesResults[0].sales_id;

        // Simpan data pengguna ke tabel users
        const insertUserQuery = `
            INSERT INTO users 
            (nama_lengkap, ttl, alamat, no_telp, email, password, nama_toko, wilayah_toko, alamat_toko, jenis_toko, created_at, role, sales_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'user', ?)
        `;
        const result = await query(insertUserQuery, [
            nama_lengkap, 
            ttl, 
            alamat, 
            no_telp, 
            email, 
            hashedPassword, 
            nama_toko, 
            wilayah_toko, 
            alamat_toko, 
            jenis_toko, 
            salesId
        ]);

        res.status(201).json({ message: 'Pendaftaran berhasil.', userId: result.insertId });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ message: 'Gagal menyimpan data.' });
    }
}


// Login
async function login(req, res) {
    const { username, password } = req.body;

    try {
        // Cari user berdasarkan username/email
        const users = await query('SELECT customer_id, role, password FROM users WHERE email = ? OR customer_id = ?', [username, username]);


        if (users.length === 0) {
            return res.status(401).json({ message: 'Email/Telepon tidak ditemukan.' });
        }

        const user = users[0];

        // Verifikasi password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }

        const token = jwt.sign(
            { customer_id: user.customer_id, username: user.username, role: user.role },  // Pastikan ID ada di payload
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Kirim token ke klien
        res.json({ token, userId: user.customer_id, role: user.role });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
}

// Logout
async function logout(req, res) {
    const token = req.headers['authorization']?.split(' ')[1];

    try {
        await query('INSERT INTO revoked_tokens (token) VALUES (?)', [token]);
        res.status(200).json({ message: 'Logout berhasil.' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Gagal mencabut token.' });
    }
}

// Forgot Password
async function forgotPassword(req, res) {
    const { email } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Email tidak terdaftar.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // Token berlaku 1 jam
        await saveResetToken(email, token, expiry);

        const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password',
            text: `Klik tautan berikut untuk mereset password Anda: ${resetUrl}`,
        });

        res.status(200).json({ message: 'Email reset password telah dikirim.' });
    } catch (err) {
        console.error('Error during forgot password:', err);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
}

// Reset Password
async function resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token dan password baru diperlukan.' });
    }

    try {
        const [tokenRecord] = await query('SELECT * FROM users WHERE reset_token = ?', [token]);
        if (!tokenRecord || new Date() > new Date(tokenRecord.token_expiry)) {
            return res.status(400).json({ message: 'Token tidak valid atau telah kadaluarsa.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?', [hashedPassword, token]);

        res.json({ message: 'Password berhasil diperbarui.' });
    } catch (err) {
        console.error('Error during reset password:', err);
        res.status(500).json({ message: 'Terjadi kesalahan. Silakan coba lagi.' });
    }
}


//GANTI PASSWORD==================
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.customer_id; // `req.user` berasal dari verifyToken

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Password lama dan password baru harus disertakan.' });
    }

    try {
        // Ambil password hash dari database
        const query = 'SELECT password FROM users WHERE customer_id = ?';
        const user = await queryPromise(query, [userId]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // Validasi password lama
        const isPasswordValid = await bcrypt.compare(currentPassword, user[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password lama salah.' });
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password di database
        const updateQuery = 'UPDATE users SET password = ? WHERE customer_id = ?';
        await queryPromise(updateQuery, [hashedPassword, userId]);

        res.status(200).json({ message: 'Password berhasil diubah.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengganti password.' });
    }
}

module.exports = { register, login, logout, forgotPassword, resetPassword, changePassword };
