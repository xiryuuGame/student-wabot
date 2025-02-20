# Student-WABot

Student-WABot adalah bot WhatsApp yang dirancang khusus untuk membantu siswa dalam mengelola tugas sekolah. Bot ini memiliki berbagai fitur seperti manajemen tugas, scraping informasi dari situs web, serta konversi data ke format PDF.

---

## ✨ Fitur Utama

### 🔹 Integrasi WhatsApp
Menggunakan library `@whiskeysockets/baileys` untuk berkomunikasi dengan WhatsApp.

### 📚 Manajemen Tugas
Mengelola tugas sekolah, termasuk menambahkan, menghapus, dan menampilkan tugas.
- 📌 **Tambah tugas**
- 🗑 **Hapus tugas**
- 📅 **Jadwal tugas**

(Fungsi ini terdapat di `function/tugas.js`, `function/jadwaltugas.js`, `function/delete.js`)

### 📌 Pengelompokan Berdasarkan Mata Pelajaran
Bot ini mengorganisir tugas berdasarkan mata pelajaran dengan membuat direktori untuk masing-masing, seperti **AIJ**, **ASJ**, **B\_INDO**, dll.

### 🌍 Web Scraping
Mengambil informasi dari situs web untuk membantu mengerjakan tugas secara otomatis.
(Fitur ini terdapat di `function/scrape.js`)

### 📄 Konversi ke PDF
Mengubah data atau konten ke dalam format PDF.
(Fitur ini terdapat di `function/topdf.js`)

### 🖼 Pemrosesan Gambar
Mendownload dan memproses gambar dari pesan yang dikutip.
(Fitur ini terdapat di `function/aiFunction.js`)

### 📝 Pemrosesan Input
Mengelola input dari pengguna dan memahami perintah.
(Fitur ini terdapat di `function/input.js`)

### 🔧 Fungsi Utilitas
Berisi berbagai fungsi tambahan yang mendukung kinerja bot.
(Fitur ini terdapat di `function/utils.js`)

### 🤖 Fitur AI
Memungkinkan adanya fitur berbasis kecerdasan buatan.
(Fitur ini terdapat di `function/aiFunction.js`)

---

## 📦 Dependencies
Bot ini menggunakan beberapa dependensi NPM, di antaranya:

- `@hapi/boom` → Untuk menangani error HTTP
- `@whiskeysockets/baileys` → Untuk integrasi dengan WhatsApp
- `adm-zip` → Untuk menangani arsip ZIP
- `axios` → Untuk melakukan permintaan HTTP
- `chalk` → Untuk menampilkan warna pada output terminal
- `cheerio` → Untuk parsing HTML (web scraping)
- `date-fns` → Untuk manipulasi tanggal
- `dotenv` → Untuk memuat variabel lingkungan
- `jimp` → Untuk pemrosesan gambar
- `pdf-lib` → Untuk pembuatan dan manipulasi PDF
- `qrcode-terminal` → Untuk menampilkan kode QR di terminal

---

## 🛠 Instalasi

1. **Clone repository ini:**  
   ```bash
   git clone https://github.com/username/student-wabot.git
   cd student-wabot
   ```
2. **Jalankan skrip instalasi:**  
   ```bash
   bash install.sh
   ```
   Skrip ini akan membuat direktori mata pelajaran dan menginstal dependensi yang diperlukan.
3. **Konfigurasi variabel lingkungan (jika diperlukan).**
4. **Jalankan bot:**  
   ```bash
   npm start
   ```

---

## 📂 Struktur Direktori
```
bot-wa/
├── README.md             # File dokumentasi ini
├── ecosystem.config.cjs  # Konfigurasi PM2
├── index.js              # File utama aplikasi
├── install.sh            # Skrip instalasi
├── package.json          # File dependensi proyek
├── function/             # Direktori yang berisi fungsi bot
│   ├── aiFunction.js     # Fungsi berbasis AI
│   ├── delete.js         # Fungsi untuk menghapus tugas/data
│   ├── function.js       # Fungsi umum
│   ├── input.js          # Fungsi pemrosesan input
│   ├── jadwaltugas.js    # Fungsi pengelolaan jadwal tugas
│   ├── scrape.js         # Fungsi web scraping
│   ├── topdf.js          # Fungsi konversi ke PDF
│   ├── tugas.js          # Fungsi manajemen tugas
│   └── utils.js          # Fungsi utilitas
└── temp/                 # Direktori sementara
```

---

## 📖 Cara Penggunaan

Untuk menggunakan bot ini, kirim perintah tertentu ke nomor WhatsApp yang telah terhubung. Perintah dan fungsionalitas spesifik dapat ditemukan di kode dalam direktori `function/`.

---

🚀 **Selamat menggunakan Student-WABot!**

