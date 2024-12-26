const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Sesuaikan dengan penyedia email (Gmail, Outlook, dll.)
    auth: {
        user: process.env.EMAIL_USER, // Email pengirim
        pass: process.env.EMAIL_PASSWORD, // Password aplikasi
    },
});

module.exports = transporter;
