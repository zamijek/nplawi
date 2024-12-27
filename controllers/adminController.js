const db = require('../config/db');
require('dotenv').config();

// Membuat promise untuk query database
const queryPromise = (query, params) => {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};


//ambil data
async function priceProduct (req, res) {
    try {
        const [rows] = await queryPromise('SELECT produk_id AS id, harga FROM produk');
        
        res.json(rows); // Mengirimkan data harga dalam format JSON
    
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ message: 'Gagal memuat harga produk.' });
    }
};


module.exports = { priceProduct };
