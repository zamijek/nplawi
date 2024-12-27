//MEMUNCULKAN MENU DASHBOARD YANG DIKLIK
//Dashboard  User DAN ADMIN
function showContent(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const selectedSection = document.getElementById(sectionId);
    selectedSection.style.display = 'block';

    // Update active menu
    const menuLinks = document.querySelectorAll('.dashboard-menu a');
    menuLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[onclick="showContent('${sectionId}')"]`).classList.add('active');
}

//LOGOUT===================
async function handleLogout() {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage
    if (!token) {
        alert('Anda sudah logout atau tidak memiliki token.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // Kirim token di header Authorization
            },
        });

        if (response.ok) {
            localStorage.removeItem('token'); // Hapus token dari localStorage
            alert('Logout berhasil!');
            window.location.href = '/login.html'; // Arahkan ke halaman login
        } else {
            const errorData = await response.json();
            console.error('Error logout:', errorData.message);
            alert('Gagal logout: ' + errorData.message);
        }
    } catch (error) {
        console.error('Kesalahan jaringan:', error);
        alert('Terjadi kesalahan saat logout.');
    }
}


//JS ADMIN
// Fungsi untuk mendapatkan harga produk dari API
async function fetchPrices() {
    try {
        const response = await fetch('/admin/prices');  // Sesuaikan URL API
        if (!response.ok) {
            throw new Error('Gagal memuat harga produk');
        }

        const prices = await response.json();
        
        // Memperbarui harga pada setiap span
        prices.forEach(price => {
            const productId = price.id;
            const priceValue = price.harga;
            const priceSpan = document.getElementById(`previousPriceItem${productId}`);

            // Memperbarui harga yang ditampilkan di span
            if (priceSpan) {
                priceSpan.textContent = `(Sebelumnya: Rp ${priceValue.toLocaleString()})`;  // Format angka dengan pemisah ribuan
            }
        });
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

// Panggil fungsi untuk memuat harga saat halaman dimuat
window.onload = fetchPrices;


