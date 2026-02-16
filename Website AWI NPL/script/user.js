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
                        <h4>${product.nama_produk}</h4>
                        <p>${formatRupiah(product.harga)}</p>
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

//Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(angka);
}

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
            listItem.innerHTML = `${item.nama_produk} - ${item.quantity} karton - ${formatRupiah(productTotal)}`;
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
    totalPrice.textContent = formatRupiah(total);
    discountElement.textContent = `Bonus: ${bonus} karton 600ml`; // Tampilkan bonus karton

    // Tombol checkout tetap aktif, tetapi validasi dilakukan di checkout()
    document.getElementById('checkout-button').disabled = false;
}

// Fungsi untuk menghapus keranjang
function clearCart() {
    localStorage.removeItem('cart'); // Hapus data dari localStorage
    cart = [];
    displayCart(); // Tampilkan ulang keranjang setelah dibersihkan
}

// Menjalankan fungsi displayCart saat halaman dimuat
displayCart();

// Fungsi tombol checkout
async function checkout() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const note = document.getElementById('checkout-note').value;

    if (!userId || !token) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Diperlukan',
            text: 'Anda harus login terlebih dahulu.',
            confirmButtonText: 'OK',
        });
        return;
    }

    // Hitung jumlah total karton dalam keranjang
    let totalCartons = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Jika kurang dari 40 karton, pesanan tidak bisa dilanjutkan
    if (totalCartons < 40) {
        Swal.fire({
            icon: 'error',
            title: 'Minimal Pembelian 40 Karton',
            text: 'Pesanan tidak dapat dilanjutkan karena kurang dari 40 karton.',
            confirmButtonText: 'OK',
        });
        return; // Stop proses checkout
    }

    // Jika jumlah karton mencukupi, lanjutkan checkout
    await processCheckout(userId, token, note);
}

// Fungsi untuk memproses checkout
async function processCheckout(userId, token, note) {
    try {
        const userResponse = await fetch(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const user = await userResponse.json();

        if (!user || !user.alamat_toko) {
            Swal.fire({
                icon: 'warning',
                title: 'Alamat Tidak Ditemukan',
                text: 'Alamat pengguna tidak ditemukan. Harap perbarui profil Anda.',
                confirmButtonText: 'OK',
            });
            return;
        }

        const shippingAddress = user.alamat_toko;

        if (cart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Keranjang Kosong',
                text: 'Keranjang belanja tidak boleh kosong.',
                confirmButtonText: 'OK',
            });
            return;
        }

        const orderResponse = await fetch('/api/order', {
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
        });

        const orderData = await orderResponse.json();

        if (orderData.message) {
            Swal.fire({
                icon: 'info',
                title: 'Informasi',
                text: orderData.message,
                confirmButtonText: 'OK',
            });
        }

        if (orderData.orderId) {
            const orderId = orderData.orderId;

            // Simpan Order ID ke localStorage
            localStorage.setItem('currentOrderId', orderId);

            const orderDetailResponse = await fetch(`/api/order/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const orderDetail = await orderDetailResponse.json();

            // Tampilkan detail pembayaran
            document.getElementById('order-id').textContent = orderDetail.order_id;
            document.getElementById('discount1').textContent = formatRupiah(orderDetail.discount);
            document.getElementById('final-amount').textContent = formatRupiah(orderDetail.final_amount);

            // Tampilkan elemen detail pembayaran
            document.getElementById('detail-pembayaran').style.display = 'block';

            // Bersihkan keranjang belanja
            clearCart();

            // Tampilkan pesan berhasil
            Swal.fire({
                icon: 'success',
                title: 'Pesanan Berhasil',
                text: 'Pesanan berhasil dibuat. Silakan lanjutkan ke pembayaran.',
                confirmButtonText: 'OK',
            }).then(() => {
                location.reload(); // Reload halaman setelah user menutup swal
            });
        }
    } catch (error) {
        console.error('Error during checkout:', error);

        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Terjadi kesalahan saat melakukan checkout. Silakan coba lagi nanti.',
            confirmButtonText: 'OK',
        });
    }
}

// Cancel orderan
document.getElementById('cancel-order-btn').addEventListener('click', () => {
    const orderId = localStorage.getItem('currentOrderId');
    if (!orderId) {
        Swal.fire({
            icon: 'warning',
            title: 'Order ID Tidak Ditemukan',
            text: 'Order ID tidak ditemukan. Silakan coba lagi.',
            confirmButtonText: 'OK',
        });
        return;
    }

    Swal.fire({
        title: 'Konfirmasi Pembatalan',
        text: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Batalkan!',
        cancelButtonText: 'Tidak',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/order/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Pesanan Dibatalkan',
                            text: data.message,
                            confirmButtonText: 'OK',
                        }).then(() => {
                            // Bersihkan data pesanan dari localStorage
                            localStorage.removeItem('currentOrderId');

                            // Bersihkan elemen UI yang menampilkan detail pesanan
                            document.getElementById('order-id').textContent = '';
                            document.getElementById('discount1').textContent = '';
                            document.getElementById('final-amount').textContent = '';

                            // Reload halaman
                            window.location.reload();
                        });
                    }
                })
                .catch(error => {
                    console.error('Error cancelling order:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Terjadi Kesalahan',
                        text: 'Gagal membatalkan pesanan. Silakan coba lagi.',
                        confirmButtonText: 'OK',
                    });
                });
        }
    });
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

    if (!orderId) {
        // Jika orderId tidak ditemukan, sembunyikan elemen
        document.getElementById('detail-pembayaran').style.display = 'none';
        return;
    }

    fetch(`/api/order/${orderId}`)
        .then(response => response.json())
        .then(order => {
            if (!order || order.status_id === 6 || order.final_amount === 0) {
                // Jika pesanan dibatalkan (status_id = 6) atau total pembayaran 0, sembunyikan elemen
                document.getElementById('detail-pembayaran').style.display = 'none';
                return;
            }

            // Tampilkan detail pembayaran
            document.getElementById('order-id').textContent = order.order_id;
            document.getElementById('discount1').textContent = formatter.format(order.discount);
            document.getElementById('final-amount').textContent = formatter.format(order.final_amount);

            // Tampilkan elemen jika semua syarat terpenuhi
            document.getElementById('detail-pembayaran').style.display = 'block';

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
        Swal.fire({
            icon: 'warning',
            title: 'Data Tidak Lengkap',
            text: 'Data pesanan tidak lengkap. Silakan periksa kembali.',
            confirmButtonText: 'OK',
        });
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
                        Swal.fire({
                            icon: 'success',
                            title: 'Pembayaran Berhasil!',
                            text: 'Terima kasih atas pembayaran Anda.',
                            confirmButtonText: 'OK',
                        }).then(async () => {
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
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal Memperbarui Status',
                                        text: 'Status pesanan tidak dapat diperbarui.',
                                        confirmButtonText: 'OK',
                                    });
                                }
                            } catch (error) {
                                console.error('Error updating order status:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Kesalahan',
                                    text: 'Terjadi kesalahan saat memperbarui status pesanan.',
                                    confirmButtonText: 'OK',
                                });
                            }

                            // Hapus rincian pembayaran dari layar
                            document.getElementById('order-id').textContent = '';
                            document.getElementById('discount1').textContent = '';
                            document.getElementById('final-amount').textContent = '';
                            localStorage.removeItem('currentOrderId');
                            window.location.reload(); // Refresh halaman setelah berhasil
                        });
                    },
                    onPending: function (result) {
                        Swal.fire({
                            icon: 'info',
                            title: 'Pembayaran Tertunda',
                            text: 'Pembayaran Anda sedang diproses. Silakan cek status nanti.',
                            confirmButtonText: 'OK',
                        });
                        console.log(result);
                    },
                    onError: function (result) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Pembayaran Gagal',
                            text: 'Pembayaran tidak berhasil. Silakan coba lagi.',
                            confirmButtonText: 'OK',
                        });
                        console.error(result);
                    },
                    onClose: function () {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Pembayaran Belum Selesai',
                            text: 'Anda menutup pembayaran sebelum selesai.',
                            confirmButtonText: 'OK',
                        });
                    },
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mendapatkan Token',
                    text: 'Token pembayaran tidak tersedia. Silakan coba lagi.',
                    confirmButtonText: 'OK',
                });
            }
        })
        .catch(error => {
            console.error('Error processing payment:', error);
            Swal.fire({
                icon: 'error',
                title: 'Kesalahan',
                text: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
                confirmButtonText: 'OK',
            });
        });
}

//STATUS PEMESANAN
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId'); // Ambil userId dari localStorage
    const selectAllCheckbox = document.getElementById('select-all');

    if (!userId) {
        Swal.fire({
            icon: 'warning',
            title: 'User ID Tidak Ditemukan',
            text: 'Silakan login ulang.',
            confirmButtonText: 'OK',
        });
        return;
    }

    // Ambil status pesanan user
    fetch(`/api/order/status/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(orders => {
            if (!orders || orders.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Pesanan Tidak Ditemukan',
                    text: 'Tidak ada data pesanan untuk user ini.',
                    confirmButtonText: 'OK',
                });
                return;
            }

            const orderTable = document.querySelector('.orderStatusTable tbody');
            orderTable.innerHTML = ''; // Kosongkan tabel

            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="checkbox" class="order-checkbox" data-order-id="${order.order_id}" />
                    </td>
                    <td>${order.order_id}</td>
                    <td>${order.status_name}</td>
                    <td>${order.description}</td>
                    <td>${order.nestle_pure_life_330ml}</td>
                    <td>${order.nestle_pure_life_600ml}</td>
                    <td>${order.nestle_pure_life_1500ml}</td>
                    <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.discount)}</td>
                    <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.final_amount)}</td>
                `;
                orderTable.appendChild(row);
            });
        })
        // .catch(err => Swal.fire({
        //     icon: 'error',
        //     title: 'Gagal Mengambil Pesanan',
        //     text: `Terjadi kesalahan: ${err}`,
        //     confirmButtonText: 'OK',
        // }));

    // Handle "Select All" checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });
});

// Get all selected order IDs
function getSelectedOrders() {
    const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
    return Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-order-id'));
}

// Validate order status before performing action
function validateOrderStatus(orderId, action) {
    const orderRow = document.querySelector(`[data-order-id="${orderId}"]`).closest('tr');
    const statusText = orderRow.cells[2].textContent; // Status berada di kolom ke-3 (index 2)

    if (action === 'complete' && statusText === 'Selesai') {
        Swal.fire({
            icon: 'warning',
            title: 'Aksi Tidak Diperbolehkan',
            text: `Pesanan ${orderId} sudah selesai. Tidak bisa diselesaikan lagi.`,
            confirmButtonText: 'OK',
        });
        return false;
    } else if (action === 'cancel' && statusText === 'Dibatalkan') {
        Swal.fire({
            icon: 'warning',
            title: 'Aksi Tidak Diperbolehkan',
            text: `Pesanan ${orderId} sudah dibatalkan. Tidak bisa dibatalkan lagi.`,
            confirmButtonText: 'OK',
        });
        return false;
    }
    return true;
}

// Menyelesaikan pesanan yang dipilih
function completeSelectedOrders() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak Ada Pesanan Dipilih',
            text: 'Silakan pilih pesanan terlebih dahulu.',
            confirmButtonText: 'OK',
        });
        return;
    }

    Swal.fire({
        title: 'Konfirmasi Penyelesaian',
        text: `Anda yakin ingin menyelesaikan ${selectedOrders.length} pesanan terpilih?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Selesaikan',
        cancelButtonText: 'Batal',
    }).then(result => {
        if (result.isConfirmed) {
            fetch('/api/orders/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: selectedOrders }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Response dari API:", data); // Debugging

                    if (data.success) { // Pastikan membaca 'success'
                        Swal.fire({
                            icon: 'success',
                            title: 'Pesanan Selesai',
                            text: data.message,
                            confirmButtonText: 'OK',
                        }).then(() => location.reload());
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal Menyelesaikan Pesanan',
                            text: data.message || 'Terjadi kesalahan yang tidak diketahui.',
                            confirmButtonText: 'OK',
                        });
                    }
                })
                .catch(err => {
                    console.error("Terjadi kesalahan:", err);

                    Swal.fire({
                        icon: 'error',
                        title: 'Kesalahan Jaringan',
                        text: 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.',
                        confirmButtonText: 'OK',
                    });
                });
        }
    });
}

// Membatalkan pesanan
function cancelSelectedOrders() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak Ada Pesanan Dipilih',
            text: 'Silakan pilih pesanan terlebih dahulu.',
            confirmButtonText: 'OK',
        });
        return;
    }

    Swal.fire({
        title: 'Konfirmasi Pembatalan',
        text: `Anda yakin ingin membatalkan ${selectedOrders.length} pesanan terpilih?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Batalkan',
        cancelButtonText: 'Batal',
    }).then(result => {
        if (result.isConfirmed) {
            selectedOrders.forEach(orderId => {
                fetch(`/api/order/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Pesanan Dibatalkan',
                                text: `Pesanan ${orderId} berhasil dibatalkan.`,
                                confirmButtonText: 'OK',
                            }).then(() => location.reload());
                        } else {
                            Swal.fire({
                                icon: 'error',
                                // title: 'Gagal Membatalkan Pesanan',
                                text: data.message || `Gagal membatalkan pesanan ${orderId}.`,
                                confirmButtonText: 'OK',
                            }).then(() => location.reload());
                        }
                    })
                    .catch(err => Swal.fire({
                        icon: 'error',
                        title: 'Kesalahan',
                        text: `Terjadi kesalahan pada pesanan ${orderId}: ${err}`,
                        confirmButtonText: 'OK',
                    }));
            });
        }
    });
}

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
                <td>${order.quantity_330ml ?? 0}</td>
                <td>${order.quantity_600ml ?? 0}</td>
                <td>${order.quantity_1500ml ?? 0}</td>
                <td>${order.total_quantity ?? 0}</td>
                <td>Rp ${order.final_amount.toLocaleString()}</td>
                <td>${order.status_name}</td>
            `;

                orderHistoryBody.appendChild(row);
            });
        })
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

document.getElementById('programSelectionForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const programId = document.getElementById('programOption').value;
    if (!programId) {
        Swal.fire({
            icon: 'warning',
            title: 'Pilih Program',
            text: 'Silakan pilih program terlebih dahulu.',
            confirmButtonText: 'OK',
        });
        return;
    }

    const token = localStorage.getItem('token');  // Ambil token dari localStorage
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Token Tidak Ditemukan',
            text: 'Silakan login kembali.',
            confirmButtonText: 'OK',
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Berhasil Mendaftar',
                text: 'Anda telah berhasil mendaftar untuk program baru!',
                confirmButtonText: 'OK',
            }).then(() => {
                window.location.reload(); // Refresh halaman setelah berhasil
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mendaftar',
                text: result.message || 'Terjadi kesalahan saat pendaftaran.',
                confirmButtonText: 'OK',
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Terjadi kesalahan saat mendaftar program.',
            confirmButtonText: 'OK',
        });
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

        Swal.fire({
            icon: 'success',
            title: 'Data Akun Berhasil Diperbarui',
            text: 'Akun Anda telah berhasil diperbarui!',
            confirmButtonText: 'OK',
        }).then(() => {
            location.reload(); // Muat ulang halaman untuk merefresh data
        });
    } catch (error) {
        console.error('Error updating account data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal Memperbarui Data',
            text: 'Terjadi kesalahan saat memperbarui data akun.',
            confirmButtonText: 'OK',
        });
    }
}

// GANTI PASSWORD ==========================
function toggleChangePasswordForm() {
    const section = document.getElementById('changePasswordSection');
    const akunSection = document.getElementById('akun');

    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        akunSection.style.display = 'none'; // Sembunyikan informasi akun
    } else {
        section.style.display = 'none';
        akunSection.style.display = 'block'; // Tampilkan kembali informasi akun
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'Password Tidak Cocok',
            text: 'Password baru dan konfirmasi password tidak cocok.',
            confirmButtonText: 'OK',
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Password Berhasil Diubah',
                text: 'Password Anda telah berhasil diperbarui.',
                confirmButtonText: 'OK',
            }).then(() => {
                document.getElementById('changePasswordForm').reset();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengganti Password',
                text: result.message || 'Gagal mengganti password.',
                confirmButtonText: 'OK',
            });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        Swal.fire({
            icon: 'error',
            title: 'Terjadi Kesalahan',
            text: 'Terjadi kesalahan saat mengganti password.',
            confirmButtonText: 'OK',
        });
    }
}

// Batalkan edit password
function cancelEdit2() {
    document.getElementById('changePasswordSection').style.display = 'none';
    document.getElementById('akun').style.display = 'block';
}

