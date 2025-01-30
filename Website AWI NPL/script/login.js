document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Simpan token ke localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role);

            // SweetAlert2 untuk sukses login
            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil!',
                html: `<b>Selamat datang, ${username}!</b><br>Akun Anda memiliki peran <i>${data.role}</i>.`,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                customClass: {
                    popup: 'swal-custom-popup', // Tambahkan kustom class jika diperlukan
                },
            });

            // Redirect sesuai role setelah beberapa detik
            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (data.role === 'kepalaCabang') {
                    window.location.href = 'kepalacabang.html';
                } else {
                    window.location.href = 'user.html';
                }
            }, 2000);
        } else {
            // SweetAlert2 untuk error login
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                html: `<b>${data.message || 'Username atau password salah.'}</b><br>Silakan coba lagi.`,
                confirmButtonText: 'Coba Lagi',
                customClass: {
                    confirmButton: 'swal-error-btn', // Tambahkan kustom class jika diperlukan
                },
            });
        }
    } catch (error) {
        console.error('Error:', error);

        // SweetAlert2 untuk kesalahan server
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Silakan coba lagi nanti.',
            footer: '<a href="support.html">Hubungi dukungan?</a>',
            confirmButtonText: 'Tutup',
            customClass: {
                confirmButton: 'swal-error-btn', // Tambahkan kustom class jika diperlukan
            },
        });
    }
});
