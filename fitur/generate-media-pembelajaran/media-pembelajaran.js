/**
 * Edu Workspace - Generate Media Pembelajaran (PowerPoint Generator) Logic
 * Sistem 3 Sesi Terpadu:
 * 1. Informasi Materi (Parameter Form)
 * 2. Outline Slide (Canva AI Style - Reorder, Edit, Delete)
 * 3. Hasil Media (Media PPT Bergambar 16:9 + Download .pptx)
 */

let currentUser = null;
let userModulList = [];
let currentSourceTab = 'modul';
let selectedSlideCountMode = 'auto'; // 'auto' | 'custom'

// State Sesi & Outline
let currentSession = 1; // 1 | 2 | 3
let currentOutlineSlides = [];
let currentGeneratedMediaSlides = [];
let currentPresentationMeta = {
  subject: '',
  materi: '',
  grade: '',
  slideCount: 6
};

// State Interaksi Outline Canva AI (Gambar 2)
let expandedSlideIndex = 0; // Default slide 1 terbuka
let editingSlideIndex = -1;  // -1: tidak sedang edit
let draggedIndex = null;     // Index yang sedang di-drag

let isGeneratingOutline = false;
let isGeneratingMedia = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Validasi Autentikasi Pengguna
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Silakan Login Terlebih Dahulu",
        message: "Sesi Anda belum terautentikasi. Silakan masuk untuk mengakses fitur Generate Media Pembelajaran.",
        iconType: "lock",
        buttonText: "Ke Halaman Login",
        redirectUrl: "../../halaman-login/halaman-login.html"
      });
    } else {
      window.location.href = "../../halaman-login/halaman-login.html";
    }
    return;
  }

  try {
    currentUser = JSON.parse(loggedUserStr);
  } catch (e) {
    currentUser = null;
  }

  const isAdm = typeof isCurrentUserAdmin === 'function'
    ? isCurrentUserAdmin(currentUser)
    : (currentUser && (currentUser.role === 'Admin' || (currentUser.email || '').toLowerCase() === (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL.toLowerCase() : '')));

  // 2. Periksa Hak Akses Fitur untuk Pendidik
  if (!isAdm && currentUser) {
    const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(currentUser);
    const isDeactivated = currentUser.status === 'Nonaktif' || currentUser.status === 'Dinonaktifkan' || currentUser.status === 'Ditolak' || currentUser.isApproved === false || isExpired;
    const activeFeatures = Array.isArray(currentUser.features) ? currentUser.features : [];

    if (isDeactivated || !activeFeatures.includes('generate_media_pembelajaran')) {
      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "Akses Fitur Terkunci",
          message: "Fitur Generate Media Pembelajaran belum diaktifkan untuk akun Anda. Silakan hubungi Administrator Edu Workspace.",
          iconType: "warning",
          buttonText: "Ke Dashboard Pengguna",
          redirectUrl: "../../dashboard-pengguna/dashboard-pengguna.html"
        });
      } else {
        window.location.href = "../../dashboard-pengguna/dashboard-pengguna.html";
      }
      return;
    }
  }

  // 3. Render Top Navbar Global
  if (typeof renderEduNavbar === 'function') {
    renderEduNavbar({
      showBack: true,
      backUrl: '../../dashboard-pengguna/dashboard-pengguna.html',
      showApiKey: false
    });
  }

  // 4. Muat Modul Ajar Tersimpan untuk Dropdown Otomatis
  await loadUserModulDropdown();

  // Inisialisasi Tampilan Sesi 1
  goToSession(1, true);
});

/**
 * Mendapatkan Kunci Google Gemini API Pengguna Aktif
 */
function getEffectiveApiKey() {
  try {
    if (currentUser) {
      if (currentUser.geminiApiKey && currentUser.geminiApiKey.trim()) return currentUser.geminiApiKey.trim();
      if (currentUser.apiKey && currentUser.apiKey.trim()) return currentUser.apiKey.trim();
      if (currentUser.email) {
        const key = localStorage.getItem(`edu_api_key_${currentUser.email.trim().toLowerCase()}`);
        if (key && key.trim()) return key.trim();
      }
    }
    return localStorage.getItem('edu_gemini_api_key') || '';
  } catch (e) {
    return '';
  }
}

/**
 * Muat Seluruh Modul Ajar Milik Akun Pengguna
 */
async function loadUserModulDropdown() {
  if (!currentUser) return;
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const selectEl = document.getElementById('selectModulAjar');
  const countHint = document.getElementById('modulCountHint');

  let list = [];

  // A. Dari cache lokal
  try {
    const listKey = `edu_modul_list_${userEmail}`;
    const raw = localStorage.getItem(listKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch (e) {}

  // B. Dari Supabase
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getModuls) {
    try {
      const remote = await SupabaseDB.getModuls(userEmail);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const map = new Map();
        list.forEach(m => { if (m.id) map.set(m.id, m); });
        remote.forEach(r => {
          map.set(r.id, {
            id: r.id,
            namaModul: r.topic || r.subject || 'Modul Ajar',
            topic: r.topic || '',
            subject: r.subject || '',
            gradeLevel: r.grade_level || '',
            contentJson: r.content_json,
            payload: r.content_json
          });
        });
        list = Array.from(map.values());
      }
    } catch (e) {}
  }

  // C. Fallback backend server lokal
  if (list.length === 0) {
    try {
      const res = await fetch(`/api/moduls?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) list = data;
      }
    } catch (e) {}
  }

  userModulList = list;

  if (selectEl) {
    selectEl.innerHTML = '<option value="">-- Pilih Modul Ajar Tersimpan --</option>';
    if (list.length > 0) {
      list.forEach((m, idx) => {
        const p = m.payload || m.contentJson || {};
        const title = m.namaModul || m.topic || p.topikMateri || p.namaModul || `Modul #${idx + 1}`;
        const mapel = m.subject || p.mataPelajaran || '';
        const opt = document.createElement('option');
        opt.value = m.id || String(idx);
        opt.textContent = mapel ? `${title} (${mapel})` : title;
        selectEl.appendChild(opt);
      });
      if (countHint) countHint.textContent = `${list.length} modul ditemukan`;
    } else {
      if (countHint) countHint.textContent = 'Belum ada modul (Gunakan Isi Manual)';
      const opt = document.createElement('option');
      opt.value = "";
      opt.disabled = true;
      opt.textContent = "(Belum ada modul tersimpan. Silakan gunakan Isi Manual Sendiri)";
      selectEl.appendChild(opt);
    }
  }
}

/**
 * Handle Pemilihan Tab Sumber: Ambil dari Modul Ajar vs Isi Sendiri
 */
function setSourceTab(mode) {
  currentSourceTab = mode;
  const btnModul = document.getElementById('btnSourceModul');
  const btnManual = document.getElementById('btnSourceManual');
  const container = document.getElementById('modulSelectContainer');

  if (mode === 'modul') {
    if (btnModul) btnModul.classList.add('active');
    if (btnManual) btnManual.classList.remove('active');
    if (container) container.style.display = 'block';
  } else {
    if (btnManual) btnManual.classList.add('active');
    if (btnModul) btnModul.classList.remove('active');
    if (container) container.style.display = 'none';
  }
}

/**
 * Saat Pengguna Memilih Modul Ajar pada Dropdown:
 * Mengambil materi/topik MURNI dari data modul ajar (BUKAN dari tujuan pembelajaran)
 */
function onSelectModulChange(modulId) {
  if (!modulId) return;

  const modul = userModulList.find(m => m.id === modulId || String(m.id) === String(modulId));
  if (!modul) return;

  const p = modul.payload || modul.contentJson || {};

  const mapel = modul.subject || p.mataPelajaran || '';
  const topic = (p.topikMateri || p.isiTopikMateri || modul.topic || modul.topikMateri || p.topik || modul.namaModul || p.namaModul || '').trim();
  const grade = modul.kelas || p.kelas || modul.gradeLevel || p.faseKelas || p.jenjangSekolah || '';

  // Ekstrak materi/topik murni dari modul ajar (bukan dari tujuan pembelajaran)
  let materiDetail = topic;
  const materiTambahan = (p.materiTambahan || p.materiPokok || p.materiPembelajaran || p.ringkasanMateri || '').trim();
  if (materiTambahan && materiTambahan !== '-' && !topic.toLowerCase().includes(materiTambahan.toLowerCase())) {
    materiDetail = topic ? `${topic}\n${materiTambahan}` : materiTambahan;
  }

  // Isi ke input form
  const inputMapel = document.getElementById('inputMataPelajaran');
  const inputMateri = document.getElementById('inputMateri');
  const inputKelas = document.getElementById('inputKelas');

  if (inputMapel && mapel) inputMapel.value = mapel;
  if (inputMateri) inputMateri.value = (materiDetail || topic).trim();
  if (inputKelas && grade) inputKelas.value = grade;
}

/**
 * Pemilihan Jumlah Slide (Rekomendasi AI & Isi Sendiri)
 */
function selectSlideCount(mode) {
  selectedSlideCountMode = mode;
  const btnAuto = document.getElementById('btnSlideAuto');
  const btnCustom = document.getElementById('btnSlideCustom');
  const customContainer = document.getElementById('customSlideContainer');

  if (mode === 'auto') {
    if (btnAuto) btnAuto.classList.add('active');
    if (btnCustom) btnCustom.classList.remove('active');
    if (customContainer) customContainer.style.display = 'none';
  } else {
    if (btnCustom) btnCustom.classList.add('active');
    if (btnAuto) btnAuto.classList.remove('active');
    if (customContainer) customContainer.style.display = 'block';
  }
}

/**
 * ==========================================================================
 * SISTEM NAVIGASI STEPPER 3 SESI
 * ==========================================================================
 */
function goToSession(sessionNum, silent = false) {
  if (sessionNum === 2 && currentOutlineSlides.length === 0 && !isGeneratingOutline) {
    if (!silent) {
      alert("Silakan lengkapi Informasi Materi dan klik 'Generate Outline Slide' terlebih dahulu.");
    }
    return;
  }

  if (sessionNum === 3 && currentGeneratedMediaSlides.length === 0 && !isGeneratingMedia) {
    if (!silent) {
      alert("Silakan klik 'Generate Media Pembelajaran' di Sesi 2 terlebih dahulu.");
    }
    return;
  }

  currentSession = sessionNum;

  // 1. Update Indikator Stepper
  const ind1 = document.getElementById('stepIndicator1');
  const ind2 = document.getElementById('stepIndicator2');
  const ind3 = document.getElementById('stepIndicator3');
  const line1 = document.getElementById('stepLine1');
  const line2 = document.getElementById('stepLine2');

  [ind1, ind2, ind3].forEach(el => el && el.classList.remove('active', 'completed'));
  [line1, line2].forEach(el => el && el.classList.remove('active', 'completed'));

  if (sessionNum === 1) {
    if (ind1) ind1.classList.add('active');
  } else if (sessionNum === 2) {
    if (ind1) ind1.classList.add('completed');
    if (line1) line1.classList.add('completed');
    if (ind2) ind2.classList.add('active');
  } else if (sessionNum === 3) {
    if (ind1) ind1.classList.add('completed');
    if (line1) line1.classList.add('completed');
    if (ind2) ind2.classList.add('completed');
    if (line2) line2.classList.add('completed');
    if (ind3) ind3.classList.add('active');
  }

  // 2. Update Step Pane Visibility
  const pane1 = document.getElementById('stepPane1');
  const pane2 = document.getElementById('stepPane2');
  const pane3 = document.getElementById('stepPane3');

  if (pane1) pane1.classList.toggle('active', sessionNum === 1);
  if (pane2) pane2.classList.toggle('active', sessionNum === 2);
  if (pane3) pane3.classList.toggle('active', sessionNum === 3);

  // 3. Scroll Halus ke Atas
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * ==========================================================================
 * SESI 1 -> SESI 2: PROSES GENERATE OUTLINE DENGAN AI
 * ==========================================================================
 */
async function handleGenerateOutline() {
  if (isGeneratingOutline || isGeneratingMedia) return;

  const mapel = document.getElementById('inputMataPelajaran')?.value.trim();
  const materi = document.getElementById('inputMateri')?.value.trim();
  const kelas = document.getElementById('inputKelas')?.value.trim();

  // Validasi Input Wajib
  if (!mapel || !materi || !kelas) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Kolom Belum Lengkap",
        message: "Mohon lengkapi kolom Mata Pelajaran, Materi, dan Kelas sebelum membuat outline slide.",
        iconType: "warning",
        buttonText: "Mengerti"
      });
    } else {
      alert("Mohon lengkapi Mata Pelajaran, Materi, dan Kelas.");
    }
    return;
  }

  // Validasi Kunci API Gemini
  const apiKey = getEffectiveApiKey();
  if (!apiKey || apiKey.length < 8) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Kunci API Gemini Belum Diatur",
        message: "Untuk menyusun slide otomatis dengan AI, silakan masukkan Kunci Google Gemini API Anda terlebih dahulu di menu Kunci API.",
        iconType: "warning",
        buttonText: "Atur Kunci API",
        redirectUrl: "../../dashboard-pengguna/api-key.html"
      });
    } else {
      alert("Kunci API Google Gemini belum diatur.");
    }
    return;
  }

  // Tentukan Target Jumlah Slide
  let targetSlideCount = 6;
  if (selectedSlideCountMode === 'custom') {
    const customNum = parseInt(document.getElementById('inputCustomSlide')?.value, 10);
    targetSlideCount = (!isNaN(customNum) && customNum >= 2 && customNum <= 25) ? customNum : 6;
  } else {
    targetSlideCount = 6; // Rekomendasi AI default
  }

  currentPresentationMeta = {
    subject: mapel,
    materi: materi,
    grade: kelas,
    slideCount: targetSlideCount
  };

  isGeneratingOutline = true;

  // Berpindah ke Sesi 2 dengan Status Loading
  goToSession(2);
  const loadingEl = document.getElementById('outlineLoadingState');
  const contentEl = document.getElementById('outlineContentWrapper');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (contentEl) contentEl.style.display = 'none';

  const promptText = `
Anda adalah Pakar Desain Media Presentasi Pembelajaran Edukatif Kurikulum Merdeka.
Tugas Anda adalah merancang OUTLINE ${targetSlideCount} slide presentasi pembelajaran yang terstruktur, menarik, dan siap diajarkan untuk:

- Mata Pelajaran: ${mapel}
- Kelas / Jenjang: ${kelas}
- Materi Pembelajaran:
${materi}

Spesifikasi Struktur Outline:
- Slide 1: Judul Presentasi Pembelajaran & Sub-judul Konsep Utama.
- Slide 2 s/d ${targetSlideCount - 1}: Pembahasan konsep esensial, contoh nyata, aktivitas interaktif, dan visualisasi pemahaman.
- Slide ${targetSlideCount}: Kesimpulan & Refleksi / Kuis Ringkas Pemahaman.

Format Keluaran WAJIB berupa JSON ARRAY murni tanpa teks pembuka atau penutup markdown (hanya format [ ... ]):
[
  {
    "slideNumber": 1,
    "title": "Judul Slide Singkat & Menarik",
    "points": [
      "Definisi multimedia interaktif: gabungan teks, gambar, audio, video, dan animasi",
      "Contoh aplikasi: pembelajaran online, game edukasi, presentasi interaktif",
      "Photo feature: ilustrasi interaksi pengguna dengan multimedia"
    ],
    "visualIdea": "Deskripsi visual gambar atau ilustrasi konsep materi untuk slide ini"
  }
]
`.trim();

  try {
    const aiResponse = await callGeminiApi(apiKey, promptText);
    let slidesData = parseSlideJsonResponse(aiResponse);

    if (!slidesData || slidesData.length === 0) {
      slidesData = createFallbackSlides(mapel, materi, kelas, targetSlideCount);
    }

    currentOutlineSlides = slidesData;
    expandedSlideIndex = 0;
    editingSlideIndex = -1;

    renderCanvaOutlineList();

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  } catch (err) {
    console.error("[Outline Generator Error]", err);
    if (loadingEl) loadingEl.style.display = 'none';
    goToSession(1);
    showErrorState(err.message || "Gagal menyusun outline dengan Google Gemini AI.");
  } finally {
    isGeneratingOutline = false;
  }
}

/**
 * ==========================================================================
 * SESI 2: RENDER KARTU OUTLINE BERGAYA CANVA AI (GAMBAR 2)
 * Fitur: Expand/Collapse, Edit Inline, Delete, & Drag and Drop Reorder
 * ==========================================================================
 */
function renderCanvaOutlineList() {
  const listContainer = document.getElementById('canvaOutlineList');
  const summaryTitle = document.getElementById('outlineSummaryTitle');
  const summaryMeta = document.getElementById('outlineSummaryMeta');
  const countBadge = document.getElementById('outlineSlideCountBadge');

  if (summaryTitle) summaryTitle.textContent = currentPresentationMeta.materi.split('\n')[0] || currentPresentationMeta.subject;
  if (summaryMeta) summaryMeta.textContent = `${currentPresentationMeta.subject} • ${currentPresentationMeta.grade}`;
  if (countBadge) countBadge.textContent = `${currentOutlineSlides.length} Slide Outline`;

  if (!listContainer) return;
  listContainer.innerHTML = '';

  currentOutlineSlides.forEach((s, idx) => {
    const isExpanded = (expandedSlideIndex === idx);
    const isEditing = (editingSlideIndex === idx);

    const card = document.createElement('div');
    card.className = `canva-outline-card ${isExpanded ? 'expanded' : ''}`;
    card.setAttribute('data-index', idx);
    card.setAttribute('draggable', isEditing ? 'false' : 'true');

    // Snippet Preview teks saat kartu collapsed (seperti pada Gambar 2)
    const previewPoints = (s.points && s.points.length > 0) ? s.points.join('. ') : (s.visualIdea || '');
    const previewSnippet = previewPoints.length > 95 ? previewPoints.substring(0, 92) + '...' : previewPoints;

    card.innerHTML = `
      <!-- Header Kartu -->
      <div class="canva-card-header" onclick="toggleExpandSlide(${idx})">
        <div class="canva-card-title-box">
          <h3 class="canva-card-title">${escapeHtml(s.title || ('Slide ' + (idx + 1)))}</h3>
          ${!isExpanded && !isEditing ? `
            <span class="canva-card-subtitle-preview">${escapeHtml(previewSnippet)}</span>
          ` : ''}
        </div>

        <div class="canva-card-actions">
          <button type="button" class="canva-action-btn" title="Edit Slide Ini" onclick="event.stopPropagation(); startEditSlide(${idx})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>

          <button type="button" class="canva-action-btn btn-delete" title="Hapus Slide Ini" onclick="event.stopPropagation(); deleteOutlineSlide(${idx})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>

          <div class="canva-action-btn canva-drag-handle" title="Tahan dan geser (drag) untuk memindahkan urutan slide" onclick="event.stopPropagation()">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <polyline points="5 9 2 12 5 15"></polyline>
              <polyline points="9 5 12 2 15 5"></polyline>
              <polyline points="15 19 12 22 9 19"></polyline>
              <polyline points="19 9 22 12 19 15"></polyline>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          </div>
        </div>
      </div>

      <!-- Body Kartu: Tampilan Key Ideas (Gambar 2) -->
      ${isExpanded && !isEditing ? `
        <div class="canva-card-body">
          <div class="canva-ideas-label">List key ideas (not final wording)</div>
          <div class="canva-ideas-box">
            ${s.visualIdea ? `<div class="canva-intro-text">${escapeHtml(s.visualIdea)}</div>` : ''}
            <ul class="canva-bullet-list">
              ${(s.points || []).map(p => `
                <li class="canva-bullet-item">
                  <span class="canva-bullet-dot"></span>
                  <span>${escapeHtml(p)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      <!-- Form Edit Inline (Saat Tombol Pensil Diklik) -->
      ${isEditing ? `
        <div class="canva-edit-form" onclick="event.stopPropagation()">
          <div class="canva-edit-field">
            <label class="canva-edit-label">Judul Slide:</label>
            <input type="text" class="canva-edit-input" id="editSlideTitle_${idx}" value="${escapeHtml(s.title || '')}" placeholder="Ketik judul slide...">
          </div>

          <div class="canva-edit-field">
            <label class="canva-edit-label">List Key Ideas (1 baris per poin):</label>
            <textarea class="canva-edit-textarea" id="editSlidePoints_${idx}" rows="4" placeholder="Poin-poin ide slide...">${escapeHtml((s.points || []).join('\n'))}</textarea>
          </div>

          <div class="canva-edit-field">
            <label class="canva-edit-label">Photo Feature / Ide Visual Gambar:</label>
            <textarea class="canva-edit-textarea" id="editSlideVisual_${idx}" rows="2" placeholder="Deskripsi gambar atau ide grafis visual...">${escapeHtml(s.visualIdea || '')}</textarea>
          </div>

          <div class="canva-edit-actions">
            <button type="button" class="btn-cancel-inline" onclick="cancelEditSlide()">Batal</button>
            <button type="button" class="btn-save-inline" onclick="saveEditSlide(${idx})">Simpan Perubahan</button>
          </div>
        </div>
      ` : ''}
    `;

    // Event Listener untuk Drag and Drop Urutan Slide
    attachDragAndDropEvents(card, idx);

    listContainer.appendChild(card);
  });
}

/**
 * Handle Expand / Collapse Kartu
 */
function toggleExpandSlide(idx) {
  if (editingSlideIndex === idx) return; // Jangan toggle saat sedang edit
  if (expandedSlideIndex === idx) {
    expandedSlideIndex = null;
  } else {
    expandedSlideIndex = idx;
    editingSlideIndex = -1;
  }
  renderCanvaOutlineList();
}

/**
 * Membuka Form Edit Inline Slide
 */
function startEditSlide(idx) {
  expandedSlideIndex = idx;
  editingSlideIndex = idx;
  renderCanvaOutlineList();

  setTimeout(() => {
    const input = document.getElementById(`editSlideTitle_${idx}`);
    if (input) input.focus();
  }, 50);
}

/**
 * Simpan Hasil Edit Inline Slide
 */
function saveEditSlide(idx) {
  const titleVal = document.getElementById(`editSlideTitle_${idx}`)?.value.trim() || `Slide ${idx + 1}`;
  const pointsRaw = document.getElementById(`editSlidePoints_${idx}`)?.value || '';
  const pointsArr = pointsRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const visualVal = document.getElementById(`editSlideVisual_${idx}`)?.value.trim() || '';

  currentOutlineSlides[idx] = {
    ...currentOutlineSlides[idx],
    title: titleVal,
    points: pointsArr.length > 0 ? pointsArr : ['Penjelasan materi pokok pembelajaran.'],
    visualIdea: visualVal
  };

  editingSlideIndex = -1;
  expandedSlideIndex = idx;
  renderCanvaOutlineList();
}

/**
 * Batalkan Edit Inline
 */
function cancelEditSlide() {
  editingSlideIndex = -1;
  renderCanvaOutlineList();
}

/**
 * Hapus Slide dari Outline
 */
function deleteOutlineSlide(idx) {
  if (currentOutlineSlides.length <= 1) {
    alert("Minimal harus ada 1 slide dalam presentasi.");
    return;
  }

  const confirmDelete = confirm(`Hapus slide ${idx + 1}: "${currentOutlineSlides[idx].title}" dari outline?`);
  if (!confirmDelete) return;

  currentOutlineSlides.splice(idx, 1);
  currentOutlineSlides.forEach((s, i) => { s.slideNumber = i + 1; });

  if (expandedSlideIndex === idx) {
    expandedSlideIndex = Math.max(0, idx - 1);
  } else if (expandedSlideIndex > idx) {
    expandedSlideIndex--;
  }

  editingSlideIndex = -1;
  renderCanvaOutlineList();
}

/**
 * Tambah Slide Baru ke Outline
 */
function addNewOutlineSlide() {
  const nextNum = currentOutlineSlides.length + 1;
  currentOutlineSlides.push({
    slideNumber: nextNum,
    title: `Materi Konsep Baru #${nextNum}`,
    points: [
      'Poin materi penting 1',
      'Poin materi penting 2',
      'Photo feature: ilustrasi gambar materi terkait'
    ],
    visualIdea: 'Ilustrasi konsep visual materi terkait'
  });

  expandedSlideIndex = currentOutlineSlides.length - 1;
  editingSlideIndex = currentOutlineSlides.length - 1;
  renderCanvaOutlineList();
}

/**
 * ==========================================================================
 * SISTEM DRAG AND DROP UNTUK MENUKAR URUTAN SLIDE SECARA INTERAKTIF
 * ==========================================================================
 */
function attachDragAndDropEvents(card, index) {
  card.addEventListener('dragstart', (e) => {
    draggedIndex = index;
    card.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {}
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('is-dragging');
    document.querySelectorAll('.canva-outline-card').forEach(c => {
      c.classList.remove('drop-above', 'drop-below', 'is-dragging');
    });
    draggedIndex = null;
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    if (e.clientY < midY) {
      card.classList.add('drop-above');
      card.classList.remove('drop-below');
    } else {
      card.classList.add('drop-below');
      card.classList.remove('drop-above');
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drop-above', 'drop-below');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drop-above', 'drop-below');

    if (draggedIndex === null || draggedIndex === index) return;

    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    let targetIndex = index;

    if (e.clientY >= midY && draggedIndex < index) {
      targetIndex = index;
    } else if (e.clientY < midY && draggedIndex > index) {
      targetIndex = index;
    }

    // Pindahkan elemen di dalam array currentOutlineSlides
    const movedItem = currentOutlineSlides.splice(draggedIndex, 1)[0];
    currentOutlineSlides.splice(targetIndex, 0, movedItem);

    // Update nomor slide urut
    currentOutlineSlides.forEach((s, idx) => { s.slideNumber = idx + 1; });

    expandedSlideIndex = targetIndex;
    editingSlideIndex = -1;
    renderCanvaOutlineList();
  });
}

/**
 * ==========================================================================
 * SESI 2 -> SESI 3: GENERATE MEDIA PPT BERGAMBAR (Gambar 16:9 + PPTX)
 * ==========================================================================
 */
async function handleGenerateMedia() {
  if (isGeneratingMedia) return;

  if (!currentOutlineSlides || currentOutlineSlides.length === 0) {
    alert("Outline slide kosong. Silakan generate outline terlebih dahulu.");
    return;
  }

  isGeneratingMedia = true;

  // Berpindah ke Sesi 3 dengan Status Loading
  goToSession(3);
  const loadingEl = document.getElementById('mediaLoadingState');
  const contentEl = document.getElementById('mediaResultContentWrapper');
  if (loadingEl) loadingEl.style.display = 'flex';
  if (contentEl) contentEl.style.display = 'none';

  try {
    const meta = currentPresentationMeta;
    const slidesWithImages = [];

    // Generate Gambar Visual Edukasi 16:9 per Slide
    for (let i = 0; i < currentOutlineSlides.length; i++) {
      const s = currentOutlineSlides[i];
      const updateSub = document.getElementById('mediaLoadingSub');
      if (updateSub) {
        updateSub.textContent = `Membuat ilustrasi gambar untuk Slide ${i + 1} dari ${currentOutlineSlides.length} (${s.title})...`;
      }

      // Render Visual Image Canvas 16:9
      const imgDataUrl = await generateEducationalSlideImage(s, i, meta);
      slidesWithImages.push({
        ...s,
        slideNumber: i + 1,
        imageUrl: imgDataUrl
      });
    }

    currentGeneratedMediaSlides = slidesWithImages;

    // Render Hasil Preview Media Bergambar
    renderMediaResultView(slidesWithImages, meta);

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  } catch (err) {
    console.error("[Generate Media Error]", err);
    if (loadingEl) loadingEl.style.display = 'none';
    goToSession(2);
    showErrorState(err.message || "Gagal menghasilkan media presentasi bergambar.");
  } finally {
    isGeneratingMedia = false;
  }
}

/**
 * ==========================================================================
 * GENERATOR GAMBAR SLIDE EDUKASI BERESOLUSI TINGGI (16:9 CANVAS ENGINE)
 * ==========================================================================
 */
async function generateEducationalSlideImage(slide, index, meta) {
  const canvas = document.createElement('canvas');
  const width = 1280;
  const height = 720;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const subject = meta.subject || 'Pendidikan';
  const grade = meta.grade || 'Umum';
  const title = slide.title || `Slide ${index + 1}`;
  const visualIdea = slide.visualIdea || '';

  // A. Palet Warna Modern Berdasarkan Mata Pelajaran
  const palettes = [
    { bg1: '#0f172a', bg2: '#1e293b', accent: '#38bdf8', secondary: '#0284c7' }, // Blue Dark
    { bg1: '#064e3b', bg2: '#022c22', accent: '#34d399', secondary: '#10b981' }, // Green Emerald
    { bg1: '#431407', bg2: '#270803', accent: '#fb923c', secondary: '#f97316' }, // Warm Orange
    { bg1: '#312e81', bg2: '#1e1b4b', accent: '#818cf8', secondary: '#6366f1' }, // Indigo Tech
    { bg1: '#581c87', bg2: '#3b0764', accent: '#c084fc', secondary: '#a855f7' }, // Purple Creative
  ];
  const pal = palettes[index % palettes.length];
  const accentColor = pal.accent;
  const secondaryAccent = pal.secondary;

  // B. Background Gradient Halus
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, pal.bg1);
  bgGrad.addColorStop(1, pal.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // C. Pola Grid Modern Halus
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // D. Badge Slide Nomor di Kiri Atas
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  roundRect(ctx, 60, 50, 110, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SLIDE ${String(index + 1).padStart(2, '0')}`, 76, 68);

  // Meta Mapel & Kelas
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${subject.toUpperCase()} • ${grade.toUpperCase()}`, 190, 68);

  // E. Kartu Kanan: Artwork Diagram & Visual Grafis
  const cardX = 640;
  const cardY = 120;
  const cardW = 580;
  const cardH = 540;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.clip();

  drawThematicArtwork(ctx, cardX, cardY, cardW, cardH, subject, visualIdea, accentColor, secondaryAccent, index);
  ctx.restore();

  // F. Teks Judul & Ringkasan Konsep di Sisi Kiri
  const leftX = 60;
  const leftY = 145;
  const maxTextW = 540;

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'top';
  wrapText(ctx, title, leftX, leftY, maxTextW, 46, 2);

  ctx.fillStyle = accentColor;
  ctx.fillRect(leftX, leftY + 110, 80, 5);

  const points = Array.isArray(slide.points) ? slide.points : [];
  let currentY = leftY + 140;

  points.slice(0, 3).forEach((pt) => {
    ctx.fillStyle = secondaryAccent;
    ctx.beginPath();
    ctx.arc(leftX + 8, currentY + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, pt, leftX + 26, currentY, maxTextW - 30, 28, 2);
    currentY += lines * 30 + 16;
  });

  // Footer Tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Edu Workspace Presentation • AI Generated Visual Media', leftX, height - 55);

  return canvas.toDataURL('image/png');
}

/**
 * Gambar Artwork Grafis Tematik Pada Kartu Kanan Slide
 */
function drawThematicArtwork(ctx, cx, cy, cw, ch, subject, visualIdea, color1, color2, slideIdx) {
  const centerX = cx + cw / 2;
  const centerY = cy + ch / 2 - 20;

  const artGlow = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 200);
  artGlow.addColorStop(0, color1);
  artGlow.addColorStop(0.6, color2);
  artGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = artGlow;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.strokeStyle = color1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRect(ctx, centerX - 140, centerY - 100, 280, 200, 16);
  ctx.stroke();

  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.arc(centerX - 90, centerY - 50, 18, 0, Math.PI * 2);
  ctx.arc(centerX + 90, centerY - 50, 18, 0, Math.PI * 2);
  ctx.arc(centerX, centerY + 40, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 90, centerY - 50);
  ctx.lineTo(centerX, centerY + 40);
  ctx.lineTo(centerX + 90, centerY - 50);
  ctx.stroke();

  // Label Deskripsi Visual di Bagian Bawah
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  roundRect(ctx, cx + 24, cy + ch - 80, cw - 48, 56, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  const ideaClean = visualIdea ? `✦ ${visualIdea}` : `✦ Ilustrasi konsep visual pembelajaran terstruktur`;
  const ideaSnippet = ideaClean.length > 68 ? ideaClean.substring(0, 65) + '...' : ideaClean;
  ctx.fillText(ideaSnippet, cx + 40, cy + ch - 52);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = (text || '').split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return lineCount + 1;
}

/**
 * ==========================================================================
 * SESI 3: RENDER HASIL MEDIA PPT BERGAMBAR
 * ==========================================================================
 */
function renderMediaResultView(slides, meta) {
  const listContainer = document.getElementById('pptMediaSlidesList');
  const summaryTitle = document.getElementById('mediaSummaryTitle');
  const summaryMeta = document.getElementById('mediaSummaryMeta');
  const countBadge = document.getElementById('mediaSlideCountBadge');

  if (summaryTitle) summaryTitle.textContent = meta.materi.split('\n')[0] || meta.subject;
  if (summaryMeta) summaryMeta.textContent = `${meta.subject} • ${meta.grade}`;
  if (countBadge) countBadge.textContent = `${slides.length} Slide Bergambar Siap`;

  if (!listContainer) return;
  listContainer.innerHTML = '';

  slides.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'media-slide-card';

    const pointsList = (s.points || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');

    card.innerHTML = `
      <div class="media-slide-top">
        <span class="media-slide-number">Slide ${s.slideNumber || idx + 1}</span>
        <h3 class="media-slide-title">${escapeHtml(s.title || '')}</h3>
      </div>

      <!-- Preview Gambar Slide 16:9 -->
      <div class="media-slide-image-frame">
        <img class="media-slide-img" src="${s.imageUrl}" alt="Slide ${idx + 1}: ${escapeHtml(s.title || '')}" />
      </div>

      <div class="media-slide-image-bar">
        <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Format 16:9 HD Gambar Slide</span>
        <button type="button" class="btn-download-slide-img" onclick="downloadSingleSlideImage(${idx})" title="Unduh gambar slide ini">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Unduh Gambar (PNG)</span>
        </button>
      </div>

      <!-- Poin Materi -->
      <div class="ppt-slide-content">
        <ul class="slide-bullet-list">${pointsList}</ul>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

/**
 * Unduh Satu Gambar Slide Sebagai PNG
 */
function downloadSingleSlideImage(index) {
  const slide = currentGeneratedMediaSlides[index];
  if (!slide || !slide.imageUrl) return;

  const meta = currentPresentationMeta;
  const safeName = `Slide_${index + 1}_${(meta.subject || 'Presentasi').replace(/[^a-zA-Z0-9]/g, '_')}.png`;

  const a = document.createElement('a');
  a.href = slide.imageUrl;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Mulai Presentasi Baru (Reset ke Sesi 1)
 */
function startNewPresentation() {
  const confirmNew = confirm("Mulai buat presentasi baru? Materi yang belum diunduh dapat disimpan terlebih dahulu.");
  if (!confirmNew) return;

  currentOutlineSlides = [];
  currentGeneratedMediaSlides = [];
  goToSession(1);
}

/**
 * ==========================================================================
 * UNDUH FILE POWERPOINT (.PPTX) ASLI DENGAN GAMBAR
 * ==========================================================================
 */
function downloadPowerPointFile() {
  const slides = currentGeneratedMediaSlides.length > 0 ? currentGeneratedMediaSlides : currentOutlineSlides;
  if (!slides || slides.length === 0) return;

  const meta = currentPresentationMeta;
  const topicTitle = meta.materi.split('\n')[0] || meta.subject || 'Presentasi';
  const safeFilename = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_EduWorkspace.pptx`;

  if (typeof PptxGenJS !== 'undefined') {
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // 1. SLIDE COVER (Slide 1)
      const coverSlide = pptx.addSlide();
      coverSlide.background = { color: '0F172A' };

      coverSlide.addText('EDU WORKSPACE PRESENTATION', {
        x: 1.0, y: 1.2, w: 11.3, h: 0.5,
        fontSize: 13, bold: true, color: 'EAB308', letterSpacing: 2, align: 'center'
      });

      coverSlide.addText(topicTitle, {
        x: 1.0, y: 2.2, w: 11.3, h: 1.8,
        fontSize: 34, bold: true, color: 'FFFFFF', align: 'center', breakLine: true
      });

      coverSlide.addText(`${meta.subject} • ${meta.grade}`, {
        x: 1.0, y: 4.2, w: 11.3, h: 0.8,
        fontSize: 18, color: '94A3B8', align: 'center'
      });

      // 2. SLIDE KONTEN BERGAMBAR
      slides.forEach((s, idx) => {
        const slide = pptx.addSlide();
        slide.background = { color: 'F8FAFC' };

        slide.addShape(pptx.shapes.RECTANGLE, {
          x: 0, y: 0, w: '100%', h: 1.0,
          fill: { color: '0F172A' }, line: { color: '0F172A' }
        });

        slide.addText(`Slide ${s.slideNumber || (idx + 1)}: ${s.title || ''}`, {
          x: 0.8, y: 0.15, w: 11.5, h: 0.7,
          fontSize: 20, bold: true, color: 'FFFFFF'
        });

        const bulletObjects = (s.points || []).map(pt => ({
          text: pt,
          options: { bullet: true, fontSize: 14, color: '334155', breakLine: true }
        }));

        if (bulletObjects.length > 0) {
          slide.addText(bulletObjects, {
            x: 0.8, y: 1.3, w: 5.6, h: 4.8,
            lineSpacing: 24, valign: 'top'
          });
        }

        if (s.imageUrl && s.imageUrl.startsWith('data:image')) {
          slide.addImage({
            data: s.imageUrl,
            x: 6.8,
            y: 1.3,
            w: 5.8,
            h: 4.8,
            sizing: { type: 'contain' }
          });
        }

        if (s.visualIdea) {
          slide.addNotes(`IDE VISUAL:\n${s.visualIdea}`);
        }
      });

      pptx.writeFile({ fileName: safeFilename });

      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "File PowerPoint Diunduh!",
          message: `File presentasi PowerPoint '${safeFilename}' lengkap dengan gambar visual berhasil diunduh ke perangkat Anda.`,
          iconType: "success",
          buttonText: "Selesai"
        });
      }
      return;
    } catch (e) {
      console.warn("PptxGenJS gagal:", e);
    }
  }

  alert("Gagal mengekspor file PowerPoint. Silakan salin teks atau unduh gambar per slide.");
}

/**
 * Salin Seluruh Teks Slide ke Clipboard
 */
function copySlideContent() {
  const slides = currentGeneratedMediaSlides.length > 0 ? currentGeneratedMediaSlides : currentOutlineSlides;
  if (!slides || slides.length === 0) return;

  const meta = currentPresentationMeta;
  let text = `PRESENTASI: ${meta.subject} - ${meta.grade}\n`;
  text += `Topik: ${meta.materi}\n\n`;

  slides.forEach((s, idx) => {
    text += `===============================\n`;
    text += `SLIDE ${s.slideNumber || idx + 1}: ${s.title}\n`;
    text += `===============================\n`;
    (s.points || []).forEach(p => { text += `• ${p}\n`; });
    if (s.visualIdea) text += `\n[Ide Visual]: ${s.visualIdea}\n`;
    text += `\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const btnLabel = document.getElementById('copyBtnLabel');
    if (btnLabel) {
      const orig = btnLabel.textContent;
      btnLabel.textContent = "Tersalin!";
      setTimeout(() => { btnLabel.textContent = orig; }, 2000);
    }
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Teks Berhasil Disalin!",
        message: "Seluruh outline naskah dan materi slide telah disalin ke clipboard.",
        iconType: "success",
        buttonText: "Mengerti"
      });
    }
  });
}

/**
 * Panggil Google Gemini API
 */
async function callGeminiApi(apiKey, promptText) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-flash-latest'
  ];

  const updateSub = (txt) => {
    const el = document.getElementById('outlineLoadingSub');
    if (el) el.textContent = txt;
  };

  let lastError = null;

  for (const model of models) {
    try {
      updateSub(`Menghubungkan ke Gemini AI (${model})...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      } else {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${response.status}`;
        if (msg.toLowerCase().includes('api key not valid') || response.status === 400 || response.status === 403) {
          throw new Error("Kunci Google Gemini API Anda tidak valid atau dinonaktifkan. Silakan periksa di menu Kunci API.");
        }
        lastError = new Error(msg);
      }
    } catch (e) {
      if (e.message && e.message.includes('tidak valid')) throw e;
      lastError = e;
    }
  }

  throw lastError || new Error("Gagal menerima respons dari AI.");
}

/**
 * Parsing Respons JSON dari AI
 */
function parseSlideJsonResponse(rawText) {
  if (!rawText) return null;

  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.slides)) return parsed.slides;
  } catch (e) {}

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const slice = cleaned.substring(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }

  return null;
}

/**
 * Fallback Slides Template jika JSON Parsing Bermasalah
 */
function createFallbackSlides(mapel, materi, kelas, count) {
  const lines = materi.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const title = lines[0] || mapel;
  const slides = [];

  // Slide 1: Cover
  slides.push({
    slideNumber: 1,
    title: `Pengenalan: ${title}`,
    points: [
      `Mata Pelajaran: ${mapel}`,
      `Kelas: ${kelas}`,
      `Fokus Pembelajaran: Pemahaman konsep dasar dan penerapan praktis.`
    ],
    visualIdea: `Ilustrasi grafis tematik pengantar materi ${mapel} dengan tata letak visual modern`
  });

  // Slide 2..N-1: Poin Konsep
  for (let i = 2; i < count; i++) {
    const chunkLine = lines[i - 1] || `Pembahasan Konsep Utama Bagian ${i - 1}`;
    slides.push({
      slideNumber: i,
      title: chunkLine.length > 35 ? chunkLine.substring(0, 32) + '...' : chunkLine,
      points: [
        "Definisi dan pengertian esensial materi.",
        "Karakteristik, prinsip kerja, atau struktur penting.",
        "Photo feature: contoh penerapan nyata dalam kehidupan sehari-hari."
      ],
      visualIdea: `Diagram konsep interaktif atau bagan skematis terkait ${chunkLine}`
    });
  }

  // Slide Terakhir: Refleksi & Penutup
  slides.push({
    slideNumber: count,
    title: "Kesimpulan & Refleksi Pembelajaran",
    points: [
      "Rangkuman poin-poin penting yang telah dipelajari.",
      "Pertanyaan refleksi untuk mengecek pemahaman mandiri.",
      "Tugas tindak lanjut atau proyek aplikasi praktis."
    ],
    visualIdea: "Ilustrasi rangkuman peta konsep atau refleksi siswa dengan ikon bintang capaian belajar"
  });

  return slides;
}

function showErrorState(errMsg) {
  if (typeof showEduAlert === 'function') {
    showEduAlert({
      title: "Gagal Menghasilkan Slide",
      message: errMsg,
      iconType: "warning",
      buttonText: "Coba Lagi"
    });
  } else {
    alert(errMsg);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
