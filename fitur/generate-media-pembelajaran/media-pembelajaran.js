/**
 * Edu Workspace - Generate Media Pembelajaran (PowerPoint Generator) Logic
 * Menghasilkan Slide Presentasi PowerPoint (.pptx) Otomatis Berbasis Google Gemini AI
 */

let currentUser = null;
let userModulList = [];
let currentSourceTab = 'modul';
let selectedSlideCountMode = 'auto';
let currentGeneratedSlides = [];
let currentPresentationMeta = {
  subject: '',
  materi: '',
  grade: ''
};
let isGenerating = false;

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

  // C. Fallback backend lokal jika masih kosong
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
  const topic = modul.topic || p.topikMateri || modul.namaModul || p.namaModul || '';
  const grade = modul.gradeLevel || p.faseKelas || p.jenjangSekolah || '';

  // Ekstrak ringkasan isi materi dari modul ajar
  let materiDetail = topic;
  if (p.materiPembelajaran) {
    materiDetail += '\n' + p.materiPembelajaran;
  } else if (p.tujuanPembelajaran) {
    materiDetail += '\nTujuan: ' + p.tujuanPembelajaran;
  }

  // Isi ke input form
  const inputMapel = document.getElementById('inputMataPelajaran');
  const inputMateri = document.getElementById('inputMateri');
  const inputKelas = document.getElementById('inputKelas');

  if (inputMapel && mapel) inputMapel.value = mapel;
  if (inputMateri && materiDetail) inputMateri.value = materiDetail.trim();
  if (inputKelas && grade) inputKelas.value = grade;
}

/**
 * Pemilihan Jumlah Slide (Rekomendasi AI / 5 / 7 / 10 / Isi Sendiri)
 */
function selectSlideCount(mode) {
  selectedSlideCountMode = mode;
  const ids = ['btnSlideAuto', 'btnSlide5', 'btnSlide7', 'btnSlide10', 'btnSlideCustom'];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (
      (mode === 'auto' && id === 'btnSlideAuto') ||
      (mode === '5' && id === 'btnSlide5') ||
      (mode === '7' && id === 'btnSlide7') ||
      (mode === '10' && id === 'btnSlide10') ||
      (mode === 'custom' && id === 'btnSlideCustom')
    ) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  const customContainer = document.getElementById('customSlideContainer');
  if (customContainer) {
    customContainer.style.display = mode === 'custom' ? 'block' : 'none';
  }
}

/**
 * ==========================================================================
 * PROSES GENERATE POWERPOINT (AI)
 * ==========================================================================
 */
async function handleGenerate() {
  if (isGenerating) return;

  const mapel = document.getElementById('inputMataPelajaran')?.value.trim();
  const materi = document.getElementById('inputMateri')?.value.trim();
  const kelas = document.getElementById('inputKelas')?.value.trim();

  // Validasi Input Wajib
  if (!mapel || !materi || !kelas) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Kolom Belum Lengkap",
        message: "Mohon lengkapi kolom Mata Pelajaran, Materi, dan Kelas sebelum menekan tombol Generate.",
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
        message: "Untuk menghasilkan slide presentasi otomatis dengan AI, silakan masukkan Kunci Google Gemini API Anda terlebih dahulu di menu Kunci API.",
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
  if (selectedSlideCountMode === '5') targetSlideCount = 5;
  else if (selectedSlideCountMode === '7') targetSlideCount = 7;
  else if (selectedSlideCountMode === '10') targetSlideCount = 10;
  else if (selectedSlideCountMode === 'custom') {
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

  isGenerating = true;
  setLoadingState(true);

  // Susun Prompt Khusus Pembuatan Slide PowerPoint
  const promptText = `
Anda adalah Pakar Desain Media Presentasi PowerPoint Pembelajaran Edukasi Kurikulum Merdeka.
Tugas Anda adalah merancang ${targetSlideCount} slide presentasi PowerPoint (.pptx) yang profesional, menarik, terstruktur, dan siap diajarkan untuk:

- Mata Pelajaran: ${mapel}
- Kelas / Jenjang: ${kelas}
- Materi Pembelajaran:
${materi}

Spesifikasi Struktur:
- Slide 1: Judul Presentasi Pembelajaran, Nama Mata Pelajaran & Kelas, dan Sub-judul Pemantik.
- Slide 2 s/d ${targetSlideCount - 1}: Pembahasan konsep esensial, contoh nyata, aktivitas interaktif, dan visualisasi pemahaman.
- Slide ${targetSlideCount}: Kesimpulan & Refleksi / Kuis Ringkas Pemahaman.

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
    "visualIdea": "Rekomendasi visual, gambar, ikon, atau ilustrasi grafis untuk slide ini"
  }
]
`.trim();

  try {
    const aiResponse = await callGeminiApiForPpt(apiKey, promptText);

    let slidesData = parseSlideJsonResponse(aiResponse);

    if (!slidesData || slidesData.length === 0) {
      slidesData = createFallbackSlides(mapel, materi, kelas, targetSlideCount);
    }

    currentGeneratedSlides = slidesData;
    renderGeneratedSlides(slidesData, currentPresentationMeta);
  } catch (err) {
    console.error("[PowerPoint Generator Error]", err);
    showErrorState(err.message || "Gagal menghubungi server Google Gemini AI.");
  } finally {
    isGenerating = false;
    setLoadingState(false);
  }
}

/**
 * Panggil Google Gemini API
 */
async function callGeminiApiForPpt(apiKey, promptText) {
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
  // Hilangkan tag markdown code blocks jika ada
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  // Cari blok array [...]
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn("Gagal parse JSON langsung, mencoba ekstraksi regex...", e);
  }

  return null;
}

/**
 * Fallback jika respons AI bukan format JSON murni
 */
function createFallbackSlides(mapel, materi, kelas, count) {
  const slides = [];
  const lines = materi.split('\n').map(l => l.trim()).filter(Boolean);

  slides.push({
    slideNumber: 1,
    title: `Pengantar: ${lines[0] || 'Materi Pembelajaran'}`,
    points: [
      `Mata Pelajaran: ${mapel}`,
      `Jenjang / Kelas: ${kelas}`,
      `Fokus Pembelajaran: Memahami konsep esensial secara menyeluruh`
    ],
    teacherNote: `Sambut peserta didik dan sampaikan tujuan pembelajaran hari ini dengan antusias.`,
    visualIdea: `Ilustrasi cover bertema ${mapel} dengan tata letak minimalis dan judul besar.`
  });

  for (let i = 2; i < count; i++) {
    slides.push({
      slideNumber: i,
      title: `Konsep Inti Bagian ${i - 1}`,
      points: [
        `Uraian materi pokok bagian ${i - 1}`,
        `Contoh konkret dalam kehidupan sehari-hari`,
        `Diskusi pemantik untuk siswa`
      ],
      teacherNote: `Jelaskan poin-poin utama dan berikan kesempatan bertanya kepada siswa.`,
      visualIdea: `Diagram alur konsep atau bagan representasi materi.`
    });
  }

  slides.push({
    slideNumber: count,
    title: `Kesimpulan & Refleksi`,
    points: [
      `Rangkuman poin pembelajaran hari ini`,
      `Pertanyaan refleksi untuk menguji pemahaman`,
      `Tindak lanjut dan aktivitas mandiri`
    ],
    teacherNote: `Ajak siswa menyimpulkan apa yang telah dipelajari bersama.`,
    visualIdea: `Peta konsep ringkasan dengan ikon centang sukses.`
  });

  return slides;
}

/**
 * Render Daftar Slide Hasil Generate ke Kartu Kanan
 */
function renderGeneratedSlides(slides, meta) {
  const emptyState = document.getElementById('pptEmptyState');
  const loadingState = document.getElementById('pptLoadingState');
  const resultContainer = document.getElementById('pptResultContainer');
  const actionBtns = document.getElementById('headerActionBtns');
  const badge = document.getElementById('cardRightBadge');

  const summaryTopic = document.getElementById('summaryTopicTitle');
  const summaryMeta = document.getElementById('summaryMetaText');
  const summaryCount = document.getElementById('summarySlideCountBadge');
  const listContainer = document.getElementById('pptSlidesList');

  if (emptyState) emptyState.style.display = 'none';
  if (loadingState) loadingState.classList.remove('active');
  if (resultContainer) resultContainer.classList.add('active');
  if (actionBtns) actionBtns.style.display = 'flex';

  if (badge) {
    badge.className = 'card-right-badge badge-ready';
    badge.textContent = 'Slide Tersedia';
  }

  const topicName = meta.materi.split('\n')[0] || meta.subject;
  if (summaryTopic) summaryTopic.textContent = topicName;
  if (summaryMeta) summaryMeta.textContent = `${meta.subject} • ${meta.grade}`;
  if (summaryCount) summaryCount.textContent = `${slides.length} Slide`;

  if (listContainer) {
    listContainer.innerHTML = '';
    slides.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'ppt-slide-card';

      const pointsHtml = (s.points || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');

      card.innerHTML = `
        <div class="ppt-slide-top">
          <span class="ppt-slide-number">Slide ${s.slideNumber || (idx + 1)}</span>
          <h4 class="ppt-slide-title">${escapeHtml(s.title || `Slide ${idx + 1}`)}</h4>
        </div>

        <div class="ppt-slide-content">
          <ul>${pointsHtml}</ul>
        </div>

        ${s.teacherNote ? `
          <div class="ppt-speaker-notes">
            <strong>🎙️ Panduan Narasi Pendidik:</strong>
            ${escapeHtml(s.teacherNote)}
          </div>
        ` : ''}

        ${s.visualIdea ? `
          <div class="ppt-visual-idea">
            <strong>💡 Saran Visual & Desain Slide:</strong>
            ${escapeHtml(s.visualIdea)}
          </div>
        ` : ''}
      `;

      listContainer.appendChild(card);
    });
  }
}

/**
 * Atur State Loading pada UI Kartu Kanan
 */
function setLoadingState(isLoading) {
  const btn = document.getElementById('btnGenerate');
  const btnText = document.getElementById('btnGenerateText');
  const emptyState = document.getElementById('pptEmptyState');
  const loadingState = document.getElementById('pptLoadingState');
  const resultContainer = document.getElementById('pptResultContainer');
  const badge = document.getElementById('cardRightBadge');

  if (isLoading) {
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Sedang Menyusun Slide...';
    if (emptyState) emptyState.style.display = 'none';
    if (resultContainer) resultContainer.classList.remove('active');
    if (loadingState) loadingState.classList.add('active');
    if (badge) {
      badge.className = 'card-right-badge badge-loading';
      badge.textContent = 'Memproses AI...';
    }
  } else {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Generate PowerPoint';
    if (loadingState) loadingState.classList.remove('active');
  }
}

function showErrorState(errMsg) {
  const emptyState = document.getElementById('pptEmptyState');
  const loadingState = document.getElementById('pptLoadingState');
  const resultContainer = document.getElementById('pptResultContainer');
  const listContainer = document.getElementById('pptSlidesList');

  if (loadingState) loadingState.classList.remove('active');
  if (emptyState) emptyState.style.display = 'none';
  if (resultContainer) resultContainer.classList.add('active');

  if (listContainer) {
    listContainer.innerHTML = `
      <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 16px; padding: 28px; text-align: center; color: #991b1b;">
        <svg style="margin: 0 auto 12px; display: block;" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 6px;">Gagal Menghasilkan Slide PowerPoint</h4>
        <p style="font-size: 0.92rem; line-height: 1.5; margin: 0 0 16px;">${escapeHtml(errMsg)}</p>
        <button type="button" class="btn-secondary-action" onclick="handleGenerate()" style="margin: 0 auto; background: #ffffff; color: #dc2626; border-color: #fca5a5;">
          Coba Generate Lagi
        </button>
      </div>
    `;
  }
}

/**
 * ==========================================================================
 * UNDUH FILE POWERPOINT (.PPTX) ASLI MENGGUNAKAN PPTXGENJS
 * ==========================================================================
 */
function downloadPowerPointFile() {
  if (!currentGeneratedSlides || currentGeneratedSlides.length === 0) return;

  const meta = currentPresentationMeta;
  const topicTitle = meta.materi.split('\n')[0] || meta.subject || 'Presentasi';
  const safeFilename = `${topicTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_EduWorkspace.pptx`;

  // Cek apakah library PptxGenJS tersedia
  if (typeof PptxGenJS !== 'undefined') {
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // 1. SLIDE COVER (Slide 1)
      const coverSlide = pptx.addSlide();
      coverSlide.background = { color: '0F172A' }; // Dark Slate

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

      // 2. SLIDE KONTEN (Slide 2 s/d Selesai)
      currentGeneratedSlides.forEach((s, idx) => {
        const slide = pptx.addSlide();
        slide.background = { color: 'F8FAFC' };

        // Banner Header Atas
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: 0, y: 0, w: '100%', h: 1.1,
          fill: { color: '1E293B' }, line: { color: '1E293B' }
        });

        slide.addText(`Slide ${s.slideNumber || (idx + 1)}: ${s.title || ''}`, {
          x: 0.8, y: 0.2, w: 11.5, h: 0.7,
          fontSize: 20, bold: true, color: 'FFFFFF'
        });

        // Konten Poin-poin Materi di Sisi Kiri
        const bulletObjects = (s.points || []).map(pt => ({
          text: pt,
          options: { bullet: true, fontSize: 15, color: '334155', breakLine: true }
        }));

        if (bulletObjects.length > 0) {
          slide.addText(bulletObjects, {
            x: 0.8, y: 1.5, w: 7.2, h: 4.5,
            lineSpacing: 26, valign: 'top'
          });
        }

        // Box Catatan Pendidik di Sisi Kanan
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
          x: 8.4, y: 1.5, w: 4.2, h: 4.6,
          fill: { color: 'EFF6FF' }, line: { color: 'BFDBFE', width: 1.5 }
        });

        const notesText = [
          { text: 'PANDUAN PENDIDIK:\n', options: { bold: true, fontSize: 12, color: '1E40AF' } },
          { text: (s.teacherNote || '') + '\n\n', options: { fontSize: 11, color: '1E3A8A' } },
          { text: 'SARAN VISUAL:\n', options: { bold: true, fontSize: 11, color: '854D0E' } },
          { text: s.visualIdea || '-', options: { fontSize: 11, color: '713F12' } }
        ];

        slide.addText(notesText, {
          x: 8.6, y: 1.7, w: 3.8, h: 4.2,
          valign: 'top', breakLine: true
        });
      });

      // Simpan file .pptx ke perangkat pengguna
      pptx.writeFile({ fileName: safeFilename });

      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "File PowerPoint Diunduh!",
          message: `File presentasi PowerPoint '${safeFilename}' berhasil dibuat dan tersimpan di perangkat Anda.`,
          iconType: "success",
          buttonText: "Selesai"
        });
      }
      return;
    } catch (e) {
      console.warn("PptxGenJS gagal, beralih ke format teks outline:", e);
    }
  }

  // Fallback: Unduh file outline teks jika PptxGenJS tidak termuat
  downloadTextOutline(safeFilename.replace('.pptx', '_Outline.txt'));
}

/**
 * Fallback Unduh Outline Teks
 */
function downloadTextOutline(filename) {
  let text = `RANCANGAN SLIDE PRESENTASI POWERPOINT - EDU WORKSPACE\n`;
  text += `Mata Pelajaran: ${currentPresentationMeta.subject}\n`;
  text += `Kelas: ${currentPresentationMeta.grade}\n\n`;

  currentGeneratedSlides.forEach((s, idx) => {
    text += `=====================================================\n`;
    text += `SLIDE ${s.slideNumber || (idx + 1)}: ${s.title}\n`;
    text += `=====================================================\n`;
    (s.points || []).forEach(p => { text += `• ${p}\n`; });
    if (s.teacherNote) text += `\n[Narasi Guru]: ${s.teacherNote}\n`;
    if (s.visualIdea) text += `[Saran Visual]: ${s.visualIdea}\n`;
    text += `\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Salin Semua Teks Slide ke Clipboard
 */
function copySlideContent() {
  if (!currentGeneratedSlides || currentGeneratedSlides.length === 0) return;

  let text = `SLIDE PRESENTASI POWERPOINT: ${currentPresentationMeta.subject} (${currentPresentationMeta.grade})\n\n`;
  currentGeneratedSlides.forEach((s, idx) => {
    text += `[Slide ${s.slideNumber || (idx + 1)}]: ${s.title}\n`;
    (s.points || []).forEach(p => { text += `- ${p}\n`; });
    if (s.teacherNote) text += `Panduan Guru: ${s.teacherNote}\n`;
    text += `\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const lbl = document.getElementById('copyBtnLabel');
    if (lbl) {
      lbl.textContent = 'Tersalin!';
      setTimeout(() => { lbl.textContent = 'Salin Teks'; }, 2000);
    }
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Teks Slide Tersalin!",
        message: "Seluruh rancangan teks slide presentasi berhasil disalin ke clipboard.",
        iconType: "success",
        buttonText: "Selesai"
      });
    }
  }).catch(() => {
    alert("Gagal menyalin teks slide.");
  });
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
