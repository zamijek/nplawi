const db = require('../config/db');  // Import koneksi database
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
async function registerProgram (req, res) {
    const { programId } = req.body;
    const userId = req.user?.id;  // Pastikan Anda memiliki middleware untuk otentikasi pengguna

    if (!programId) {
        return res.status(400).json({ message: 'Program ID tidak ditemukan.' });
    }

    try {
        // Pastikan program dengan ID yang diberikan ada
        const program = await queryPromise('SELECT * FROM program WHERE program_id = ?', [programId]);

        if (program.length === 0) {
            return res.status(404).json({ message: 'Program tidak ditemukan.' });
        }

        // Pastikan pengguna belum terdaftar pada program ini
        const existingRegistration = await queryPromise(
            'SELECT * FROM users_program WHERE customer_id = ? AND program_id = ?',
            [userId, programId]
        );

        if (existingRegistration.length > 0) {
            return res.status(400).json({ message: 'Anda sudah terdaftar pada program ini.' });
        }

        // Insert data pendaftaran ke tabel user_programs
        await queryPromise('INSERT INTO users_program (customer_id, program_id) VALUES (?, ?)', [userId, programId]);

        res.status(201).json({ message: 'Berhasil mendaftar program.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mendaftarkan program.' });
    }
};

//MENAMPILKAN PROGRAM YANG DIDAFTARKAN
async function getUserPrograms (req, res) {
    const userId = req.user.id; // Ambil ID pengguna dari autentikasi

    try {
        // Ambil program yang diikuti pengguna
        const userPrograms = await queryPromise(
            `SELECT p.program_id, p.program_name, p.description 
             FROM users_program up
             JOIN program p ON up.program_id = p.program_id
             WHERE up.customer_id = ?`,
            [userId]
        );

        res.status(200).json(userPrograms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil program.' });
    }
};


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
            name: results[0].full_name,
            birth: results[0].birth_date, // Pastikan kolom sesuai dengan database
            email: results[0].email,
            phone: results[0].phone_number,
            address: results[0].address,
            shopName: results[0].shop_name,
            shopAddress: results[0].shop_address,
        };

        res.json(user); // Mengirimkan data pengguna
    } catch (err) {
        console.error('Error querying the database:', err.stack);
        return res.status(500).json({ message: 'Database query error' });
    }
}


// // Fungsi untuk memperbarui data akun pengguna
// async function updateAccountData(req, res) {
//     const { customer_id, nama_lengkap, ttl, email, no_telp, nama_toko, alamat_toko } = req.body;

//     const query = `
//         UPDATE users 
//         SET nama_lengkap = ?, ttl = ?, email = ?, no_telp = ?, nama_toko = ?, alamat_toko = ?, 
//         WHERE user_id = ?
//     `;

//     try {
//         await queryPromise(query, [nama_lengkap, ttl, email, no_telp, nama_toko, alamat_toko, customer_id]);

//         res.json({ success: true });
//     } catch (err) {
//         console.error('Error updating the database:', err.stack);
//         return res.status(500).json({ message: 'Database update error' });
//     }
// }


module.exports = { getPrograms, registerProgram, getUserPrograms, getAccountData };
