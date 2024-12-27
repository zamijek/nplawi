// routes/programRoutes.js
const express = require('express');
const router = express.Router();
const { getPrograms, registerProgram, getRegisteredPrograms,getAccountData, updateAccountData } = require('../controllers/userMenuController');  // Import controller
const {verifyToken} = require('../middleware/authMiddleware');

// Rute untuk mendapatkan daftar program
router.get('/program', getPrograms);
router.post('/registerProgram', verifyToken, registerProgram);
router.get('/registeredPrograms/:userId', getRegisteredPrograms);
router.get('/getAccount/:userId', getAccountData);
router.put('/updateAccount/:userId', updateAccountData);

module.exports = router;
