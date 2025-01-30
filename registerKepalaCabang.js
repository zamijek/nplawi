const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // Koneksi database
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET; // Gunakan file .env untuk menyimpan kunci rahasia

const registerKepalaCabang = async (kepalaCabangData) => {
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
    } = kepalaCabangData;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate token
        const token = jwt.sign({ email, role: 'kepalaCabang' }, SECRET_KEY, { expiresIn: '1d' });

        // Simpan data ke database
        const sql = `
            INSERT INTO users ( nama_lengkap, ttl, alamat, no_telp, email, password, 
                               nama_toko, alamat_toko, wilayah_toko, jenis_toko, role, sales_id, reset_token, token_expiry, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'kepalaCabang', ?, NULL, NULL, NOW())
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

        console.log(`Akun Kepala Cabang untuk email ${email} berhasil didaftarkan.`);
        console.log(`Token: ${token}`);
    } catch (err) {
        console.error('Gagal mendaftarkan akun kepala Cabang:', err.message);
    }
};

// Contoh penggunaan
const kepalaCabangData = {
    nama_lengkap: 'Kepala Cabang 1',
    ttl: 'Jakarta, 30-12-2024',
    alamat: 'Jl. Akasha Wira International',
    no_telp: '0863233321234',
    email: 'kepalacabang1@contoh.com',
    password: '123', // Password acak
    nama_toko: 'Akasha Wira International 1',
    alamat_toko: 'Jl. Akasha Wira International',
    wilayah_toko: 'Wilayah Timur',
    jenis_toko: 'retail',
    sales_id: null, // Null jika tidak ada sales
};

// Jalankan fungsi
registerKepalaCabang(kepalaCabangData);

