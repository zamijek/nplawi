// Middleware untuk autentikasi dan otorisasi
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || '123';

// Middleware untuk verifikasi token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil token setelah "Bearer"

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid' });
        }
        console.log('User dari token:', user); // Debugging
        req.user = user; // Tambahkan user ke req
        next();
    });
}


function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }
        next();
    };
}

module.exports = { verifyToken, authorizeRole };
