const express = require('express');
const router = express.Router();

const { dataOrder, invoiceOrder, processOrder, shipOrder,
    priceProduct, priceUpdate, stockProduct, updateStock,
    monitoringProgram, getProgramsByCategory, getProgramDetails, updateProgram,
    dataToko, riwayatTransaksi,
    salesReport,
    topShop, 
    checkInvoice,
    getWilayah, exportExcell} = require('../controllers/adminController');

//manajemen pemesanan
router.get('/orders', dataOrder);
router.get('/invoice/:orderId', invoiceOrder);
router.get('/invoice/:orderId/check-invoice', checkInvoice);
router.post('/orders/process', processOrder);
router.post('/orders/ship', shipOrder);

//manajemen produk
router.get('/prices/:produk_id', priceProduct);
router.post('/prices/:produk_id', priceUpdate);
router.get('/stock', stockProduct);
router.post('/update-stock', updateStock);

//manajemen program
router.get('/monitoring-program/:category', monitoringProgram);
router.get('/programs/:category', getProgramsByCategory);
router.get('/programs/:program_id', getProgramDetails);
router.post('/update-program', updateProgram);

//manajemen toko
router.get('/data-toko/:wilayah', dataToko);
router.get('/wilayah', getWilayah);
router.get('/riwayat-penjualan', riwayatTransaksi);

//laporan penjualan
router.get('/sales-report', salesReport);
router.get('/top-shops', topShop);
router.get('/export-excel', exportExcell);


module.exports = router;
