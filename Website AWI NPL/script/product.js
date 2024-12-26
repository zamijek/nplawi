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

