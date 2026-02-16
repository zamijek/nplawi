document.addEventListener('DOMContentLoaded', function () {
    showContent('pengiriman'); // langsung ke menu pengiriman
});

function showContent(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Update active menu
    const menuLinks = document.querySelectorAll('.sidebar a');
    menuLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.querySelector(
        `.sidebar a[onclick="showContent('${sectionId}')"]`
    );
    if (activeLink) {
        activeLink.classList.add('active');
    }
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
//LOGOUT SELESAI============================


//Ambil data pengiriman=========
async function fetchPengiriman() {
    try {
        const response = await fetch('/admin/pengiriman');
        const data = await response.json();

        loadPengiriman(data);

    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchPengiriman();
});

function loadPengiriman(data){
    const tbody = document.getElementById("pengirimanBody");
    tbody.innerHTML = "";

    data.forEach(order => {

        const sudahUpload = order.bukti_kirim ? true : false;

        tbody.innerHTML += `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.nama_toko}</td>
                <td>${order.no_telp}</td>
                <td>${order.ukuran_330ml}</td>
                <td>${order.ukuran_600ml}</td>
                <td>${order.ukuran_1500ml}</td>
                <td>
                    ${
                        order.status === "Terkirim"
                        ? '<span style="color:green;font-weight:bold;">Terkirim</span>'
                        : '<span style="color:orange;font-weight:bold;">Dikirim</span>'
                    }
                </td>
                <td>
                    ${
                        sudahUpload 
                        ? '<span style="color:green;">✔</span>' 
                        : '<span style="color:red;">✖</span>'
                    }
                </td>
                <td>
                ${
                    sudahUpload
                    ? `
                    <div class="icon-action">
                        <a href="${order.bukti_kirim}" target="_blank">
                            <i class="fa-solid fa-eye"></i>
                        </a>

                        <input type="file" 
                                style="display:none"
                                id="file-${order.order_id}"
                                onchange="uploadBukti(${order.order_id}, this)">

                        <button onclick="document.getElementById('file-${order.order_id}').click()">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    </div>
                    `
                    :
                    `
                    <input type="file"
                            onchange="uploadBukti(${order.order_id}, this)">
                    `
                }
                </td>
            </tr>
        `;
    });
}


//UPLOAD BUKTI============
async function uploadBukti(orderId, inputFile) {
    const file = inputFile.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("bukti", file);

    try {
        const response = await fetch(`/admin/upload-bukti/${orderId}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);

            // Refresh data supaya status & icon berubah
            fetchPengiriman();

        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error(error);
        alert("Upload gagal");
    }
}

//Ambil data kurir==============
async function fetchProfilKurir() {
    try {

        const token = localStorage.getItem("token");

        if (!token) {
            console.error("Token tidak ditemukan");
            return;
        }

        const response = await fetch('/admin/profil-kurir', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        document.getElementById("namaKurir").textContent = data.nama_lengkap;
        document.getElementById("telpKurir").textContent = data.no_telp;

    } catch (error) {
        console.error("Gagal mengambil profil:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchProfilKurir();
});

//Ambil statistik kurir============
async function fetchStatistikPengiriman() {
    try {

        const token = localStorage.getItem("token");

        const response = await fetch('/admin/statistik-pengiriman', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        document.getElementById("todayDelivery").textContent = data.total_hari_ini;
        document.getElementById("monthDelivery").textContent = data.total_bulan_ini;

    } catch (error) {
        console.error("Gagal mengambil statistik:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    fetchProfilKurir();
    fetchStatistikPengiriman();
});



