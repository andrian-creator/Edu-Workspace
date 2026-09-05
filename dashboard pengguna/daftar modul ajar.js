/**
 * EDU WORKSPACE - DAFTAR MODUL AJAR LOGIC
 * Mengelola list modul ajar Kurikulum Merdeka yang tersimpan per-akun Google
 */

let allModulList = [];
let filteredModulList = [];
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDaftarModulPage();
});

/**
 * Inisialisasi Halaman & Autentikasi Pengguna
 */
async function initDaftarModulPage() {
  let user = null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {}

  if (!user || !user.email) {
    window.location.replace("../halaman login/halaman login.html");
    return;
  }

  // Sinkronisasi status akun dan hak akses fitur terakurat dari Supabase
  try {
    const dbUser = await SupabaseDB.getUserByEmail(user.email);
    if (dbUser) {
      user = { ...user, ...dbUser };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {}

  // Jika akun telah dihapus atau dinonaktifkan oleh Admin, langsung alihkan ke halaman Profil (Akun Dihapus / Dinonaktifkan)
  const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
  const isDeleted = user.status === 'Dihapus' || user.isDeleted === true;
  const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || user.isApproved === false || isExpired;

  if (isDeleted || isDeactivated) {
    window.location.replace("profil.html");
    return;
  }

  // Render Header Global Terpusat (Hanya tombol Kembali dan Profil)
  if (typeof renderEduNavbar === 'function') {
    renderEduNavbar({
      showBack: true,
      backUrl: 'dashboard pengguna.html',
      showApiKey: false,
      showDaftarModul: false
    });
  }

  updateCreateModulButtonsState();
  loadUserModulList(user);
}

function parseIndoDate(dateStr) {
  if (!dateStr) return null;
  const isoTime = Date.parse(dateStr);
  if (!isNaN(isoTime)) return isoTime;

  try {
    const months = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'may': 4,
      'jun': 5, 'jul': 6, 'agu': 7, 'agt': 7, 'aug': 7, 'sep': 8,
      'okt': 9, 'oct': 9, 'nov': 10, 'des': 11, 'dec': 11
    };
    const parts = String(dateStr).trim().split(/[\s,]+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const mStr = parts[1].slice(0, 3).toLowerCase();
      const month = months[mStr] !== undefined ? months[mStr] : -1;
      const year = parseInt(parts[2], 10);
      let hour = 0, min = 0;
      if (parts.length >= 4) {
        const timeParts = parts[3].split(/[.:]/);
        if (timeParts.length >= 2) {
          hour = parseInt(timeParts[0], 10) || 0;
          min = parseInt(timeParts[1], 10) || 0;
        }
      }
      if (!isNaN(day) && month !== -1 && !isNaN(year)) {
        return new Date(year, month, day, hour, min).getTime();
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Ekstraksi nama jenjang sekolah secara akurat
 */
function extractJenjang(payload, faseKelas) {
  if (payload) {
    if (payload.jenjangSekolah) return payload.jenjangSekolah;
    if (payload.jenjang) return payload.jenjang;
  }
  const str = String(faseKelas || (payload && payload.faseKelas) || '');
  if (str.includes('SMK') || str.includes('MAK')) return 'SMK / MAK';
  if (str.includes('SMA') || str.includes('MA')) return 'SMA / MA';
  if (str.includes('SMP') || str.includes('MTs')) return 'SMP / MTs';
  if (str.includes('SD') || str.includes('MI')) return 'SD / MI';
  return 'SMA / MA';
}

/**
 * Memecah tanggal update menjadi objek { date, time } untuk tampilan 2 baris
 */
function formatTanggalParts(dateInput) {
  if (!dateInput) return { date: '-', time: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const str = String(dateInput).trim();
    if (str.includes(',')) {
      const [p1, p2] = str.split(',');
      return { date: p1.trim(), time: p2 ? p2.trim() : '' };
    }
    return { date: str, time: '' };
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${day} ${month} ${year}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Muat daftar Modul Ajar khusus akun pengguna aktif dari Server & Cache
 */
async function loadUserModulList(user) {
  const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : 'guest';
  const listKey = `edu_modul_list_${userEmail}`;

  // 1. Baca cache lokal terlebih dahulu agar modul yang baru saja di-generate langsung tampil instan
  let localList = [];
  try {
    const raw = localStorage.getItem(listKey);
    if (raw) localList = JSON.parse(raw);
    if (!Array.isArray(localList)) localList = [];
  } catch (e) {
    localList = [];
  }

  // Cek apakah ada modul yang baru saja di-generate pada session aktif
  try {
    const rawCurrent = localStorage.getItem('edu_current_generated_modul') || localStorage.getItem('edu_last_modul_payload');
    if (rawCurrent) {
      const currentModul = JSON.parse(rawCurrent);
      if (currentModul && currentModul.id) {
        const alreadyInLocal = localList.some(item => item.id === currentModul.id);
        if (!alreadyInLocal) {
          const rec = createRecordFromPayload(currentModul);
          rec.userEmail = userEmail;
          localList.unshift(rec);
          localStorage.setItem(listKey, JSON.stringify(localList));
        }
      }
    }
  } catch (e) {}

  // Pastikan setiap item lokal memiliki field jenjangSekolah
  localList.forEach(item => {
    if (!item.jenjangSekolah && !item.jenjang) {
      const j = extractJenjang(item.payload, item.faseKelas);
      item.jenjangSekolah = j;
      item.jenjang = j;
    }
  });

  // Render seketika dari data lokal (zero delay untuk pengguna, daftar tidak pernah hilang)
  allModulList = [...localList];
  filteredModulList = [...allModulList];
  updateSummaryStats();
  renderModulTable();

  // 2. Ambil data resmi dari Supabase & sinkronisasikan secara cerdas (merge)
  try {
    const supabaseModuls = await SupabaseDB.getModuls(userEmail);
    if (supabaseModuls && Array.isArray(supabaseModuls)) {
      const remoteList = supabaseModuls.map(m => {
        const payload = m.content_json || m.contentJson || {};
        const now = m.created_at ? new Date(m.created_at) : new Date();
        const detectedStatus = payload.status || (payload.aiGeneratedContent ? 'Lengkap' : 'Draft');
        const detectedJenjang = extractJenjang(payload, payload.faseKelas || m.grade_level);
        return {
          id: m.id,
          userEmail: userEmail,
          namaModul: m.topic ? `${m.topic} - ${payload.jurusanSekolah || 'Reguler'}` : (payload.namaModul || m.id),
          topikMateri: m.topic || payload.topikMateri || '',
          jurusanSekolah: payload.jurusanSekolah || 'Reguler',
          mataPelajaran: m.subject || payload.mataPelajaran || 'Mata Pelajaran',
          jenjangSekolah: detectedJenjang,
          jenjang: detectedJenjang,
          fase: payload.fase || '',
          kelas: m.grade_level || payload.kelas || '',
          faseKelas: payload.faseKelas || m.grade_level || '',
          status: detectedStatus,
          createdAt: m.created_at || payload.createdAt || now.toISOString(),
          updatedAt: m.created_at || now.toISOString(),
          updatedAtFormatted: formatTanggal(m.created_at || now),
          payload: payload
        };
      });

      // Gabungkan (merge) data lokal dan remote berdasarkan id
      // Jangan pernah menghapus modul lokal jika Supabase masih kosong atau belum tersinkron
      const mergedMap = new Map();

      // Masukkan remote list
      remoteList.forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });

      // Masukkan / perbarui modul lokal (jika lokal lebih baru atau belum ada di remote)
      localList.forEach(localItem => {
        if (!localItem || !localItem.id) return;
        if (!localItem.jenjangSekolah && !localItem.jenjang) {
          const j = extractJenjang(localItem.payload, localItem.faseKelas);
          localItem.jenjangSekolah = j;
          localItem.jenjang = j;
        }
        const existingRemote = mergedMap.get(localItem.id);
        if (!existingRemote) {
          mergedMap.set(localItem.id, localItem);
          if (localItem.payload) {
            SupabaseDB.saveModul({
              id: localItem.id,
              userId: 'b452d28a-4888-40a7-8a1e-930430df9f59',
              email: userEmail,
              userName: user.name || localItem.payload.namaPenyusun || '',
              subject: localItem.mataPelajaran || '',
              gradeLevel: localItem.faseKelas || '',
              topic: localItem.topikMateri || '',
              curriculum: localItem.payload.kurikulum || 'Kurikulum Merdeka',
              contentJson: localItem.payload
            }).catch(e => console.warn('[AutoSync] Supabase save warning:', e));
          }
        } else {
          // Utamakan data lokal jika lokal lebih mutakhir atau memiliki status lokal
          const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
          const remoteTime = new Date(existingRemote.updatedAt || existingRemote.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            mergedMap.set(localItem.id, {
              ...existingRemote,
              ...localItem,
              jenjangSekolah: localItem.jenjangSekolah || existingRemote.jenjangSekolah,
              jenjang: localItem.jenjang || existingRemote.jenjang,
              status: localItem.status || existingRemote.status || 'Draft'
            });
          }
        }
      });

      const finalList = Array.from(mergedMap.values());
      finalList.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      localStorage.setItem(listKey, JSON.stringify(finalList));
      allModulList = finalList;
      filteredModulList = [...allModulList];
      updateSummaryStats();
      renderModulTable();
      return;
    }
  } catch (err) {
    console.warn('Gagal memuat dari Supabase, mencoba server lokal:', err);
    // Fallback ke server backend jika ada
    try {
      const res = await fetch(`/api/moduls?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.moduls)) {
          allModulList = data.moduls;
          filteredModulList = [...allModulList];
          localStorage.setItem(listKey, JSON.stringify(allModulList));
          updateSummaryStats();
          renderModulTable();
        }
      }
    } catch (err2) {
      console.warn('Gagal memuat dari server backend lokal:', err2);
    }
  }
}

/**
 * Format payload modul menjadi objek record daftar tabel
 */
function createRecordFromPayload(payload) {
  const modulId = payload.id || ('modul_' + Date.now());
  payload.id = modulId;

  const namaTopik = (payload.topikMateri || 'Rancangan Pembelajaran').trim();
  const namaJurusan = (payload.jurusanSekolah || 'Reguler').trim();
  const namaModul = `${namaTopik} - ${namaJurusan}`;

  const faseKelasRaw = payload.faseKelas || 'Fase E (Kelas 10 SMA/MA)';
  let fase = 'Fase E';
  let kelas = 'Kelas 10';
  if (faseKelasRaw.includes('Fase')) {
    fase = faseKelasRaw.split('(')[0].trim();
  }
  const matchKelas = faseKelasRaw.match(/Kelas\s*\d+/i);
  if (matchKelas) {
    kelas = matchKelas[0];
  } else {
    kelas = faseKelasRaw;
  }

  const detectedJenjang = extractJenjang(payload, faseKelasRaw);
  const now = new Date();
  return {
    id: modulId,
    namaModul: namaModul,
    topikMateri: namaTopik,
    jurusanSekolah: namaJurusan,
    mataPelajaran: payload.mataPelajaran || 'Mata Pelajaran',
    jenjangSekolah: detectedJenjang,
    jenjang: detectedJenjang,
    fase: fase,
    kelas: kelas,
    faseKelas: faseKelasRaw,
    status: payload.status || (payload.aiGeneratedContent ? 'Lengkap' : 'Draft'),
    updatedAt: now.toISOString(),
    updatedAtFormatted: formatTanggal(now),
    payload: payload
  };
}

/**
 * Format tanggal dalam bahasa Indonesia
 */
function formatTanggal(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Perbarui ringkasan statistik
 */
function updateSummaryStats() {
  const totalEl = document.getElementById('statTotalModul');
  const lengkapEl = document.getElementById('statModulLengkap');
  const lastUpdateEl = document.getElementById('statTerakhirUpdate');

  const total = allModulList.length;
  const lengkapCount = allModulList.filter(m => (m.status || 'Lengkap').toLowerCase() === 'lengkap').length;

  if (totalEl) totalEl.textContent = total;
  if (lengkapEl) lengkapEl.textContent = lengkapCount;

  if (lastUpdateEl) {
    if (total > 0 && allModulList[0].updatedAtFormatted) {
      lastUpdateEl.textContent = allModulList[0].updatedAtFormatted;
    } else {
      lastUpdateEl.textContent = '-';
    }
  }
}

/**
 * Filter dan Pencarian Daftar Modul
 */
function handleSearchFilter() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const jenjangFilter = (document.getElementById('filterJenjang')?.value || document.getElementById('filterFase')?.value || '').toLowerCase();
  const statusFilter = (document.getElementById('filterStatus')?.value || '').toLowerCase();

  filteredModulList = allModulList.filter(item => {
    // 1. Pencarian teks (nama modul, topik, mata pelajaran, jurusan)
    const matchQuery = !query ||
      (item.namaModul || '').toLowerCase().includes(query) ||
      (item.topikMateri || '').toLowerCase().includes(query) ||
      (item.mataPelajaran || '').toLowerCase().includes(query) ||
      (item.jurusanSekolah || '').toLowerCase().includes(query);

    // 2. Filter Jenjang Sekolah
    const itemJenjang = (item.jenjangSekolah || item.jenjang || extractJenjang(item.payload, item.faseKelas)).toLowerCase();
    const itemFaseKelas = (item.faseKelas || '').toLowerCase();
    const matchJenjang = !jenjangFilter || itemJenjang.includes(jenjangFilter) || itemFaseKelas.includes(jenjangFilter);

    // 3. Filter Status
    const matchStatus = !statusFilter || (item.status || 'lengkap').toLowerCase() === statusFilter;

    return matchQuery && matchJenjang && matchStatus;
  });

  renderModulTable();
}

/**
 * Cek status apakah hak akses fitur Generate & Edit Modul Ajar aktif untuk pengguna saat ini
 */
function checkIsFeatureModulAjarActive() {
  let user = null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {}

  if (!user) return false;

  const userEmail = (user.email || '').toLowerCase().trim();
  const isAdm = user.role === 'Admin' || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase());

  // 1. Cek dari database registered users di localStorage terlebih dahulu (sumber kebenaran admin)
  try {
    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY || 'edu_registered_users') || '[]');
    const found = allUsers.find(u => (u.email || '').toLowerCase().trim() === userEmail);
    if (found) {
      const isDeactivated = !isAdm && (found.status === 'Nonaktif' || found.status === 'Dinonaktifkan' || found.status === 'Ditolak');
      if (isDeactivated) return false;
      if (Array.isArray(found.features)) {
        return found.features.includes('generate_modul_ajar');
      }
      return false;
    }
  } catch (e) {}

  // 2. Cek dari object user sesi aktif
  const isSessionDeactivated = !isAdm && (user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak');
  if (isSessionDeactivated) return false;

  if (Array.isArray(user.features)) {
    return user.features.includes('generate_modul_ajar');
  }

  // Fallback: Admin memiliki akses penuh, user biasa default false
  return isAdm;
}

/**
 * Update status tombol "Buat Modul Ajar Baru" (header atas & empty state)
 * Jika hak akses fitur generator modul ajar dinonaktifkan di Pengelola Fitur Admin,
 * maka tombol otomatis berstatus disable (tidak dapat ditekan).
 */
function updateCreateModulButtonsState() {
  const isModulAjarActive = checkIsFeatureModulAjarActive();
  const topBtn = document.getElementById('btnCreateModulTop');
  const emptyBtn = document.getElementById('btnCreateModulEmpty');
  const buttons = [topBtn, emptyBtn].filter(Boolean);

  buttons.forEach(btn => {
    if (!isModulAjarActive) {
      btn.classList.add('btn-disabled');
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('data-disabled', 'true');
      btn.title = 'Akses pembuatan modul ajar dinonaktifkan oleh Administrator.';
      btn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        notifyFeatureDisabled();
        return false;
      };
    } else {
      btn.classList.remove('btn-disabled');
      btn.removeAttribute('aria-disabled');
      btn.removeAttribute('data-disabled');
      btn.title = 'Buat Modul Ajar Baru';
      btn.onclick = null;
    }
  });
}

/**
 * Notifikasi popup jika fitur dinonaktifkan oleh Admin
 */
function notifyFeatureDisabled() {
  showNotificationModal(
    'Fitur Dinonaktifkan',
    'Fitur Pembuatan & Edit Modul Ajar saat ini sedang dinonaktifkan oleh Administrator untuk akun Anda. Silakan hubungi admin untuk mengaktifkan kembali akses fitur ini.',
    'warning'
  );
}

/**
 * Render Tabel Daftar Modul
 */
function renderModulTable() {
  // Sinkronkan status disable/enable tombol buat modul ajar baru
  updateCreateModulButtonsState();

  const tableBody = document.getElementById('modulTableBody');
  const tableWrapper = document.querySelector('.table-responsive-wrapper');
  const emptyWrapper = document.getElementById('emptyStateWrapper');
  const countText = document.getElementById('footerCountText');
  const emptyDesc = document.getElementById('emptyDesc');

  if (!tableBody) return;
  tableBody.innerHTML = '';

  const totalFiltered = filteredModulList.length;

  if (countText) {
    countText.textContent = `Menampilkan ${totalFiltered} dari ${allModulList.length} modul ajar`;
  }

  if (totalFiltered === 0) {
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (emptyWrapper) emptyWrapper.style.display = 'flex';

    if (allModulList.length > 0 && emptyDesc) {
      emptyDesc.textContent = 'Tidak ada modul ajar yang cocok dengan kata kunci atau filter pencarian Anda.';
    } else if (emptyDesc) {
      emptyDesc.textContent = 'Anda belum memiliki rancangan modul ajar yang tersimpan di akun ini. Klik tombol di bawah untuk mulai membuat modul ajar Kurikulum Merdeka pertama Anda dengan AI.';
    }
    return;
  }

  if (tableWrapper) tableWrapper.style.display = 'block';
  if (emptyWrapper) emptyWrapper.style.display = 'none';

  const isModulAjarActive = checkIsFeatureModulAjarActive();

  filteredModulList.forEach((item, index) => {
    const isLengkap = (item.status || 'Lengkap').toLowerCase() === 'lengkap';
    const statusClass = isLengkap ? 'status-lengkap' : 'status-draft';
    const statusLabel = isLengkap ? 'Lengkap' : 'Draft';

    const dateParts = formatTanggalParts(item.updatedAt || item.updatedAtFormatted || item.createdAt);
    const jenjangDisplay = item.jenjangSekolah || item.jenjang || extractJenjang(item.payload, item.faseKelas);

    // Format penulisan kolom Nama Modul persis seperti Gambar 2:
    // Baris 1 (tebal): Mata Pelajaran / Nama Modul
    // Baris 2 (abu-abu): Jurusan / Topik Materi
    const titleText = item.mataPelajaran || item.namaModul || 'Modul Pembelajaran';
    const subtitleText = item.jurusanSekolah || item.topikMateri || '-';

    // Tombol Edit: Jika fitur di dashboard admin dinonaktifkan, maka tombol edit disabled / tidak bisa digunakan
    const editButtonHtml = isModulAjarActive ? `
      <button type="button" class="btn-table-action btn-action-edit" onclick="editModulItem('${escapeHtml(String(item.id))}')" title="Edit Modul">
        <img src="../Assets/icon/icon_modul ajar.png" alt="Edit" class="action-icon-img">
      </button>
    ` : `
      <span class="btn-action-disabled-wrapper" onclick="notifyFeatureDisabled()" title="Akses edit modul ajar dinonaktifkan oleh Admin">
        <button type="button" class="btn-table-action btn-action-edit btn-action-disabled" disabled tabindex="-1">
          <img src="../Assets/icon/icon_modul ajar.png" alt="Edit Dinonaktifkan" class="action-icon-img">
        </button>
      </span>
    `;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="cell-center text-muted-strong">
        ${index + 1}
      </td>
      <td class="cell-left">
        <div class="cell-modul-name">
          <div class="modul-title-text">${escapeHtml(titleText)}</div>
          <div class="modul-subtitle-text">${escapeHtml(subtitleText)}</div>
        </div>
      </td>
      <td class="cell-center">
        <strong>${escapeHtml(item.mataPelajaran || '-')}</strong>
      </td>
      <td class="cell-center">
        <span class="cell-text-plain">${escapeHtml(jenjangDisplay)}</span>
      </td>
      <td class="cell-center">
        <span class="cell-text-plain">${escapeHtml(item.kelas || 'Kelas 10')}</span>
      </td>
      <td class="cell-center">
        <span class="status-pill ${statusClass}">
          <span>${statusLabel}</span>
        </span>
      </td>
      <td class="cell-center">
        <div class="cell-timestamp-dual">
          <span class="timestamp-date">${escapeHtml(dateParts.date)}</span>
          ${dateParts.time ? `<span class="timestamp-time">${escapeHtml(dateParts.time)}</span>` : ''}
        </div>
      </td>
      <td class="cell-center">
        <div class="action-buttons-group">
          <!-- Tombol Preview (Review) -->
          <button type="button" class="btn-table-action btn-action-preview" onclick="previewModulItem('${escapeHtml(String(item.id))}')" title="Pratinjau Modul">
            <img src="../Assets/icon/icon_eye.png" alt="Review" class="action-icon-img">
          </button>

          <!-- Tombol Edit (Otomatis Dinonaktifkan Jika Admin Mematikan Akses Fitur) -->
          ${editButtonHtml}

          <!-- Tombol Hapus -->
          <button type="button" class="btn-table-action btn-action-delete" onclick="openDeleteModal('${escapeHtml(String(item.id))}', '${escapeHtml(item.namaModul || '')}')" title="Hapus Modul">
            <img src="../Assets/icon/icon_trash.png" alt="Hapus" class="action-icon-img">
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/**
 * Aksi: Pratinjau Modul (Preview)
 */
function previewModulItem(modulId) {
  const item = allModulList.find(m => String(m.id) === String(modulId));
  if (!item) return;

  // Set payload yang dipilih sebagai modul aktif untuk pratinjau
  const payloadToPreview = item.payload || item;
  localStorage.setItem('edu_current_generated_modul', JSON.stringify(payloadToPreview));

  // Buka dokumen preview modul ajar di tab baru
  window.open('../Fitur/preview modul ajar.html', '_blank');
}

/**
 * Aksi: Edit Modul
 * Mengarahkan guru kembali ke form generator modul ajar dengan data terisi
 */
function editModulItem(modulId) {
  if (!checkIsFeatureModulAjarActive()) {
    notifyFeatureDisabled();
    return;
  }

  let item = allModulList.find(m => String(m.id) === String(modulId));

  // Jika belum ditemukan di cache allModulList, coba cari di localStorage
  if (!item) {
    try {
      let user = null;
      try {
        const rawUser = localStorage.getItem(CURRENT_USER_KEY);
        if (rawUser) user = JSON.parse(rawUser);
      } catch (e) {}
      const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : 'guest';
      const rawList = localStorage.getItem(`edu_modul_list_${userEmail}`);
      if (rawList) {
        const list = JSON.parse(rawList);
        item = list.find(m => String(m.id) === String(modulId));
      }
    } catch (e) {}
  }

  if (item) {
    const payloadToEdit = item.payload || item;
    localStorage.setItem('edu_editing_modul_payload', JSON.stringify(payloadToEdit));
    localStorage.setItem('edu_current_generated_modul', JSON.stringify(payloadToEdit));
    localStorage.setItem('edu_last_modul_payload', JSON.stringify(payloadToEdit));
  }

  window.location.href = `../Fitur/modul ajar.html?editId=${encodeURIComponent(modulId)}`;
}

/**
 * Aksi: Buka Modal Konfirmasi Hapus
 */
function openDeleteModal(modulId, namaModul) {
  pendingDeleteId = modulId;
  const modal = document.getElementById('deleteConfirmModal');
  const descEl = document.getElementById('deleteModalDesc');

  if (descEl) {
    descEl.innerHTML = `Apakah Anda yakin ingin menghapus modul ajar <strong>"${namaModul}"</strong> dari akun Anda? Data yang terhapus tidak dapat dikembalikan.`;
  }
  if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Eksekusi Hapus Modul dari Server & Akun Pengguna
 */
async function executeDeleteModul() {
  if (!pendingDeleteId) return;

  const targetId = pendingDeleteId;
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch (e) {}

  const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : 'guest';
  const listKey = `edu_modul_list_${userEmail}`;

  // 1. Soft-delete di Supabase
  try {
    await SupabaseDB.deleteModul(targetId);
    console.log('[Supabase] Modul berhasil dihapus:', targetId);
  } catch (err) {
    console.warn('Gagal hapus di Supabase, mencoba server lokal:', err);
    // Fallback ke server lokal
    try {
      await fetch('/api/moduls/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetId, email: userEmail })
      });
    } catch (err2) {
      console.warn('Gagal menghapus modul di server:', err2);
    }
  }

  // 2. Filter dari memori & cache lokal
  allModulList = allModulList.filter(m => m.id !== targetId);
  try {
    localStorage.setItem(listKey, JSON.stringify(allModulList));
  } catch (e) {}

  // 3. Bersihkan cache generator sementara
  try {
    const curRaw = localStorage.getItem('edu_current_generated_modul');
    if (curRaw) {
      const cur = JSON.parse(curRaw);
      if (cur.id === targetId) localStorage.removeItem('edu_current_generated_modul');
    }
    const lastRaw = localStorage.getItem('edu_last_modul_payload');
    if (lastRaw) {
      const last = JSON.parse(lastRaw);
      if (last.id === targetId) localStorage.removeItem('edu_last_modul_payload');
    }
  } catch (e) {}

  closeDeleteModal();
  handleSearchFilter();
  updateSummaryStats();

  showNotificationModal('Modul Dihapus', 'Modul ajar telah berhasil dihapus secara permanen dari server dan akun Anda.', 'success');
}

/**
 * Shared Notification Modal Helper
 */
function showNotificationModal(title, message, type = 'info') {
  const modal = document.getElementById('notificationModal');
  const titleEl = document.getElementById('notificationTitle');
  const descEl = document.getElementById('notificationDesc');
  const iconBox = document.getElementById('notificationIconBox');

  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = message;

  if (iconBox) {
    if (type === 'success') {
      iconBox.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
      iconBox.style.background = '#f0fdf4';
      iconBox.style.border = '1.5px solid #bbf7d0';
    } else if (type === 'warning') {
      iconBox.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
      iconBox.style.background = '#fffbeb';
      iconBox.style.border = '1.5px solid #fde68a';
    } else {
      iconBox.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
      iconBox.style.background = '#eff6ff';
      iconBox.style.border = '1.5px solid #bfdbfe';
    }
  }

  if (modal) modal.classList.add('active');
}

function closeNotificationModal() {
  const modal = document.getElementById('notificationModal');
  if (modal) modal.classList.remove('active');
}

// Sinkronisasi Realtime Perubahan Hak Akses & Penghapusan Akun dari Dashboard Admin
try {
  const syncChannel = new BroadcastChannel('edu_workspace_sync');
  syncChannel.onmessage = (event) => {
    if (event.data && (event.data.type === 'USER_DELETED' || event.data.type === 'STATUS_UPDATED' || event.data.type === 'SYNC_USER')) {
      let cur = null;
      try { cur = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch (e) {}
      if (cur && (cur.email || '').trim().toLowerCase() === (event.data.email || '').trim().toLowerCase()) {
        if (event.data.type === 'USER_DELETED') {
          cur.status = 'Dihapus';
          cur.isDeleted = true;
          cur.isApproved = false;
        } else if (event.data.status) {
          cur.status = event.data.status;
          if (event.data.status === 'Nonaktif' || event.data.status === 'Dinonaktifkan' || event.data.status === 'Ditolak') {
            cur.isApproved = false;
          }
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));

        const isDeleted = cur.status === 'Dihapus' || cur.isDeleted === true;
        const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(cur);
        const isDeactivated = cur.status === 'Nonaktif' || cur.status === 'Dinonaktifkan' || cur.status === 'Ditolak' || cur.isApproved === false || isExpired;

        if (isDeleted || isDeactivated) {
          window.location.replace("profil.html");
          return;
        }
      }
    }
    if (event.data && (event.data.type === 'FEATURES_UPDATED' || event.data.type === 'USER_FEATURES_UPDATED' || event.data.type === 'USER_UPDATED')) {
      let cur = null;
      try { cur = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)); } catch (e) {}
      if (cur && (cur.email || '').trim().toLowerCase() === (event.data.email || '').trim().toLowerCase()) {
        if (event.data.features !== undefined) {
          cur.features = event.data.features;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
        }
      }
      // Re-render tabel seketika agar status tombol edit & tombol buat baru langsung sinkron
      renderModulTable();
      updateCreateModulButtonsState();
    }
  };
} catch (e) {}

window.addEventListener('storage', (e) => {
  if (e.key === 'edu_current_user' || e.key === 'edu_sync_timestamp') {
    renderModulTable();
    updateCreateModulButtonsState();
  }
});

// Explicit Global Window Bindings
window.editModulItem = editModulItem;
window.previewModulItem = previewModulItem;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDeleteModul = confirmDeleteModul;
window.notifyFeatureDisabled = notifyFeatureDisabled;
window.checkIsFeatureModulAjarActive = checkIsFeatureModulAjarActive;
window.updateCreateModulButtonsState = updateCreateModulButtonsState;
window.showNotificationModal = showNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.renderModulTable = renderModulTable;

