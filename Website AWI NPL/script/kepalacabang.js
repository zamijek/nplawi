//MEMUNCULKAN MENU DASHBOARD YANG DIKLIK
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

document.addEventListener('DOMContentLoaded', function () {
    showContent('orders'); // default pertama tampil
});


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
//LOGOUT SELESAI============================

//MENU PEMESANAN
document.addEventListener('DOMContentLoaded', () => {
    const ordersTable = document.getElementById('orders-list');
    const selectAllCheckbox = document.getElementById('select-all');

    // Fetch orders data
    fetch('/admin/orders') // Sesuaikan dengan endpoint Anda
        .then(response => response.json())
        .then(orders => {
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.classList.add('order-row');
                row.innerHTML = `
                                <td>
                                    <input type="checkbox" class="order-checkbox" data-order-id="${order.order_id}" />
                                </td>
                                <td>${order.order_id}</td>
                                <td>${order.nama_toko}</td>
                                <td>${order.quantity_330ml}</td>
                                <td>${order.quantity_600ml}</td>
                                <td>${order.quantity_1500ml}</td>
                                <td>${order.total_quantity}</td>
                                <td>${new Date(order.order_date).toLocaleString()}</td>
                                <td class="status-cell">${order.status_name}</td> <!-- Menambahkan kelas status-cell -->
                            `;
                ordersTable.appendChild(row);
            });
        })
        .catch(err => console.error('Failed to fetch orders:', err));

    // Handle "Select All" checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });
});
// Ambil semua order_id yang dipilih
function getSelectedOrders() {
    const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
    return Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-order-id'));
}

// Memeriksa status pesanan sebelum melakukan aksi
function validateOrderStatus(orderId, action) {
    // Mendapatkan status_id pesanan berdasarkan order_id
    const orderRow = document.querySelector(`[data-order-id="${orderId}"]`);
    const statusCell = orderRow.querySelector('.status-cell');
    const statusText = statusCell ? statusCell.innerText : '';

    // Memeriksa status dan memberikan pesan yang sesuai
    if (action === 'process' && statusText === 'Diproses') {
        alert(`Pesanan ${orderId} sudah dalam status "Diproses". Tidak bisa diproses lagi.`);
        return false;
    } else if (action === 'ship' && statusText === 'Dikirim') {
        alert(`Pesanan ${orderId} sudah dikirim. Tidak bisa dikirim lagi.`);
        return false;
    } else if (action === 'complete' && statusText === 'Selesai') {
        alert(`Pesanan ${orderId} sudah selesai. Tidak bisa diselesaikan lagi.`);
        return false;
    }
    return true; // Jika status valid, lanjutkan aksi
}


// Proses pesanan yang dipilih
function processSelectedOrders() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        alert('Tidak ada pesanan yang dipilih!');
        return;
    }

    for (const orderId of selectedOrders) {
        if (!validateOrderStatus(orderId, 'process')) return; // Validasi status sebelum memproses

        alert(`Memproses pesanan: ${orderId}`);
        fetch('/admin/orders/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: [orderId] })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Pesanan ${orderId} berhasil diproses!`);
                    location.reload(); // Reload halaman untuk memperbarui status
                } else {
                    alert(data.message || 'Gagal memproses pesanan.');
                }
            })
            .catch(err => alert('Terjadi kesalahan: ' + err));
    }
}

//CETAK INVOICE=================
function printSelectedInvoices() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        alert('Tidak ada pesanan yang dipilih untuk mencetak invoice!');
        return;
    }

    selectedOrders.forEach(orderId => {
        fetch(`/admin/invoice/${orderId}/check-invoice`)
            .then(response => response.json())
            .then(data => {
                if (data.isPrinted) {
                    const confirmPrint = confirm(`Invoice untuk Order ID ${orderId} sudah pernah dicetak. Apakah Anda ingin mencetak ulang?`);
                    if (!confirmPrint) return;
                }

                // Setelah konfirmasi, cetak ulang invoice
                window.location.href = `/admin/invoice/${orderId}`; // Ini akan memulai pengunduhan PDF, bukan membuka tab kosong.
            })
            .catch(err => console.error('Terjadi kesalahan:', err));
    });
}

// Kirim pesanan yang dipilih
function shipSelectedOrders() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        alert('Tidak ada pesanan yang dipilih!');
        return;
    }

    for (const orderId of selectedOrders) {
        if (!validateOrderStatus(orderId, 'ship')) return; // Validasi status sebelum mengirim

        alert(`Mengirim pesanan: ${orderId}`);
        fetch('/admin/orders/ship', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: [orderId] })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Pesanan ${orderId} berhasil dikirim!`);
                    location.reload(); // Reload halaman untuk memperbarui status
                } else {
                    alert(data.message || 'Gagal mengirim pesanan.');
                }
            })
            .catch(err => alert('Terjadi kesalahan: ' + err));
    }
}

// Menyelesaikan pesanan yang dipilih
function completeSelectedOrders() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        alert('Tidak ada pesanan yang dipilih!');
        return;
    }

    for (const orderId of selectedOrders) {
        if (!validateOrderStatus(orderId, 'complete')) return; // Validasi status sebelum menyelesaikan

        alert(`Menyelesaikan pesanan: ${orderId}`);
        fetch('/admin/orders/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: [orderId] })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Pesanan ${orderId} berhasil diselesaikan!`);
                    location.reload(); // Reload halaman untuk memperbarui status
                } else {
                    alert(data.message || 'Gagal menyelesaikan pesanan.');
                }
            })
            .catch(err => alert('Terjadi kesalahan: ' + err));
    }
}


// MANAJEMEN PRODUK
async function fetchPreviousPrices() {
    const inputs = document.querySelectorAll('input[data-product-id]');

    for (const input of inputs) {
        const productId = input.dataset.productId;
        const previousPriceSpan = document.querySelector(`#previousPriceItem${productId}`);

        try {
            const response = await fetch(`admin/prices/${productId}`);
            if (!response.ok) throw new Error('Gagal memuat harga');

            const data = await response.json();

            const formattedPrice = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 2
            }).format(data.harga);

            previousPriceSpan.textContent = `(Saat ini: ${formattedPrice})`;

        } catch (error) {
            previousPriceSpan.textContent = '(Saat ini: Tidak tersedia)';
            console.error(`Gagal memuat harga untuk produk ID ${productId}:`, error);
        }
    }
}

// Fungsi untuk memperbarui harga
async function updatePrices() {
    const inputs = document.querySelectorAll('input[data-product-id]');

    for (const input of inputs) {
        const productId = input.dataset.productId;
        const newPrice = input.value;

        if (!newPrice) continue; // Lewati jika harga baru kosong

        try {
            const response = await fetch(`admin/prices/${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ harga: newPrice }),
            });

            if (!response.ok) throw new Error('Gagal memperbarui harga');

            // Perbarui harga sebelumnya di span
            const data = await response.json();
            console.log(data.message);
            const previousPriceSpan = document.querySelector(`#previousPriceItem${productId}`);
            previousPriceSpan.textContent = `(Saat ini: Rp ${newPrice})`;

            // Tampilkan alert ketika berhasil
            alert(`Harga untuk produk ID ${productId} berhasil diperbarui menjadi Rp ${newPrice}`);
        } catch (error) {
            console.error(`Gagal memperbarui harga untuk produk ID ${productId}:`, error);
            alert(`Gagal memperbarui harga untuk produk ID ${productId}`);
        }
    }
}


// Event listeners
document.getElementById('updatePrices').addEventListener('click', updatePrices);


//STOCK===============
// Fungsi untuk mengambil dan menampilkan laporan stok produk
async function fetchStockReport() {
    try {
        const response = await fetch('/admin/stock');
        if (!response.ok) {
            throw new Error('Gagal memuat produk');
        }

        const products = await response.json();
        const tableBody = document.getElementById('stockReportBody');
        const stockItemSelect = document.getElementById('stock-item');

        tableBody.innerHTML = ''; // Clear previous rows
        stockItemSelect.innerHTML = ''; // Clear previous options

        products.forEach(product => {
            // Menambahkan baris ke tabel
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.nama_produk}</td>
                <td>${product.stock}</td>
            `;
            tableBody.appendChild(row);

            // Menambahkan opsi ke dropdown
            const option = document.createElement('option');
            option.value = product.produk_id;
            option.textContent = product.nama_produk;
            stockItemSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

// Fungsi untuk memperbarui stok
async function updateStock() {
    const produkId = document.getElementById('stock-item').value;
    const jumlah = document.getElementById('stock-quantity').value;

    if (!produkId || !jumlah || isNaN(jumlah) || jumlah <= 0) {
        alert('Masukkan produk dan jumlah yang valid.');
        return;
    }

    try {
        const response = await fetch('/admin/update-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produk_id: produkId, jumlah: parseInt(jumlah) })
        });

        if (!response.ok) {
            throw new Error('Gagal memperbarui stok');
        }

        const data = await response.json();
        alert(data.message);
        fetchStockReport(); // Memuat ulang laporan stok setelah update
    } catch (error) {
        console.error('Gagal memperbarui stok:', error);
        alert('Terjadi kesalahan saat memperbarui stok.');
    }
}

window.onload = function () {
    fetchPreviousPrices();  // Memanggil fungsi untuk memuat harga sebelumnya
    fetchStockReport();     // Memanggil fungsi untuk memuat laporan stok
};

//monitoring program =================
document.addEventListener('DOMContentLoaded', () => {
    const categoryDropdown = document.getElementById('categoryProgram');
    const tableBody = document.querySelector('.promo-monitor-table tbody');

    const fetchPrograms = (category) => {
        fetch(`/admin/monitoring-program/${category}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                tableBody.innerHTML = '';

                data.forEach(program => {
                    const row = `
                        <tr>
                            <td>${program.category}</td>
                            <td>${program.program_name}</td>
                            <td>${program.target_kuartal}</td>
                            <td>${program.discount || '0%'}</td>
                            <td>${program.cashback['330ml'] || '-'}</td>
                            <td>${program.cashback['600ml'] || '-'}</td>
                            <td>${program.cashback['1500ml'] || '-'}</td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
            })
            .catch(error => console.error('Error fetching programs:', error));
    };

    categoryDropdown.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        if (selectedCategory) {
            fetchPrograms(selectedCategory);
        }
    });
});

//UPDATE PROGRAM================
document.addEventListener('DOMContentLoaded', () => {
    const categoryDropdown = document.getElementById('categoryProgram2');
    const programDropdown = document.getElementById('programName');
    const editFormContainer = document.getElementById('editProgramFormContainer');
    const editProgramForm = document.getElementById('editProgramForm');
    let selectedProgramId = null;

    // Fungsi untuk mengambil program berdasarkan kategori
    const fetchPrograms = async (category) => {
        try {
            const response = await fetch(`/admin/programs/${category}`);
            if (!response.ok) throw new Error('Gagal mengambil program');

            const data = await response.json();
            programDropdown.innerHTML = '<option value="" disabled selected>Pilih program</option>';
            data.forEach(program => {
                const option = document.createElement('option');
                option.value = program.program_id;
                option.textContent = program.program_name;
                programDropdown.appendChild(option);
            });
            programDropdown.disabled = false;
        } catch (error) {
            console.error('Error fetching programs:', error);
            alert('Gagal mengambil daftar program. Silakan coba lagi.');
        }
    };

    // Ketika kategori dipilih, ambil nama program berdasarkan kategori
    categoryDropdown.addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        if (selectedCategory) {
            fetchPrograms(selectedCategory);
        } else {
            programDropdown.disabled = true;
            programDropdown.innerHTML = '<option value="" disabled selected>Pilih kategori terlebih dahulu</option>';
        }
    });

    // Ketika program dipilih, tampilkan form edit
    programDropdown.addEventListener('change', async (e) => {
        selectedProgramId = e.target.value;
        if (selectedProgramId) {
            try {
                const response = await fetch(`/admin/programs/${selectedProgramId}`);
                if (!response.ok) throw new Error('Gagal mengambil detail program');

                const program = await response.json();

                if (program) {
                    document.getElementById('targetKuartal').value = program.target_kuartal || '';
                    document.getElementById('discount').value = program.discount || '0';
                    document.getElementById('cashback330').value = program.cashback?.['330ml'] || '';
                    document.getElementById('cashback600').value = program.cashback?.['600ml'] || '';
                    document.getElementById('cashback1500').value = program.cashback?.['1500ml'] || '';
                    editFormContainer.style.display = 'block';
                }
            } catch (error) {
                console.error('Error fetching program details:', error);
                alert('Gagal mengambil detail program. Silakan coba lagi.');
            }
        } else {
            editFormContainer.style.display = 'none';
        }
    });

    // Kirim form untuk menyimpan perubahan
    editProgramForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedProgramId) {
            alert('Pilih program terlebih dahulu.');
            return;
        }

        const formData = new FormData(e.target);
        const data = {
            program_id: selectedProgramId,
            program_name: formData.get('program_name') || undefined,
            target_kuartal: formData.get('target_kuartal') || undefined,
            discount: formData.get('discount') || undefined,
            cashback: {}
        };

        ['330ml', '600ml', '1500ml'].forEach(size => {
            const cashbackValue = formData.get(`cashback[${size}]`);
            if (cashbackValue) {
                data.cashback[size] = cashbackValue;
            }
        });

        try {
            const response = await fetch('/admin/update-program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('Program berhasil diperbarui');
                window.location.reload(); // Reload halaman setelah berhasil
            } else {
                const error = await response.json();
                alert(`Gagal memperbarui program: ${error.message}`);
            }
        } catch (error) {
            console.error('Error updating program:', error);
            alert('Terjadi kesalahan saat memperbarui program. Silakan coba lagi.');
        }
    });
});

//MENU LAPORAN PENJUALAN==================
// Mengisi dropdown tahun secara dinamis
const tahunDropdown = document.getElementById('year');
const currentYear = new Date().getFullYear();
for (let year = currentYear; year >= currentYear - 2; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    tahunDropdown.appendChild(option);
}

document.getElementById('exportExcel').addEventListener('click', () => {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const status = document.getElementById('status').value;

    if (!year) {
        alert('Silakan pilih tahun!');
        return;
    }

    window.location.href =
        `/admin/export-excel?month=${month}&year=${year}&status=${status}`;
});

// VIEW DATA LAPORAN
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2
    }).format(angka);
}

document.getElementById('viewReport').addEventListener('click', async () => {
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;
    const status = document.getElementById('status').value;

    if (!year) {
        alert("Pilih tahun terlebih dahulu!");
        return;
    }

    const response = await fetch(`/admin/get-report?month=${month}&year=${year}&status=${status}`);
    const data = await response.json();

    const tbody = document.getElementById('reportBody');
    tbody.innerHTML = "";

    data.forEach(item => {
        const row = `
            <tr>
                <td>${item.order_id}</td>
                <td>${item.nama_toko}</td>
                <td>${item.wilayah_toko}</td>
                <td>${item.nama_sales}</td>
                <td>${item.tanggal}</td>
                <td>${item.jumlah_pesanan}</td>
                <td>${formatRupiah(item.jumlah_harga)}</td>
                <td>${item.status}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
});

