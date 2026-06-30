/**
 * ================================================================
 * AVIAN 7.7 TOP SPENDER CHALLENGE - Main JavaScript
 * Leaderboard Website | Indo Super Grosir Cianjur x Avian Brands
 *
 * Fitur:
 *  - Fetch data real-time dari Google Apps Script (JSON)
 *  - Tampilkan leaderboard dengan animasi
 *  - Search berdasarkan nama atau nomor HP
 *  - Auto-refresh setiap 5 menit + countdown timer
 *  - Manual refresh dengan tombol
 *  - Skeleton loading saat ambil data
 *  - Error handling & retry
 *  - Format Rupiah Indonesia
 *
 * Cara Setup Google Sheets:
 *  1. Buat Google Sheets dengan kolom:
 *     Ranking | Nama Customer | Nomor HP | Total Pembelian | Last Update
 *  2. Buat Google Apps Script Web App
 *  3. Tempel URL hasil deploy ke variabel SHEET_URL di bawah
 * ================================================================
 */

/* ================================================================
   KONFIGURASI - UBAH HANYA BAGIAN INI
   ================================================================ */

/**
 * URL Google Apps Script Web App
 * Ganti "PASTE_URL_DISINI" dengan URL dari deploy Google Apps Script Anda.
 *
 * Cara mendapatkan URL:
 *  1. Buka Google Sheets → Extensions → Apps Script
 *  2. Tempel kode Apps Script (lihat README.md untuk template)
 *  3. Klik Deploy → New Deployment → Type: Web App
 *  4. Execute as: Me | Who has access: Anyone
 *  5. Deploy → Salin URL → Tempel di sini
 */
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxXxmCABImMCBusq5k_dL2FZJ9fQlL5fA-UO7g8TGP_hXA0-hP3akEFdK9iE8P-JxylzA/exec";

/**
 * Interval auto-refresh dalam milidetik
 * Default: 5 menit (300.000 ms)
 */
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit

/**
 * Nama event untuk ditampilkan di browser tab
 */
const EVENT_NAME = "AVIAN 7.7 TOP SPENDER CHALLENGE";

/* ================================================================
   DEMO DATA - Digunakan saat SHEET_URL belum dikonfigurasi
   Hapus atau kosongi array ini saat sudah ada URL asli
   ================================================================ */
/*const DEMO_DATA = [
  { ranking: 1, nama: "Bapak Santoso", noHp: "08123456789", totalPembelian: 45750000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 2, nama: "Ibu Sari Dewi", noHp: "08987654321", totalPembelian: 38200000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 3, nama: "Bapak Hendra", noHp: "08567890123", totalPembelian: 32500000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 4, nama: "Toko Maju Jaya", noHp: "08345678901", totalPembelian: 28900000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 5, nama: "Ibu Ratna", noHp: "08678901234", totalPembelian: 25100000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 6, nama: "Bapak Agus Setiawan", noHp: "08456789012", totalPembelian: 21750000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 7, nama: "CV. Karya Indah", noHp: "08234567890", totalPembelian: 18300000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 8, nama: "Bapak Agus", noHp: "08765432109", totalPembelian: 13800000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 9, nama: "Ibu Wulandari", noHp: "08890123456", totalPembelian: 11200000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 10, nama: "Toko Sumber Rezeki", noHp: "08901234567", totalPembelian: 9850000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 11, nama: "Bapak Dedi", noHp: "08012345678", totalPembelian: 7600000, lastUpdate: "2026-07-10 08:30" },
  { ranking: 12, nama: "Ibu Fitri Handayani", noHp: "08123098765", totalPembelian: 5400000, lastUpdate: "2026-07-10 08:30" },
];
*/
/* ================================================================
   STATE APLIKASI
   ================================================================ */
let leaderboardData  = [];      // Data leaderboard yang sedang ditampilkan
let isLoading        = false;   // Status sedang loading
let autoRefreshTimer = null;    // Timer auto-refresh
let countdownTimer   = null;    // Timer countdown
let countdownSeconds = AUTO_REFRESH_INTERVAL / 1000; // Detik tersisa
let searchDebounce   = null;    // Debounce untuk input pencarian
let isDemoMode       = false;   // Apakah menggunakan demo data

/* ================================================================
   INISIALISASI APLIKASI
   ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  console.log(`🚀 ${EVENT_NAME} - Leaderboard Initialized`);

  // Setup event listener pencarian
  setupSearch();

  // Mulai fetch data pertama kali
  fetchLeaderboardData();

  // Mulai auto-refresh + countdown
  startAutoRefresh();
});

/* ================================================================
   FUNGSI FETCH DATA DARI GOOGLE SHEETS
   ================================================================ */

/**
 * fetchLeaderboardData
 * Mengambil data dari Google Apps Script Web App.
 * Jika URL belum dikonfigurasi, tampilkan demo data.
 */
async function fetchLeaderboardData() {
  if (isLoading) return; // Hindari double fetch
  isLoading = true;

  showLoadingState();
  hideError();

  try {
    // Cek apakah URL sudah dikonfigurasi
    if (!SHEET_URL || SHEET_URL === "https://script.google.com/macros/s/AKfycbxXxmCABImMCBusq5k_dL2FZJ9fQlL5fA-UO7g8TGP_hXA0-hP3akEFdK9iE8P-JxylzA/exec" || SHEET_URL.trim() === "") {
      console.warn("⚠️ SHEET_URL belum dikonfigurasi. Menampilkan data demo.");
      isDemoMode = true;
      await simulateDelay(800); // Simulasi loading
      processData(DEMO_DATA, "Demo Mode");
    } else {
      isDemoMode = false;
      // Fetch dari Google Apps Script
      const response = await fetch(SHEET_URL, {
        method: "GET",
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();

      // Validasi struktur response
      if (!json || !Array.isArray(json.data)) {
        throw new Error("Format data tidak valid. Pastikan Apps Script mengembalikan { data: [] }");
      }

      processData(json.data, json.lastUpdate || null);
    }
  } catch (error) {
    console.error("❌ Gagal mengambil data:", error);
    showError(`Gagal mengambil data: ${error.message}`);

    // Jika ada data lama, tetap tampilkan
    if (leaderboardData.length === 0) {
      // Tampilkan demo jika belum ada data sama sekali
      isDemoMode = true;
      processData(DEMO_DATA, "Demo Mode (offline)");
    }
  } finally {
    isLoading = false;
    hideLoadingOverlay();
  }
}

/**
 * processData
 * Memproses, mengurutkan, dan menampilkan data ke leaderboard
 * @param {Array} rawData - Data mentah dari Google Sheets
 * @param {string|null} lastUpdateStr - String waktu last update dari sheet
 */
function processData(rawData, lastUpdateStr) {
  // Normalize & sort berdasarkan total pembelian (descending)
  const normalized = rawData
    .map((row) => ({
      ranking:        parseInt(row.ranking)        || 0,
      nama:           String(row.nama              || "").trim(),
      noHp:           String(row.noHp              || row["nomor_hp"] || row["no_hp"] || "").trim(),
      totalPembelian: parseFloat(row.totalPembelian || row["total_pembelian"] || 0),
      lastUpdate:     row.lastUpdate               || row["last_update"] || "",
    }))
    .filter((row) => row.nama !== "") // Buang baris kosong
    .sort((a, b) => b.totalPembelian - a.totalPembelian)
    .map((row, index) => ({ ...row, ranking: index + 1 })); // Re-rank

  // Deteksi perubahan data untuk animasi highlight
  const changedRankings = detectChanges(leaderboardData, normalized);

  // Simpan ke state
  leaderboardData = normalized;

  // Render table
  renderLeaderboard(normalized, changedRankings);

  // Update stats
  updateStats(normalized);

  // Update waktu last update
  updateLastUpdate(lastUpdateStr, normalized);
}

/**
 * detectChanges
 * Mendeteksi baris mana yang berubah dibanding data sebelumnya
 * @returns {Set} Set ranking yang berubah
 */
function detectChanges(oldData, newData) {
  const changed = new Set();
  const oldMap = new Map(oldData.map((r) => [r.ranking, r.totalPembelian]));

  newData.forEach((row) => {
    const oldAmount = oldMap.get(row.ranking);
    if (oldAmount !== undefined && oldAmount !== row.totalPembelian) {
      changed.add(row.ranking);
    }
  });

  return changed;
}

/* ================================================================
   FUNGSI RENDER LEADERBOARD
   ================================================================ */

/**
 * renderLeaderboard
 * Mengisi tbody tabel dengan baris data
 * @param {Array} data - Data leaderboard
 * @param {Set} changedRankings - Set ranking yang berubah (untuk animasi)
 */
function renderLeaderboard(data, changedRankings = new Set()) {
  const tbody = document.getElementById("leaderboard-body");
  const emptyState = document.getElementById("empty-state");
  const tableWrapper = document.querySelector(".table-wrapper");

  if (!data || data.length === 0) {
    if (tableWrapper) tableWrapper.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  // Sembunyikan empty state, tampilkan tabel
  if (emptyState) emptyState.style.display = "none";
  if (tableWrapper) tableWrapper.style.display = "block";

  // Tambahkan class refresh untuk animasi
  if (tbody) tbody.classList.add("table-refreshing");

  // Buat semua baris HTML
  const rowsHTML = data
    .map((row, index) => buildTableRow(row, index, changedRankings))
    .join("");

  // Inject ke DOM
  if (tbody) {
    tbody.innerHTML = rowsHTML;

    // Tambahkan delay animasi bertahap untuk setiap baris
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((tr, i) => {
      tr.style.animationDelay = `${i * 0.04}s`;
    });

    // Hapus class refreshing setelah animasi selesai
    setTimeout(() => tbody.classList.remove("table-refreshing"), 600);
  }
}

/**
 * buildTableRow
 * Membangun HTML string untuk satu baris tabel
 * @param {Object} row - Data satu baris
 * @param {number} index - Index (0-based)
 * @param {Set} changedRankings - Ranking yang berubah
 * @returns {string} HTML string
 */
function buildTableRow(row, index, changedRankings) {
  const rank     = row.ranking;
  const isTop3   = rank <= 3;
  const isTop10  = rank <= 10;
  const isChanged = changedRankings.has(rank);

  // Kelas baris berdasarkan ranking
  let rowClass = "";
  if (rank === 1) rowClass = "rank-1";
  else if (rank === 2) rowClass = "rank-2";
  else if (rank === 3) rowClass = "rank-3";
  if (isChanged) rowClass += " highlight-change";

  // Ikon/badge ranking
  const rankDisplay = buildRankDisplay(rank, isTop10);

  // Class nama berdasarkan rank
  const nameClass = isTop3 ? `rank-${rank}-name` : "";

  // Format nominal
  const formattedAmount = formatRupiah(row.totalPembelian);

  return `
    <tr class="${rowClass}" data-ranking="${rank}" data-nama="${escapeHtml(row.nama)}" data-hp="${escapeHtml(row.noHp)}" data-amount="${row.totalPembelian}">
      <td class="rank-cell">
        ${rankDisplay}
      </td>
      <td class="name-cell ${nameClass}">
        ${escapeHtml(row.nama)}
      </td>
      <td class="amount-cell">
        ${formattedAmount}
      </td>
    </tr>
  `;
}

/**
 * buildRankDisplay
 * Membangun tampilan ranking (medal emoji / angka + badge TOP 10)
 */
function buildRankDisplay(rank, isTop10) {
  let inner = "";

  if (rank === 1) {
    inner = `<span class="rank-medal" title="Ranking 1 - Juara">🥇</span>`;
  } else if (rank === 2) {
    inner = `<span class="rank-medal" title="Ranking 2">🥈</span>`;
  } else if (rank === 3) {
    inner = `<span class="rank-medal" title="Ranking 3">🥉</span>`;
  } else {
    const top10Badge = isTop10
      ? `<span class="top10-badge" aria-label="Top 10">TOP 10</span>`
      : "";
    inner = `<span class="rank-number">${rank}</span>${top10Badge}`;
  }

  return inner;
}

/* ================================================================
   FUNGSI SEARCH CUSTOMER
   ================================================================ */

/**
 * setupSearch
 * Inisialisasi event listener untuk input pencarian
 */
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const clearBtn    = document.getElementById("search-clear");

  if (!searchInput) return;

  // Input dengan debounce 300ms
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();

    // Tampilkan/sembunyikan tombol clear
    if (clearBtn) clearBtn.style.display = query ? "flex" : "none";

    // Debounce pencarian
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        hideSearchResult();
      }
    }, 300);
  });

  // Tombol clear
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      hideSearchResult();
      searchInput.focus();
    });
  }

  // Trigger pencarian saat tekan Enter
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(searchDebounce);
      const query = searchInput.value.trim();
      if (query.length >= 2) performSearch(query);
    }
  });
}

/**
 * performSearch
 * Mencari customer berdasarkan nama atau nomor HP
 * @param {string} query - Kata kunci pencarian
 */
function performSearch(query) {
  const resultDiv = document.getElementById("search-result");
  if (!resultDiv) return;

  const q = query.toLowerCase().replace(/\s+/g, " ");

  // Cari di leaderboard data
  const found = leaderboardData.find((row) => {
    const nameMatch = row.nama.toLowerCase().includes(q);
    const hpMatch   = row.noHp.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
    return nameMatch || hpMatch;
  });

  resultDiv.style.display = "block";
  resultDiv.innerHTML = "";

  if (found) {
    resultDiv.innerHTML = buildSearchResultHTML(found);
    // Highlight baris terkait di tabel
    highlightTableRow(found.ranking);
  } else {
    resultDiv.innerHTML = buildNotFoundHTML(query);
  }
}

/**
 * buildSearchResultHTML
 * Membangun HTML untuk kartu hasil pencarian
 * @param {Object} row - Data customer yang ditemukan
 * @returns {string} HTML string
 */
function buildSearchResultHTML(row) {
  const rank      = row.ranking;
  const rankAbove = rank - 1;

  // Hitung selisih dengan ranking di atasnya
  let gapHTML = "";
  if (rank === 1) {
    // Sudah di posisi puncak
    gapHTML = `
      <div class="result-top-msg">
        🏆 Selamat! Anda berada di posisi PUNCAK leaderboard!
      </div>
    `;
  } else {
    const rowAbove = leaderboardData.find((r) => r.ranking === rankAbove);
    if (rowAbove) {
      const gap = rowAbove.totalPembelian - row.totalPembelian;
      gapHTML = `
        <div class="result-gap-card">
          <div class="result-gap-icon" aria-hidden="true">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div>
            <div class="result-gap-label">Selisih menuju Ranking #${rankAbove} (${escapeHtml(rowAbove.nama)})</div>
            <div class="result-gap-value">${formatRupiah(gap)}</div>
          </div>
        </div>
      `;
    }
  }

  // Medal untuk display
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

  return `
    <div class="result-card">
      <div class="result-card-header">
        <i class="fas fa-user-check" aria-hidden="true"></i>
        Customer Ditemukan!
      </div>
      <div class="result-card-body">
        <div class="result-field">
          <span class="result-field-label">Nama Customer</span>
          <span class="result-field-value">${escapeHtml(row.nama)}</span>
        </div>
        <div class="result-field">
          <span class="result-field-label">Ranking Saat Ini</span>
          <span class="result-field-value rank-badge">${rankEmoji}</span>
        </div>
        <div class="result-field">
          <span class="result-field-label">Total Pembelian</span>
          <span class="result-field-value">${formatRupiah(row.totalPembelian)}</span>
        </div>
      </div>
    </div>
    ${gapHTML}
  `;
}

/**
 * buildNotFoundHTML
 * Membangun HTML untuk tampilan tidak ditemukan
 */
function buildNotFoundHTML(query) {
  return `
    <div class="not-found-card">
      <i class="fas fa-user-slash" aria-hidden="true"></i>
      <p>Customer "<strong>${escapeHtml(query)}</strong>" tidak ditemukan</p>
      <small>Coba gunakan nama lengkap atau nomor HP yang terdaftar</small>
    </div>
  `;
}

/**
 * hideSearchResult
 * Menyembunyikan hasil pencarian
 */
function hideSearchResult() {
  const resultDiv = document.getElementById("search-result");
  if (resultDiv) resultDiv.style.display = "none";
}

/**
 * highlightTableRow
 * Scroll ke baris tabel yang sesuai & highlight sebentar
 * @param {number} ranking - Nomor ranking
 */
function highlightTableRow(ranking) {
  const targetRow = document.querySelector(`#leaderboard-body tr[data-ranking="${ranking}"]`);
  if (targetRow) {
    // Scroll ke baris
    targetRow.scrollIntoView({ behavior: "smooth", block: "center" });

    // Tambahkan class highlight sementara
    targetRow.classList.add("highlight-change");
    setTimeout(() => targetRow.classList.remove("highlight-change"), 2000);
  }
}

/* ================================================================
   FUNGSI UPDATE UI
   ================================================================ */

/**
 * updateStats
 * Memperbarui stat bar di bagian atas
 */
function updateStats(data) {
  const totalParticipants = document.getElementById("total-participants");
  const topAmount         = document.getElementById("top-amount");

  if (totalParticipants) {
    totalParticipants.textContent = `${data.length} Peserta`;
  }

  if (topAmount && data.length > 0) {
    const top = data[0];
    topAmount.textContent = formatRupiahShort(top.totalPembelian);
  }
}

/**
 * updateLastUpdate
 * Memperbarui tampilan waktu last update
 * @param {string|null} lastUpdateStr - Waktu dari sheet atau null
 * @param {Array} data - Data untuk fallback last update
 */
function updateLastUpdate(lastUpdateStr, data) {
  const dateEl = document.getElementById("last-update-date");
  const timeEl = document.getElementById("last-update-time");

  let updateTime;

  if (lastUpdateStr && lastUpdateStr !== "Demo Mode" && lastUpdateStr !== "Demo Mode (offline)") {
    // Parse dari Google Sheets
    const parsed = new Date(lastUpdateStr);
    updateTime = isNaN(parsed) ? new Date() : parsed;
  } else if (data.length > 0 && data[0].lastUpdate) {
    // Ambil dari data baris pertama
    const parsed = new Date(data[0].lastUpdate);
    updateTime = isNaN(parsed) ? new Date() : parsed;
  } else {
    // Gunakan waktu sekarang
    updateTime = new Date();
  }

  const dateStr = updateTime.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = updateTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (dateEl) dateEl.textContent = dateStr;
  if (timeEl) timeEl.textContent = timeStr;

  // Tambahkan keterangan mode demo jika perlu
  if (isDemoMode) {
    if (dateEl) dateEl.textContent = "⚠️ DEMO MODE";
    if (timeEl) timeEl.textContent = "— Konfigurasi SHEET_URL —";
  }
}

/* ================================================================
   FUNGSI LOADING STATE
   ================================================================ */

/**
 * showLoadingState
 * Tampilkan skeleton loader di tabel saat refresh
 */
function showLoadingState() {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) return;

  // Tampilkan 5 baris skeleton
  const skeletonRows = Array.from({ length: 5 }, (_, i) => `
    <tr class="skeleton-row" aria-hidden="true">
      <td><div class="skeleton-block" style="width: 40px; margin: 0 auto;"></div></td>
      <td><div class="skeleton-block" style="width: ${60 + Math.random() * 30}%;"></div></td>
      <td><div class="skeleton-block" style="width: 100px; margin-left: auto;"></div></td>
    </tr>
  `).join("");

  tbody.innerHTML = skeletonRows;

  // Animasi tombol refresh
  const refreshBtn  = document.getElementById("refresh-btn");
  const refreshIcon = document.getElementById("refresh-icon");
  if (refreshBtn) refreshBtn.classList.add("spinning");
  if (refreshIcon) refreshIcon.style.animation = "spin 0.7s linear infinite";
}

/**
 * hideLoadingOverlay
 * Sembunyikan overlay loading awal
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("hidden");

  // Hentikan animasi tombol refresh
  const refreshBtn  = document.getElementById("refresh-btn");
  const refreshIcon = document.getElementById("refresh-icon");
  if (refreshBtn) refreshBtn.classList.remove("spinning");
  if (refreshIcon) refreshIcon.style.animation = "";
}

/* ================================================================
   FUNGSI ERROR HANDLING
   ================================================================ */

function showError(message) {
  const banner  = document.getElementById("error-banner");
  const msgEl   = document.getElementById("error-message");
  if (banner) banner.style.display = "flex";
  if (msgEl)  msgEl.textContent = message;
}

function hideError() {
  const banner = document.getElementById("error-banner");
  if (banner) banner.style.display = "none";
}

/* ================================================================
   AUTO-REFRESH & COUNTDOWN
   ================================================================ */

/**
 * startAutoRefresh
 * Mulai timer auto-refresh dan countdown
 */
function startAutoRefresh() {
  // Hentikan timer yang sudah ada
  stopAutoRefresh();

  // Reset countdown
  countdownSeconds = AUTO_REFRESH_INTERVAL / 1000;
  updateCountdownDisplay();

  // Timer countdown per detik
  countdownTimer = setInterval(() => {
    countdownSeconds--;
    if (countdownSeconds < 0) countdownSeconds = 0;
    updateCountdownDisplay();
  }, 1000);

  // Timer auto-refresh utama
  autoRefreshTimer = setInterval(() => {
    console.log("🔄 Auto-refresh triggered");
    fetchLeaderboardData();
    // Reset countdown setelah refresh
    countdownSeconds = AUTO_REFRESH_INTERVAL / 1000;
  }, AUTO_REFRESH_INTERVAL);
}

/**
 * stopAutoRefresh
 * Hentikan semua timer
 */
function stopAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (countdownTimer)   clearInterval(countdownTimer);
}

/**
 * updateCountdownDisplay
 * Memperbarui tampilan countdown di stat bar
 */
function updateCountdownDisplay() {
  const el = document.getElementById("refresh-countdown");
  if (!el) return;

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  el.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * manualRefresh
 * Dipanggil saat tombol "Refresh Sekarang" diklik
 * (Fungsi ini diekspos ke global scope untuk diakses dari HTML)
 */
function manualRefresh() {
  console.log("🖱️ Manual refresh triggered");
  fetchLeaderboardData();
  // Reset countdown timer
  countdownSeconds = AUTO_REFRESH_INTERVAL / 1000;
  startAutoRefresh();
}

// Ekspos ke global scope agar bisa dipanggil dari HTML onclick
window.manualRefresh = manualRefresh;

/* ================================================================
   FUNGSI UTILITY
   ================================================================ */

/**
 * formatRupiah
 * Format angka ke format mata uang Rupiah Indonesia
 * @param {number} amount - Nominal dalam angka
 * @returns {string} Contoh: "Rp 25.500.000"
 */
function formatRupiah(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * formatRupiahShort
 * Format nominal singkat untuk tampilan stats
 * Contoh: 45750000 → "Rp 45,7 Jt"
 */
function formatRupiahShort(amount) {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  } else if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} Jt`;
  } else if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
}

/**
 * escapeHtml
 * Escape karakter HTML untuk mencegah XSS
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * simulateDelay
 * Simulasi delay async (digunakan untuk demo mode)
 */
function simulateDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ================================================================
   GOOGLE APPS SCRIPT TEMPLATE
   ================================================================
   Salin kode di bawah ini ke Google Apps Script Anda:

   function doGet() {
     const sheet = SpreadsheetApp.getActiveSpreadsheet()
       .getSheetByName("Leaderboard"); // Sesuaikan nama sheet

     const data = sheet.getDataRange().getValues();
     const headers = data[0].map(h => String(h).toLowerCase().replace(/\s+/g, '_'));

     const rows = data.slice(1)
       .filter(row => row[1]) // Pastikan nama tidak kosong
       .map(row => {
         const obj = {};
         headers.forEach((h, i) => { obj[h] = row[i]; });
         return {
           ranking:        obj['ranking']        || 0,
           nama:           obj['nama_customer']  || obj['nama'] || '',
           noHp:           obj['nomor_hp']       || obj['no_hp'] || '',
           totalPembelian: parseFloat(String(obj['total_pembelian']).replace(/[^0-9.]/g, '')) || 0,
           lastUpdate:     obj['last_update']    || new Date().toISOString(),
         };
       })
       .sort((a, b) => b.totalPembelian - a.totalPembelian)
       .map((row, i) => ({ ...row, ranking: i + 1 }));

     return ContentService
       .createTextOutput(JSON.stringify({ data: rows, lastUpdate: new Date().toISOString() }))
       .setMimeType(ContentService.MimeType.JSON);
   }

   ================================================================ */

/* ================================================================
   EVENT LISTENERS TAMBAHAN
   ================================================================ */

// Pause auto-refresh saat halaman tidak aktif, lanjutkan saat aktif kembali
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("👁️ Halaman aktif kembali - refresh data");
    fetchLeaderboardData();
    startAutoRefresh();
  } else {
    console.log("💤 Halaman tidak aktif - pause auto-refresh");
    stopAutoRefresh();
  }
});

// Refresh saat koneksi internet kembali online
window.addEventListener("online", () => {
  console.log("🌐 Koneksi internet kembali - refresh data");
  fetchLeaderboardData();
});

// Tampilkan pesan saat offline
window.addEventListener("offline", () => {
  console.warn("📵 Koneksi internet terputus");
  showError("Koneksi internet terputus. Data akan diperbarui saat online kembali.");
});
