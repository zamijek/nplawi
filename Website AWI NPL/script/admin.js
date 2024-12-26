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

//JS ADMIN
// Function to filter orders based on search criteria
function filterOrders() {
    const store = document.getElementById('search-store').value.toLowerCase();
    const date = document.getElementById('search-date').value;
    const status = document.getElementById('search-status').value;

    const rows = document.querySelectorAll('.orders-table tbody tr');
    rows.forEach((row) => {
        const storeName = row.cells[0].innerText.toLowerCase();
        const orderDate = row.cells[2].innerText;
        const orderStatus = row.cells[3].innerText.toLowerCase();

        // Hide rows that do not match search criteria
        const matchesStore = storeName.includes(store);
        const matchesDate = !date || orderDate.includes(date);
        const matchesStatus = !status || orderStatus.includes(status);

        if (matchesStore && matchesDate && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Function to update the status of an order
function updateOrderStatus(selectElement) {
    const status = selectElement.value;
    const row = selectElement.closest('tr');
    const statusSpan = row.querySelector('.status');

    // Update the status text and class based on selected value
    statusSpan.innerText = status.charAt(0).toUpperCase() + status.slice(1);
    statusSpan.className = 'status ' + status;
}

// Function to update stock
function updateStock() {
    const item = document.getElementById('stock-item').value;
    const quantity = document.getElementById('stock-quantity').value;

    if (item && quantity) {
        // Add the stock update logic here (send data to server or update UI)
        alert(`Stok untuk ${item} telah diperbarui sebanyak ${quantity} karton.`);
    } else {
        alert('Harap lengkapi semua informasi.');
    }
}

// Function to create or update promo
function createOrUpdatePromo() {
    const promoName = document.getElementById('promo-name').value;
    const promoType = document.getElementById('promo-type').value;
    const promoTarget = document.getElementById('promo-target').value;
    const promoStartDate = document.getElementById('promo-start-date').value;
    const promoEndDate = document.getElementById('promo-end-date').value;

    if (promoName && promoTarget && promoStartDate && promoEndDate) {
        // Add the promo creation or update logic here
        alert(`Program ${promoName} telah disimpan.`);
    } else {
        alert('Harap lengkapi semua informasi program.');
    }
}

// Function to add admin
function addAdmin() {
    // Implement add admin functionality here
    alert('Admin baru telah ditambahkan.');
}

// Function to manage admin
function manageAdmin() {
    // Implement manage admin functionality here
    alert('Pengaturan admin telah dikelola.');
}

// Initialize the dashboard to show the overview section by default
document.addEventListener('DOMContentLoaded', () => {
    showContent('overview');
});


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
