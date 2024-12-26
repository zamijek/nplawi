//KLIK KANAN DAN KIRI GAMBAR
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('#scrolllableContainer img');
  const scrollLeftBtn = document.getElementById('scrollLeft');
  const scrollRightBtn = document.getElementById('scrollRight');
  let currentIndex = 0;

  // Fungsi untuk memperbarui tampilan gambar
  function updateActiveImage() {
    images.forEach((img, index) => {
      img.style.display = index === currentIndex ? 'block' : 'none';
    });
  }

  // Klik tombol kiri
  scrollLeftBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateActiveImage();
  });

  // Klik tombol kanan
  scrollRightBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateActiveImage();
  });

  // Inisialisasi tampilan gambar pertama
  updateActiveImage();
});
