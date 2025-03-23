# Student-WABot

Student-WABot adalah bot WhatsApp yang dirancang khusus untuk membantu siswa mengelola tugas sekolah dengan lebih efisien. Dengan berbagai fitur canggih, bot ini membantu mengorganisir tugas, mengambil informasi secara otomatis dari web, serta mengonversi data ke dalam format PDF. Solusi tepat untuk mendukung aktivitas belajar dan mengatur jadwal harian!

---

## ✨ Fitur Utama

- **Integrasi WhatsApp**  
  Menggunakan library [`@whiskeysockets/baileys`](https://github.com/whiskeysockets/baileys) untuk komunikasi real-time dengan WhatsApp.

- **Manajemen Tugas**  
  Menyediakan fitur untuk:
  - Menambahkan tugas
  - Menghapus tugas
  - Menampilkan jadwal tugas  
  *(Implementasi di `function/tugas.js`, `function/jadwaltugas.js`, dan `function/delete.js`)*

- **Pengelompokan Berdasarkan Mata Pelajaran**  
  Tugas diorganisir dalam direktori sesuai mata pelajaran (misal: AIJ, ASJ, B_INDO, dll) untuk memudahkan pencarian dan pengelolaan.

- **Web Scraping**  
  Mengambil data dan informasi dari situs web untuk membantu menyelesaikan tugas secara otomatis.  
  *(Fitur terdapat di `function/scrape.js`)*

- **Konversi ke PDF**  
  Mengubah konten atau data menjadi format PDF, memudahkan distribusi dan dokumentasi.  
  *(Fitur terdapat di `function/topdf.js`)*

- **Pemrosesan Gambar**  
  Mendownload dan memproses gambar yang dikirim melalui pesan, termasuk integrasi fungsi AI.  
  *(Fitur terdapat di `function/aiFunction.js`)*

- **Pemrosesan Input**  
  Mengelola dan menafsirkan perintah pengguna secara efisien.  
  *(Fitur terdapat di `function/input.js`)*

- **Fungsi Utilitas**  
  Kumpulan fungsi pendukung untuk memastikan kinerja bot optimal.  
  *(Terdapat di `function/utils.js`)*

- **Fitur AI**  
  Menyediakan kemampuan berbasis kecerdasan buatan untuk meningkatkan interaksi dan respon bot.  
  *(Diimplementasikan di `function/aiFunction.js`)*

---

## 🚀 Instalasi

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan Student-WABot:

1. **Clone Repository:**

   ```bash
   git clone https://github.com/xiryuuGame/student-wabot.git
   cd student-wabot
   ```

2. **Jalankan Skrip Instalasi:**

   ```bash
   bash install.sh
   ```

   Skrip ini akan membuat direktori mata pelajaran dan menginstal seluruh dependensi yang diperlukan.

3. **Konfigurasi Variabel Lingkungan:**

   Buat file `.env` dan tambahkan baris berikut (sesuaikan dengan API key Anda):

   ```env
   GEMINI_API_KEY=...
   ```

4. **Jalankan Bot:**

   ```bash
   npm start
   ```

---

## 🗂️ Struktur Direktori

```
student-wabot/
├── README.md             # Dokumentasi proyek
├── ecosystem.config.cjs  # Konfigurasi PM2 untuk manajemen proses
├── index.js              # Entry point aplikasi
├── install.sh            # Skrip instalasi otomatis
├── package.json          # Konfigurasi dependensi proyek
├── function/             # Kumpulan fungsi utama bot
│   ├── aiFunction.js     # Fungsi AI dan pemrosesan gambar
│   ├── delete.js         # Fungsi penghapusan tugas/data
│   ├── function.js       # Fungsi umum
│   ├── input.js          # Pemrosesan perintah input
│   ├── jadwaltugas.js    # Manajemen jadwal tugas
│   ├── scrape.js         # Web scraping untuk pengambilan informasi
│   ├── topdf.js          # Konversi konten menjadi PDF
│   ├── tugas.js          # Manajemen tugas sekolah
│   └── utils.js          # Fungsi utilitas pendukung
└── temp/                 # Direktori untuk file sementara
```

---

## 💬 Cara Penggunaan

- **Mengirim Perintah:**  
  Kirim perintah melalui WhatsApp ke nomor yang sudah dikonfigurasi. Daftar perintah dapat dilihat langsung di kode pada direktori `function/`.

- **Integrasi dan Notifikasi:**  
  Bot akan merespons setiap perintah dengan memberikan notifikasi dan konfirmasi aksi yang dilakukan, memastikan manajemen tugas berjalan dengan lancar.

---

## 📦 Dependencies

Proyek ini menggunakan beberapa package NPM, antara lain:
- **@hapi/boom:** Penanganan error HTTP.
- **@whiskeysockets/baileys:** Integrasi dengan WhatsApp.
- **adm-zip:** Pengelolaan arsip ZIP.
- **axios:** Permintaan HTTP.
- **chalk:** Menambahkan warna pada output terminal.
- **cheerio:** Parsing HTML untuk web scraping.
- **date-fns:** Manipulasi tanggal.
- **dotenv:** Memuat variabel lingkungan.
- **jimp:** Pemrosesan gambar.
- **pdf-lib:** Pembuatan dan manipulasi PDF.
- **qrcode-terminal:** Menampilkan kode QR di terminal.

---

## 🤝 Kontribusi

Kontribusi sangat kami hargai! Jika Anda ingin berkontribusi:
1. Fork repository ini.
2. Buat branch baru untuk fitur atau perbaikan.
3. Ajukan pull request dengan penjelasan perubahan.

---

## ⚖️ Lisensi

Saat ini belum ada lisensi resmi. Silakan hubungi [xiryuuGame](https://github.com/xiryuuGame) jika Anda berminat menggunakan atau mendistribusikan ulang proyek ini.

---

Selamat menggunakan Student-WABot! Semoga bot ini dapat membantu mempermudah manajemen tugas sekolah Anda dan meningkatkan produktivitas belajar.

---

*Dikembangkan dengan ❤️ oleh [xiryuuGame](https://github.com/xiryuuGame).*

---
