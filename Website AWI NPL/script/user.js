//LOGOUT=====================
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
                'Authorization': `Bearer ${token}`, // Kirim token di header Authorization
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

// //BUAT PEMESANAN
let cart = []; // Menyimpan item di keranjang
let totalCartons = 0; // Total jumlah karton
let totalPrice = 0; // Total harga

// Fungsi untuk memperbarui keranjang
function updateCart(name, cartonsPerOrder, pricePerOrder, quantity) {
    quantity = parseInt(quantity); // Konversi input menjadi angka
    if (isNaN(quantity) || quantity < 0) quantity = 0; // Validasi input

    // Cari produk di keranjang
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        // Perbarui total jika jumlah sebelumnya lebih besar
        totalCartons -= existingItem.totalCartons;
        totalPrice -= existingItem.totalPrice;

        if (quantity === 0) {
            // Hapus item dari keranjang jika jumlah 0
            cart = cart.filter(item => item.name !== name);
        } else {
            // Perbarui jumlah
            existingItem.quantity = quantity;
            existingItem.totalCartons = quantity * cartonsPerOrder;
            existingItem.totalPrice = quantity * pricePerOrder;
        }
    } else if (quantity > 0) {
        // Tambahkan produk ke keranjang jika belum ada
        cart.push({
            name,
            quantity,
            totalCartons: quantity * cartonsPerOrder,
            totalPrice: quantity * pricePerOrder
        });
    }

    // Perbarui total
    totalCartons = cart.reduce((sum, item) => sum + item.totalCartons, 0);
    totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    renderCart();
}

// Fungsi untuk menampilkan isi keranjang
function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const totalCartonsElement = document.getElementById("total-cartons");
    const totalPriceElement = document.getElementById("total-price");
    const checkoutButton = document.getElementById("checkout-button");

    // Kosongkan keranjang sebelumnya
    cartItems.innerHTML = "";

    // Tampilkan isi keranjang
    cart.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
              ${item.name} - ${item.quantity} pesanan (${item.totalCartons} karton) 
              (Rp ${item.totalPrice.toLocaleString()})
          `;
        cartItems.appendChild(li);
    });

    // Perbarui total
    totalCartonsElement.textContent = totalCartons;
    totalPriceElement.textContent = totalPrice.toLocaleString();

    // Aktifkan tombol checkout jika total ≥ 40 karton
    checkoutButton.disabled = totalCartons < 40;
}

// Fungsi untuk checkout
function checkout() {
    if (totalCartons >= 40) {
        alert(`Pesanan berhasil! Total harga: Rp ${totalPrice.toLocaleString()}`);
        // Reset keranjang
        cart = [];
        totalCartons = 0;
        totalPrice = 0;
        renderCart();
        document.querySelectorAll('input[type="number"]').forEach(input => input.value = 0); // Reset input
    } else {
        alert("Minimal total pembelian adalah 40 karton!");
    }
}

// Panggil ini setelah checkout berhasil
function checkout() {
    if (totalCartons >= 40) {
        alert(`Pesanan berhasil! Total harga: Rp ${totalPrice.toLocaleString()}`);
        // Reset keranjang
        cart = [];
        totalCartons = 0;
        totalPrice = 0;
        renderCart();
        document.querySelectorAll('input[type="number"]').forEach(input => input.value = 0); // Reset input

        // Tampilkan status pemesanan
        showOrderStatus();
    } else {
        alert("Minimal total pembelian adalah 40 karton!");
    }
}

//STATUS PESANAN


//PROGRAM=====================================
// Tampilkan pilihan program saat link diklik
function showProgramOptions() {
    event.preventDefault(); // Hindari navigasi default
    document.getElementById("programOptions").style.display = "block";
}

// Tampilkan pilihan program berdasarkan kategori yang dipilih
document.getElementById('categoryOption').addEventListener('change', function () {
    const category = this.value;
    const programOption = document.getElementById('programOption');

    // Tampilkan indikator loading
    programOption.innerHTML = '<option value="" disabled>Memuat program...</option>';

    fetch(`http://localhost:3000/api/program?category=${category}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal mengambil data program.');
            }
            return response.json();
        })
        .then(data => {
            programOption.innerHTML = '<option value="" disabled selected>Pilih program</option>'; // Reset dropdown

            if (data.length === 0) {
                programOption.innerHTML = '<option value="" disabled>Tidak ada program tersedia</option>';
            } else {
                data.forEach(program => {
                    const option = document.createElement('option');
                    option.value = program.program_id;
                    option.textContent = `${program.program_name} - Target: ${program.target_kuartal} Karton`;
                    programOption.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            programOption.innerHTML = '<option value="" disabled>Gagal memuat program</option>';
            alert('Gagal memuat program. Silakan coba lagi.');
        });
});

//MENGIRIM DATA PENDAFTARAN
document.getElementById('programSelectionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const programId = document.getElementById('programOption').value;
    if (!programId) {
        alert('Pilih program terlebih dahulu!');
        return;
    }

    const token = localStorage.getItem('token');  // Ambil token dari localStorage
    if (!token) {
        alert('Token tidak ditemukan. Silakan login kembali.');
        return;
    }

    console.log('Token yang dikirim:', token);  // Cek apakah token valid

    try {
        const response = await fetch('http://localhost:3000/api/registerProgram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Pastikan format benar
            },
            body: JSON.stringify({ programId }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Berhasil mendaftar program baru!');
            window.location.reload(); // Refresh halaman setelah berhasil
        } else {
            alert(result.message || 'Gagal mendaftar program.');
        }
    } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan saat mendaftar program.');
    }
});

//MELIHAT PROGRAM YANG DIIKUTI
async function fetchRegisteredPrograms() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User ID tidak ditemukan. Silakan login kembali.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/registeredPrograms/${userId}`);
        if (!response.ok) throw new Error('Gagal memuat program yang didaftarkan.');

        const programs = await response.json();
        const programList = document.getElementById('registeredPrograms');
        programList.innerHTML = '';

        if (programs.length === 0) {
            programList.innerHTML = '<li>Belum ada program yang didaftarkan.</li>';
        } else {
            programs.forEach(program => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${program.program_name}</strong> (${program.category})<br>
                    Target Kuartal: ${program.target_kuartal}<br>
                    ${program.description}<br>
                    Terdaftar pada: ${new Date(program.created_at).toLocaleDateString()}
                `;
                programList.appendChild(listItem);
            });
        }
    } catch (error) {
        console.error('Error fetching registered programs:', error);
        alert('Terjadi kesalahan saat memuat program yang didaftarkan.');
    }
}

// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchRegisteredPrograms);

//EDIT INFORMASI AKUN
async function fetchAccountData(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/getAccount/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch account data.');

        const data = await response.json();

        if (data) {
            // Mengisi informasi akun di halaman
            document.getElementById('userName').textContent = data.name || '-';
            document.getElementById('userBirth').textContent = data.birth || '-';
            document.getElementById('userEmail').textContent = data.email || '-';
            document.getElementById('userNo').textContent = data.phone || '-';
            document.getElementById('userAddress').textContent = data.address || '-';
            document.getElementById('userShopName').textContent = data.shopName || '-';
            document.getElementById('userShopAddress').textContent = data.shopAddress || '-';
        }
    } catch (error) {
        console.error('Error fetching account data:', error);
        alert('Gagal memuat data akun.');
    }
}

// Dapatkan userId dari sesi/login dan panggil fungsi
const userId = localStorage.getItem('userId'); // Sesuaikan pengambilan userId
if (userId) {
    fetchAccountData(userId);
} else {
    alert('User ID tidak ditemukan. Silakan login kembali.');
}

//UPDATE AKUN============================
// Tampilkan form edit akun
function editAccount() {
    document.getElementById('akun').style.display = 'none';
    document.getElementById('editAccountSection').style.display = 'block';

    // Isi form dengan data saat ini
    document.getElementById('name').value = document.getElementById('userName').textContent;
    document.getElementById('birth').value = document.getElementById('userBirth').textContent;
    document.getElementById('email').value = document.getElementById('userEmail').textContent;
    document.getElementById('phone').value = document.getElementById('userNo').textContent;
    document.getElementById('address').value = document.getElementById('userAddress').textContent;
    document.getElementById('shopName').value = document.getElementById('userShopName').textContent;
    document.getElementById('shopAddress').value = document.getElementById('userShopAddress').textContent;
}

// Batalkan edit akun
function cancelEdit() {
    document.getElementById('editAccountSection').style.display = 'none';
    document.getElementById('akun').style.display = 'block';
}

// Simpan data akun yang diperbarui
async function saveAccount() {
    const updatedData = {
        name: document.getElementById('name').value,
        birth: document.getElementById('birth').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        shopName: document.getElementById('shopName').value,
        shopAddress: document.getElementById('shopAddress').value,
    };

    try {
        const response = await fetch(`http://localhost:3000/api/updateAccount/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) throw new Error('Failed to update account data.');

        alert('Data akun berhasil diperbarui!');
        location.reload(); // Muat ulang halaman untuk merefresh data
    } catch (error) {
        console.error('Error updating account data:', error);
        alert('Gagal memperbarui data akun.');
    }
}

//GANTI PASSWORD==========================
function toggleChangePasswordForm() {
    const section = document.getElementById('changePasswordSection');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Password baru dan konfirmasi password tidak cocok.');
        return;
    }

    try {
        const token = localStorage.getItem('token'); // Ambil token dari localStorage atau cookie
        const response = await fetch('http://localhost:3000/auth/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Kirim token di header
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Password berhasil diubah.');
            document.getElementById('changePasswordForm').reset();
        } else {
            alert(result.message || 'Gagal mengganti password.');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Terjadi kesalahan saat mengganti password.');
    }
}



