/**
 * Edu Workspace - Generate Media Pembelajaran (PowerPoint Generator) Logic
 * Alur 2-Tahap: 
 * 1. Generate & Edit Outline Slide
 * 2. Generate Media Presentasi PPT Bergambar (.pptx + PNG Slide Images)
 */

let currentUser = null;
let userModulList = [];
let currentSourceTab = 'modul';
let selectedSlideCountMode = 'auto'; // 'auto' | 'custom'
let currentOutlineSlides = [];
let currentGeneratedMediaSlides = [];
let currentPresentationMeta = {
  subject: '',
  materi: '',
  grade: '',
  slideCount: 6
};
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
 * Otomatis mengisi Mata Pelajaran, Materi, dan Kelas
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
 * Pemilihan Jumlah Slide (HANYA 2 TOMBOL: Rekomendasi AI & Isi Sendiri)
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
 * TAHAP 1: PROSES GENERATE OUTLINE SLIDE DENGAN AI
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
  setUIMode('loading', { title: "AI Sedang Menyusun Outline...", sub: "Menghubungkan ke Google Gemini AI..." });

  // Prompt Khusus untuk menghasilkan Outline Slide
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

PENTING: Berikan "visualIdea" yang deskriptif dan jelas untuk setiap slide agar dapat diilustrasikan dengan visual grafis atau gambar konsep yang menarik!

Format Keluaran WAJIB berupa JSON ARRAY murni tanpa teks pembuka atau penutup markdown (hanya format [ ... ]):
[
  {
    "slideNumber": 1,
    "title": "Judul Slide Singkat & Menarik",
    "points": [
      "Poin materi penting 1",
      "Poin materi penting 2",
      "Poin materi penting 3"
    ],
    "teacherNote": "Panduan narasi ucapan guru saat menampilkan slide ini di depan kelas",
    "visualIdea": "Deskripsi visual gambar atau ilustrasi grafis konsep materi untuk slide ini"
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
    renderOutlineEditor(slidesData, currentPresentationMeta);
    setUIMode('outline');
  } catch (err) {
    console.error("[Outline Generator Error]", err);
    showErrorState(err.message || "Gagal menyusun outline dengan Google Gemini AI.");
  } finally {
    isGeneratingOutline = false;
  }
}

/**
 * ==========================================================================
 * RENDER TAHAP 1: FORM EDITOR OUTLINE SLIDE
 * ==========================================================================
 */
function renderOutlineEditor(slides, meta) {
  const listContainer = document.getElementById('pptOutlineList');
  const summaryTitle = document.getElementById('outlineSummaryTitle');
  const summaryMeta = document.getElementById('outlineSummaryMeta');
  const countBadge = document.getElementById('outlineSlideCountBadge');

  if (summaryTitle) summaryTitle.textContent = meta.materi.split('\n')[0] || meta.subject;
  if (summaryMeta) summaryMeta.textContent = `${meta.subject} • ${meta.grade}`;
  if (countBadge) countBadge.textContent = `${slides.length} Slide Outline`;

  if (!listContainer) return;
  listContainer.innerHTML = '';

  slides.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'outline-slide-card';
    card.setAttribute('data-slide-index', idx);

    const pointsText = Array.isArray(s.points) ? s.points.join('\n') : (s.points || '');

    card.innerHTML = `
      <div class="outline-slide-top">
        <div class="outline-slide-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          <span>Slide ${idx + 1}</span>
        </div>
        ${slides.length > 1 ? `
          <button type="button" class="btn-delete-outline-slide" onclick="deleteOutlineSlide(${idx})" title="Hapus Slide Ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Hapus</span>
          </button>
        ` : ''}
      </div>

      <div class="outline-field-group">
        <label class="outline-field-label">Judul Slide:</label>
        <input type="text" class="outline-input-title" id="outlineTitle_${idx}" value="${escapeHtml(s.title || '')}" placeholder="Masukkan judul slide...">
      </div>

      <div class="outline-field-group">
        <label class="outline-field-label">Poin-poin Materi (1 baris per poin):</label>
        <textarea class="outline-textarea" id="outlinePoints_${idx}" rows="3" placeholder="Tuliskan poin-poin materi slide...">${escapeHtml(pointsText)}</textarea>
      </div>

      <div class="outline-field-group">
        <label class="outline-field-label" style="color: #854d0e;">
          <span>🎨 Ide Visual & Gambar Slide:</span>
          <span style="font-size: 0.72rem; font-weight: 500; color: #a16207;">Digunakan untuk menghasilkan gambar slide</span>
        </label>
        <textarea class="outline-textarea outline-textarea-visual" id="outlineVisual_${idx}" rows="2" placeholder="Deskripsi gambar visual slide...">${escapeHtml(s.visualIdea || '')}</textarea>
      </div>

      <div class="outline-field-group">
        <label class="outline-field-label">Panduan Narasi Pendidik (Opsional):</label>
        <textarea class="outline-textarea" id="outlineNotes_${idx}" rows="2" placeholder="Panduan narasi ucapan guru saat menampilkan slide ini...">${escapeHtml(s.teacherNote || '')}</textarea>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

/**
 * Sinkronisasi Nilai Input Pengguna ke Variabel State Outline
 */
function collectCurrentOutlineFromInputs() {
  const cards = document.querySelectorAll('.outline-slide-card');
  const updated = [];

  cards.forEach((card, idx) => {
    const titleVal = document.getElementById(`outlineTitle_${idx}`)?.value.trim() || `Slide ${idx + 1}`;
    const pointsRaw = document.getElementById(`outlinePoints_${idx}`)?.value || '';
    const pointsArr = pointsRaw.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    const visualVal = document.getElementById(`outlineVisual_${idx}`)?.value.trim() || '';
    const notesVal = document.getElementById(`outlineNotes_${idx}`)?.value.trim() || '';

    updated.push({
      slideNumber: idx + 1,
      title: titleVal,
      points: pointsArr.length > 0 ? pointsArr : ['Penjelasan materi pokok pembelajaran.'],
      visualIdea: visualVal,
      teacherNote: notesVal
    });
  });

  if (updated.length > 0) {
    currentOutlineSlides = updated;
  }
  return currentOutlineSlides;
}

/**
 * Tambah Slide Baru ke Outline
 */
function addNewOutlineSlide() {
  collectCurrentOutlineFromInputs();
  const nextNum = currentOutlineSlides.length + 1;
  currentOutlineSlides.push({
    slideNumber: nextNum,
    title: `Materi Konsep Baru #${nextNum}`,
    points: ['Poin materi penting 1', 'Poin materi penting 2'],
    visualIdea: 'Ilustrasi grafik visual konsep materi terkait',
    teacherNote: 'Ajak siswa mendiskusikan topik ini secara aktif'
  });
  renderOutlineEditor(currentOutlineSlides, currentPresentationMeta);
}

/**
 * Hapus Slide dari Outline
 */
function deleteOutlineSlide(index) {
  collectCurrentOutlineFromInputs();
  if (currentOutlineSlides.length <= 1) {
    alert("Minimal harus ada 1 slide dalam presentasi.");
    return;
  }
  currentOutlineSlides.splice(index, 1);
  currentOutlineSlides.forEach((s, idx) => { s.slideNumber = idx + 1; });
  renderOutlineEditor(currentOutlineSlides, currentPresentationMeta);
}

/**
 * ==========================================================================
 * TAHAP 2: PROSES GENERATE MEDIA PPT BERGAMBAR (Gambar + .PPTX)
 * ==========================================================================
 */
async function handleGenerateMedia() {
  if (isGeneratingMedia) return;

  // 1. Ambil seluruh isian hasil editing pengguna dari form outline
  collectCurrentOutlineFromInputs();

  if (!currentOutlineSlides || currentOutlineSlides.length === 0) {
    alert("Outline slide kosong. Silakan generate outline terlebih dahulu.");
    return;
  }

  isGeneratingMedia = true;
  setUIMode('loading', {
    title: "Sedang Membuat Media PPT Bergambar...",
    sub: "Menghasilkan visual gambar edukatif beresolusi tinggi untuk setiap slide..."
  });

  try {
    const meta = currentPresentationMeta;
    const slidesWithImages = [];

    // 2. Generate Gambar Visual Edukasi Beresolusi Tinggi (16:9) per Slide
    for (let i = 0; i < currentOutlineSlides.length; i++) {
      const s = currentOutlineSlides[i];
      const updateSub = document.getElementById('loadingSubtitleText');
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

    // 3. Render Hasil Preview Media Bergambar
    renderMediaResultView(slidesWithImages, meta);
    setUIMode('media');
  } catch (err) {
    console.error("[Generate Media Error]", err);
    showErrorState(err.message || "Gagal menghasilkan media presentasi bergambar.");
  } finally {
    isGeneratingMedia = false;
  }
}

/**
 * ==========================================================================
 * GENERATOR GAMBAR SLIDE EDUKASI BERESOLUSI TINGGI (16:9 CANVAS ENGINE)
 * Menghasilkan visual artistik, terstruktur, dan modern per slide
 * ==========================================================================
 */
async function generateEducationalSlideImage(slide, index, meta) {
  const width = 1280;
  const height = 720; // Aspek Rasio 16:9

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const subject = (meta.subject || '').toLowerCase();
  const title = slide.title || `Slide ${index + 1}`;
  const visualIdea = slide.visualIdea || '';

  // 1. Tentukan Palet Warna Berdasarkan Mata Pelajaran
  let gradColor1 = '#0f172a';
  let gradColor2 = '#1e293b';
  let accentColor = '#ffd500';
  let secondaryAccent = '#38bdf8';

  if (subject.includes('desain') || subject.includes('seni') || subject.includes('kreatif')) {
    gradColor1 = '#1e1b4b'; // Deep Indigo
    gradColor2 = '#312e81';
    accentColor = '#f59e0b';
    secondaryAccent = '#a855f7';
  } else if (subject.includes('matematika') || subject.includes('komputer') || subject.includes('tik') || subject.includes('fisika')) {
    gradColor1 = '#091e3a'; // Tech Deep Blue
    gradColor2 = '#1e3a8a';
    accentColor = '#38bdf8';
    secondaryAccent = '#60a5fa';
  } else if (subject.includes('ipa') || subject.includes('biologi') || subject.includes('alam')) {
    gradColor1 = '#064e3b'; // Emerald
    gradColor2 = '#047857';
    accentColor = '#4ade80';
    secondaryAccent = '#2dd4bf';
  } else if (subject.includes('bahasa') || subject.includes('indonesia') || subject.includes('inggris')) {
    gradColor1 = '#4c0519'; // Crimson Maroon
    gradColor2 = '#9f1239';
    accentColor = '#fb7185';
    secondaryAccent = '#fde047';
  } else if (subject.includes('ips') || subject.includes('sejarah') || subject.includes('geografi') || subject.includes('sosial')) {
    gradColor1 = '#451a03'; // Warm Earth
    gradColor2 = '#92400e';
    accentColor = '#fbbf24';
    secondaryAccent = '#f97316';
  }

  // A. Latar Belakang Gradien Halus
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, gradColor1);
  bgGrad.addColorStop(1, gradColor2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // B. Pola Ornamen Grafis Modern & Soft Radial Glow
  const radialGlow = ctx.createRadialGradient(width * 0.7, height * 0.35, 20, width * 0.7, height * 0.35, 450);
  radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  radialGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // Grid / Dot lines subtle
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 48;
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

  // C. Header Banner Kiri Atas
  // Badge Edu Workspace & Slide Index
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  roundRect(ctx, 60, 50, 160, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(`SLIDE 0${index + 1}`, 140, 68);

  // Tag Kategori & Mapel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${(meta.subject || 'MEDIA PEMBELAJARAN').toUpperCase()} • ${meta.grade || ''}`, 240, 68);

  // D. Kartu Ilustrasi Visual Utama di Sisi Kanan (Konsep Visual)
  const cardX = 640;
  const cardY = 120;
  const cardW = 580;
  const cardH = 540;

  ctx.save();
  // Glassmorphism Card Frame
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();
  ctx.clip();

  // Gambar Elemen Visual Konsep
  drawThematicArtwork(ctx, cardX, cardY, cardW, cardH, subject, visualIdea, accentColor, secondaryAccent, index);
  ctx.restore();

  // E. Teks Judul & Ringkasan Konsep di Sisi Kiri
  const leftX = 60;
  const leftY = 150;
  const maxTextW = 540;

  // Judul Slide
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.textBaseline = 'top';
  wrapText(ctx, title, leftX, leftY, maxTextW, 46, 2);

  // Garis Aksen Bawah Judul
  ctx.fillStyle = accentColor;
  ctx.fillRect(leftX, leftY + 110, 80, 5);

  // Poin-poin Konsep Utama
  const points = Array.isArray(slide.points) ? slide.points : [];
  let currentY = leftY + 140;

  points.slice(0, 3).forEach((pt, pIdx) => {
    // Bullet Icon
    ctx.fillStyle = secondaryAccent;
    ctx.beginPath();
    ctx.arc(leftX + 8, currentY + 12, 6, 0, Math.PI * 2);
    ctx.fill();

    // Text Poin
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, pt, leftX + 26, currentY, maxTextW - 30, 28, 2);
    currentY += lines * 30 + 16;
  });

  // Footer Tag Edu Workspace
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Edu Workspace Presentation • AI Generated Visual Media', leftX, height - 55);

  return canvas.toDataURL('image/png');
}

/**
 * Gambar Artwork / Diagram Grafis Tematik Pada Kartu Kanan
 */
function drawThematicArtwork(ctx, cx, cy, cw, ch, subject, visualIdea, color1, color2, slideIdx) {
  const centerX = cx + cw / 2;
  const centerY = cy + ch / 2 - 20;

  // Glowing Backdrop Circle
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

  // Diagram Box Frames
  ctx.strokeStyle = color1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRect(ctx, centerX - 140, centerY - 100, 280, 200, 16);
  ctx.stroke();

  // Floating Elements & Nodes
  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.arc(centerX - 90, centerY - 50, 18, 0, Math.PI * 2);
  ctx.arc(centerX + 90, centerY - 50, 18, 0, Math.PI * 2);
  ctx.arc(centerX, centerY + 40, 26, 0, Math.PI * 2);
  ctx.fill();

  // Connection Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 90, centerY - 50);
  ctx.lineTo(centerX, centerY + 40);
  ctx.lineTo(centerX + 90, centerY - 50);
  ctx.stroke();

  // Label Box Visual Idea di Bawah Frame
  const labelBoxY = cy + ch - 90;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.beginPath();
  roundRect(ctx, cx + 24, labelBoxY, cw - 48, 64, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cleanVisual = visualIdea.length > 70 ? visualIdea.substring(0, 67) + '...' : visualIdea;
  ctx.fillText(`💡 ${cleanVisual || 'Visual Konsep Pembelajaran Interaktif'}`, centerX, labelBoxY + 32);
}

/**
 * Canvas Helper: Rounded Rectangle
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

/**
 * Canvas Helper: Wrap Text
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(' ');
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
 * RENDER TAHAP 2: HASIL MEDIA PPT BERGAMBAR
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Unduh Gambar (PNG)</span>
        </button>
      </div>

      <!-- Poin Materi -->
      <div class="ppt-slide-content">
        <ul>${pointsList}</ul>
      </div>

      <!-- Panduan Narasi Pendidik -->
      ${s.teacherNote ? `
        <div class="ppt-speaker-notes">
          <strong>🗣️ Panduan Narasi Pendidik:</strong>
          ${escapeHtml(s.teacherNote)}
        </div>
      ` : ''}
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
 * Kembali ke Tampilan Edit Outline (Bisa Menyesuaikan Lagi)
 */
function backToOutlineView() {
  setUIMode('outline');
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

      // Tag Edu Workspace
      coverSlide.addText('EDU WORKSPACE PRESENTATION', {
        x: 1.0, y: 1.2, w: 11.3, h: 0.5,
        fontSize: 13, bold: true, color: 'EAB308', letterSpacing: 2, align: 'center'
      });

      // Judul Utama
      coverSlide.addText(topicTitle, {
        x: 1.0, y: 2.2, w: 11.3, h: 1.8,
        fontSize: 34, bold: true, color: 'FFFFFF', align: 'center', breakLine: true
      });

      // Sub-judul Mata Pelajaran & Kelas
      coverSlide.addText(`${meta.subject} • ${meta.grade}`, {
        x: 1.0, y: 4.2, w: 11.3, h: 0.8,
        fontSize: 18, color: '94A3B8', align: 'center'
      });

      // 2. SLIDE KONTEN BERGAMBAR (Slide 2 s/d Selesai)
      slides.forEach((s, idx) => {
        const slide = pptx.addSlide();
        slide.background = { color: 'F8FAFC' };

        // Banner Header Atas
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: 0, y: 0, w: '100%', h: 1.0,
          fill: { color: '0F172A' }, line: { color: '0F172A' }
        });

        slide.addText(`Slide ${s.slideNumber || (idx + 1)}: ${s.title || ''}`, {
          x: 0.8, y: 0.15, w: 11.5, h: 0.7,
          fontSize: 20, bold: true, color: 'FFFFFF'
        });

        // Konten Poin-poin Materi di Sisi Kiri
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

        // Sematkan Gambar Visual Slide di Sisi Kanan
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

        // Tambahkan Panduan Guru ke Catatan Slide (Notes)
        if (s.teacherNote) {
          slide.addNotes(`PANDUAN GURU:\n${s.teacherNote}\n\nIDE VISUAL:\n${s.visualIdea || '-'}`);
        }
      });

      // Unduh File
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

  // Fallback jika library gagal
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
    if (s.teacherNote) text += `[Panduan Guru]: ${s.teacherNote}\n`;
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
    const el = document.getElementById('loadingSubtitleText');
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
      if (e.message.includes('tidak valid')) throw e;
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

  // Cari array substring jika ada teks pengantar
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
      `Fokus Pembelajaran: Pemahaman konsep dan penerapan praktis.`
    ],
    teacherNote: "Sampaikan salam pembuka, tujuan pembelajaran, dan motivasi awal kepada siswa.",
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
        "Contoh penerapan nyata dalam kehidupan sehari-hari."
      ],
      teacherNote: "Ajak siswa berpartisipasi dengan mengajukan pertanyaan pemantik mengenai konsep ini.",
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
    teacherNote: "Beri apresiasi kepada seluruh siswa dan lakukan kuis refleksi singkat sebelum menutup kelas.",
    visualIdea: "Ilustrasi rangkuman peta konsep atau refleksi siswa dengan ikon bintang capaian belajar"
  });

  return slides;
}

/**
 * Pengatur Tampilan Mode UI Kartu Kanan
 * mode: 'empty' | 'loading' | 'outline' | 'media'
 */
function setUIMode(mode, options = {}) {
  const emptyState = document.getElementById('pptEmptyState');
  const loadingState = document.getElementById('pptLoadingState');
  const outlineContainer = document.getElementById('pptOutlineContainer');
  const mediaContainer = document.getElementById('pptMediaResultContainer');
  const badge = document.getElementById('cardRightBadge');
  const title = document.getElementById('cardRightTitle');
  const headerActions = document.getElementById('headerActionBtns');
  const btnGenerateOutline = document.getElementById('btnGenerate');

  // Reset
  if (emptyState) emptyState.style.display = 'none';
  if (loadingState) loadingState.classList.remove('active');
  if (outlineContainer) outlineContainer.classList.remove('active');
  if (mediaContainer) mediaContainer.classList.remove('active');
  if (headerActions) headerActions.style.display = 'none';

  if (mode === 'empty') {
    if (emptyState) emptyState.style.display = 'flex';
    if (badge) { badge.className = 'card-right-badge'; badge.textContent = 'Belum Ada Hasil'; }
    if (title) title.textContent = 'Hasil Media Presentasi';
    if (btnGenerateOutline) btnGenerateOutline.disabled = false;
  } else if (mode === 'loading') {
    if (loadingState) loadingState.classList.add('active');
    if (badge) { badge.className = 'card-right-badge badge-loading'; badge.textContent = 'Memproses...'; }
    const titleText = document.getElementById('loadingTitleText');
    const subText = document.getElementById('loadingSubtitleText');
    if (titleText && options.title) titleText.textContent = options.title;
    if (subText && options.sub) subText.textContent = options.sub;
    if (btnGenerateOutline) btnGenerateOutline.disabled = true;
  } else if (mode === 'outline') {
    if (outlineContainer) outlineContainer.classList.add('active');
    if (badge) { badge.className = 'card-right-badge badge-outline'; badge.textContent = 'Tahap 1: Edit Outline'; }
    if (title) title.textContent = 'Outline Slide Presentasi';
    if (btnGenerateOutline) btnGenerateOutline.disabled = false;
  } else if (mode === 'media') {
    if (mediaContainer) mediaContainer.classList.add('active');
    if (badge) { badge.className = 'card-right-badge badge-ready'; badge.textContent = 'Media Bergambar Siap'; }
    if (title) title.textContent = 'Media PPT Bergambar';
    if (headerActions) headerActions.style.display = 'flex';
    if (btnGenerateOutline) btnGenerateOutline.disabled = false;
  }
}

function showErrorState(errMsg) {
  setUIMode('empty');
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
