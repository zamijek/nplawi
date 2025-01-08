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
                text: 'Selamat datang, ' + username + '!',
                showConfirmButton: false,
                timer: 1500
            });

            // Redirect sesuai role setelah beberapa detik
            setTimeout(() => {
                if (data.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            }, 1500);
        } else {
            // SweetAlert2 untuk error
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: data.message || 'Terjadi kesalahan saat login.',
            });
        }
    } catch (error) {
        console.error('Error:', error);

        // SweetAlert2 untuk kesalahan server
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Silakan coba lagi nanti.',
        });
    }
});
