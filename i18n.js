/**
 * Edu Workspace - Internationalization (i18n) Engine
 * Mendukung Bahasa Indonesia ('id') dan Bahasa Inggris ('en')
 * Mengubah bahasa tampilan web dan hasil generate AI secara realtime
 */

const STORAGE_LANG_KEY = 'edu_current_language';

const TRANSLATIONS = {
  id: {
    // Brand & General
    lang_name: "Bahasa Indonesia",
    lang_selector_label: "Pilih Bahasa:",
    btn_back: "Kembali",
    btn_close: "Tutup",
    btn_cancel: "Batal",
    btn_save: "Simpan",
    btn_delete: "Hapus",
    btn_edit: "Edit",
    btn_view: "Lihat",
    btn_logout: "Keluar",
    btn_login: "Masuk",
    btn_see_more: "Dapatkan Sekarang",
    btn_generate_ai: "Generate With AI",

    // Navbar
    nav_home: "Home",
    nav_benefit: "Benefit",
    nav_feature: "Fitur",

    // Landing - Hero
    hero_title: "Kurangi Beban <span class=\"text-yellow\">Administrasi,</span> Maksimalkan Waktu <span class=\"text-yellow\">Mengajar.</span>",
    hero_desc: "Kita bukan untuk menghabiskan waktu mengurus administrasi. Kita ada untuk mengajar, menginspirasi, dan memberi dampak.",
    hero_cta: "Dapatkan Sekarang",
    page_title_landing: "Edu Workspace - Kurangi Beban Administrasi, Maksimalkan Waktu Mengajar",
    page_desc_landing: "Kita bukan untuk menghabiskan waktu mengurus administrasi. Kita ada untuk mengajar, menginspirasi, dan memberi dampak bersama Edu Workspace.",

    // Landing - Section 1: Kepercayaan
    trust_title: "Kepercayaan Institusi Pendidikan Terhadap <span class=\"text-yellow\">Edu Workspace</span>",
    trust_desc: "Kami hadir untuk mendampingi ribuan guru dan dosen di seluruh Indonesia dengan teknologi AI yang praktis dan mudah digunakan. Dengan mengurangi beban administratif dan pekerjaan yang menyita waktu, kami membantu para pendidik kembali fokus pada hal yang paling penting: mengajar, membimbing, dan memberikan dampak bagi generasi masa depan.",
    stat_active_users: "Pengguna Aktif",
    stat_total_modules: "Total Modul Dibuat",

    // Landing - Section 2: Benefit
    benefit_title: "Benefit Nyata untuk <span class=\"text-yellow\">Kualitas Mengajar</span> Kamu",
    benefit_1_title: "Hemat Waktu 98%",
    benefit_1_desc: "Ubah proses pembuatan modul ajar dari yang biasanya memakan waktu berhari-hari menjadi hitungan menit. Cukup tentukan topik, dan biarkan AI menyusun kerangka lengkapnya.",
    benefit_1_tag: "Efisiensi Tinggi",
    benefit_2_title: "Selaras Kurikulum Merdeka",
    benefit_2_desc: "Struktur format standar nasional: mulai dari Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), hingga integrasi Profil Pelajar Pancasila yang valid dan siap supervisi.",
    benefit_2_tag: "Terstandarisasi",
    benefit_3_title: "AI Khusus Konteks Edukasi",
    benefit_3_desc: "Bukan AI umum yang generik. Sistem Edu Workspace diformulasikan dengan taksonomi Bloom, diferensiasi belajar, dan gaya pendekatan pedagogik ruang kelas di Indonesia.",
    benefit_3_tag: "Pedagogik Akurat",
    benefit_4_title: "Ekspor Instan Word & PDF",
    benefit_4_desc: "Unduh modul yang telah dibuat dalam format Microsoft Word (.docx) yang dapat disunting bebas atau PDF bersih siap cetak tanpa khawatir tata letak (formatting) berantakan.",
    benefit_4_tag: "Format Fleksibel",

    // Landing - Section 3: Fitur
    features_title: "Fitur Komprehensif untuk <span class=\"text-yellow\">Setiap Kebutuhan Mengajar</span>",
    role_teacher: "Fitur Guru",
    role_lecturer: "Fitur Dosen",
    feat_modul_ajar: "AI Generate Modul Ajar",
    feat_ongoing: "Fitur Baru, On Going",

    // Login Page
    login_title: "Masuk ke Edu Workspace",
    login_subtitle: "Pilih peran akun Anda untuk melanjutkan",
    login_role_teacher: "Guru / Dosen",
    login_role_admin: "Administrator",
    login_email_label: "Alamat Email",
    login_email_placeholder: "nama@sekolah.sch.id atau gmail.com",
    login_password_label: "Kata Sandi",
    login_password_placeholder: "Masukkan kata sandi akun Anda",
    login_remember_me: "Ingat Saya",
    login_forgot_pass: "Lupa Kata Sandi?",
    login_btn_submit: "Masuk Sekarang",
    login_no_account: "Belum punya akun?",
    login_register_link: "Daftar Akun Baru",

    // User Dashboard
    dash_welcome: "Selamat Datang di Edu Workspace",
    dash_subtitle: "Pusat Pengelolaan Modul Ajar & Media Pembelajaran Berbasis AI",
    dash_hero_title: "Agen Cerdas untuk<br><span class=\"text-yellow\">Setiap Kebutuhan Mengajar.</span>",
    dash_hero_desc: "Rancang modul ajar dan asesmen cerdas secara instan. Kelola kebutuhan pembelajaran lebih cepat, hemat waktu administrasi.",
    dash_access_pill_active: "Sisa Akses: {days} Hari",
    dash_access_pill_permanent: "Akses Permanen",
    dash_card_modul_title: "Generate Modul Ajar",
    dash_card_modul_desc: "Buat naskah modul ajar Kurikulum Merdeka lengkap secara otomatis dengan panduan AI pakar kurikulum.",
    dash_card_media_title: "Generate Media Pembelajaran",
    dash_card_media_desc: "Rancang outline slide presentasi Canva & PowerPoint interaktif siap ajar dalam hitungan detik.",
    dash_card_list_title: "Daftar Modul Ajar Saya",
    dash_card_list_desc: "Lihat, edit, cetak, atau unduh kembali modul ajar yang telah berhasil dibuat sebelumnya.",
    dash_card_api_title: "Pengaturan Kunci API AI",
    dash_card_api_desc: "Kelola dan simpan Google Gemini API Key Anda untuk akses generate dokumen tanpa batas.",
    dash_card_profile_title: "Profil & Informasi Akun",
    dash_card_profile_desc: "Perbarui informasi pendidik, mata pelajaran, instansi sekolah, dan masa aktif langganan Anda.",

    // Daftar Modul Ajar
    modul_list_title: "Daftar Modul Ajar Saya",
    modul_list_subtitle: "Kelola seluruh modul ajar yang telah berhasil digenerate dan tersimpan di akun Anda.",
    modul_list_search_placeholder: "Cari berdasarkan judul materi, mata pelajaran, atau kelas...",
    modul_list_btn_create: "Buat Modul Ajar Baru",
    modul_list_col_title: "Judul Modul & Materi",
    modul_list_col_subject: "Mata Pelajaran",
    modul_list_col_grade: "Jenjang / Kelas",
    modul_list_col_date: "Tanggal Dibuat",
    modul_list_col_action: "Aksi",
    modul_list_empty: "Belum ada modul ajar yang tersimpan.",
    modul_list_empty_cta: "Mulai Buat Modul Pertama",

    // API Key
    api_key_title: "Pengaturan Kunci API AI",
    api_key_subtitle: "Kunci API resmi Anda tersimpan aman secara lokal di browser dan akun Anda.",
    api_key_gemini_tab: "Google Gemini AI (Direkomendasikan)",
    api_key_openai_tab: "ChatGPT / OpenAI",
    api_key_input_label: "API Key Google Gemini",
    api_key_input_placeholder: "Tempelkan kunci API (AIzaSy...)",
    api_key_btn_save: "Simpan Kunci API",
    api_key_btn_test: "Uji Koneksi API",
    api_key_status_saved: "Kunci API Tersimpan",
    api_key_status_empty: "Kunci API Belum Diatur",

    // Profil
    profile_title: "Profil Pendidik",
    profile_subtitle: "Informasi identitas akun dan status keanggotaan Edu Workspace Anda.",
    profile_name_label: "Nama Lengkap & Gelar",
    profile_email_label: "Alamat Email",
    profile_role_label: "Peran Akun",
    profile_instansi_label: "Satuan Pendidikan / Sekolah",
    profile_mapel_label: "Mata Pelajaran Utama",
    profile_expiry_label: "Masa Aktif Akun",

    // Modul Ajar Form
    step_1_title: "Tahap 1: Identitas & Model",
    step_2_title: "Tahap 2: Konteks & Capaian",
    step_3_title: "Tahap 3: Konfirmasi & Generate",
    form_school_label: "Satuan Pendidikan / Nama Sekolah",
    form_teacher_label: "Nama Penyusun / Guru",
    form_year_label: "Tahun Penyusunan",
    form_level_label: "Jenjang Sekolah",
    form_grade_label: "Fase & Kelas",
    form_subject_label: "Mata Pelajaran",
    form_topic_label: "Topik / Materi Pokok",
    form_model_label: "Model Pembelajaran",
    form_approach_label: "Pendekatan Pembelajaran",
    form_method_label: "Metode Pembelajaran",
    form_time_label: "Alokasi Waktu (JP)",
    form_sessions_label: "Jumlah Pertemuan",
    form_cp_label: "Capaian Pembelajaran (CP)",
    form_tp_label: "Tujuan Pembelajaran (TP)",
    form_enrichment_label: "Materi Tambahan / Pengayaan",
    btn_next_step: "Lanjut ke Tahap Berikutnya",
    btn_prev_step: "Kembali ke Tahap Sebelumnya",
    btn_start_generate: "Mulai Generate Modul Ajar",

    // Preview Modul Ajar
    doc_main_title: "MODUL AJAR KURIKULUM MERDEKA",
    btn_download_word: "Download Word",
    btn_download_pdf: "Download PDF",
    doc_author: "Nama Penyusun",
    doc_phase: "Fase / Kelas",
    doc_subject: "Mata Pelajaran",
    doc_topic: "Topik",
    doc_element: "Elemen",
    doc_time: "Alokasi Waktu",
    doc_model: "Model",
    doc_approach: "Pendekatan",
    doc_sec_a: "A. IDENTIFIKASI AWAL",
    doc_sub_a1: "1. Identifikasi Peserta Didik",
    doc_sub_a2: "2. Identifikasi Materi Pembelajaran",
    doc_sub_a3: "3. Identifikasi Profil Lulusan",
    doc_sec_b: "B. CAPAIAN DAN TUJUAN PEMBELAJARAN",
    doc_sec_c: "C. RANCANGAN PEMBELAJARAN",
    doc_sec_d: "D. LANGKAH-LANGKAH PEMBELAJARAN",
    doc_sec_e: "E. ASESMEN PEMBELAJARAN",
    doc_sec_f: "F. LEMBAR KERJA PESERTA DIDIK (LKPD)",
    doc_sec_g: "G. PENGAYAAN DAN REMEDIAL",
    doc_sec_h: "H. REFLEKSI GURU DAN PESERTA DIDIK",
    doc_sec_i: "I. GLOSARIUM",
    doc_sec_j: "J. DAFTAR PUSTAKA",

    // Media Pembelajaran
    media_title: "AI Media Pembelajaran Generator",
    media_subtitle: "Rancang materi presentasi visual siap ajar terstruktur untuk Canva dan PowerPoint.",
    media_subject_label: "Mata Pelajaran",
    media_grade_label: "Kelas / Jenjang",
    media_topic_label: "Materi Pembelajaran",
    media_slide_count_label: "Jumlah Slide",
    media_btn_generate: "Generate Outline Slide",

    // Logout Modal
    logout_modal_title: "Konfirmasi Keluar",
    logout_modal_desc: "Apakah Anda yakin ingin keluar dari sesi akun Edu Workspace saat ini?",
    logout_btn_cancel: "Batal",
    logout_btn_confirm: "Ya, Keluar"
  },

  en: {
    // Brand & General
    lang_name: "English",
    lang_selector_label: "Select Language:",
    btn_back: "Back",
    btn_close: "Close",
    btn_cancel: "Cancel",
    btn_save: "Save",
    btn_delete: "Delete",
    btn_edit: "Edit",
    btn_view: "View",
    btn_logout: "Logout",
    btn_login: "Sign In",
    btn_see_more: "Get Started Now",
    btn_generate_ai: "Generate With AI",

    // Navbar
    nav_home: "Home",
    nav_benefit: "Benefits",
    nav_feature: "Features",

    // Landing - Hero
    hero_title: "Reduce Administrative <span class=\"text-yellow\">Burden,</span> Maximize Teaching <span class=\"text-yellow\">Time.</span>",
    hero_desc: "We are not here to spend countless hours on paperwork. We are here to teach, inspire, and make a lasting impact.",
    hero_cta: "Get Started Now",
    page_title_landing: "Edu Workspace - Reduce Administrative Burden, Maximize Teaching Time",
    page_desc_landing: "We are not here to spend time managing administration. We are here to teach, inspire, and make an impact with Edu Workspace.",

    // Landing - Section 1: Kepercayaan
    trust_title: "Educational Institutions' Trust in <span class=\"text-yellow\">Edu Workspace</span>",
    trust_desc: "We support thousands of educators and lecturers across Indonesia with practical, intuitive AI technology. By dramatically streamlining paperwork and time-consuming administrative tasks, we empower educators to refocus on what matters most: teaching, mentoring, and shaping future generations.",
    stat_active_users: "Active Educators",
    stat_total_modules: "Total Modules Created",

    // Landing - Section 2: Benefit
    benefit_title: "Proven Benefits for <span class=\"text-yellow\">Your Teaching Excellence</span>",
    benefit_1_title: "Save 98% of Your Time",
    benefit_1_desc: "Transform the lesson plan preparation process from days into minutes. Simply input your topic, and let AI structure the comprehensive curriculum framework.",
    benefit_1_tag: "High Efficiency",
    benefit_2_title: "Aligned with Curriculum Standards",
    benefit_2_desc: "Standardized national format: from Learning Outcomes (CP), Learning Objectives Flow (ATP), to valid and inspection-ready Graduate Profile integration.",
    benefit_2_tag: "Standardized",
    benefit_3_title: "AI Dedicated to Education",
    benefit_3_desc: "Not generic conversational AI. The Edu Workspace system is formulated with Bloom's taxonomy, differentiated instruction, and proven classroom pedagogical strategies.",
    benefit_3_tag: "Accurate Pedagogy",
    benefit_4_title: "Instant Word & PDF Export",
    benefit_4_desc: "Download generated modules in freely editable Microsoft Word (.docx) format or clean, print-ready PDF with spotless typographical layout.",
    benefit_4_tag: "Flexible Formats",

    // Landing - Section 3: Fitur
    features_title: "Comprehensive Features for <span class=\"text-yellow\">Every Teaching Need</span>",
    role_teacher: "Teacher Features",
    role_lecturer: "Lecturer Features",
    feat_modul_ajar: "AI Teaching Module Generator",
    feat_ongoing: "New Feature, In Progress",

    // Login Page
    login_title: "Sign in to Edu Workspace",
    login_subtitle: "Choose your account role to proceed",
    login_role_teacher: "Teacher / Lecturer",
    login_role_admin: "Administrator",
    login_email_label: "Email Address",
    login_email_placeholder: "name@school.edu or gmail.com",
    login_password_label: "Password",
    login_password_placeholder: "Enter your account password",
    login_remember_me: "Remember Me",
    login_forgot_pass: "Forgot Password?",
    login_btn_submit: "Sign In Now",
    login_no_account: "Don't have an account?",
    login_register_link: "Create New Account",

    // User Dashboard
    dash_welcome: "Welcome to Edu Workspace",
    dash_subtitle: "AI-Powered Teaching Module & Learning Media Hub",
    dash_hero_title: "Intelligent AI Agents for<br><span class=\"text-yellow\">Every Teaching Need.</span>",
    dash_hero_desc: "Design curriculum lesson plans and smart assessments instantly. Manage your classroom needs faster, save administrative hours.",
    dash_access_pill_active: "Remaining Access: {days} Days",
    dash_access_pill_permanent: "Permanent Access",
    dash_card_modul_title: "Generate Teaching Module",
    dash_card_modul_desc: "Automatically compile complete curriculum lesson plans guided by expert pedagogical AI.",
    dash_card_media_title: "Generate Learning Media",
    dash_card_media_desc: "Design interactive Canva & PowerPoint slide outlines ready to teach in seconds.",
    dash_card_list_title: "My Teaching Modules",
    dash_card_list_desc: "View, edit, print, or download your previously generated lesson plan documents.",
    dash_card_api_title: "AI API Key Settings",
    dash_card_api_desc: "Manage and save your Google Gemini API Key for unlimited document generation.",
    dash_card_profile_title: "Profile & Account Info",
    dash_card_profile_desc: "Update your educator profile, subject specialties, institution, and subscription validity.",

    // Daftar Modul Ajar
    modul_list_title: "My Teaching Modules",
    modul_list_subtitle: "Manage all generated teaching modules saved under your account.",
    modul_list_search_placeholder: "Search by module title, subject, or grade level...",
    modul_list_btn_create: "Create New Module",
    modul_list_col_title: "Module Title & Topic",
    modul_list_col_subject: "Subject",
    modul_list_col_grade: "Level / Grade",
    modul_list_col_date: "Created Date",
    modul_list_col_action: "Actions",
    modul_list_empty: "No teaching modules saved yet.",
    modul_list_empty_cta: "Create Your First Module",

    // API Key
    api_key_title: "AI API Key Settings",
    api_key_subtitle: "Your official API key is stored securely in your browser and account.",
    api_key_gemini_tab: "Google Gemini AI (Recommended)",
    api_key_openai_tab: "ChatGPT / OpenAI",
    api_key_input_label: "Google Gemini API Key",
    api_key_input_placeholder: "Paste your API key (AIzaSy...)",
    api_key_btn_save: "Save API Key",
    api_key_btn_test: "Test API Connection",
    api_key_status_saved: "API Key Active & Saved",
    api_key_status_empty: "API Key Not Configured",

    // Profil
    profile_title: "Educator Profile",
    profile_subtitle: "Your account credentials and Edu Workspace membership status.",
    profile_name_label: "Full Name & Degree",
    profile_email_label: "Email Address",
    profile_role_label: "Account Role",
    profile_instansi_label: "Educational Institution / School",
    profile_mapel_label: "Primary Subject",
    profile_expiry_label: "Subscription Validity",

    // Modul Ajar Form
    step_1_title: "Step 1: Identity & Model",
    step_2_title: "Step 2: Context & Objectives",
    step_3_title: "Step 3: Review & Generate",
    form_school_label: "Educational Institution / School Name",
    form_teacher_label: "Author / Teacher Name",
    form_year_label: "Academic Year",
    form_level_label: "School Level",
    form_grade_label: "Phase & Grade",
    form_subject_label: "Subject",
    form_topic_label: "Main Topic / Subject Matter",
    form_model_label: "Instructional Model",
    form_approach_label: "Instructional Approach",
    form_method_label: "Teaching Method",
    form_time_label: "Time Allocation (Hours)",
    form_sessions_label: "Number of Sessions",
    form_cp_label: "Learning Outcomes (CP)",
    form_tp_label: "Learning Objectives (TP)",
    form_enrichment_label: "Enrichment / Additional Content",
    btn_next_step: "Proceed to Next Step",
    btn_prev_step: "Back to Previous Step",
    btn_start_generate: "Generate Teaching Module Now",

    // Preview Modul Ajar
    doc_main_title: "LESSON PLAN & TEACHING MODULE",
    btn_download_word: "Download Word",
    btn_download_pdf: "Download PDF",
    doc_author: "Author Name",
    doc_phase: "Phase / Grade",
    doc_subject: "Subject",
    doc_topic: "Topic",
    doc_element: "Element",
    doc_time: "Time Allocation",
    doc_model: "Model",
    doc_approach: "Approach",
    doc_sec_a: "A. INITIAL IDENTIFICATION",
    doc_sub_a1: "1. Student Identification",
    doc_sub_a2: "2. Learning Material Identification",
    doc_sub_a3: "3. Graduate Profile Identification",
    doc_sec_b: "B. LEARNING OUTCOMES & OBJECTIVES",
    doc_sec_c: "C. INSTRUCTIONAL DESIGN",
    doc_sec_d: "D. LEARNING ACTIVITIES & STEPS",
    doc_sec_e: "E. LEARNING ASSESSMENT",
    doc_sec_f: "F. STUDENT WORKSHEET (LKPD)",
    doc_sec_g: "G. ENRICHMENT AND REMEDIAL",
    doc_sec_h: "H. TEACHER AND STUDENT REFLECTION",
    doc_sec_i: "I. GLOSSARY",
    doc_sec_j: "J. REFERENCES & BIBLIOGRAPHY",

    // Media Pembelajaran
    media_title: "AI Learning Media Generator",
    media_subtitle: "Design structured, classroom-ready visual presentation outlines for Canva and PowerPoint.",
    media_subject_label: "Subject",
    media_grade_label: "Grade / Educational Level",
    media_topic_label: "Learning Material / Topic",
    media_slide_count_label: "Number of Slides",
    media_btn_generate: "Generate Slide Outline",

    // Logout Modal
    logout_modal_title: "Confirm Logout",
    logout_modal_desc: "Are you sure you want to sign out of your current Edu Workspace session?",
    logout_btn_cancel: "Cancel",
    logout_btn_confirm: "Yes, Sign Out"
  }
};

/**
 * Dapatkan bahasa aktif ('id' atau 'en')
 */
function getAppLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch (e) {}
  return 'id';
}

/**
 * Ambil teks terjemahan berdasarkan key
 */
function t(key, fallback = '') {
  const lang = getAppLanguage();
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined) {
    return TRANSLATIONS[lang][key];
  }
  if (TRANSLATIONS.id && TRANSLATIONS.id[key] !== undefined) {
    return TRANSLATIONS.id[key];
  }
  return fallback || key;
}

/**
 * Set bahasa aplikasi ('id' | 'en') dan perbarui seluruh antarmuka
 */
function setAppLanguage(lang) {
  if (lang !== 'id' && lang !== 'en') lang = 'id';
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch (e) {}

  document.documentElement.lang = lang;

  // Terapkan terjemahan ke seluruh DOM
  applyTranslations();

  // Update navbar global jika ada
  if (typeof renderEduNavbar === 'function') {
    try {
      renderEduNavbar();
    } catch (e) {}
  }

  // Update hero toggle buttons jika ada
  updateLanguageSwitcherUI(lang);

  // Broadcast event kustom
  try {
    window.dispatchEvent(new CustomEvent('edu_language_changed', { detail: { lang } }));
  } catch (e) {}
}

/**
 * Update status tombol selector bahasa di seluruh halaman
 */
function updateLanguageSwitcherUI(lang) {
  if (!lang) lang = getAppLanguage();

  document.querySelectorAll('.edu-lang-btn, .hero-lang-pill, .landing-lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Terapkan terjemahan ke elemen-elemen DOM yang memiliki atribut data-i18n
 */
function applyTranslations(root = document) {
  const lang = getAppLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.id;

  // 1. Teks Biasa (textContent)
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  // 2. HTML Terjemahan (innerHTML untuk formatting tebal, span highlight, dll)
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // 3. Placeholder Input
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) {
      el.placeholder = dict[key];
    }
  });

  // 4. Title / Tooltip
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key] !== undefined) {
      el.title = dict[key];
    }
  });

  // 5. Value (misal button value)
  root.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    if (dict[key] !== undefined) {
      el.value = dict[key];
    }
  });

  // 6. Update Title & Meta Description jika berada di landing page
  if (dict.page_title_landing && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
    document.title = dict.page_title_landing;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.page_desc_landing) {
      metaDesc.setAttribute('content', dict.page_desc_landing);
    }
  }

  // 7. Auto-terjemahkan kata-kata umum jika belum memiliki atribut data-i18n
  autoTranslateCommonPhrases(root, lang);

  // 8. Sinkronkan tombol UI
  updateLanguageSwitcherUI(lang);
}

/**
 * Menerjemahkan frasa-frasa umum di halaman secara otomatis
 */
function autoTranslateCommonPhrases(root, lang) {
  const isEn = lang === 'en';

  // Logout modal text
  const logoutTitle = root.querySelector('#logoutModalTitle, .logout-modal-title');
  if (logoutTitle) logoutTitle.textContent = isEn ? 'Confirm Logout' : 'Konfirmasi Keluar';
  const logoutDesc = root.querySelector('#logoutModalDesc, .logout-modal-desc');
  if (logoutDesc) logoutDesc.textContent = isEn ? 'Are you sure you want to sign out of your account?' : 'Apakah Anda yakin ingin keluar dari akun Anda?';
  const logoutCancel = root.querySelector('#btnCancelLogout, .btn-cancel-logout');
  if (logoutCancel) logoutCancel.textContent = isEn ? 'Cancel' : 'Batal';
  const logoutConfirm = root.querySelector('#btnConfirmLogout, .btn-confirm-logout');
  if (logoutConfirm) logoutConfirm.textContent = isEn ? 'Yes, Sign Out' : 'Ya, Keluar';

  // Back button text
  root.querySelectorAll('.btn-back-home span').forEach(span => {
    if (!span.getAttribute('data-i18n')) {
      span.textContent = isEn ? 'Back' : 'Kembali';
    }
  });

  // Preview Modul Ajar Header buttons
  const btnWord = root.querySelector('#btnDownloadWord span');
  if (btnWord) btnWord.textContent = isEn ? 'Download Word' : 'Download Word';
  const btnPdf = root.querySelector('#btnDownloadPDF span');
  if (btnPdf) btnPdf.textContent = isEn ? 'Download PDF' : 'Download PDF';
  const btnClose = root.querySelector('#btnCloseTab span');
  if (btnClose) btnClose.textContent = isEn ? 'Close' : 'Tutup';

  // Document Heading in Preview Modul Ajar
  const docHeading = root.querySelector('.doc-main-heading');
  if (docHeading) {
    docHeading.textContent = isEn ? 'LESSON PLAN & TEACHING MODULE' : 'MODUL AJAR KURIKULUM MERDEKA';
  }

  // Preview Metadata Labels
  root.querySelectorAll('.doc-metadata-table .meta-label').forEach(td => {
    const txt = td.textContent.trim().toLowerCase();
    if (txt === 'nama penyusun' || txt === 'author name') td.textContent = isEn ? 'Author Name' : 'Nama Penyusun';
    else if (txt === 'fase / kelas' || txt === 'phase / grade') td.textContent = isEn ? 'Phase / Grade' : 'Fase / Kelas';
    else if (txt === 'mata pelajaran' || txt === 'subject') td.textContent = isEn ? 'Subject' : 'Mata Pelajaran';
    else if (txt === 'topik' || txt === 'topic') td.textContent = isEn ? 'Topic' : 'Topik';
    else if (txt === 'elemen' || txt === 'element') td.textContent = isEn ? 'Element' : 'Elemen';
    else if (txt === 'alokasi waktu' || txt === 'time allocation') td.textContent = isEn ? 'Time Allocation' : 'Alokasi Waktu';
    else if (txt === 'model') td.textContent = isEn ? 'Model' : 'Model';
    else if (txt === 'pendekatan' || txt === 'approach') td.textContent = isEn ? 'Approach' : 'Pendekatan';
  });

  // Preview Section Headings
  root.querySelectorAll('.doc-section-title').forEach(st => {
    const txt = st.textContent.trim();
    if (txt.includes('IDENTIFIKASI AWAL') || txt.includes('INITIAL IDENTIFICATION')) {
      st.textContent = isEn ? 'A. INITIAL IDENTIFICATION' : 'A. IDENTIFIKASI AWAL';
    } else if (txt.includes('CAPAIAN DAN TUJUAN') || txt.includes('LEARNING OUTCOMES')) {
      st.textContent = isEn ? 'B. LEARNING OUTCOMES & OBJECTIVES' : 'B. CAPAIAN DAN TUJUAN PEMBELAJARAN';
    } else if (txt.includes('RANCANGAN PEMBELAJARAN') || txt.includes('INSTRUCTIONAL DESIGN')) {
      st.textContent = isEn ? 'C. INSTRUCTIONAL DESIGN' : 'C. RANCANGAN PEMBELAJARAN';
    } else if (txt.includes('LANGKAH-LANGKAH PEMBELAJARAN') || txt.includes('LEARNING ACTIVITIES')) {
      st.textContent = isEn ? 'D. LEARNING ACTIVITIES & STEPS' : 'D. LANGKAH-LANGKAH PEMBELAJARAN';
    } else if (txt.includes('ASESMEN PEMBELAJARAN') || txt.includes('LEARNING ASSESSMENT')) {
      st.textContent = isEn ? 'E. LEARNING ASSESSMENT' : 'E. ASESMEN PEMBELAJARAN';
    } else if (txt.includes('LEMBAR KERJA PESERTA DIDIK') || txt.includes('STUDENT WORKSHEET')) {
      st.textContent = isEn ? 'F. STUDENT WORKSHEET (LKPD)' : 'F. LEMBAR KERJA PESERTA DIDIK (LKPD)';
    } else if (txt.includes('PENGAYAAN DAN REMEDIAL') || txt.includes('ENRICHMENT AND REMEDIAL')) {
      st.textContent = isEn ? 'G. ENRICHMENT AND REMEDIAL' : 'G. PENGAYAAN DAN REMEDIAL';
    } else if (txt.includes('REFLEKSI GURU') || txt.includes('TEACHER AND STUDENT REFLECTION')) {
      st.textContent = isEn ? 'H. TEACHER AND STUDENT REFLECTION' : 'H. REFLEKSI GURU DAN PESERTA DIDIK';
    } else if (txt.includes('GLOSARIUM') || txt.includes('GLOSSARY')) {
      st.textContent = isEn ? 'I. GLOSSARY' : 'I. GLOSARIUM';
    } else if (txt.includes('DAFTAR PUSTAKA') || txt.includes('REFERENCES & BIBLIOGRAPHY')) {
      st.textContent = isEn ? 'J. REFERENCES & BIBLIOGRAPHY' : 'J. DAFTAR PUSTAKA';
    }
  });

  // Preview Subheadings
  root.querySelectorAll('.doc-sub-heading').forEach(sh => {
    const txt = sh.textContent.trim();
    if (txt.includes('Identifikasi Peserta Didik') || txt.includes('Student Identification')) {
      sh.textContent = isEn ? '1. Student Identification' : '1. Identifikasi Peserta Didik';
    } else if (txt.includes('Identifikasi Materi') || txt.includes('Learning Material Identification')) {
      sh.textContent = isEn ? '2. Learning Material Identification' : '2. Identifikasi Materi Pembelajaran';
    } else if (txt.includes('Identifikasi Profil') || txt.includes('Graduate Profile Identification')) {
      sh.textContent = isEn ? '3. Graduate Profile Identification' : '3. Identifikasi Profil Lulusan';
    }
  });
}

// Inisialisasi otomatis saat script dimuat
if (typeof window !== 'undefined') {
  window.EduI18n = {
    TRANSLATIONS,
    getAppLanguage,
    setAppLanguage,
    t,
    applyTranslations
  };
  window.getAppLanguage = getAppLanguage;
  window.setAppLanguage = setAppLanguage;
  window.t = t;
  window.applyTranslations = applyTranslations;

  const initI18n = () => {
    const curLang = getAppLanguage();
    document.documentElement.lang = curLang;
    applyTranslations();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
}
