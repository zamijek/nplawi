// routes/programRoutes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getUserId, getProducts,
    createOrder, cancelOrder, getOrderId, paymentOrder, completeOrder,
    getPrograms, registerProgram, getRegisteredPrograms, updateOrderStatus, 
    getAccountData, updateAccountData, 
    orderStatus,
    orderHistory} = require('../controllers/userMenuController');  // Import controller

//rute pemesanan
router.get('/products', getProducts);
router.post('/order', verifyToken, createOrder);
router.get('/order/:orderId', getOrderId);  // API untuk membuat pesanan
router.get('/users/:userId', verifyToken, getUserId);

//status pemesanan
router.put('/order/:orderId/cancel', cancelOrder);
router.post('/payment', paymentOrder);
router.put('/payment/order', updateOrderStatus);
router.get('/order/status/:userId', orderStatus);
router.post('/orders/complete', completeOrder);
router.get('/orderhistory/:userId', orderHistory);

// Rute untuk mendapatkan daftar program
router.get('/program', getPrograms);
router.post('/registerProgram', verifyToken, registerProgram);
router.get('/registeredPrograms/:userId', getRegisteredPrograms);

//rute edit akun
router.get('/getAccount/:userId', getAccountData);
router.put('/updateAccount/:userId', updateAccountData);


module.exports = router;
