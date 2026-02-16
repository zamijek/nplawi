// File utama aplikasi
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const path = require('path');
const cors = require('cors');

// Tambahkan ini untuk mengaktifkan scheduler
require('./jobs/orderScheduler');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userMenuRoutes = require('./routes/userMenuRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Inisialisasi server
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', userMenuRoutes);

// Menyajikan file statis
app.use(express.static(path.join(__dirname, 'Website AWI NPL')));
app.use('/images', express.static('Website AWI NPL/gambar'));
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'Website AWI NPL', 'resetpassword.html'));
});
app.use('/uploads', express.static('hasilUpload/uploads'));

// Middleware untuk menangani error
app.use(errorHandler);

// Jalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
