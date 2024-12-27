// Middleware untuk autentikasi dan otorisasi
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware untuk verifikasi token
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil token setelah "Bearer"

    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Kesalahan JWT:', err.message); // Log kesalahan
            return res.status(403).json({ message: 'Token tidak valid' });
        }

        // Pastikan payload memiliki customer_id
        if (!user.customer_id) {  // Ganti user.id menjadi user.customer_id
            return res.status(403).json({ message: 'Token tidak memiliki customer_id' });
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
