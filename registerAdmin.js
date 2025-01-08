const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // Koneksi database
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET; // Gunakan file .env untuk menyimpan kunci rahasia

const registerAdmin = async (adminData) => {
    const {
        nama_lengkap,
        ttl,
        alamat,
        no_telp,
        email,
        password,
        nama_toko,
        alamat_toko,
        wilayah_toko,
        jenis_toko,
        sales_id,
    } = adminData;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate token
        const token = jwt.sign({ email, role: 'admin' }, SECRET_KEY, { expiresIn: '1d' });

        // Simpan data ke database
        const sql = `
            INSERT INTO users ( nama_lengkap, ttl, alamat, no_telp, email, password, 
                               nama_toko, alamat_toko, wilayah_toko, jenis_toko, role, sales_id, reset_token, token_expiry, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?, NULL, NULL, NOW())
        `;

        // Gunakan db.promise().query untuk menjalankan query
        await db.promise().query(sql, [
            nama_lengkap,
            ttl,
            alamat,
            no_telp,
            email,
            hashedPassword,
            nama_toko,
            alamat_toko,
            wilayah_toko,
            jenis_toko,
            sales_id,
        ]);

        console.log(`Akun admin untuk email ${email} berhasil didaftarkan.`);
        console.log(`Token: ${token}`);
    } catch (err) {
        console.error('Gagal mendaftarkan akun admin:', err.message);
    }
};

// Contoh penggunaan
const adminData = {
    nama_lengkap: 'Admin Toko',
    ttl: 'Jakarta, 30-12-2024',
    alamat: 'Jl. Contoh No. 123',
    no_telp: '0863233321233',
    email: 'admin@contoh.com',
    password: '123', // Password acak
    nama_toko: 'Toko Admin',
    alamat_toko: 'Jl. Toko Admin',
    wilayah_toko: 'Wilayah Timur',
    jenis_toko: 'retail',
    sales_id: null, // Null jika tidak ada sales
};

// Jalankan fungsi
registerAdmin(adminData);

