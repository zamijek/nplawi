# NPLAWI - Sistem Informasi Manajemen Pemesanan

## 📌 Deskripsi Project
NPLAWI merupakan sistem informasi berbasis web yang dirancang untuk membantu proses manajemen pemesanan produk secara terstruktur mulai dari pemesanan oleh pelanggan hingga pengelolaan pesanan oleh admin.

Sistem ini dibuat untuk meningkatkan efisiensi pengelolaan pesanan, memantau status pesanan, serta memudahkan proses pencatatan transaksi secara digital.

Project ini dikembangkan sebagai bagian dari rancang bangun sistem informasi.

---

## 🎯 Tujuan Project
Tujuan dari pengembangan sistem ini adalah:

- Mempermudah proses pemesanan produk
- Mengelola data pesanan secara terstruktur
- Memantau status pesanan secara real-time
- Membantu admin dalam mengelola transaksi dan pesanan pelanggan

---

## ⚙️ Teknologi yang Digunakan

Backend
- Node.js
- Express.js

Frontend
- HTML
- CSS
- JavaScript

Database
- MySQL

Tools
- Git
- GitHub

---

## 👤 Role Pengguna

Sistem memiliki beberapa role pengguna:

### 1️⃣ User
Fitur yang tersedia:
- Melihat daftar produk
- Melakukan pemesanan produk
- Mengisi data pengiriman
- Melihat status pesanan

### 2️⃣ Admin
Fitur yang tersedia:
- Mengelola data produk
- Mengelola data pesanan
- Memproses pesanan
- Mengubah status pesanan
- Mencetak invoice pesanan

---

## 🔄 Alur Sistem

1. User melihat produk yang tersedia
2. User melakukan pemesanan produk
3. Sistem menyimpan data pesanan ke database
4. Admin menerima pesanan berdasarkan metode FCFS (First Come First Served)
5. Admin memproses pesanan
6. Status pesanan diperbarui hingga selesai

---

## 🗄️ Struktur Database

Beberapa tabel utama yang digunakan:

- `orders`
- `order_items`
- `products`
- `order_status`

Relasi utama:
- `orders` terhubung dengan `order_items`
- `orders` terhubung dengan `order_status`
- `order_items` terhubung dengan `products`

---

## 📷 Tampilan Sistem
Tambahkan screenshot di sini jika ada:

- Halaman produk
- Halaman pemesanan
- Dashboard admin
- Manajemen pesanan

---
