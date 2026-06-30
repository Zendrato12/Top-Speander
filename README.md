# 🏆 AVIAN 7.7 TOP SPENDER CHALLENGE — Leaderboard Website

**Indo Super Grosir Cianjur × Avian Brands**  
Periode: 1 Juli – 31 Juli 2026

---

## 📌 Deskripsi Proyek

Website leaderboard **real-time** untuk program promosi **AVIAN 7.7 Top Spender Challenge**.  
Data diambil langsung dari **Google Sheets** melalui **Google Apps Script Web App** dan ditampilkan secara otomatis tanpa perlu login, database, atau sistem admin.

---

## ✅ Fitur yang Sudah Diimplementasikan

| Fitur | Status |
|---|---|
| Header dengan logo Avian & Indo Super Grosir | ✅ |
| Informasi program + stats bar ringkasan | ✅ |
| Leaderboard tabel real-time dari Google Sheets | ✅ |
| Medal 🥇🥈🥉 untuk Ranking 1–3 | ✅ |
| Badge **TOP 10** untuk ranking 4–10 | ✅ |
| Highlight khusus untuk Ranking 1–3 | ✅ |
| Format Rupiah Indonesia (Rp 25.500.000) | ✅ |
| Search customer berdasarkan Nama atau No. HP | ✅ |
| Tampilkan selisih dengan ranking di atas | ✅ |
| Last Update (tanggal & jam) | ✅ |
| Auto-refresh setiap 5 menit + countdown timer | ✅ |
| Tombol **Refresh Sekarang** | ✅ |
| Loading spinner overlay saat pertama kali | ✅ |
| Skeleton loader saat refresh data | ✅ |
| Animasi halus saat data berubah (highlight row) | ✅ |
| Error banner + tombol Retry | ✅ |
| QR Code placeholder | ✅ |
| Responsive design (Mobile & Desktop) | ✅ |
| Identitas warna Avian (Merah, Biru, Putih) | ✅ |
| Demo data otomatis saat URL belum dikonfigurasi | ✅ |
| Footer: © 2026 ISG Cianjur × Avian Brands | ✅ |
| Badge event mendatang (8.8, 9.9) di footer | ✅ |
| Pause auto-refresh saat tab tidak aktif | ✅ |
| Auto-refresh saat koneksi internet kembali | ✅ |

---

## 📁 Struktur File

```
avian-leaderboard/
├── index.html          ← Halaman utama (struktur HTML)
├── css/
│   └── style.css       ← Semua styling & responsivitas
├── js/
│   └── script.js       ← Logika fetch, render, search, timer
├── assets/
│   └── favicon.svg     ← Ikon tab browser
└── README.md           ← Dokumentasi ini
```

---

## ⚙️ Cara Setup Google Sheets

### Langkah 1 — Buat Google Sheets

Buat spreadsheet baru dengan nama tab: **`Leaderboard`**

| Kolom A | Kolom B | Kolom C | Kolom D | Kolom E |
|---|---|---|---|---|
| Ranking | Nama Customer | Nomor HP | Total Pembelian | Last Update |
| 1 | Bapak Santoso | 08123456789 | 45750000 | 2026-07-10 08:30 |
| 2 | Ibu Sari Dewi | 08987654321 | 38200000 | 2026-07-10 08:30 |

> **Catatan:** Total Pembelian diisi dalam angka murni (tanpa titik/koma/Rp).  
> Website akan otomatis memformat menjadi **Rp 45.750.000**.

---

### Langkah 2 — Buat Google Apps Script

1. Buka Google Sheets → **Extensions → Apps Script**
2. Hapus kode default, tempel kode berikut:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Leaderboard"); // Sesuaikan nama sheet jika berbeda

  const data  = sheet.getDataRange().getValues();
  const headers = ["ranking", "nama", "noHp", "totalPembelian", "lastUpdate"];

  const rows = data
    .slice(1) // Lewati baris header
    .filter(row => row[1]) // Pastikan nama tidak kosong
    .map(row => ({
      ranking:        Number(row[0]) || 0,
      nama:           String(row[1]).trim(),
      noHp:           String(row[2]).trim(),
      totalPembelian: parseFloat(String(row[3]).replace(/[^0-9.]/g, '')) || 0,
      lastUpdate:     row[4] ? String(row[4]) : new Date().toISOString(),
    }))
    .sort((a, b) => b.totalPembelian - a.totalPembelian)
    .map((row, i) => ({ ...row, ranking: i + 1 }));

  const response = ContentService
    .createTextOutput(JSON.stringify({
      data: rows,
      lastUpdate: new Date().toISOString(),
      total: rows.length
    }))
    .setMimeType(ContentService.MimeType.JSON);

  return response;
}
```

---

### Langkah 3 — Deploy sebagai Web App

1. Klik **Deploy** → **New Deployment**
2. Klik ikon ⚙️ → pilih **Web App**
3. Isi deskripsi (opsional)
4. **Execute as:** `Me`
5. **Who has access:** `Anyone`
6. Klik **Deploy** → **Authorize** → Klik **Deploy**
7. **Salin URL** yang muncul

---

### Langkah 4 — Pasang URL di Website

Buka file **`js/script.js`**, cari baris:

```javascript
const SHEET_URL = "PASTE_URL_DISINI";
```

Ganti dengan URL Anda:

```javascript
const SHEET_URL = "https://script.google.com/macros/s/XXXX.../exec";
```

**Simpan file → Upload ke hosting → Selesai! ✅**

---

## 🔄 Cara Update Data Leaderboard

Cukup edit nilai di Google Sheets → Simpan.  
Website akan otomatis menampilkan data terbaru dalam **5 menit** (atau klik tombol **Refresh Sekarang**).

---

## 🎨 Kustomisasi

### Ubah Interval Auto-Refresh

Di `js/script.js`, cari dan ubah:
```javascript
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit
// Contoh: 2 menit = 2 * 60 * 1000
```

### Ubah Nama Event / Periode

Edit di `index.html`:
```html
<h1 class="event-title">AVIAN <span class="highlight-77">7.7</span> TOP SPENDER...</h1>
<p class="event-period">Periode 1 Juli – 31 Juli 2026</p>
```

### Pasang Logo Asli

Ganti bagian `.logo-placeholder` di `index.html` dengan tag `<img>`:
```html
<img src="assets/logo-avian.png" alt="Avian Brands" width="120" />
```

### Pasang QR Code Asli

Ganti `.qr-inner` di `index.html` dengan:
```html
<img src="assets/qr-code.png" alt="QR Code Leaderboard" width="120" />
```

---

## 🚀 Pengembangan untuk Event Berikutnya

| Event | Perubahan yang Dibutuhkan |
|---|---|
| 🎨 Color Hunt 8.8 | Ubah judul, periode, warna aksen, nama sheet |
| 🍀 Lucky Dip Rejeki 9.9 | Ubah judul, periode, tambah kolom hadiah |

**File yang perlu diubah:**
- `index.html` — Judul, periode, deskripsi
- `js/script.js` — `EVENT_NAME`, `SHEET_URL`, `DEMO_DATA`
- `css/style.css` — Warna tema (jika ingin berbeda)

---

## 📱 Kompatibilitas Browser

| Browser | Desktop | Mobile |
|---|---|---|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |

---

## 📞 Kontak

**Indo Super Grosir Cianjur**  
© 2026 Indo Super Grosir Cianjur × Avian Brands  
_Bersama Membangun Rumah Impian Indonesia_
