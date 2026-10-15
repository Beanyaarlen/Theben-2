THEBEN MOTION LAYER (gaya Lusion)
==================================

File baru (tidak ada library eksternal, tidak perlu build/npm):
  motion/lusion-boot.js   – kecil, dimuat di <head>; menyiapkan transisi halaman tanpa "kedip"
  motion/lusion.js        – semua efek global
  motion/lusion-scene.js  – scene 3D iONprime (WebGL), hanya dimuat di beranda
  motion/lusion.css       – gaya untuk semua efek

Setiap halaman (index.html, Info/*.html, dan private/templates/...) mendapat 3 baris baru
tepat di bawah <link rel="stylesheet" href="style.css">. Selain itu HTML, CMS, dan
konten tidak diubah — semua teks tetap bisa diedit di admin.php.

Efek yang ditambahkan
  1. Transisi tirai biru saat pindah halaman
  2. Smooth scroll (mouse wheel, desktop saja)
  3. Header bersembunyi saat scroll turun, muncul saat naik
  4. Judul muncul per kata, elemen lain fade-up bertahap
  5. Scene 3D iONprime PB: kamera terbang melewati lorong grid,
     keypad berputar, LED tiap tombol menyala (Lampu, Tirai, Suhu, Scene)
  6. Kartu produk: tilt 3D, zoom foto, cahaya mengikuti kursor, label "Lihat"/"Buka ↗"
  7. Tombol magnetik
  8. CTA "Butuh solusi Theben?" dengan foto produk melayang + parallax

Aksesibilitas & performa
  - prefers-reduced-motion dihormati: tanpa transisi/smooth scroll,
    scene 3D tampil sebagai gambar statis.
  - Di HP: tanpa kursor/tilt/smooth scroll, scene 3D lebih ringan.
  - Jika WebGL tidak tersedia, scene menampilkan foto pb.webp.
  - Scene 3D hanya me-render saat terlihat di layar.

Mengubah teks scene 3D
  Teks langkah (Lampu, Tirai, dst.) ada di motion/lusion.js, fungsi initScene().
  Warna LED ada di LED_COL pada motion/lusion-scene.js.

Mematikan efek tertentu
  Di bagian akhir motion/lusion.js (fungsi boot) hapus/komentari baris
  init...() yang tidak diinginkan, misalnya // initCursor();
  Mematikan semua efek: hapus 3 baris motion/ dari <head> setiap halaman.

Pemasangan di Hostinger
  Upload folder motion/ dan semua file HTML yang diperbarui (termasuk
  private/templates/). Bersihkan cache Hostinger/CDN/browser sesudahnya.
