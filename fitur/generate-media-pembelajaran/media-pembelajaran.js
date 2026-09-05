/**
 * Edu Workspace - Generate Media Pembelajaran Logic
 * Integrasi Google Gemini API, Pengambilan Data Modul Ajar Pengguna, dan Render Pratinjau Interaktif
 */

let currentUser = null;
let userModulList = [];
let selectedFormat = 'slide';
let currentSourceMode = 'modul';
let lastGeneratedRawText = '';
let isGenerating = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Validasi Autentikasi Sesi Pengguna
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

  // 4. Periksa Status API Key Gemini Pengguna
  checkUserApiKeyStatus();

  // 5. Muat Daftar Modul Ajar Milik Pengguna
  await loadUserModuls();
});

/**
 * Mendapatkan Kunci Google Gemini API Aktif Pengguna
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
 * Cek dan Tampilkan Status Kunci API Gemini pada UI Kartu Kanan
 */
function checkUserApiKeyStatus() {
  const dot = document.getElementById('apiStatusDot');
  const title = document.getElementById('apiStatusTitle');
  const sub = document.getElementById('apiStatusSub');
  const btn = document.getElementById('btnManageKey');

  const key = getEffectiveApiKey();

  if (key && key.length >= 10) {
    if (dot) {
      dot.className = 'api-status-dot';
      dot.style.background = '#10b981';
    }
    if (title) title.textContent = 'API Key Gemini Terhubung';
    if (sub) {
      const masked = key.slice(0, 7) + '...' + key.slice(-4);
      sub.textContent = `Kunci aktif: ${masked}`;
    }
    if (btn) btn.textContent = 'Ubah Key';
  } else {
    if (dot) {
      dot.className = 'api-status-dot missing';
      dot.style.background = '#f59e0b';
    }
    if (title) title.textContent = 'API Key Belum Diatur';
    if (sub) sub.textContent = 'Wajib menambahkan kunci Gemini untuk generate AI';
    if (btn) {
      btn.textContent = '+ Atur Key';
      btn.style.background = '#fef3c7';
      btn.style.borderColor = '#fde68a';
      btn.style.color = '#b45309';
    }
  }
}

/**
 * Memuat Seluruh Modul Ajar Milik Pengguna dari LocalStorage & Supabase / Backend
 */
async function loadUserModuls() {
  if (!currentUser) return;
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const selectEl = document.getElementById('selectModulAjar');
  const countHint = document.getElementById('modulCountHint');

  let list = [];

  // 1. Ambil dari cache lokal
  try {
    const listKey = `edu_modul_list_${userEmail}`;
    const raw = localStorage.getItem(listKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch (e) {}

  // 2. Jika di Supabase tersedia, ambil data terbaru
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getModuls) {
    try {
      const remote = await SupabaseDB.getModuls(userEmail);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        // Gabungkan dengan prioritas data terbaru
        const map = new Map();
        list.forEach(m => { if (m.id) map.set(m.id, m); });
        remote.forEach(r => {
          const item = {
            id: r.id,
            namaModul: r.topic || r.subject || 'Modul Ajar',
            topic: r.topic || '',
            subject: r.subject || '',
            gradeLevel: r.grade_level || '',
            contentJson: r.content_json,
            payload: r.content_json
          };
          map.set(r.id, item);
        });
        list = Array.from(map.values());
      }
    } catch (e) {}
  }

  // 3. Fallback server lokal jika list masih kosong
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

  // Render opsi ke dropdown
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
      if (countHint) countHint.textContent = 'Belum ada modul tersimpan';
      const opt = document.createElement('option');
      opt.value = "";
      opt.disabled = true;
      opt.textContent = "(Belum ada Modul Ajar. Anda bisa pilih Isi Manual)";
      selectEl.appendChild(opt);
    }
  }
}

/**
 * Handle saat pengguna memilih Modul Ajar pada Dropdown
 */
function handleSelectModulChange(modulId) {
  const previewBox = document.getElementById('modulPreviewBox');
  const previewSubject = document.getElementById('previewSubject');
  const previewGrade = document.getElementById('previewGrade');
  const previewTitle = document.getElementById('previewTitle');
  const previewSummary = document.getElementById('previewSummary');
  const materiInput = document.getElementById('materiContentInput');

  if (!modulId) {
    if (previewBox) previewBox.classList.remove('active');
    return;
  }

  const modul = userModulList.find(m => m.id === modulId || String(m.id) === String(modulId));
  if (!modul) return;

  const p = modul.payload || modul.contentJson || {};

  const topic = modul.topic || p.topikMateri || modul.namaModul || p.namaModul || 'Topik Pembelajaran';
  const subject = modul.subject || p.mataPelajaran || 'Mata Pelajaran Umum';
  const grade = modul.gradeLevel || p.faseKelas || p.jenjangSekolah || 'Fase Pembelajaran';

  // Ekstrak ringkasan isi materi dari modul
  let summary = '';
  if (p.materiPembelajaran) summary += p.materiPembelajaran + '\n\n';
  if (p.tujuanPembelajaran) summary += `Tujuan Pembelajaran: ${p.tujuanPembelajaran}\n\n`;
  if (p.kataKunci) summary += `Konsep Kunci: ${p.kataKunci}\n\n`;

  if (!summary && Array.isArray(p.pengalamanBelajar)) {
    summary = p.pengalamanBelajar.map((pb, idx) => `Pertemuan ${idx + 1}: ${pb.fokus || pb.kegiatanInti || ''}`).join('\n');
  }

  if (!summary) {
    summary = `Materi pembelajaran ${subject} mengenai ${topic} untuk jenjang ${grade}.`;
  }

  if (previewSubject) previewSubject.textContent = subject;
  if (previewGrade) previewGrade.textContent = grade;
  if (previewTitle) previewTitle.textContent = topic;
  if (previewSummary) previewSummary.textContent = summary;
  if (previewBox) previewBox.classList.add('active');

  // Otomatis masukkan isi ringkasan ke textarea materi acuan AI
  if (materiInput) {
    materiInput.value = `[${subject} - ${grade}]\nTopik: ${topic}\n\nRincian Materi:\n${summary.trim()}`;
  }
}

/**
 * Alihkan Tab pada Kartu Kiri: Sumber Materi vs Hasil AI
 */
function switchLeftTab(tab) {
  const btnMateri = document.getElementById('tabBtnMateri');
  const btnHasil = document.getElementById('tabBtnHasil');
  const panelMateri = document.getElementById('panelSumberMateri');
  const panelHasil = document.getElementById('panelHasilGenerate');

  if (tab === 'materi') {
    if (btnMateri) btnMateri.classList.add('active');
    if (btnHasil) btnHasil.classList.remove('active');
    if (panelMateri) panelMateri.classList.add('active');
    if (panelHasil) panelHasil.classList.remove('active');
  } else {
    if (btnHasil) btnHasil.classList.add('active');
    if (btnMateri) btnMateri.classList.remove('active');
    if (panelHasil) panelHasil.classList.add('active');
    if (panelMateri) panelMateri.classList.remove('active');
  }
}

/**
 * Ganti Metode Pengisian Sumber Materi: Modul Ajar vs Manual
 */
function setSourceMode(mode) {
  currentSourceMode = mode;
  const optModul = document.getElementById('optSourceModul');
  const optManual = document.getElementById('optSourceManual');
  const secModul = document.getElementById('sectionModulAjar');
  const secManual = document.getElementById('sectionManual');

  if (mode === 'modul') {
    if (optModul) optModul.classList.add('active');
    if (optManual) optManual.classList.remove('active');
    if (secModul) secModul.style.display = 'block';
    if (secManual) secManual.style.display = 'none';
  } else {
    if (optManual) optManual.classList.add('active');
    if (optModul) optModul.classList.remove('active');
    if (secManual) secManual.style.display = 'block';
    if (secModul) secModul.style.display = 'none';

    // Update materi jika user mengisi form manual
    updateManualMateriInput();
  }
}

function updateManualMateriInput() {
  const subj = document.getElementById('manualSubject')?.value.trim() || '';
  const gr = document.getElementById('manualGrade')?.value.trim() || '';
  const top = document.getElementById('manualTopic')?.value.trim() || '';
  const input = document.getElementById('materiContentInput');

  if (input && !input.value.trim() && (subj || top)) {
    input.value = `[${subj || 'Mata Pelajaran'} - ${gr || 'Jenjang'}]\nTopik: ${top || 'Topik Materi'}\n\nRincian Materi:\n`;
  }
}

document.addEventListener('input', (e) => {
  if (['manualSubject', 'manualGrade', 'manualTopic'].includes(e.target.id)) {
    updateManualMateriInput();
  }
});

/**
 * Pemilihan Format Media Pembelajaran di Kartu Kanan
 */
function selectFormat(fmt) {
  selectedFormat = fmt;
  const map = {
    slide: 'btnFmtSlide',
    infografis: 'btnFmtInfografis',
    lkpd: 'btnFmtLkpd',
    flashcard: 'btnFmtFlashcard'
  };

  Object.keys(map).forEach(key => {
    const el = document.getElementById(map[key]);
    if (el) {
      if (key === fmt) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  const badge = document.getElementById('resultFormatBadge');
  if (badge) {
    const titles = {
      slide: 'Slide Presentasi',
      infografis: 'Infografis Konsep',
      lkpd: 'Lembar Aktivitas Siswa',
      flashcard: 'Flashcard & Kuis'
    };
    badge.textContent = titles[fmt] || 'Media Pembelajaran';
    badge.style.display = 'inline-block';
  }
}

/**
 * Tambahkan chip prompt ke textarea instruksi khusus
 */
function appendPromptChip(text) {
  const input = document.getElementById('customPromptInput');
  if (!input) return;
  const current = input.value.trim();
  if (current) {
    input.value = current + '. ' + text;
  } else {
    input.value = text;
  }
  input.focus();
}

/**
 * ==========================================================================
 * PROSES UTAMA: GENERATE MEDIA PEMBELAJARAN DENGAN GOOGLE GEMINI AI
 * ==========================================================================
 */
async function handleGenerateMedia() {
  if (isGenerating) return;

  // 1. Periksa Kunci API Gemini
  const apiKey = getEffectiveApiKey();
  if (!apiKey || apiKey.trim().length < 8) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Kunci API Gemini Belum Diatur",
        message: "Untuk menggunakan generator AI ini, Anda wajib memasukkan Kunci Google Gemini API pribadi Anda di menu Kelola Kunci API.",
        iconType: "warning",
        buttonText: "Buka Menu Kunci API",
        redirectUrl: "../../dashboard-pengguna/api-key.html"
      });
    } else {
      alert("Kunci API Gemini belum diatur. Silakan atur di menu Kunci API.");
    }
    return;
  }

  // 2. Periksa Materi Acuan
  const materiText = document.getElementById('materiContentInput')?.value.trim() || '';
  if (!materiText || materiText.length < 15) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Materi Pembelajaran Kosong",
        message: "Silakan pilih Modul Ajar tersimpan Anda atau ketikkan rincian materi di kolom sebelah kiri sebelum menekan tombol Generate.",
        iconType: "warning",
        buttonText: "Mengerti"
      });
    } else {
      alert("Silakan isi rincian materi terlebih dahulu di kartu sebelah kiri.");
    }
    switchLeftTab('materi');
    return;
  }

  // 3. Persiapkan Parameter dan UI State
  const customPrompt = document.getElementById('customPromptInput')?.value.trim() || '';
  const depth = document.getElementById('selectDepth')?.value || '5_slide';

  isGenerating = true;
  setGeneratingUiState(true);

  // Alihkan otomatis kartu kiri ke tab Hasil Generate AI
  switchLeftTab('hasil');

  // 4. Susun System & User Prompt Komprehensif
  const promptText = buildMediaGenerationPrompt({
    format: selectedFormat,
    depth: depth,
    materi: materiText,
    customPrompt: customPrompt
  });

  // 5. Panggil Google Gemini API (dengan rotasi model andal)
  try {
    const rawResult = await executeGeminiGeneration(apiKey, promptText);

    if (rawResult && rawResult.trim()) {
      lastGeneratedRawText = rawResult;
      renderAiMediaResult(rawResult, selectedFormat);
      updateHasilBadge('ready');
    } else {
      throw new Error("Respon AI kosong atau tidak dapat diuraikan.");
    }
  } catch (err) {
    console.error("[Generate Media Error]", err);
    showGenerationError(err.message || "Terjadi kendala saat menghubungi server Google Gemini AI.");
  } finally {
    isGenerating = false;
    setGeneratingUiState(false);
  }
}

/**
 * Format Instruksi Prompt Profesional untuk Google Gemini
 */
function buildMediaGenerationPrompt(options) {
  const { format, depth, materi, customPrompt } = options;

  let formatInstruction = '';

  if (format === 'slide') {
    formatInstruction = `
Format Hasil: RANCANGAN SLIDE PRESENTASI PEMBELAJARAN
Struktur yang WAJIB digunakan untuk setiap slide:
=== SLIDE [Nomor Slide]: [Judul Slide yang Menarik] ===
- POIN MATERI:
  * [Poin materi 1]
  * [Poin materi 2]
  * [Poin materi 3]
- NARASI GURU: [Teks apa yang harus diucapkan atau dijelaskan oleh guru saat slide ini tampil di depan kelas]
- REKOMENDASI VISUAL: [Saran gambar, ikon, atau ilustrasi grafis yang cocok untuk slide ini]
`;
  } else if (format === 'infografis') {
    formatInstruction = `
Format Hasil: RANCANGAN INFOGRAFIS & PETA KONSEP VISUAL
Struktur yang WAJIB digunakan:
=== BAGIAN 1: JUDUL UTAMA & PESAN SENTRAL ===
[Judul dan pesan inti pembelajaran yang mudah diingat]

=== BAGIAN 2: CABANG KONSEP POKOK & ALUR PEMIKIRAN ===
[Uraian poin konsep berurutan secara visual: Konsep 1 -> Konsep 2 -> Konsep 3]

=== BAGIAN 3: FAKTA KUNCI & CONTOH PENERAPAN ===
[Ringkasan fakta terpenting atau studi kasus nyata]

=== BAGIAN 4: TIPS MEMAHAMI & KESIMPULAN RINGKAS ===
[Catatan ringkas penutup untuk siswa]
`;
  } else if (format === 'lkpd') {
    formatInstruction = `
Format Hasil: LEMBAR AKTIVITAS PESERTA DIDIK (LKPD) INTERAKTIF
Struktur yang WAJIB digunakan:
=== BAGIAN 1: IDENTITAS & TUJUAN AKTIVITAS ===
[Tujuan kegiatan dan ringkasan stimulus materi]

=== BAGIAN 2: STIMULUS / KASUS PEMANTIK ===
[Cerita singkat, data, atau masalah kontekstual yang harus dipecahkan siswa]

=== BAGIAN 3: LANGKAH EKSPLORASI MANDIRI / KELOMPOK ===
[Instruksi langkah kerja terarah untuk peserta didik]

=== BAGIAN 4: PERTANYAAN ANALISIS & REFLEKSI ===
[3-5 soal penalaran kritis yang melatih pemahaman mendalam]
`;
  } else {
    formatInstruction = `
Format Hasil: FLASHCARD & KUIS TANYA JAWAB CEPAT
Struktur yang WAJIB digunakan untuk setiap kartu:
=== KARTU [Nomor Kartu]: [Topik / Konsep] ===
- DEPAN (PERTANYAAN / TANTANGAN): [Pertanyaan atau kasus singkat]
- BELAKANG (JAWABAN & PENJELASAN): [Kunci jawaban beserta penjelasan logis yang mudah dipahami]
- LEVEL: [Mudah / Sedang / Menantang]
`;
  }

  return `
Anda adalah Pakar Desain Instruksional dan Media Pembelajaran Interaktif Kurikulum Merdeka.
Tugas Anda adalah merancang Media Pembelajaran siap pakai yang menarik, efektif, dan bermakna berdasarkan materi acuan berikut:

--- MATERI ACUAN PEMBELAJARAN ---
${materi}

--- KETENTUAN DAN SPESIFIKASI MEDIA ---
Target Format: ${format.toUpperCase()}
Kedalaman / Panjang Target: ${depth}
${customPrompt ? `Instruksi Tambahan dari Pendidik: "${customPrompt}"` : ''}

${formatInstruction}

PANDUAN KUALITAS:
1. Gunakan Bahasa Indonesia baku namun komunikatif, ramah, dan memotivasi peserta didik.
2. Tuliskan konten yang konkret, aplikatif, dan tidak abstrak.
3. Pertahankan format penanda "=== SLIDE ... ===" atau "=== BAGIAN ... ===" atau "=== KARTU ... ===" agar dapat ditampilkan sebagai kartu visual yang rapi pada aplikasi.
`.trim();
}

/**
 * Panggil REST API Google Gemini dengan rotasi model resmi
 */
async function executeGeminiGeneration(apiKey, promptText) {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-flash-latest'
  ];

  const updateStep = (text) => {
    const el = document.getElementById('aiLoadingStepText');
    if (el) el.textContent = text;
  };

  let lastError = null;

  for (const model of models) {
    try {
      updateStep(`Menghubungkan ke AI (${model})...`);
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
        const output = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (output && output.trim()) {
          return output.trim();
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${response.status}`;
        if (msg.toLowerCase().includes('api key not valid') || response.status === 400 || response.status === 403) {
          throw new Error("Kunci Google Gemini API pada akun Anda tidak valid. Silakan periksa kembali di menu Kunci API.");
        }
        lastError = new Error(msg);
      }
    } catch (e) {
      if (e.message.includes('tidak valid')) throw e;
      lastError = e;
    }
  }

  throw lastError || new Error("Gagal menerima respons dari Gemini AI setelah beberapa percobaan.");
}

/**
 * Render Hasil AI ke Komponen Visual pada Kartu Kiri
 */
function renderAiMediaResult(rawText, format) {
  const emptyState = document.getElementById('aiEmptyState');
  const loadingState = document.getElementById('aiLoadingState');
  const renderedState = document.getElementById('aiContentRendered');
  const container = document.getElementById('slideCardsContainer');
  const rawBox = document.getElementById('rawOutputBox');
  const actionsBar = document.getElementById('resultActionsBar');
  const formatBadge = document.getElementById('resultFormatBadge');
  const headingText = document.getElementById('resultHeadingText');

  if (emptyState) emptyState.style.display = 'none';
  if (loadingState) loadingState.classList.remove('active');
  if (renderedState) renderedState.classList.add('active');
  if (actionsBar) actionsBar.style.display = 'flex';

  if (formatBadge) {
    const titles = {
      slide: 'Slide Presentasi',
      infografis: 'Infografis & Peta Konsep',
      lkpd: 'Lembar Aktivitas Siswa',
      flashcard: 'Flashcard & Kuis'
    };
    formatBadge.textContent = titles[format] || 'Media Pembelajaran';
    formatBadge.style.display = 'inline-block';
  }

  if (headingText) headingText.textContent = "Media Berhasil Dibuat";

  if (rawBox) rawBox.textContent = rawText;

  // Parsing berdasarkan penanda bagian "=== ... ==="
  const sections = rawText.split(/(?====\s*(?:SLIDE|BAGIAN|KARTU))/i).map(s => s.trim()).filter(Boolean);

  if (container) {
    container.innerHTML = '';

    if (sections.length > 0) {
      sections.forEach((sec, idx) => {
        const cardEl = createVisualSectionCard(sec, idx + 1);
        container.appendChild(cardEl);
      });
    } else {
      // Fallback jika AI tidak memunculkan separator standar
      const fallbackCard = document.createElement('div');
      fallbackCard.className = 'slide-card-item';
      fallbackCard.innerHTML = `
        <div class="slide-card-header">
          <span class="slide-badge-num">Dokumen Media</span>
          <h4 class="slide-card-title">Media Pembelajaran Siap Pakai</h4>
        </div>
        <div class="slide-card-body" style="white-space: pre-wrap;">
          ${escapeHtml(rawText)}
        </div>
      `;
      container.appendChild(fallbackCard);
    }
  }
}

/**
 * Buat kartu visual untuk tiap slide atau bagian
 */
function createVisualSectionCard(sectionText, index) {
  const card = document.createElement('div');
  card.className = 'slide-card-item';

  // Ekstrak judul header (misal: "=== SLIDE 1: Pengenalan Ekosistem ===")
  const headerMatch = sectionText.match(/^===\s*([^=]+)\s*===/);
  let titleText = `Bagian ${index}`;
  let contentBody = sectionText;

  if (headerMatch) {
    titleText = headerMatch[1].trim();
    contentBody = sectionText.replace(headerMatch[0], '').trim();
  }

  // Parse bagian narasi guru dan visual jika ada
  let teacherNote = '';
  let visualTip = '';
  let cleanPoints = [];

  const lines = contentBody.split('\n');
  let currentMode = 'points';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.match(/^(?:-\s*)?NARASI GURU\s*:/i)) {
      currentMode = 'teacher';
      teacherNote += trimmed.replace(/^(?:-\s*)?NARASI GURU\s*:/i, '').trim() + ' ';
    } else if (trimmed.match(/^(?:-\s*)?REKOMENDASI VISUAL\s*:/i)) {
      currentMode = 'visual';
      visualTip += trimmed.replace(/^(?:-\s*)?REKOMENDASI VISUAL\s*:/i, '').trim() + ' ';
    } else if (trimmed.match(/^(?:-\s*)?POIN MATERI\s*:/i)) {
      currentMode = 'points';
    } else {
      if (currentMode === 'teacher') {
        teacherNote += trimmed + ' ';
      } else if (currentMode === 'visual') {
        visualTip += trimmed + ' ';
      } else {
        cleanPoints.push(trimmed);
      }
    }
  });

  // Render HTML Kartu
  let pointsHtml = '';
  if (cleanPoints.length > 0) {
    pointsHtml = '<ul>' + cleanPoints.map(p => `<li>${escapeHtml(p.replace(/^[-*•]\s*/, ''))}</li>`).join('') + '</ul>';
  }

  let teacherHtml = '';
  if (teacherNote.trim()) {
    teacherHtml = `
      <div class="slide-teacher-note">
        <strong>🎙️ Panduan Narasi Pendidik:</strong>
        ${escapeHtml(teacherNote.trim())}
      </div>
    `;
  }

  let visualHtml = '';
  if (visualTip.trim()) {
    visualHtml = `
      <div class="slide-visual-tip">
        <strong>💡 Saran Visual & Tata Letak:</strong>
        ${escapeHtml(visualTip.trim())}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="slide-card-header">
      <span class="slide-badge-num">#${index}</span>
      <h4 class="slide-card-title">${escapeHtml(titleText)}</h4>
    </div>
    <div class="slide-card-body">
      ${pointsHtml || `<p style="white-space: pre-wrap;">${escapeHtml(contentBody)}</p>`}
    </div>
    ${teacherHtml}
    ${visualHtml}
  `;

  return card;
}

/**
 * Atur State Tampilan saat Sedang Memproses AI
 */
function setGeneratingUiState(loading) {
  const btn = document.getElementById('btnGenerateMedia');
  const btnText = document.getElementById('btnGenerateMediaText');
  const emptyState = document.getElementById('aiEmptyState');
  const loadingState = document.getElementById('aiLoadingState');
  const renderedState = document.getElementById('aiContentRendered');

  if (loading) {
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = 'Menyusun Media Pembelajaran...';
    if (emptyState) emptyState.style.display = 'none';
    if (renderedState) renderedState.classList.remove('active');
    if (loadingState) loadingState.classList.add('active');
    updateHasilBadge('loading');
  } else {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Generate Media Pembelajaran';
    if (loadingState) loadingState.classList.remove('active');
  }
}

function updateHasilBadge(status) {
  const badge = document.getElementById('badgeHasilStatus');
  if (!badge) return;
  if (status === 'ready') {
    badge.className = 'tab-badge badge-ready';
    badge.textContent = 'Tersedia';
  } else if (status === 'loading') {
    badge.className = 'tab-badge badge-loading';
    badge.textContent = 'Proses...';
  } else {
    badge.className = 'tab-badge';
    badge.textContent = 'Kosong';
  }
}

function showGenerationError(message) {
  const container = document.getElementById('slideCardsContainer');
  const renderedState = document.getElementById('aiContentRendered');
  if (renderedState) renderedState.classList.add('active');
  if (container) {
    container.innerHTML = `
      <div style="background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 16px; padding: 24px; text-align: center; color: #991b1b;">
        <svg style="margin: 0 auto 10px; display: block;" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4 style="font-size: 1.1rem; font-weight: 800; margin: 0 0 6px;">Gagal Membuat Media Pembelajaran</h4>
        <p style="font-size: 0.9rem; line-height: 1.5; margin: 0 0 16px;">${escapeHtml(message)}</p>
        <button type="button" class="btn-result-action" onclick="handleGenerateMedia()" style="margin: 0 auto; background: #ffffff; color: #dc2626; border-color: #fca5a5;">
          Coba Generate Lagi
        </button>
      </div>
    `;
  }
}

/**
 * Salin Teks Hasil AI ke Clipboard
 */
function copyAiResult() {
  if (!lastGeneratedRawText) return;
  navigator.clipboard.writeText(lastGeneratedRawText).then(() => {
    const btnText = document.getElementById('copyBtnText');
    if (btnText) {
      btnText.textContent = 'Tersalin!';
      setTimeout(() => { btnText.textContent = 'Salin Teks'; }, 2000);
    }
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Berhasil Disalin!",
        message: "Seluruh rancangan media pembelajaran berhasil disalin ke clipboard.",
        iconType: "success",
        buttonText: "Selesai"
      });
    }
  }).catch(() => {
    alert("Gagal menyalin teks secara otomatis.");
  });
}

/**
 * Unduh Teks Hasil Media Pembelajaran
 */
function downloadAiResult() {
  if (!lastGeneratedRawText) return;
  const topic = document.getElementById('manualTopic')?.value.trim() ||
                document.getElementById('previewTitle')?.textContent.trim() ||
                'Media_Pembelajaran';

  const filename = `${topic.replace(/[^a-zA-Z0-9_-]/g, '_')}_Media_AI.txt`;
  const blob = new Blob([lastGeneratedRawText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
