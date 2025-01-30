const db = require('../config/db');
const PDFDocument = require('pdfkit');
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
      SELECT 
    o.order_id,
    o.nama_toko,
    o.order_date,
    os.status_name,
    SUM(oi.quantity) AS total_quantity,
    SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
    SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
    SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN produk p ON oi.product_id = p.produk_id
JOIN order_status os ON o.status_id = os.status_id
WHERE os.status_name NOT IN ('Selesai', 'Dibatalkan') -- Filter status 'Selesai' dan 'Dibatalkan'
GROUP BY 
    o.order_id, 
    o.nama_toko, 
    o.order_date, 
    os.status_name
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

        // Jika invoice sudah dicetak, lanjutkan dengan mencetak ulang
        const doc = new PDFDocument();

        // Fungsi format Rupiah
        function formatRupiah(value) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
        }

        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.fontSize(22).text(`Invoice Pesanan`, { align: 'center' }).moveDown(1);
        doc.font('Helvetica').fontSize(14)
            .text(`Order ID: ${order.order_id}`)
            .text(`Nama Toko: ${order.nama_toko}`)
            .text(`Tanggal Pemesanan: ${new Date(order.order_date).toLocaleString()}`)
            .text(`Wilayah: ${order.wilayah_toko}`)
            .text(`Alamat: ${order.alamat_pengiriman}`)
            .text(`Nomor Telepon: ${order.no_telp}`)
            .moveDown(1)
            .text(`--- Detail Pesanan ---`)
            .text(`Nestlé Pure Life 330ml: ${order.quantity_330ml} karton`)
            .text(`Nestlé Pure Life 600ml: ${order.quantity_600ml} karton`)
            .text(`Nestlé Pure Life 1500ml: ${order.quantity_1500ml} karton`)
            .moveDown(1)
            .text(`Total Jumlah: ${order.total_quantity} karton`)
            .text(`Total Harga: ${formatRupiah(order.total_amount)}`)
            .text(`Diskon: ${formatRupiah(order.discount)}`)
            .text(`Total Bayar: ${formatRupiah(order.final_amount)}`)
            .moveDown(1)
            .text(`Nama Sales: ${order.nama_sales}`)
            .moveDown(2)
            .font('Helvetica-Bold').text(`Catatan:`, { underline: true })
            .font('Helvetica').text(order.note || 'Tidak ada catatan.')
            .moveDown(2)
            .text(`Terima kasih atas pesanan Anda!`, { align: 'center' });

        doc.pipe(res);
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
            return res.status(400).json({ message: 'Beberapa pesanan sudah tidak dapat diproses (status bukan "Menunggu Pembayaran").' });
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
            return res.status(400).json({ message: 'Beberapa pesanan sudah tidak dapat dikirim (status bukan "Diproses").' });
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

    if (!bulan || !tahun) {
        return res.status(400).json({
            success: false,
            message: 'Bulan dan tahun harus diisi!',
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
            WHERE MONTH(o.order_date) = ?
            AND YEAR(o.order_date) = ?
            AND o.status_id = 5
        `;

        const params = [bulan, tahun];

        // Tambahkan filter nama toko jika ada
        if (namaToko) {
            query += ' AND u.nama_toko LIKE ?';
            params.push(`%${namaToko}%`);
        }

        // Tambahkan filter wilayah jika ada
        if (wilayah) {
            query += ' AND u.wilayah_toko = ?';
            params.push(wilayah);
        }

        query += ' GROUP BY o.order_id ORDER BY o.order_date DESC';

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

        const query = `
            SELECT 
                COUNT(DISTINCT o.order_id) AS total_transaksi,
                SUM(oi.quantity) AS total_unit_terjual,
                SUM(CASE WHEN p.ukuran_produk = '330ml' THEN oi.quantity ELSE 0 END) AS total_330ml,
                SUM(CASE WHEN p.ukuran_produk = '600ml' THEN oi.quantity ELSE 0 END) AS total_600ml,
                SUM(CASE WHEN p.ukuran_produk = '1500ml' THEN oi.quantity ELSE 0 END) AS total_1500ml,
                SUM(o.final_amount) AS total_penjualan
            FROM 
                orders o
            JOIN 
                order_items oi ON o.order_id = oi.order_id
            JOIN 
                produk p ON oi.product_id = p.produk_id
            WHERE 
                o.status_id = 5 
                AND MONTH(o.order_date) = ? 
                AND YEAR(o.order_date) = ?
        `;

        const [results] = await db.promise().query(query, [month, year]);
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

        const query = `
            SELECT 
                o.nama_toko,
                o.nama_sales,
                o.wilayah_toko,
                SUM(CASE WHEN p.produk_id = 1 THEN oi.quantity ELSE 0 END) AS quantity_330ml,
                SUM(CASE WHEN p.produk_id = 2 THEN oi.quantity ELSE 0 END) AS quantity_600ml,
                SUM(CASE WHEN p.produk_id = 3 THEN oi.quantity ELSE 0 END) AS quantity_1500ml,
                SUM(oi.quantity) AS total_quantity
            FROM 
                orders o
            JOIN 
                order_items oi ON o.order_id = oi.order_id
            JOIN 
                produk p ON oi.product_id = p.produk_id
            WHERE 
                MONTH(o.order_date) = ? 
                AND YEAR(o.order_date) = ?
                AND o.status_id = 5
            GROUP BY 
                o.nama_toko, o.nama_sales, o.wilayah_toko
            ORDER BY 
                total_quantity DESC
            LIMIT 10
        `;

        const [rows] = await db.promise().query(query, [month, year]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching best shop data:', err);
        res.status(500).json({ message: 'Failed to fetch top shops.' });
    }
}


module.exports = {
    dataOrder, invoiceOrder, checkInvoice, processOrder, shipOrder,
    priceProduct, priceUpdate, stockProduct, updateStock,
    monitoringProgram, getProgramsByCategory,
    getProgramDetails, updateProgram, dataToko, getWilayah, riwayatTransaksi,
    salesReport, topShop
};
