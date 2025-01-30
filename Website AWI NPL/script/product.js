//klik kanan dan kiri produk
document.querySelectorAll('.nplproduk > div').forEach(product => {
    const scrollArea = product.querySelector('.scrollproduk');
    const scrollLeftBtn = product.querySelector('.nav-button.left');
    const scrollRightBtn = product.querySelector('.nav-button.right');

    if (scrollLeftBtn && scrollRightBtn && scrollArea) {
        scrollLeftBtn.addEventListener('click', () => {
            scrollArea.scrollBy({ left: -500, behavior: 'smooth' });
        });

        scrollRightBtn.addEventListener('click', () => {
            scrollArea.scrollBy({ left: 500, behavior: 'smooth' });
        });
    }
});

//BACA PROGRAM DI PRODUK
//Informasi program dan promo
const button = document.getElementById('button-promo');

// Buka file PDF di tab/jendela baru
button.addEventListener('click', () => {
    window.open('PROMO NPL 40+2 DAN PROGRAM NPL.pdf', '_blank');
});

document.addEventListener('DOMContentLoaded', async () => {
    const produkItems = document.querySelectorAll('.ukurannpl');

    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Gagal mengambil data produk.');
        }
        const products = await response.json();

        // Perbarui elemen HTML hanya untuk nama dan harga
        products.forEach((product, index) => {
            if (produkItems[index]) {
                const h1Element = produkItems[index].querySelector('h1');
                const pElement = produkItems[index].querySelector('p');

                if (h1Element) h1Element.textContent = product.nama_produk;
                if (pElement) pElement.textContent = `Rp. ${parseInt(product.harga).toLocaleString('id-ID')}`;
            }
        });
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        const produkContainer = document.getElementById('produkContainer');
        produkContainer.innerHTML = `<p class="error">Tidak dapat memuat produk. Silakan coba lagi nanti.</p>`;
    }
});


