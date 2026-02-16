const db = require('../config/db');
const PDFDocument = require('pdfkit');
//Logo Invoice
const multer = require('multer');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'Website AWI NPL', 'gambar', 'AWI logo.png');
const backgroundPath = path.join(__dirname, '..', 'Website AWI NPL', 'gambar', 'pcnpl.jpg');

const ExcelJS = require('exceljs');
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


//AMBIL DATA ORDERAN======================
// Express.js route for fetching orders sorted by FCFS
function dataOrder(req, res) {
    const query = `
    SELECT o.order_id, o.nama_toko, o.order_date, os.status_name,
    SUM(oi.quantity) AS total_quantity,
    SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
    SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
    SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN produk p ON oi.product_id = p.produk_id
    JOIN order_status os ON o.status_id = os.status_id
    WHERE os.status_name NOT IN ('Selesai', 'Dibatalkan') -- Filter status 'Selesai' dan 'Dibatalkan'
    GROUP BY o.order_id, o.nama_toko, o.order_date, os.status_name
    ORDER BY 
    CASE 
    WHEN os.status_name = 'Pesanan telah dibayar' THEN 1 -- Prioritaskan status ini
    ELSE 2 -- Status lainnya diurutkan setelahnya
    END, 
    o.order_date ASC; 
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch orders' });
        } else {
            res.json(results);
        }
    });
};


// INVOICE ORDERAN
function invoiceOrder(req, res) {
    const { orderId } = req.params;

    // Query untuk mendapatkan detail pesanan
    const query = `
        SELECT 
            o.order_id,
            o.nama_toko,
            o.order_date,
            o.wilayah_toko,
            o.alamat_pengiriman,
            o.no_telp,
            o.note,
            o.is_invoice_printed,
            SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
            SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
            SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml,
            SUM(oi.quantity) AS total_quantity,
            o.total_amount,
            o.discount,
            o.final_amount,
            o.nama_sales
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN produk p ON oi.product_id = p.produk_id
        WHERE o.order_id = ?
        GROUP BY 
            o.order_id,
            o.nama_toko,
            o.order_date,
            o.wilayah_toko,
            o.alamat_pengiriman,
            o.no_telp,
            o.note,
            o.is_invoice_printed,
            o.total_amount,
            o.discount,
            o.final_amount,
            o.nama_sales;
    `;

    db.query(query, [orderId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).send('Data pesanan tidak ditemukan');
        }

        const order = results[0];
        const tanggalKirim = new Date();

        function formatRupiah(value) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(value);
        }

        function formatTanggal(date) {
            const d = new Date(date);
            return d.toLocaleDateString('id-ID');
        }

        function formatJam(date) {
            const d = new Date(date);
            return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }

                // Jika invoice sudah dicetak, lanjutkan dengan mencetak ulang
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // =======================
        // HEADER
        // =======================

        // LOGO
        doc.image(logoPath, 500, 30, { width: 60 });

        // Judul
        doc.fontSize(22)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 50);

        // Garis pembatas
        doc.moveTo(50, 90)
        .lineTo(550, 90)
        .stroke();

        // =======================
        // INFORMASI ORDER (KIRI)
        // =======================
        let currentY = 110;

        doc.fontSize(12)
        .font('Helvetica')
        .text(`Order ID`, 50, currentY)
        .text(`Nama Toko`, 50, currentY + 20)
        .text(`Wilayah`, 50, currentY + 40)
        .text(`Alamat`, 50, currentY + 60)
        .text(`No. Telp`, 50, currentY + 105)
        .text(`Nama Sales`, 50, currentY + 125);

        // Value kiri
        doc.font('Helvetica-Bold')
        .text(`: ${order.order_id}`, 130, currentY)
        .text(`: ${order.nama_toko}`, 130, currentY + 20)
        .text(`: ${order.wilayah_toko}`, 130, currentY + 40)
        .text(`: ${order.alamat_pengiriman}`, 130, currentY + 60, { width: 200 })
        .text(`: ${order.no_telp}`, 130, currentY + 105)
        .text(`: ${order.nama_sales}`, 130, currentY + 125);

        // =======================
        // TANGGAL (KANAN)
        // =======================
        doc.font('Helvetica')
        .text(`Tanggal Pesan`, 355, currentY)
        .text(`Jam Pesan`, 355, currentY + 20)
        .text(`Tanggal Kirim`, 355, currentY + 40)
        .text(`Jam Kirim`, 355, currentY + 60);

        doc.font('Helvetica-Bold')
        .text(`: ${formatTanggal(order.order_date)}`, 465, currentY)
        .text(`: ${formatJam(order.order_date)}`, 465, currentY + 20)
        .text(`: ${formatTanggal(tanggalKirim)}`, 465, currentY + 40)
        .text(`: ${formatJam(tanggalKirim)}`, 465, currentY + 60);

        // =======================
        // GARIS PEMBATAS INFO
        // =======================
        let detailStartY = currentY + 145;

        doc.moveTo(50, detailStartY)
        .lineTo(550, detailStartY)
        .stroke();

        // =======================
        // DETAIL PESANAN
        // =======================
        detailStartY += 25;

        doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Detail Pesanan', 50, detailStartY);

        detailStartY += 20;

        doc.moveTo(50, detailStartY)
        .lineTo(550, detailStartY)
        .stroke();

        detailStartY += 10;

        // Header Table
        doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Produk', 50, detailStartY)
        .text('Qty', 400, detailStartY);

        detailStartY += 15;

        doc.moveTo(50, detailStartY)
        .lineTo(550, detailStartY)
        .stroke();

        detailStartY += 10;

        // Isi Table
        doc.font('Helvetica')
        .text('Nestlé Pure Life 330ml', 50, detailStartY)
        .text(`${order.quantity_330ml} karton`, 400, detailStartY);

        detailStartY += 20;

        doc.text('Nestlé Pure Life 600ml', 50, detailStartY)
        .text(`${order.quantity_600ml} karton`, 400, detailStartY);

        detailStartY += 20;

        doc.text('Nestlé Pure Life 1500ml', 50, detailStartY)
        .text(`${order.quantity_1500ml} karton`, 400, detailStartY);

        detailStartY += 25;

        doc.moveTo(50, detailStartY)
        .lineTo(550, detailStartY)
        .stroke();

        // =======================
        // TOTAL
        // =======================

        doc.font('Helvetica-Bold')
        .text(`Total Quantity`, 350, 420)
        .text(`: ${order.total_quantity} karton`, 470, 420);

        doc.text(`Total Harga`, 350, 440)
        .text(`: ${formatRupiah(order.total_amount)}`, 470, 440);

        doc.text(`Diskon`, 350, 460)
        .text(`: ${formatRupiah(order.discount)}`, 470, 460);

        doc.text(`Total Bayar`, 350, 480)
        .text(`: ${formatRupiah(order.final_amount)}`, 470, 480);

        // =======================
        // FOOTER
        // =======================

        doc.moveTo(50, 510)
        .lineTo(550, 510)
        .stroke();

        doc.fontSize(10)
        .font('Helvetica')
        .text('Terima kasih atas kepercayaan Anda.', 50, 530, {
            align: 'center',
            width: 500
        });

        doc.end();

        // Update status is_invoice_printed
        db.query('UPDATE orders SET is_invoice_printed = 1 WHERE order_id = ?', [orderId], (updateErr) => {
            if (updateErr) {
                console.error('Gagal memperbarui status is_invoice_printed:', updateErr);
            }
        });
    });
}


//CHECK INVOICE SUDAH DICETAK ATAU BELUM===========================
function checkInvoice(req, res) {
    const { orderId } = req.params;

    db.query('SELECT is_invoice_printed FROM orders WHERE order_id = ?', [orderId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: 'Pesanan tidak ditemukan' });
        }

        res.json({ isPrinted: results[0].is_invoice_printed === 1 });
    });
};

//MANAJEMEN PESANAN==========================
async function processOrder(req, res) {
    const { orders } = req.body;
    if (!orders || orders.length === 0) {
        return res.status(400).json({ message: 'Tidak ada pesanan yang dipilih.' });
    }

    try {
        // Validasi status apakah sudah dalam status "Diproses"
        const [currentStatus] = await db.promise().query('SELECT status_id FROM orders WHERE order_id IN (?)', [orders]);
        if (currentStatus.some(order => order.status_id !== 2)) {
            return res.status(400).json({ message: 'Beberapa pesanan sudah tidak dapat diproses.' });
        }

        // Lakukan update status pesanan menjadi "Diproses"
        await db.promise().query('UPDATE orders SET status_id = 3 WHERE order_id IN (?) AND status_id = 2', [orders]);
        res.status(200).json({ message: 'Pesanan berhasil diproses.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal memproses pesanan.' });
    }
}

async function shipOrder(req, res) {
    const { orders } = req.body;
    if (!orders || orders.length === 0) {
        return res.status(400).json({ message: 'Tidak ada pesanan yang dipilih.' });
    }

    try {
        // Validasi status apakah sudah dalam status "Diproses"
        const [currentStatus] = await db.promise().query('SELECT status_id FROM orders WHERE order_id IN (?)', [orders]);
        if (currentStatus.some(order => order.status_id !== 3)) {
            return res.status(400).json({ message: 'Beberapa pesanan tidak dapat dikirim (status bukan "Diproses").' });
        }

        // Lakukan update status pesanan menjadi "Dikirim"
        await db.promise().query('UPDATE orders SET status_id = 4 WHERE order_id IN (?) AND status_id = 3', [orders]);
        res.status(200).json({ message: 'Pesanan berhasil dikirim.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengirim pesanan.' });
    }
}

//ambil data produk=========================
async function priceProduct(req, res) {
    const productId = req.params.produk_id;
    const query = 'SELECT harga FROM produk WHERE produk_id = ?';
    db.query(query, [productId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        res.json({ harga: results[0].harga });
    });
};


//UPDATE HARGA==========================
async function priceUpdate(req, res) {
    const productId = req.params.produk_id;
    const { harga } = req.body;

    if (!harga || isNaN(harga)) {
        return res.status(400).json({ error: 'Harga tidak valid' });
    }

    const query = 'UPDATE produk SET harga = ? WHERE produk_id = ?';
    db.query(query, [harga, productId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        res.json({ message: 'Harga diperbarui' });
    });
};


//MELIHAT STOCK==================
async function stockProduct(req, res) {
    const query = `
    SELECT produk_id, nama_produk, stock 
    FROM produk
`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results); // Mengirimkan data produk dengan stok terbaru
    });
};


//update stock====================
async function updateStock(req, res) {
    const { produk_id, jumlah } = req.body;

    if (!produk_id || isNaN(jumlah)) {
        return res.status(400).json({ error: 'Data tidak lengkap atau salah' });
    }

    const query = 'UPDATE produk SET stock = stock + ? WHERE produk_id = ?';
    db.query(query, [jumlah, produk_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }
        res.json({ message: 'Stok berhasil diperbarui' });
    });
};

//MONITORING================
// Menggunakan db.query untuk monitoringProgram
async function monitoringProgram(req, res) {
    const { category } = req.params;

    try {
        console.log('Category received:', category); // Debug parameter

        const query = `
            SELECT 
                p.category, 
                p.program_name, 
                p.target_kuartal, 
                pd.discount, 
                pr.ukuran_produk, 
                pc.cashback_amount
            FROM 
                program p
            LEFT JOIN 
                program_discount pd ON p.program_id = pd.program_id
            LEFT JOIN 
                program_cashback pc ON p.program_id = pc.program_id
            LEFT JOIN 
                produk pr ON pc.produk_id = pr.produk_id
            WHERE 
                p.category = ?;
        `;

        db.query(query, [category], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Transformasi data agar ukuran_produk menjadi kolom
            const transformedData = {};
            results.forEach(row => {
                const key = `${row.program_name}|${row.target_kuartal}|${row.discount}`;
                if (!transformedData[key]) {
                    transformedData[key] = {
                        category: row.category,
                        program_name: row.program_name,
                        target_kuartal: row.target_kuartal,
                        discount: row.discount,
                        cashback: {}
                    };
                }
                transformedData[key].cashback[row.ukuran_produk] = row.cashback_amount || '0%';
            });

            const result = Object.values(transformedData);
            res.json(result);
        });

    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}


//AMBIL DATA UNTUK UPDATE PROGRAM=============== 
async function getProgramsByCategory(req, res) {
    const { category } = req.params;

    try {
        const query = `
            SELECT program_id, program_name 
            FROM program
            WHERE category = ?
        `;

        db.query(query, [category], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results); // Mengirimkan daftar nama program berdasarkan kategori
        });
    } catch (error) {
        console.error('Error fetching programs:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

//SELECT ID PROGRAM=============
async function getProgramDetails(req, res) {
    const { program_id } = req.params;

    try {
        const query = `
            SELECT p.program_name, p.target_kuartal, pd.discount, pr.ukuran_produk, pc.cashback_amount
            FROM program p
            LEFT JOIN program_discount pd ON p.program_id = pd.program_id
            LEFT JOIN program_cashback pc ON p.program_id = pc.program_id
            LEFT JOIN produk pr ON pr.produk_id = pc.produk_id
            WHERE p.program_id = ?;
        `;

        db.query(query, [program_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Membuat objek program dengan data default jika tidak ada cashback
            const program = {
                program_name: results[0].program_name,
                target_kuartal: results[0].target_kuartal,
                discount: results[0].discount,
                cashback: {
                    '330ml': '0%', // Default jika tidak ada data
                    '600ml': '0%', // Default jika tidak ada data
                    '1500ml': '0%' // Default jika tidak ada data
                }
            };

            // Mengisi cashback berdasarkan ukuran produk yang ada
            results.forEach(row => {
                program.cashback[row.ukuran_produk] = row.cashback_amount || '0%';
            });

            res.json(program);
        });
    } catch (error) {
        console.error('Error fetching program details:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}


//UPDATE PROGRAM
async function updateProgram(req, res) {
    const { program_id, program_name, target_kuartal, discount, cashback } = req.body;

    try {
        // Update nama program hanya jika ada perubahan
        if (program_name) {
            const query1 = `UPDATE program SET program_name = ? WHERE program_id = ?`;
            await queryPromise(query1, [program_name, program_id]);
        }

        // Update target kuartal hanya jika ada perubahan
        if (target_kuartal) {
            const query2 = `UPDATE program SET target_kuartal = ? WHERE program_id = ?`;
            await queryPromise(query2, [target_kuartal, program_id]);
        }

        // Update diskon hanya jika ada perubahan
        if (discount) {
            const query3 = `UPDATE program_discount SET discount = ? WHERE program_id = ?`;
            await queryPromise(query3, [discount, program_id]);
        }

        // Update cashback hanya jika ada perubahan
        const cashbackQueries = [];
        if (cashback) {
            for (const ukuran in cashback) {
                const amount = cashback[ukuran];
                if (amount) {
                    const query4 = `
                        UPDATE program_cashback pc
                        JOIN produk pr ON pc.produk_id = pr.produk_id
                        SET pc.cashback_amount = ?
                        WHERE pc.program_id = ? AND pr.ukuran_produk = ?
                    `;
                    cashbackQueries.push(queryPromise(query4, [amount, program_id, ukuran]));
                }
            }
        }

        await Promise.all(cashbackQueries);

        res.json({ message: 'Data program berhasil diperbarui' });
    } catch (error) {
        console.error('Error updating program:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// DATA TOKO PER WILAYAH
async function dataToko(req, res) {
    const { wilayah } = req.params;

    try {
        const salesQuery = 'SELECT nama_sales FROM sales WHERE wilayah_tugas = ?';
        const tokoQuery = `
            SELECT 
                users.customer_id,
                users.nama_toko, 
                users.alamat_toko, 
                users.no_telp, 
                users.jenis_toko, 
                program.category AS kategori_program, 
                program.program_name AS program, 
                program.target_kuartal AS target
            FROM users
            LEFT JOIN users_program ON users.customer_id = users_program.customer_id
            LEFT JOIN program ON users_program.program_id = program.program_id
            WHERE users.wilayah_toko = ?`;

        const sales = await queryPromise(salesQuery, [wilayah]);
        const toko = await queryPromise(tokoQuery, [wilayah]);

        res.json({
            success: true,
            sales: sales[0]?.nama_sales || 'Sales tidak ditemukan',
            toko: toko || [],
        });
    } catch (err) {
        console.error('Error fetching data:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
}

//MENDAPATKAN WILAYAH===================
async function getWilayah(req, res) {
    try {
        const [rows] = await db.promise().query('SELECT DISTINCT wilayah_toko FROM orders');
        res.json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error('Error fetching wilayah:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.',
        });
    }
}


// RIWAYAT TRANSAKSI TOKO
async function riwayatTransaksi(req, res) {
    const { bulan, tahun, namaToko, wilayah } = req.query;

    if (!tahun) {
        return res.status(400).json({
            success: false,
            message: 'Tahun harus diisi!',
        });
    }

    try {
        let query = `
            SELECT 
                u.nama_toko AS nama_toko,
                DATE_FORMAT(o.order_date, '%d-%m-%Y') AS tanggal,
                SUM(CASE WHEN p.ukuran_produk = '330ml' THEN oi.quantity ELSE 0 END) AS ukuran_330ml,
                SUM(CASE WHEN p.ukuran_produk = '600ml' THEN oi.quantity ELSE 0 END) AS ukuran_600ml,
                SUM(CASE WHEN p.ukuran_produk = '1500ml' THEN oi.quantity ELSE 0 END) AS ukuran_1500ml,
                SUM(oi.quantity) AS jumlah_pesanan,
                o.final_amount AS jumlah_harga,
                os.status_name AS status
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            JOIN users u ON o.customer_id = u.customer_id
            JOIN order_status os ON o.status_id = os.status_id
            WHERE YEAR(o.order_date) = ?
              AND o.status_id = 5
        `;

        const params = [tahun];

        // 🔹 Filter bulan (jika bukan "all")
        if (bulan && bulan !== 'all') {
            query += ' AND MONTH(o.order_date) = ?';
            params.push(bulan);
        }

        // 🔹 Filter nama toko
        if (namaToko) {
            query += ' AND u.nama_toko LIKE ?';
            params.push(`%${namaToko}%`);
        }

        // 🔹 Filter wilayah
        if (wilayah) {
            query += ' AND u.wilayah_toko = ?';
            params.push(wilayah);
        }

        query += `
            GROUP BY o.order_id
            ORDER BY o.order_date DESC
        `;

        const [rows] = await db.promise().query(query, params);

        res.json({
            success: true,
            data: rows,
        });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server.',
        });
    }
}


//REPORT PENJUALAN==================================
async function salesReport(req, res) {
    try {
        const { month, year } = req.query;

        let query = `
            SELECT 
                COUNT(DISTINCT o.order_id) AS total_transaksi,
                SUM(oi.quantity) AS total_unit_terjual,
                SUM(CASE WHEN p.ukuran_produk = '330ml' THEN oi.quantity ELSE 0 END) AS total_330ml,
                SUM(CASE WHEN p.ukuran_produk = '600ml' THEN oi.quantity ELSE 0 END) AS total_600ml,
                SUM(CASE WHEN p.ukuran_produk = '1500ml' THEN oi.quantity ELSE 0 END) AS total_1500ml,
                SUM(o.final_amount) AS total_penjualan
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            WHERE o.status_id = 5
              AND YEAR(o.order_date) = ?
        `;

        const params = [year];

        if (month !== 'all') {
            query += ` AND MONTH(o.order_date) = ?`;
            params.push(month);
        }

        const [results] = await db.promise().query(query, params);
        res.json(results[0]);

    } catch (err) {
        console.error('Error fetching sales report:', err);
        res.status(500).json({ message: 'Failed to fetch sales report.' });
    }
}


//TOKO TERBAIK==================
async function topShop(req, res) {
    try {
        const { month, year } = req.query;

        let query = `
            SELECT 
                o.nama_toko,
                o.nama_sales,
                o.wilayah_toko,
                SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
                SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
                SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml,
                SUM(oi.quantity) AS total_quantity
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            WHERE o.status_id = 5
              AND YEAR(o.order_date) = ?
        `;

        const params = [year];

        if (month !== 'all') {
            query += ` AND MONTH(o.order_date) = ?`;
            params.push(month);
        }

        query += `
            GROUP BY o.nama_toko, o.nama_sales, o.wilayah_toko
            ORDER BY total_quantity DESC
            LIMIT 10
        `;

        const [rows] = await db.promise().query(query, params);
        res.json(rows);

    } catch (err) {
        console.error('Error fetching best shop data:', err);
        res.status(500).json({ message: 'Failed to fetch top shops.' });
    }
}


// EXPORT EXCELL
async function exportExcell(req, res) {
    try {
        const { month, year, status } = req.query;

        let query = `
            SELECT 
                o.order_id, 
                o.nama_toko, 
                o.wilayah_toko, 
                o.nama_sales, 
                DATE_FORMAT(o.order_date, '%Y-%m-%d') AS tanggal,
                SUM(CASE WHEN p.ukuran_produk = '330ml' THEN oi.quantity ELSE 0 END) AS ukuran_330ml,
                SUM(CASE WHEN p.ukuran_produk = '600ml' THEN oi.quantity ELSE 0 END) AS ukuran_600ml,
                SUM(CASE WHEN p.ukuran_produk = '1500ml' THEN oi.quantity ELSE 0 END) AS ukuran_1500ml,
                SUM(oi.quantity) AS jumlah_pesanan, 
                SUM(oi.total) AS jumlah_harga,
                s.status_name AS status
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            JOIN order_status s ON o.status_id = s.status_id
            WHERE YEAR(o.order_date) = ?
        `;

        const params = [year];

        if (status && status !== 'all') {
            query += ` AND s.status_name = ?`;
            params.push(status);
        }

        query += `
            GROUP BY o.order_id, o.nama_toko, o.wilayah_toko, 
                     o.nama_sales, o.order_date, s.status_name
            ORDER BY o.order_date ASC
        `;

        const [salesData] = await db.promise().query(query, params);

        if (salesData.length === 0) {
            return res.status(404).json({ error: 'Tidak ada data' });
        }

        // ================= EXCEL (LANJUTKAN KODE KAMU TANPA DIUBAH) =================
        const monthNames = [
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        const namaBulan = month === 'all'
            ? 'Semua Bulan'
            : monthNames[parseInt(month)];

        const namaStatus = status === 'all'
            ? 'Semua Status'
            : status;

       // Buat workbook dan worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Penjualan'); // ← WAJIB ADA

        const reportTitle = `Laporan Penjualan Nestle Pure Life - ${namaBulan} ${year} - ${namaStatus}`;

        worksheet.mergeCells('A1:K2');
        const titleRow = worksheet.getCell('A1');
        titleRow.value = reportTitle;
        titleRow.font = { size: 18, bold: true };
        titleRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Definisi Header dengan 'Order ID' sebagai kolom pertama
        const headers = [
            'Order ID', 'Nama Toko', 'Wilayah Toko', 'Nama Sales', 'Tanggal',
            '330ml', '600ml', '1500ml', 'Total Pesanan', 'Total Harga', 'Status'
        ];
        const headerRow = worksheet.addRow([]);
        headerRow.values = headers;
        headerRow.number = 5;

        // Freeze header agar tidak ikut scroll
        worksheet.views = [
            { state: 'frozen', ySplit: 5 }
        ];

        // Styling header (tebal, tengah, warna latar biru)
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Putih
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0070C0' } }; // Biru
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Tambahkan data ke worksheet dengan menyisipkan order_id pada kolom pertama
        salesData.forEach((item) => {
            const row = worksheet.addRow([
                item.order_id, // Menambahkan order_id pada kolom pertama
                item.nama_toko, item.wilayah_toko, item.nama_sales, item.tanggal,
                item.ukuran_330ml, item.ukuran_600ml, item.ukuran_1500ml,
                item.jumlah_pesanan, item.jumlah_harga, item.status
            ]);

            // Atur border untuk tiap sel data
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Format angka untuk total harga agar menjadi format mata uang
            row.getCell(10).numFmt = '"RP"#,##0'; // Menambahkan "RP" di depan total harga
        });

        // **Perbaikan AutoFit Kolom**
        worksheet.columns.forEach((column, index) => {
            if (headers[index]) { // Cek apakah header ada
                column.width = headers[index].length < 12 ? 12 : headers[index].length + 5;
            } else {
                column.width = 12; // Default jika tidak ada header
            }
        });

        // Memperlebar kolom Nama Toko 2x lipat dari kolom lainnya
        worksheet.getColumn(2).width = worksheet.getColumn(2).width * 2; // Menambah lebar kolom Nama Toko 2x lipat

        // Memperlebar kolom Nama Sales 3x lipat dari kolom lainnya
        worksheet.getColumn(4).width = 35; // Nama Sales lebih lebar 3x lipat

        // Atur response header untuk download file Excel
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        const fileName = reportTitle
            .replace(/\s+/g, '_')        // spasi jadi _
            .replace(/[\/\\?%*:|"<>]/g, ''); // hapus karakter ilegal

        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${fileName}.xlsx`
        );


        // Kirim file Excel sebagai response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Gagal membuat laporan Excel');
    }
}

async function getReportData(req, res) {
    try {
        const { month, year, status } = req.query;

        let query = `
            SELECT 
                o.order_id,
                o.nama_toko,
                o.wilayah_toko,
                o.nama_sales,
                DATE_FORMAT(o.order_date, '%Y-%m-%d') AS tanggal,
                SUM(oi.quantity) AS jumlah_pesanan,
                SUM(oi.total) AS jumlah_harga,
                s.status_name AS status
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN order_status s ON o.status_id = s.status_id
            WHERE YEAR(o.order_date) = ?
        `;

        const params = [year];

        if (month !== 'all') {
            query += ` AND MONTH(o.order_date) = ?`;
            params.push(month);
        }

        if (status !== 'all') {
            query += ` AND s.status_name = ?`;
            params.push(status);
        }

        query += `
            GROUP BY o.order_id
            ORDER BY o.order_date ASC
        `;

        const [data] = await db.promise().query(query, params);
        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal mengambil data" });
    }
}


//KURIR//=============================
async function getDataPengiriman(req, res) {
    try {

        const query = `
            SELECT 
            o.order_id,
            o.nama_toko,
            o.no_telp,
            s.status_name AS status,
            o.bukti_kirim,

            SUM(CASE WHEN p.ukuran_produk = '330ml' THEN oi.quantity ELSE 0 END) AS ukuran_330ml,
            SUM(CASE WHEN p.ukuran_produk = '600ml' THEN oi.quantity ELSE 0 END) AS ukuran_600ml,
            SUM(CASE WHEN p.ukuran_produk = '1500ml' THEN oi.quantity ELSE 0 END) AS ukuran_1500ml

            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN produk p ON oi.product_id = p.produk_id
            JOIN order_status s ON o.status_id = s.status_id

            WHERE s.status_name IN ('Dikirim', 'Terkirim')

            GROUP BY o.order_id
            ORDER BY o.order_date ASC;
        `;
     
        const [data] = await db.promise().query(query);

        res.json(data);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data pengiriman"
        });
    }
}

// ======================
// CONTROLLER (STYLE SAMA SEPERTI KAMU)
// ======================
async function uploadBukti(req, res) {
    try {
        const { orderId } = req.params;

        if (!req.file) {
            return res.status(400).json({
                message: "File tidak ditemukan"
            });
        }

        const filePath = '/uploads/bukti_kirim/' + req.file.filename;

        await db.promise().query(
            `UPDATE orders 
             SET bukti_kirim = ?, 
                 tanggal_kirim = NOW(),
                 status_id = 7 
             WHERE order_id = ?`,
            [filePath, orderId]
        );

        res.json({
            message: "Bukti kirim berhasil diupload",
            filePath
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'hasilUpload/uploads/bukti_kirim/');
    },
    filename: function (req, file, cb) {
        const uniqueName =
            'order_' +
            req.params.orderId +
            '_' +
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('File harus berupa gambar (jpg/png)'));
        }
    }
});

//Ambil data kurir=============
async function getProfilKurir(req, res) {

    try {

        const customerId = req.user.customer_id;

        const [rows] = await db.promise().query(
            `SELECT nama_lengkap, no_telp
             FROM users
             WHERE customer_id = ?
             AND role = 'kurir'`,
            [customerId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Data kurir tidak ditemukan"
            });
        }

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}

//Ambil statistik kurir=============
async function getStatistikPengiriman(req, res) {
    try {

        const [rows] = await db.promise().query(`
            SELECT 
                COUNT(CASE 
                    WHEN DATE(tanggal_kirim) = CURDATE() 
                    THEN 1 
                END) AS total_hari_ini,

                COUNT(CASE 
                    WHEN MONTH(tanggal_kirim) = MONTH(CURDATE())
                    AND YEAR(tanggal_kirim) = YEAR(CURDATE())
                    THEN 1 
                END) AS total_bulan_ini

            FROM orders
            WHERE bukti_kirim IS NOT NULL
        `);

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan server"
        });
    }
}


//EXPORT DATA KE ROUTER===============
module.exports = {
    dataOrder, invoiceOrder, checkInvoice, processOrder, shipOrder,
    priceProduct, priceUpdate, stockProduct, updateStock,
    monitoringProgram, getProgramsByCategory,
    getProgramDetails, updateProgram, dataToko, getWilayah, riwayatTransaksi,
    salesReport, topShop, exportExcell, getReportData,
    getDataPengiriman, uploadBukti, upload, getProfilKurir, getStatistikPengiriman
};
