const db = require('../config/db');  // Import koneksi database
const midtransClient = require('midtrans-client');
require('dotenv').config();

// Inisialisasi Snap Client
const snap = new midtransClient.Snap({
    isProduction: false, // Ubah ke true jika live
    serverKey: process.env.SERVER_KEY,
    clientKey: process.env.CLIENT_KEY,
});

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


//GET USER ID=================
async function getUserId(req, res) {
    const userId = req.params.userId;

    try {
        const userQuery = 'SELECT * FROM users WHERE customer_id = ?';
        const userResult = await queryPromise(userQuery, [userId]);

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        res.json(userResult[0]); // Kirimkan data pengguna
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pengguna.' });
    }
};

// MENAMPILKAAN PROGRAM BERDASARKAN KATEGORI=======================
async function getPrograms(req, res) {
    const category = req.query.category;
    if (!category) {
        return res.status(400).json({ message: 'Kategori tidak ditemukan.' });
    }

    const query = 'SELECT * FROM program WHERE category = ?';
    try {
        const results = await queryPromise(query, [category]);
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada program untuk kategori ini.' });
        }
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
}

//DAFTAR PROGRAM=============
async function registerProgram(req, res) {
    const { programId } = req.body;
    const userId = req.user?.customer_id; // Ambil `customer_id` dari middleware otentikasi

    if (!programId) {
        return res.status(400).json({ message: 'Program ID tidak ditemukan.' });
    }

    try {
        // Pastikan program dengan ID yang diberikan ada
        const program = await queryPromise('SELECT * FROM program WHERE program_id = ?', [programId]);

        if (program.length === 0) {
            return res.status(404).json({ message: 'Program tidak ditemukan.' });
        }

        // Hapus semua pendaftaran program sebelumnya untuk pengguna
        await queryPromise('DELETE FROM users_program WHERE customer_id = ?', [userId]);

        // Tambahkan program baru
        await queryPromise('INSERT INTO users_program (customer_id, program_id, created_at) VALUES (?, ?, NOW())', [
            userId,
            programId,
        ]);

        res.status(201).json({ message: 'Berhasil mendaftar program baru.' });
    } catch (error) {
        console.error('Error registering program:', error.stack);
        res.status(500).json({ message: 'Terjadi kesalahan saat mendaftarkan program.' });
    }
}


//MENAMPILKAN PROGRAM YANG DIDAFTARKAN
async function getRegisteredPrograms(req, res) {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ message: 'User ID tidak ditemukan.' });
    }

    try {
        const query = `
            SELECT 
                p.program_id,
                p.category,
                p.program_name,
                p.target_kuartal,
                p.description,
                up.created_at
            FROM program p
            JOIN users_program up ON p.program_id = up.program_id
            WHERE up.customer_id = ?
        `;
        const programs = await queryPromise(query, [userId]);

        res.json(programs);
    } catch (error) {
        console.error('Error fetching registered programs:', error.stack);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data program.' });
    }
}


// Fungsi untuk mendapatkan data akun pengguna berdasarkan user_id
async function getAccountData(req, res) {
    const userId = req.params.userId; // Ambil userId dari parameter

    if (!userId) {
        return res.status(400).json({ message: 'User ID tidak ditemukan.' });
    }

    const query = 'SELECT * FROM users WHERE customer_id = ?'; // Sesuaikan dengan nama kolom dan tabel di database Anda

    try {
        const results = await queryPromise(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // Menyesuaikan nama properti agar sesuai dengan yang diminta di frontend
        const user = {
            name: results[0].nama_lengkap,
            birth: results[0].ttl, // Pastikan kolom sesuai dengan database
            email: results[0].email,
            phone: results[0].no_telp,
            address: results[0].alamat,
            shopName: results[0].nama_toko,
            shopAddress: results[0].alamat_toko,
        };

        res.json(user); // Mengirimkan data pengguna
    } catch (err) {
        console.error('Error querying the database:', err.stack);
        return res.status(500).json({ message: 'Database query error' });
    }
}


// // Fungsi untuk memperbarui data akun pengguna
async function updateAccountData(req, res) {
    const userId = req.params.userId;
    const { name, birth, email, phone, address, shopName, shopAddress } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID tidak ditemukan.' });
    }

    const query = `
        UPDATE users 
        SET 
            nama_lengkap = ?, 
            ttl = ?, 
            email = ?, 
            no_telp = ?, 
            alamat = ?, 
            nama_toko = ?, 
            alamat_toko = ?
        WHERE customer_id = ?
    `;

    const values = [name, birth, email, phone, address, shopName, shopAddress, userId];

    try {
        const result = await queryPromise(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        res.json({ message: 'Data akun berhasil diperbarui.' });
    } catch (err) {
        console.error('Error updating the database:', err.stack);
        return res.status(500).json({ message: 'Database update error.' });
    }
}

//PRODUK========
// Fungsi untuk mendapatkan data produk
async function getProducts(req, res) {
    const query = 'SELECT * FROM produk'; // Query untuk mendapatkan semua produk
    try {
        // Menggunakan queryPromise untuk menjalankan query
        const results = await queryPromise(query, []);

        // Jika tidak ada produk ditemukan
        if (results.length === 0) {
            return res.status(404).json({ message: 'Tidak ada produk ditemukan.' });
        }

        // Mengirimkan data produk dalam bentuk JSON
        res.json(results);
    } catch (err) {
        console.error('Error fetching products:', err.stack);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data produk' });
    }
}


// Fungsi untuk menyimpan pesanan baru
async function createOrder(req, res) {
    const { userId, cart, shippingAddress, note } = req.body;

    // Validasi data yang masuk
    if (!userId || !cart || cart.length === 0 || !shippingAddress) {
        return res.status(400).json({ message: 'Data pesanan tidak lengkap.' });
    }

    const { nama_toko, no_telp, wilayah_toko } = req.body;

    try {
        // Hitung total dan diskon pesanan
        let totalAmount = 0;
        cart.forEach(item => {
            totalAmount += item.harga * item.quantity;
        });

        const discountQuery = `
            SELECT pd.discount
            FROM users_program up
            JOIN program p ON up.program_id = p.program_id
            LEFT JOIN program_discount pd ON p.program_id = pd.program_id
            WHERE up.customer_id = ?
        `;
        const [discounts] = await db.promise().query(discountQuery, [userId]);
        let totalDiscount = 0;

        cart.forEach(item => {
            const applicableDiscount = discounts.find(d =>
                d.category === item.category && d.discount
            );
            if (applicableDiscount) {
                totalDiscount += applicableDiscount.discount * item.quantity;
            }
        });

        const finalAmount = totalAmount - totalDiscount;

        // Dapatkan nama sales berdasarkan wilayah toko
        const salesQuery = `
            SELECT s.sales_id, s.nama_sales
            FROM sales s
            JOIN users u ON u.sales_id = s.sales_id
            WHERE u.wilayah_toko = ?
        `;
        const [salesResult] = await db.promise().query(salesQuery, [wilayah_toko]);

        if (salesResult.length === 0) {
            return res.status(404).json({ message: 'Sales untuk wilayah toko tidak ditemukan.' });
        }

        const salesName = salesResult[0].nama_sales;

        // Simpan data pesanan ke tabel `orders`
        const orderQuery = `
            INSERT INTO orders (customer_id, nama_toko, alamat_pengiriman, no_telp, wilayah_toko, order_date, total_amount, discount, final_amount, nama_sales, status_id, note)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
        `;
        const [orderResult] = await db.promise().query(orderQuery, [
            userId,
            nama_toko,
            shippingAddress,
            no_telp,
            wilayah_toko,
            totalAmount,
            totalDiscount,
            finalAmount,
            salesName,
            1, // status_id = 1 (Menunggu Pembayaran)
            note,
        ]);

        const orderId = orderResult.insertId;

        // Simpan item pesanan ke tabel `order_items`
        const orderItemsQuery = `
            INSERT INTO order_items (order_id, product_id, quantity, price, customer_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const orderItemsPromises = cart.map(async (item) => {
            const productQuery = `SELECT stock FROM produk WHERE produk_id = ?`;
            const [product] = await db.promise().query(productQuery, [item.produk_id]);

            if (product.length === 0) {
                throw new Error(`Produk dengan ID ${item.produk_id} tidak ditemukan.`);
            }

            const availableStock = product[0].stock;
            if (availableStock < item.quantity) {
                throw new Error(`Stok produk ${item.nama_produk} tidak cukup.`);
            }

            const updateStockQuery = `UPDATE produk SET stock = stock - ? WHERE produk_id = ?`;
            await db.promise().query(updateStockQuery, [item.quantity, item.produk_id]);

            await db.promise().query(orderItemsQuery, [
                orderId,
                item.produk_id,
                item.quantity,
                item.harga,
                userId,
            ]);
        });

        await Promise.all(orderItemsPromises);

        // Kirim respons sukses dengan `orderId`
        res.json({
            orderId,
            totalAmount,
            totalDiscount,
            finalAmount,
            salesName,
            message: 'Pesanan berhasil dibuat.',
        });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ message: `Terjadi kesalahan saat memproses pesanan: ${error.message}` });
    }
}

//orderan Selesai
async function completeOrder(req, res) {
    const { orders } = req.body;
    if (!orders || orders.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada pesanan yang dipilih.' });
    }

    try {
        // Validasi status apakah sudah dalam status "Dikirim"
        const [currentStatus] = await db.promise().query('SELECT status_id FROM orders WHERE order_id IN (?)', [orders]);
        if (currentStatus.some(order => order.status_id !== 7)) {
            return res.status(400).json({ success: false, message: 'Pesanan tidak dapat diselesaikan (status bukan "Terkirim").' });
        }

        // Lakukan update status pesanan menjadi "Selesai"
        await db.promise().query('UPDATE orders SET status_id = 5 WHERE order_id IN (?) AND status_id = 7', [orders]);

        // 🔥 Tambahkan success: true agar frontend bisa mengenali suksesnya
        res.status(200).json({ success: true, message: 'Pesanan berhasil diselesaikan.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menyelesaikan pesanan.' });
    }
}

//cancel order
async function cancelOrder(req, res) {
    const { orderId } = req.params;

    try {
        // Cek apakah pesanan ada dan ambil detailnya
        const checkOrderQuery = `
            SELECT o.order_id, o.status_id, oi.product_id, oi.quantity 
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.order_id = ?
        `;
        const [orderDetails] = await db.promise().query(checkOrderQuery, [orderId]);

        if (orderDetails.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }

        const order = orderDetails[0];

        // Pastikan status pesanan adalah 1 (hanya status 1 yang bisa dibatalkan)
        if (order.status_id !== 1) { // 1: Menunggu Pembayaran
            return res.status(400).json({ 
                message: `Pesanan ini tidak dapat dibatalkan karena statusnya bukan 'Menunggu Pembayaran'.` 
            });
        }

        // Perbarui status pesanan menjadi "Dibatalkan"
        const cancelOrderQuery = `UPDATE orders SET status_id = ? WHERE order_id = ?`;
        await db.promise().query(cancelOrderQuery, [6, orderId]); // 6: Dibatalkan

        // Kembalikan stok produk
        const returnStockPromises = orderDetails.map(item => {
            const updateStockQuery = `UPDATE produk SET stock = stock + ? WHERE produk_id = ?`;
            return db.promise().query(updateStockQuery, [item.quantity, item.product_id]);
        });

        await Promise.all(returnStockPromises);

        res.json({ message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan.' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membatalkan pesanan.' });
    }
}


//GET ORDER ID
async function getOrderId(req, res) {
    const { orderId } = req.params;

    try {
        const orderQuery = `
            SELECT o.order_id, o.final_amount, o.total_amount, o.discount, o.nama_toko, o.nama_sales, o.status_id, os.status_name
            FROM orders o
            JOIN order_status os ON o.status_id = os.status_id
            WHERE o.order_id = ?
        `;
        const [orderResult] = await db.promise().query(orderQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }

        res.json(orderResult[0]);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil detail pesanan.' });
    }
};

//PEMBAYARAN==============
async function paymentOrder(req, res) {
    const { orderId, amount } = req.body; // customerDetails tidak lagi diambil dari body

    if (!orderId || !amount) {
        return res.status(400).json({ message: 'Data pembayaran tidak lengkap.' });
    }

    try {
        // Query untuk mendapatkan data pelanggan berdasarkan orderId
        const query = `
            SELECT u.customer_id, o.nama_toko, o.wilayah_toko, o.no_telp
            FROM orders o
            JOIN users u ON o.customer_id = u.customer_id
            WHERE o.order_id = ?`;
        
        const [order] = await db.promise().query(query, [orderId]); // Asumsikan db.query mendukung async/await

        if (!order) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }

        // Siapkan data untuk transaksi
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            customer_details: {
                nama: order.nama_toko,
                kota: order.wilayah_toko,
                phone: order.no_telp,
            },
        };

        // Membuat transaksi menggunakan Midtrans Snap
        const transaction = await snap.createTransaction(parameter);

        // Mengembalikan token pembayaran
        res.json({ token: transaction.token });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Gagal membuat transaksi.' });
    }
}


//NOTIF SUKSES BAYAR================
async function updateOrderStatus(req, res) {
    const { orderId, newStatusId } = req.body;

    if (!orderId || !newStatusId) {
        return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    const query = `
       UPDATE orders
        SET status_id = ?, payment_status = 'Dibayar', payment_date = NOW()
        WHERE order_id = ?
    `;

    try {
        // Gunakan await karena db.query bersifat asynchronous
        await db.promise().query(query, [newStatusId, orderId]);
        res.status(200).json({ message: 'Status pesanan berhasil diperbarui.' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Gagal memperbarui status pesanan.' });
    }
}


//STATUS PEMESANAN 
async function orderStatus(req, res) {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'User ID diperlukan.' });
    }

    const query = `
        SELECT 
            o.order_id, 
            o.order_date, 
            o.discount, 
            o.final_amount, 
            os.status_name, 
            os.description,
            SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS nestle_pure_life_330ml,
            SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS nestle_pure_life_600ml,
            SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS nestle_pure_life_1500ml
            FROM orders o
            JOIN order_status os ON o.status_id = os.status_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            WHERE o.customer_id = ?
            AND o.status_id != 6 -- Mengecualikan status_id 6
            GROUP BY o.order_id, os.status_name, os.description
            ORDER BY o.order_date DESC
            LIMIT 3;
        `;

    try {
        const [orderDetails] = await db.promise().query(query, [userId]);

        if (orderDetails.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }

        res.status(200).json(orderDetails);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Gagal mengambil detail pesanan.' });
    }
};


//RIWAYAT TRANSAKSI=================
function orderHistory(req, res) {
    const userId = req.params.userId;

    const sql = `
        SELECT 
            o.order_date, 
            o.order_id, 
            SUM(oi.quantity) AS total_quantity, 
            o.final_amount, 
            os.status_name,
            SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
            SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
            SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml
        FROM 
            orders o
        LEFT JOIN 
            order_items oi ON o.order_id = oi.order_id
        LEFT JOIN 
            produk p ON oi.product_id = p.produk_id
        LEFT JOIN 
            order_status os ON o.status_id = os.status_id
        WHERE 
            o.customer_id = ?
        GROUP BY 
            o.order_date, 
            o.order_id, 
            o.final_amount, 
            os.status_name
        ORDER BY 
            o.order_date DESC
            LIMIT 10;
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching order history:', err);
            return res.status(500).json({ error: 'Failed to fetch order history' });
        }

        if (results.length === 0) {
            console.log('No orders found');
            return res.status(404).json({ error: 'No orders found for this user' });
        }

        res.json(results);
    });
}

module.exports = {
    getUserId, getProducts,
    createOrder, completeOrder, cancelOrder, getOrderId, paymentOrder, updateOrderStatus, orderStatus, orderHistory,
    getPrograms, registerProgram, getRegisteredPrograms,
    getAccountData, updateAccountData
};
