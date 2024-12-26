document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nama_lengkap: document.getElementById('nama-lengkap').value,
        ttl: document.getElementById('ttl').value,
        alamat: document.getElementById('alamat').value,
        no_telp: document.getElementById('no-telp').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        nama_toko: document.getElementById('nama-toko').value,
        alamat_toko: document.getElementById('alamat-toko').value,
        jenis_toko: document.getElementById('jenis-toko').value
    };

    try {
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.href = 'login.html'; // Redirect ke halaman login
        } else {
            alert(`Pendaftaran gagal: ${result.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat mendaftar.');
    }
});
