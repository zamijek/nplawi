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



module.exports = { getPrograms, registerProgram, getRegisteredPrograms, getAccountData, updateAccountData };
