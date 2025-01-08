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

 // Cek apakah pengguna sudah login
 function checkLoginStatus() {
  // Misalnya kita menyimpan status login di sessionStorage
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');

  if (!isLoggedIn) {
    // Jika belum login, batalkan pengalihan ke user.html
    document.getElementById('buy-link').addEventListener('click', function(event) {
      event.preventDefault(); // Mencegah pengalihan ke user.html
      alert("Anda harus login terlebih dahulu untuk melakukan pemesanan.");
      // Anda bisa mengarahkan pengguna ke halaman login jika diperlukan
      window.location.href = 'login.html';
    });
  }
}

// Panggil fungsi untuk mengecek status login saat halaman dimuat
window.onload = checkLoginStatus;