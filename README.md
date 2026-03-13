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

### 🏠 Homepage

#### Halaman Home
![Home](screenshots/home.png)

#### Halaman Login
![Login](screenshots/login.png)

#### Halaman Produk
![Product](screenshots/product.png)

---

## 👤 Tampilan Pelanggan

#### Dashboard Pelanggan
![Pelanggan 1](screenshots/pelanggan1.png)

#### Halaman Pemesanan
![Pelanggan 2](screenshots/pelanggan2.png)

#### Detail Pesanan
![Pelanggan 3](screenshots/pelanggan3.png)

#### Status Pesanan
![Pelanggan 4](screenshots/pelanggan4.png)

---

## 🛠 Tampilan Admin

#### Manajemen Pesanan
![Admin 1](screenshots/admin1.png)

#### Monitoring Program
![Admin 2](screenshots/admin2.png)

#### Manajemen Toko
![Admin 3](screenshots/admin3.png)

#### Laporan Penjualan
![Admin 4](screenshots/admin4.png)

#### Cetak Invoice
![Admin 5](screenshots/invoice.png)

---

## 🏢 Tampilan Kepala Cabang

#### Monitoring Pesanan
![Kepala Cabang 1](screenshots/kepalacabang1.png)

#### Laporan Pesanan
![Kepala Cabang 2](screenshots/kepalacabang2.png)

#### Detail Data Pesanan
![Kepala Cabang 3](screenshots/kepalacabang3.png)

#### Statistik Pesanan
![Kepala Cabang 4](screenshots/kepalacabang4.png)

---

## 🚚 Tampilan Kurir

#### Daftar Pengiriman
![Kurir 1](screenshots/kurir1.png)

#### Informasi Kurir
![Kurir 2](screenshots/kurir2.png)
