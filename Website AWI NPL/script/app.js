// Fungsi untuk mengupdate tombol berdasarkan status login
function updateAuthButton() {
    const token = localStorage.getItem('token');
    const authButton = document.getElementById('auth-btn');

    if (token) {
        // Jika ada token, berarti user sudah login, tampilkan tombol logout
        authButton.textContent = 'Logout';
    } else {
        // Jika tidak ada token, berarti user belum login, tampilkan tombol login
        authButton.textContent = 'Login';
    }
}

// Fungsi untuk menangani klik tombol login/logout
function handleAuthButton() {
    const token = localStorage.getItem('token');

    if (token) {
        // Jika sudah login (ada token), logout
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        alert('Logout berhasil!');
        window.location.href = 'index.html'; // Redirect ke halaman utama atau halaman lain
    } else {
        // Jika belum login, arahkan ke halaman login
        window.location.href = 'login.html';
    }
}

// Update tombol ketika halaman dimuat
updateAuthButton();
