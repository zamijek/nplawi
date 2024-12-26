const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { adminProtected } = require('../controllers/adminController');

const router = express.Router();

router.get('/protected', verifyToken, authorizeRole('admin'), adminProtected);

module.exports = router;
