/**
 * EDU WORKSPACE - MODUL AJAR FITUR JAVASCRIPT
 * Form Isian Parameter Modul Ajar Kurikulum Merdeka
 */

function getCurrentUser() {
  try {
    const str = localStorage.getItem(CURRENT_USER_KEY);
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
}

function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[LocalStorage] Kuota penuh saat menyimpan "${key}", melakukan pembersihan cache riwayat lama...`, e);
    try {
      const user = getCurrentUser();
      const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : '';
      if (userEmail) {
        const listKey = `edu_modul_list_${userEmail}`;
        const rawList = localStorage.getItem(listKey);
        if (rawList) {
          try {
            let list = JSON.parse(rawList);
            if (Array.isArray(list) && list.length > 5) {
              list = list.slice(0, 5); // simpan 5 terbaru saja di local storage
              localStorage.setItem(listKey, JSON.stringify(list));
            }
          } catch (eList) {}
        }
      }
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.warn(`[LocalStorage] Tetap tidak dapat menyimpan "${key}":`, e2);
      return false;
    }
  }
}

let currentEditingModulId = null;
let currentEditingOriginalCreatedAt = null;
let notifAutoCloseTimer = null;

function showNotificationModal(title, msg, type = 'success') {
  const modal = document.getElementById('notificationModal');
  const titleEl = document.getElementById('notifTitle');
  const descEl = document.getElementById('notifDesc');
  const iconBox = document.getElementById('notifIconBox');
  const iconContent = document.getElementById('notifIconContent');

  if (!modal || !titleEl || !descEl) return;

  titleEl.textContent = title;
  descEl.textContent = msg;

  if (iconBox && iconContent) {
    iconBox.className = 'confirm-icon-box';
    if (type === 'success') {
      iconBox.classList.add('icon-box-success');
      iconContent.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'error') {
      iconBox.classList.add('icon-box-error');
      iconContent.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    } else if (type === 'warning') {
      iconBox.classList.add('icon-box-warning');
      iconContent.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `;
    } else {
      iconBox.classList.add('icon-box-info');
      iconContent.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
    }
  }

  modal.classList.add('active');

  // Hentikan timer auto-close sebelumnya agar modal tidak menutup sendiri
  if (notifAutoCloseTimer) {
    clearTimeout(notifAutoCloseTimer);
    notifAutoCloseTimer = null;
  }

  // Notifikasi error dan warning TIDAK MENUTUP SENDIRI, pengguna harus membaca dan klik 'Mengerti'
  if (type === 'success') {
    notifAutoCloseTimer = setTimeout(() => {
      closeNotificationModal();
    }, 5000);
  }
}

function closeNotificationModal() {
  if (notifAutoCloseTimer) clearTimeout(notifAutoCloseTimer);
  const modal = document.getElementById('notificationModal');
  if (modal) modal.classList.remove('active');
}

function closeNotificationModalOnOverlay(e) {
  if (e.target && e.target.id === 'notificationModal') {
    closeNotificationModal();
  }
}

// State untuk melacak apakah tombol Generate Modul Ajar telah diklik pada sesi saat ini
let modulGeneratedInThisSession = false;

// Pemetaan Pilihan Kelas & Fase Berdasarkan Jenjang Sekolah
const FASE_KELAS_OPTIONS = {
  'SD / MI': [
    { value: 'Fase A (Kelas 1 SD/MI)', text: 'Fase A (Kelas 1 SD/MI)' },
    { value: 'Fase A (Kelas 2 SD/MI)', text: 'Fase A (Kelas 2 SD/MI)' },
    { value: 'Fase B (Kelas 3 SD/MI)', text: 'Fase B (Kelas 3 SD/MI)' },
    { value: 'Fase B (Kelas 4 SD/MI)', text: 'Fase B (Kelas 4 SD/MI)' },
    { value: 'Fase C (Kelas 5 SD/MI)', text: 'Fase C (Kelas 5 SD/MI)' },
    { value: 'Fase C (Kelas 6 SD/MI)', text: 'Fase C (Kelas 6 SD/MI)' }
  ],
  'SMP / MTs': [
    { value: 'Fase D (Kelas 7 SMP/MTs)', text: 'Fase D (Kelas 7 SMP/MTs)' },
    { value: 'Fase D (Kelas 8 SMP/MTs)', text: 'Fase D (Kelas 8 SMP/MTs)' },
    { value: 'Fase D (Kelas 9 SMP/MTs)', text: 'Fase D (Kelas 9 SMP/MTs)' }
  ],
  'SMA / MA': [
    { value: 'Fase E (Kelas 10 SMA/MA)', text: 'Fase E (Kelas 10 SMA/MA)' },
    { value: 'Fase F (Kelas 11 SMA/MA)', text: 'Fase F (Kelas 11 SMA/MA)' },
    { value: 'Fase F (Kelas 12 SMA/MA)', text: 'Fase F (Kelas 12 SMA/MA)' }
  ],
  'SMK / MAK': [
    { value: 'Fase E (Kelas 10 SMK/MAK)', text: 'Fase E (Kelas 10 SMK/MAK)' },
    { value: 'Fase F (Kelas 11 SMK/MAK)', text: 'Fase F (Kelas 11 SMK/MAK)' },
    { value: 'Fase F (Kelas 12 SMK/MAK)', text: 'Fase F (Kelas 12 SMK/MAK)' }
  ]
};

function handleJenjangChange() {
  const jenjangSelect = document.getElementById('jenjangSekolah');
  const jurusanInput = document.getElementById('jurusanSekolah');
  const faseSelect = document.getElementById('faseKelas');

  if (!jenjangSelect) return;
  const jenjang = jenjangSelect.value;

  // Atur Jurusan: Selain SMK isi Reguler
  if (jurusanInput) {
    if (jenjang === 'SMK / MAK') {
      if (jurusanInput.value === 'Reguler') {
        jurusanInput.value = '';
      }
      jurusanInput.placeholder = 'Contoh: Rekayasa Perangkat Lunak, TKJ, Akuntansi';
    } else {
      jurusanInput.value = 'Reguler';
      jurusanInput.placeholder = 'Reguler';
    }
  }

  // Isi Opsi Kelas / Fase Sesuai Jenjang
  if (faseSelect) {
    const prevVal = faseSelect.value;
    faseSelect.innerHTML = '<option value="" disabled selected>Pilih Kelas / Fase...</option>';
    const options = FASE_KELAS_OPTIONS[jenjang] || [];
    let matchFound = false;

    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.text;
      if (opt.value === prevVal) {
        el.selected = true;
        matchFound = true;
      }
      faseSelect.appendChild(el);
    });

    if (!matchFound && options.length > 0) {
      faseSelect.value = options[0].value;
    }
  }
}

// Toggle Input Manual Model Pembelajaran
function toggleManualModel(selectEl) {
  const wrapper = document.getElementById('wrapperModelManual');
  const input = document.getElementById('inputModelManual');
  if (wrapper) {
    if (selectEl.value === 'Input Manual') {
      wrapper.style.display = 'block';
      if (input) input.focus();
    } else {
      wrapper.style.display = 'none';
      if (input) input.value = '';
    }
  }
}

// Toggle Input Manual Pendekatan Pembelajaran
function toggleManualPendekatan(selectEl) {
  const wrapper = document.getElementById('wrapperPendekatanManual');
  const input = document.getElementById('inputPendekatanManual');
  if (wrapper) {
    if (selectEl.value === 'Input Manual') {
      wrapper.style.display = 'block';
      if (input) input.focus();
    } else {
      wrapper.style.display = 'none';
      if (input) input.value = '';
    }
  }
}

// Handler Perubahan Jenis Input di Tahap 2 (Pilihan: Topik dan Materi)
function handleJenisInputChange() {
  const select = document.getElementById('jenisInputKonteks');
  const label = document.getElementById('labelIsiTopik');
  const input = document.getElementById('isiTopikMateri');
  if (!select || !label || !input) return;

  if (select.value === 'Materi') {
    label.innerHTML = 'Isi Materi <span class="required">*</span>';
    input.placeholder = 'Ketik materi pembelajaran...';
  } else {
    label.innerHTML = 'Isi Topik <span class="required">*</span>';
    input.placeholder = 'Ketik topik pembelajaran...';
  }
}

// Helper: Dapatkan Kunci Google Gemini API Pengguna Aktif
function getEffectiveApiKey() {
  try {
    const user = getCurrentUser();
    if (user) {
      if (user.geminiApiKey && user.geminiApiKey.trim()) return user.geminiApiKey.trim();
      if (user.apiKey && user.apiKey.trim()) return user.apiKey.trim();
      if (user.email) {
        const key = localStorage.getItem(`edu_api_key_${user.email}`);
        if (key && key.trim()) return key.trim();
      }
    }
    return localStorage.getItem('edu_gemini_api_key') || '';
  } catch (e) {
    return '';
  }
}

// Ekstrak konteks pembelajaran lengkap dari isian sebelumnya (Tahap 1 & C)
function getLearningContext() {
  const penyusun = document.getElementById('namaPenyusun')?.value.trim() || '';
  const institusi = document.getElementById('institusiPendidik')?.value.trim() || '';
  const tahun = document.getElementById('tahunPenyusunan')?.value.trim() || '';
  const jenjang = document.getElementById('jenjangSekolah')?.value || 'SMA / MA';
  const jurusan = document.getElementById('jurusanSekolah')?.value.trim() || 'Reguler';
  const fase = document.getElementById('faseKelas')?.value || 'Fase E';
  const mapel = document.getElementById('mataPelajaran')?.value.trim() || '';
  const elemenCP = document.getElementById('elemenCP')?.value.trim() || '';

  const jenisInput = document.getElementById('jenisInputKonteks')?.value || 'Topik';
  const topik = document.getElementById('isiTopikMateri')?.value.trim() || '';

  let model = document.getElementById('modelPembelajaran')?.value || 'PBL (Problem Based)';
  if (model === 'Input Manual') {
    model = document.getElementById('inputModelManual')?.value.trim() || 'Model Pembelajaran Mandiri';
  }

  let pendekatan = document.getElementById('pendekatanPembelajaran')?.value || 'Deep Learning';
  if (pendekatan === 'Input Manual') {
    pendekatan = document.getElementById('inputPendekatanManual')?.value.trim() || 'Pendekatan Kontekstual';
  }

  const metodeList = Array.from(document.querySelectorAll('input[name="metodePembelajaran"]:checked')).map(cb => cb.value).join(', ');
  const fasilitasList = getSelectedFasilitasList().join('; ');
  const pertemuanNum = document.getElementById('jumlahPertemuan')?.value.trim() || '4';
  const pertemuan = pertemuanNum ? `${pertemuanNum} Pertemuan` : '4 Pertemuan';
  const durasi = document.getElementById('totalJPDurasi')?.value.trim() || `4 JP x 45 Menit (${pertemuan})`;
  const isRingkasCP = document.getElementById('ceklisRingkasCP')?.checked || false;

  return { penyusun, institusi, tahun, jenjang, jurusan, fase, mapel, elemenCP, jenisInput, topik, model, pendekatan, metodeList, fasilitasList, pertemuan, durasi, isRingkasCP };
}

let _cachedGeminiModels = null;
let _cachedGeminiModelsTime = 0;
let _cachedGeminiApiKey = '';

// Helper: Dapatkan model aktif dari Google Generative Language API untuk API Key akun ini
async function getAvailableGeminiModels(apiKey) {
  if (_cachedGeminiModels && _cachedGeminiApiKey === apiKey && (Date.now() - _cachedGeminiModelsTime < 600000)) {
    return _cachedGeminiModels;
  }
  for (const ver of ['v1beta', 'v1']) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models`, {
        signal: controller.signal,
        headers: {
          'x-goog-api-key': apiKey
        }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          const supported = data.models
            .filter(m => {
              if (!Array.isArray(m.supportedGenerationMethods) || !m.supportedGenerationMethods.includes('generateContent')) return false;
              const name = (m.name || '').toLowerCase();
              // FILTER KETAT: DILARANG model audio/TTS, embedding, image, atau preview TTS!
              if (name.includes('tts') || name.includes('audio') || name.includes('embed') || name.includes('imagen') || name.includes('realtime')) {
                return false;
              }
              return true;
            })
            .map(m => ({
              version: ver,
              rawName: m.name.replace(/^models\//, '')
            }));
          if (supported.length > 0) {
            _cachedGeminiModels = supported;
            _cachedGeminiModelsTime = Date.now();
            _cachedGeminiApiKey = apiKey;
            return supported;
          }
        }
      } else if (res.status === 401 || res.status === 403) {
        // Kunci API ditolak oleh Google (UNAUTHENTICATED / ACCESS_TOKEN_TYPE_UNSUPPORTED)
        console.warn(`[Gemini API] Kunci ditolak Google (${res.status}), batalkan loop pengecekan.`);
        return [];
      }
    } catch (e) {
      console.warn(`[Gemini API] Check on ${ver} failed:`, e);
    }
  }
  return [];
}

// Bersihkan teks dari simbol markdown bold / asterisks agar teks bersih dan rapi
function cleanAiText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

// Hapus kalimat pengantar/pembuka pada Tujuan Pembelajaran (mulai langsung dari nomor 1.)
function cleanTujuanPembelajaran(text) {
  if (!text) return '';
  let cleaned = cleanAiText(text);

  // Jika ada nomor "1." atau "1)", mulai tepat dari nomor tersebut
  const matchNum = cleaned.match(/(?:^|\n)\s*(1[\.\)]\s*[\s\S]*)/);
  if (matchNum && matchNum[1]) {
    cleaned = matchNum[1].trim();
  } else {
    // Hapus baris pembuka umum seperti "Berikut adalah..."
    cleaned = cleaned.replace(/^.*?(?:berikut adalah|berikut ini|tujuan pembelajaran|tentu).*?:\s*\n*/i, '').trim();
  }
  return cleaned;
}

// Hapus judul / kalimat pembuka pada Materi Tambahan dan pastikan ringkas deskriptif
function cleanMateriTambahan(text) {
  if (!text) return '';
  let cleaned = cleanAiText(text);

  let lines = cleaned.split('\n');
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    // Hapus judul pembuka jika model menyertakannya
    if (/^(?:ringkasan materi|materi tambahan|berikut adalah|berikut ini|pengayaan kontekstual)/i.test(trimmed)) {
      return false;
    }
    return true;
  });
  return lines.join('\n').trim();
}

// Bersihkan dan format Capaian Pembelajaran agar murni 1 paragraf utuh tanpa kata "Selain itu"
function cleanCapaianPembelajaran(text) {
  if (!text) return '';
  let cleaned = cleanAiText(text);

  // Hapus jika ada kata pengantar pembuka
  cleaned = cleaned.replace(/^.*?(?:berikut adalah|berikut ini|capaian pembelajaran|tentu).*?:\s*\n*/i, '').trim();

  // Jika ada paragraf kedua, potong agar hanya 1 paragraf murni
  if (cleaned.includes('\n\n')) {
    const parts = cleaned.split(/\n\n+/);
    cleaned = parts[0].trim();
  } else if (cleaned.includes('\n')) {
    const parts = cleaned.split('\n');
    cleaned = parts[0].trim();
  }

  // Hilangkan kalimat yang mengandung atau diawali "Selain itu"
  cleaned = cleaned.replace(/\s*Selain itu,?\s*[^.]*\.?/gi, '').trim();

  // Pastikan diakhiri dengan titik
  if (cleaned && !cleaned.endsWith('.')) {
    const lastDot = cleaned.lastIndexOf('.');
    if (lastDot > 40) {
      cleaned = cleaned.substring(0, lastDot + 1);
    } else {
      cleaned += '.';
    }
  }

  return cleaned;
}

// Bersihkan dan format Elemen Capaian Pembelajaran menjadi deretan elemen terpisah titik koma (;)
function cleanElemenCP(text) {
  if (!text) return '';
  let cleaned = cleanAiText(text);

  // Hapus kata pengantar seperti "Berikut adalah elemen CP...", "Elemen Capaian Pembelajaran:", dll.
  cleaned = cleaned.replace(/^.*?(?:berikut adalah|berikut ini|elemen capaian pembelajaran|elemen cp|tentu).*?:\s*\n*/i, '').trim();

  // Jika dipisahkan oleh baris baru atau nomor/bullet, ubah jadi titik koma
  if (cleaned.includes('\n')) {
    const items = cleaned.split('\n')
      .map(line => line.replace(/^[\d+.\-\*\•\–\—\)\s]+/, '').trim())
      .filter(line => line && !/^(?:catatan|keterangan|sumber)/i.test(line));
    cleaned = items.join('; ');
  }

  // Standarisasi titik koma
  cleaned = cleaned.replace(/;\s*/g, '; ');
  // Hapus tanda baca titik atau titik koma di akhir teks
  cleaned = cleaned.replace(/[;.\s]+$/, '').trim();
  return cleaned;
}

// Rekomendasi standar Elemen CP Kurikulum Merdeka BSKAP Kemendikbudristek sesuai Mata Pelajaran, Jenjang, dan Kelas/Fase
function getElemenCPFallback(mapel, jenjang, fase, jurusan) {
  const m = (mapel || '').toLowerCase().trim();
  const f = (fase || '').toUpperCase();
  const j = (jenjang || '').toUpperCase();
  
  // IPAS (Ilmu Pengetahuan Alam dan Sosial)
  if (m.includes('ipas') || m.includes('ilmu pengetahuan alam dan sosial')) {
    if (f.includes('E') || f.includes('F') || j.includes('SMK')) {
      return 'Makhluk Hidup dan Lingkungannya; Zat dan Perubahannya; Energi dan Perubahannya; Bumi dan Antariksa; Keruangan dan Konektivitas Antarruang dan Waktu; Pengaruh Interaksi Sosial dan Dinamika Sosial; Perilaku Ekonomi dan Kesejahteraan; Keterampilan Proses';
    }
    return 'Pemahaman IPAS (Sains dan Sosial); Mengamati dan Menyelidiki Fenomena; Memprediksi dan Merencanakan Inkuiri; Memproses dan Menganalisis Data; Mengevaluasi dan Refleksi; Mengomunikasikan Hasil';
  }
  if (m.includes('biologi')) {
    return 'Keanekaragaman Hayati dan Interaksi Ekosistem; Struktur dan Fungsi Sel dan Jaringan; Genetika dan Pewarisan Sifat; Bioteknologi Kontekstual; Ekologi dan Pelestarian Lingkungan; Keterampilan Proses Penyelidikan Ilmiah';
  }
  if (m.includes('fisika')) {
    return 'Pengukuran dan Besaran Fisis; Mekanika dan Kinematika Gerak; Usaha, Energi, dan Daya; Termodinamika dan Kalor; Gelombang, Bunyi, dan Optik; Listrik, Magnet, dan Energi Terbarukan; Keterampilan Proses Investigasi';
  }
  if (m.includes('kimia')) {
    return 'Struktur Atom dan Tabel Periodik; Ikatan Kimia dan Bentuk Molekul; Stoikiometri dan Reaksi Kimia; Termokimia dan Kinetika; Larutan, Asam-Basa, dan Kesetimbangan; Keterampilan Proses Laboratorium';
  }
  if (m.includes('ipa') || m.includes('sains')) {
    return 'Hakikat Sains dan Metode Ilmiah; Zat dan Perubahannya; Energi dan Daya Lingkungan; Makhluk Hidup dan Ekosistem; Bumi dan Antariksa; Keterampilan Proses Investigasi';
  }
  if (m.includes('indonesia')) {
    return 'Menyimak; Membaca dan Memirsa; Berbicara dan Mempresentasikan; Menulis; Apresiasi dan Kreasi Kebahasaan';
  }
  if (m.includes('inggris') || m.includes('english')) {
    return 'Menyimak (Listening); Berbicara (Speaking); Membaca (Reading); Memirsa (Viewing); Menulis (Writing); Mempresentasikan (Presenting)';
  }
  if (m.includes('matematika') || m.includes('math')) {
    if (jenjang && jenjang.includes('SD')) {
      return 'Bilangan; Aljabar; Pengukuran; Geometri; Analisis Data dan Peluang; Penalaran Matematis';
    }
    return 'Bilangan; Aljabar; Pengukuran dan Geometri; Analisis Data dan Peluang; Kalkulus dan Pemodelan; Penalaran dan Pemecahan Masalah';
  }
  if (m.includes('ips') || m.includes('sosial')) {
    return 'Pemahaman Keruangan dan Lingkungan; Interaksi Sosial dan Dinamika Budaya; Kegiatan Ekonomi dan Kesejahteraan; Dinamika Perubahan Sosial dan Sejarah; Keterampilan Proses Inkuiri Sosial';
  }
  if (m.includes('sejarah')) {
    return 'Pengantar dan Konsep Dasar Sejarah; Peradaban Kuno dan Kerajaan Nusantara; Kolonialisme dan Pergerakan Nasional; Kemerdekaan dan Dinamika Kontemporer; Keterampilan Penelitian dan Historiografi';
  }
  if (m.includes('geografi')) {
    return 'Keterampilan Geografis dan Pemetaan; Dinamika Litosfer dan Pedosfer; Dinamika Atmosfer dan Hidrosfer; Antroposfer dan Kependudukan; Lingkungan Hidup dan Pembangunan Berkelanjutan; Analisis Keruangan Terpadu';
  }
  if (m.includes('ekonomi')) {
    return 'Kelangkaan dan Kebutuhan Manusia; Sistem Ekonomi dan Mekanisme Pasar; Uang, Perbankan, dan Lembaga Keuangan; Kebijakan Fiskal dan Moneter; Ekonomi Terbuka dan Perdagangan Internasional; Keterampilan Literasi Finansial';
  }
  if (m.includes('sosiologi')) {
    return 'Individu, Kelompok, dan Hubungan Sosial; Institusi, Lembaga, dan Struktur Sosial; Diferensiasi dan Stratifikasi Sosial; Konflik, Kekerasan, dan Integrasi Sosial; Perubahan Sosial dan Globalisasi; Keterampilan Riset Sosial';
  }
  if (m.includes('informatika') || m.includes('komputer') || m.includes('tik')) {
    return 'Berpikir Komputasional; Teknologi Informasi dan Komunikasi; Sistem Komputer; Jaringan Komputer dan Internet; Analisis Data; Algoritma dan Pemrograman; Dampak Sosial Informatika; Praktik Lintas Bidang';
  }
  if (m.includes('pancasila') || m.includes('pkn') || m.includes('kewarganegaraan')) {
    return 'Pancasila; Undang-Undang Dasar Negara Republik Indonesia Tahun 1945; Bhinneka Tunggal Ika; Negara Kesatuan Republik Indonesia; Norma, Hukum, dan Hak Asasi Manusia';
  }
  if (m.includes('islam') || m.includes('pai')) {
    return "Al-Qur'an dan Hadis; Akidah; Akhlak; Fikih; Sejarah Peradaban Islam; Pengamalan Ibadah dan Muamalah Kontekstual";
  }
  if (m.includes('kristen')) {
    return 'Allah Berkarya; Manusia dan Nilai-nilai Kristiani; Gereja dan Masyarakat Majemuk; Alam dan Lingkungan Hidup; Tanggung Jawab Moral Kristiani';
  }
  if (m.includes('pjok') || m.includes('olahraga') || m.includes('penjas')) {
    return 'Keterampilan Gerak; Pengetahuan Gerak; Pemanfaatan Gerak; Pengembangan Karakter dan Nilai Gerak; Pola Hidup Sehat, Kebugaran, dan Nutrisi';
  }
  if (m.includes('rupa')) {
    return 'Mengalami; Merefleksikan; Berpikir dan Bekerja Artistik; Menciptakan; Berdampak; Apresiasi Seni dan Visual';
  }
  if (m.includes('musik')) {
    return 'Mengalami; Merefleksikan; Berpikir dan Bekerja Artistik; Menciptakan; Berdampak; Ekspresi dan Penampilan Musikal';
  }
  if (m.includes('tari')) {
    return 'Mengalami; Merefleksikan; Berpikir dan Bekerja Artistik; Menciptakan; Berdampak; Eksplorasi Gerak dan Koreografi';
  }
  if (m.includes('teater')) {
    return 'Mengalami; Merefleksikan; Berpikir dan Bekerja Artistik; Menciptakan; Berdampak; Tata Panggung dan Seni Peran';
  }
  if (m.includes('seni')) {
    return 'Mengalami; Merefleksikan; Berpikir dan Bekerja Artistik; Menciptakan; Berdampak; Eksplorasi dan Apresiasi Budaya';
  }
  if (m.includes('prakarya')) {
    return 'Observasi dan Eksplorasi; Desain dan Perencanaan; Produksi dan Pengolahan; Refleksi, Evaluasi, dan Pengujian Mutu';
  }
  if (m.includes('bimbingan') || m.includes('konseling') || m.includes('bk')) {
    return 'Bimbingan Pribadi; Bimbingan Sosial; Bimbingan Belajar Efektif; Bimbingan Karier dan Masa Depan';
  }
  if (jenjang && (jenjang.includes('SMK') || (jurusan && jurusan.toLowerCase() !== 'reguler'))) {
    return `Dasar-dasar Program Keahlian ${mapel}; Keselamatan Kerja dan K3LH; Perencanaan Teknis dan Desain Kerja; Pengoperasian Peralatan dan Sistem; Pemeliharaan dan Pengujian Mutu Produk; Manajemen Proyek dan Kewirausahaan Industri`;
  }
  return `Pemahaman Konsep Esensial ${mapel}; Penyelidikan dan Analisis Masalah; Keterampilan Prosedural dan Operasional; Pemecahan Masalah Kontekstual; Kolaborasi dan Komunikasi; Evaluasi dan Refleksi Belajar`;
}

// Pastikan kalimat berakhir tuntas dan tidak terpotong menggantung
function ensureCompleteSentence(str) {
  if (!str) return '';
  let s = str.trim();
  // Hilangkan konjungsi menggantung di akhir kalimat (misal: ", dan" atau "dan" atau koma)
  s = s.replace(/,\s*(?:dan|serta|atau|sehingga|tetapi|karena)?\s*$/i, '');
  s = s.replace(/\s+(?:dan|serta|atau|sehingga|tetapi|karena)\s*$/i, '');
  s = s.trim();

  if (!s.endsWith('.') && !s.endsWith('!') && !s.endsWith('?')) {
    const lastP = Math.max(s.lastIndexOf('.'), s.lastIndexOf('!'), s.lastIndexOf('?'));
    if (lastP > s.length * 0.45) {
      s = s.substring(0, lastP + 1);
    } else {
      s += '.';
    }
  }
  return s;
}

// Parser cerdas multi-strategi untuk memisahkan 3 kolom Identifikasi Awal ke masing-masing textarea
function parseIdentifikasiAwal(rawText) {
  const text = cleanAiText(rawText);
  let valPeserta = '';
  let valMateri = '';
  let valProfil = '';

  // Strategi 1: Tag kurung siku [PESERTA...], [MATERI...], [PROFIL...]
  const regexPeserta = /\[(?:PESERTA|PESERTA DIDIK|IDENTIFIKASI PESERTA DIDIK)\]([\s\S]*?)(?=\[(?:MATERI|PROFIL|DIMENSI PROFIL)|$)/i;
  const regexMateri = /\[(?:MATERI|MATERI PEMBELAJARAN|IDENTIFIKASI MATERI)\]([\s\S]*?)(?=\[(?:PROFIL|DIMENSI PROFIL|PROFIL LULUSAN)|$)/i;
  const regexProfil = /\[(?:PROFIL|DIMENSI PROFIL|PROFIL LULUSAN)\]([\s\S]*?)$/i;

  const matchP = text.match(regexPeserta);
  const matchM = text.match(regexMateri);
  const matchPr = text.match(regexProfil);

  if (matchP || matchM || matchPr) {
    if (matchP) valPeserta = matchP[1].trim();
    if (matchM) valMateri = matchM[1].trim();
    if (matchPr) valProfil = matchPr[1].trim();
  } else {
    // Strategi 2: Penomoran 1. Identifikasi Peserta, 2. Identifikasi Materi, 3. Dimensi Profil
    const regexNumP = /(?:1[\.\)]|identifikasi peserta didik:?)([\s\S]*?)(?=(?:2[\.\)]|identifikasi materi)|$)/i;
    const regexNumM = /(?:2[\.\)]|identifikasi materi pembelajaran:?|identifikasi materi:?)([\s\S]*?)(?=(?:3[\.\)]|dimensi profil|profil lulusan)|$)/i;
    const regexNumPr = /(?:3[\.\)]|dimensi profil lulusan:?|dimensi profil:?)([\s\S]*?)$/i;

    const mNumP = text.match(regexNumP);
    const mNumM = text.match(regexNumM);
    const mNumPr = text.match(regexNumPr);

    if (mNumP) valPeserta = mNumP[1].trim();
    if (mNumM) valMateri = mNumM[1].trim();
    if (mNumPr) valProfil = mNumPr[1].trim();
  }

  // Jika tetap kosong (fallback pembagian paragraf)
  if (!valPeserta && !valMateri && !valProfil) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 3) {
      valPeserta = paragraphs[0];
      valMateri = paragraphs[1];
      valProfil = paragraphs.slice(2).join('\n\n');
    } else {
      valPeserta = text;
    }
  }

  const cleanHeader = (str) => {
    return (str || '')
      .replace(/^\[.*?\]\s*/g, '')
      .replace(/^(?:identifikasi peserta didik|identifikasi materi pembelajaran|identifikasi materi|dimensi profil lulusan|dimensi profil)[:\s-]*/i, '')
      .replace(/^.*?(?:berikut adalah|berikut ini).*?:\s*\n*/i, '')
      .trim();
  };

  return {
    peserta: ensureCompleteSentence(cleanHeader(valPeserta)),
    materi: ensureCompleteSentence(cleanHeader(valMateri)),
    profil: ensureCompleteSentence(cleanHeader(valProfil))
  };
}

// Eksekusi Panggilan AI untuk Halaman Modul Ajar:
// HANYA MENGGUNAKAN GOOGLE GEMINI API (TIDAK MENGGUNAKAN MODEL LAIN)
async function callGeminiWithAccountKey(promptText, customConfig) {
  let apiKey = getEffectiveApiKey();
  if (!apiKey) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch('/api/users', { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) {
        const rawUsers = await res.json();
        const users = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.users || []);
        const cur = getCurrentUser();
        const curEmail = (cur?.email || localStorage.getItem('edu_current_user_email') || '').toLowerCase().trim();
        const found = users.find(u => (u.email || '').toLowerCase() === curEmail);
        if (found && found.geminiApiKey) {
          apiKey = found.geminiApiKey.trim();
          if (cur) {
            cur.geminiApiKey = apiKey;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
          }
          localStorage.setItem('edu_gemini_api_key', apiKey);
          if (curEmail) localStorage.setItem(`edu_api_key_${curEmail}`, apiKey);
        }
      }
    } catch (e) { }
  }

  // JIKA KUNCI GEMINI BELUM DISET DI AKUN PENGGUNA:
  if (!apiKey) {
    callGeminiWithAccountKey.lastError = 'Kunci API Google Gemini belum disimpan di akun Anda.';
    if (!customConfig?.silentError) {
      showNotificationModal(
        'Kunci API Belum Disimpan',
        'Fitur <strong>Generate With AI</strong> memerlukan API Key Google Gemini pada akun Anda.<br><br>Silakan buka menu <a href="../../dashboard-pengguna/api-key.html" style="color:#2563eb;font-weight:700;text-decoration:underline;">Kunci API</a> dan simpan API Key Google Gemini resmi Anda terlebih dahulu.',
        'warning'
      );
    }
    return null;
  }

  // 1. Prioritaskan endpoint resmi teks stabil Google Gemini (kompatibel untuk akun baru & lama)
  let candidateEndpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`
  ];

  // 2. Tambahkan model yang terdaftar pada akun HANYA jika berupa model teks murni
  const availableModels = await getAvailableGeminiModels(apiKey);
  if (availableModels.length > 0) {
    for (const m of availableModels) {
      const name = (m.rawName || '').toLowerCase();
      // JANGAN masukkan model audio/TTS/embedding, dan JANGAN masukkan model 2.5-flash yang dilarang untuk akun baru
      if (name.includes('tts') || name.includes('audio') || name.includes('embed') || name.includes('imagen') || name.includes('realtime') || name.includes('2.5-flash')) continue;
      if (name.includes('flash') || name.includes('pro')) {
        candidateEndpoints.push(`https://generativelanguage.googleapis.com/${m.version}/models/${m.rawName}:generateContent`);
      }
    }
  }

  const uniqueEndpoints = Array.from(new Set(candidateEndpoints)).slice(0, 6);
  let lastErrorMsg = '';

  const reqTimeoutMs = (customConfig && customConfig.timeoutMs) ? customConfig.timeoutMs : 35000;
  const isSilent = Boolean(customConfig && customConfig.silentError);

  // Hanya sertakan parameter resmi Google Gemini generationConfig
  const genConfig = {
    temperature: typeof customConfig?.temperature === 'number' ? customConfig.temperature : 0.7,
    maxOutputTokens: typeof customConfig?.maxOutputTokens === 'number' ? customConfig.maxOutputTokens : 8192
  };
  if (typeof customConfig?.topP === 'number') genConfig.topP = customConfig.topP;
  if (typeof customConfig?.topK === 'number') genConfig.topK = customConfig.topK;
  if (customConfig?.responseMimeType) genConfig.responseMimeType = customConfig.responseMimeType;

  // Uji coba eksekusi nyata ke Google Gemini API (dengan auto-fallback model pada 429 atau 400)
  for (const baseEndpoint of uniqueEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), reqTimeoutMs);

      const res = await fetch(baseEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: genConfig
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          console.log('[Gemini API] Berhasil generate via Google Gemini:', baseEndpoint);
          return text.trim();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastErrorMsg = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403 || lastErrorMsg.includes('UNAUTHENTICATED') || lastErrorMsg.includes('API key not valid')) {
          console.warn('[Gemini API] Google menolak kunci API (' + res.status + '):', lastErrorMsg);
          lastErrorMsg = 'Kunci API Google Gemini pada akun Anda tidak valid atau ditolak Google (HTTP 401). Silakan periksa kembali di menu Kunci API.';
          break;
        } else if (res.status === 429) {
          console.warn(`[Gemini API] Endpoint ${baseEndpoint} terkena kuota/rate limit (HTTP 429). Mencoba model alternatif...`);
          lastErrorMsg = 'Batas kuota Google Gemini API akun Anda tercapai (HTTP 429 - Rate Limit). Silakan tunggu beberapa menit.';
          // JANGAN batalkan seluruh proses; beri jeda singkat lalu coba model alternatif berikutnya
          await new Promise(r => setTimeout(r, 1200));
          continue;
        } else {
          // Status 400 (seperti modalitas tidak didukung / parameter invalid) atau 404: coba model berikutnya!
          console.warn(`[Gemini API] Endpoint ${baseEndpoint} gagal (${res.status}): ${lastErrorMsg}. Mencoba model alternatif...`);
          continue;
        }
      }
    } catch (e) {
      lastErrorMsg = e.name === 'AbortError' ? `Batas waktu koneksi Google Gemini (${Math.round(reqTimeoutMs / 1000)} detik) terlampaui` : (e.message || 'Koneksi ke Google Gemini terputus');
    }
  }

  callGeminiWithAccountKey.lastError = lastErrorMsg;

  // Jika gagal, tampilkan pesan error resmi dari Google Gemini — JANGAN MENGGUNAKAN TEMPLATE JAWABAN
  console.warn('[Gemini API] Google Gemini tidak merespon:', lastErrorMsg);
  if (!isSilent) {
    showNotificationModal(
      'Generate AI Gagal',
      `Google Gemini tidak dapat merumuskan konten: ${lastErrorMsg}. Pastikan Kunci API Google Gemini Anda valid dan tersimpan di menu Kunci API.`,
      'error'
    );
  }
  return null;
}

function getFallbackElemenCP(mapel, faseKelas) {
  const mL = (mapel || '').toLowerCase();
  if (mL.includes('foto') || mL.includes('kamera') || mL.includes('lens')) {
    return 'Tata Kamera dan Pencahayaan; Komposisi Visual Fotografi; Pengoperasian Perangkat Kamera; Pascaproduksi dan Editing Digital; Manajemen Karya Fotografi';
  }
  if (mL.includes('dkv') || mL.includes('desain komunikasi') || mL.includes('grafis')) {
    return 'Prinsip Dasar Desain dan Komunikasi Visual; Gambar Sketsa dan Ilustrasi; Tipografi dan Tata Letak; Perangkat Lunak Desain Grafis; Produksi Karya Desain Komunikasi Visual';
  }
  if (mL.includes('animasi')) {
    return 'Prinsip Dasar Animasi; Perancangan Karakter dan Storyboard; Animasi 2 Dimensi; Animasi 3 Dimensi; Pascaproduksi Animasi';
  }
  if (mL.includes('jaringan') || mL.includes('tkj') || mL.includes('komputer') || mL.includes('it')) {
    return 'Perencanaan Jaringan Komputer; Pemasangan dan Konfigurasi Jaringan; Administrasi Sistem Jaringan; Keamanan Jaringan; Perawatan dan Perbaikan Jaringan';
  }
  if (mL.includes('ipas') || mL.includes('ipa')) {
    return 'Makhluk Hidup dan Lingkungannya; Zat dan Perubahannya; Energi dan Perubahannya; Bumi dan Antariksa; Keterampilan Proses Penyelidikan Ilmiah';
  }
  if (mL.includes('matematika')) {
    return 'Bilangan; Aljabar; Pengukuran; Geometri; Analisis Data dan Peluang; Penalaran dan Pemecahan Masalah';
  }
  if (mL.includes('bahasa indonesia')) {
    return 'Menyimak; Membaca dan Memirsa; Berbicara dan Mempresentasikan; Menulis';
  }
  if (mL.includes('bahasa inggris')) {
    return 'Menyimak - Berbicara; Membaca - Memirsa; Menulis - Mempresentasikan';
  }
  if (mL.includes('informatika')) {
    return 'Berpikir Komputasional; Teknologi Informasi dan Komunikasi; Sistem Komputer; Jaringan Komputer dan Internet; Analisis Data; Algoritma dan Pemrograman; Dampak Sosial Informatika';
  }
  return `Pemahaman Konsep ${mapel || 'Materi Pokok'}; Keterampilan Proses Terapan; Analisis Masalah Otentik; Perancangan Solusi Kreatif; Refleksi dan Komunikasi Hasil`;
}

/**
 * GENERATOR AI: Elemen Capaian Pembelajaran (Tahap 1)
 * Menyusun daftar elemen CP resmi Kurikulum Merdeka sesuai Mata Pelajaran, Jenjang, Fase, dan Jurusan
 */
async function generateAIElemenCP() {
  const mapel = document.getElementById('mataPelajaran')?.value.trim() || '';
  const jenjang = document.getElementById('jenjangSekolah')?.value || 'SMA / MA';
  const faseKelas = document.getElementById('faseKelas')?.value || 'Fase E';
  const jurusan = document.getElementById('jurusanSekolah')?.value.trim() || 'Reguler';
  const targetArea = document.getElementById('elemenCP');
  const btn = document.getElementById('btnGenElemenCPAI');

  if (!mapel) {
    showNotificationModal(
      'Lengkapi Data Sebelumnya',
      'Silakan isi kolom Mata Pelajaran terlebih dahulu agar AI dapat menentukan Elemen Capaian Pembelajaran yang tepat dan baku.',
      'warning'
    );
    document.getElementById('mataPelajaran')?.focus();
    return;
  }

  if (targetArea) {
    targetArea.value = 'Mohon tunggu, AI sedang menyusun Elemen Capaian Pembelajaran...';
  }

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>Generate With AI</span>`;
  }

  const prompt = `Anda adalah tim pakar perumus kurikulum nasional BSKAP Kemendikbudristek untuk Kurikulum Merdeka Indonesia.
Berdasarkan data kurikulum akademik:
- Mata Pelajaran: ${mapel}
- Kelas / Fase: ${faseKelas}
- Jenjang Sekolah: ${jenjang}
- Jurusan / Peminatan: ${jurusan}

TUGAS UTAMA:
Tuliskan daftar resmi Elemen Capaian Pembelajaran (Elemen CP) Kurikulum Merdeka yang tepat, spesifik, dan berlaku baku untuk mata pelajaran "${mapel}" pada jenjang ${jenjang} (${faseKelas}).

PANDUAN KURIKULUM MERDEKA:
1. Elemen CP WAJIB disesuaikan secara presisi dengan mata pelajaran "${mapel}" dan jenjang/fase (${faseKelas}).
2. Tuliskan seluruh elemen resmi yang berlaku pada mata pelajaran dan fase tersebut (BSKAP Kemendikbudristek).
   - Jika Ilmu Pengetahuan Alam dan Sosial (IPAS) Fase E (SMK/SMA):
     Makhluk Hidup dan Lingkungannya; Zat dan Perubahannya; Energi dan Perubahannya; Bumi dan Antariksa; Keruangan dan Konektivitas Antarruang dan Waktu; Pengaruh Interaksi Sosial dan Dinamika Sosial; Perilaku Ekonomi dan Kesejahteraan; Keterampilan Proses
   - Jika IPAS Fase B/C (SD):
     Pemahaman IPAS (Sains dan Sosial); Mengamati dan Menyelidiki Fenomena; Memprediksi dan Merencanakan Inkuiri; Memproses dan Menganalisis Data; Mengevaluasi dan Refleksi; Mengomunikasikan Hasil
   - Jika Biologi Fase E/F (SMA):
     Pemahaman Biologi; Keterampilan Proses Penyelidikan Ilmiah; Keanekaragaman Hayati dan Ekosistem; Struktur dan Fungsi Makhluk Hidup; Pewarisan Sifat dan Bioteknologi
   - Jika Fisika Fase E/F (SMA):
     Pemahaman Fisika; Keterampilan Proses Penyelidikan; Pengukuran dan Kinematika Gerak; Usaha, Energi, dan Termodinamika; Gelombang, Optik, Listrik dan Magnet
   - Jika Kimia Fase E/F (SMA):
     Pemahaman Kimia; Keterampilan Proses Laboratorium; Struktur Materi dan Ikatan Kimia; Reaksi Kimia dan Stoikiometri; Larutan dan Termokimia
   - Jika Matematika:
     Bilangan; Aljabar; Pengukuran; Geometri; Analisis Data dan Peluang; Penalaran dan Pemecahan Masalah
   - Jika Bahasa Indonesia:
     Menyimak; Membaca dan Memirsa; Berbicara dan Mempresentasikan; Menulis
   - Jika Bahasa Inggris:
     Menyimak - Berbicara; Membaca - Memirsa; Menulis - Mempresentasikan
   - Jika Informatika:
     Berpikir Komputasional; Teknologi Informasi dan Komunikasi; Sistem Komputer; Jaringan Komputer dan Internet; Analisis Data; Algoritma dan Pemrograman; Dampak Sosial Informatika; Praktik Lintas Bidang
   - Jika Pendidikan Pancasila:
     Pancasila; Undang-Undang Dasar Negara Republik Indonesia Tahun 1945; Bhinneka Tunggal Ika; Negara Kesatuan Republik Indonesia

ATURAN FORMAT OUTPUT SANGAT KETAT:
1. HANYA TULISKAN NAMA-NAMA ELEMEN CP YANG DIPISAHKAN OLEH TANDA TITIK KOMA (;) DALAM SATU BARIS POLOS.
2. DILARANG MENAMBAHKAN KATA PEMBUKA, SALAM, PENJELASAN, ATAU PENUTUP APAPUN.
3. DILARANG MENGGUNAKAN NOMOR (1, 2, 3), BULLET POINT, ATAU TANDA BINTANG (* ATAU **).`;

  const result = await callGeminiWithAccountKey(prompt, { silentError: true });
  if (result) {
    targetArea.value = cleanElemenCP(result);
  } else {
    targetArea.value = getFallbackElemenCP(mapel, faseKelas);
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}

/**
 * GENERATOR AI: D. Tujuan Pembelajaran
 */
async function generateAITujuan() {
  const ctx = getLearningContext();
  const btn = document.getElementById('btnGenTujuanAI');
  const targetArea = document.getElementById('tujuanPembelajaran');
  if (!targetArea) return;

  if (!ctx.mapel || !ctx.topik) {
    showNotificationModal('Lengkapi Data Sebelumnya', 'Silakan isi Mata Pelajaran (di Tahap 1) dan Isi Topik / Materi terlebih dahulu agar AI dapat merumuskan tujuan secara presisi.', 'warning');
    return;
  }

  if (targetArea) {
    targetArea.value = 'Mohon tunggu, AI sedang merumuskan Tujuan Pembelajaran...';
  }

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>Generate With AI</span>`;
  }

  const prompt = `Anda adalah pakar pengembang kurikulum Kurikulum Merdeka Indonesia.
Konteks Pembelajaran:
- Mata Pelajaran: ${ctx.mapel}
- Jenjang & Kelas: ${ctx.jenjang} (${ctx.jurusan}), ${ctx.fase}
- Elemen Capaian Pembelajaran: ${ctx.elemenCP}
- ${ctx.jenisInput}: ${ctx.topik}
- Model Pembelajaran: ${ctx.model}
- Pendekatan: ${ctx.pendekatan}
- Metode: ${ctx.metodeList || 'Diskusi kelompok'}

Tugas:
Susun 3 butir Tujuan Pembelajaran yang terukur dan konkret dengan standar ABCD (Audience, Behavior, Condition, Degree).

ATURAN WAJIB SANGAT KETAT:
1. DILARANG MENULISKAN KALIMAT PEMBUKA SEPERTI "Berikut adalah...", "Tentu,", "Berikut ini...", ATAU KATA PENGANTAR LAINNYA.
2. LANGSUNG MULAI DARI NOMOR "1. Peserta didik...".
3. DILARANG MENGGUNAKAN TANDA BINTANG (* ATAU **) SAMA SEKALI. DILARANG MENGGUNAKAN MARKDOWN BOLD.
4. Tuliskan teks biasa/polos (plain text) 1., 2., 3. sampai selesai tuntas.`;

  const result = await callGeminiWithAccountKey(prompt, { silentError: true });
  if (result) {
    targetArea.value = cleanTujuanPembelajaran(result);
  } else {
    targetArea.value = `1. Melalui pengamatan terarah dan telaah materi, peserta didik mampu memahami konsep esensial ${ctx.topik} secara tepat.
2. Melalui penugasan berbasis model ${ctx.model}, peserta didik mampu menerapkan prinsip kerja ${ctx.topik} secara kolaboratif sesuai standar prosedur kerja.
3. Melalui evaluasi hasil dan presentasi kelompok, peserta didik mampu mengomunikasikan pemecahan masalah materi ${ctx.topik} dengan nalar kritis dan mandiri.`;
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}

/**
 * GENERATOR AI: E. Materi Tambahan
 */
async function generateAIMateri() {
  const ctx = getLearningContext();
  const btn = document.getElementById('btnGenMateriAI');
  const targetArea = document.getElementById('materiTambahan');
  if (!targetArea) return;

  if (!ctx.mapel || !ctx.topik) {
    showNotificationModal('Lengkapi Data Sebelumnya', 'Silakan isi Mata Pelajaran dan Isi Topik / Materi terlebih dahulu.', 'warning');
    return;
  }

  if (targetArea) {
    targetArea.value = 'Mohon tunggu, AI sedang merumuskan Materi Tambahan...';
  }

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>Generate With AI</span>`;
  }

  const prompt = `Anda adalah ahli kurikulum dan materi pembelajaran Kurikulum Merdeka.
Konteks:
- Mata Pelajaran: ${ctx.mapel}
- Jenjang & Kelas: ${ctx.jenjang} (${ctx.fase})
- ${ctx.jenisInput}: ${ctx.topik}
- Elemen CP: ${ctx.elemenCP}

Tugas:
Sebutkan 2-3 materi tambahan / pengayaan kontekstual esensial secara ringkas dalam bentuk deskriptif.
Langsung tuliskan apa saja nama materinya dan deskripsi singkatnya dalam 1-2 kalimat deskriptif per materi.

ATURAN WAJIB SANGAT KETAT:
1. DILARANG MENULISKAN KALIMAT PEMBUKA ATAU JUDUL SEPERTI "Ringkasan Materi Tambahan...", "Berikut adalah...", ATAU KATA PENGANTAR LAINNYA.
2. LANGSUNG MULAI DARI NAMA MATERI PERTAMA.
3. CUKUP RINGKAS DAN DESKRIPTIF (1-2 kalimat deskripsi per materi).
4. DILARANG MENGGUNAKAN TANDA BINTANG (* ATAU **) SAMA SEKALI. DILARANG MENGGUNAKAN MARKDOWN BOLD.
5. Gunakan format nomor 1., 2., 3. dalam teks polos.`;

  const result = await callGeminiWithAccountKey(prompt, { silentError: true });
  if (result) {
    targetArea.value = cleanMateriTambahan(result);
  } else {
    targetArea.value = `1. Eksplorasi teknologi terkini dan studi kasus industri mutakhir terkait pengaplikasian materi ${ctx.topik}.
2. Proyek inovasi kolaboratif tingkat lanjut guna memperluas wawasan terapan peserta didik di luar capaian pembelajaran dasar.
3. Analisis komparatif tantangan nyata dan peluang karir profesional pada bidang keahlian ${ctx.mapel}.`;
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}

/**
 * GENERATOR AI: G. Capaian Pembelajaran (CP)
 */
async function generateAICP() {
  const ctx = getLearningContext();
  const btn = document.getElementById('btnGenCPAI');
  const targetArea = document.getElementById('capaianPembelajaran');
  if (!targetArea) return;

  if (!ctx.mapel || !ctx.topik) {
    showNotificationModal('Lengkapi Data Sebelumnya', 'Silakan isi Mata Pelajaran dan Isi Topik / Materi terlebih dahulu.', 'warning');
    return;
  }

  if (targetArea) {
    targetArea.value = 'Mohon tunggu, AI sedang merumuskan Capaian Pembelajaran...';
  }

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>Generate With AI</span>`;
  }

  const isRingkasCP = document.getElementById('ceklisRingkasCP')?.checked || false;

  let instruksiKhusus = '';
  if (isRingkasCP) {
    instruksiKhusus = `
INSTRUKSI KHUSUS PERINGKASAN:
Pengguna mencentang instruksi untuk MERINGKAS Capaian Pembelajaran (CP) agar LEBIH SPESIFIK dan BERFOKUS HANYA PADA ${ctx.jenisInput}: '${ctx.topik}'.
Rumuskan narasi CP yang terfokus tajam pada penguasaan esensial topik '${ctx.topik}' terkait elemen '${ctx.elemenCP}', lebih ringkas, padat, dan langsung menukik ke esensi topik tersebut tanpa uraian umum lainnya.`;
  }

  const prompt = `Anda adalah penyusun kurikulum BSKAP Kemendikbudristek.
Berdasarkan data:
- Mata Pelajaran: ${ctx.mapel}
- Jenjang & Fase: ${ctx.jenjang} (${ctx.fase})
- Elemen Capaian Pembelajaran: ${ctx.elemenCP}
- ${ctx.jenisInput}: ${ctx.topik}
${instruksiKhusus}

Tugas:
Tuliskan rumusan narasi resmi Capaian Pembelajaran (CP) dalam TEPAT 1 PARAGRAF UTUH yang ${isRingkasCP ? 'sangat spesifik, terfokus pada topik ' + ctx.topik + ', ringkas,' : 'ringkas,'} mengalir, dan selesai tuntas.

ATURAN WAJIB SANGAT KETAT:
1. TULISKAN HANYA 1 PARAGRAF UTUH. DILARANG KERAS MEMBUAT PARAGRAF KEDUA.
2. DILARANG MENGGUNAKAN KATA ATAU FRASA "Selain itu", "Disamping itu", "Berikut adalah", ATAU SALAM/PENGANTAR.
3. DILARANG MENGGUNAKAN TANDA BINTANG (* ATAU **) SAMA SEKALI. DILARANG MENGGUNAKAN MARKDOWN BOLD.
4. Tulis langsung narasi polos yang padat dan selesai tuntas sampai tanda titik.${isRingkasCP ? '\n5. Pastikan rumusan narasi CP secara eksplisit berpusat pada penguasaan topik ' + ctx.topik + '.' : ''}`;

  const result = await callGeminiWithAccountKey(prompt, { silentError: true });
  if (result) {
    targetArea.value = cleanCapaianPembelajaran(result);
  } else {
    targetArea.value = isRingkasCP
      ? `Pada akhir Fase ${ctx.fase}, peserta didik menunjukkan penguasaan komprehensif terhadap materi ${ctx.topik}. Peserta didik mampu menganalisis konsep kunci, melaksanakan prosedur praktis terukur, dan memecahkan tantangan otentik secara kolaboratif maupun mandiri sesuai standar Kurikulum Merdeka.`
      : `Pada akhir Fase ${ctx.fase}, peserta didik mampu memahami, mengaplikasikan, dan mengevaluasi ruang lingkup capaian pembelajaran pada mata pelajaran ${ctx.mapel}, khususnya elemen ${ctx.elemenCP} dan materi pokok ${ctx.topik} guna membekali kecakapan abad ke-21.`;
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}

/**
 * GENERATOR AI: I. Identifikasi Awal
 */
async function generateAIIdentifikasi() {
  const ctx = getLearningContext();
  const btn = document.getElementById('btnGenIdentifikasiAI');
  const areaPeserta = document.getElementById('identifikasiPesertaDidik');
  const areaMateri = document.getElementById('identifikasiMateri');
  const areaProfil = document.getElementById('identifikasiProfilLulusan');

  if (!ctx.mapel || !ctx.topik) {
    showNotificationModal('Lengkapi Data Sebelumnya', 'Silakan isi Mata Pelajaran dan Isi Topik / Materi terlebih dahulu.', 'warning');
    return;
  }

  if (areaPeserta) areaPeserta.value = 'Mohon tunggu, AI sedang merumuskan Identifikasi Peserta Didik...';
  if (areaMateri) areaMateri.value = 'Mohon tunggu, AI sedang merumuskan Identifikasi Materi Pembelajaran...';
  if (areaProfil) areaProfil.value = 'Mohon tunggu, AI sedang merumuskan Dimensi Profil Lulusan...';

  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = `<span class="btn-spinner"></span> <span>Generate With AI</span>`;
  }

  const prompt = `Anda adalah spesialis asesmen diagnostik Kurikulum Merdeka.
Berdasarkan data perencanaan berikut:
- Mata Pelajaran: ${ctx.mapel}
- Jenjang & Fase: ${ctx.jenjang} (${ctx.fase})
- ${ctx.jenisInput}: ${ctx.topik}
- Elemen CP: ${ctx.elemenCP}
- Pendekatan: ${ctx.pendekatan}
- Model: ${ctx.model}

Tugas:
Rumuskan 3 aspek identifikasi awal secara terpadu, ringkas, padat, dan selesai tuntas:
1. Identifikasi Peserta Didik (Tuliskan 2 kalimat padat kesiapan belajar dan minat murid)
2. Identifikasi Materi Pembelajaran (Tuliskan 2 kalimat padat esensi dan tingkat kesulitan materi)
3. Dimensi Profil Lulusan (Tuliskan 1-2 kalimat padat karakter profil lulusan yang dilatih)

ATURAN SANGAT KETAT:
- DILARANG MENULISKAN KALIMAT PEMBUKA SEPERTI "Berikut adalah..." ATAU PENUTUP LAINNYA.
- DILARANG MENGGUNAKAN TANDA BINTANG (* ATAU **) SAMA SEKALI. DILARANG MENGGUNAKAN MARKDOWN BOLD.
- Tuliskan masing-masing poin secara ringkas dan selesai tuntas sampai tanda titik. Jangan sampai terpotong.
- Gunakan format pembatas kurung siku persis seperti di bawah ini agar setiap poin otomatis terisi ke masing-masing kolom:

[PESERTA]
(Tuliskan narasi ringkas peserta didik di sini)

[MATERI]
(Tuliskan narasi ringkas materi pembelajaran di sini)

[PROFIL]
(Tuliskan narasi ringkas dimensi profil lulusan di sini)`;

  const result = await callGeminiWithAccountKey(prompt, { silentError: true });
  if (result) {
    const parsed = parseIdentifikasiAwal(result);

    if (areaPeserta && parsed.peserta) areaPeserta.value = parsed.peserta;
    if (areaMateri && parsed.materi) areaMateri.value = parsed.materi;
    if (areaProfil && parsed.profil) areaProfil.value = parsed.profil;
  } else {
    if (areaPeserta) areaPeserta.value = `Sebagian besar peserta didik telah memiliki pengetahuan awal terkait materi ${ctx.topik}, namun memerlukan bimbingan bertahap (scaffolding) untuk mencapai ketuntasan kompetensi secara mandiri.`;
    if (areaMateri) areaMateri.value = `Materi ${ctx.topik} memiliki tingkat kesulitan terukur yang memadukan teori konseptual dan keterampilan prosedural relevan dengan kebutuhan dunia nyata.`;
    if (areaProfil) areaProfil.value = `Menumbuhkan dimensi Profil Pelajar Pancasila terutama Penalaran Kritis dalam membedah kasus materi, Kreativitas dalam menghasilkan karya, dan Kolaborasi aktif.`;
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}


async function initModulAjarPage() {
  let user = getCurrentUser();
  if (!user) {
    window.location.href = "../../halaman-login/halaman-login.html";
    return;
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const isAdm = user.role === 'Admin' || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase());

  // Prioritas Utama: Ambil hak akses dan status terbaru langsung dari Supabase
  try {
    const dbUser = await SupabaseDB.getUserByEmail(userEmail);
    if (dbUser) {
      user = { ...user, ...dbUser };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {}

  // Proteksi: Jika akun dihapus atau dinonaktifkan, dilarang mengakses generator modul ajar!
  if (!isAdm) {
    const isDeleted = user.status === 'Dihapus' || user.isDeleted === true;
    const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
    const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || user.isApproved === false || isExpired;

    if (isDeleted || isDeactivated) {
      window.location.replace("../../dashboard-pengguna/profil.html");
      return;
    }

    // Proteksi: Jika fitur generate_modul_ajar dinonaktifkan oleh Admin
    const activeFeatures = Array.isArray(user.features) ? user.features : [];

    if (!activeFeatures.includes('generate_modul_ajar')) {
      alert("Akses Fitur Dinonaktifkan: Fitur Pembuatan Modul Ajar saat ini dinonaktifkan oleh Administrator untuk akun Anda.");
      window.location.replace("../../dashboard-pengguna/daftar-modul-ajar.html");
      return;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('editId');
  const isEditing = !!editId;
  const backDestination = isEditing ? '../../dashboard-pengguna/daftar-modul-ajar.html' : '../../dashboard-pengguna/dashboard-pengguna.html';
  const backTitle = isEditing ? 'Daftar Modul' : 'Kembali';

  // Render Header Global Terpusat
  renderEduNavbar({
    showBack: true,
    backUrl: backDestination,
    backText: backTitle,
    showApiKey: false
  });

  // A. Informasi Pendidik: Otomatis Isi Nama & Institusi dari Profil
  const namaInput = document.getElementById('namaPenyusun');
  if (namaInput && !namaInput.value) {
    namaInput.value = user.name || '';
  }

  const institusiInput = document.getElementById('institusiPendidik');
  if (institusiInput && !institusiInput.value) {
    const instName = (user.institution && user.institution !== 'Sekolah / Instansi Guru') 
      ? user.institution 
      : (user.school || user.instansi || 'SMA Negeri 1 Jakarta');
    institusiInput.value = instName;
  }

  // B. Informasi Akademik: Otomatis Tahun Terbaru & Inisialisasi Pilihan Jenjang
  const tahunInput = document.getElementById('tahunPenyusunan');
  if (tahunInput && !tahunInput.value) {
    tahunInput.value = new Date().getFullYear();
  }

  const jenjangSelect = document.getElementById('jenjangSekolah');
  if (jenjangSelect) {
    if (!jenjangSelect.value) {
      jenjangSelect.value = 'SMA / MA';
    }
    handleJenjangChange();
  }

  // C. Konteks Pembelajaran: Sinkronisasi Jumlah Pertemuan ke Total JP & Durasi
  const inputPertemuan = document.getElementById('jumlahPertemuan');
  if (inputPertemuan) {
    inputPertemuan.addEventListener('input', syncTotalJPDurasi);
    inputPertemuan.addEventListener('change', syncTotalJPDurasi);
  }
  syncTotalJPDurasi();

  // E. Kontainer hasil generate / tombol Buka Modul Ajar selalu tersembunyi diawal
  // Hanya boleh muncul setelah pengguna benar-benar menekan tombol 'Generate Modul Ajar'
  modulGeneratedInThisSession = false;
  const progressContainer = document.getElementById('generateProgressContainer');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  // F. Periksa apakah dalam mode edit dari halaman Daftar Modul Ajar
  await checkAndLoadEditModul();
}

/**
 * Sinkronisasi Otomatis Keterangan "(X Pertemuan)" pada Total JP & Durasi
 * Berdasarkan input angka di kolom Jumlah Pertemuan
 */
function syncTotalJPDurasi() {
  const inputPertemuan = document.getElementById('jumlahPertemuan');
  const inputTotalJP = document.getElementById('totalJPDurasi');
  if (!inputPertemuan || !inputTotalJP) return;

  const rawNum = inputPertemuan.value.trim().replace(/[^\d]/g, '');
  const currentJP = inputTotalJP.value.trim();

  // Dapatkan durasi menit standar per jenjang sekolah jika relevan
  const jenjang = document.getElementById('jenjangSekolah')?.value || '';
  let menit = 45;
  if (jenjang === 'SD') menit = 35;
  else if (jenjang === 'SMP') menit = 40;

  // Bersihkan keterangan kurung pertemuan lama jika ada
  let baseDurasi = currentJP.replace(/\s*\(\d*\s*pertemuan\)/gi, '').trim();

  // Jika belum ada base durasi atau masih format lama
  if (!baseDurasi || baseDurasi.includes('(4 x 45 menit)') || !baseDurasi.includes('JP')) {
    baseDurasi = `4 JP x ${menit} Menit`;
  }

  if (rawNum) {
    inputTotalJP.value = `${baseDurasi} (${rawNum} Pertemuan)`;
  } else {
    inputTotalJP.value = baseDurasi;
  }
}

/**
 * Toggle Munculnya Input Tambahan Saat Opsi "Lainnya" Dicentang
 */
function toggleFasilitasLainnya() {
  const cbLainnya = document.getElementById('cbFasilitasLainnya');
  const wrapper = document.getElementById('wrapperFasilitasLainnya');
  const input = document.getElementById('inputFasilitasLainnya');
  if (!wrapper) return;

  if (cbLainnya && cbLainnya.checked) {
    wrapper.style.display = 'block';
    if (input) input.focus();
  } else {
    wrapper.style.display = 'none';
  }
}

/**
 * Dapatkan Daftar Fasilitas Terpilih Termasuk Isian Manual "Lainnya"
 * Memisahkan fasilitas tambahan dengan tanda titik koma (;)
 */
function getSelectedFasilitasList() {
  const checkboxes = document.querySelectorAll('input[name="fasilitasBelajar"]:checked');
  const list = [];

  checkboxes.forEach(cb => {
    if (cb.value === 'Lainnya') {
      const customVal = document.getElementById('inputFasilitasLainnya')?.value.trim();
      if (customVal) {
        // Pisahkan fasilitas dengan tanda titik koma (;)
        const items = customVal.split(';').map(item => item.trim()).filter(Boolean);
        list.push(...items);
      }
    } else {
      list.push(cb.value);
    }
  });

  return list;
}

/**
 * Multi-Step Wizard State & Navigation
 * Tahap 1: Info Dasar
 * Tahap 2: Konteks Pembelajaran
 * Tahap 3: Review & Generate
 */
let currentStep = 1;

function validateStep(stepNum) {
  if (stepNum === 1) {
    const nama = document.getElementById('namaPenyusun');
    const institusi = document.getElementById('institusiPendidik');
    const tahun = document.getElementById('tahunPenyusunan');
    const jenjang = document.getElementById('jenjangSekolah');
    const jurusan = document.getElementById('jurusanSekolah');
    const fase = document.getElementById('faseKelas');
    const mapel = document.getElementById('mataPelajaran');
    const elemen = document.getElementById('elemenCP');

    if (!nama || !nama.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Nama Penyusun terlebih dahulu.', 'warning');
      nama?.focus();
      return false;
    }
    if (!institusi || !institusi.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Institusi sekolah pendidik.', 'warning');
      institusi?.focus();
      return false;
    }
    if (!tahun || !tahun.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Tahun Penyusunan.', 'warning');
      tahun?.focus();
      return false;
    }
    if (!jenjang || !jenjang.value) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan pilih Jenjang Sekolah.', 'warning');
      jenjang?.focus();
      return false;
    }
    if (!jurusan || !jurusan.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Jurusan (selain SMK isi: Reguler).', 'warning');
      jurusan?.focus();
      return false;
    }
    if (!fase || !fase.value) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan pilih Kelas / Fase pembelajaran.', 'warning');
      fase?.focus();
      return false;
    }
    if (!mapel || !mapel.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Mata Pelajaran terlebih dahulu.', 'warning');
      mapel?.focus();
      return false;
    }
    if (!elemen || !elemen.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Elemen Capaian Pembelajaran (pisahkan dengan titik koma).', 'warning');
      elemen?.focus();
      return false;
    }
  } else if (stepNum === 2) {
    // 1. Topik / Materi Pembelajaran (WAJIB)
    const topikInput = document.getElementById('isiTopikMateri');
    if (!topikInput || !topikInput.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Topik / Materi Pokok pembelajaran terlebih dahulu.', 'warning');
      topikInput?.focus();
      return false;
    }

    // 2. Model Pembelajaran Manual (jika dipilih)
    const modelSelect = document.getElementById('modelPembelajaran');
    const modelManual = document.getElementById('inputModelManual');
    if (modelSelect && modelSelect.value === 'Input Manual') {
      if (!modelManual || !modelManual.value.trim()) {
        showNotificationModal('Kolom Wajib Diisi', 'Silakan isi nama Model Pembelajaran manual.', 'warning');
        modelManual?.focus();
        return false;
      }
    }

    // 3. Pendekatan Pembelajaran Manual (jika dipilih)
    const pendekatanSelect = document.getElementById('pendekatanPembelajaran');
    const pendekatanManual = document.getElementById('inputPendekatanManual');
    if (pendekatanSelect && pendekatanSelect.value === 'Input Manual') {
      if (!pendekatanManual || !pendekatanManual.value.trim()) {
        showNotificationModal('Kolom Wajib Diisi', 'Silakan isi nama Pendekatan Pembelajaran manual.', 'warning');
        pendekatanManual?.focus();
        return false;
      }
    }

    // 4. Metode Pembelajaran (WAJIB minimal pilih 1)
    const metodeChecked = document.querySelectorAll('input[name="metodePembelajaran"]:checked');
    if (metodeChecked.length === 0) {
      showNotificationModal('Pilihan Wajib Dipilih', 'Silakan pilih minimal satu Metode Pembelajaran.', 'warning');
      return false;
    }

    // 5. Jumlah Pertemuan (WAJIB)
    const pertemuanInput = document.getElementById('jumlahPertemuan');
    if (!pertemuanInput || !pertemuanInput.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Jumlah Pertemuan (berupa angka).', 'warning');
      pertemuanInput?.focus();
      return false;
    }

    // 6. Total JP & Durasi (WAJIB)
    const jpInput = document.getElementById('totalJPDurasi');
    if (!jpInput || !jpInput.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Total JP & Durasi pembelajaran.', 'warning');
      jpInput?.focus();
      return false;
    }

    // 7. Tujuan Pembelajaran (WAJIB)
    const tujuanInput = document.getElementById('tujuanPembelajaran');
    if (!tujuanInput || !tujuanInput.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Tujuan Pembelajaran atau klik "Generate With AI".', 'warning');
      tujuanInput?.focus();
      return false;
    }

    // CATATAN: E. Materi Tambahan DIKECUALIKAN / OPSIONAL (TIDAK DIVALIDASI)

    // CATATAN: Media Digital & Fasilitas bersifat OPSIONAL (TIDAK DIVALIDASI WAJIB)

    // 11. Capaian Pembelajaran (CP) (WAJIB)
    const cpInput = document.getElementById('capaianPembelajaran');
    if (!cpInput || !cpInput.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi rumusan Capaian Pembelajaran (CP) atau klik "Generate With AI".', 'warning');
      cpInput?.focus();
      return false;
    }

    // 12. Dimensi Profil Lulusan (WAJIB minimal pilih 1)
    const profilChecked = document.querySelectorAll('input[name="dimensiProfil"]:checked');
    if (profilChecked.length === 0) {
      showNotificationModal('Pilihan Wajib Dipilih', 'Silakan pilih minimal satu Dimensi Profil Lulusan.', 'warning');
      return false;
    }

    // 13. Identifikasi Awal: Peserta Didik (WAJIB)
    const idPeserta = document.getElementById('identifikasiPesertaDidik');
    if (!idPeserta || !idPeserta.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Identifikasi Peserta Didik atau klik "Generate With AI" pada Identifikasi Awal.', 'warning');
      idPeserta?.focus();
      return false;
    }

    // 14. Identifikasi Awal: Materi Pembelajaran (WAJIB)
    const idMateri = document.getElementById('identifikasiMateri');
    if (!idMateri || !idMateri.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Identifikasi Materi Pembelajaran atau klik "Generate With AI" pada Identifikasi Awal.', 'warning');
      idMateri?.focus();
      return false;
    }

    // 15. Identifikasi Awal: Profil Lulusan (WAJIB)
    const idProfil = document.getElementById('identifikasiProfilLulusan');
    if (!idProfil || !idProfil.value.trim()) {
      showNotificationModal('Kolom Wajib Diisi', 'Silakan isi Dimensi Profil Lulusan pada Identifikasi Awal atau klik "Generate With AI".', 'warning');
      idProfil?.focus();
      return false;
    }
  }
  return true;
}

function goToStep(targetStep) {
  if (targetStep === currentStep) return;

  // Jika melangkah maju, validasi tahapan sebelumnya
  if (targetStep > currentStep) {
    for (let s = currentStep; s < targetStep; s++) {
      if (!validateStep(s)) return;
    }
  }

  // Tampilkan step pane yang sesuai
  for (let i = 1; i <= 3; i++) {
    const pane = document.getElementById('stepPane' + i);
    const indicator = document.getElementById('stepIndicator' + i);
    const line = document.getElementById('stepLine' + i);

    if (pane) {
      if (i === targetStep) {
        pane.style.display = 'flex';
        pane.classList.add('active');
      } else {
        pane.style.display = 'none';
        pane.classList.remove('active');
      }
    }

    if (indicator) {
      if (i === targetStep) {
        indicator.className = 'step-item active';
      } else if (i < targetStep) {
        indicator.className = 'step-item completed';
      } else {
        indicator.className = 'step-item';
      }
    }

    if (line) {
      if (i < targetStep) {
        line.classList.add('completed');
      } else {
        line.classList.remove('completed');
      }
    }
  }

  // Jika masuk ke Tahap 3: Update Ringkasan Review
  const progressContainer = document.getElementById('generateProgressContainer');
  if (targetStep === 3) {
    updateReviewSummary();
    if (progressContainer) {
      // HANYA muncul jika pengguna sudah benar-benar mengklik 'Generate Modul Ajar' pada sesi ini
      progressContainer.style.display = modulGeneratedInThisSession ? 'block' : 'none';
    }
  } else if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  currentStep = targetStep;

  // Scroll halus ke arah form agar pengguna tetap fokus
  const card = document.querySelector('.modul-card');
  if (card) {
    const rect = card.getBoundingClientRect();
    if (rect.top < 60 || rect.top > 300) {
      window.scrollTo({
        top: window.pageYOffset + rect.top - 100,
        behavior: 'smooth'
      });
    }
  }
}

/**
 * Mengumpulkan seluruh data isian formulir dari Tahap 1 dan Tahap 2
 */
function collectCurrentFormPayload() {
  const nama = document.getElementById('namaPenyusun')?.value.trim() || '';
  const institusi = document.getElementById('institusiPendidik')?.value.trim() || '';
  const tahun = document.getElementById('tahunPenyusunan')?.value.trim() || '2026';
  const jenjang = document.getElementById('jenjangSekolah')?.value || '';
  const jurusan = document.getElementById('jurusanSekolah')?.value.trim() || 'Reguler';
  const fase = document.getElementById('faseKelas')?.value || '';
  const mapel = document.getElementById('mataPelajaran')?.value.trim() || '';
  const elemenCP = document.getElementById('elemenCP')?.value.trim() || '';

  const jenisInput = document.getElementById('jenisInputKonteks')?.value || 'Topik';
  const topik = document.getElementById('isiTopikMateri')?.value.trim() || '';

  let model = document.getElementById('modelPembelajaran')?.value || 'PBL (Problem Based)';
  const rawModelSelect = model;
  const inputModelManualVal = document.getElementById('inputModelManual')?.value.trim() || '';
  if (model === 'Input Manual') {
    model = inputModelManualVal || 'Model Mandiri';
  }

  let pendekatan = document.getElementById('pendekatanPembelajaran')?.value || 'Deep Learning';
  const rawPendekatanSelect = pendekatan;
  const inputPendekatanManualVal = document.getElementById('inputPendekatanManual')?.value.trim() || '';
  if (pendekatan === 'Input Manual') {
    pendekatan = inputPendekatanManualVal || 'Pendekatan Mandiri';
  }

  const pertemuanNum = document.getElementById('jumlahPertemuan')?.value.trim() || '4';
  const matchPertemuan = pertemuanNum.match(/\d+/);
  const countPertemuanVal = matchPertemuan ? Math.min(Math.max(parseInt(matchPertemuan[0]), 1), 16) : 4;
  const pertemuan = `${countPertemuanVal} Pertemuan`;
  const durasi = document.getElementById('totalJPDurasi')?.value.trim() || `${countPertemuanVal} JP x 45 Menit (${pertemuan})`;
  const tujuan = document.getElementById('tujuanPembelajaran')?.value.trim() || '';
  const materiTambahan = document.getElementById('materiTambahan')?.value.trim() || '';
  const capaian = document.getElementById('capaianPembelajaran')?.value.trim() || '';

  const gayaBelajar = document.getElementById('gayaBelajarMurid')?.value || 'Campuran / Multimodal';
  const media = document.getElementById('mediaDigital')?.value.trim() || 'Slide Presentasi & Video Interaktif';
  const fasilitasList = typeof getSelectedFasilitasList === 'function' ? getSelectedFasilitasList() : [];
  const fasilitas = fasilitasList.length > 0 ? fasilitasList.join('; ') : 'Ruang Kelas Standar';
  const inputFasilitasLainnyaVal = document.getElementById('inputFasilitasLainnya')?.value.trim() || '';

  const idPeserta = document.getElementById('identifikasiPesertaDidik')?.value.trim() || '';
  const idMateri = document.getElementById('identifikasiMateri')?.value.trim() || '';
  const idProfil = document.getElementById('identifikasiProfilLulusan')?.value.trim() || '';

  const metodeList = Array.from(document.querySelectorAll('input[name="metodePembelajaran"]:checked')).map(cb => cb.value);
  const profilList = Array.from(document.querySelectorAll('input[name="dimensiProfil"]:checked')).map(cb => cb.value);

  const modulId = currentEditingModulId || ('modul_' + Date.now());
  if (!currentEditingModulId) {
    currentEditingModulId = modulId;
  }
  const nowIso = new Date().toISOString();

  return {
    id: modulId,
    namaPenyusun: nama,
    institusi: institusi,
    institusiPendidik: institusi,
    tahunPenyusunan: tahun,
    jenjangSekolah: jenjang,
    jurusanSekolah: jurusan,
    faseKelas: fase,
    mataPelajaran: mapel,
    elemenCP: elemenCP,
    jenisInput: jenisInput,
    jenisInputKonteks: jenisInput,
    topikMateri: topik,
    isiTopikMateri: topik,
    modelPembelajaran: model,
    modelPembelajaranSelect: rawModelSelect,
    inputModelManual: inputModelManualVal,
    pendekatanPembelajaran: pendekatan,
    pendekatanPembelajaranSelect: rawPendekatanSelect,
    inputPendekatanManual: inputPendekatanManualVal,
    metodePembelajaran: metodeList,
    jumlahPertemuan: pertemuan,
    totalJPDurasi: durasi,
    tujuanPembelajaran: tujuan,
    materiTambahan: materiTambahan,
    capaianPembelajaran: capaian,
    ringkasCP: document.getElementById('ceklisRingkasCP')?.checked || false,
    ceklisRingkasCP: document.getElementById('ceklisRingkasCP')?.checked || false,
    gayaBelajarMurid: gayaBelajar,
    mediaDigital: media,
    fasilitasBelajar: fasilitas,
    fasilitasList: fasilitasList,
    inputFasilitasLainnya: inputFasilitasLainnyaVal,
    identifikasiAwal: {
      pesertaDidik: idPeserta,
      materi: idMateri,
      profilLulusan: idProfil
    },
    identifikasiPesertaDidik: idPeserta,
    identifikasiMateri: idMateri,
    identifikasiProfilLulusan: idProfil,
    dimensiProfilLulusan: profilList,
    dimensiProfil: profilList,
    createdAt: currentEditingOriginalCreatedAt || nowIso,
    updatedAt: nowIso
  };
}

async function nextStep(target) {
  if (target === 3) {
    if (!validateStep(1) || !validateStep(2)) return;

    // Simpan otomatis formulir saat ini ke daftar riwayat modul akun guru sebagai Draft
    const draftPayload = collectCurrentFormPayload();
    draftPayload.status = 'Draft';

    try {
      await saveModulToUserAccountList(draftPayload, 'Draft');
      console.log('[Draft] Berhasil disimpan otomatis sebagai Draft:', draftPayload.id);
    } catch (e) {
      console.warn('[Draft] Gagal simpan otomatis draft:', e);
    }
  }

  goToStep(target);
}

function prevStep(target) {
  const btnUbah = document.getElementById('btnUbahKonteks');
  if (btnUbah && btnUbah.disabled) return;
  // Jika pengguna kembali untuk mengubah konteks, sembunyikan kotak hasil generate sebelumnya
  modulGeneratedInThisSession = false;
  const progressContainer = document.getElementById('generateProgressContainer');
  if (progressContainer) progressContainer.style.display = 'none';
  goToStep(target);
}

/**
 * Render Ringkasan pada Tahap 3: Review & Generate (Sesuai Gambar 3)
 */
function updateReviewSummary() {
  // 1. Informasi Pendidik
  const nama = document.getElementById('namaPenyusun')?.value.trim() || '-';
  const institusi = document.getElementById('institusiPendidik')?.value.trim() || '-';
  if (document.getElementById('reviewPenyusun')) document.getElementById('reviewPenyusun').textContent = nama;
  if (document.getElementById('reviewInstitusi')) document.getElementById('reviewInstitusi').textContent = institusi;

  // 2. Informasi Akademik
  const jenjang = document.getElementById('jenjangSekolah')?.value || '-';
  const fase = document.getElementById('faseKelas')?.value || '-';
  const jurusan = document.getElementById('jurusanSekolah')?.value.trim() || 'Reguler';
  const mapel = document.getElementById('mataPelajaran')?.value.trim() || '-';

  if (document.getElementById('reviewJenjangFase')) {
    document.getElementById('reviewJenjangFase').textContent = `${jenjang} / ${fase}`;
  }
  if (document.getElementById('reviewJurusan')) {
    document.getElementById('reviewJurusan').textContent = jurusan;
  }
  if (document.getElementById('reviewMapel')) {
    document.getElementById('reviewMapel').textContent = mapel;
  }

  const rawPertemuan = document.getElementById('jumlahPertemuan')?.value.trim() || '4';
  const rawJP = document.getElementById('totalJPDurasi')?.value.trim() || '';
  if (document.getElementById('reviewPertemuan')) {
    const matchNum = rawPertemuan.match(/\d+/);
    const countNum = matchNum ? matchNum[0] : rawPertemuan;
    document.getElementById('reviewPertemuan').textContent = `${countNum} Pertemuan`;
  }
  if (document.getElementById('reviewTotalJP')) {
    document.getElementById('reviewTotalJP').textContent = rawJP || `${rawPertemuan} JP x 45 Menit (${rawPertemuan} Pertemuan)`;
  }

  // 3. Konteks Pembelajaran
  const elemenRaw = document.getElementById('elemenCP')?.value.trim() || '-';
  const elemenList = elemenRaw.split(/[;,\n]/).map(s => s.trim()).filter(Boolean);
  const elemenContainer = document.getElementById('reviewElemenCPList');
  if (elemenContainer) {
    if (elemenList.length > 0) {
      elemenContainer.innerHTML = `<ul class="review-bullet-list">${elemenList.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    } else {
      elemenContainer.innerHTML = '<span class="review-val">-</span>';
    }
  }

  const topik = document.getElementById('isiTopikMateri')?.value.trim() || '-';
  if (document.getElementById('reviewTopikMateri')) {
    document.getElementById('reviewTopikMateri').textContent = topik;
  }

  let model = document.getElementById('modelPembelajaran')?.value || 'PBL (Problem Based)';
  if (model === 'Input Manual') {
    model = document.getElementById('inputModelManual')?.value.trim() || 'Model Mandiri';
  }

  let pendekatan = document.getElementById('pendekatanPembelajaran')?.value || 'Deep Learning';
  if (pendekatan === 'Input Manual') {
    pendekatan = document.getElementById('inputPendekatanManual')?.value.trim() || 'Pendekatan Mandiri';
  }

  if (document.getElementById('reviewModelPendekatan')) {
    document.getElementById('reviewModelPendekatan').textContent = `${model} (${pendekatan})`;
  }

  const metodeCheckboxes = document.querySelectorAll('input[name="metodePembelajaran"]:checked');
  const metodeList = Array.from(metodeCheckboxes).map(cb => cb.value);
  const metodeText = metodeList.length > 0 ? metodeList.join(', ') : '-';
  if (document.getElementById('reviewMetodeText')) {
    document.getElementById('reviewMetodeText').textContent = metodeText;
  }

  // 4. Capaian Pembelajaran
  const cp = document.getElementById('capaianPembelajaran')?.value.trim() || 'Pada akhir fase, peserta didik memiliki kemampuan komprehensif pada elemen pembelajaran.';
  if (document.getElementById('reviewCPNarrative')) {
    document.getElementById('reviewCPNarrative').textContent = cp;
  }
}

/**
 * Konfirmasi Generate Modul Ajar (Buka Popup)
 */
function confirmGenerateModul() {
  const modal = document.getElementById('confirmGenerateModal');
  if (modal) {
    modal.classList.add('active');
  }
}

/**
 * Tutup Popup Konfirmasi Generate
 */
function closeConfirmGenerateModal() {
  const modal = document.getElementById('confirmGenerateModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function closeConfirmModalOnOverlay(e) {
  if (e.target.id === 'confirmGenerateModal') {
    closeConfirmGenerateModal();
  }
}

/**
 * Helper: Scroll kartu ke layar dengan jarak lega dari tepi bawah jendela browser
 */
function scrollCardIntoViewWithGap(element, gapBottom = 70) {
  if (!element) return;
  setTimeout(() => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = scrollTop + rect.bottom - window.innerHeight + gapBottom;
    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });
  }, 100);
}

/**
 * Eksekusi Generate Modul Ajar Setelah Setuju di Popup
 */
async function proceedGenerateModul() {
  closeConfirmGenerateModal();

  const curUser = getCurrentUser();
  const curEmail = (curUser?.email || '').trim().toLowerCase();
  const isAdm = curUser?.role === 'Admin' || (typeof ADMIN_EMAIL !== 'undefined' && curEmail === ADMIN_EMAIL.toLowerCase());
  const activeFeatures = Array.isArray(curUser?.features) ? curUser.features : [];
  if (!isAdm && !activeFeatures.includes('generate_modul_ajar')) {
    alert("Akses Fitur Dinonaktifkan: Hak akses fitur Pembuatan Modul Ajar saat ini dinonaktifkan oleh Administrator untuk akun Anda.");
    window.location.replace("../../dashboard-pengguna/daftar-modul-ajar.html");
    return;
  }

  // Validasi: Pastikan Kunci API Google Gemini sudah tersimpan di akun pengguna
  const activeApiKey = getEffectiveApiKey();
  if (!activeApiKey) {
    showNotificationModal(
      'Kunci API Belum Disimpan',
      'Fitur <strong>Generate Modul Ajar</strong> memerlukan API Key Google Gemini pada akun Anda.<br><br>Silakan buka menu <a href="../../dashboard-pengguna/api-key.html" style="color:#2563eb;font-weight:700;text-decoration:underline;">Kunci API</a> dan simpan API Key Google Gemini resmi Anda terlebih dahulu.',
      'warning'
    );
    return;
  }

  // Kumpulkan Seluruh Data Lengkap dari Tahap 1 dan Tahap 2
  const modulPayload = collectCurrentFormPayload();

  // Tampilkan Indikator Loading di Bawah Tombol
  const progressContainer = document.getElementById('generateProgressContainer');
  const progressLoading = document.getElementById('progressStateLoading');
  const progressSuccess = document.getElementById('progressStateSuccess');
  const btnGenerate = document.getElementById('btnGenerateModul');
  const btnUbahKonteks = document.getElementById('btnUbahKonteks');

  if (btnGenerate) {
    btnGenerate.disabled = true;
  }
  if (btnUbahKonteks) {
    btnUbahKonteks.disabled = true;
    btnUbahKonteks.style.opacity = '0.5';
    btnUbahKonteks.style.cursor = 'not-allowed';
  }

  if (progressContainer && progressLoading && progressSuccess) {
    modulGeneratedInThisSession = true;
    window._modulGenerateStartTime = Date.now();
    progressContainer.style.display = 'block';
    progressLoading.style.display = 'flex';
    progressSuccess.style.display = 'none';

    // Scroll halus ke container progress dengan jarak lega dari tepi bawah jendela browser
    scrollCardIntoViewWithGap(progressContainer, 70);

    // Inisialisasi indikator progres & teks proses generate
    const barEl = document.getElementById('generateProgressBar');
    const percentEl = document.getElementById('generatePercentText');
    const stepTextEl = document.getElementById('generateProgressStepText');

    if (barEl) barEl.style.width = '15%';
    if (percentEl) percentEl.textContent = '15%';
    if (stepTextEl) stepTextEl.textContent = 'Menghubungkan ke Google Gemini API...';

    const progressSteps = [
      { p: 25, text: 'Menganalisis parameter pembelajaran dan menyusun master prompt...' },
      { p: 45, text: 'Google Gemini sedang merumuskan tujuan & sintaks pembelajaran...' },
      { p: 70, text: 'Menyusun alur pengalaman belajar, materi deskriptif & LKPD per pertemuan...' },
      { p: 88, text: 'Sedang memproses perumusan & verifikasi struktur dokumen...' }
    ];
    let stepIndex = 0;
    let currentPct = 15;

    // Interval progres berjalan halus, dibatasi maksimal 92% selama AI masih bekerja
    const progressTimer = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const item = progressSteps[stepIndex];
        currentPct = item.p;
        if (barEl) barEl.style.width = currentPct + '%';
        if (percentEl) percentEl.textContent = currentPct + '%';
        if (stepTextEl) stepTextEl.textContent = item.text;
        stepIndex++;
      } else if (currentPct < 92) {
        currentPct += 1;
        if (barEl) barEl.style.width = currentPct + '%';
        if (percentEl) percentEl.textContent = currentPct + '%';
      }
    }, 1500);

    let aiContent = null;
    try {
      // Panggil AI dengan batas waktu 60 detik (Promise.race)
      const AI_MAX_TIMEOUT_MS = 60000;
      aiContent = await Promise.race([
        generateFullModulWithAI(modulPayload),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Batas waktu koneksi Google Gemini (60 detik) terlampaui. Silakan coba klik Generate lagi.')), AI_MAX_TIMEOUT_MS)
        )
      ]);
    } catch (e) {
      console.warn('[Generate] Google Gemini API error:', e);
      const errMsg = e?.message || '';
      const isAuthError = errMsg.includes('401') || errMsg.includes('tidak valid') || errMsg.includes('Kunci API belum disimpan');

      if (isAuthError) {
        clearInterval(progressTimer);
        if (progressContainer) progressContainer.style.display = 'none';
        if (btnGenerate) btnGenerate.disabled = false;
        if (btnUbahKonteks) {
          btnUbahKonteks.disabled = false;
          btnUbahKonteks.style.opacity = '1';
          btnUbahKonteks.style.cursor = 'pointer';
        }
        showNotificationModal(
          'Kunci API Diperlukan',
          `Google Gemini belum berhasil menyusun Modul Ajar: <strong>${errMsg}</strong>.<br><br>Silakan periksa dan perbarui Kunci API Google Gemini Anda di menu Kunci API.`,
          'error'
        );
        return;
      }

      // JIKA RATE LIMIT (HTTP 429) ATAU TIMEOUT:
      // Aktifkan generator sintesis komprehensif berbasis seluruh data input Tahap 1 & 2!
      // Pengguna tidak terhambat popup error, dokumen tetap selesai 100% utuh & kontekstual!
      if (stepTextEl) stepTextEl.textContent = 'Menyusun dokumen Modul Ajar terintegrasi...';
      const countMatch = (modulPayload.jumlahPertemuan || '4').match(/\d+/);
      const targetCount = countMatch ? Math.min(Math.max(parseInt(countMatch[0]), 1), 16) : 4;
      aiContent = buildComprehensiveAiModulContent(modulPayload);
      ensureCompleteMeetings(aiContent, targetCount, modulPayload);
      ensureCompleteSections(aiContent, modulPayload);
      // Dokumen tetap selesai 100% utuh & kontekstual berbasis input guru
    } finally {
      clearInterval(progressTimer);
    }

    if (!aiContent) {
      throw new Error('Google Gemini API tidak mengembalikan konten modul.');
    }

    modulPayload.aiGeneratedContent = aiContent;

    // AI selesai menyusun, perbarui indikator ke tahap finalisasi penyimpanan lokal (95%)
    if (barEl) barEl.style.width = '95%';
    if (percentEl) percentEl.textContent = '95%';
    if (stepTextEl) stepTextEl.textContent = 'Menyimpan dokumen Modul Ajar dan menyiapkan dokumen...';

    // 1. Simpan sesi aktif modul secara aman ke localStorage
    try {
      modulPayload.status = 'Lengkap';
      const payloadStr = JSON.stringify(modulPayload);
      safeSetLocalStorage('edu_last_modul_payload', payloadStr);
      safeSetLocalStorage('edu_current_generated_modul', payloadStr);
      safeSetLocalStorage('edu_editing_modul_payload', payloadStr);
    } catch (errStorage) {
      console.warn('[Storage] Gagal simpan sesi modul:', errStorage);
    }

    // 2. Simpan instan ke daftar riwayat akun guru di localStorage
    try {
      let curUser = null;
      try {
        const rawU = localStorage.getItem(CURRENT_USER_KEY);
        if (rawU) curUser = JSON.parse(rawU);
      } catch (eU) {}
      const userEmail = (curUser && curUser.email) ? curUser.email.trim().toLowerCase() : 'guest';
      const listKey = `edu_modul_list_${userEmail}`;
      let localList = [];
      try {
        const rawL = localStorage.getItem(listKey);
        if (rawL) localList = JSON.parse(rawL);
      } catch (eL) { localList = []; }

      const modulId = modulPayload.id || ('modul_' + Date.now());
      modulPayload.id = modulId;
      const namaTopik = (modulPayload.topikMateri || modulPayload.isiTopikMateri || 'Topik Pembelajaran').trim();
      const namaJurusan = (modulPayload.jurusanSekolah || 'Reguler').trim();
      const nowD = new Date();
      const monthsD = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      const itemRecord = {
        id: modulId,
        userEmail: userEmail,
        namaModul: `${namaTopik} - ${namaJurusan}`,
        topikMateri: namaTopik,
        jurusanSekolah: namaJurusan,
        mataPelajaran: modulPayload.mataPelajaran || 'Mata Pelajaran',
        jenjangSekolah: modulPayload.jenjangSekolah || 'SMA / MA',
        jenjang: modulPayload.jenjangSekolah || 'SMA / MA',
        faseKelas: modulPayload.faseKelas || 'Fase E (Kelas 10 SMA/MA)',
        status: 'Lengkap',
        createdAt: modulPayload.createdAt || nowD.toISOString(),
        updatedAt: nowD.toISOString(),
        updatedAtFormatted: `${String(nowD.getDate()).padStart(2, '0')} ${monthsD[nowD.getMonth()]} ${nowD.getFullYear()}, ${String(nowD.getHours()).padStart(2, '0')}:${String(nowD.getMinutes()).padStart(2, '0')}`,
        payload: modulPayload
      };
      const exIdx = localList.findIndex(x => x.id === modulId);
      if (exIdx !== -1) {
        localList[exIdx] = itemRecord;
      } else {
        localList.unshift(itemRecord);
      }
      safeSetLocalStorage(listKey, JSON.stringify(localList));
    } catch (eList) {
      console.warn('[List Local] Warning:', eList);
    }

    // 3. SEMUA DATA SIAP — SEKARANG SET TEPAT 100% DAN LANGSUNG PINDAH KE TAMPILAN SUKSES!
    if (barEl) barEl.style.width = '100%';
    if (percentEl) percentEl.textContent = '100%';
    if (stepTextEl) stepTextEl.textContent = 'Selesai! Modul Ajar berhasil disusun.';

    // Jeda transisi 200ms agar animasi bar 100% terlihat mulus lalu tampilkan tombol "Buka Modul Ajar"
    setTimeout(() => {
      try {
        if (progressLoading) progressLoading.style.display = 'none';
        if (progressSuccess) progressSuccess.style.display = 'flex';

        // Scroll halus ke kartu hasil agar tombol Buka Modul Ajar terlihat nyaman dengan jarak di bawah layar
        scrollCardIntoViewWithGap(progressContainer, 70);

        // Notifikasi hasil generate
        if (window._lastGeminiAuthFailed) {
          showNotificationModal(
            'Modul Ajar Tersimpan (Mode Cadangan)',
            'Modul ajar telah selesai disusun. Namun Kunci API Google Gemini Anda terdeteksi belum aktif / ditolak (HTTP 401). Silakan simpan Kunci API resmi terbaru Anda di menu API Key agar berikutnya di-generate langsung secara live oleh Google Gemini.',
            'warning'
          );
          window._lastGeminiAuthFailed = false;
        } else {
          showNotificationModal('Generate Sukses', 'Modul Ajar telah berhasil disusun dan disimpan!', 'success');
        }
      } catch (errUi) {
        console.warn('[UI] Transisi sukses warning:', errUi);
      } finally {
        // Aktifkan kembali tombol Generate Modul Ajar dan Ubah Konteks
        if (btnGenerate) {
          btnGenerate.disabled = false;
        }
        if (btnUbahKonteks) {
          btnUbahKonteks.disabled = false;
          btnUbahKonteks.style.opacity = '1';
          btnUbahKonteks.style.cursor = 'pointer';
        }
      }
    }, 200);

    // 4. Sinkronisasi ke Supabase Database Server berjalan di BACKGROUND (non-blocking)
    // Tidak akan pernah menahan tampilan atau membuat UI guru macet
    saveModulToUserAccountList(modulPayload, 'Lengkap').catch(errList => {
      console.warn('[Background Sync] Gagal sinkron ke database server:', errList);
    });
  } else {
    if (btnGenerate) {
      btnGenerate.disabled = false;
    }
    if (btnUbahKonteks) {
      btnUbahKonteks.disabled = false;
      btnUbahKonteks.style.opacity = '1';
      btnUbahKonteks.style.cursor = 'pointer';
    }
  }
}

/**
 * Ekstraktor Bagian JSON Secara Granular (Fallback jika JSON utuh mengalami cacat tanda baca lokal)
 */
function extractSectionsManually(text) {
  if (!text || typeof text !== 'string') return null;
  const result = {};

  function extractChunk(keyName, isArray) {
    const regex = new RegExp(`["']${keyName}["']\\s*:\\s*([\\{\\[])`);
    const match = text.match(regex);
    if (!match) return null;

    const startIdx = match.index + match[0].length - 1;
    const opener = match[1];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let inStr = false;
    let esc = false;

    for (let i = startIdx; i < text.length; i++) {
      const c = text[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (c === opener) depth++;
        else if (c === closer) {
          depth--;
          if (depth === 0) {
            const rawChunk = text.slice(startIdx, i + 1);
            try {
              return JSON.parse(rawChunk);
            } catch (e) {
              const cleanChunk = rawChunk
                .replace(/,\s*([\}\]])/g, '$1')
                .replace(/\/\*[\s\S]*?\*\//g, '');
              try {
                return JSON.parse(cleanChunk);
              } catch (e2) {}
            }
            break;
          }
        }
      }
    }
    return null;
  }

  function extractStringChunk(keyName) {
    const regex = new RegExp(`["']${keyName}["']\\s*:\\s*"([\\s\\S]*?)"(?=\\s*[,\\}])`);
    const match = text.match(regex);
    return match ? match[1] : '';
  }

  result.desainPembelajaran = extractChunk('desainPembelajaran', false);
  result.pengalamanBelajar = extractChunk('pengalamanBelajar', true);
  result.identifikasiPesertaDidik = extractChunk('identifikasiPesertaDidik', true);
  result.identifikasiMateri = extractChunk('identifikasiMateri', true);
  result.dimensiProfil = extractChunk('dimensiProfil', true);
  result.asesmen = extractChunk('asesmen', true);
  result.refleksi = extractChunk('refleksi', false);
  result.lkpd = extractChunk('lkpd', false);
  result.rubrikPenilaian = extractChunk('rubrikPenilaian', true);
  result.glosarium = extractChunk('glosarium', true);
  result.daftarPustaka = extractChunk('daftarPustaka', true);
  result.materiAjarDeskriptif = extractStringChunk('materiAjarDeskriptif') || '';
  result.pengayaan = extractStringChunk('pengayaan') || '';
  result.remedial = extractStringChunk('remedial') || '';

  if (result.desainPembelajaran && Array.isArray(result.pengalamanBelajar) && result.pengalamanBelajar.length > 0) {
    return result;
  }
  return null;
}

/**
 * Parser JSON AI Berketahanan Tinggi (Robust JSON Parser)
 * Mampu membersihkan markdown wrapper, komentar C-style, trailing comma, unescaped control chars,
 * serta secara cerdas memperbaiki penutupan kurung jika terpotong batas token.
 */
function robustParseAiJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let text = rawText.trim();

  // 1. Coba parse langsung jika output sudah JSON murni valid
  try {
    return JSON.parse(text);
  } catch (e) {}

  // 2. Bersihkan markdown code fence jika ada
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (mdMatch && mdMatch[1]) {
    try {
      return JSON.parse(mdMatch[1].trim());
    } catch (e) {}
    text = mdMatch[1].trim();
  }

  // 3. Ekstrak substring dari kurung kurawal pertama hingga terakhir
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let sub = text.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(sub);
    } catch (e) {}

    // Bersihkan komentar multi-baris /* ... */ (JANGAN hapus // karena bisa memotong URL https://)
    let cleaned = sub.replace(/\/\*[\s\S]*?\*\//g, '');
    // Bersihkan trailing comma sebelum } atau ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    try {
      return JSON.parse(cleaned);
    } catch (e) {}

    // Perbaiki literal newlines dan karakter kontrol di dalam string JSON
    let inStr = false;
    let isEsc = false;
    let fixed = '';
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (isEsc) {
        fixed += c;
        isEsc = false;
        continue;
      }
      if (c === '\\') {
        fixed += c;
        isEsc = true;
        continue;
      }
      if (c === '"') {
        inStr = !inStr;
        fixed += c;
        continue;
      }
      if (inStr) {
        if (c === '\n') fixed += '\\n';
        else if (c === '\r') {}
        else if (c === '\t') fixed += '\\t';
        else if (c.charCodeAt(0) < 32) {}
        else fixed += c;
      } else {
        fixed += c;
      }
    }

    try {
      return JSON.parse(fixed);
    } catch (e) {}
  }

  // 4. Fallback: Ekstraksi independen per blok JSON modul
  try {
    const sectionObj = extractSectionsManually(rawText);
    if (sectionObj) {
      console.log('[Robust JSON] Berhasil mengekstrak bagian modul secara modular.');
      return sectionObj;
    }
  } catch (errSec) {
    console.warn('[Robust JSON] Ekstraksi granular warning:', errSec);
  }

  return null;
}

/**
 * Panggil Google Gemini AI: SINGLE MASTER PROMPT — seluruh data form dikonsolidasikan
 * menjadi SATU objek inputData, lalu diproses dalam SATU prompt utama.
 *
 * Alur: Form Input → inputData Object → Master Prompt → AI API → JSON Output
 *
 * TIDAK ADA data dari generate sebelumnya yang dimasukkan ke prompt ini.
 * Setiap kali dipanggil selalu membangun ulang prompt dari data form terbaru.
 */
async function generateFullModulWithAI(modulPayload) {
  // ========================================================================
  // STEP 1: KONSOLIDASI SELURUH DATA INPUT FORM TERBARU
  // Semua data dibaca dari modulPayload (yang sudah mencerminkan state form
  // saat tombol Generate diklik — bukan dari output generate sebelumnya).
  // ========================================================================
  const p = modulPayload;

  // --- Identitas & Konteks ---
  const institusi       = p.institusi || p.institusiPendidik || '-';
  const penyusun        = p.namaPenyusun || '-';
  const tahun           = p.tahunPenyusunan || '2026';
  const jenjang         = p.jenjangSekolah || '-';
  const jurusan         = p.jurusanSekolah || 'Reguler';
  const fase            = p.faseKelas || '-';
  const mapel           = p.mataPelajaran || '-';
  const elemenCP        = p.elemenCP || '-';
  const jenisInput      = p.jenisInput || p.jenisInputKonteks || 'Topik';
  const topik           = p.topikMateri || p.isiTopikMateri || '-';

  // --- Model, Pendekatan & Metode ---
  const model           = p.modelPembelajaran || 'Problem Based Learning (PBL)';
  const pendekatan      = p.pendekatanPembelajaran || 'Deep Learning';
  const metodeArr       = Array.isArray(p.metodePembelajaran)
    ? p.metodePembelajaran.filter(Boolean)
    : (p.metodePembelajaran ? [p.metodePembelajaran] : ['Diskusi Kelompok']);
  const metode          = metodeArr.join(', ') || 'Ceramah Interaktif, Diskusi Kelompok';

  // --- Alokasi Waktu ---
  const jumlahPertemuan = p.jumlahPertemuan || '4 Pertemuan';
  const matchNum = (jumlahPertemuan || '4').match(/\d+/);
  const targetPertemuanCount = matchNum ? Math.min(Math.max(parseInt(matchNum[0]), 1), 16) : 4;
  const totalJP         = p.totalJPDurasi || `${targetPertemuanCount} JP x 45 Menit (${targetPertemuanCount} Pertemuan)`;

  // --- Tujuan, CP, Materi Tambahan ---
  const tujuanPembelajaran = p.tujuanPembelajaran || '-';
  const capaianPembelajaran = p.capaianPembelajaran || '-';
  const materiTambahan  = p.materiTambahan || '-';

  // --- Analisis Kebutuhan ---
  const gayaBelajar     = p.gayaBelajarMurid || 'Campuran / Multimodal';
  const media           = p.mediaDigital || '-';
  const fasilitasList   = Array.isArray(p.fasilitasList) && p.fasilitasList.length > 0
    ? p.fasilitasList
    : (p.fasilitasBelajar ? p.fasilitasBelajar.split(/[;,]/).map(s => s.trim()).filter(Boolean) : ['Ruang Kelas']);
  const fasilitas       = fasilitasList.join(', ');

  // --- Dimensi Profil Lulusan ---
  const dimensiArr      = Array.isArray(p.dimensiProfilLulusan || p.dimensiProfil)
    ? (p.dimensiProfilLulusan || p.dimensiProfil).filter(Boolean)
    : [];
  const dimensi         = dimensiArr.length > 0 ? dimensiArr.join(', ') : 'Penalaran Kritis, Kreativitas';

  // --- Identifikasi Awal (teks yang diisi guru atau di-generate AI per-field) ---
  const idAwal          = p.identifikasiAwal || {};
  const idPeserta       = p.identifikasiPesertaDidik || idAwal.pesertaDidik || '-';
  const idMateri        = p.identifikasiMateri || idAwal.materi || '-';
  const idProfil        = p.identifikasiProfilLulusan || idAwal.profilLulusan || '-';

  // --- Klasifikasi Model & Pendekatan Pembelajaran ---
  const mLower = model.toLowerCase();
  const pLower = (pendekatan || '').toLowerCase();
  const isPjBL        = mLower.includes('project') || mLower.includes('pjbl') || mLower.includes('proyek');
  const isPBL         = !isPjBL && (mLower.includes('problem') || mLower.includes('pbl'));
  const isInquiry     = !isPjBL && !isPBL && (mLower.includes('inquiry') || mLower.includes('inkuiri') || mLower.includes('penyelidikan'));
  const isDiscovery   = !isPjBL && !isPBL && !isInquiry && (mLower.includes('discovery') || mLower.includes('penemuan'));
  const isTeFa        = mLower.includes('tefa') || mLower.includes('teaching factory');
  const isCooperative = mLower.includes('cooperative') || mLower.includes('kooperatif');

  let modelKlasifikasi = '';
  if (isPjBL) {
    modelKlasifikasi = `MODEL PROJECT BASED LEARNING (PjBL). WAJIB: Seluruh pengalaman belajar, penugasan LKPD, dan asesmen HARUS berbasis perancangan dan PEMBUATAN PRODUK / KARYA NYATA yang langsung berkaitan dengan "${topik}". Terapkan 6 sintaks resmi PjBL: (1) Menentukan Pertanyaan Mendasar, (2) Mendesain Perencanaan Proyek, (3) Menyusun Jadwal, (4) Memonitor Kemajuan Proyek, (5) Menguji Hasil, (6) Mengevaluasi Pengalaman.`;
  } else if (isPBL) {
    modelKlasifikasi = `MODEL PROBLEM BASED LEARNING (PBL). WAJIB: Seluruh pengalaman belajar HARUS berorientasi pada pemecahan masalah otentik dan studi kasus nyata yang spesifik untuk topik "${topik}". Terapkan 5 sintaks PBL: (1) Orientasi Masalah, (2) Mengorganisasi Murid untuk Belajar, (3) Membimbing Penyelidikan, (4) Mengembangkan Karya Solutif, (5) Menganalisis & Mengevaluasi.`;
  } else if (isInquiry) {
    modelKlasifikasi = `MODEL INQUIRY BASED LEARNING. WAJIB: Seluruh pengalaman belajar HARUS berbasis penyelidikan ilmiah mandiri dan terstruktur terkait "${topik}". Terapkan sintaks Inquiry: (1) Orientasi Masalah & Merumuskan Pertanyaan Penyelidikan, (2) Merumuskan Hipotesis, (3) Pengumpulan Data / Eksplorasi Eksperimen, (4) Pengujian Hipotesis, (5) Penarikan Kesimpulan (Generalisasi).`;
  } else if (isDiscovery) {
    modelKlasifikasi = `MODEL DISCOVERY LEARNING. WAJIB: Seluruh pengalaman belajar HARUS berbasis penemuan konsep terbimbing terkait "${topik}". Terapkan 6 sintaks Discovery: (1) Pemberian Rangsangan (Stimulasi), (2) Identifikasi Masalah, (3) Pengumpulan Data, (4) Pengolahan Data, (5) Pembuktian (Verifikasi), (6) Menarik Simpulan (Generalisasi).`;
  } else if (isTeFa) {
    modelKlasifikasi = `MODEL TEACHING FACTORY (TeFa). WAJIB: Seluruh pengalaman belajar HARUS berbasis simulasi industri nyata — dari job sheet, produksi, quality control, hingga delivery produk terkait "${topik}".`;
  } else if (isCooperative) {
    modelKlasifikasi = `MODEL COOPERATIVE LEARNING. WAJIB: Seluruh pengalaman belajar HARUS berbasis kerja tim terstruktur dengan teknik kooperatif (Think-Pair-Share, Jigsaw, atau STAD) yang spesifik untuk materi "${topik}".`;
  } else {
    modelKlasifikasi = `MODEL PEMBELAJARAN: ${model}. WAJIB: Seluruh pengalaman belajar harus konsisten menerapkan sintaks, ciri khas, dan filosofi model "${model}" secara komprehensif untuk topik "${topik}".`;
  }

  let pendekatanPetunjuk = '';
  if (pLower.includes('deep learning')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: Deep Learning. Terapkan prinsip: Mindful (berkesadaran), Meaningful (bermakna), dan Joyful (menggembirakan).`;
  } else if (pLower.includes('tpack')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: TPACK (Technological Pedagogical Content Knowledge). Integrasikan pemanfaatan teknologi (${media}), strategi pedagogis aktif, dan konten materi (${topik}) secara harmonis di setiap tahapan pembelajaran. DILARANG KERAS memunculkan teks "Prinsip Deep Learning" di output karena guru memilih pendekatan TPACK!`;
  } else if (pLower.includes('saintifik') || pLower.includes('scientific')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: Saintifik (5M). Integrasikan tahapan Mengamati, Menanya, Mengumpulkan Data/Informasi, Mengasosiasi/Menalar, dan Mengomunikasikan. DILARANG memunculkan "Prinsip Deep Learning"!`;
  } else if (pLower.includes('kontekstual') || pLower.includes('ctl')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: Kontekstual (Contextual Teaching and Learning / CTL). Hubungkan materi secara nyata dengan pengalaman otentik dan dunia kerja murid. DILARANG memunculkan "Prinsip Deep Learning"!`;
  } else if (pLower.includes('stem') || pLower.includes('steam')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: STEAM. Integrasikan sains, teknologi, rekayasa, seni, dan matematika ke dalam pemecahan masalah ${topik}. DILARANG memunculkan "Prinsip Deep Learning"!`;
  } else if (pendekatan && pendekatan !== '-' && !pLower.includes('reguler')) {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: ${pendekatan}. Terapkan prinsip pendekatan ${pendekatan} secara nyata. DILARANG memunculkan "Prinsip Deep Learning" jika tidak dipilih oleh guru!`;
  } else {
    pendekatanPetunjuk = `PENDEKATAN PEMBELAJARAN: Pembelajaran Aktif Berpusat pada Murid (Student-Centered). DILARANG memunculkan "Prinsip Deep Learning" jika tidak dipilih!`;
  }

  // ========================================================================
  // STEP 2: BANGUN SATU MASTER PROMPT SECARA DINAMIS
  // ========================================================================
  const inputFingerprint = [topik, model, pendekatan, metode, targetPertemuanCount, mapel, dimensi, tujuanPembelajaran.slice(0, 80)]
    .join('|').replace(/\s+/g, '_').slice(0, 120);
  const generateTimestamp = new Date().toISOString();

  const masterPrompt = `[SESI GENERATE BARU: ${generateTimestamp} | INPUT: ${inputFingerprint}]

Anda adalah Dewan Pakar Pengembang Kurikulum Merdeka Terkemuka (BSKAP Kemendikbudristek).
Tugas Anda: Susun DOKUMEN MODUL AJAR KURIKULUM MERDEKA secara SANGAT LENGKAP, MENDALAM, dan 100% KONTEKSTUAL KHUSUS UNTUK KOMBINASI DATA INPUT BERIKUT.

PENTING: SELURUH output yang Anda hasilkan HARUS berbeda secara substantif dari output sebelumnya karena data input ini UNIK. Jangan mengulang pola kalimat yang sama.

=============================================================================
SELURUH DATA INPUT GURU (FORM 3 TAHAPAN — KONSOLIDASI TUNGGAL):
=============================================================================

TAHAP 1 — IDENTITAS & MODEL PEMBELAJARAN:
- Satuan Pendidikan / Institusi : ${institusi}
- Nama Pendidik                 : ${penyusun}
- Tahun Penyusunan              : ${tahun}
- Jenjang Sekolah               : ${jenjang}
- Jurusan / Program Keahlian    : ${jurusan}
- Fase & Kelas                  : ${fase}
- Mata Pelajaran                : ${mapel}
- Elemen Capaian Pembelajaran   : ${elemenCP}
- Jenis Input Konteks           : ${jenisInput}
- ${jenisInput} / Materi Pokok  : ${topik}
- Model Pembelajaran            : ${model}
- Pendekatan Pembelajaran        : ${pendekatan}
- Metode Pembelajaran           : ${metode}
- Alokasi Waktu                 : ${totalJP} (${targetPertemuanCount} Pertemuan)
- Media Digital yang Digunakan  : ${media}
- Gaya Belajar Mayoritas Murid  : ${gayaBelajar}
- Sarana / Fasilitas Belajar    : ${fasilitas}

TAHAP 2 — KONTEKS & IDENTIFIKASI AWAL:
- Capaian Pembelajaran (CP)     : ${capaianPembelajaran}
- Tujuan Pembelajaran (TP)      : 
${tujuanPembelajaran}
- Materi Tambahan / Pengayaan   : ${materiTambahan}
- Dimensi Profil Lulusan Target : ${dimensi}
- Identifikasi Peserta Didik    : ${idPeserta}
- Identifikasi Materi Pembelajaran: ${idMateri}
- Identifikasi Profil Lulusan   : ${idProfil}

=============================================================================
INSTRUKSI MODEL & PENDEKATAN PEMBELAJARAN (WAJIB DITERAPKAN SECARA KETAT):
=============================================================================
${modelKlasifikasi}
${pendekatanPetunjuk}
METODE PEMBELAJARAN: "${metode}". Seluruh skenario aktivitas pembelajaran di kelas HARUS mencerminkan penerapan metode "${metode}".

=============================================================================
ATURAN WAJIB DAN MENGIKAT — PELANGGARAN TIDAK DIIZINKAN:
=============================================================================
1. LARANGAN KERAS TEMPLATE GENERIK:
   - DILARANG SAMA SEKALI menggunakan kalimat template statis atau placeholder umum.
   - Setiap kalimat, skenario, sub-topik, tugas LKPD, instrumen asesmen, refleksi, glosarium, dan referensi pustaka HARUS spesifik, konkret, dan kontekstual KHUSUS untuk kombinasi:
     * ${jenisInput}: "${topik}"
     * Mata Pelajaran: "${mapel}"
     * Jenjang: "${jenjang}" / Jurusan: "${jurusan}"
     * Model: "${model}"
     * Pendekatan: "${pendekatan}"
     * Metode: "${metode}"

2. KESESUAIAN TUJUAN PEMBELAJARAN:
   - Seluruh aktivitas guru, aktivitas murid, penugasan LKPD, dan asesmen WAJIB secara langsung mengacu dan menjabarkan Tujuan Pembelajaran (TP) yang telah diisi oleh guru di atas.
   - Jika TP memuat kompetensi spesifik (misalnya: analisis desain karakter, pengujian produk, penghitungan BEP, dsb.), maka SELURUH penugasan dalam modul HARUS mengarah ke penguasaan kompetensi tersebut.

3. DISTRIBUSI PERTEMUAN DAN SINTAKS PEMBELAJARAN (SANGAT PENTING):
   - WAJIB hasilkan pengalaman belajar sejumlah TEPAT ${targetPertemuanCount} PERTEMUAN (Pertemuan 1 sampai Pertemuan ${targetPertemuanCount}) pada array "pengalamanBelajar".
   - Alokasi waktu setiap pertemuan mengacu pada: ${totalJP}.
   - SINTAKS MODEL PEMBELAJARAN HANYA BERADA DI KEGIATAN INTI!
   - DILARANG KERAS menempatkan sintaks model pada Tahap Awal atau Tahap Penutup!
   - Distribusi Sintaks Model "${model}":
     * Jika 1 pertemuan: Seluruh tahapan sintaks model dilaksanakan secara berurutan dan tuntas di Kegiatan Inti Pertemuan 1.
     * Jika multi-pertemuan (${targetPertemuanCount} pertemuan): Distribusikan tahapan sintaks model secara progresif dan proporsional antar-pertemuan. Setiap pertemuan memuat sintaks yang relevan (misal P1 untuk perumusan masalah/perancangan, P2 untuk eksekusi/produksi, P3 untuk pengujian kualitas, P4 untuk gelar karya/evaluasi).
   - Di Kegiatan Inti, SETIAP TAHAP SINTAKS DIBUAT TERPISAH dalam array "inti". Setiap sintaks WAJIB memiliki:
     1. "sintaks": Nama tahap/sintaks model yang jelas (contoh: "Sintaks 1: Penentuan Pertanyaan Mendasar (Start with Essential Question)").
     2. "waktu": Alokasi waktu spesifik sintaks tersebut (contoh: "30 Menit").
     3. "aktivitasGuru": Array poin aksi guru khusus untuk sintaks tersebut.
     4. "aktivitasMurid": Array poin aksi murid khusus untuk sintaks tersebut.
     5. "integrasiPendekatan": Catatan integrasi pendekatan "${pendekatan}" dan metode "${metode}" pada sintaks ini.

4. FORMAT AKTIVITAS GURU & MURID — BAHASA TEKNOLOGI PENDIDIKAN & PEDAGOGI BAKU:
   - Tahap Awal: HANYA berisi pembukaan (salam, doa, presensi), apersepsi kontekstual, pelaksanaan "Pretest" (tes diagnostik kognitif awal), dan penyampaian tujuan pembelajaran & skenario belajar. DILARANG ada sintaks model di Awal!
   - Tahap Penutup: HANYA berisi refleksi metakognitif murid, perumusan simpulan materi, asesmen formatif akhir/tindak lanjut, informasi agenda pertemuan berikutnya, dan doa/salam penutup. DILARANG KERAS ada sintaks model di Penutup!
   - WAJIB MENGGUNAKAN BAHASA TEKNOLOGI PENDIDIKAN DAN PEDAGOGI BAKU:
     * Kuis Diagnostik Awal -> "Pretest (Tes Diagnostik Kognitif Awal)"
     * Observasi / Pengamatan -> "Asesmen Formatif (Lembar Observasi Proses & Kinerja Praktik)"
     * Uji Kompetensi / Produk Proyek -> "Post-test / Asesmen Sumatif (Uji Kinerja Praktik & Portofolio)"
     * Gunakan terminologi pedagogis: Pretest, Post-test, Scaffolding, Diferensiasi Pembelajaran, Refleksi Metakognitif.
   - aktivitasGuru dan aktivitasMurid WAJIB berupa Array of string berisi poin aksi pendek dimulai dengan KATA KERJA aktif. DILARANG menuliskan paragraf naratif.

5. LKPD (LEMBAR KERJA PESERTA DIDIK):
   - Judul LKPD HARUS mencerminkan model "${model}" dan topik "${topik}".
   - 5 butir tugas LKPD HARUS berupa langkah-langkah konkret bertahap (Langkah 1 s.d. 5) yang langsung menuntun murid menghasilkan capaian sesuai TP.
   - Setiap tugas HARUS berbeda dan mencerminkan fase pengerjaan yang berbeda (rancangan → eksekusi → evaluasi → presentasi → refleksi).

6. KONTEKS FASILITAS DAN MEDIA:
   - Seluruh aktivitas pembelajaran WAJIB menyebutkan dan memanfaatkan fasilitas yang tersedia: ${fasilitas}.
   - Media digital "${media}" HARUS disebutkan secara spesifik di dalam aktivitas, bukan hanya disebutkan di heading.

7. MATERI AJAR DESKRIPTIF (FOKUS MATERI TEKNIS, SUB-JUDUL RAPI & TABEL):
   - WAJIB FOKUS PENUH PADA SUBSTANSI MATERI DAN KONTEN ILMIAH/TEKNIS dari "${topik}".
   - Khusus jika konteks input dari Tahap 1 & 2 berkaitan dengan Videografi, Sinematografi, Tata Kamera, Fotografi, atau Broadcasting Perfilman:
     Pembahasan materi dan tabel parameter teknis WAJIB mencakup pemahaman operasional komprehensif tentang Shot Size, Camera Angle, Camera Movement, Aturan 180 Derajat, Depth of Field (DoF), Rule of Thirds & Framing, serta White Balance (WB).
   - DILARANG KERAS MENULIS NARASI META SEPERTI: "Dalam konteks pembelajaran di SMK...", "Penerapan model Project Based Learning berbasis pendekatan TPACK terbukti...", "Melalui sintaks PjBL peserta didik dilatih...". Naskah materi ajar adalah bahan ajar teknis/keilmuan murni untuk penguasaan materi "${topik}"!
   - Tuliskan dengan format teks terstruktur yang rapi: gunakan sub-judul bernomor (contoh: "1. Konsep Dasar ...", "2. Sudut Pandang ...", "3. Standar Operasional ..."), paragraf penjelasan ilmiah yang mendalam dan tuntas, serta WAJIB SERTAKAN MINIMAL 1 TABEL PARAMETER TEKNIS RINGKASAN MATERI (format Markdown Table: | Parameter Teknis | Deskripsi & Prinsip Kerja | Standar SOP / Kriteria Industri |\n|---|---|---|\n...).
   - DILARANG menggunakan unescaped control character atau literal '\\n' yang tidak valid di dalam JSON string.

8. MATERI TAMBAHAN (PENGAYAAN DESKRIPTIF LENGKAP & TABEL KOMPARATIF):
   - Jika materi tambahan diisi ("${materiTambahan}"), JANGAN HANYA menuliskan 1-3 butir kalimat pendek! Uraikan secara komprehensif, mendalam, dan deskriptif dalam bentuk paragraf penjelasan terperinci (minimal 2-3 paragraf mendalam), sertakan studi kasus atau aplikasi teknologi terkini industri, serta WAJIB SERTAKAN 1 TABEL RINGKASAN PENGAYAAN / KOMPARASI MATERI TINGKAT LANJUT (format Markdown Table: | Dimensi Eksplorasi / Inovasi | Penerapan Terapan Lanjut | Relevansi Industri & Portofolio |).

9. GLOSARIUM (KAMUS ISTILAH TEKNIS KOMPREHENSIF SESUAI KONTEKS TAHAP 1-2):
   - Minimal 5-8 istilah teknis yang KHUSUS, SPESIFIK, dan MURNI DARI MATERI "${topik}" serta relevan dengan konteks input Tahap 1 & 2.
   - Khusus jika konteks input berkaitan dengan Videografi, Sinematografi, Tata Kamera, Fotografi, atau Broadcasting Perfilman:
     WAJIB sertakan kamus istilah teknis komprehensif mencakup:
     1) Shot Size (Extreme Long Shot s.d. Extreme Close Up)
     2) Camera Angle (Bird Eye, High Angle, Eye Level, Low Angle, Frog Eye, Dutch Angle)
     3) Camera Movement (Pan, Tilt, Dolly, Pedestal, Truck, Crane, Arc, Zoom)
     4) Aturan 180 Derajat (180-Degree Rule & Line of Action)
     5) Depth of Field (DoF: Aperture, Focal Length, Jarak Fokus)
     6) Rule of Thirds & Framing (Komposisi Sepertiga Bidang, Headroom, Lookspace)
     7) White Balance (Kalibrasi Suhu Warna Kelvin)
   - Begitu juga untuk bidang kejuruan lainnya (Animasi, DKV, IT/Jaringan, Otomotif, Listrik, Bisnis, Kuliner): wajib memuat istilah teknis operasional murni sesuai konteks input Tahap 1-2.
   - DILARANG KERAS menggunakan istilah generik non-teknis atau istilah proses pedagogis seperti: "Sintesis Solutif", "Verifikasi Empiris", "Konseptualisasi", "Analisis Variabel", "Discovery Learning", "TPACK". Glosarium HARUS murni istilah materi ajar!

10. DAFTAR PUSTAKA:
    - Tuliskan semua referensi otentik yang digunakan sebagai sumber bahan ajar dan acuan sistem AI:
      (a) Dokumen Resmi Kurikulum: Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP). (2024). Panduan Pembelajaran dan Asesmen Kurikulum Merdeka. Jakarta: Kemendikbudristek.
      (b) Buku Teks / Referensi Standar Industri Otentik yang relevan dengan mata pelajaran ${mapel} dan materi ${topik}.
      (c) Sumber AI Engine yang digunakan: Google DeepMind. (2024). Gemini: A Family of Highly Capable Multimodal Models.
    - DILARANG merekayasa atau membuat-buat nama jurnal palsu yang mencantumkan nama model pembelajaran (misal dilarang menulis "Penerapan Model PJBL dalam..." atau "Berbasis Pendekatan TPACK").

11. ASESMEN & RUBRIK:
    - Asesmen Diagnostik: "Pretest (Tes Diagnostik Kognitif Awal)" untuk mengukur kesiapan awal murid pada "${topik}".
    - Asesmen Formatif: "Asesmen Formatif (Lembar Observasi Proses & Kinerja Praktik)" relevan dengan metode "${metode}".
    - Asesmen Sumatif: "Post-test / Asesmen Sumatif (Uji Kinerja Praktik & Portofolio)" mengukur pencapaian TP.
    - Rubrik Penilaian: WAJIB memuat 3 aspek penilaian lengkap dengan deskriptor kriteria Skor 1 (Kurang), Skor 2 (Cukup), Skor 3 (Baik), dan Skor 4 (Sangat Baik) yang spesifik untuk materi ${topik} dan model ${model}.

=============================================================================
FORMAT RESPONS — OUTPUT WAJIB JSON MURNI (VALID JSON TANPA TEKS PEMBUKA/PENUTUP):
=============================================================================
{
  "identifikasiPesertaDidik": [
    {"kategori": "Pengetahuan Awal", "identifikasi": "...", "tindakLanjut": "..."},
    {"kategori": "Minat dan Gaya Belajar", "identifikasi": "...", "tindakLanjut": "..."},
    {"kategori": "Latar Belakang Sosial", "identifikasi": "...", "tindakLanjut": "..."},
    {"kategori": "Kebutuhan Belajar", "identifikasi": "...", "tindakLanjut": "..."},
    {"kategori": "Etika dan Sikap Kerja", "identifikasi": "...", "tindakLanjut": "..."}
  ],
  "identifikasiMateri": [
    {"kategori": "Jenis Pengetahuan", "deskripsi": "..."},
    {"kategori": "Relevansi Kehidupan", "deskripsi": "..."},
    {"kategori": "Tingkat Kesulitan", "deskripsi": "..."}
  ],
  "dimensiProfil": [
    {"dimensi": "NamaDimensi", "deskripsi": "Deskripsikan implementasi dimensi ini dalam konteks ${topik} dan model ${model}..."}
  ],
  "desainPembelajaran": {
    "pemahamanBermakna": "...",
    "pertanyaanPemantik": ["pertanyaan 1 spesifik topik", "pertanyaan 2 spesifik topik", "pertanyaan 3 spesifik topik"],
    "lintasDisiplin": "...",
    "praktikPedagogis": "...",
    "kemitraan": "...",
    "lingkungan": "..."
  },
  "pengalamanBelajar": [
    {
      "pertemuan": 1,
      "subTopik": "Sub-topik spesifik pertemuan 1 (berbeda dan progresif)",
      "awal": {
        "waktu": "15 Menit",
        "aktivitasGuru": [
          "Membuka sesi pembelajaran dengan salam hangat, memimpin doa bersama, dan memeriksa presensi kehadiran murid.",
          "Mengaitkan apersepsi kontekstual fenomena nyata dengan materi ${topik}.",
          "Melaksanakan Pretest singkat untuk mengidentifikasi pengetahuan awal dan kesiapan belajar murid.",
          "Menyampaikan tujuan pembelajaran, skenario aktivitas, dan kriteria penilaian."
        ],
        "aktivitasMurid": [
          "Menjawab salam guru, berdoa dengan khidmat, dan mempersiapkan kesiapan belajar.",
          "Merespons pertanyaan apersepsi dan mengemukakan pengetahuan awal terkait materi ${topik}.",
          "Mengerjakan instrumen Pretest diagnostik awal secara mandiri dan jujur.",
          "Menyimak tujuan pembelajaran serta alur aktivitas yang akan dilaksanakan."
        ]
      },
      "inti": [
        {
          "sintaks": "Sintaks 1: [Nama Sintaks Pertama]",
          "waktu": "30 Menit",
          "aktivitasGuru": [
            "Poin aksi guru 1 khusus sintaks ini — satu kalimat aksi pendek dimulai kata kerja aktif.",
            "Poin aksi guru 2 khusus sintaks ini — satu kalimat aksi pendek.",
            "Poin aksi guru 3 khusus sintaks ini — satu kalimat aksi pendek."
          ],
          "aktivitasMurid": [
            "Poin aksi murid 1 khusus sintaks ini — satu kalimat aksi pendek dimulai kata kerja aktif.",
            "Poin aksi murid 2 khusus sintaks ini — satu kalimat aksi pendek.",
            "Poin aksi murid 3 khusus sintaks ini — satu kalimat aksi pendek."
          ],
          "integrasiPendekatan": "Penerapan ${pendekatan}: [Uraian konkret integrasi teknologi ${media} / metode ${metode} untuk materi ${topik} pada sintaks ini]."
        },
        {
          "sintaks": "Sintaks 2: [Nama Sintaks Kedua]",
          "waktu": "30 Menit",
          "aktivitasGuru": [
            "Poin aksi guru 1 khusus sintaks ini — satu kalimat aksi pendek dimulai kata kerja aktif.",
            "Poin aksi guru 2 khusus sintaks ini — satu kalimat aksi pendek.",
            "Poin aksi guru 3 khusus sintaks ini — satu kalimat aksi pendek."
          ],
          "aktivitasMurid": [
            "Poin aksi murid 1 khusus sintaks ini — satu kalimat aksi pendek dimulai kata kerja aktif.",
            "Poin aksi murid 2 khusus sintaks ini — satu kalimat aksi pendek.",
            "Poin aksi murid 3 khusus sintaks ini — satu kalimat aksi pendek."
          ],
          "integrasiPendekatan": "Penerapan ${pendekatan}: [Uraian konkret integrasi sarana ${fasilitas} / metode ${metode} pada sintaks ini]."
        }
      ],
      "penutup": {
        "waktu": "15 Menit",
        "aktivitasGuru": [
          "Memfasilitasi murid melakukan refleksi metakognitif terhadap pemahaman materi ${topik} hari ini.",
          "Bersama murid merangkum intisari simpulan konsep materi yang telah dipelajari.",
          "Memberikan umpan balik penguatan serta menginformasikan agenda tindak lanjut pertemuan berikutnya.",
          "Menutup sesi pembelajaran dengan doa bersama dan salam penutup."
        ],
        "aktivitasMurid": [
          "Menyampaikan refleksi diri terkait penguasaan materi, kendala yang dihadapi, dan kepuasan belajar.",
          "Merumuskan poin-poin kesimpulan materi inti secara lisan maupun catatan ringkas.",
          "Merapikan kembali sarana kerja dan fasilitas ${fasilitas} yang telah digunakan.",
          "Berdoa bersama guru dan menjawab salam penutup dengan tertib."
        ]
      }
    }
  ],
  "materiAjarDeskriptif": "Naskah materi ajar ilmiah dan teknis mendalam tentang ${topik} (fokus murni pada konsep, prinsip kerja, dan SOP tanpa kalimat meta 'dalam konteks pembelajaran...').\n\n| Parameter / Dimensi Teknis | Deskripsi & Prinsip Operasional | Standar Penerapan Industri |\n|---|---|---|\n| ... | ... | ... |\n\nParagraf analisis lanjutan dan prosedur pemecahan masalah teknis materi ${topik} di dunia nyata.",
  "asesmen": [
    {"jenis": "Diagnostik", "bentuk": "Pretest (Tes Diagnostik Kognitif Awal)", "keterangan": "Mengidentifikasi kesiapan kognitif dan pengetahuan prasyarat murid terhadap materi ${topik}"},
    {"jenis": "Formatif", "bentuk": "Asesmen Formatif (Lembar Observasi Proses & Kinerja Praktik)", "keterangan": "Memantau keterlibatan aktif, daya nalar kritis, dan keterampilan proses kolaboratif murid selama pembelajaran"},
    {"jenis": "Sumatif", "bentuk": "Post-test / Asesmen Sumatif (Uji Kinerja Praktik & Portofolio)", "keterangan": "Mengukur ketuntasan pencapaian Tujuan Pembelajaran (TP) secara komprehensif"}
  ],
  "refleksi": {
    "guru": ["butir refleksi guru 1 spesifik topik", "butir 2", "butir 3", "butir 4", "butir 5"],
    "murid": ["butir refleksi murid 1 spesifik topik", "butir 2", "butir 3", "butir 4", "butir 5"]
  },
  "lkpd": {
    "judul": "Judul LKPD yang mencerminkan model ${model} dan topik ${topik}",
    "tujuan": "Tujuan LKPD yang merujuk langsung pada TP yang ditetapkan guru",
    "tugas": ["Langkah 1: ...", "Langkah 2: ...", "Langkah 3: ...", "Langkah 4: ...", "Langkah 5: ..."]
  },
  "rubrikPenilaian": [
    {"aspek": "Aspek 1 relevan dengan TP dan model", "skor1": "Deskripsi Skor 1", "skor2": "Deskripsi Skor 2", "skor3": "Deskripsi Skor 3", "skor4": "Deskripsi Skor 4"},
    {"aspek": "Aspek 2 relevan dengan TP dan model", "skor1": "Deskripsi Skor 1", "skor2": "Deskripsi Skor 2", "skor3": "Deskripsi Skor 3", "skor4": "Deskripsi Skor 4"},
    {"aspek": "Aspek 3 relevan dengan TP dan model", "skor1": "Deskripsi Skor 1", "skor2": "Deskripsi Skor 2", "skor3": "Deskripsi Skor 3", "skor4": "Deskripsi Skor 4"}
  ],
  "pengayaan": "Kegiatan pengayaan kontekstual untuk murid yang telah tuntas melampaui tujuan pembelajaran.",
  "remedial": "Kegiatan bimbingan remedial bertahap bagi murid yang membutuhkan penguatan kompetensi esensial.",
  "glosarium": [
    {"istilah": "Istilah teknis khusus ${topik}", "definisi": "Definisi teknis yang tepat dan spesifik"}
  ],
  "daftarPustaka": [
    "Nama Penulis, A. (2024). Referensi Akademik Relevan ${topik}. Penerbit/Jurnal Terakreditasi."
  ]
}`;

  // ========================================================================
  // STEP 3: KIRIM MASTER PROMPT KE AI — SATU REQUEST, SATU RESPONSE
  // ========================================================================
  console.log('[Generate] Master Prompt dikirim ke AI dengan fingerprint:', inputFingerprint);

  let aiRawText = null;
  try {
    aiRawText = await callGeminiWithAccountKey(masterPrompt, {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.95,
      responseMimeType: "application/json",
      timeoutMs: 60000,
      silentError: true
    });
  } catch (e) {
    console.warn('[Generate] Gemini API call error:', e);
  }

  if (!aiRawText || !aiRawText.trim()) {
    const lastErr = callGeminiWithAccountKey.lastError || 'Google Gemini API tidak mengembalikan respon.';
    throw new Error(lastErr);
  }

  // ========================================================================
  // STEP 4: PARSING RESPONSE JSON DARI AI SECARA ROBUST
  // ========================================================================
  const parsed = robustParseAiJson(aiRawText);
  if (!parsed) {
    console.warn('[Generate] Raw text gagal diparse (first 250 chars):', aiRawText.slice(0, 250));
    console.warn('[Generate] Raw text gagal diparse (last 250 chars):', aiRawText.slice(-250));
    throw new Error('Google Gemini mengembalikan format JSON yang belum lengkap. Silakan coba klik tombol Generate sekali lagi.');
  }

  // Normalisasi nama properti jika AI menggunakan sinonim
  if (!parsed.pengalamanBelajar && parsed.alurPembelajaran) {
    parsed.pengalamanBelajar = parsed.alurPembelajaran;
  }
  if (!parsed.pengalamanBelajar && parsed.kegiatanPembelajaran) {
    parsed.pengalamanBelajar = parsed.kegiatanPembelajaran;
  }
  if (!parsed.desainPembelajaran && parsed.rancanganPembelajaran) {
    parsed.desainPembelajaran = parsed.rancanganPembelajaran;
  }

  // Validasi: minimal memiliki pengalamanBelajar berbentuk array
  if (!parsed.pengalamanBelajar || !Array.isArray(parsed.pengalamanBelajar) || parsed.pengalamanBelajar.length === 0) {
    throw new Error('Struktur pengalaman belajar belum lengkap dari respon AI. Silakan klik tombol Generate kembali.');
  }

  if (!parsed.desainPembelajaran) {
    parsed.desainPembelajaran = {
      pemahamanBermakna: `Peserta didik menguasai konsep dan aplikasi nyata materi ${topik}.`,
      pertanyaanPemantik: [
        `Bagaimana materi ${topik} berkaitan dengan situasi nyata sehari-hari?`,
        `Mengapa penguasaan ${topik} sangat krusial dalam bidang ${mapel}?`
      ]
    };
  }

  console.log('[Generate] AI berhasil menghasilkan output JSON valid dari master prompt.');
  ensureCompleteMeetings(parsed, targetPertemuanCount, modulPayload);
  ensureCompleteSections(parsed, modulPayload);
  return parsed;
}

/**
 * Pastikan Seluruh Pertemuan (1 s/d targetCount) Tersedia Lengkap Berdasarkan Konten AI
 */
function ensureCompleteMeetings(aiData, targetCount, p) {
  if (!aiData) return;
  if (!Array.isArray(aiData.pengalamanBelajar)) {
    aiData.pengalamanBelajar = [];
  }
  const currentCount = aiData.pengalamanBelajar.length;
  if (currentCount >= targetCount || currentCount === 0) return;

  console.log(`[Pertemuan] Melengkapi pengalamanBelajar dari ${currentCount} pertemuan menjadi ${targetCount} pertemuan...`);
  for (let i = currentCount + 1; i <= targetCount; i++) {
    const baseItem = aiData.pengalamanBelajar[(i - 1) % currentCount];
    if (baseItem) {
      const copy = JSON.parse(JSON.stringify(baseItem));
      copy.pertemuan = i;
      copy.tahap = `Pertemuan ${i} (Lanjutan Penerapan & Evaluasi)`;
      aiData.pengalamanBelajar.push(copy);
    }
  }
}

/**
 * Pastikan Seluruh Bagian Akhir Modul (Rubrik, Glosarium, Daftar Pustaka, Pengayaan, Remedial, LKPD)
 * Selalu Terisi Utuh, Kontekstual, dan Tidak Pernah Kosong
 */
function ensureCompleteSections(aiData, p) {
  if (!aiData) return;
  const topik = p.topikMateri || 'Materi Pokok';
  const model = p.modelPembelajaran || 'Problem Based Learning (PBL)';
  const isPjBL = (model || '').toLowerCase().includes('project') || (model || '').toLowerCase().includes('pjbl');

  // 1. Rubrik Penilaian Berdaya Tahan Tinggi (Pastikan tidak pernah kosong)
  aiData.rubrikPenilaian = resolveContextualRubrik(aiData.rubrikPenilaian, p);

  // 2. Glosarium Berdaya Tahan Tinggi (Materi teknis murni, tanpa istilah generik)
  aiData.glosarium = resolveContextualGlosarium(aiData.glosarium, p);

  // 3. Daftar Pustaka Berdaya Tahan Tinggi (Bahan acuan resmi BSKAP, buku standar, dan AI)
  aiData.daftarPustaka = resolveContextualDaftarPustaka(aiData.daftarPustaka, p);

  // 4. Pengayaan & Remedial
  if (!aiData.pengayaan || typeof aiData.pengayaan !== 'string' || !aiData.pengayaan.trim()) {
    aiData.pengayaan = isPjBL
      ? `Murid yang telah menyelesaikan produk proyek dengan capaian sangat baik direkomendasikan mengerjakan Advanced Project Enhancement seputar materi ${topik} dan mempublikasikan karya ke portofolio digital.`
      : `Murid ditantang menyusun kajian komparatif mandiri atau proyek eksplorasi tingkat lanjut seputar implikasi mutakhir materi ${topik} pada sektor industri/profesional terkini.`;
  }
  if (!aiData.remedial || typeof aiData.remedial !== 'string' || !aiData.remedial.trim()) {
    aiData.remedial = `Murid yang memerlukan penguatan kompetensi mengikuti bimbingan intensif terbimbing (scaffolding) dengan panduan langkah bertahap, telaah ulang konsep esensial ${topik}, dan sesi pendampingan tutor sebaya.`;
  }

  // 5. LKPD
  if (!aiData.lkpd || typeof aiData.lkpd !== 'object') {
    aiData.lkpd = {
      judul: `Lembar Kerja Peserta Didik (LKPD): Penguasaan Terapan ${topik}`,
      tujuan: `Peserta didik mampu menelaah, mempraktikkan, dan mengevaluasi penerapan konsep ${topik} secara kolaboratif sesuai tujuan pembelajaran.`,
      tugas: [
        `Langkah 1: Mengamati fenomena dan mendiskusikan studi kasus awal seputar materi ${topik}.`,
        `Langkah 2: Merancang skenario eksperimen/karya nyata dengan mengidentifikasi parameter kunci ${topik}.`,
        `Langkah 3: Melakukan praktikum/pengembangan proyek secara terstruktur menggunakan fasilitas dan media kerja yang tersedia.`,
        `Langkah 4: Melakukan pengujian hasil kerja, pencatatan data observasi, dan diskusi analisis pemecahan masalah bersama kelompok.`,
        `Langkah 5: Mempresentasikan produk/laporan akhir, mengevaluasi proses kerja, serta merumuskan simpulan reflektif.`
      ]
    };
  }

  // 6. Sanitasi Materi Ajar Deskriptif: Unescape literal newline & hapus meta-narasi pedagogis
  if (typeof aiData.materiAjarDeskriptif === 'string') {
    aiData.materiAjarDeskriptif = aiData.materiAjarDeskriptif
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/Dalam konteks pembelajaran di[^.]*\.\s*/gi, '')
      .replace(/Penerapan model (Project Based Learning|PBL|PjBL|Discovery|Inquiry)[^.]*terbukti sangat efektif[^.]*\.\s*/gi, '')
      .replace(/Melalui sintaks (PjBL|PBL|Discovery|Inquiry)[^.]*peserta didik dilatih[^.]*\.\s*/gi, '')
      .trim();
  }

  // 7. Normalisasi Terminologi Asesmen ke Bahasa Teknologi Pendidikan Baku
  if (Array.isArray(aiData.asesmen)) {
    aiData.asesmen.forEach(item => {
      if (!item) return;
      if (item.jenis === 'Diagnostik' || (item.bentuk && /kuis\s+diagnostik/i.test(item.bentuk))) {
        item.bentuk = 'Pretest (Tes Diagnostik Kognitif Awal)';
      } else if (item.jenis === 'Formatif' && (!item.bentuk || /observasi/i.test(item.bentuk))) {
        item.bentuk = 'Asesmen Formatif (Lembar Observasi Proses & Kinerja Praktik)';
      } else if (item.jenis === 'Sumatif' && (!item.bentuk || /uji|produk|kuis/i.test(item.bentuk))) {
        item.bentuk = 'Post-test / Asesmen Sumatif (Uji Kinerja Praktik & Portofolio)';
      }
    });
  }

  // 8. Bersihkan sintaks dari Tahap Awal dan Penutup di seluruh pertemuan
  if (Array.isArray(aiData.pengalamanBelajar)) {
    aiData.pengalamanBelajar.forEach(m => {
      if (m.awal && m.awal.deepLearningSintaks) {
        delete m.awal.deepLearningSintaks;
      }
      if (m.penutup && m.penutup.deepLearningSintaks) {
        delete m.penutup.deepLearningSintaks;
      }
    });
  }
}

/**
 * Normalisasi dan Resolusi Rubrik Penilaian (Multi-Format & Contextual Fallback)
 */
function resolveContextualRubrik(raw, data) {
  let list = [];
  if (Array.isArray(raw) && raw.length > 0) {
    raw.forEach(item => {
      if (!item) return;
      const aspek = item.aspek || item.kriteria || item.dimensi || '';
      const s1 = item.skor1 || item.kurang || item.skor_1 || '';
      const s2 = item.skor2 || item.cukup || item.skor_2 || '';
      const s3 = item.skor3 || item.baik || item.skor_3 || '';
      const s4 = item.skor4 || item.sangatBaik || item.sangat_baik || item.skor_4 || '';
      if (aspek && (s1 || s2 || s3 || s4)) {
        list.push({ aspek, skor1: s1 || '-', skor2: s2 || '-', skor3: s3 || '-', skor4: s4 || '-' });
      }
    });
  }

  if (list.length < 3) {
    const d = data || {};
    const topik = d.topikMateri || 'Materi Pokok';
    const isPjBL = String(d.modelPembelajaran || '').toLowerCase().includes('project') || String(d.modelPembelajaran || '').toLowerCase().includes('pjbl');

    if (isPjBL) {
      list = [
        {
          aspek: `Penguasaan Konsep & Keterampilan Teknis (${topik})`,
          skor1: `Hasil karya proyek belum menerapkan parameter teknis ${topik}; luaran kerja belum tuntas dan terdapat banyak kekeliruan mendasar.`,
          skor2: `Hasil karya proyek menerapkan konsep dasar ${topik}, namun parameter teknis belum presisi dan masih memerlukan bimbingan intensif.`,
          skor3: `Karya proyek menerapkan konsep dan parameter teknis ${topik} dengan tepat, terstruktur, rapi, dan berfungsi optimal sesuai kriteria.`,
          skor4: `Karya proyek menunjukkan penguasaan materi ${topik} tingkat tinggi, estetika luar biasa, orisinal, serta memiliki nilai inovasi yang siap dipublikasikan.`
        },
        {
          aspek: "Prosedur Kerja, Kepatuhan SOP & Keselamatan Fasilitas",
          skor1: "Alur kerja tidak sistematis, mengabaikan SOP keselamatan fasilitas, dan manajemen waktu melampaui batas toleransi.",
          skor2: "Mengikuti alur kerja dasar namun kepatuhan SOP masih inkonsisten dan penyelesaian tahapan kerja mengalami keterlambatan.",
          skor3: "Menjalankan seluruh tahapan proyek secara sistematis sesuai SOP, tertib keselamatan kerja, dan tuntas tepat waktu.",
          skor4: "Menunjukkan kedisiplinan kerja mandiri yang sempurna, kepatuhan SOP tanpa cela, efisiensi waktu tinggi, dan manajemen risiko matang."
        },
        {
          aspek: "Kolaborasi Tim, Komunikasi & Gelar Karya",
          skor1: "Pasif dalam kelompok; presentasi gelar karya belum terstruktur dan tidak mampu menanggapi pertanyaan audiens.",
          skor2: "Partisipasi dalam tim masih terbatas; presentasi cukup jelas namun argumentasi teknis pendukung karya masih lemah.",
          skor3: "Berkolaborasi aktif dan komunikatif dalam tim; presentasi karya runtut, komunikatif, dan argumentasi didasari data valid.",
          skor4: "Menjadi motor penggerak kolaborasi tim; presentasi sangat persuasif, interaktif, memukau audiens, dan menyajikan refleksi evaluasi karya secara komprehensif."
        }
      ];
    } else {
      list = [
        {
          aspek: `Penguasaan Konseptual & Analisis Masalah (${topik})`,
          skor1: `Belum mampu mengidentifikasi esensi materi ${topik}; analisis masih sangat dangkal dan belum menunjukkan keterkaitan konsep.`,
          skor2: `Mampu mengidentifikasi konsep materi ${topik}, namun penalaran analitis masih terbatas dan belum mendalam.`,
          skor3: `Mampu menganalisis konsep materi ${topik} secara tepat, logis, sistematis, dan menunjukkan hubungan sebab-akibat yang jelas.`,
          skor4: `Mampu menganalisis materi ${topik} secara kritis mendalam, orisinal, serta mengintegrasikan solusi kontekstual yang solutif.`
        },
        {
          aspek: "Keterampilan Penugasan Prosedural & Akurasi Hasil",
          skor1: "Langkah penyelesaian tugas belum runtut, data/praktik banyak mengalami kesalahan, dan dokumen laporan tidak lengkap.",
          skor2: "Menyelesaikan penugasan prosedural dengan cukup baik, namun terdapat beberapa kekeliruan minor dalam akurasi parameter kerja.",
          skor3: "Menyelesaikan seluruh tahapan penugasan secara terstruktur, tertib SOP, dan data hasil kerja akurat serta terverifikasi.",
          skor4: "Mengeksekusi penugasan dengan akurasi dan presisi sangat tinggi, rapi, metodologis, dan menyertakan telaah kritis mandiri."
        },
        {
          aspek: "Komunikasi Ilmiah, Penalaran Kritis & Kolaborasi",
          skor1: "Pasif dalam diskusi; penyampaian ide tidak terstruktur dan belum didukung data atau bukti yang valid.",
          skor2: "Mulai menyampaikan pendapat dalam tim, namun penalaran kritis masih bias dan respon terhadap tanggapan belum optimal.",
          skor3: "Aktif berkolaborasi dalam tim; menyampaikan argumen secara objektif, komunikatif, runtut, dan berbasis rujukan terpercaya.",
          skor4: "Menunjukkan kepemimpinan diskusi yang hebat, penalaran kritis tingkat tinggi, beretika luhur, dan mampu merumuskan sintesis bersama secara elegan."
        }
      ];
    }
  }

  return list;
}

/**
 * Ekstraksi Konteks Holistik dari Seluruh Isian Formulir Tahap 1 & Tahap 2
 */
function extractContextTahap1Dan2(data, rawOrAi) {
  const d = data || {};
  const a = rawOrAi || {};
  const fields = [
    d.mataPelajaran,
    d.topikMateri,
    d.isiTopikMateri,
    d.elemenCP,
    d.jurusanSekolah,
    d.jenjangSekolah,
    d.faseKelas,
    d.capaianPembelajaran,
    d.tujuanPembelajaran,
    d.materiTambahan,
    d.identifikasiMateri,
    d.identifikasiPesertaDidik,
    d.identifikasiProfilLulusan,
    d.mediaDigital,
    d.fasilitas,
    d.saranaPrasarana,
    d.modelPembelajaran,
    d.pendekatanPembelajaran,
    a.mataPelajaran,
    a.topikMateri,
    a.materiAjarDeskriptif
  ];
  return fields
    .filter(Boolean)
    .map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
    .join(' ')
    .toLowerCase();
}

/**
 * Normalisasi dan Resolusi Glosarium Materi (Multi-Format & Contextual Fallback)
 * Hanya berisi materi/istilah teknis murni yang diambil, tidak memuat istilah pedagogis generik
 * Konteks diekstraksi holistik dari seluruh informasi Tahap 1 & 2
 */
function resolveContextualGlosarium(raw, data) {
  let list = [];
  if (Array.isArray(raw)) {
    raw.forEach(item => {
      if (!item) return;
      if (typeof item === 'string') {
        const parts = item.split(/:\s*(.+)/);
        if (parts.length > 1) {
          const term = parts[0].replace(/^[-*•\d.\s]+/, '').trim();
          const def = parts[1].trim();
          if (term && term !== 'undefined') list.push({ istilah: term, definisi: def });
        } else {
          const term = item.replace(/^[-*•\d.\s]+/, '').trim();
          if (term && term !== 'undefined') list.push({ istilah: term, definisi: 'Konsep kunci dan parameter teknis dalam materi ajar.' });
        }
      } else if (typeof item === 'object') {
        const istilah = item.istilah || item.term || item.kata || item.judul || item.key || Object.keys(item)[0] || '';
        const definisi = item.definisi || item.definition || item.arti || item.makna || item.deskripsi || item.value || (istilah ? item[istilah] : '') || '';
        if (istilah && istilah !== 'undefined' && istilah !== '[object Object]') {
          list.push({ istilah: String(istilah).trim(), definisi: String(definisi || 'Konsep operasional dalam materi ajar.').trim() });
        }
      }
    });
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, v]) => {
      if (k && k !== 'undefined') {
        list.push({ istilah: String(k).trim(), definisi: typeof v === 'string' ? v.trim() : JSON.stringify(v) });
      }
    });
  }

  // Filter ketat: Hapus istilah non-teknis / istilah pedagogis generik
  const forbiddenTerms = [
    'sintesis solutif',
    'verifikasi empiris',
    'konseptualisasi',
    'analisis variabel',
    'tpack',
    'model pjbl',
    'model pbl',
    'discovery learning',
    'inquiry learning'
  ];
  list = list.filter(item => {
    if (!item || !item.istilah) return false;
    const termLower = item.istilah.toLowerCase();
    return !forbiddenTerms.some(fb => termLower.includes(fb));
  });

  // Deteksi konteks holistik dari seluruh informasi Tahap 1 & 2
  const ctx = extractContextTahap1Dan2(data, raw);
  const isVideoKamera = /video|sinemat|kamera|camera|shot|angle|framing|broadcasting|perfilman|film|foto|lensa|shutter|aperture|iso|eksposur|exposure|white\s*balance|depth\s*of\s*field|rule\s*of\s*thirds/i.test(ctx);
  const isAnimasi = /animasi|karakter|storyboard|motion|keyframe|rigging|tweening|render/i.test(ctx);
  const isIT = /jaringan|komputer|it|server|cisco|mikrotik|rpl|software|cyber|cloud|lan|wan|routing|switch|firewall/i.test(ctx);
  const isDKV = /desain|dkv|grafis|ilustrasi|layout|tipografi|vektor|vector|branding|logo|poster/i.test(ctx);
  const isOtomotif = /otomotif|motor|mobil|mesin|injeksi|ecu|transmisi|rem|suspensi/i.test(ctx);
  const isListrik = /listrik|elektronika|arus|tegangan|daya|plc|mikrokontroler|arduino|sensor/i.test(ctx);
  const isBisnis = /akuntansi|keuangan|bisnis|manajemen|pasar|uang|jurnal|neraca|laba|faktur|pajak/i.test(ctx);
  const isKuliner = /kuliner|boga|masak|makanan|minuman|food|resep|pastry|bakery/i.test(ctx);

  // Kamus Istilah Teknis Komprehensif Videografi, Sinematografi, dan Tata Kamera
  const kamusVideoSinematografi = [
    {
      istilah: "Shot Size (Ukuran Bidik Kamera)",
      definisi: "Standar klasifikasi luas area bidang pandang kamera terhadap subjek dan latar belakang, mulai dari Extreme Long Shot (ELS) untuk establishing shot lingkungan, Long Shot (LS) untuk figur utuh dan orientasi aksi, Medium Shot (MS) dari pinggang ke atas untuk interaksi wajar, Medium Close-Up (MCU) dada ke atas untuk ekspresi vokal, Close-Up (CU) kepala dan bahu untuk intensitas emosional, hingga Big Close-Up (BCU) dan Extreme Close-Up (ECU) untuk detail dramatis mikro objek."
    },
    {
      istilah: "Camera Angle (Sudut Pandang Kamera)",
      definisi: "Variasi penempatan sudut elevasi dan perspektif sumbu vertikal kamera terhadap subjek, meliputi Bird Eye View (sudut pandang tegak lurus dari atas untuk memetakan ruang), High Angle (kamera menunduk ke bawah memberikan kesan subjek kecil/rentan), Eye Level (sudut pandang sejajar mata manusia yang netral dan objektif), Low Angle (kamera menengadah ke atas memberikan impresi subjek dominan, berwibawa, atau megah), Frog Eye (kamera sejajar permukaan tanah ekstrem), serta Dutch Angle / Canted Angle (posisi kamera miring untuk efek disorientasi psikologis atau ketegangan situasi)."
    },
    {
      istilah: "Camera Movement (Pergerakan Kamera)",
      definisi: "Dinamika manuver penggerakan kamera untuk membangun ritme visual dan mengarahkan fokus penonton, terdiri atas pergerakan pada poros tetap seperti Pan (menoleh horizontal ke kiri/kanan) dan Tilt (mendongak ke atas/menunduk ke bawah), maupun pergerakan fisik seluruh badan kamera meliputi Dolly/Track (bergerak mendekat atau menjauhi subjek), Pedestal (bergerak naik atau turun vertikal), Truck/Tracking (bergerak menyamping mengikuti aksi subjek), Crane/Jib (gerakan melayang dinamis multi-arah), Arc (bergerak melingkar mengitari subjek), serta Zoom (perubahan panjang fokus lensa secara optik)."
    },
    {
      istilah: "Aturan 180 Derajat (180-Degree Rule)",
      definisi: "Kaidah kontinuitas sinematografi fundamental yang menetapkan garis imajiner (line of action) 180 derajat antara dua karakter atau arah gerak adegan. Kamera wajib selalu berada di satu sisi garis yang sama agar orientasi spasial penonton, arah pandangan mata (eyeline match), dan kesinambungan posisi layar kiri-kanan antartokoh tidak terbalik saat perpindahan shot bergantian."
    },
    {
      istilah: "Depth of Field (DoF - Kedalaman Ruang Fokus)",
      definisi: "Rentang zona ketajaman fokus di depan dan di belakang subjek yang tampak tajam dalam bingkai gambar. Shallow Depth of Field (ruang tajam sempit) menghasilkan latar belakang buram (bokeh artistik) untuk mengisolasi subjek utama dari distraksi latar, sedangkan Deep Depth of Field (ruang tajam luas) mempertahankan ketajaman dari latar depan hingga latar belakang. Dipengaruhi oleh tiga parameter fisik utama: bukaan diafragma (aperture/f-stop), panjang fokus lensa (focal length), dan jarak fisik kamera ke subjek."
    },
    {
      istilah: "Rule of Thirds & Framing (Komposisi Sepertiga Bidang & Pembingkaian)",
      definisi: "Prinsip estetika komposisi visual dengan membagi bidang bidik secara proporsional menjadi kisi 3x3 (sembilan kotak simetris dengan empat titik persimpangan daya tarik visual). Menempatkan subjek utama pada titik temu (point of interest) atau sepanjang garis kisi, disertai pengaturan proporsi Headroom (ruang di atas kepala subjek), Look Space / Nose Room (ruang kosong ke arah pandangan mata subjek), Lead Room (ruang di depan arah gerak objek), serta teknik Frame within Frame untuk menambah kedalaman dimensional gambar."
    },
    {
      istilah: "White Balance (WB - Kalibrasi Keseimbangan Putih)",
      definisi: "Proses kalibrasi digital dan optik pada sensor kamera untuk menyesuaikan respons warna terhadap suhu warna sumber pencahayaan aktual (dinyatakan dalam skala Kelvin/K), sehingga objek berwarna putih murni terekam secara netral tanpa bias warna (color cast) yang tidak diinginkan, seperti rona kebiruan di bawah naungan awan/bayangan atau rona kekuningan di bawah lampu pijar (tungsten)."
    }
  ];

  // JIKA KONTEKS VIDEOGRAFI/SINEMATOGRAFI/TATA KAMERA TERDETEKSI:
  if (isVideoKamera) {
    const existingLower = list.map(item => (item.istilah || '').toLowerCase());
    const missingCore = kamusVideoSinematografi.filter(coreItem => {
      const cName = coreItem.istilah.toLowerCase();
      return !existingLower.some(ext => {
        if (cName.includes('shot size') && ext.includes('shot')) return true;
        if (cName.includes('camera angle') && ext.includes('angle')) return true;
        if (cName.includes('camera movement') && ext.includes('move')) return true;
        if (cName.includes('180') && ext.includes('180')) return true;
        if (cName.includes('depth of field') && (ext.includes('depth') || ext.includes('dof'))) return true;
        if (cName.includes('rule of thirds') && (ext.includes('thirds') || ext.includes('framing'))) return true;
        if (cName.includes('white balance') && (ext.includes('white') || ext.includes('balance'))) return true;
        return false;
      });
    });

    if (list.length < 5) {
      const merged = [...kamusVideoSinematografi];
      list.forEach(item => {
        if (!merged.some(m => m.istilah.toLowerCase() === item.istilah.toLowerCase())) {
          merged.push(item);
        }
      });
      return merged;
    } else {
      return [...missingCore, ...list];
    }
  }

  // UNTUK KONTEKS BIDANG KEILMUAN LAINNYA:
  if (list.length < 5) {
    const d = data || {};
    const topik = d.topikMateri || 'Materi Pokok';
    const mapel = d.mataPelajaran || 'Mata Pelajaran';

    let domainFallback = [];
    if (isAnimasi) {
      domainFallback = [
        { istilah: "Model Sheet / Turnaround", definisi: "Dokumen panduan visual standar yang menampilkan karakter dari berbagai sudut pandang (depan, samping, belakang, 3/4) beserta ekspresi dan proporsi baku untuk acuan animator." },
        { istilah: "Storyboard Non-Linear", definisi: "Rangkaian visualisasi panel cerita yang memuat percabangan alur interaktif atau multi-skenario adegan sebelum diproduksi ke dalam format animasi utuh." },
        { istilah: "Animatic", definisi: "Versi kasar gerak dari susunan storyboard yang diselaraskan dengan trek suara dan timing durasi untuk mengevaluasi ritme serta sinematografi adegan." },
        { istilah: "Timeline Animasi & Keyframing", definisi: "Garis waktu operasional perangkat lunak tempat animator mengatur kemunculan adegan, perpindahan frame kunci (keyframes), dan tempo pergerakan karakter." },
        { istilah: "Motion Graphic", definisi: "Teknik penggabungan grafis visual, tipografi kinetik, dan ilustrasi digital yang digerakkan untuk menyampaikan pesan komunikasi visual secara ringkas dan dinamis." },
        { istilah: "Rigging & Weighting", definisi: "Proses penanaman struktur kerangka tulang digital (bones/skeleton) dan penentuan bobot pengaruh deformasi gerak pada mesh karakter animasi." }
      ];
    } else if (isIT) {
      domainFallback = [
        { istilah: "Topologi Jaringan", definisi: "Struktur geometris dan tata letak fisik maupun logis yang menghubungkan node-node komputer dalam satu kesatuan sistem komunikasi data." },
        { istilah: "IP Addressing & Subnetting", definisi: "Metode pengalamatan numerik unik pada setiap perangkat jaringan serta teknik segmentasi jaringan untuk efisiensi rute dan isolasi keamanan." },
        { istilah: "Routing Protocol", definisi: "Standar aturan dan algoritma yang digunakan router untuk menentukan jalur terbaik dan tercepat dalam meneruskan paket data antarnetwork." },
        { istilah: "Bandwidth & Throughput", definisi: "Kapasitas maksimum transfer data pada kanal komunikasi (bandwidth) dan kecepatan transfer data aktual yang terukur pada waktu tertentu (throughput)." },
        { istilah: "Firewall & Packet Filtering", definisi: "Sistem pertahanan keamanan yang memantau dan menyaring paket lalu lintas data masuk dan keluar berdasarkan aturan kebijakan keamanan." },
        { istilah: "VLAN (Virtual Local Area Network)", definisi: "Pengelompokan logis perangkat jaringan pada segmen switch yang sama secara terisolasi tanpa bergantung pada lokasi fisik." }
      ];
    } else if (isDKV) {
      domainFallback = [
        { istilah: "Hierarki Visual", definisi: "Prinsip penataan urutan dan penekanan elemen desain berdasarkan skala prioritas agar pesan utama dapat dicerna audiens secara runtut dan efektif." },
        { istilah: "Tipografi & Kerning", definisi: "Seni pemilihan, penataan gaya huruf, serta pengaturan jarak antar-karakter (kerning) guna menghasilkan keterbacaan (readability) dan keindahan estetika visual." },
        { istilah: "Color Harmony (Harmoni Warna)", definisi: "Kaidah kombinasi warna (analog, komplementer, triadik) yang diaplikasikan untuk membangun nuansa psikologis dan daya tarik visual komposisi karya." },
        { istilah: "Vector Graphic", definisi: "Citra grafis berbasis formula matematis titik dan kurva vektor yang tidak mengalami penurunan resolusi atau pecah saat diperbesar dalam skala apapun." },
        { istilah: "Grid System & Whitespace", definisi: "Struktur garis panduan penataan layout serta pemanfaatan ruang kosong (negatif) untuk memberi ruang bernapas dan keseimbangan pada karya desain." },
        { istilah: "Brand Identity & Guide", definisi: "Sistem identitas visual terpadu (logo, palet warna, tipografi, elemen grafis) yang mencerminkan karakter dan nilai sebuah jenama." }
      ];
    } else if (isOtomotif) {
      domainFallback = [
        { istilah: "Siklus Motor 4 Langkah", definisi: "Rangkaian empat tahapan kerja mesin pembakaran dalam (hisap, kompresi, usaha, dan buang) untuk menghasilkan satu siklus tenaga mekanik." },
        { istilah: "Electronic Fuel Injection (EFI)", definisi: "Sistem pengabutan bahan bakar presisi yang dikontrol secara elektronik oleh Engine Control Unit (ECU) berdasarkan sensor-sensor mesin." },
        { istilah: "Torsi & Daya Kuda (Horsepower)", definisi: "Besaran gaya putar yang dihasilkan mesin pada poros engkol (torsi) dan kemampuan akumulatif mesin dalam melakukan usaha per satuan waktu (daya)." },
        { istilah: "Sistem Transmisi & Kopling", definisi: "Mekanisme pemindah daya dan pengatur rasio putaran mesin ke roda penggerak sesuai beban dan kecepatan kendaraan." },
        { istilah: "Anti-lock Braking System (ABS)", definisi: "Sistem pengereman keselamatan aktif yang mencegah roda terkunci saat pengereman mendadak agar traksi dan kendali kemudi tetap terjaga." }
      ];
    } else if (isListrik) {
      domainFallback = [
        { istilah: "Hukum Ohm & Kirchhoff", definisi: "Prinsip fisika fundamental yang menghubungkan tegangan, kuat arus, hambatan, serta percabangan arus dan beda potensial dalam rangkaian listrik tertutup." },
        { istilah: "Programmable Logic Controller (PLC)", definisi: "Komputer industri khusus yang dirancang untuk mengendalikan proses otomasi manufaktur melalui instruksi logika terprogram." },
        { istilah: "Pulse Width Modulation (PWM)", definisi: "Metode modulasi sinyal digital dengan memvariasikan lebar pulsa aktif untuk mengatur daya rata-rata motor listrik atau intensitas beban." },
        { istilah: "Sensor & Transduser", definisi: "Perangkat yang mendeteksi perubahan besaran fisis (suhu, tekanan, cahaya, gerak) dan mengonversinya menjadi sinyal listrik yang terukur." },
        { istilah: "Faktor Daya (Cos Phi)", definisi: "Perbandingan antara daya aktif (watt) dan daya semu (volt-ampere) yang mengindikasikan efisiensi pemanfaatan energi listrik pada beban induktif." }
      ];
    } else if (isBisnis) {
      domainFallback = [
        { istilah: "Break Even Point (BEP)", definisi: "Titik impas operasional bisnis ketika total pendapatan yang diterima setara dengan total pengeluaran beban biaya produksi dan usaha." },
        { istilah: "Cash Flow (Arus Kas)", definisi: "Laporan catatan pergerakan masuk dan keluarnya uang kas yang mencerminkan tingkat likuiditas dan stabilitas keuangan suatu entitas usaha." },
        { istilah: "Digital Marketing Funnel", definisi: "Kerangka tahapan konversi perjalanan konsumen mulai dari pembentukan awareness (kesadaran), penimbangan (consideration), hingga transaksi pembelian." },
        { istilah: "Jurnal Penyesuaian", definisi: "Pencatatan akuntansi pada akhir periode untuk menyesuaikan saldo akun-akun nominal dan riil agar mencerminkan kondisi riil berbasis akrual." },
        { istilah: "Value Proposition", definisi: "Nilai keunggulan atau manfaat unik yang ditawarkan suatu produk/jasa sebagai solusi utama atas permasalahan atau kebutuhan target pasar." }
      ];
    } else if (isKuliner) {
      domainFallback = [
        { istilah: "Mise en Place", definisi: "Persiapan menyeluruh dan penataan seluruh bahan masakan serta peralatan kerja sebelum proses memasak dimulai demi efisiensi dapur profesional." },
        { istilah: "HACCP (Hazard Analysis Critical Control Point)", definisi: "Sistem manajemen jaminan keamanan pangan preventif yang mengidentifikasi titik kritis bahaya biologis, kimia, dan fisik." },
        { istilah: "Teknik Blanching & Braising", definisi: "Metode perebusan cepat diikuti pendinginan es (blanching) serta teknik memasak kombinasi panas basah bertutup lambat (braising)." },
        { istilah: "Reaksi Maillard", definisi: "Reaksi kimia antara asam amino dan gula pereduksi akibat panas yang menghasilkan aroma khas dan warna kecokelatan lezat pada makanan matang." },
        { istilah: "Food Costing & Yield Management", definisi: "Kalkulasi proporsi biaya bahan baku terhadap harga jual serta penghitungan persentase hasil bersih bahan makanan setelah dibersihkan." }
      ];
    } else {
      domainFallback = [
        { istilah: `Prinsip Operasional ${topik}`, definisi: `Kaidah dasar, struktur kerja, dan mekanisme fundamental yang mendasari pelaksanaan teknis materi ${topik} dalam mata pelajaran ${mapel}.` },
        { istilah: `Parameter Teknis ${topik}`, definisi: `Spesifikasi, variabel terukur, dan tolok ukur presisi yang menjadi standar baku keberhasilan implementasi ${topik}.` },
        { istilah: `Standar Operasional Prosedur (SOP)`, definisi: `Instruksi kerja baku yang sistematis untuk menjamin akurasi, efisiensi kerja, dan keselamatan kerja dalam materi ${topik}.` },
        { istilah: `Instrumen & Media Kerja ${topik}`, definisi: `Perangkat keras, peranti lunak, atau instrumen khusus yang dikalibrasi guna mengeksekusi penugasan teknis materi ${topik}.` },
        { istilah: `Kendali Mutu (Quality Control)`, definisi: `Rangkaian verifikasi dan pemeriksaan hasil kerja guna memastikan luaran ${topik} memenuhi standar spesifikasi tanpa kecacatan.` }
      ];
    }

    const merged = [...list];
    domainFallback.forEach(df => {
      if (!merged.some(m => m.istilah.toLowerCase() === df.istilah.toLowerCase())) {
        merged.push(df);
      }
    });
    list = merged;
  }

  return list;
}

/**
 * Normalisasi dan Resolusi Daftar Pustaka Ilmiah & Bahan Acuan AI (Multi-Format & Contextual Fallback)
 * Menuliskan seluruh referensi resmi kurikulum, buku teks standar, dan bahan AI yang digunakan
 */
function resolveContextualDaftarPustaka(raw, data) {
  let list = [];
  if (Array.isArray(raw)) {
    raw.forEach(item => {
      if (!item) return;
      if (typeof item === 'string') {
        const cleaned = item.replace(/^[-*•\d.\s]+/, '').trim();
        if (cleaned) list.push(cleaned);
      } else if (typeof item === 'object') {
        const penulis = item.penulis || item.author || item.nama || '';
        const tahun = item.tahun || item.year || '2024';
        const judul = item.judul || item.title || '';
        const penerbit = item.penerbit || item.publisher || item.jurnal || '';
        if (judul) {
          list.push(`${penulis ? penulis + ' ' : ''}(${tahun}). "${judul}". ${penerbit ? penerbit + '.' : ''}`.trim());
        }
      }
    });
  } else if (typeof raw === 'string' && raw.trim()) {
    raw.split('\n').forEach(line => {
      const cleaned = line.replace(/^[-*•\d.\s]+/, '').trim();
      if (cleaned) list.push(cleaned);
    });
  }

  // Filter ketat: Hapus referensi jurnal palsu yang merekayasa nama model pembelajaran ke judul artikel
  list = list.filter(item => {
    if (!item || typeof item !== 'string') return false;
    const iLower = item.toLowerCase();
    if (iLower.includes('penerapan model pjbl') || iLower.includes('penerapan model pbl') || iLower.includes('berbasis pendekatan tpack') || iLower.includes('media interaktif berbasis studi kasus otentik')) {
      return false;
    }
    return true;
  });

  // Jika list kosong atau kurang dari 3 item, sediakan daftar pustaka resmi dokumen acuan dan bahan AI
  if (list.length < 3) {
    const d = data || {};
    const topik = d.topikMateri || 'Materi Pokok';
    const mapel = d.mataPelajaran || 'Mata Pelajaran';
    const ctxRef = extractContextTahap1Dan2(data, raw);

    // 1. Dokumen Resmi Standar Kurikulum Merdeka (Kemendikbudristek)
    const refBSKAP = 'Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP). (2024). Panduan Pembelajaran dan Asesmen Pendidikan Anak Usia Dini, Pendidikan Dasar, dan Pendidikan Menengah. Jakarta: Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi.';
    const refCP = 'Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP). (2024). Keputusan Kepala BSKAP No. 032/H/KR/2024 tentang Capaian Pembelajaran pada Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah pada Kurikulum Merdeka. Jakarta: Kemendikbudristek.';

    // 2. Bahan AI Engine & Foundation Model yang Digunakan
    const refAI1 = 'Google DeepMind. (2024). Gemini: A Family of Highly Capable Multimodal Foundation Models. Google Research Technical Report. https://arxiv.org/abs/2312.11805';
    const refAI2 = 'EduWorkspace AI Research. (2025). Knowledge Base & Pedagogical Architecture for Indonesian Kurikulum Merdeka. Jakarta: EduWorkspace Academic Foundation.';

    // 3. Buku Teks & Rujukan Keilmuan / Industri Spesifik
    let refKeilmuan = [];
    if (/video|sinemat|kamera|camera|shot|angle|framing|broadcasting|perfilman|film|foto|lensa|shutter|aperture|iso/i.test(ctxRef)) {
      refKeilmuan = [
        'Bowen, C. J., & Thompson, R. (2020). Grammar of the Shot (4th ed.). New York: Routledge / Focal Press.',
        'Brown, B. (2021). Cinematography: Theory and Practice: Image Making for Cinematographers and Directors (4th ed.). London: Routledge.',
        'Direktorat Sekolah Menengah Kejuruan. (2022). Dasar-Dasar Broadcasting dan Perfilman untuk SMK/MAK Kelas X. Jakarta: Pusat Perbukuan Kemendikbudristek.'
      ];
    } else if (/animasi|karakter|storyboard/i.test(ctxRef)) {
      refKeilmuan = [
        'Williams, R. (2020). The Animator\'s Survival Kit: A Manual of Methods, Principles and Formulas for Classical, Computer, Games, Stop Motion and Internet Animators. London: Faber & Faber.',
        'Direktorat Sekolah Menengah Kejuruan. (2022). Dasar-Dasar Animasi untuk SMK/MAK. Jakarta: Pusat Perbukuan Kemendikbudristek.'
      ];
    } else if (/desain|dkv|grafis/i.test(ctxRef)) {
      refKeilmuan = [
        'Lupton, E., & Phillips, J. C. (2021). Graphic Design: The New Basics (2nd ed.). New York: Princeton Architectural Press.',
        'Direktorat Sekolah Menengah Kejuruan. (2022). Dasar-Dasar Desain Komunikasi Visual. Jakarta: Pusat Perbukuan Kemendikbudristek.'
      ];
    } else if (/jaringan|komputer|it|server|rpl|software/i.test(ctxRef)) {
      refKeilmuan = [
        'Kurose, J. F., & Ross, K. W. (2021). Computer Networking: A Top-Down Approach (8th ed.). London: Pearson Education.',
        'Direktorat Sekolah Menengah Kejuruan. (2022). Dasar-Dasar Teknik Jaringan Komputer dan Telekomunikasi. Jakarta: Pusat Perbukuan Kemendikbudristek.'
      ];
    } else if (/mesin|otomotif|motor|mobil/i.test(ctxRef)) {
      refKeilmuan = [
        'Denton, T. (2020). Automobile Electrical and Electronic Systems (5th ed.). London: Routledge.',
        'Direktorat Sekolah Menengah Kejuruan. (2022). Dasar-Dasar Teknik Otomotif. Jakarta: Pusat Perbukuan Kemendikbudristek.'
      ];
    } else {
      refKeilmuan = [
        `Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi. (2023). Buku Panduan Pendidik dan Modul Ajar Mata Pelajaran ${mapel}. Jakarta: Pusat Kurikulum dan Pembelajaran Kemendikbudristek.`,
        `Kementerian Ketenagakerjaan Republik Indonesia. (2023). Standar Kompetensi Kerja Nasional Indonesia (SKKNI) Bidang Keahlian ${mapel}. Jakarta: Kemnaker RI.`
      ];
    }

    list = [
      refBSKAP,
      refCP,
      ...refKeilmuan,
      refAI1,
      refAI2
    ];
  }

  return list;
}


/**
 * Generator Sintesis AI Komprehensif Berdasarkan Seluruh Data Input Kontekstual Form
 * Menjamin hasil 100% otentik sesuai Model Pembelajaran (PjBL, PBL, Discovery, TeFa, dll.),
 * Tujuan Pembelajaran, Materi Tambahan, Identifikasi Awal, Fasilitas, dan Media.
 */
function buildComprehensiveAiModulContent(p) {
  const mapel = p.mataPelajaran || 'Mata Pelajaran';
  const topik = p.topikMateri || 'Materi Pokok';
  const jenjang = p.jenjangSekolah || 'SMA / SMK';
  const jurusan = p.jurusanSekolah || 'Reguler';
  const modelRaw = p.modelPembelajaran || 'Problem Based Learning (PBL)';
  const pendekatan = p.pendekatanPembelajaran || 'Deep Learning (Surface, Deep, Transfer)';
  const metodeArr = Array.isArray(p.metodePembelajaran) ? p.metodePembelajaran : [p.metodePembelajaran || 'Ceramah Interaktif, Praktik Langsung'];
  const metode = metodeArr.join(', ') || 'Ceramah Interaktif, Praktikum Langsung, Diskusi Kelompok';
  const fasilitas = p.fasilitasBelajar || 'Lab Komputer, Proyektor/LCD, Internet Cepat';
  const media = p.mediaDigital || 'Slide Presentasi Canva, Video Pembelajaran';
  const gaya = p.gayaBelajarMurid || 'Campuran / Multimodal (Visual, Auditori, Kinestetik)';
  const profilList = p.dimensiProfilLulusan || ['Penalaran Kritis', 'Kreativitas', 'Kolaborasi', 'Kemandirian'];
  const tpText = p.tujuanPembelajaran || '';
  const cpText = p.capaianPembelajaran || '';
  const materiTambahanVal = p.materiTambahan || '';

  // Identifikasi Awal Murid, Materi, dan Profil Lulusan
  const idAwal = p.identifikasiAwal || {};
  const idPeserta = p.identifikasiPesertaDidik || idAwal.pesertaDidik || '-';
  const idMateri = p.identifikasiMateri || idAwal.materi || '-';
  const idProfil = p.identifikasiProfilLulusan || idAwal.profilLulusan || '-';

  function getPendekatanPrinsipText(pendekatanVal, phase, topicVal, mediaVal) {
    const pL = (pendekatanVal || '').toLowerCase();
    if (pL.includes('deep learning')) {
      if (phase === 'awal') return 'Prinsip Deep Learning: Mindful (Berkesadaran) dan Meaningful (Bermakna).';
      if (phase === 'inti') return 'Prinsip Deep Learning: Mindful, Meaningful, dan Joyful (Menggembirakan).';
      return 'Prinsip Deep Learning: Meaningful dan Reflektif guna menginternalisasi konsep jangka panjang.';
    }
    if (pL.includes('tpack')) {
      if (phase === 'awal') return `Integrasi TPACK: Pemanfaatan media ${mediaVal} (Technological) untuk orientasi pedagogis konsep materi ${topicVal} (Content).`;
      if (phase === 'inti') return `Integrasi TPACK: Penerapan teknologi ${mediaVal} secara pedagogis dalam eksplorasi mandiri dan pemecahan masalah materi ${topicVal}.`;
      return `Integrasi TPACK: Evaluasi hasil pembelajaran terintegrasi teknologi dan refleksi penguasaan konten materi ${topicVal}.`;
    }
    if (pL.includes('saintifik') || pL.includes('scientific')) {
      if (phase === 'awal') return 'Pendekatan Saintifik: Tahap Mengamati (fenomena awal) dan Menanya (merumuskan rasa ingin tahu).';
      if (phase === 'inti') return 'Pendekatan Saintifik: Tahap Mengumpulkan Informasi/Data dan Mengasosiasi/Menalar informasi.';
      return 'Pendekatan Saintifik: Tahap Mengomunikasikan hasil temuan dan refleksi simpulan.';
    }
    if (pL.includes('kontekstual') || pL.includes('ctl')) {
      if (phase === 'awal') return `Pendekatan Kontekstual: Mengaitkan konsep ${topicVal} dengan situasi dunia nyata dan pengalaman murid.`;
      if (phase === 'inti') return `Pendekatan Kontekstual: Penyelidikan mandiri (inquiry), masyarakat belajar (learning community), dan pemodelan nyata.`;
      return `Pendekatan Kontekstual: Refleksi pemahaman bermakna dan asesmen otentik.`;
    }
    if (pL.includes('konstruktivisme')) {
      if (phase === 'awal') return 'Pendekatan Konstruktivisme: Menggali pra-konsepsi murid dan membangkitkan skema kognitif awal.';
      if (phase === 'inti') return 'Pendekatan Konstruktivisme: Murid mengonstruksi pengetahuan baru secara aktif melalui interaksi langsung dan eksplorasi.';
      return 'Pendekatan Konstruktivisme: Rekonstruksi simpulan dan konsolidasi pemahaman konsep baru.';
    }
    if (pL.includes('stem') || pL.includes('steam')) {
      if (phase === 'awal') return `Pendekatan STEAM: Identifikasi fenomena sains dan teknologi terkait materi ${topicVal}.`;
      if (phase === 'inti') return `Pendekatan STEAM: Penerapan desain rekayasa (engineering), sentuhan estetika (art), dan kalkulasi matematis.`;
      return `Pendekatan STEAM: Pengujian efektivitas solusi dan presentasi karya multidisiplin.`;
    }
    if (pendekatanVal && pendekatanVal !== '-' && !pL.includes('reguler')) {
      if (phase === 'awal') return `Pendekatan ${pendekatanVal}: Orientasi dan pengenalan konsep ${topicVal}.`;
      if (phase === 'inti') return `Pendekatan ${pendekatanVal}: Implementasi strategi aktif ${pendekatanVal} dalam mendalami materi ${topicVal}.`;
      return `Pendekatan ${pendekatanVal}: Evaluasi ketercapaian pemahaman dan refleksi belajar.`;
    }
    return `Strategi Pembelajaran: Berpusat pada murid (student-centered learning) untuk materi ${topicVal}.`;
  }

  // Klasifikasi Model Pembelajaran
  const mLower = modelRaw.toLowerCase();
  const isPjBL = mLower.includes('project') || mLower.includes('pjbl') || mLower.includes('proyek');
  const isPBL = !isPjBL && (mLower.includes('problem') || mLower.includes('pbl'));
  const isInquiry = !isPjBL && !isPBL && (mLower.includes('inquiry') || mLower.includes('inkuiri') || mLower.includes('penyelidikan'));
  const isDiscovery = !isPjBL && !isPBL && !isInquiry && (mLower.includes('discovery') || mLower.includes('penemuan'));
  const isTeFa = mLower.includes('tefa') || mLower.includes('factory') || mLower.includes('teaching factory');
  const isCooperative = mLower.includes('cooperative') || mLower.includes('kooperatif');

  // Hitung jumlah pertemuan (Mendukung fleksibel 1 s/d 16 Pertemuan)
  let countPertemuan = 4;
  const matchNum = (p.jumlahPertemuan || '4').match(/\d+/);
  if (matchNum) countPertemuan = Math.min(Math.max(parseInt(matchNum[0]), 1), 16);

  // Sintesis Tema dan Alur Pertemuan Sesuai Model (Progressif hingga 16 Pertemuan)
  let subThemes = [];
  if (isPjBL) {
    subThemes = [
      `Penentuan Pertanyaan Mendasar (Essential Question) dan Perancangan Desain Proyek ${topik}`,
      `Penyusunan Desain Teknis, Sketsa Rancangan Karya, dan Pembagian Peran Tim ${topik}`,
      `Penyusunan Jadwal (Timeline) Produksi dan Penyiapan Sarana/Bahan di ${fasilitas}`,
      `Eksekusi Pengerjaan Tahap Awal dan Pembuatan Purwarupa (Prototype) ${topik}`,
      `Pengerjaan Lanjutan dan Integrasi Komponen Karya Proyek ${topik}`,
      `Monitoring Kemajuan Proyek, Asistensi Teknis, dan Konsultasi Progres ${topik}`,
      `Uji Coba Fungsi Mandiri dan Pemecahan Kendala Teknis Karya ${topik}`,
      `Pengujian Standar Kualitas (Quality Testing) dan Kalibrasi Produk ${topik}`,
      `Perbaikan Karya Berdasarkan Data Uji dan Penyempurnaan Estetika ${topik}`,
      `Finishing Akhir Karya Proyek dan Penulisan Lembar Spesifikasi Teknis ${topik}`,
      `Penyusunan Laporan Proyek Komprehensif dan Dokumentasi Portofolio ${topik}`,
      `Penyiapan Media Tayang Presentasi dan Simulasi Demo Karya ${topik}`,
      `Gelar Karya (Showcase) Tahap 1: Demonstrasi Produk antar-Kelompok ${topik}`,
      `Gelar Karya (Showcase) Pleno: Presentasi Terbuka dan Uji Kelayakan ${topik}`,
      `Penilaian Sumatif Unjuk Kerja Produk Proyek dan Peer-Review Antar-Siswa ${topik}`,
      `Evaluasi Pengalaman Belajar Keseluruhan dan Rencana Tindak Lanjut Inovasi ${topik}`
    ];
  } else if (isInquiry) {
    subThemes = [
      `Orientasi Masalah Otentik, Perumusan Pertanyaan Eksploratif, dan Hipotesis Awal ${topik}`,
      `Penyusunan Desain Penyelidikan dan Penentuan Variabel Penelitian ${topik}`,
      `Eksplorasi Mandiri dan Studi Literatur Menggunakan Media ${media}`,
      `Pengumpulan Data Empiris dan Investigasi Praktik di Fasilitas ${fasilitas}`,
      `Verifikasi Validitas Data Temuan dan Pengelompokan Parameter Kunci ${topik}`,
      `Pengolahan Data Kualitatif dan Kuantitatif Berbantuan Media Digital ${media}`,
      `Pengujian Hipotesis Awal dan Analisis Pembuktian Ilmiah ${topik}`,
      `Diskusi Kritis: Komparasi Hasil Penyelidikan antar-Kelompok ${topik}`,
      `Perumusan Solusi Penyelidikan dan Pembahasan Anomali Hasil Data ${topik}`,
      `Sintesis Temuan Ilmiah dan Rekonstruksi Pemahaman Konseptual ${topik}`,
      `Penarikan Kesimpulan (Generalisasi Teoretis dan Praktis) Materi ${topik}`,
      `Penyusunan Laporan Hasil Penyelidikan Ilmiah dan Pembahasan Kritis ${topik}`,
      `Publikasi dan Presentasi Sidang Mini Penyelidikan Kelompok ${topik}`,
      `Uji Silang Pemikiran dan Sesi Tanya-Jawab Kritis Pembuktian Kasus ${topik}`,
      `Asesmen Sumatif Kemampuan Bernalar Kritis dan Literasi Penyelidikan ${topik}`,
      `Refleksi Metakognitif Proses Penyelidikan dan Tindak Lanjut Eksplorasi ${topik}`
    ];
  } else if (isDiscovery) {
    subThemes = [
      `Pemberian Rangsangan (Stimulasi) dan Observasi Fenomena Awal Materi ${topik}`,
      `Identifikasi Masalah Konseptual dan Perumusan Fokus Penemuan ${topik}`,
      `Perumusan Hipotesis Penemuan dan Pemetaan Arah Eksplorasi ${topik}`,
      `Pengumpulan Data Tahap 1: Eksplorasi Terbimbing Menggunakan ${media}`,
      `Pengumpulan Data Tahap 2: Pengamatan dan Pencatatan Fakta di ${fasilitas}`,
      `Klasifikasi dan Kodifikasi Data Temuan Penyelidikan Konsep ${topik}`,
      `Pengolahan Data dan Analisis Hubungan Antar-Variabel Pembelajaran ${topik}`,
      `Diskusi Terarah: Interpretasi Hasil Pengolahan Data Penemuan ${topik}`,
      `Pembuktian (Verifikasi) Hipotesis Melalui Pengujian Kasus Nyata ${topik}`,
      `Uji Silang Temuan Antar-Kelompok dan Klarifikasi Pemahaman Konseptual ${topik}`,
      `Generalisasi (Menarik Kesimpulan Bersama) Terkait Prinsip Materi ${topik}`,
      `Konsolidasi Konsep dan Pengaitan Simpulan dengan Konteks Nyata ${topik}`,
      `Aplikasi Prinsip Temuan pada Skenario dan Tantangan Masalah Baru ${topik}`,
      `Presentasi Pleno Hasil Temuan Belajar dan Gelar Portofolio Eksplorasi ${topik}`,
      `Asesmen Sumatif Pemahaman Konsep Mandiri Berbasis Hasil Penemuan ${topik}`,
      `Refleksi Pengalaman Belajar dan Penguatan Budaya Inkuiri Mandiri ${topik}`
    ];
  } else if (isTeFa) {
    subThemes = [
      `Analisis Lembar Kerja Order (Job Sheet) dan Spesifikasi Teknis Standar Industri ${topik}`,
      `Briefing K3, Budaya Kerja 5R/5S, dan Pemeriksaan APD di Sarana ${fasilitas}`,
      `Perencanaan Alur Produksi dan Pembagian Stasiun Kerja (Workstation) ${topik}`,
      `Persiapan Bahan Baku, Kalibrasi Alat Ukur, dan Setup Mesin/Peralatan Kerja`,
      `Eksekusi Tahap 1: Pembuatan Komponen Awal Sesuai Gambar Kerja ${topik}`,
      `Pemeriksaan Dimensi dan Toleransi Mutu Tahap Awal (In-Process Inspection)`,
      `Eksekusi Tahap 2: Perakitan dan Integrasi Sistem Komponen Materi ${topik}`,
      `Uji Coba Fungsi Awal Produk dan Penanganan Kendala Teknis Perakitan`,
      `Eksekusi Tahap 3: Finishing Produk dan Penyempurnaan Standar Estetika Industri`,
      `Quality Assurance (QA) dan Verifikasi Standar Spesifikasi Mutu Akhir`,
      `Pengujian Daya Tahan (Durability) dan Uji Keandalan Fungsi Produk ${topik}`,
      `Perhitungan Efisiensi Waktu dan Analisis Biaya Produksi (Job Costing)`,
      `Penyusunan Berita Acara Uji Kelayakan dan Dokumentasi Serah Terima Pekerjaan`,
      `Simulasi Serah Terima Hasil Pekerjaan Produk kepada Klien/Konsumen ${topik}`,
      `Asesmen Sumatif Praktik Kerja Industri dan Uji Sertifikasi Kompetensi Teknis`,
      `Evaluasi Efisiensi Produksi, Refleksi Sikap Profesional, dan Rencana Kerja Berikutnya`
    ];
  } else if (isCooperative) {
    subThemes = [
      `Penyampaian Tujuan Pembelajaran dan Pembentukan Tim Kerja Heterogen Materi ${topik}`,
      `Eksplorasi Konsep Dasar Bersama dan Pembagian Sub-Topik Peran Anggota`,
      `Pendalaman Materi Kolaboratif (Tahap Diskusi Tim Ahli) Materi ${topik}`,
      `Penyusunan Rangkuman Hasil Tim Ahli Berbantuan Media Digital ${media}`,
      `Diskusi Silang Antar-Kelompok dan Transfer Wawasan Baru Materi ${topik}`,
      `Penyusunan Peta Konsep Terpadu dan Klarifikasi Miskonsepsi Bersama Guru`,
      `Investigasi Bersama Kasus Nyata di Fasilitas Belajar ${fasilitas}`,
      `Sintesis Solusi Kelompok dan Perumusan Karya Analisis Bersama`,
      `Latihan Kolaboratif Pemecahan Soal-Soal Terapan Tingkat Tinggi (HOTS)`,
      `Peer-Tutoring (Bimbingan Teman Sebaya) dan Penguatan Pemahaman Tim`,
      `Perancangan Media Presentasi Kelompok Menggunakan Alat Digital ${media}`,
      `Gladi Presentasi dan Latihan Komunikasi Ilmiah Berkelompok`,
      `Presentasi Pleno Kelompok di Hadapan Seluruh Murid dan Sesi Tanya Jawab`,
      `Pemberian Umpan Balik Positif dan Tanggapan Kritis Antar-Kelompok`,
      `Asesmen Sumatif Individual dan Penilaian Kinerja Kolaborasi Kelompok`,
      `Pemberian Apresiasi / Reward Tim Terbaik dan Refleksi Kerja Sama Tim`
    ];
  } else {
    // Problem Based Learning (PBL) atau Model Lainnya
    subThemes = [
      `Orientasi Murid pada Masalah Otentik dan Identifikasi Fenomena Riil ${topik}`,
      `Perumusan Fokus Permasalahan dan Pembatasan Ruang Lingkup Analisis`,
      `Pengorganisasian Kelompok Belajar dan Penetapan Tugas Investigasi Masalah`,
      `Eksplorasi Data Awal dan Studi Pustaka Mandiri Menggunakan Media ${media}`,
      `Pengumpulan Fakta dan Investigasi Lapangan Memanfaatkan Sarana ${fasilitas}`,
      `Tabulasi dan Kodifikasi Temuan Data Permasalahan Terkait ${topik}`,
      `Analisis Sebab-Akibat Fenomena Masalah Menggunakan Diagram Analitis`,
      `Brainstorming Alternatif Solusi Pemecahan Masalah Bersama Tim`,
      `Penilaian dan Pemilihan Solusi Paling Efektif Serta Aplikatif`,
      `Perancangan Draf Desain Solutif dan Validasi Rencana Aksi Pemecahan Masalah`,
      `Penyusunan Produk Karya Solutif / Prototipe Pemecahan Masalah ${topik}`,
      `Pengujian dan Simulasi Penerapan Solusi pada Kasus Studi Permasalahan`,
      `Penyempurnaan Karya Solutif Berdasarkan Feedback Awal dan Asistensi Guru`,
      `Penyajian Hasil Karya Solutif di Forum Kelas dan Diskusi Pleno Uji Kasus`,
      `Asesmen Sumatif Pemecahan Masalah dan Analisis Ketercapaian Tujuan Belajar`,
      `Evaluasi Pengalaman Mengatasi Masalah dan Refleksi Pembelajaran Berkelanjutan`
    ];
  }

  // Sintesis Pengalaman Belajar Per Pertemuan (Struktur Baru: Sintaks Terpisah di Kegiatan Inti Saja)
  function generateMeetingSintaksList(modelName, pNum, totalP, topicVal, mediaVal, facilityVal, methodVal, approachVal) {
    const mL = (modelName || '').toLowerCase();
    const isPj = mL.includes('project') || mL.includes('pjbl');
    const isPb = !isPj && (mL.includes('problem') || mL.includes('pbl'));
    const isInq = !isPj && !isPb && (mL.includes('inquiry') || mL.includes('inkuiri'));
    const isDisc = !isPj && !isPb && !isInq && (mL.includes('discovery') || mL.includes('penemuan'));
    const isTf = mL.includes('tefa') || mL.includes('factory');

    let allSintaks = [];
    if (isPj) {
      allSintaks = [
        {
          name: "Sintaks 1: Penentuan Pertanyaan Mendasar (Start with Essential Question)",
          guru: [
            `Menayangkan stimulus tayangan studi kasus / karya kontekstual materi ${topicVal} menggunakan media digital ${mediaVal}.`,
            `Mengajukan pertanyaan pemantik mendasar untuk memancing penalaran kritis murid dalam merumuskan gagasan pemecahan masalah.`,
            `Membimbing murid mendefinisikan ruang lingkup tantangan proyek dan spesifikasi produk karya ${topicVal}.`
          ],
          murid: [
            `Mengamati dan mencermati tayangan stimulus fenomena materi ${topicVal} yang disajikan guru.`,
            `Merespons pertanyaan pemantik secara kritis dan mengemukakan ide-ide kreatif konsep proyek.`,
            `Merumuskan fokus masalah utama serta target luaran produk karya bersama kelompok.`
          ],
          note: `Penerapan ${approachVal}: Pemanfaatan media ${mediaVal} untuk memvisualisasikan standar karya industri.`
        },
        {
          name: "Sintaks 2: Mendesain Perencanaan Proyek (Design a Plan for the Project)",
          guru: [
            `Membagi peserta didik ke dalam tim kerja proyek heterogen (4-5 orang per tim).`,
            `Membagikan LKPD dan memfasilitasi perancangan desain teknis serta pembagian peran tim memanfaatkan fasilitas ${facilityVal}.`,
            `Memberikan pendampingan terarah (scaffolding) saat murid merancang spesifikasi kerja.`
          ],
          murid: [
            `Berkumpul bersama kelompok kerja dan membagi tugas spesifik setiap anggota tim secara adil.`,
            `Menyusun rancangan teknis, alur kerja, dan pembagian peran pada LKPD menggunakan fasilitas ${facilityVal}.`,
            `Mengonsultasikan draf desain awal kepada guru untuk memperoleh masukan perbaikan.`
          ],
          note: `Penerapan ${approachVal}: Kolaborasi aktif kelompok mengeksplorasi sarana kerja dan media digital ${mediaVal}.`
        },
        {
          name: "Sintaks 3: Menyusun Jadwal Pembuatan (Create a Schedule)",
          guru: [
            `Membimbing peserta didik menyusun linimasa (timeline milestone) pengerjaan proyek dan tahapan produksi.`,
            `Mengingatkan alokasi waktu kritis, batas akhir penyelesaian, dan keselamatan kerja (SOP).`,
            `Menyetujui jadwal kerja tim sebagai acuan komitmen penyelesaian produk proyek ${topicVal}.`
          ],
          murid: [
            `Berdiskusi menyusun jadwal kerja rinci (tahapan persiapan, eksekusi, pengujian, dan finishing).`,
            `Menentukan target penyelesaian per tahapan kerja agar pengerjaan tuntas tepat waktu.`,
            `Menyepakati pembagian waktu kerja mandiri dan kolaborasi kelompok.`
          ],
          note: `Penerapan ${approachVal}: Manajemen linimasa kerja digital berbasis kolaborasi tim.`
        },
        {
          name: "Sintaks 4: Memonitor Keaktifan dan Perkembangan Proyek (Monitor Students and Progress)",
          guru: [
            `Memonitor keaktifan seluruh anggota tim dan mengamati perkembangan pembuatan karya ${topicVal}.`,
            `Memberikan bimbingan teknis troubleshooting dan asistensi langsung di fasilitas ${facilityVal}.`,
            `Mencatat perkembangan kinerja kelompok pada lembar observasi proses asesmen formatif.`
          ],
          murid: [
            `Mengeksekusi proses pembuatan produk karya nyata ${topicVal} secara bertahap sesuai rancangan.`,
            `Memanfaatkan sarana fasilitas ${facilityVal} dan panduan media ${mediaVal} untuk mengatasi kendala teknis.`,
            `Mendokumentasikan progres capaian karya dan berkonsultasi secara aktif kepada guru.`
          ],
          note: `Penerapan ${approachVal}: Praktik langsung terbimbing dan observasi formatif berkelanjutan.`
        },
        {
          name: "Sintaks 5: Menguji Hasil / Uji Kualitas (Assess the Outcome & Quality Control)",
          guru: [
            `Memfasilitasi pengujian kelayakan fungsi dan standar mutu produk (Quality Control) hasil karya murid.`,
            `Membimbing penilaian silang antar-kelompok (peer-review) menggunakan instrumen rubrik penilaian.`,
            `Memberikan masukan perbaikan teknis sebelum produk dipamerkan atau dipresentasikan.`
          ],
          murid: [
            `Melakukan uji coba fungsi mandiri dan pengecekan spesifikasi mutu produk karya ${topicVal}.`,
            `Mengidentifikasi kekurangan teknis dan melakukan penyempurnaan akhir (finishing) pada karya.`,
            `Menyiapkan materi tayang display atau media pameran untuk presentasi karya.`
          ],
          note: `Penerapan ${approachVal}: Evaluasi presisi teknis dan penerapan standar mutu kejuruan/akademik.`
        },
        {
          name: "Sintaks 6: Mengevaluasi Pengalaman Belajar (Evaluate the Experience)",
          guru: [
            `Memandu sesi gelar karya (showcase) dan presentasi pleno pertanggungjawaban produk proyek.`,
            `Memfasilitasi refleksi menyeluruh atas dinamika kerja tim, kendala lapangan, dan capaian kompetensi.`,
            `Memberikan apresiasi pencapaian dan mengaitkan hasil proyek dengan peluang inovasi masa depan.`
          ],
          murid: [
            `Mempresentasikan produk karya ${topicVal} di hadapan forum kelas dengan percaya diri dan komunikatif.`,
            `Menjawab pertanyaan tanggapan dari guru dan kelompok lain mengenai proses produksi.`,
            `Merefleksikan dinamika kerja tim dan mengidentifikasi pembelajaran bermakna yang didapatkan.`
          ],
          note: `Penerapan ${approachVal}: Gelar karya interaktif dan refleksi metakognitif penguasaan kompetensi.`
        }
      ];
    } else if (isInq) {
      allSintaks = [
        {
          name: "Sintaks 1: Orientasi Masalah dan Merumuskan Pertanyaan Penyelidikan",
          guru: [
            `Menyajikan stimulus fenomena kontekstual materi ${topicVal} melalui media ${mediaVal}.`,
            `Membimbing murid merumuskan pertanyaan esensial penyelidikan ilmiah seputar fenomena yang diamati.`,
            `Membagi murid ke dalam tim penyelidikan dan menetapkan fokus observasi.`
          ],
          murid: [
            `Mencermati stimulus fenomena yang ditampilkan guru melalui media ${mediaVal}.`,
            `Merumuskan pertanyaan penyelidikan ilmiah yang dapat diuji secara empiris.`,
            `Menentukan batasan ruang lingkup variabel penyelidikan bersama tim.`
          ],
          note: `Penerapan ${approachVal}: Observasi fenomena kritis dan eksplorasi pertanyaan ilmiah.`
        },
        {
          name: "Sintaks 2: Merumuskan Hipotesis Penyelidikan",
          guru: [
            `Memfasilitasi diskusi telaah pustaka awal untuk melandasi dugaan sementara murid.`,
            `Membimbing kelompok dalam merumuskan kalimat hipotesis yang logis dan terukur.`,
            `Mengklarifikasi variabel bebas, terikat, dan kontrol dalam penyelidikan.`
          ],
          murid: [
            `Melakukan telaah konseptual ringkas terkait materi ${topicVal}.`,
            `Menyusun hipotesis kerja sebagai jawaban sementara atas pertanyaan penyelidikan.`,
            `Mengidentifikasi parameter yang akan diukur selama penyelidikan.`
          ],
          note: `Penerapan ${approachVal}: Penalaran deduktif dan perumusan hipotesis berbasis literatur.`
        },
        {
          name: "Sintaks 3: Mengumpulkan Data Eksploratif dan Eksperimen",
          guru: [
            `Mendampingi kelompok melakukan eksperimen atau eksplorasi data di fasilitas ${facilityVal}.`,
            `Memonitor ketepatan prosedur pengukuran dan pencatatan data pada lembar observasi.`,
            `Memberikan asistensi teknis saat murid menghadapi kendala instrumen pengumpulan data.`
          ],
          murid: [
            `Melaksanakan langkah kerja eksperimen/eksplorasi secara sistematis memanfaatkan fasilitas ${facilityVal}.`,
            `Mencatat data hasil pengamatan secara objektif, teliti, dan jujur pada tabel kerja.`,
            `Mendokumentasikan seluruh tahapan pengujian untuk bahan verifikasi bukti.`
          ],
          note: `Penerapan ${approachVal}: Investigasi langsung dengan dukungan sarana ${facilityVal}.`
        },
        {
          name: "Sintaks 4: Menguji Hipotesis dan Analisis Data Temuan",
          guru: [
            `Membimbing peserta didik mengolah dan menginterpretasikan data hasil penyelidikan.`,
            `Mendorong murid mengaitkan temuan data dengan teori ilmiah materi ${topicVal}.`,
            `Memfasilitasi diskusi kritis untuk menguji keabsahan hipotesis awal.`
          ],
          murid: [
            `Mentabulasi dan menganalisis data temuan menggunakan media digital ${mediaVal}.`,
            `Membandingkan hasil analisis data dengan hipotesis awal untuk membuktikan kebenaran.`,
            `Menyusun draf argumentasi ilmiah berbasis bukti data yang valid.`
          ],
          note: `Penerapan ${approachVal}: Analisis data digital dan penalaran kritis induktif.`
        },
        {
          name: "Sintaks 5: Penarikan Kesimpulan (Generalisasi) & Evaluasi",
          guru: [
            `Memfasilitasi presentasi laporan hasil penyelidikan kelompok di forum kelas.`,
            `Mengarahkan penarikan kesimpulan komprehensif (generalisasi) konsep ${topicVal}.`,
            `Mengevaluasi metodologi penyelidikan dan memberikan penguatan konseptual mendalam.`
          ],
          murid: [
            `Mempresentasikan hasil penyelidikan ilmiah dan pembuktian hipotesis di hadapan kelas.`,
            `Merumuskan kesimpulan umum konsep materi ${topicVal} berdasarkan bukti empiris.`,
            `Mengevaluasi kelemahan proses penyelidikan serta merencanakan eksplorasi lanjutan.`
          ],
          note: `Penerapan ${approachVal}: Komunikasi temuan ilmiah dan generalisasi konsep bermakna.`
        }
      ];
    } else if (isDisc) {
      allSintaks = [
        {
          name: "Sintaks 1: Pemberian Rangsangan (Stimulation) & Identifikasi Masalah",
          guru: [
            `Menayangkan materi stimulasi berupa fakta/anomali menarik terkait ${topicVal} melalui media ${mediaVal}.`,
            `Membimbing murid menemukan kesenjangan pemahaman dan merumuskan identifikasi masalah.`,
            `Menyusun daftar pertanyaan kunci penemuan konsep bersama peserta didik.`
          ],
          murid: [
            `Mengamati fenomena rangsangan yang dipaparkan guru secara saksama.`,
            `Mengidentifikasi sebanyak mungkin permasalahan yang relevan dengan materi ${topicVal}.`,
            `Memilih masalah utama yang akan dipecahkan melalui proses penemuan.`
          ],
          note: `Penerapan ${approachVal}: Stimulasi rasa ingin tahu dan identifikasi fokus penemuan.`
        },
        {
          name: "Sintaks 2: Pengumpulan Data (Data Collection)",
          guru: [
            `Mengorganisasikan kelompok kerja dan membagikan lembar panduan penemuan terbimbing.`,
            `Memfasilitasi penelusuran informasi dan eksplorasi langsung di sarana ${facilityVal}.`,
            `Mendorong murid mengumpulkan ragam data pendukung dari berbagai sumber terpercaya.`
          ],
          murid: [
            `Melakukan eksplorasi mandiri dan studi literatur menggunakan fasilitas ${facilityVal}.`,
            `Mencatat fakta, informasi, dan konsep relevan terkait materi ${topicVal}.`,
            `Berdiskusi aktif dalam kelompok mengelompokkan data yang telah diperoleh.`
          ],
          note: `Penerapan ${approachVal}: Eksplorasi data terbimbing dengan sarana ${facilityVal}.`
        },
        {
          name: "Sintaks 3: Pengolahan Data (Data Processing)",
          guru: [
            `Membimbing peserta didik mengklasifikasikan, menganalisis, dan mengolah data temuan.`,
            `Mengarahkan kelompok menafsirkan pola hubungan antar-konsep pada materi ${topicVal}.`,
            `Memantau kolaborasi kerja kelompok dan memberikan arahan jika terjadi miskonsepsi.`
          ],
          murid: [
            `Mengolah data mentah ke dalam bentuk bagan, tabel perbandingan, atau diagram konseptual.`,
            `Menelaah keterkaitan antardata untuk menemukan prinsip dasar materi ${topicVal}.`,
            `Menyusun draf penjelasan konsep berdasarkan hasil pengolahan data kelompok.`
          ],
          note: `Penerapan ${approachVal}: Pengorganisasian informasi dan konstruksi pemahaman mandiri.`
        },
        {
          name: "Sintaks 4: Pembuktian (Verification) & Menarik Kesimpulan",
          guru: [
            `Mengarahkan murid melakukan verifikasi hasil temuan terhadap konsep ilmiah baku.`,
            `Memfasilitasi diskusi pleno antar-kelompok untuk menguji keabsahan temuan konsep.`,
            `Bersama murid merumuskan generalisasi simpulan akhir materi ${topicVal}.`
          ],
          murid: [
            `Memverifikasi kebenaran konsep yang ditemukan melalui uji kasus atau contoh nyata.`,
            `Mempresentasikan hasil penemuan konsep di hadapan teman sekelas dan guru.`,
            `Merumuskan kesimpulan umum materi ${topicVal} yang berlaku secara luas.`
          ],
          note: `Penerapan ${approachVal}: Verifikasi objektif dan penarikan simpulan konseptual.`
        }
      ];
    } else if (isTf) {
      allSintaks = [
        {
          name: "Sintaks 1: Penerimaan Order & Analisis Spesifikasi Job Sheet",
          guru: [
            `Membagikan Job Sheet order kerja standar industri materi ${topicVal}.`,
            `Menjelaskan kriteria spesifikasi teknis, toleransi mutu, dan batas waktu produksi.`,
            `Memeriksa kelengkapan APD dan kesiapan stasiun kerja di fasilitas ${facilityVal}.`
          ],
          murid: [
            `Mempelajari lembar instruksi kerja (Job Sheet) dan mengidentifikasi kebutuhan spesifikasi.`,
            `Menyiapkan peralatan kerja, bahan praktik, dan mengenakan APD sesuai SOP K3.`,
            `Mengonfirmasi pemahaman parameter teknis produk kepada guru/instruktur.`
          ],
          note: `Penerapan ${approachVal}: Pembiasaan budaya industri dan analisis dokumen kerja profesional.`
        },
        {
          name: "Sintaks 2: Perancangan Desain & Penjadwalan Produksi",
          guru: [
            `Membimbing perencanaan alur proses produksi dan pembagian stasiun kerja.`,
            `Menetapkan standar estimasi waktu kerja dan tahapan verifikasi kualitas.`,
            `Menyetujui rencana alur produksi kelompok kerja.`
          ],
          murid: [
            `Merancang alur proses kerja bertahap dan membagi peran stasiun kerja tim.`,
            `Menyusun estimasi waktu pengerjaan dan daftar cek persiapan alat/bahan.`,
            `Mengatur alur material kerja di fasilitas ${facilityVal} agar efisien.`
          ],
          note: `Penerapan ${approachVal}: Manajemen waktu dan alur produksi standar kejuruan.`
        },
        {
          name: "Sintaks 3: Eksekusi Produksi Sesuai SOP Industri",
          guru: [
            `Memonitor jalannya eksekusi pengerjaan produk ${topicVal} di stasiun kerja.`,
            `Menegakkan kedisiplinan SOP keselamatan kerja dan presisi operasional alat.`,
            `Memberikan asistensi teknis cepat saat terjadi kendala mesin/software.`
          ],
          murid: [
            `Mengeksekusi tahapan produksi produk ${topicVal} sesuai SOP baku industri.`,
            `Mengoperasikan sarana kerja di fasilitas ${facilityVal} dengan presisi dan hati-hati.`,
            `Menjaga kerapian area kerja (5R/5S) selama proses manufaktur/kreasi.`
          ],
          note: `Penerapan ${approachVal}: Praktik langsung presisi tinggi dan penerapan budaya 5R.`
        },
        {
          name: "Sintaks 4: Quality Control (QC), Serah Terima & Evaluasi",
          guru: [
            `Memandu proses inspeksi mutu (Quality Control) menggunakan alat ukur/standar uji baku.`,
            `Memvalidasi kelayakan produk akhir sebelum serah terima pekerjaan.`,
            `Mengevaluasi efisiensi biaya, waktu pengerjaan, dan produktivitas tim.`
          ],
          murid: [
            `Melakukan kalibrasi dan pengujian mutu produk secara mandiri dan silang.`,
            `Menyerahkan produk hasil kerja disertai dokumen lembar pengujian (QC Sheet).`,
            `Mengevaluasi efisiensi kerja dan membersihkan area kerja (5R/5S).`
          ],
          note: `Penerapan ${approachVal}: Quality Control terstandar dan evaluasi akuntabilitas produksi.`
        }
      ];
    } else {
      // PBL (Problem Based Learning)
      allSintaks = [
        {
          name: "Sintaks 1: Orientasi Peserta Didik pada Masalah Otentik",
          guru: [
            `Menyajikan studi kasus permasalahan nyata terkait materi ${topicVal} melalui media ${mediaVal}.`,
            `Mengajukan pertanyaan pemantik kontekstual untuk memancing nalar kritis murid.`,
            `Memfasilitasi diskusi pembuka untuk membatasi ruang lingkup persoalan.`
          ],
          murid: [
            `Menyimak paparan studi kasus fenomena materi ${topicVal} yang disajikan guru.`,
            `Merespons pertanyaan pemantik dan mengemukakan perspektif awal secara kritis.`,
            `Mencatat pokok permasalahan yang perlu diinvestigasi lebih mendalam.`
          ],
          note: `Penerapan ${approachVal}: Paparan fenomena kontekstual menggunakan media ${mediaVal}.`
        },
        {
          name: "Sintaks 2: Mengorganisasikan Peserta Didik untuk Belajar",
          guru: [
            `Membagi peserta didik ke dalam tim investigasi heterogen (4-5 orang).`,
            `Membagikan LKPD studi kasus dan membantu mendefinisikan pembagian tugas kelompok.`,
            `Memastikan setiap anggota tim memahami fokus investigasi yang menjadi tanggung jawabnya.`
          ],
          murid: [
            `Bergabung dengan kelompok kerja dan membagi tugas peran investigasi secara musyawarah.`,
            `Mempelajari lembar studi kasus pada LKPD dan menyusun rencana pengumpulan fakta.`,
            `Menentukan strategi penelusuran data memanfaatkan fasilitas ${facilityVal}.`
          ],
          note: `Penerapan ${approachVal}: Pengorganisasian tim belajar kolaboratif dan terstruktur.`
        },
        {
          name: "Sintaks 3: Membimbing Penyelidikan Individu maupun Kelompok",
          guru: [
            `Mendampingi penyelidikan lapangan/studi pustaka kelompok di sarana ${facilityVal}.`,
            `Mendorong murid mengumpulkan data empiris yang valid dari berbagai sumber digital.`,
            `Memberikan pertanyaan penuntun (scaffolding) saat murid menemui jalan buntu analitis.`
          ],
          murid: [
            `Melakukan riset data, penelusuran informasi, dan eksplorasi menggunakan sarana ${facilityVal}.`,
            `Menganalisis faktor penyebab akar masalah terkait materi ${topicVal}.`,
            `Menyusun tabulasi bukti temuan fakta untuk mendasari perumusan solusi.`
          ],
          note: `Penerapan ${approachVal}: Penyelidikan mandiri dan scaffolding instruksional.`
        },
        {
          name: "Sintaks 4: Mengembangkan dan Menyajikan Hasil Karya Solutif",
          guru: [
            `Membimbing kelompok merumuskan alternatif solusi pemecahan masalah yang aplikatif.`,
            `Memfasilitasi penyusunan laporan analisis atau prototipe karya pemecahan masalah ${topicVal}.`,
            `Memandu jalannya sesi presentasi pleno dan diskusi interaktif antar-kelompok.`
          ],
          murid: [
            `Merumuskan alternatif solusi pemecahan masalah berdasarkan data hasil penyelidikan.`,
            `Menyusun media presentasi interaktif atau laporan ringkas hasil kerja tim.`,
            `Mempresentasikan hasil karya solutif di depan kelas dan menjawab tanggapan teman.`
          ],
          note: `Penerapan ${approachVal}: Kreasi solusi berbasis data dan komunikasi publik interaktif.`
        },
        {
          name: "Sintaks 5: Menganalisis dan Mengevaluasi Proses Pemecahan Masalah",
          guru: [
            `Memfasilitasi reviu kritis terhadap solusi yang diajukan oleh masing-masing kelompok.`,
            `Mengklarifikasi konsep inti materi ${topicVal} dan memberikan penguatan teoretis komprehensif.`,
            `Mengarahkan refleksi metakognitif mengenai efektivitas proses pemecahan masalah.`
          ],
          murid: [
            `Melakukan refleksi dan evaluasi terhadap kelebihan serta kelemahan solusi yang dirumuskan.`,
            `Mencatat klarifikasi dan penguatan konsep esensial yang diberikan guru.`,
            `Menyimpulkan strategi penyelesaian masalah terbaik yang dapat diaplikasikan di dunia nyata.`
          ],
          note: `Penerapan ${approachVal}: Refleksi metakognitif dan konsolidasi pemahaman konsep baru.`
        }
      ];
    }

    const totalS = allSintaks.length;
    let startIndex = 0;
    let endIndex = totalS;

    if (totalP === 1) {
      startIndex = 0;
      endIndex = totalS;
    } else {
      const perMeeting = totalS / totalP;
      startIndex = Math.floor((pNum - 1) * perMeeting);
      endIndex = (pNum === totalP) ? totalS : Math.max(startIndex + 1, Math.floor(pNum * perMeeting));
    }

    let selected = allSintaks.slice(startIndex, endIndex);
    if (selected.length === 0) {
      selected = [allSintaks[Math.min(pNum - 1, totalS - 1)]];
    }

    const allocatedTime = Math.round(60 / selected.length);
    return selected.map(s => ({
      sintaks: s.name,
      waktu: `${allocatedTime} Menit`,
      aktivitasGuru: s.guru,
      aktivitasMurid: s.murid,
      integrasiPendekatan: s.note
    }));
  }

  const pengalamanBelajar = [];
  for (let i = 1; i <= countPertemuan; i++) {
    const theme = subThemes[i - 1] || subThemes[(i - 1) % subThemes.length];
    const meetingSintaks = generateMeetingSintaksList(modelRaw, i, countPertemuan, topik, media, fasilitas, metode, pendekatan);

    pengalamanBelajar.push({
      pertemuan: i,
      subTopik: theme,
      awal: {
        waktu: '15 Menit',
        aktivitasGuru: [
          `Membuka sesi pembelajaran dengan salam pembuka, memimpin doa bersama, dan memeriksa presensi kehadiran murid.`,
          `Mengaitkan apersepsi kontekstual fenomena nyata dengan materi ${topik}.`,
          `Melaksanakan Pretest singkat untuk mendiagnosis pengetahuan prasyarat dan kesiapan awal murid.`,
          `Menyampaikan tujuan pembelajaran, skenario aktivitas, dan kriteria penilaian yang akan diterapkan.`
        ],
        aktivitasMurid: [
          `Menjawab salam dari guru, berdoa dengan khidmat, dan mempersiapkan perlengkapan belajar.`,
          `Merespons pertanyaan apersepsi guru dan mengemukakan pengetahuan awal seputar ${topik}.`,
          `Mengerjakan instrumen Pretest diagnostik awal secara mandiri dan jujur.`,
          `Menyimak pemaparan tujuan pembelajaran dan alur kerja yang akan dilaksanakan.`
        ]
      },
      inti: meetingSintaks,
      penutup: {
        waktu: '15 Menit',
        aktivitasGuru: [
          `Memfasilitasi murid melakukan refleksi metakognitif terhadap pemahaman konsep materi ${topik} hari ini.`,
          `Bersama murid merumuskan intisari simpulan komprehensif atas materi yang telah dipelajari.`,
          `Memberikan umpan balik penguatan serta menginformasikan agenda tindak lanjut pertemuan berikutnya.`,
          `Menutup pembelajaran dengan doa bersama dan salam penutup.`
        ],
        aktivitasMurid: [
          `Menyampaikan refleksi diri terkait penguasaan materi, kendala yang dihadapi, dan kepuasan belajar.`,
          `Merangkum intisari kesimpulan materi inti secara lisan maupun catatan ringkas.`,
          `Merapikan kembali sarana kerja dan fasilitas ${fasilitas} yang telah digunakan.`,
          `Berdoa bersama guru dan menjawab salam penutup dengan tertib.`
        ]
      }
    });
  }

  // Sintesis LKPD Sesuai Model Pembelajaran & TP Form
  const topicLower = topik.toLowerCase();
  let lkpdData = {};
  if (isPjBL) {
    let t1 = `Analisis naskah, tema, atau spesifikasi awal, lalu rancang konsep kreatif serta sketsa/rancangan teknis karya produk ${topik}!`;
    let t2 = `Susun jadwal pengerjaan proyek (timeline milestone), bagi peran anggota tim, dan siapkan perlengkapan/software kerja dengan memanfaatkan fasilitas ${fasilitas}!`;
    let t3 = `Eksekusi proses pembuatan produk karya nyata ${topik} secara bertahap bersama kelompok dengan memanfaatkan panduan media digital ${media}!`;
    let t4 = `Lakukan pengujian kelayakan fungsi/mutu produk (Quality Control), evaluasi kesesuaian karya terhadap standar teknis, dan lakukan penyempurnaan berdasarkan rubrik penilaian proyek!`;
    let t5 = `Siapkan display pameran (showcase), ekspor/dokumentasikan portofolio karya produk ${topik}, dan presentasikan hasilnya di hadapan forum kelas untuk evaluasi bersama!`;

    if (topicLower.includes('karakter') || topicLower.includes('storyboard') || topicLower.includes('animasi')) {
      t1 = `Analisis skenario atau narasi cerita yang ditentukan, lalu rancang sketsa awal dan lembar model karakter (Model Sheet / Turnaround) 2D mencakup tampak depan, samping, ekspresi wajah, dan proporsi warna!`;
      t2 = `Susun jadwal kerja proyek (timeline milestone) serta siapkan pembagian peran tim produksi storyboard pada perangkat di ${fasilitas}!`;
      t3 = `Buat dan susun rangkaian panel storyboard visual (minimal 30 detik durasi animasi) dengan menerapkan prinsip sinematografi, staging, dan timeline gerak menggunakan software digital dan panduan media ${media}!`;
      t4 = `Lakukan uji kelayakan teknis (Quality Control / Animatic kasar), telaah konsistensi desain karakter dan kelayakan produksi animasi 2D, lalu lakukan perbaikan karya!`;
      t5 = `Susun display presentasi gelar karya (showcase), tampilkan hasil akhir karya proyek ${topik} di depan kelas menggunakan proyektor, dan refleksikan pengalaman proses produksi!`;
    }

    lkpdData = {
      judul: `Lembar Kerja Proyek (PjBL): Perancangan dan Pembuatan Karya ${topik}`,
      tujuan: `Peserta didik mampu merancang konsep desain/teknis, memproduksi karya nyata ${topik}, menguji mutu produk, dan menyajikan hasil gelar karya secara kolaboratif sesuai tujuan pembelajaran yang ditetapkan.`,
      tugas: [t1, t2, t3, t4, t5]
    };
  } else if (isInquiry) {
    lkpdData = {
      judul: `Lembar Kerja Penyelidikan (Inquiry Based Learning): Eksplorasi dan Pembuktian Konsep ${topik}`,
      tujuan: `Peserta didik mampu merumuskan pertanyaan penyelidikan, menyusun hipotesis, mengumpulkan data eksperimen/praktik menggunakan ${fasilitas}, dan menguji hipotesis secara ilmiah.`,
      tugas: [
        `Amatilah fenomena atau studi kasus terkait ${topik} yang disajikan melalui media ${media}!`,
        `Rumuskan pertanyaan penyelidikan utama dan susun hipotesis kerja yang dapat diuji secara empiris!`,
        `Rancang dan laksanakan langkah eksplorasi/eksperimen menggunakan sarana ${fasilitas} untuk mengumpulkan data pendukung!`,
        `Analisis dan olah data hasil pengamatan untuk menguji kebenaran hipotesis yang telah diajukan!`,
        `Tarik kesimpulan ilmiah (generalisasi) dan susun laporan temuan penyelidikan untuk dipresentasikan di depan kelas!`
      ]
    };
  } else if (isDiscovery) {
    lkpdData = {
      judul: `Lembar Kerja Penemuan Konsep (Discovery Learning): Eksplorasi Terbimbing ${topik}`,
      tujuan: `Peserta didik mampu mengamati stimulus, mengidentifikasi masalah, mengumpulkan data, dan membuktikan konsep materi ${topik} secara ilmiah.`,
      tugas: [
        `Amatilah fenomena atau data awal terkait materi ${topik} yang disajikan melalui media ${media}!`,
        `Rumuskan minimal 2 pertanyaan penyelidikan dan susunlah hipotesis sementara berdasarkan teori yang dipelajari!`,
        `Kumpulkan data empiris dan lakukan pengujian terstruktur dengan memanfaatkan fasilitas ${fasilitas}!`,
        `Analisis dan olah data hasil pengamatan untuk membuktikan kebenaran hipotesis yang telah Anda buat!`,
        `Susun laporan kesimpulan ilmiah hasil penemuan konsep dan presentasikan temuan kelompok Anda di depan kelas!`
      ]
    };
  } else {
    // PBL
    lkpdData = {
      judul: `Lembar Kerja Peserta Didik (PBL): Analisis Masalah dan Perumusan Solusi Inovatif ${topik}`,
      tujuan: `Peserta didik mampu membedah permasalahan kontekstual materi ${topik}, menguji variabel penyebab, dan menyusun alternatif rekomendasi solusi yang aplikatif dan terukur.`,
      tugas: [
        `Pilihlah salah satu studi kasus permasalahan aktual terkait materi ${topik} yang disajikan dalam media pembelajaran ${media}!`,
        `Lakukan penelusuran data dan investigasi penyebab masalah menggunakan sarana fasilitas ${fasilitas} untuk menemukan akar persoalan!`,
        `Diskusikan bersama kelompok dan bandingkan ragam alternatif solusi berdasarkan konsep teori mata pelajaran ${mapel}!`,
        `Rumuskan rencana aksi konkret dan desain karya pemecahan masalah yang paling efektif dan rasional!`,
        `Susunlah hasil analisis dan rekomendasi solusi kelompok Anda ke dalam media presentasi interaktif untuk disajikan pada forum kelas!`
      ]
    };
  }

  // Sintesis Asesmen Menggunakan Bahasa Teknologi Pendidikan Baku
  const asesmenData = [
    {
      jenis: "Diagnostik",
      bentuk: `Pretest (Tes Diagnostik Kognitif Awal) seputar ${topik}`,
      keterangan: "Mengukur kesiapan pengetahuan awal, pemahaman prasyarat, dan modalitas belajar peserta didik."
    },
    {
      jenis: "Formatif",
      bentuk: `Asesmen Formatif (Lembar Observasi Proses, Kinerja Praktik & Kolaborasi Tim)`,
      keterangan: "Memantau keterlibatan aktif, kedisiplinan kerja, daya nalar kritis, dan keterampilan proses selama pembelajaran."
    },
    {
      jenis: "Sumatif",
      bentuk: `Post-test / Asesmen Sumatif (Uji Kinerja Praktik & Evaluasi Produk Portofolio)`,
      keterangan: "Mengukur ketuntasan pencapaian seluruh indikator Tujuan Pembelajaran (TP) secara komprehensif dan objektif."
    }
  ];

  // Sintesis Rubrik Penilaian Sesuai Model
  let rubrikData = [];
  if (isPjBL) {
    rubrikData = [
      {
        aspek: `Kualitas & Kreativitas Produk Proyek ${topik}`,
        skor1: `Produk karya belum selesai; tidak memenuhi spesifikasi teknis dan belum menunjukkan penerapan konsep ${topik}.`,
        skor2: `Produk karya selesai sebagian; spesifikasi dasar terpenuhi namun kualitas teknis dan estetika masih sangat terbatas.`,
        skor3: `Produk karya selesai dengan baik; memenuhi seluruh spesifikasi teknis ${topik}, rapi, dan berfungsi sesuai harapan.`,
        skor4: `Produk karya luar biasa; orisinal, memiliki nilai estetika dan fungsionalitas tinggi, inovatif, serta melampaui ekspektasi standar industri.`
      },
      {
        aspek: "Perencanaan, Kepatuhan Timeline, & Prosedur Kerja",
        skor1: "Tidak memiliki perencanaan yang jelas; pengerjaan proyek melewati batas waktu tanpa manajemen kerja tim.",
        skor2: "Memiliki perencanaan dasar namun jadwal timeline sering terlambat; kepatuhan prosedur kerja masih minim.",
        skor3: "Mengikuti perencanaan dan jadwal kerja dengan tertib; prosedur kerja dan SOP ditaati dengan baik.",
        skor4: "Manajemen waktu dan pembagian peran tim sangat profesional; eksekusi proyek sistematis, efisien, dan tuntas tepat waktu."
      },
      {
        aspek: "Kolaborasi Tim & Presentasi Gelar Karya",
        skor1: "Pasif dalam kerja tim; presentasi produk tidak terstruktur dan tidak mampu menjelaskan proses pembuatan karya.",
        skor2: "Kontribusi dalam tim masih minim; presentasi kurang percaya diri dan penjelasan fungsi produk belum tuntas.",
        skor3: "Berkontribusi aktif dalam tim; presentasi produk jelas, terstruktur, komunikatif, dan mampu menjawab pertanyaan penguji.",
        skor4: "Sangat solid dalam memimpin dan berkolaborasi; presentasi gelar karya memukau, persuasif, interaktif, dan penuh percaya diri."
      }
    ];
  } else {
    rubrikData = [
      {
        aspek: "Pemahaman Konsep & Analisis Masalah",
        skor1: `Belum mampu mengidentifikasi esensi materi ${topik}; analisis masih sangat dangkal dan belum menunjukkan keterkaitan konsep.`,
        skor2: `Mampu mengidentifikasi konsep materi ${topik}, namun penalaran analisis masih terbatas dan belum mendalam.`,
        skor3: `Mampu menganalisis konsep materi ${topik} dengan baik, logis, dan menunjukkan hubungan sebab-akibat yang jelas.`,
        skor4: `Mampu menganalisis materi ${topik} secara kritis, komprehensif, orisinal, dan mengintegrasikan solusi yang sangat relevan.`
      },
      {
        aspek: "Keterampilan Kolaborasi & Komunikasi",
        skor1: "Pasif dalam kerja kelompok; presentasi belum terstruktur dan sulit dipahami audiens.",
        skor2: "Partisipasi masih minim; presentasi kurang terstruktur dan penyampaian pesan belum efektif.",
        skor3: "Berpartisipasi aktif dalam kelompok; presentasi terstruktur rapi, jelas, dan komunikatif.",
        skor4: "Sangat aktif memimpin/memfasilitasi kerja tim; presentasi inovatif, persuasif, dan sangat melibatkan audiens secara interaktif."
      },
      {
        aspek: "Sikap & Penalaran Kritis",
        skor1: "Belum menunjukkan sikap kritis; argumen tidak didasari fakta yang valid.",
        skor2: "Mulai menunjukkan penalaran kritis, namun masih terdapat bias dan evaluasi data belum tuntas.",
        skor3: "Menunjukkan sikap kritis objektif, menghargai ragam perspektif, dan berbasis data terpercaya.",
        skor4: "Menunjukkan penalaran kritis tingkat tinggi, objektivitas luar biasa, beretika luhur, dan mampu mempromosikan pemahaman bersama."
      }
    ];
  }

  // Sintesis Pengayaan & Remedial Sesuai Model
  let pengayaanText = '';
  let remedialText = '';
  if (isPjBL) {
    pengayaanText = `Murid yang telah menyelesaikan produk proyek dengan capaian sangat baik direkomendasikan mengerjakan <strong>Pengembangan Tingkat Lanjut (Advanced Project Enhancement)</strong>: Mengembangkan variasi/fitur interaktif tambahan pada karya <em>${topik}</em>, menyusun dokumentasi video proses produksi (behind the scene), atau mempublikasikan portofolio karya ke platform industri/komunitas kreatif nasional.`;
    remedialText = `Murid yang belum mencapai ketuntasan produk proyek direkomendasikan mengikuti <strong>Pendampingan Terbimbing (Project Scaffolding)</strong>: Mengikuti sesi bimbingan teknis intensif bersama guru atau tutor sebaya, menyederhanakan kompleksitas fitur karya <em>${topik}</em>, serta menyelesaikan revisi modul kerja bagian kunci hingga mencapai standar mutu minimum.`;
  } else {
    pengayaanText = `Murid yang telah melampaui kriteria ketuntasan direkomendasikan mengerjakan <strong>Tugas Analisis Komparatif Mandiri</strong>: Menulis artikel telaah ilmiah 3-4 halaman mengenai perkembangan teknologi/tren mutakhir terkait <em>${topik}</em> dan implikasinya di dunia industri, atau merancang purwarupa/media edukasi interaktif untuk diseminasi kepada adik tingkat.`;
    remedialText = `Murid yang belum mencapai kriteria ketuntasan direkomendasikan mengerjakan <strong>Tugas Lembar Kerja Terbimbing (Scaffolding Worksheet)</strong>: Mengisi bagan alur konsep esensial materi <em>${topik}</em> dengan panduan bertahap, menyelesaikan soal analisis terarah bersama tutor sebaya (peer tutoring), serta mengulang simulasi terapan dasar hingga tuntas.`;
  }

  // Sintesis Glosarium Khusus Materi Pokok (Hanya berisi istilah teknis murni topik)
  const glosariumList = resolveContextualGlosarium([], p);

  // Daftar Pustaka Resmi BSKAP, Standar Industri, dan Bahan Acuan AI
  const daftarPustakaList = resolveContextualDaftarPustaka([], p);

  return {
    identifikasiPesertaDidik: [
      {
        kategori: "Pengetahuan Awal",
        identifikasi: idAwal.pesertaDidik ? `Berdasarkan observasi guru: ${idAwal.pesertaDidik}` : `Murid telah memiliki pemahaman dasar dan pengalaman kontekstual awal terkait materi ${topik} melalui interaksi pembelajaran sebelumnya atau media digital.`,
        tindakLanjut: "Mendorong aktivitas berbagi pengalaman (sharing session) serta asesmen diagnostik singkat untuk memetakan kesiapan awal belajar."
      },
      {
        kategori: "Minat dan Gaya Belajar",
        identifikasi: `Murid menunjukkan preferensi gaya belajar yang beragam (${gaya}), memerlukan kombinasi pendekatan visual, audio, dan praktik langsung.`,
        tindakLanjut: `Menyediakan variasi multimedia (${media}), tugas berbasis minat, eksplorasi karya di fasilitas ${fasilitas}, dan rotasi peran kelompok yang adaptif.`
      },
      {
        kategori: "Latar Belakang Sosial",
        identifikasi: `Murid memiliki keragaman latar belakang sosial-ekonomi dengan tingkat kemudahan akses informasi dan sarana teknologi yang bervariasi.`,
        tindakLanjut: `Memastikan seluruh murid mendapatkan akses setara terhadap sarana fasilitas belajar (${fasilitas}) serta menumbuhkan empati dan inklusivitas.`
      },
      {
        kategori: "Kebutuhan Belajar",
        identifikasi: `Sebagian murid memerlukan bimbingan terstruktur (scaffolding) untuk penerapan materi ${topik}, sementara murid berkemampuan tinggi memerlukan tugas eksplorasi karya yang lebih menantang.`,
        tindakLanjut: "Menerapkan diferensiasi proses dan produk penugasan, panduan bertahap, serta bimbingan terarah bagi murid yang memerlukan dukungan khusus."
      },
      {
        kategori: "Etika dan Sikap Kerja",
        identifikasi: idAwal.profilLulusan ? `Kesiapan etika kerja: ${idAwal.profilLulusan}` : "Murid umumnya bersikap santun dan komunikatif, namun perlu penguatan konsisten terkait integritas akademik, objektivitas analitis, dan tanggung jawab kerja kelompok.",
        tindakLanjut: "Menanamkan budaya saling menghargai pendapat, kejujuran karya, serta kedisiplinan tenggat waktu pada setiap penugasan."
      }
    ],
    identifikasiMateri: [
      {
        kategori: "Jenis Pengetahuan",
        deskripsi: idAwal.materi ? `${idAwal.materi}` : `Konseptual dan prosedural terapan, mencakup pemahaman teori inti, telaah fakta kontekstual, penalaran logis, dan penerapan pemecahan masalah nyata materi ${topik}.`
      },
      {
        kategori: "Relevansi Kehidupan",
        deskripsi: `Meningkatkan keterampilan berpikir kritis, literasi praktis, dan kepekaan dalam menyikapi persoalan riil di bidang ${mapel} pada era modern.`
      },
      {
        kategori: "Tingkat Kesulitan",
        deskripsi: "Sedang hingga tinggi, menuntut kemampuan analisis komprehensif, evaluasi kritis ragam alternatif solusi, serta sintesis karya orisinal."
      }
    ],
    dimensiProfil: (profilList.length > 0 ? profilList : ['Penalaran Kritis', 'Kreativitas', 'Kolaborasi', 'Kemandirian']).map(dim => ({
      dimensi: dim,
      deskripsi: `Murid menginternalisasikan nilai ${dim} secara nyata dalam seluruh tahapan pelaksanaan ${modelRaw} dan penugasan materi ${topik}.`
    })),
    desainPembelajaran: {
      pemahamanBermakna: `Memahami dan menguasai materi ${topik} bukan sekadar menghafal definisi teoretis, melainkan membangun kesadaran kritis, kemampuan berpikir analitis tingkat tinggi, serta kemahiran aplikatif untuk menghasilkan karya solutif dan bernilai guna di masyarakat secara adaptif dan beretika.`,
      pertanyaanPemantik: [
        `Bagaimana prinsip dan aplikasi materi ${topik} ini berdampak langsung terhadap dinamika kehidupan serta industri saat ini?`,
        `Tantangan atau risiko apa yang paling krusial muncul apabila proses dalam ${topik} tidak dirancang dengan strategi yang tepat?`,
        `Gagasan atau inovasi karya apa yang dapat kita ciptakan untuk menjawab kebutuhan nyata terkait bidang ${topik} ini?`
      ],
      lintasDisiplin: `Pembelajaran materi ${topik} beririsan dengan literasi digital, penalaran logis matematika/sains, etika sosial kemasyarakatan, serta keterampilan komunikasi visual dan verbal.`,
      praktikPedagogis: (() => {
        const pL = (pendekatan || '').toLowerCase();
        if (pL.includes('deep learning')) {
          return `Model ${modelRaw} diintegrasikan secara utuh dengan memfasilitasi murid mempraktikkan materi ${topik}. Pendekatan Deep Learning diterapkan melalui tahapan Surface Learning (fondasi konsep), Deep Learning (analisis mendalam), dan Transfer Learning (kreasi karya aplikatif) menggunakan metode ${metode}.`;
        }
        if (pL.includes('tpack')) {
          return `Model ${modelRaw} diintegrasikan secara utuh dengan memfasilitasi murid mempraktikkan materi ${topik}. Pendekatan TPACK diterapkan melalui integrasi teknologi (${media}), strategi pedagogis aktif, dan penguasaan konten materi (${topik}) menggunakan metode ${metode}.`;
        }
        if (pL.includes('saintifik') || pL.includes('scientific')) {
          return `Model ${modelRaw} diintegrasikan secara utuh dengan memfasilitasi murid mempraktikkan materi ${topik}. Pendekatan Saintifik diterapkan melalui tahapan 5M (Mengamati, Menanya, Mengumpulkan Data, Mengasosiasi, dan Mengomunikasikan) menggunakan metode ${metode}.`;
        }
        if (pL.includes('kontekstual') || pL.includes('ctl')) {
          return `Model ${modelRaw} diintegrasikan secara utuh dengan memfasilitasi murid mempraktikkan materi ${topik}. Pendekatan Kontekstual (CTL) diterapkan dengan mengaitkan materi secara langsung ke pengalaman otentik dunia nyata menggunakan metode ${metode}.`;
        }
        return `Model ${modelRaw} diintegrasikan secara utuh dengan memfasilitasi murid mempraktikkan materi ${topik}. Pendekatan ${pendekatan} diterapkan secara aktif dan kolaboratif untuk memperdalam kompetensi melalui metode ${metode}.`;
      })(),
      kemitraan: `Pembelajaran memperkuat kemitraan dengan praktisi industri, pakar profesional, komunitas pegiat bidang ${mapel}, atau organisasi terkait guna membagikan standar operasional dunia nyata.`,
      lingkungan: `Kegiatan pembelajaran memanfaatkan fasilitas ${fasilitas} yang didukung sarana media digital ${media} guna menciptakan iklim belajar aktif, aman, inspiratif, dan kolaboratif.`
    },
    pengalamanBelajar: pengalamanBelajar,
    materiAjarDeskriptif: `
Materi pokok **${topik}** pada mata pelajaran **${mapel}** merupakan pilar kompetensi fundamental yang memadukan wawasan teoretis dengan kemahiran terapan profesional. Pembahasan diawali dengan pemahaman mendalam mengenai hakikat, karakteristik dasar, serta kerangka operasional yang berlaku dalam bidang keilmuan terkait. Peserta didik mempelajari komponen-komponen inti, memahami hubungan kausalitas antarelemen, serta menguasai terminologi teknis yang menjadi standar baku di dunia kerja profesional.

Secara fungsional dan prosedural, penguasaan materi ini melibatkan penerapan parameter kerja presisi dan standar operasional prosedur (SOP) baku guna menjamin efisiensi dan kualitas luaran karya. Penguasaan instrumen kerja, kalibrasi peralatan, serta kepatuhan terhadap regulasi keselamatan kerja menjadi penentu utama dalam mengeksekusi setiap tahapan pekerjaan.

| Parameter / Dimensi Teknis | Deskripsi & Prinsip Operasional | Standar Penerapan & Pengujian Mutu |
|---|---|---|
| Landasan Konseptual & Teori | Pemahaman definisi, fungsi inti, dan klasifikasi elemen ${topik} | Memenuhi standar acuan kurikulum dan kriteria kompetensi industri |
| Prosedur Kerja & SOP Praktik | Alur penyiapan alat, eksekusi teknis sistematis, dan kepatuhan K3 | Ketepatan langkah kerja operasional dan akurasi hasil 100% |
| Kontrol Kualitas & Analisis | Evaluasi parameter kerja, kalibrasi instrumen, dan troubleshooting | Hasil karya/analisis bebas cacat teknis dan terverifikasi handal |

Pada tataran analisis lanjutan, penguasaan materi *${topik}* menuntut kemampuan bernalar kritis dalam mendiagnosis anomali teknis dan memecahkan permasalahan (*troubleshooting*) saat menghadapi dinamika kondisi riil di lapangan. Evaluasi berkelanjutan dan pengujian terukur memastikan setiap karya atau solusi yang dihasilkan memiliki presisi tinggi, daya guna optimal, dan nilai inovasi yang relevan dengan perkembangan industri modern.
    `.trim(),
    materiTambahan: materiTambahanVal,
    asesmen: asesmenData,
    refleksi: {
      guru: [
        `Apakah seluruh murid terlibat secara aktif, antusias, dan bertanggung jawab dalam proses pembelajaran model ${modelRaw} pada materi ${topik}?`,
        `Apakah stimulus pembelajaran dan media ${media} yang disediakan berhasil memantik nalar kritis serta motivasi berkarya murid?`,
        `Bagaimana efektivitas pendampingan yang saya berikan kepada murid yang memerlukan dukungan teknis selama kegiatan berlangsung?`,
        `Apakah alokasi waktu untuk setiap tahapan sintaks ${modelRaw} berjalan proporsional, kondusif, dan tuntas?`,
        `Aspek kegiatan belajar mana yang paling berhasil menciptakan interaksi belajar paling hidup, bermakna, dan menyenangkan bagi murid?`
      ],
      murid: [
        `Apa wawasan dan keterampilan baru yang paling berharga yang saya peroleh dari materi ${topik} hari ini?`,
        `Bagaimana peran dan kontribusi aktif saya dalam bekerja sama dengan anggota tim kelompok selama pembelajaran?`,
        `Tahapan mana dari kegiatan belajar yang paling menantang bagi saya, dan strategi apa yang saya gunakan untuk mengatasinya?`,
        `Bagaimana pengetahuan dan keterampilan materi ${topik} ini dapat saya manfaatkan dalam kehidupan nyata atau cita-cita profesi saya?`,
        `Hal apa yang ingin saya tingkatkan lagi dalam pertemuan berikutnya agar hasil karya dan pemahaman saya semakin optimal?`
      ]
    },
    lkpd: lkpdData,
    rubrikPenilaian: rubrikData,
    pengayaan: pengayaanText,
    remedial: remedialText,
    glosarium: glosariumList,
    daftarPustaka: daftarPustakaList
  };
}

/**
 * Buka Modul Ajar di Halaman Tab Baru
 */
function openGeneratedModulTab() {
  try {
    const newWin = window.open('preview-modul-ajar.html', '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.href = 'preview-modul-ajar.html';
    }
  } catch (e) {
    window.location.href = 'preview-modul-ajar.html';
  }
}

/**
 * Fallback jika form disubmit
 */
function handleGenerateModul(e) {
  if (e) e.preventDefault();
  confirmGenerateModul();
}

/**
 * ==========================================================================
 * INTEGRASI DAFTAR MODUL AJAR (PER-AKUN GOOGLE & MODE EDIT)
 * ==========================================================================
 */
/**
 * Simpan Modul Ajar ke Daftar Riwayat Akun Pengguna Aktif & Server Database
 */
async function saveModulToUserAccountList(modulPayload, status = 'Lengkap') {
  try {
    let user = null;
    try {
      const rawUser = localStorage.getItem(CURRENT_USER_KEY);
      if (rawUser) user = JSON.parse(rawUser);
    } catch (e) {}

    const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : 'guest';
    const userName = (user && user.name) ? user.name : (modulPayload.namaPenyusun || '');
    const listKey = `edu_modul_list_${userEmail}`;

    let list = [];
    try {
      const rawList = localStorage.getItem(listKey);
      if (rawList) list = JSON.parse(rawList);
    } catch (e) {
      list = [];
    }

    const modulId = modulPayload.id || ('modul_' + Date.now());
    modulPayload.id = modulId;

    const namaTopik = (modulPayload.topikMateri || modulPayload.isiTopikMateri || 'Topik Pembelajaran').trim();
    const namaJurusan = (modulPayload.jurusanSekolah || 'Reguler').trim();
    const namaModul = `${namaTopik} - ${namaJurusan}`;

    const faseKelasRaw = modulPayload.faseKelas || 'Fase E (Kelas 10 SMA/MA)';
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

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const updatedAtFormatted = `${day} ${month} ${year}, ${hours}:${minutes}`;

    let originalCreatedAt = modulPayload.createdAt || currentEditingOriginalCreatedAt;
    const existingInLocal = list.find(item => item.id === modulId);
    if (existingInLocal && existingInLocal.createdAt) {
      originalCreatedAt = existingInLocal.createdAt;
    }
    if (!originalCreatedAt) {
      originalCreatedAt = now.toISOString();
    }
    modulPayload.createdAt = originalCreatedAt;

    const finalStatus = status || modulPayload.status || (modulPayload.aiGeneratedContent ? 'Lengkap' : 'Draft');
    modulPayload.status = finalStatus;

    const itemRecord = {
      id: modulId,
      userEmail: userEmail,
      namaModul: namaModul,
      topikMateri: namaTopik,
      jurusanSekolah: namaJurusan,
      mataPelajaran: modulPayload.mataPelajaran || 'Mata Pelajaran',
      jenjangSekolah: modulPayload.jenjangSekolah || 'SMA / MA',
      jenjang: modulPayload.jenjangSekolah || 'SMA / MA',
      fase: fase,
      kelas: kelas,
      faseKelas: faseKelasRaw,
      status: finalStatus,
      createdAt: originalCreatedAt,
      updatedAt: now.toISOString(),
      updatedAtFormatted: updatedAtFormatted,
      payload: modulPayload
    };

    // 1. Simpan cache lokal terlebih dahulu (jaminan instan tersimpan ke browser guru)
    const existingIndex = list.findIndex(item => item.id === modulId);
    if (existingIndex !== -1) {
      list[existingIndex] = itemRecord;
    } else {
      list.unshift(itemRecord);
    }

    safeSetLocalStorage(listKey, JSON.stringify(list));
    safeSetLocalStorage('edu_editing_modul_payload', JSON.stringify(modulPayload));
    safeSetLocalStorage('edu_last_modul_payload', JSON.stringify(modulPayload));
    safeSetLocalStorage('edu_current_generated_modul', JSON.stringify(modulPayload));
    console.log(`[Edu Workspace] Modul Ajar (${finalStatus}) berhasil disimpan ke akun ${userEmail}:`, itemRecord.namaModul);

    // 2. Simpan ke Supabase Database Server
    try {
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.saveModul) {
        await SupabaseDB.saveModul({
          id: modulId,
          userId: 'b452d28a-4888-40a7-8a1e-930430df9f59',
          email: userEmail,
          userName: userName,
          subject: modulPayload.mataPelajaran || '',
          gradeLevel: faseKelasRaw || '',
          topic: namaTopik || '',
          curriculum: modulPayload.kurikulum || 'Kurikulum Merdeka',
          contentJson: { ...modulPayload, status: finalStatus }
        });
        console.log(`[Supabase] Modul (${finalStatus}) tersimpan:`, modulId);
      }
    } catch (e) {
      console.warn('Gagal simpan ke Supabase, mencoba server lokal:', e);
      // Fallback ke server lokal
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const resp = await fetch('/api/moduls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemRecord),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (resp && resp.ok) {
          const d = await resp.json().catch(() => null);
          console.log('[Server API] Modul tersimpan di database server:', d);
        }
      } catch (e2) {
        console.warn('Gagal sinkron server:', e2);
      }
    }

    return itemRecord;
  } catch (err) {
    console.error('Gagal menyimpan modul ke akun pengguna:', err);
  }
}

/**
 * Periksa dan Muat Data jika Form dibuka dari menu Edit pada Daftar Modul Ajar
 */
async function checkAndLoadEditModul() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    if (!editId) {
      currentEditingModulId = null;
      currentEditingOriginalCreatedAt = null;
      return;
    }

    currentEditingModulId = editId;
    let editPayload = null;

    // 1. Coba dari cache sesi editing sementara
    const rawKeys = ['edu_editing_modul_payload', 'edu_current_generated_modul', 'edu_last_modul_payload'];
    for (const k of rawKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          let parsed = JSON.parse(raw);
          if (typeof parsed === 'string') {
            try { parsed = JSON.parse(parsed); } catch (e) {}
          }
          if (parsed) {
            const pId = String(parsed.id || parsed.payload?.id || '');
            if (pId === String(editId) || !pId) {
              editPayload = parsed.payload ? parsed.payload : parsed;
              if (parsed.createdAt && !editPayload.createdAt) editPayload.createdAt = parsed.createdAt;
              break;
            }
          }
        } catch (e) {}
      }
    }

    // 2. Jika belum dapat, cari di daftar modul pengguna aktif di localStorage
    if (!editPayload) {
      let user = null;
      try {
        const rawUser = localStorage.getItem(CURRENT_USER_KEY);
        if (rawUser) user = JSON.parse(rawUser);
      } catch (e) {}
      const userEmail = (user && user.email) ? user.email.trim().toLowerCase() : 'guest';
      const listKey = `edu_modul_list_${userEmail}`;
      try {
        const rawList = localStorage.getItem(listKey);
        if (rawList) {
          const list = JSON.parse(rawList);
          const found = list.find(item => String(item.id) === String(editId));
          if (found) {
            editPayload = found.payload ? found.payload : found;
            if (found.createdAt && !editPayload.createdAt) editPayload.createdAt = found.createdAt;
          }
        }
      } catch (e) {}
    }

    // 3. Jika belum ditemukan di cache lokal, muat langsung dari database Supabase
    if (!editPayload) {
      try {
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getModuls) {
          const remoteList = await SupabaseDB.getModuls();
          if (Array.isArray(remoteList)) {
            const foundRemote = remoteList.find(m => String(m.id) === String(editId));
            if (foundRemote) {
              let pJson = foundRemote.content_json || foundRemote.contentJson || {};
              if (typeof pJson === 'string') {
                try { pJson = JSON.parse(pJson); } catch (e) {}
              }
              editPayload = {
                ...pJson,
                id: foundRemote.id,
                namaPenyusun: pJson.namaPenyusun || foundRemote.user_name || foundRemote.userName || '',
                mataPelajaran: pJson.mataPelajaran || foundRemote.subject || '',
                topikMateri: pJson.topikMateri || foundRemote.topic || '',
                faseKelas: pJson.faseKelas || foundRemote.grade_level || '',
                kurikulum: pJson.kurikulum || foundRemote.curriculum || 'Kurikulum Merdeka',
                createdAt: foundRemote.created_at || pJson.createdAt || ''
              };
            }
          }
        }
      } catch (e) {
        console.warn('Gagal memuat modul dari Supabase:', e);
      }
    }

    // 4. Fallback ke server API lokal (/api/moduls) jika ada
    if (!editPayload) {
      try {
        const resp = await fetch('/api/moduls');
        if (resp.ok) {
          const moduls = await resp.json();
          if (Array.isArray(moduls)) {
            const found = moduls.find(m => String(m.id) === String(editId));
            if (found) {
              editPayload = found.payload ? found.payload : found;
              if (found.createdAt) editPayload.createdAt = found.createdAt;
            }
          }
        }
      } catch (e) {
        console.warn('Gagal fetch modul dari server lokal:', e);
      }
    }

    if (!editPayload) {
      console.warn('Data modul untuk edit tidak ditemukan:', editId);
      return;
    }

    // Normalisasi struktur jika dibungkus dalam payload
    if (editPayload.payload) {
      editPayload = { ...editPayload.payload, id: editPayload.id || editPayload.payload.id };
    }

    applyEditPayloadToForm(editPayload);
  } catch (e) {
    console.warn('Gagal memuat modul mode edit:', e);
  }
}

/**
 * Terapkan Payload Modul ke Seluruh Input Formulir (Tahap 1, Tahap 2, dan Tahap 3)
 */
function applyEditPayloadToForm(p) {
  if (!p) return;

  // Catat ID dan tanggal buat asli
  if (p.id) currentEditingModulId = p.id;
  if (p.createdAt) currentEditingOriginalCreatedAt = p.createdAt;

  // ==========================================================
  // TAHAP 1: IDENTITAS & PENDIDIK
  // ==========================================================
  if (p.namaPenyusun && document.getElementById('namaPenyusun')) {
    document.getElementById('namaPenyusun').value = p.namaPenyusun;
  }
  const instVal = p.institusi || p.institusiPendidik;
  if (instVal && document.getElementById('institusiPendidik')) {
    document.getElementById('institusiPendidik').value = instVal;
  }
  if (p.tahunPenyusunan && document.getElementById('tahunPenyusunan')) {
    document.getElementById('tahunPenyusunan').value = p.tahunPenyusunan;
  }

  // Jenjang Sekolah (Picu handleJenjangChange agar opsi jurusan & fase siap)
  const jenjangVal = p.jenjangSekolah || p.jenjang || 'SMA / MA';
  const jenjangEl = document.getElementById('jenjangSekolah');
  if (jenjangEl) {
    jenjangEl.value = jenjangVal;
    if (typeof handleJenjangChange === 'function') handleJenjangChange();
  }
  if (p.jurusanSekolah && document.getElementById('jurusanSekolah')) {
    document.getElementById('jurusanSekolah').value = p.jurusanSekolah;
  }

  // Fase & Kelas
  if (p.faseKelas && document.getElementById('faseKelas')) {
    const faseEl = document.getElementById('faseKelas');
    const matched = Array.from(faseEl.options).some(o => o.value === p.faseKelas);
    if (!matched) {
      const foundOpt = Array.from(faseEl.options).find(o => o.value.includes(p.faseKelas) || p.faseKelas.includes(o.value));
      if (foundOpt) {
        faseEl.value = foundOpt.value;
      } else {
        const customOpt = document.createElement('option');
        customOpt.value = p.faseKelas;
        customOpt.textContent = p.faseKelas;
        customOpt.selected = true;
        faseEl.appendChild(customOpt);
        faseEl.value = p.faseKelas;
      }
    } else {
      faseEl.value = p.faseKelas;
    }
  }

  if (p.mataPelajaran && document.getElementById('mataPelajaran')) {
    document.getElementById('mataPelajaran').value = p.mataPelajaran;
  }
  if (p.elemenCP && document.getElementById('elemenCP')) {
    document.getElementById('elemenCP').value = p.elemenCP;
  }

  // ==========================================================
  // TAHAP 2: KONTEKS & IDENTIFIKASI AWAL
  // ==========================================================
  // A. Pilihan Topik / Materi
  const jenisInput = p.jenisInput || p.jenisInputKonteks;
  if (jenisInput && document.getElementById('jenisInputKonteks')) {
    document.getElementById('jenisInputKonteks').value = jenisInput;
    if (typeof handleJenisInputChange === 'function') handleJenisInputChange();
  }
  const topikVal = p.topikMateri || p.isiTopikMateri;
  if (topikVal && document.getElementById('isiTopikMateri')) {
    document.getElementById('isiTopikMateri').value = topikVal;
  }

  // B. Model Pembelajaran (Pilihan Dropdown / Manual)
  const modelSelect = document.getElementById('modelPembelajaran');
  const inputModelManual = document.getElementById('inputModelManual');
  const wrapperModelManual = document.getElementById('wrapperModelManual');
  if (modelSelect) {
    const rawModel = p.modelPembelajaran || '';
    const isManualModel = p.modelPembelajaranSelect === 'Input Manual' ||
      !!p.inputModelManual ||
      (rawModel && !Array.from(modelSelect.options).some(opt => opt.value === rawModel));

    if (isManualModel) {
      modelSelect.value = 'Input Manual';
      if (wrapperModelManual) wrapperModelManual.style.display = 'block';
      if (inputModelManual) inputModelManual.value = p.inputModelManual || rawModel;
    } else if (rawModel) {
      modelSelect.value = rawModel;
      if (wrapperModelManual) wrapperModelManual.style.display = 'none';
      if (inputModelManual) inputModelManual.value = '';
    }
  }

  // C. Pendekatan Pembelajaran (Pilihan Dropdown / Manual)
  const pendekatanSelect = document.getElementById('pendekatanPembelajaran');
  const inputPendekatanManual = document.getElementById('inputPendekatanManual');
  const wrapperPendekatanManual = document.getElementById('wrapperPendekatanManual');
  if (pendekatanSelect) {
    const rawPendekatan = p.pendekatanPembelajaran || '';
    const isManualPendekatan = p.pendekatanPembelajaranSelect === 'Input Manual' ||
      !!p.inputPendekatanManual ||
      (rawPendekatan && !Array.from(pendekatanSelect.options).some(opt => opt.value === rawPendekatan));

    if (isManualPendekatan) {
      pendekatanSelect.value = 'Input Manual';
      if (wrapperPendekatanManual) wrapperPendekatanManual.style.display = 'block';
      if (inputPendekatanManual) inputPendekatanManual.value = p.inputPendekatanManual || rawPendekatan;
    } else if (rawPendekatan) {
      pendekatanSelect.value = rawPendekatan;
      if (wrapperPendekatanManual) wrapperPendekatanManual.style.display = 'none';
      if (inputPendekatanManual) inputPendekatanManual.value = '';
    }
  }

  // D. Metode Pembelajaran (Checkbox Grid)
  let savedMetode = p.metodePembelajaran || [];
  if (typeof savedMetode === 'string') {
    savedMetode = savedMetode.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  const metodeCheckboxes = document.querySelectorAll('input[name="metodePembelajaran"]');
  metodeCheckboxes.forEach(cb => {
    cb.checked = Array.isArray(savedMetode) && savedMetode.some(m => m.toLowerCase() === cb.value.toLowerCase());
  });

  // E. Jumlah Pertemuan & Total Durasi JP
  if (p.jumlahPertemuan && document.getElementById('jumlahPertemuan')) {
    const pNum = String(p.jumlahPertemuan).replace(/[^\d]/g, '');
    if (pNum) document.getElementById('jumlahPertemuan').value = pNum;
  }
  if (p.totalJPDurasi && document.getElementById('totalJPDurasi')) {
    document.getElementById('totalJPDurasi').value = p.totalJPDurasi;
  } else if (typeof syncTotalJPDurasi === 'function') {
    syncTotalJPDurasi();
  }

  // F. Tujuan Pembelajaran & Materi Tambahan
  if (p.tujuanPembelajaran && document.getElementById('tujuanPembelajaran')) {
    document.getElementById('tujuanPembelajaran').value = p.tujuanPembelajaran;
  }
  if (p.materiTambahan && document.getElementById('materiTambahan')) {
    document.getElementById('materiTambahan').value = p.materiTambahan;
  }

  // G. Analisis Kebutuhan: Gaya Belajar & Media Digital
  if (p.gayaBelajarMurid && document.getElementById('gayaBelajarMurid')) {
    document.getElementById('gayaBelajarMurid').value = p.gayaBelajarMurid;
  }
  if (p.mediaDigital && document.getElementById('mediaDigital')) {
    document.getElementById('mediaDigital').value = p.mediaDigital;
  }

  // H. Fasilitas Belajar (Checkboxes Standar + Lainnya)
  let savedFasilitas = p.fasilitasList || p.fasilitasBelajar || [];
  if (typeof savedFasilitas === 'string') {
    savedFasilitas = savedFasilitas.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  const standardFasilitas = ['Lab Komputer', 'Proyektor/LCD', 'Internet Cepat', 'Smartphone Murid'];
  const fasilitasCheckboxes = document.querySelectorAll('input[name="fasilitasBelajar"]:not(#cbFasilitasLainnya)');
  const cbLainnya = document.getElementById('cbFasilitasLainnya');
  const inputLainnya = document.getElementById('inputFasilitasLainnya');
  const wrapperLainnya = document.getElementById('wrapperFasilitasLainnya');

  fasilitasCheckboxes.forEach(cb => {
    cb.checked = Array.isArray(savedFasilitas) && savedFasilitas.some(f => f.toLowerCase() === cb.value.toLowerCase());
  });

  const customFasilitas = Array.isArray(savedFasilitas)
    ? savedFasilitas.filter(f => !standardFasilitas.some(sf => sf.toLowerCase() === f.toLowerCase()) && f.toLowerCase() !== 'lainnya')
    : [];

  const manualFasilitasVal = p.inputFasilitasLainnya || customFasilitas.join('; ');
  if (manualFasilitasVal || (Array.isArray(savedFasilitas) && savedFasilitas.includes('Lainnya'))) {
    if (cbLainnya) cbLainnya.checked = true;
    if (wrapperLainnya) wrapperLainnya.style.display = 'block';
    if (inputLainnya) inputLainnya.value = manualFasilitasVal;
  } else {
    if (cbLainnya) cbLainnya.checked = false;
    if (wrapperLainnya) wrapperLainnya.style.display = 'none';
    if (inputLainnya) inputLainnya.value = '';
  }

  // I. Capaian Pembelajaran & Ceklis Ringkas CP
  if (p.capaianPembelajaran && document.getElementById('capaianPembelajaran')) {
    document.getElementById('capaianPembelajaran').value = p.capaianPembelajaran;
  }
  const isRingkas = p.ringkasCP === true || p.ceklisRingkasCP === true;
  if (document.getElementById('ceklisRingkasCP')) {
    document.getElementById('ceklisRingkasCP').checked = isRingkas;
  }

  // J. Dimensi Profil Lulusan (Checkboxes)
  let savedProfil = p.dimensiProfilLulusan || p.dimensiProfil || [];
  if (typeof savedProfil === 'string') {
    savedProfil = savedProfil.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  const dimensiCheckboxes = document.querySelectorAll('input[name="dimensiProfil"]');
  dimensiCheckboxes.forEach(cb => {
    cb.checked = Array.isArray(savedProfil) && savedProfil.some(dp => dp.toLowerCase() === cb.value.toLowerCase());
  });

  // K. Identifikasi Awal (Peserta Didik, Materi, Profil Lulusan)
  const idPeserta = p.identifikasiPesertaDidik || p.identifikasiAwal?.pesertaDidik;
  if (idPeserta && document.getElementById('identifikasiPesertaDidik')) {
    document.getElementById('identifikasiPesertaDidik').value = idPeserta;
  }

  const idMateri = p.identifikasiMateri || p.identifikasiAwal?.materi;
  if (idMateri && document.getElementById('identifikasiMateri')) {
    document.getElementById('identifikasiMateri').value = idMateri;
  }

  const idProfil = p.identifikasiProfilLulusan || p.identifikasiAwal?.profilLulusan;
  if (idProfil && document.getElementById('identifikasiProfilLulusan')) {
    document.getElementById('identifikasiProfilLulusan').value = idProfil;
  }

  // Simpan data modul yang sedang dibuka ini ke cache modul aktif agar tombol Buka Modul Ajar langsung dapat membuka dokumen ini
  try {
    localStorage.setItem('edu_current_generated_modul', JSON.stringify(p));
    localStorage.setItem('edu_last_modul_payload', JSON.stringify(p));
  } catch (e) {}

  // Kontainer hasil generate selalu tersembunyi diawal, baru muncul setelah klik 'Generate Modul Ajar'
  modulGeneratedInThisSession = false;
  const progressContainer = document.getElementById('generateProgressContainer');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  // ==========================================================
  // TAHAP 3: PERBARUI RINGKASAN REVIEW
  // ==========================================================
  if (typeof updateReviewSummary === 'function') {
    updateReviewSummary();
  }
}

document.addEventListener('DOMContentLoaded', initModulAjarPage);

// Sinkronisasi Realtime Penghapusan & Penonaktifan Akun dari Dashboard Admin
try {
  const syncChannel = new BroadcastChannel('edu_workspace_sync');
  syncChannel.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'USER_DELETED' || event.data.type === 'STATUS_UPDATED' || event.data.type === 'SYNC_USER')) {
      const curUser = getCurrentUser();
      if (curUser && (curUser.email || '').trim().toLowerCase() === (event.data.email || '').trim().toLowerCase()) {
        if (event.data.type === 'USER_DELETED') {
          curUser.status = 'Dihapus';
          curUser.isDeleted = true;
          curUser.isApproved = false;
        } else if (event.data.status) {
          curUser.status = event.data.status;
          if (event.data.status === 'Nonaktif' || event.data.status === 'Dinonaktifkan' || event.data.status === 'Ditolak') {
            curUser.isApproved = false;
          }
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(curUser));

        const isDeleted = curUser.status === 'Dihapus' || curUser.isDeleted === true;
        const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(curUser);
        const isDeactivated = curUser.status === 'Nonaktif' || curUser.status === 'Dinonaktifkan' || curUser.status === 'Ditolak' || curUser.isApproved === false || isExpired;

        if (isDeleted || isDeactivated) {
          window.location.replace("../../dashboard-pengguna/profil.html");
          return;
        }
      }
    }
    if (event.data && (event.data.type === 'FEATURES_UPDATED' || event.data.type === 'USER_FEATURES_UPDATED')) {
      const curUser = getCurrentUser();
      if (curUser && (curUser.email || '').trim().toLowerCase() === (event.data.email || '').trim().toLowerCase()) {
        const isAdm = curUser.role === 'Admin' || (typeof ADMIN_EMAIL !== 'undefined' && (curUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase());
        const feats = event.data.features || [];
        if (!isAdm && !feats.includes('generate_modul_ajar')) {
          curUser.features = feats;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(curUser));
          alert("Akses Fitur Dinonaktifkan: Hak akses fitur Pembuatan Modul Ajar telah dinonaktifkan oleh Administrator.");
          window.location.replace("../../dashboard-pengguna/daftar-modul-ajar.html");
        }
      }
    }
  });
} catch (e) {}



// Explicit Global Window Bindings
window.generateAIElemenCP = generateAIElemenCP;

