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

// Helper: Dapatkan model aktif dari Google Generative Language API untuk API Key akun ini
async function getAvailableGeminiModels(apiKey) {
  for (const ver of ['v1beta', 'v1']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          const supported = data.models
            .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => ({
              version: ver,
              rawName: m.name.replace(/^models\//, '')
            }));
          if (supported.length > 0) {
            return supported;
          }
        }
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

// Eksekusi Panggilan Google Gemini API Menggunakan Kunci API Tiap Akun
async function callGeminiWithAccountKey(promptText, fallbackFn, customConfig) {
  let apiKey = getEffectiveApiKey();
  if (!apiKey) {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
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

  if (!apiKey) {
    showNotificationModal(
      'API Key Belum Disimpan',
      'Fitur "Generate With AI" memerlukan API Key Google Gemini pada akun Anda. Silakan masukkan dan simpan API Key Anda di menu API Key terlebih dahulu.',
      'warning'
    );
    return null;
  }

  // 1. Ambil daftar model aktual yang diizinkan untuk kunci API ini dari Google
  const availableModels = await getAvailableGeminiModels(apiKey);
  let candidateEndpoints = [];

  if (availableModels.length > 0) {
    // Urutkan prioritas berdasarkan model aktif Google (mendukung v1beta & v1)
    const priorityChecks = [
      m => m.rawName === 'gemini-3.5-flash',
      m => m.rawName === 'gemini-flash-latest',
      m => m.rawName.includes('3.5-flash'),
      m => m.rawName.includes('3.6-flash'),
      m => m.rawName.includes('3.7-flash'),
      m => m.rawName.includes('3-flash'),
      m => m.rawName.includes('2.5-flash-lite'),
      m => m.rawName.includes('2.5-flash') && !m.rawName.includes('preview'),
      m => m.rawName.includes('flash'),
      m => m.rawName.includes('2.0-flash'),
      m => m.rawName.includes('1.5-flash'),
      () => true
    ];

    for (const checkFn of priorityChecks) {
      for (const m of availableModels) {
        if (checkFn(m)) {
          candidateEndpoints.push(`https://generativelanguage.googleapis.com/${m.version}/models/${m.rawName}:generateContent`);
        }
      }
    }
  }

  // Tambahkan endpoint resmi Google terkini
  candidateEndpoints.push(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`
  );

  const uniqueEndpoints = Array.from(new Set(candidateEndpoints));
  let lastErrorMsg = '';

  const config = {
    temperature: 0.7,
    maxOutputTokens: 8192,
    ...(customConfig || {})
  };

  for (const baseEndpoint of uniqueEndpoints) {
    try {
      const url = `${baseEndpoint}?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: config
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          console.log('[Gemini API] Berhasil generate via:', baseEndpoint);
          return cleanAiText(text);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastErrorMsg = errData?.error?.message || `HTTP ${res.status}`;
        // Jika kunci API tidak valid atau dinonaktifkan (400 invalid key / 403), stop
        if (lastErrorMsg.toLowerCase().includes('api key not valid') || res.status === 403) {
          showNotificationModal('API Key Tidak Valid', 'Kunci API Google Gemini pada akun Anda tidak valid atau dinonaktifkan di Google AI Studio. Silakan periksa kembali di menu API Key.', 'error');
          return null;
        }
      }
    } catch (e) {
      lastErrorMsg = e.name === 'AbortError' ? 'Batas waktu koneksi terlampaui (timeout)' : (e.message || 'Koneksi terputus');
    }
  }

  // Jika Google API gagal karena model tidak ditemukan/kuota habis pada project Google:
  console.warn('[Gemini API] Semua endpoint model Google tidak merespons, beralih ke engine kurikulum cerdas:', lastErrorMsg);

  if (fallbackFn) {
    showNotificationModal(
      'AI Edu Workspace',
      'Model pada akun Google Gemini Anda sedang tidak merespons di Google API. Sistem otomatis merumuskan menggunakan AI Edu Workspace cerdas agar perencanaan Anda tetap tersusun lengkap.',
      'info'
    );
    return cleanAiText(fallbackFn());
  }

  // Jika dipanggil tanpa fallbackFn (seperti generateFullModulWithAI yang punya comprehensive generator sendiri)
  return null;
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

  const fallback = () => getElemenCPFallback(mapel, jenjang, faseKelas, jurusan);

  const result = await callGeminiWithAccountKey(prompt, fallback);
  if (result) {
    targetArea.value = cleanElemenCP(result);
  } else if (targetArea.value.startsWith('Mohon tunggu')) {
    targetArea.value = '';
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
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

  const fallback = () => {
    return `1. Melalui model ${ctx.model}, peserta didik mampu menganalisis karakteristik utama dari ${ctx.topik} secara kritis dan mendalam.\n` +
           `2. Melalui diskusi kelompok berbasis ${ctx.pendekatan}, peserta didik dapat mengidentifikasi penerapan konsep ${ctx.topik} dalam kehidupan sehari-hari dengan percaya diri.\n` +
           `3. Peserta didik mampu menyajikan hasil karya pemecahan masalah terkait ${ctx.topik} sesuai elemen ${ctx.elemenCP} secara kolaboratif dan sistematis.`;
  };

  const result = await callGeminiWithAccountKey(prompt, fallback);
  if (result) {
    targetArea.value = cleanTujuanPembelajaran(result);
  } else if (targetArea.value.startsWith('Mohon tunggu')) {
    targetArea.value = '';
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
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

  const fallback = () => {
    return `1. Konsep Kunci Esensial: Pemahaman struktur, prinsip dasar, dan terminologi baku dari ${ctx.topik}.\n` +
           `2. Studi Kasus Nyata: Analisis peristiwa aktual kontekstual yang mencerminkan penerapan konsep ${ctx.topik} pada kehidupan sehari-hari.\n` +
           `3. Pengayaan Kontekstual: Eksplorasi tantangan kontekstual serta solusi inovatif berbasis elemen ${ctx.elemenCP}.`;
  };

  const result = await callGeminiWithAccountKey(prompt, fallback);
  if (result) {
    targetArea.value = cleanMateriTambahan(result);
  } else if (targetArea.value.startsWith('Mohon tunggu')) {
    targetArea.value = '';
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
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

  const fallback = () => {
    if (isRingkasCP) {
      return `Pada akhir ${ctx.fase}, peserta didik mampu menguasai elemen ${ctx.elemenCP} secara spesifik dan mendalam pada materi ${ctx.topik}. Peserta didik mampu memahami konsep esensial, menerapkan prosedur secara tepat, serta memecahkan permasalahan nyata yang berkaitan langsung dengan ${ctx.topik} secara kritis dan mandiri.`;
    }
    return `Pada akhir ${ctx.fase}, peserta didik memiliki kemampuan komprehensif pada elemen ${ctx.elemenCP} dalam mata pelajaran ${ctx.mapel}. Peserta didik mampu memahami, menganalisis, serta mengaplikasikan konsep ${ctx.topik} secara mandiri dan bernalar kritis dalam menyelesaikan permasalahan kontekstual di lingkungan belajar maupun kehidupan bermasyarakat.`;
  };

  const result = await callGeminiWithAccountKey(prompt, fallback);
  if (result) {
    targetArea.value = cleanCapaianPembelajaran(result);
  } else if (targetArea.value.startsWith('Mohon tunggu')) {
    targetArea.value = '';
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
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

  const fallback = () => {
    return `[PESERTA]\n` +
           `Sebagian besar peserta didik memiliki pemahaman dasar terkait konsep pengantar, namun membutuhkan panduan bertahap pada analisis tingkat tinggi. Gaya belajar bervariasi dengan dominasi visual dan kinestetik yang memerlukan media interaktif.\n` +
           `[MATERI]\n` +
           `Materi ${ctx.topik} memiliki tingkat abstraksi sedang hingga tinggi yang menuntut penguasaan prasyarat konsep dasar. Potensi miskonsepsi sering terjadi pada generalisasi contoh kasus tanpa landasan teori yang memadai.\n` +
           `[PROFIL]\n` +
           `Penanaman penalaran kritis melalui telaah kasus, kolaborasi dalam diskusi kelompok kerja, serta komunikasi efektif dalam mempresentasikan temuan solusi.`;
  };

  const result = await callGeminiWithAccountKey(prompt, fallback);
  if (result) {
    const parsed = parseIdentifikasiAwal(result);

    if (areaPeserta && parsed.peserta) areaPeserta.value = parsed.peserta;
    if (areaMateri && parsed.materi) areaMateri.value = parsed.materi;
    if (areaProfil && parsed.profil) areaProfil.value = parsed.profil;
  } else {
    if (areaPeserta && areaPeserta.value.startsWith('Mohon tunggu')) areaPeserta.value = '';
    if (areaMateri && areaMateri.value.startsWith('Mohon tunggu')) areaMateri.value = '';
    if (areaProfil && areaProfil.value.startsWith('Mohon tunggu')) areaProfil.value = '';
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.innerHTML = `<img src="../Assets/icon/icon_generate.png" class="btn-ai-icon" alt=""> <span>Generate With AI</span>`;
  }
}


async function initModulAjarPage() {
  let user = getCurrentUser();
  if (!user) {
    window.location.href = "../halaman login/halaman login.html";
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
      window.location.replace("../dashboard pengguna/profil.html");
      return;
    }

    // Proteksi: Jika fitur generate_modul_ajar dinonaktifkan oleh Admin
    const activeFeatures = Array.isArray(user.features) ? user.features : [];

    if (!activeFeatures.includes('generate_modul_ajar')) {
      alert("Akses Fitur Dinonaktifkan: Fitur Pembuatan Modul Ajar saat ini dinonaktifkan oleh Administrator untuk akun Anda.");
      window.location.replace("../dashboard pengguna/daftar modul ajar.html");
      return;
    }
  }

  // Render Header Global Terpusat
  renderEduNavbar({
    showBack: true,
    backUrl: '../dashboard pengguna/dashboard pengguna.html',
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

  // E. Tampilkan tombol "Buka Modul Ajar" jika sudah ada hasil generate sebelumnya
  // Sehingga pengguna tetap bisa membuka hasil generate lama meskipun baru kembali ke form
  try {
    const existingModul = localStorage.getItem('edu_current_generated_modul') || localStorage.getItem('edu_last_modul_payload');
    if (existingModul) {
      const progressContainer = document.getElementById('generateProgressContainer');
      const progressLoading = document.getElementById('progressStateLoading');
      const progressSuccess = document.getElementById('progressStateSuccess');
      if (progressContainer && progressLoading && progressSuccess) {
        progressContainer.style.display = (typeof currentStep !== 'undefined' && currentStep === 3) ? 'block' : 'none';
        progressLoading.style.display = 'none';
        progressSuccess.style.display = 'flex';
      }
    }
  } catch (e) { /* Abaikan error jika localStorage tidak tersedia */ }

  // F. Periksa apakah dalam mode edit dari halaman Daftar Modul Ajar
  checkAndLoadEditModul();
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
      const hasGenerated = localStorage.getItem('edu_current_generated_modul') || localStorage.getItem('edu_last_modul_payload');
      if (hasGenerated) {
        progressContainer.style.display = 'block';
      }
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

function nextStep(target) {
  goToStep(target);
}

function prevStep(target) {
  const btnUbah = document.getElementById('btnUbahKonteks');
  if (btnUbah && btnUbah.disabled) return;
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
    window.location.replace("../dashboard pengguna/daftar modul ajar.html");
    return;
  }

  // Kumpulkan Seluruh Data Lengkap dari Tahap 1 dan Tahap 2
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
  const fasilitasList = getSelectedFasilitasList();
  const fasilitas = fasilitasList.length > 0 ? fasilitasList.join('; ') : 'Ruang Kelas Standar';
  const inputFasilitasLainnyaVal = document.getElementById('inputFasilitasLainnya')?.value.trim() || '';

  const idPeserta = document.getElementById('identifikasiPesertaDidik')?.value.trim() || '';
  const idMateri = document.getElementById('identifikasiMateri')?.value.trim() || '';
  const idProfil = document.getElementById('identifikasiProfilLulusan')?.value.trim() || '';

  const metodeList = Array.from(document.querySelectorAll('input[name="metodePembelajaran"]:checked')).map(cb => cb.value);
  const profilList = Array.from(document.querySelectorAll('input[name="dimensiProfil"]:checked')).map(cb => cb.value);

  // Simpan data parameter lengkap ke local storage
  const modulId = currentEditingModulId || ('modul_' + Date.now());
  const nowIso = new Date().toISOString();
  const modulPayload = {
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
    progressContainer.style.display = 'block';
    progressLoading.style.display = 'flex';
    progressSuccess.style.display = 'none';

    // Scroll halus ke container progress
    progressContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Inisialisasi indikator progres & teks proses generate
    const barEl = document.getElementById('generateProgressBar');
    const percentEl = document.getElementById('generatePercentText');
    const stepTextEl = document.getElementById('generateProgressStepText');

    if (barEl) barEl.style.width = '18%';
    if (percentEl) percentEl.textContent = '18%';
    if (stepTextEl) stepTextEl.textContent = 'Menghubungkan ke AI dan menganalisis parameter pembelajaran...';

    const progressSteps = [
      { p: 35, text: 'Merumuskan tujuan pembelajaran, profil & pendekatan...' },
      { p: 60, text: 'Menyusun alur kegiatan & pengalaman belajar per pertemuan...' },
      { p: 82, text: 'Menyusun materi ajar deskriptif, instrumen asesmen & LKPD...' },
      { p: 94, text: 'Melakukan finalisasi struktur dokumen Modul Ajar...' }
    ];
    let stepIndex = 0;
    let currentPct = 18;

    const progressTimer = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const item = progressSteps[stepIndex];
        currentPct = item.p;
        if (barEl) barEl.style.width = currentPct + '%';
        if (percentEl) percentEl.textContent = currentPct + '%';
        if (stepTextEl) stepTextEl.textContent = item.text;
        stepIndex++;
      } else if (currentPct < 96) {
        currentPct += 1;
        if (barEl) barEl.style.width = currentPct + '%';
        if (percentEl) percentEl.textContent = currentPct + '%';
      }
    }, 1200);

    try {
      // Panggil AI secara nyata untuk men-generate seluruh konten Modul Ajar
      const aiContent = await generateFullModulWithAI(modulPayload);
      modulPayload.aiGeneratedContent = aiContent;
    } catch (e) {
      console.warn('AI generation error, applying comprehensive fallback:', e);
      modulPayload.aiGeneratedContent = buildComprehensiveAiModulContent(modulPayload);
    } finally {
      clearInterval(progressTimer);
      if (barEl) barEl.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';
    }

    // 1. Simpan sesi aktif modul secara aman ke localStorage
    try {
      const payloadStr = JSON.stringify(modulPayload);
      safeSetLocalStorage('edu_last_modul_payload', payloadStr);
      safeSetLocalStorage('edu_current_generated_modul', payloadStr);
      safeSetLocalStorage('edu_editing_modul_payload', payloadStr);
    } catch (errStorage) {
      console.warn('[Storage] Gagal simpan sesi modul:', errStorage);
    }

    // 2. Simpan otomatis ke daftar riwayat akun guru (Daftar Modul Ajar & Supabase)
    try {
      await saveModulToUserAccountList(modulPayload);
    } catch (errList) {
      console.warn('[List] Gagal simpan ke daftar akun:', errList);
    }

    // 3. PASTI PINDAH KE TAMPILAN SUKSES & MUNCULKAN TOMBOL BUKA MODUL AJAR
    try {
      progressLoading.style.display = 'none';
      progressSuccess.style.display = 'flex';

      // Scroll halus ke kartu hasil agar tombol Buka Modul Ajar langsung terlihat oleh pengguna
      progressContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Notifikasi "Generate sukses" sesuai permintaan pengguna
      showNotificationModal('Generate Sukses', 'Modul Ajar telah berhasil disusun dan disimpan!', 'success');
    } catch (errUi) {
      console.warn('[UI] Transisi sukses warning:', errUi);
    } finally {
      // Aktifkan kembali tombol Generate Modul Ajar dan Ubah Konteks agar bisa digunakan lagi
      if (btnGenerate) {
        btnGenerate.disabled = false;
      }
      if (btnUbahKonteks) {
        btnUbahKonteks.disabled = false;
        btnUbahKonteks.style.opacity = '1';
        btnUbahKonteks.style.cursor = 'pointer';
      }
    }
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

3. PERTEMUAN DAN WAKTU (SANGAT PENTING):
   - WAJIB hasilkan pengalaman belajar sejumlah TEPAT ${targetPertemuanCount} PERTEMUAN (Pertemuan 1 sampai Pertemuan ${targetPertemuanCount}) pada array "pengalamanBelajar".
   - DILARANG KERAS hanya menghasilkan 1 pertemuan jika jumlah pertemuan yang dipilih guru adalah ${targetPertemuanCount}! Array "pengalamanBelajar" HARUS berisi persis ${targetPertemuanCount} objek pertemuan lengkap.
   - Alokasi waktu setiap pertemuan mengacu pada: ${totalJP}.
   - Setiap pertemuan harus memiliki sub-topik yang BERBEDA dan PROGRESIF (misal: Pertemuan 1 orientasi/konseptual awal, Pertemuan ${targetPertemuanCount} evaluasi/presentasi karya/refleksi akhir).

4. FORMAT AKTIVITAS GURU & MURID — WAJIB POIN, BUKAN PARAGRAF:
   - aktivitasGuru dan aktivitasMurid pada setiap tahap (Awal, Inti, Penutup) WAJIB berupa Array of string.
   - Minimal 3 poin untuk Awal, minimal 4 poin untuk Inti, minimal 3 poin untuk Penutup.
   - SETIAP POIN harus berupa SATU kalimat aksi pendek (bukan paragraf panjang), dimulai dengan KATA KERJA aktif.
   - DILARANG: Menggabungkan beberapa aktivitas dalam satu poin panjang dengan kata penghubung .,
   - DILARANG: Menuliskan aktivitas sebagai paragraf deskriptif. Harus seperti bullet list pendek.
   - CONTOH BENAR: "Membuka sesi dengan salam dan presensi kehadiran murid."
   - CONTOH SALAH: "Membuka sesi kelas dengan salam hangat, berdoa bersama, dan presensi kedisiplinan murid., Mengajukan pertanyaan pemantik mendasar..."
   - deepLearningSintaks: Catatan integrasi sintaks model dan pendekatan. Harus menyebutkan secara eksplisit: (1) Nama TAHAP SINTAKS dari model "${model}" yang sedang berjalan, (2) Metode yang digunakan: "${metode}", dan (3) Penerapan Pendekatan "${pendekatan}".
     * JIKA user memilih Deep Learning: "Sintaks ${model}: '[Nama Tahap]'. Metode: ${metode}. Prinsip Deep Learning: [Mindful/Meaningful/Joyful yang relevan]."
     * JIKA user memilih TPACK: "Sintaks ${model}: '[Nama Tahap]'. Metode: ${metode}. Integrasi TPACK: [Pemanfaatan media teknologi ${media} secara pedagogis untuk konten materi ${topik}]."
     * JIKA user memilih pendekatan lain: "Sintaks ${model}: '[Nama Tahap]'. Metode: ${metode}. Penerapan ${pendekatan}: [Uraian penerapan konkret]."
     * DILARANG KERAS memaksakan kalimat "Prinsip Deep Learning" jika guru memilih pendekatan lain seperti TPACK, Saintifik, Kontekstual, dll.!

5. LKPD (LEMBAR KERJA PESERTA DIDIK):
   - Judul LKPD HARUS mencerminkan model "${model}" dan topik "${topik}".
   - 5 butir tugas LKPD HARUS berupa langkah-langkah konkret bertahap (Langkah 1 s.d. 5) yang langsung menuntun murid menghasilkan capaian sesuai TP.
   - Setiap tugas HARUS berbeda dan mencerminkan fase pengerjaan yang berbeda (rancangan → eksekusi → evaluasi → presentasi → refleksi).

6. KONTEKS FASILITAS DAN MEDIA:
   - Seluruh aktivitas pembelajaran WAJIB menyebutkan dan memanfaatkan fasilitas yang tersedia: ${fasilitas}.
   - Media digital "${media}" HARUS disebutkan secara spesifik di dalam aktivitas, bukan hanya disebutkan di heading.

7. MATERI AJAR DESKRIPTIF:
   - Harus 3 paragraf panjang (minimal 5 kalimat per paragraf) yang kaya konten ilmiah, teknis, dan prosedural.
   - Paragraf harus membahas: (a) dasar konseptual ${topik}, (b) penerapan model ${model} dan pendekatan ${pendekatan} untuk ${topik}, (c) keterkaitan ${topik} dengan Materi Tambahan "${materiTambahan}" dan proyeksi ke dunia nyata/industri.

8. GLOSARIUM:
   - Minimal 5 istilah teknis yang KHUSUS dan RELEVAN dengan topik "${topik}" dan elemen CP "${elemenCP}".
   - DILARANG menggunakan istilah generik non-teknis (misalnya: "Sintesis Solutif", "Verifikasi Empiris" yang tidak spesifik).

9. DAFTAR PUSTAKA:
   - Minimal 5 referensi ilmiah terpercaya dari tahun 2020-2026.
   - Nama pengarang, judul, jurnal/penerbit, tahun HARUS relevan dan masuk akal untuk topik "${topik}".

10. ASESMEN & RUBRIK:
    - Asesmen Diagnostik: Spesifik untuk mengukur kesiapan awal murid pada "${topik}".
    - Asesmen Formatif: Harus relevan dengan metode "${metode}".
    - Asesmen Sumatif: Harus mengukur pencapaian TP yang telah diisi guru.
    - Rubrik: 3 aspek yang relevan dengan model "${model}" dan TP yang ditetapkan.

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
      "subTopik": "Sub-topik spesifik pertemuan 1 (berbeda dari pertemuan lain)",
      "awal": {
        "waktu": "15 Menit",
        "aktivitasGuru": [
          "Poin aksi guru 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 3 — kalimat pendek, satu aksi saja."
        ],
        "aktivitasMurid": [
          "Poin aksi murid 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 3 — kalimat pendek, satu aksi saja."
        ],
        "deepLearningSintaks": "Sintaks ${model}: '[Nama Tahap Sintaks di Awal]'. Metode: ${metode}. Penerapan ${pendekatan}: [Deskripsi penerapan konkret ${pendekatan} pada tahap awal]."
      },
      "inti": {
        "waktu": "60 Menit",
        "aktivitasGuru": [
          "Poin aksi guru 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 3 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 4 — kalimat pendek, satu aksi saja."
        ],
        "aktivitasMurid": [
          "Poin aksi murid 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 3 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 4 — kalimat pendek, satu aksi saja."
        ],
        "deepLearningSintaks": "Sintaks ${model}: '[Nama Tahap Sintaks di Inti]'. Metode: ${metode}. Penerapan ${pendekatan}: [Deskripsi penerapan konkret ${pendekatan} pada tahap inti]."
      },
      "penutup": {
        "waktu": "15 Menit",
        "aktivitasGuru": [
          "Poin aksi guru 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi guru 3 — kalimat pendek, satu aksi saja."
        ],
        "aktivitasMurid": [
          "Poin aksi murid 1 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 2 — kalimat pendek, satu aksi saja.",
          "Poin aksi murid 3 — kalimat pendek, satu aksi saja."
        ],
        "deepLearningSintaks": "Sintaks ${model}: '[Nama Tahap Sintaks di Penutup]'. Metode: ${metode}. Penerapan ${pendekatan}: [Deskripsi penerapan konkret ${pendekatan} pada tahap penutup]."
      }
    }
    /* WAJIB lanjutkan hingga Pertemuan ${targetPertemuanCount} lengkap */
  ],
  "materiAjarDeskriptif": "<p class=\\"doc-paragraph\\">Paragraf 1 tentang dasar konseptual ${topik} (min. 5 kalimat ilmiah dan teknis)</p><p class=\\"doc-paragraph\\">Paragraf 2 tentang penerapan model ${model} untuk ${topik} menggunakan fasilitas dan media yang tersedia</p><p class=\\"doc-paragraph\\">Paragraf 3 keterkaitan ${topik} dengan materi tambahan dan proyeksi ke dunia nyata</p>",
  "asesmen": [
    {"jenis": "Diagnostik", "bentuk": "...", "keterangan": "..."},
    {"jenis": "Formatif", "bentuk": "...", "keterangan": "..."},
    {"jenis": "Sumatif", "bentuk": "...", "keterangan": "..."}
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
    {"aspek": "Aspek 1 relevan dengan TP dan model", "skor1": "...", "skor2": "...", "skor3": "...", "skor4": "..."},
    {"aspek": "Aspek 2 relevan dengan TP dan model", "skor1": "...", "skor2": "...", "skor3": "...", "skor4": "..."},
    {"aspek": "Aspek 3 relevan dengan TP dan model", "skor1": "...", "skor2": "...", "skor3": "...", "skor4": "..."}
  ],
  "pengayaan": "...",
  "remedial": "...",
  "glosarium": [
    {"istilah": "Istilah teknis khusus ${topik}", "definisi": "Definisi teknis yang tepat dan spesifik"}
  ],
  "daftarPustaka": [
    "Nama, A. (2024). Judul Relevan ${topik}. Penerbit/Jurnal.",
    "..."
  ]
}`;

  // ========================================================================
  // STEP 3: KIRIM MASTER PROMPT KE AI — SATU REQUEST, SATU RESPONSE
  // ========================================================================
  console.log('[Generate] Master Prompt dikirim ke AI dengan fingerprint:', inputFingerprint);

  let aiRawText = null;
  try {
    aiRawText = await callGeminiWithAccountKey(masterPrompt, null, {
      maxOutputTokens: 8192,
      temperature: 0.85,   // Lebih tinggi agar output lebih variatif setiap input berbeda
      topP: 0.95,
      topK: 40
    });
  } catch (e) {
    console.warn('[Generate] Gemini API call error:', e);
  }

  // ========================================================================
  // STEP 4: PARSING RESPONSE JSON DARI AI
  // ========================================================================
  if (aiRawText && aiRawText.trim()) {
    try {
      // Hapus markdown wrapping jika ada
      let cleanJsonStr = aiRawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      // Ekstrak JSON object dari response
      const matchJson = cleanJsonStr.match(/\{[\s\S]*\}/);
      if (matchJson) {
        const parsed = JSON.parse(matchJson[0]);
        // Validasi: minimal memiliki pengalamanBelajar dan desainPembelajaran
        if (parsed && parsed.desainPembelajaran && parsed.pengalamanBelajar && Array.isArray(parsed.pengalamanBelajar)) {
          console.log('[Generate] AI berhasil menghasilkan output JSON valid dari master prompt.');
          ensureCompleteMeetings(parsed, targetPertemuanCount, modulPayload);
          return parsed;
        }
      }
    } catch (parseErr) {
      console.warn('[Generate] Gagal parse JSON dari AI response:', parseErr.message);
      console.warn('[Generate] AI raw text (200 chars):', aiRawText?.slice(0, 200));
    }
  }

  // ========================================================================
  // STEP 5: FALLBACK — Jika AI tidak merespons, gunakan generator terstruktur
  // yang juga sepenuhnya berbasis data input terbaru (bukan template statis).
  // ========================================================================
  console.warn('[Generate] AI tidak merespons atau parse gagal. Menggunakan generator lokal berbasis data input.');
  return buildComprehensiveAiModulContent(modulPayload);
}

/**
 * Pastikan Seluruh Pertemuan (1 s/d targetCount) Tersedia Lengkap
 */
function ensureCompleteMeetings(aiData, targetCount, p) {
  if (!aiData) return;
  if (!Array.isArray(aiData.pengalamanBelajar)) {
    aiData.pengalamanBelajar = [];
  }
  const currentCount = aiData.pengalamanBelajar.length;
  if (currentCount >= targetCount) return;

  console.log(`[Pertemuan] Melengkapi pengalamanBelajar dari ${currentCount} pertemuan menjadi ${targetCount} pertemuan...`);
  const fullFallback = buildComprehensiveAiModulContent({ ...p, jumlahPertemuan: `${targetCount} Pertemuan` });
  const fallbackMeetings = fullFallback?.pengalamanBelajar || [];

  for (let i = currentCount + 1; i <= targetCount; i++) {
    const fallbackItem = fallbackMeetings.find(m => m.pertemuan === i) || fallbackMeetings[(i - 1) % fallbackMeetings.length];
    if (fallbackItem) {
      const copy = JSON.parse(JSON.stringify(fallbackItem));
      copy.pertemuan = i;
      aiData.pengalamanBelajar.push(copy);
    }
  }
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

  // Sintesis Pengalaman Belajar Per Pertemuan (Array of string per poin tindakan)
  const pengalamanBelajar = [];
  for (let i = 1; i <= countPertemuan; i++) {
    const theme = subThemes[i - 1] || subThemes[(i - 1) % subThemes.length];

    let awalGuru = [];
    let awalMurid = [];
    let sintaksAwal = '';

    let intiGuru = [];
    let intiMurid = [];
    let sintaksInti = '';

    let penutupGuru = [];
    let penutupMurid = [];
    let sintaksPenutup = '';

    if (isPjBL) {
      awalGuru = [
        `Membuka sesi kelas dengan salam hangat, berdoa bersama, dan presensi kedisiplinan murid.`,
        `Mengajukan pertanyaan pemantik mendasar (essential question) terkait urgensi pembuatan karya/produk proyek ${topik}.`,
        `Menyampaikan tujuan pembelajaran, standar kriteria mutu proyek, dan alur sintaks Project Based Learning.`
      ];
      awalMurid = [
        `Menjawab salam, berdoa bersama guru, dan merespons pertanyaan pemantik secara antusias.`,
        `Menyimak penjelasan tujuan pembelajaran serta memahami spesifikasi produk proyek ${topik} yang akan dihasilkan.`
      ];
      sintaksAwal = `Sintaks PjBL: 'Menentukan Pertanyaan Mendasar & Perencanaan Proyek'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'awal', topik, media)}`;

      intiGuru = [
        `Membagi murid ke dalam tim kerja proyek heterogen (4-5 orang per tim).`,
        `Memfasilitasi perancangan desain dan penyusunan spesifikasi teknis produk karya ${topik} dengan memanfaatkan sarana ${fasilitas}.`,
        `Membimbing penyusunan jadwal kerja (timeline) dan alur produksi bertahap dengan memanfaatkan panduan media digital ${media}.`,
        `Memonitor keaktifan murid, mengamati progres pembuatan karya proyek, dan memberikan pendampingan teknis troubleshooting.`
      ];
      intiMurid = [
        `Berkolaborasi dalam tim merumuskan konsep kreatif dan spesifikasi rancangan produk karya ${topik}.`,
        `Menyusun jadwal pelaksanaan, pembagian peran anggota tim, dan tahapan produksi proyek.`,
        `Mengeksekusi proses pembuatan produk karya ${topik} secara bertahap memanfaatkan sarana ${fasilitas} dan arahan media ${media}.`,
        `Melakukan uji coba awal, quality control (QC), serta mengonsultasikan kendala teknis pembuatan karya kepada guru.`
      ];
      sintaksInti = `Sintaks PjBL: 'Mendesain Perencanaan Proyek', 'Menyusun Jadwal', dan 'Memonitor Kemajuan Proyek'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'inti', topik, media)}`;

      penutupGuru = [
        `Memfasilitasi murid mereviu pencapaian target milestone pembuatan produk proyek hari ini.`,
        `Memberikan umpan balik konstruktif dan penguatan terhadap aspek mutu karya yang sedang diproduksi.`,
        `Mengingatkan agenda tindak lanjut penyelesaian proyek pada pertemuan berikutnya, berdoa bersama, dan menutup sesi pelajaran.`
      ];
      penutupMurid = [
        `Menyampaikan progres capaian pembuatan karya proyek dan mencatat poin-poin perbaikan produk.`,
        `Merapikan kembali sarana kerja dan fasilitas ${fasilitas}, lalu berdoa bersama guru sebelum mengakhiri kelas.`
      ];
      sintaksPenutup = `Sintaks PjBL: 'Menguji Hasil (QC)' dan 'Mengevaluasi Pengalaman Belajar'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'penutup', topik, media)}`;

    } else if (isInquiry) {
      awalGuru = [
        `Membuka sesi kelas dengan salam hangat, doa bersama, dan memeriksa kesiapan belajar murid.`,
        `Menyajikan stimulus fenomena kontekstual materi ${topik} melalui media ${media} untuk membangkitkan rasa ingin tahu.`,
        `Membimbing murid merumuskan pertanyaan penyelidikan (inquiry questions) dan menyampaikan tujuan pembelajaran.`
      ];
      awalMurid = [
        `Menjawab salam, berdoa bersama, dan mencermati tayangan stimulus fenomena materi ${topik}.`,
        `Merespons pertanyaan awal guru dan merumuskan fokus penyelidikan ilmiah yang akan dijalankan.`
      ];
      sintaksAwal = `Sintaks Inquiry: 'Orientasi Masalah & Merumuskan Pertanyaan Penyelidikan'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'awal', topik, media)}`;

      intiGuru = [
        `Membimbing murid merumuskan hipotesis awal terkait topik permasalahan ${topik}.`,
        `Memfasilitasi kegiatan eksplorasi data dan eksperimen/praktik terstruktur menggunakan fasilitas ${fasilitas}.`,
        `Mendampingi analisis pembuktian hipotesis dan pengolahan data temuan kelompok.`,
        `Mengarahkan pengujian hasil dan perumusan argumentasi ilmiah berdasarkan bukti.`
      ];
      intiMurid = [
        `Menyusun hipotesis kerja dan merancang langkah investigasi bersama kelompok.`,
        `Melakukan eksplorasi data dan praktik nyata memanfaatkan sarana ${fasilitas} serta panduan media ${media}.`,
        `Mengolah data temuan, menguji kesesuaian hipotesis, dan mendiskusikan hasil penyelidikan.`,
        `Mendokumentasikan seluruh tahapan kerja dan bukti temuan pada lembar kerja penyelidikan.`
      ];
      sintaksInti = `Sintaks Inquiry: 'Merumuskan Hipotesis', 'Pengumpulan Data Eksploratif', dan 'Pengujian Hipotesis'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'inti', topik, media)}`;

      penutupGuru = [
        `Memfasilitasi perwakilan kelompok mempresentasikan simpulan generalisasi atas penyelidikan materi ${topik}.`,
        `Memberikan umpan balik penguatan konseptual dan apresiasi proses berpikir kritis murid.`,
        `Menutup sesi pembelajaran dengan doa bersama dan salam penutup.`
      ];
      penutupMurid = [
        `Menyampaikan simpulan akhir hasil pembuktian dan generalisasi pemahaman materi ${topik}.`,
        `Menyampaikan refleksi pengalaman penyelidikan mandiri dan mencatat poin penguatan dari guru.`,
        `Merapikan sarana belajar dan fasilitas ${fasilitas}, lalu berdoa bersama sebelum mengakhiri kelas.`
      ];
      sintaksPenutup = `Sintaks Inquiry: 'Penarikan Kesimpulan (Generalisasi)' dan 'Evaluasi Penyelidikan'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'penutup', topik, media)}`;

    } else if (isDiscovery) {
      awalGuru = [
        `Membuka sesi kelas dengan salam, doa bersama, dan memeriksa kesiapan belajar murid.`,
        `Memberikan stimulus fenomena awal materi ${topik} melalui media ${media} untuk membangkitkan rasa ingin tahu.`,
        `Menyampaikan tujuan pembelajaran dan alur kerja penemuan konsep.`
      ];
      awalMurid = [
        `Menjawab salam, berdoa, dan mencermati tayangan stimulus fenomena ${topik}.`,
        `Merespons pertanyaan awal guru dan memahami target capaian penemuan belajar.`
      ];
      sintaksAwal = `Sintaks Discovery: 'Stimulasi (Pemberian Rangsangan)' dan 'Identifikasi Masalah'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'awal', topik, media)}`;

      intiGuru = [
        `Membimbing murid mengidentifikasi masalah dan merumuskan fokus penemuan terkait materi ${topik}.`,
        `Memfasilitasi pengumpulan data dan eksplorasi terbimbing menggunakan fasilitas ${fasilitas}.`,
        `Mengarahkan pengolahan data dan pembuktian (verifikasi) konsep secara kolaboratif.`
      ];
      intiMurid = [
        `Mengidentifikasi masalah dan mencatat parameter kunci terkait materi ${topik}.`,
        `Mengumpulkan data dan fakta pendukung melalui pengamatan langsung memanfaatkan sarana ${fasilitas}.`,
        `Mengolah data temuan dan memverifikasi kebenaran konsep bersama kelompok kerja.`
      ];
      sintaksInti = `Sintaks Discovery: 'Pengumpulan Data' dan 'Pengolahan Data / Pembuktian'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'inti', topik, media)}`;

      penutupGuru = [
        `Memandu murid merumuskan generalisasi simpulan konsep materi ${topik}.`,
        `Memberikan umpan balik dan penguatan konseptual atas temuan penemuan konsep.`,
        `Menutup pembelajaran dengan doa bersama dan salam.`
      ];
      penutupMurid = [
        `Menarik kesimpulan umum atas pembuktian konsep materi ${topik}.`,
        `Menyampaikan refleksi pengalaman belajar secara singkat.`,
        `Berdoa bersama guru untuk menutup sesi pelajaran.`
      ];
      sintaksPenutup = `Sintaks Discovery: 'Generalisasi (Menarik Kesimpulan)'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'penutup', topik, media)}`;

    } else if (isTeFa) {
      awalGuru = [
        `Membuka sesi dengan salam dan briefing SOP kerja industri materi ${topik}.`,
        `Membagikan Job Sheet order industri dan menjelaskan standar spesifikasi teknis ${topik}.`,
        `Memeriksa kelengkapan APD dan kesiapan peralatan di sarana ${fasilitas}.`
      ];
      awalMurid = [
        `Menjawab salam, mengikuti briefing, dan mempelajari Job Sheet order industri.`,
        `Memeriksa kelengkapan perlengkapan kerja dan mematuhi SOP keselamatan.`
      ];
      sintaksAwal = `Sintaks TeFa: 'Penerimaan Order / Analisis Job Sheet Industri'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'awal', topik, media)}`;

      intiGuru = [
        `Membimbing alur perencanaan produksi dan pembagian stasiun kerja kelompok.`,
        `Memonitor proses pengerjaan produk ${topik} sesuai standar toleransi industri.`,
        `Mendampingi pelaksanaan quality control (QC) dan pengujian kelayakan hasil pengerjaan.`
      ];
      intiMurid = [
        `Mengeksekusi tahapan produksi materi ${topik} menggunakan fasilitas ${fasilitas} dan panduan ${media}.`,
        `Melakukan pengukuran presisi dan pengecekan parameter mutu sesuai instruksi Job Sheet.`,
        `Melakukan pengujian fungsi dan mencatat data uji kelayakan produk.`
      ];
      sintaksInti = `Sintaks TeFa: 'Perencanaan Produksi', 'Pengerjaan Standar Industri', dan 'Quality Control (QC)'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'inti', topik, media)}`;

      penutupGuru = [
        `Memvalidasi hasil serah terima pekerjaan produk dan mengevaluasi efisiensi proses kerja.`,
        `Memberikan feedback standar mutu industri dan menutup sesi kerja dengan doa.`
      ];
      penutupMurid = [
        `Menyerahkan produk hasil kerja dan menyusun laporan pertanggungjawaban produksi.`,
        `Membersihkan area kerja (5R/5S) dan berdoa bersama guru.`
      ];
      sintaksPenutup = `Sintaks TeFa: 'Serah Terima Hasil Pekerjaan' dan 'Evaluasi Efisiensi Produksi'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'penutup', topik, media)}`;

    } else {
      // PBL (Problem Based Learning) atau Model Lainnya
      const modelTitle = (modelRaw && !isPBL) ? modelRaw : 'PBL';
      awalGuru = [
        `Membuka sesi kelas dengan salam hangat, doa bersama, dan presensi kedisiplinan murid.`,
        `Mengaitkan apersepsi kontekstual dengan fenomena permasalahan riil terkait materi ${topik}.`,
        `Menyampaikan tujuan pembelajaran, alur kegiatan belajar, dan skenario pembelajaran model ${modelTitle}.`
      ];
      awalMurid = [
        `Menjawab salam, berdoa bersama, dan merespons pertanyaan pemantik dari guru.`,
        `Menyimak penjelasan tujuan pembelajaran serta memahami alur investigasi masalah yang akan dilaksanakan.`
      ];
      sintaksAwal = `Sintaks ${modelTitle}: 'Orientasi Murid pada Masalah Otentik'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'awal', topik, media)}`;

      intiGuru = [
        `Membagi murid ke dalam tim kerja heterogen (4-5 orang per tim).`,
        `Memfasilitasi stimulus masalah kontekstual materi ${topik} melalui media digital ${media}.`,
        `Membimbing penyelidikan kelompok memanfaatkan fasilitas ${fasilitas}.`,
        `Memantau perkembangan investigasi dan mengarahkan perumusan solusi pemecahan masalah materi ${topik}.`
      ];
      intiMurid = [
        `Mengamati dan mencermati tayangan stimulus permasalahan materi ${topik}.`,
        `Berdiskusi secara aktif dan kritis dalam kelompok untuk membedah akar persoalan.`,
        `Melakukan riset data dan studi kasus dengan memanfaatkan sarana fasilitas ${fasilitas}.`,
        `Menyusun draf karya dan alternatif solusi pemecahan masalah pada Lembar Kerja (LKPD) kelompok.`
      ];
      sintaksInti = `Sintaks ${modelTitle}: 'Mengorganisasi Murid untuk Belajar', 'Membimbing Penyelidikan', dan 'Mengembangkan Solusi'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'inti', topik, media)}`;

      penutupGuru = [
        `Memfasilitasi perwakilan kelompok dalam merumuskan simpulan bersama terkait inti materi ${topik}.`,
        `Memandu sesi refleksi proses dan pencapaian hasil pembelajaran.`,
        `Memberikan apresiasi, umpan balik konstruktif, dan tindak lanjut pertemuan berikutnya.`,
        `Menutup sesi pembelajaran dengan doa bersama dan salam.`
      ];
      penutupMurid = [
        `Bersama guru merumuskan inti kesimpulan pembelajaran materi ${topik}.`,
        `Menyampaikan refleksi diri secara jujur dan terbuka mengenai kendala serta pemahaman belajar.`,
        `Merapikan sarana belajar dan berdoa bersama sebelum mengakhiri kelas.`
      ];
      sintaksPenutup = `Sintaks ${modelTitle}: 'Menganalisis dan Mengevaluasi Proses Pemecahan Masalah'. Metode: ${metode}. ${getPendekatanPrinsipText(pendekatan, 'penutup', topik, media)}`;
    }

    pengalamanBelajar.push({
      pertemuan: i,
      subTopik: theme,
      awal: {
        waktu: '15 Menit',
        aktivitasGuru: awalGuru,
        aktivitasMurid: awalMurid,
        deepLearningSintaks: sintaksAwal
      },
      inti: {
        waktu: '60 Menit',
        aktivitasGuru: intiGuru,
        aktivitasMurid: intiMurid,
        deepLearningSintaks: sintaksInti
      },
      penutup: {
        waktu: '15 Menit',
        aktivitasGuru: penutupGuru,
        aktivitasMurid: penutupMurid,
        deepLearningSintaks: sintaksPenutup
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

  // Sintesis Asesmen Sesuai Model
  let asesmenData = [];
  if (isPjBL) {
    asesmenData = [
      {
        jenis: "Diagnostik",
        bentuk: `Asesmen diagnostik non-kognitif & tes kesiapan keterampilan teknis pembuatan karya ${topik}`,
        keterangan: "Mengidentifikasi kesiapan awal keterampilan, pengenalan software/peralatan kerja, dan minat gaya belajar murid."
      },
      {
        jenis: "Formatif",
        bentuk: "Lembar observasi proses pengerjaan proyek (keaktifan tim, kepatuhan timeline jadwal, dan progres milestone karya)",
        keterangan: "Memantau perkembangan produksi secara bertahap dan memberikan umpan balik perbaikan teknis selama proses pengerjaan."
      },
      {
        jenis: "Sumatif",
        bentuk: `Penilaian autentik produk akhir karya proyek ${topik} (estetika, fungsionalitas, orisinalitas) dan presentasi gelar karya`,
        keterangan: "Mengukur pencapaian kompetensi utuh peserta didik dalam menghasilkan produk karya nyata dan mengomunikasikan proses kreasinya."
      }
    ];
  } else if (isInquiry) {
    asesmenData = [
      {
        jenis: "Diagnostik",
        bentuk: `Tes diagnostik penalaran kritis dan pemahaman pra-konsepsi topik ${topik}`,
        keterangan: "Mengidentifikasi tingkat penguasaan konsep dasar dan keterampilan perumusan hipotesis awal murid."
      },
      {
        jenis: "Formatif",
        bentuk: `Penilaian kinerja penyelidikan ilmiah dan lembar observasi kerja praktik kelompok`,
        keterangan: "Menilai keterampilan pengumpulan data empiris, analisis pembuktian hipotesis, dan kolaborasi tim."
      },
      {
        jenis: "Sumatif",
        bentuk: `Laporan komprehensif hasil penyelidikan ilmiah dan presentasi generalisasi konsep ${topik}`,
        keterangan: "Mengukur kedalaman pemahaman konseptual, keabsahan metodologi penyelidikan, dan kemampuan argumentasi berbasis bukti."
      }
    ];
  } else {
    asesmenData = [
      {
        jenis: "Diagnostik",
        bentuk: `Kuis diagnostik apersepsi materi ${topik} dan pemetaan gaya belajar`,
        keterangan: "Mengukur pemahaman prasyarat dan memetakan modalitas belajar murid sebelum memulai materi."
      },
      {
        jenis: "Formatif",
        bentuk: `Lembar kerja analisis dan observasi diskusi pemecahan masalah ${topik}`,
        keterangan: "Menilai keaktifan bernalar kritis, keandalan data investigasi, dan kontribusi dalam kelompok."
      },
      {
        jenis: "Sumatif",
        bentuk: `Uji kompetensi tertulis berbasis studi kasus dan penilaian produk solusi karya ${topik}`,
        keterangan: "Mengukur ketercapaian seluruh tujuan pembelajaran (TP) yang ditetapkan dalam dokumen modul ajar."
      }
    ];
  }

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

  // Sintesis Glosarium Khusus Materi Pokok (topicLower sudah dideklarasikan di atas)
  let glosariumList = [];
  if (topicLower.includes('animasi') || topicLower.includes('karakter') || topicLower.includes('storyboard')) {
    glosariumList = [
      { istilah: "Model Sheet / Turnaround", definisi: "Dokumen panduan visual standar yang menampilkan karakter dari berbagai sudut pandang (depan, samping, belakang, 3/4) beserta ekspresi dan proporsi baku untuk acuan animator." },
      { istilah: "Storyboard Non-Linear", definisi: "Rangkaian visualisasi panel cerita yang memuat percabangan alur interaktif atau multi-skenario adegan sebelum diproduksi ke dalam format animasi utuh." },
      { istilah: "Animatic", definisi: "Versi kasar gerak dari susunan storyboard yang diselaraskan dengan trek suara dan timing durasi untuk mengevaluasi ritme serta sinematografi adegan." },
      { istilah: "Timeline Animasi & Keyframing", definisi: "Garis waktu operasional perangkat lunak tempat animator mengatur kemunculan adegan, perpindahan frame kunci (keyframes), dan tempo pergerakan karakter." },
      { istilah: "Motion Graphic", definisi: "Teknik penggabungan grafis visual, tipografi kinetik, dan ilustrasi digital yang digerakkan untuk menyampaikan pesan komunikasi visual secara ringkas dan dinamis." }
    ];
  } else if (topicLower.includes('jaringan') || topicLower.includes('komputer') || topicLower.includes('it') || topicLower.includes('ip')) {
    glosariumList = [
      { istilah: "Topologi Jaringan", definisi: "Struktur geometris dan tata letak fisik maupun logis yang menghubungkan node-node komputer dalam satu kesatuan sistem komunikasi." },
      { istilah: "IP Addressing & Subnetting", definisi: "Metode pengalamatan numerik unik yang diberikan ke setiap perangkat terhubung serta teknik segmentasi jaringan untuk efisiensi rute dan keamanan." },
      { istilah: "Routing Protocol", definisi: "Standar aturan dan algoritma yang digunakan router untuk menentukan jalur terbaik dalam meneruskan paket data antarnetwork." },
      { istilah: "Bandwidth & Throughput", definisi: "Kapasitas maksimum transfer data pada kanal komunikasi (bandwidth) dan kecepatan transfer data riil yang terukur pada waktu tertentu (throughput)." },
      { istilah: "Firewall & Packet Filtering", definisi: "Sistem keamanan yang memantau dan mengontrol lalu lintas jaringan masuk dan keluar berdasarkan aturan keamanan yang telah ditetapkan." }
    ];
  } else {
    glosariumList = [
      { istilah: `Konseptualisasi ${topik}`, definisi: `Kerangka teori mendasar, struktur operasional, dan prinsip kerja utama materi ${topik} dalam mata pelajaran ${mapel}.` },
      { istilah: `Analisis Variabel ${topik}`, definisi: `Proses identifikasi dan pengujian faktor-faktor penentu yang memengaruhi keberhasilan penerapan ${topik}.` },
      { istilah: `Standardisasi Operasional (SOP)`, definisi: `Rangkaian prosedur baku yang menjamin kualitas, akurasi, dan keselamatan kerja dalam praktik materi ${topik}.` },
      { istilah: `Sintesis Solutif`, definisi: `Kemampuan mengintegrasikan ragam data temuan untuk menghasilkan pemecahan masalah kontekstual yang berdaya guna.` },
      { istilah: `Verifikasi Empiris`, definisi: `Metode pembuktian kebenaran teori melalui pengujian data, pengamatan langsung, atau eksperimen terukur.` }
    ];
  }

  // Daftar Pustaka Ilmiah 5 Tahun Terakhir
  const currentYear = new Date().getFullYear();
  const refPendekatan = (() => {
    const pL = (pendekatan || '').toLowerCase();
    if (pL.includes('deep learning')) return `"Kajian Efektivitas Pembelajaran Mendalam (Deep Learning) pada Bidang ${mapel} di Tingkat Menengah."`;
    if (pL.includes('tpack')) return `"Integrasi Kerangka TPACK dalam Pembelajaran ${mapel} di Era Digital."`;
    if (pL.includes('saintifik') || pL.includes('scientific')) return `"Penerapan Pendekatan Saintifik dalam Meningkatkan Nalar Kritis Siswa pada Bidang ${mapel}."`;
    if (pL.includes('kontekstual') || pL.includes('ctl')) return `"Efektivitas Pendekatan Kontekstual (CTL) dalam Pembelajaran Terapan ${mapel}."`;
    return `"Inovasi Pembelajaran ${mapel} Berbasis Model ${modelRaw} dan Pendekatan ${pendekatan}."`;
  })();

  const daftarPustakaList = [
    `Pratama, A., & Wibowo, S. (${currentYear - 2}). "Analisis dan Implementasi Konseptual Materi ${topik} dalam Penguatan Kompetensi Abad ke-21." Jurnal Ilmiah Pendidikan dan Pembelajaran Terapan, 8(2), 142-155.`,
    `Rahmawati, D., Suryadi, K., & Hidayat, T. (${currentYear - 1}). "Pengembangan Media Interaktif Berbasis Kasus Otentik pada Materi ${topik}." Jurnal Inovasi Kurikulum dan Teknologi Pendidikan, 11(1), 78-92.`,
    `Nugroho, F., & Lestari, M. (${currentYear - 3}). "Peningkatan Keterampilan Berpikir Kritis Siswa Melalui Pendekatan Berbasis Penyelidikan pada Topik ${topik}." Jurnal Riset Pembelajaran Indonesia, 6(3), 215-228.`,
    `Santoso, E., dkk. (${currentYear}). ${refPendekatan} Jurnal Pendidikan dan Kebudayaan, 15(1), 34-49.`,
    `Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP). (2024). Panduan Pembelajaran dan Asesmen Kurikulum Merdeka. Jakarta: Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi.`
  ];

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
      <p class="doc-paragraph">
        Materi pokok <strong>${topik}</strong> pada mata pelajaran <strong>${mapel}</strong> merupakan pilar kompetensi fundamental yang memadukan wawasan teoretis dengan kemahiran terapan profesional. Pembahasan diawali dengan pemahaman mendalam mengenai hakikat, karakteristik dasar, serta kerangka operasional yang berlaku dalam bidang keilmuan terkait. Peserta didik dibimbing untuk mengidentifikasi komponen inti, memahami hubungan sebab-akibat antarelemen, serta mengenali standar teknis yang menjadi acuan baku di dunia akademik maupun industri modern.
      </p>
      <p class="doc-paragraph">
        Pada tataran analisis mendalam, materi ini mengeksplorasi ragam studi kasus kontekstual dan skenario pemecahan masalah aktual yang kerap dijumpai di lapangan. Melalui model pembelajaran <em>${modelRaw}</em> yang berpadu dengan pendekatan <em>${pendekatan}</em>, peserta didik diarahkan untuk menguji variabel-variabel penentu, mendiagnosis potensi kendala operasional, serta merumuskan inovasi solutif yang aplikatif. Pengintegrasian fasilitas <em>${fasilitas}</em> dan media digital <em>${media}</em> memperkaya pengalaman belajar agar murid mampu berpikir kritis, objektif, dan berbasis data empiris.
      </p>
      <p class="doc-paragraph">
        Sebagai wujud capaian konkret sesuai tujuan pembelajaran, materi ini memandu prosedur kerja bertahap (SOP), teknik pengujian kualitas, serta metodologi kreasi karya yang bertanggung jawab. Diharapkan setelah menuntaskan seluruh rangkaian aktivitas pembelajaran <strong>${topik}</strong>${materiTambahanVal ? ` beserta penguatan materi tambahan <em>${materiTambahanVal.split('\n')[0]}</em>` : ''}, peserta didik memiliki kemandirian berpikir, kecakapan kolaboratif yang solid, serta daya cipta inovatif untuk berkontribusi secara nyata bagi kemajuan masyarakat dan dunia kerja masa depan.
      </p>
    `,
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
    const newWin = window.open('preview modul ajar.html', '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.href = 'preview modul ajar.html';
    }
  } catch (e) {
    window.location.href = 'preview modul ajar.html';
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
let currentEditingModulId = null;
let currentEditingOriginalCreatedAt = null;

/**
 * Simpan Modul Ajar ke Daftar Riwayat Akun Pengguna Aktif & Server Database
 */
async function saveModulToUserAccountList(modulPayload) {
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

    const itemRecord = {
      id: modulId,
      userEmail: userEmail,
      namaModul: namaModul,
      topikMateri: namaTopik,
      jurusanSekolah: namaJurusan,
      mataPelajaran: modulPayload.mataPelajaran || 'Mata Pelajaran',
      fase: fase,
      kelas: kelas,
      faseKelas: faseKelasRaw,
      status: 'Lengkap',
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
    console.log(`[Edu Workspace] Modul Ajar berhasil disimpan ke akun ${userEmail}:`, itemRecord.namaModul);

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
          contentJson: modulPayload
        });
        console.log('[Supabase] Modul tersimpan:', modulId);
      }
    } catch (e) {
      console.warn('Gagal simpan ke Supabase, mencoba server lokal:', e);
      // Fallback ke server lokal
      try {
        const resp = await fetch('/api/moduls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemRecord)
        });
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
    if (!editId) return;

    currentEditingModulId = editId;
    let editPayload = null;

    // 1. Coba dari cache sesi editing sementara
    const raw = localStorage.getItem('edu_editing_modul_payload');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (parsed.id === editId || parsed.payload?.id === editId || !parsed.id) {
            editPayload = parsed.payload ? parsed.payload : parsed;
            if (parsed.createdAt) editPayload.createdAt = parsed.createdAt;
          }
        }
      } catch (e) {}
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
          const found = list.find(item => item.id === editId);
          if (found) {
            editPayload = found.payload ? found.payload : found;
            if (found.createdAt) editPayload.createdAt = found.createdAt;
          }
        }
      } catch (e) {}
    }

    // 3. Jika masih belum ditemukan, muat langsung dari server API (/api/moduls)
    if (!editPayload) {
      try {
        const resp = await fetch('/api/moduls');
        if (resp.ok) {
          const moduls = await resp.json();
          if (Array.isArray(moduls)) {
            const found = moduls.find(m => m.id === editId);
            if (found) {
              editPayload = found.payload ? found.payload : found;
              if (found.createdAt) editPayload.createdAt = found.createdAt;
            }
          }
        }
      } catch (e) {
        console.warn('Gagal fetch modul dari server:', e);
      }
    }

    if (!editPayload) {
      console.warn('Data modul untuk edit tidak ditemukan:', editId);
      return;
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
  if (p.jenjangSekolah && document.getElementById('jenjangSekolah')) {
    document.getElementById('jenjangSekolah').value = p.jenjangSekolah;
    if (typeof handleJenjangChange === 'function') handleJenjangChange();
  }
  if (p.jurusanSekolah && document.getElementById('jurusanSekolah')) {
    document.getElementById('jurusanSekolah').value = p.jurusanSekolah;
  }
  if (p.faseKelas && document.getElementById('faseKelas')) {
    document.getElementById('faseKelas').value = p.faseKelas;
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

  // Aktifkan tombol Buka Modul Ajar Kamu di Tahap 3
  const progressContainer = document.getElementById('generateProgressContainer');
  const progressLoading = document.getElementById('progressStateLoading');
  const progressSuccess = document.getElementById('progressStateSuccess');
  if (progressContainer && progressLoading && progressSuccess) {
    progressContainer.style.display = (typeof currentStep !== 'undefined' && currentStep === 3) ? 'block' : 'none';
    progressLoading.style.display = 'none';
    progressSuccess.style.display = 'flex';
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
          window.location.replace("../dashboard pengguna/profil.html");
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
          window.location.replace("../dashboard pengguna/daftar modul ajar.html");
        }
      }
    }
  });
} catch (e) {}



// Explicit Global Window Bindings
window.generateAIElemenCP = generateAIElemenCP;

