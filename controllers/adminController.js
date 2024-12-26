function adminProtected(req, res) {
    res.status(200).json({
        message: 'Selamat datang, admin!',
        user: req.user
    });
}

module.exports = { adminProtected };
