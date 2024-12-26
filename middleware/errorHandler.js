// Middleware untuk menangani error
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
}

module.exports = errorHandler;
