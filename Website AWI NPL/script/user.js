//LOGOUT==============================
async function handleLogout() {
    const token = localStorage.getItem('token'); // Ambil token dari localStorage
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Anda sudah logout',
            text: 'Tidak ada token yang ditemukan.',
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Logout Berhasil!',
                text: 'Anda telah berhasil keluar dari akun.',
                showConfirmButton: false,
                timer: 1500,
            });

            // Setelah 1.5 detik, arahkan ke halaman login
            setTimeout(() => {
                window.location.href = '/login.html'; // Arahkan ke halaman login
            }, 1500);
        } else {
            const errorData = await response.json();
            console.error('Error logout:', errorData.message);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Logout',
                text: errorData.message || 'Terjadi kesalahan saat logout.',
            });
        }
    } catch (error) {
        console.error('Kesalahan jaringan:', error);
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Silakan coba lagi nanti.',
        });
    }
}


//MEMUNCULKAN MENU DASHBOARD YANG DIKLIK
//Dashboard  User DAN ADMIN
function showContent(sectionId) {
    // Sembunyikan semua content-section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Tampilkan section yang sesuai dengan sectionId
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Sembunyikan image-container
    const imageContainer = document.querySelector('.image-container');
    if (imageContainer) {
        imageContainer.style.display = 'none';
    }

    // Update menu aktif
    const menuLinks = document.querySelectorAll('.dashboard-menu a');
    menuLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[onclick="showContent('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Fungsi untuk reset ke default (tampilkan image-container)
function resetToDefault() {
    // Tampilkan image-container
    const imageContainer = document.querySelector('.image-container');
    if (imageContainer) {
        imageContainer.style.display = 'flex'; // Gunakan flex jika menggunakan Flexbox
    }

    // Sembunyikan semua content-section
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Hapus menu aktif
    const menuLinks = document.querySelectorAll('.dashboard-menu a');
    menuLinks.forEach(link => link.classList.remove('active'));
}

// //BUAT PEMESANAN
// Menyimpan keranjang di localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || []; // Mengambil data keranjang dari localStorage jika ada

// Fungsi untuk mengambil produk dari API dan menampilkan daftar produk
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            const productList = document.getElementById('product-list');
            productList.innerHTML = products.map(product => `
                <div class="dashboard-ukurannpl">
                    <div class="dashboard-produk">
                        <img src="${product.gambar}" alt="${product.nama_produk}">
                    </div>
                    <div class="harga-produk">
                        <h1>${product.nama_produk}</h1>
                        <p>Rp. ${product.harga.toLocaleString()}</p>
                        <label>Jumlah Karton:</label>
                        <input type="number" min="0" value="0"
                            onchange="updateCart(${product.produk_id}, '${product.nama_produk}', ${product.harga}, this.value)">
                    </div>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error fetching products:', error));

    displayCart(); // Menampilkan keranjang setelah halaman dimuat
});

// Fungsi untuk memperbarui keranjang
function updateCart(produk_id, nama_produk, harga, quantity) {
    quantity = parseInt(quantity); // Konversi ke angka

    // Cek apakah produk sudah ada di keranjang
    let productInCart = cart.find(item => item.produk_id === produk_id);

    if (productInCart) {
        // Jika produk sudah ada, update quantity
        if (quantity > 0) {
            productInCart.quantity = quantity;
        } else {
            // Hapus produk dari keranjang jika quantity adalah 0
            cart = cart.filter(item => item.produk_id !== produk_id);
        }
    } else if (quantity > 0) {
        // Jika produk belum ada di keranjang, tambahkan produk baru
        cart.push({ produk_id, nama_produk, harga, quantity });
    }

    // Simpan ke localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    displayCart(); // Menampilkan ulang keranjang
}

// Fungsi untuk menampilkan keranjang belanja
function displayCart() {
    const cartItemsList = document.getElementById('cart-items');
    const totalCartons = document.getElementById('total-cartons');
    const totalPrice = document.getElementById('total-price');
    const discountElement = document.getElementById('discount');

    cartItemsList.innerHTML = ''; // Bersihkan daftar keranjang
    let total = 0;
    let cartons = 0;
    let bonus = 0;

    cart.forEach(item => {
        if (item.quantity > 0) {
            const productTotal = item.harga * item.quantity;
            const listItem = document.createElement('li');
            listItem.innerHTML = `${item.nama_produk} - ${item.quantity} karton - Rp ${productTotal.toLocaleString()}`;
            cartItemsList.appendChild(listItem);

            total += productTotal;
            cartons += item.quantity;
        }
    });

    // Hitung bonus: 2 karton 600ml per 40 karton
    if (cartons >= 40) {
        bonus = Math.floor(cartons / 40) * 2;
    }

    // Update elemen tampilan
    totalCartons.textContent = cartons;
    totalPrice.textContent = total.toLocaleString();
    discountElement.textContent = `Bonus: ${bonus} karton 600ml`; // Tampilkan bonus karton

    // Aktifkan tombol checkout jika keranjang tidak kosong dan memenuhi syarat
    document.getElementById('checkout-button').disabled = !(cartons >= 40);
}

// Fungsi untuk menghapus keranjang
function clearCart() {
    // Hapus data keranjang di localStorage dan di variabel cart
    localStorage.removeItem('cart');
    cart = [];
    displayCart(); // Menampilkan keranjang setelah dibersihkan
}

// Menjalankan fungsi displayCart saat halaman dimuat
displayCart();

//fungsi tombol checkout
function checkout() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const note = document.getElementById('checkout-note').value;

    if (!userId || !token) {
        alert('Anda harus login terlebih dahulu.');
        return;
    }

    fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
        .then(response => response.json())
        .then(user => {
            if (!user || !user.alamat_toko) {
                alert('Alamat pengguna tidak ditemukan. Harap perbarui profil Anda.');
                return;
            }

            const shippingAddress = user.alamat_toko;

            if (cart.length === 0) {
                alert('Keranjang belanja tidak boleh kosong.');
                return;
            }

            fetch('/api/order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId,
                    cart,
                    shippingAddress,
                    nama_toko: user.nama_toko,
                    no_telp: user.no_telp,
                    wilayah_toko: user.wilayah_toko,
                    note,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
                    }

                    if (data.orderId) {
                        const orderId = data.orderId;

                        // Simpan Order ID ke localStorage
                        localStorage.setItem('currentOrderId', orderId);

                        // Ambil detail pesanan untuk ditampilkan
                        fetch(`/api/order/${orderId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                            .then(response => response.json())
                            .then(order => {
                                // Tampilkan detail pembayaran
                                document.getElementById('order-id').textContent = order.order_id;
                                document.getElementById('discount1').textContent = formatRupiah(order.discount);
                                document.getElementById('final-amount').textContent = formatRupiah(order.final_amount);

                                // Bersihkan keranjang belanja
                                clearCart();

                                alert('Pesanan berhasil dibuat. Silakan lanjutkan ke pembayaran.');
                            })
                            .catch(error => {
                                console.error('Error fetching order details:', error);
                                alert('Terjadi kesalahan saat mengambil detail pesanan.');
                            });
                    }
                })
                .catch(error => {
                    console.error('Error during checkout:', error);
                    alert('Terjadi kesalahan saat melakukan checkout.');
                });
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            alert('Terjadi kesalahan saat mengambil data pengguna.');
        });
}

// Fungsi Format Rupiah
function formatRupiah(amount) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}


//cancel orderan
document.getElementById('cancel-order-btn').addEventListener('click', () => {
    const orderId = localStorage.getItem('currentOrderId');
    if (!orderId) {
        alert('Order ID tidak ditemukan.');
        return;
    }

    if (confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
        fetch(`/api/order/${orderId}/cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);

                    // Bersihkan data pesanan dari localStorage
                    localStorage.removeItem('currentOrderId');

                    // Bersihkan elemen UI yang menampilkan detail pesanan
                    document.getElementById('order-id').textContent = '';
                    document.getElementById('discount1').textContent = '';
                    document.getElementById('final-amount').textContent = '';
                    window.location.reload();
                    // Redirect ke halaman lain atau tampilkan pesan
                    alert('Pesanan berhasil dibatalkan. Silakan buat pesanan baru.');
                }
            })
            .catch(error => {
                console.error('Error cancelling order:', error);
                alert('Terjadi kesalahan saat membatalkan pesanan.');
            });
    }
});
//UPDATE QUANTITY
function updateQuantity(productId, newQuantity) {
    cart = cart.map(item => {
        if (item.product_id === productId) {
            item.quantity = newQuantity;
        }
        return item;
    });
    saveCartToLocalStorage();
    renderCart();
}

// MEMUNCULKAN RINCIAN YANG AKAN DIBAYAR
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || localStorage.getItem('currentOrderId');

    // Gunakan Intl.NumberFormat untuk memformat angka dengan titik
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // Tanpa desimal
    });

    // if (!orderId) {
    //     alert('Order ID tidak ditemukan. Silakan coba lagi.');
    //     return;
    // }

    fetch(`/api/order/${orderId}`)
        .then(response => response.json())
        .then(order => {
            if (!order) {
                alert('Detail pesanan tidak ditemukan.');
                return;
            }

            // Tampilkan detail pembayaran
            document.getElementById('order-id').textContent = order.order_id;
            document.getElementById('discount1').textContent = formatter.format(order.discount);
            document.getElementById('final-amount').textContent = formatter.format(order.final_amount);

            // Perbarui currentOrderId untuk memastikan sinkronisasi
            localStorage.setItem('currentOrderId', order.order_id);
        })
        .catch(error => {
            console.error('Error fetching order details:', error);
            alert('Terjadi kesalahan saat mengambil detail pembayaran.');
        });
});

// TAHAP PEMBAYARAN
function proceedPayment() {
    const orderId = localStorage.getItem('currentOrderId'); // Ambil orderId dari localStorage
    const token = localStorage.getItem('token'); // Ambil token autentikasi
    const amount = document.getElementById('final-amount').textContent.replace(/[^\d]/g, ''); // Ambil jumlah tanpa format

    if (!orderId || !amount) {
        alert('Data pesanan tidak lengkap.');
        return;
    }

    fetch('/api/payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            orderId,
            amount: parseInt(amount, 10),
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                // Buka Midtrans Snap menggunakan token
                window.snap.pay(data.token, {
                    onSuccess: async function (result) {
                        alert('Pembayaran berhasil!');
                        console.log(result);

                        // Memperbarui status pesanan ke "Pesanan telah dibayar"
                        try {
                            const updateResponse = await fetch('api/payment/order', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`, // Jika menggunakan autentikasi
                                },
                                body: JSON.stringify({
                                    orderId,
                                    newStatusId: 2, // ID untuk "Pesanan telah dibayar"
                                }),
                            });

                            const updateResult = await updateResponse.json();
                            if (updateResponse.ok) {
                                console.log('Status pesanan diperbarui:', updateResult);
                            } else {
                                alert('Gagal memperbarui status pesanan.');
                            }
                        } catch (error) {
                            console.error('Error updating order status:', error);
                            alert('Terjadi kesalahan saat memperbarui status pesanan.');
                        }

                        // Hapus rincian pembayaran dari layar
                        document.getElementById('order-id').textContent = '';
                        document.getElementById('discount1').textContent = '';
                        document.getElementById('final-amount').textContent = '';
                        localStorage.removeItem('currentOrderId');
                        window.location.reload(); // Refresh halaman setelah berhasil
                    },
                    onPending: function (result) {
                        alert('Pembayaran tertunda.');
                        console.log(result);
                    },
                    onError: function (result) {
                        alert('Pembayaran gagal.');
                        console.error(result);
                    },
                    onClose: function () {
                        alert('Anda menutup pembayaran sebelum selesai.');
                    },
                });
            } else {
                alert('Gagal mendapatkan token pembayaran.');
            }
        })
        .catch(error => {
            console.error('Error processing payment:', error);
            alert('Terjadi kesalahan saat memproses pembayaran.');
        });
}


//STATUS PESANAN
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId'); // Ambil userId dari localStorage

    if (!userId) {
        alert('User ID tidak ditemukan. Silakan login ulang.');
        return;
    }

    // Gunakan GET untuk mengirim userId melalui parameter URL
    fetch(`/api/order/status/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(orders => {
            if (!orders || orders.length === 0) {
                alert('Pesanan tidak ditemukan.');
                return;
            }

            // Tampilkan pesanan
            const orderContainer = document.querySelector('.orderStatus');
            orderContainer.innerHTML = ''; // Kosongkan kontainer

            orders.forEach(order => {
                const orderHtml = `
                    <div class="orderStatus">
                        <h4>Pesanan Anda: <span>${order.status_name}</span> - <span>${order.description}</span></h4>
                        <p>330ml: <span>${order.nestle_pure_life_330ml}</span></p>
                        <p>600ml: <span>${order.nestle_pure_life_600ml}</span></p>
                        <p>1500ml: <span>${order.nestle_pure_life_1500ml}</span></p>
                        <p>Diskon: <span>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.discount)}</span></p>
                        <p>Total Bayar: <span>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.final_amount)}</span></p>
                        <button class="updateStatusButton">Perbarui Status</button>
                    </div>
                `;
                const orderDiv = document.createElement('div');
                orderDiv.innerHTML = orderHtml;
                orderContainer.appendChild(orderDiv);
            });

            // Menambahkan event listener pada tombol Perbarui Status
            const updateButtons = document.querySelectorAll('.updateStatusButton');
            updateButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Proses perbarui status (jika diperlukan)
                    // Misalnya mengupdate status pesanan atau panggil API untuk update status

                    // Setelah update, refresh halaman
                    location.reload(); // Me-refresh halaman
                });
            });

        })
        .catch(error => {
            console.error('Error fetching order details:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
        });
});

document.addEventListener('DOMContentLoaded', () => {
    const orderStatusContainer = document.querySelector('.orderStatus');

    // Ubah gaya elemen
    orderStatusContainer.style.border = '1px solid #ccc';
    orderStatusContainer.style.padding = '10px';
    orderStatusContainer.style.margin = '10px 0';
});



//RIWAYAT PEMESANAN USER
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId'); // Ambil userId dari localStorage
    if (!userId) {
        alert('Anda harus login terlebih dahulu.');
        return;
    }

    loadOrderHistory(userId);
});

// Fungsi untuk memuat dan menampilkan riwayat pemesanan
function loadOrderHistory(userId) {
    // console.log(`/api/orderhistory/${userId}`);  // Pastikan URL yang terbentuk sudah sesuai
    fetch(`/api/orderhistory/${userId}`)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            const orderHistoryBody = document.getElementById('orderHistoryBody');
            orderHistoryBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

            data.forEach(order => {
                const row = document.createElement('tr');

                row.innerHTML = `
                <td>${new Date(order.order_date).toLocaleDateString()}</td>
                <td>${order.order_id}</td>
                <td>${order.quantity_330ml}</td>
                <td>${order.quantity_600ml}</td>
                <td>${order.quantity_1500ml}</td>
                <td>${order.total_quantity}</td>
                <td>Rp ${order.final_amount.toLocaleString()}</td>
                <td>${order.status_name}</td>
            `;

                orderHistoryBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching order history:', error);
            alert('Gagal memuat riwayat pemesanan.');
        });
}


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

// Batalkan edit password
function cancelEdit2() {
    document.getElementById('changePasswordSection').style.display = 'none';
    document.getElementById('akun').style.display = 'block';
}

