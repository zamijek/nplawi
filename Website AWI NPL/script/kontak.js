
    // Seleksi semua elemen <a> di dalam div dengan class 'kontaktertera'
    const links = document.querySelectorAll('.kontaktertera a');

    // Tambahkan event listener ke setiap link
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Mencegah aksi default
            const url = this.getAttribute('href'); // Ambil URL dari href
            window.open(url, '_blank'); // Buka di tab baru
        });
    });

