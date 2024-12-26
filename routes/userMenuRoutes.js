// routes/programRoutes.js
const express = require('express');
const router = express.Router();
const { getPrograms, registerProgram, getUserPrograms,getAccountData } = require('../controllers/userMenuController');  // Import controller
const {verifyToken} = require('../middleware/authMiddleware');

// Rute untuk mendapatkan daftar program
router.get('/program', getPrograms);
router.post('/registerProgram', verifyToken, registerProgram);
router.post('/getUserPrograms', verifyToken, getUserPrograms);
router.get('/getAccount/:userId', getAccountData);

// router.post('/updateAccount', updateAccountData);


module.exports = router;
