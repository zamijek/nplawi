const express = require('express');
const {priceProduct } = require('../controllers/adminController');

const router = express.Router();

router.get('/prices', priceProduct);

module.exports = router;
