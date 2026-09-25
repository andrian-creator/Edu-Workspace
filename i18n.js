/**
 * Edu Workspace - Internationalization (i18n) Engine
 * Mendukung Bahasa Indonesia ('id') dan Bahasa Inggris ('en')
 * Mengubah bahasa tampilan web dan hasil generate AI secara realtime di SEMUA halaman
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
    btn_preview: "Pratinjau",
    btn_logout: "Keluar",
    btn_login: "Masuk",
    btn_see_more: "Dapatkan Sekarang",
    btn_generate_ai: "Generate With AI",
    btn_understand: "Mengerti",
    status_active: "Aktif",
    status_inactive: "Nonaktif",
    status_coming_soon: "Segera Hadir",
    status_not_available: "Belum Tersedia",
    status_saved: "Tersimpan",
    status_complete: "Lengkap",
    status_draft: "Draft",
    open_menu: "Buka Menu →",
    open_generator: "Buka Generator →",
    open_modules: "Buka Modul →",
    config_api_key: "Atur Kunci API →",
    view_profile: "Lihat Profil →",
    to_dashboard: "Ke Dashboard →",

    // Navbar
    nav_home: "Home",
    nav_benefit: "Benefit",
    nav_feature: "Fitur",
    nav_remaining_access: "Sisa Waktu Akses:",
    nav_active_perm: "Akses Permanen",
    nav_active: "Aktif",
    nav_modul_list: "Daftar Modul Ajar",
    nav_api_key: "API Key",

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
    login_title: "Dapatkan Akses",
    login_subtitle: "Masuk menggunakan Akun Google personal (@gmail.com) untuk login",
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
    login_success_title: "Login Berhasil!",
    login_success_desc: "Selamat datang kembali, mengalihkan ke dashboard...",

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
    modul_list_title: "Daftar <span class=\"text-yellow\">Modul Ajar.</span>",
    modul_list_subtitle: "Kelola, pratinjau, dan edit seluruh rancangan Modul Ajar Kurikulum Merdeka yang tersimpan pada akun Anda.",
    modul_list_search_placeholder: "Cari nama modul, topik, mata pelajaran...",
    modul_list_btn_create: "Buat Modul Ajar Baru",
    stat_total_modul: "Total Modul Disusun",
    stat_modul_lengkap: "Status Lengkap (Terverifikasi)",
    stat_terakhir_generate: "Terakhir Generate",
    modul_list_col_title: "Judul Modul & Materi",
    modul_list_col_subject: "Mata Pelajaran",
    modul_list_col_grade: "Jenjang / Kelas",
    modul_list_col_date: "Tanggal Dibuat",
    modul_list_col_action: "Aksi",
    modul_list_empty: "Belum ada modul ajar yang tersimpan.",
    modul_list_empty_cta: "Mulai Buat Modul Pertama",
    th_no: "NO",
    th_modul_name: "JUDUL MODUL & TOPIK",
    th_subject: "MATA PELAJARAN",
    th_level: "JENJANG",
    th_grade: "KELAS",
    th_status: "STATUS",
    th_created_date: "TANGGAL DIBUAT",
    th_action: "AKSI",

    // API Key Page
    api_key_title: "Manajemen <span class=\"text-yellow\">API Key.</span>",
    api_key_subtitle: "Kunci API resmi Anda tersimpan aman secara lokal di browser dan akun Anda.",
    api_key_gemini_tab: "Gemini (Chat Bot)",
    api_key_openai_tab: "ChatGPT (Image Generate)",
    guide_title: "Cara Mendapatkan Kunci API",
    guide_subtitle: "Ikuti 4 langkah mudah untuk mendapatkan Google Gemini API gratis",
    guide_step_1_title: "Kunjungi Google AI Studio",
    guide_step_1_desc: "Buka situs resmi Google AI Studio pada browser Anda.",
    guide_step_2_title: "Masuk dengan Akun Google",
    guide_step_2_desc: "Gunakan akun Google yang aktif (gratis tanpa biaya langganan).",
    guide_step_3_title: "Klik \"Get API Key\"",
    guide_step_3_desc: "Pilih tombol Create API key in new project lalu salin kunci yang muncul.",
    guide_step_4_title: "Tempelkan & Simpan",
    guide_step_4_desc: "Tempelkan kunci berawalan AQ... (format baru) atau AIza... ke form di sebelah kanan lalu klik Simpan Kunci API.",
    api_form_title: "Konfigurasi Google Gemini",
    api_form_desc: "Masukkan Google Gemini API Key Anda untuk mengaktifkan AI Generator",
    api_key_input_label: "API Key Google Gemini",
    api_key_input_placeholder: "Tempelkan API Key Google Gemini di sini (AIzaSy... atau AQ...)",
    api_key_btn_save: "Simpan Kunci API",
    api_key_btn_test: "Uji Koneksi API",
    api_key_status_saved: "Kunci API Tersimpan",
    api_key_status_empty: "Kunci API Belum Diatur",
    api_status_label: "Status Kunci API:",

    // Profil Page
    profile_title: "Profil Guru",
    profile_subtitle: "Lengkapi dan kelola informasi instansi dan mata pelajaran Anda untuk mengaktifkan seluruh fitur Edu Workspace.",
    profile_desc: "Lengkapi dan kelola informasi instansi dan mata pelajaran Anda untuk mengaktifkan seluruh fitur Edu Workspace.",
    profile_name_label: "Nama Lengkap & Gelar",
    profile_name_placeholder: "Contoh: Rico Eko Andrianto, S.Pd",
    profile_email_label: "Email Google (@gmail.com)",
    profile_role_label: "Peran Akun",
    profile_instansi_label: "Asal Sekolah / Instansi Pendidikan",
    profile_instansi_placeholder: "Contoh: SMAN 1 Jakarta / SMP Negeri 5 Bandung",
    profile_mapel_label: "Mata Pelajaran Utama",
    profile_grade_label: "Jenjang Pendidikan Mengajar",
    profile_grade_select: "Pilih Jenjang Sekolah",
    profile_expiry_label: "Masa Aktif Akun",
    profile_btn_save: "Simpan Data Profil",
    profile_btn_dashboard: "Ke Dashboard →",

    // Modul Ajar Generator Form
    modul_form_page_title: "Generate <span class=\"text-yellow\">Modul Ajar</span> With AI",
    step_1_title: "Tahap 1: Info Dasar",
    step_2_title: "Tahap 2: Konteks",
    step_3_title: "Tahap 3: Review & Generate",
    step_name_1: "Info Dasar",
    step_name_2: "Konteks",
    step_name_3_desktop: "Review & Generate",
    step_name_3_mobile: "Review",
    step1_card_title: "1. Info Dasar Modul Ajar",
    step1_card_desc: "Lengkapi identitas pendidik dan informasi kurikulum akademik.",
    sec_pendidik: "Informasi Pendidik",
    form_teacher_label: "Nama Penyusun",
    form_teacher_placeholder: "Contoh: Budi Santoso, S.Pd.",
    form_school_label: "Institusi",
    form_school_placeholder: "Nama Institusi / Sekolah",
    form_hint_auto_profile: "Otomatis dari data profil",
    sec_akademik: "Informasi Akademik",
    form_year_label: "Tahun Penyusunan",
    form_year_placeholder: "Contoh: 2026",
    form_level_label: "Jenjang Sekolah",
    form_level_select: "Pilih Jenjang Sekolah...",
    form_grade_label: "Fase & Kelas",
    form_subject_label: "Mata Pelajaran",
    form_topic_label: "Topik / Materi Pokok",
    form_topic_placeholder: "Contoh: Fotosintesis pada Tumbuhan Hijau",
    form_model_label: "Model Pembelajaran",
    form_approach_label: "Pendekatan Pembelajaran",
    form_method_label: "Metode Pembelajaran",
    form_time_label: "Alokasi Waktu (JP)",
    form_sessions_label: "Jumlah Pertemuan",
    btn_next_step: "Lanjut ke Tahap Berikutnya",
    btn_prev_step: "Kembali ke Tahap Sebelumnya",
    step2_card_title: "2. Konteks & Capaian Pembelajaran",
    step2_card_desc: "Tentukan capaian, tujuan pembelajaran, dan karakteristik peserta didik.",
    form_cp_label: "Capaian Pembelajaran (CP)",
    form_tp_label: "Tujuan Pembelajaran (TP)",
    form_enrichment_label: "Materi Tambahan / Pengayaan",
    step3_card_title: "3. Review & Konfirmasi Generator",
    step3_card_desc: "Periksa kembali parameter yang telah dimasukkan sebelum AI menyusun modul ajar.",
    btn_start_generate: "Generate Modul Ajar Sekarang",
    btn_generate_now: "Generate Modul Ajar Sekarang",

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
    media_title: "Generate <span class=\"text-yellow\">Media Pembelajaran</span> With AI",
    media_subtitle: "Rancang outline slide presentasi Canva & PowerPoint interaktif siap ajar dalam hitungan detik.",
    media_step_1: "Informasi Materi",
    media_step_2: "Outline Slide",
    media_step_3: "Hasil Media",
    media_step1_title: "1. Informasi Materi Presentasi",
    media_step1_desc: "Tentukan topik, materi pembelajaran, dan jumlah slide yang ingin dirancang AI",
    media_source_modul: "Ambil dari Modul Ajar",
    media_source_manual: "Isi Manual Sendiri",
    media_select_modul_label: "Pilih Modul Ajar Anda:",
    media_select_modul_default: "-- Pilih Modul Ajar Tersimpan --",
    media_subject_label: "Mata Pelajaran",
    media_grade_label: "Kelas / Jenjang",
    media_topic_label: "Materi Pembelajaran",
    media_slide_count_label: "Jumlah Slide",
    media_btn_generate: "Generate Outline Slide",

    // Admin Dashboard
    admin_dash_title: "Dashboard<br><span class=\"text-yellow\">Edu Workspace.</span>",
    admin_dash_desc: "Pusat kendali dan manajemen terpadu. Pantau aktivitas pengguna, verifikasi pendidik, dan kelola ekosistem edukasi secara efisien.",
    card_user_list_title: "Daftar Pengguna",
    card_user_list_desc: "Kelola data akun pendaftar, hak akses fitur pendidik, dan masa aktif langganan akun.",
    card_features_title: "Pengelola Fitur",
    card_features_desc: "Pengaturan modul pembelajaran, generator RPP AI, dan integrasi fitur sistem.",
    card_notif_title: "Pemberitahuan",
    card_notif_desc: "Kirim pengumuman massal, info pembaruan sistem, dan siaran pesan ke pengguna.",

    // Admin Daftar Pengguna
    admin_users_title: "Dashboard Pengguna",
    admin_users_desc: "Kelola data akun pendaftar, hak akses fitur pendidik, dan masa aktif langganan akun.",
    stat_active_accounts: "Akun Aktif",
    stat_inactive_accounts: "Nonaktif / Habis Langganan",
    stat_lecturer_accounts: "Akun Dosen",
    stat_teacher_accounts: "Akun Guru",
    users_search_placeholder: "Cari nama, email, sekolah...",
    th_user_email: "PENGGUNA / EMAIL",
    th_instansi_mapel: "INSTANSI & MAPEL",
    th_role: "PERAN",
    th_validity: "MASA AKTIF",

    // Admin Pengelola Fitur
    admin_features_title: "Pengelola Fitur",
    admin_features_desc: "Kelola hak akses modul pembelajaran, generator RPP AI, dan integrasi fitur sistem untuk setiap pengguna.",
    stat_total_users: "Total Pengguna",
    stat_full_access: "Akses Lengkap",
    features_search_placeholder: "Cari nama pengguna, email, atau peran...",
    th_user: "PENGGUNA",
    th_features: "FITUR",
    th_notes: "CATATAN",
    modal_manage_features_title: "Kelola Akses Fitur",
    modal_manage_features_desc: "Atur modul fitur aktif untuk akun pengguna ini.",
    btn_save_changes: "Simpan Perubahan",

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
    btn_preview: "Preview",
    btn_logout: "Log Out",
    btn_login: "Sign In",
    btn_see_more: "Get Started Now",
    btn_generate_ai: "Generate With AI",
    btn_understand: "Got It",
    status_active: "Active",
    status_inactive: "Inactive",
    status_coming_soon: "Coming Soon",
    status_not_available: "Not Available",
    status_saved: "Saved",
    status_complete: "Complete",
    status_draft: "Draft",
    open_menu: "Open Menu →",
    open_generator: "Open Generator →",
    open_modules: "Open Modules →",
    config_api_key: "Configure API Key →",
    view_profile: "View Profile →",
    to_dashboard: "To Dashboard →",

    // Navbar
    nav_home: "Home",
    nav_benefit: "Benefits",
    nav_feature: "Features",
    nav_remaining_access: "Remaining Access:",
    nav_active_perm: "Permanent Access",
    nav_active: "Active",
    nav_modul_list: "My Modules",
    nav_api_key: "API Key",

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
    login_title: "Get Access",
    login_subtitle: "Sign in using your personal Google Account (@gmail.com) to access",
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
    login_success_title: "Login Successful!",
    login_success_desc: "Welcome back, redirecting to dashboard...",

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
    modul_list_title: "My <span class=\"text-yellow\">Teaching Modules.</span>",
    modul_list_subtitle: "Manage, preview, and edit all curriculum lesson plans saved under your account.",
    modul_list_search_placeholder: "Search by module title, topic, subject...",
    modul_list_btn_create: "Create New Module",
    stat_total_modul: "Total Modules Created",
    stat_modul_lengkap: "Complete Status (Verified)",
    stat_terakhir_generate: "Last Generated",
    modul_list_col_title: "Module Title & Topic",
    modul_list_col_subject: "Subject",
    modul_list_col_grade: "Level / Grade",
    modul_list_col_date: "Created Date",
    modul_list_col_action: "Actions",
    modul_list_empty: "No teaching modules saved yet.",
    modul_list_empty_cta: "Create Your First Module",
    th_no: "NO",
    th_modul_name: "MODULE TITLE & TOPIC",
    th_subject: "SUBJECT",
    th_level: "LEVEL",
    th_grade: "GRADE",
    th_status: "STATUS",
    th_created_date: "CREATED DATE",
    th_action: "ACTION",

    // API Key Page
    api_key_title: "API Key <span class=\"text-yellow\">Management.</span>",
    api_key_subtitle: "Your official API key is stored securely in your browser and account.",
    api_key_gemini_tab: "Gemini (Chat Bot)",
    api_key_openai_tab: "ChatGPT (Image Generate)",
    guide_title: "How to Get API Key",
    guide_subtitle: "Follow 4 simple steps to get a free Google Gemini API key",
    guide_step_1_title: "Visit Google AI Studio",
    guide_step_1_desc: "Open the official Google AI Studio website in your browser.",
    guide_step_2_title: "Sign In with Google Account",
    guide_step_2_desc: "Use an active Google account (free with no subscription fees).",
    guide_step_3_title: "Click \"Get API Key\"",
    guide_step_3_desc: "Click Create API key in new project and copy the generated key.",
    guide_step_4_title: "Paste & Save",
    guide_step_4_desc: "Paste your key starting with AQ... or AIza... into the form on the right and click Save API Key.",
    api_form_title: "Google Gemini Configuration",
    api_form_desc: "Enter your Google Gemini API Key to activate the AI Generator",
    api_key_input_label: "Google Gemini API Key",
    api_key_input_placeholder: "Paste your Google Gemini API Key here (AIzaSy... or AQ...)",
    api_key_btn_save: "Save API Key",
    api_key_btn_test: "Test API Connection",
    api_key_status_saved: "API Key Active & Saved",
    api_key_status_empty: "API Key Not Configured",
    api_status_label: "API Key Status:",

    // Profil Page
    profile_title: "Teacher Profile",
    profile_subtitle: "Complete and manage your institution and subject information to enable all Edu Workspace features.",
    profile_desc: "Complete and manage your institution and subject information to enable all Edu Workspace features.",
    profile_name_label: "Full Name & Degree",
    profile_name_placeholder: "Example: Rico Eko Andrianto, S.Pd",
    profile_email_label: "Google Email (@gmail.com)",
    profile_role_label: "Account Role",
    profile_instansi_label: "School / Educational Institution",
    profile_instansi_placeholder: "Example: SMAN 1 Jakarta / SMP Negeri 5 Bandung",
    profile_mapel_label: "Primary Subject",
    profile_grade_label: "Teaching Grade Level",
    profile_grade_select: "Select School Level",
    profile_expiry_label: "Subscription Validity",
    profile_btn_save: "Save Profile Data",
    profile_btn_dashboard: "To Dashboard →",

    // Modul Ajar Generator Form
    modul_form_page_title: "Generate <span class=\"text-yellow\">Teaching Module</span> With AI",
    step_1_title: "Step 1: Basic Info",
    step_2_title: "Step 2: Context",
    step_3_title: "Step 3: Review & Generate",
    step_name_1: "Basic Info",
    step_name_2: "Context",
    step_name_3_desktop: "Review & Generate",
    step_name_3_mobile: "Review",
    step1_card_title: "1. Basic Teaching Module Info",
    step1_card_desc: "Complete educator identity and academic curriculum details.",
    sec_pendidik: "Educator Information",
    form_teacher_label: "Author Name",
    form_teacher_placeholder: "Example: Budi Santoso, S.Pd.",
    form_school_label: "Institution",
    form_school_placeholder: "School / Institution Name",
    form_hint_auto_profile: "Auto-filled from profile",
    sec_akademik: "Academic Information",
    form_year_label: "Academic Year",
    form_year_placeholder: "Example: 2026",
    form_level_label: "School Level",
    form_level_select: "Select School Level...",
    form_grade_label: "Phase & Grade",
    form_subject_label: "Subject",
    form_topic_label: "Main Topic / Learning Material",
    form_topic_placeholder: "Example: Photosynthesis in Green Plants",
    form_model_label: "Instructional Model",
    form_approach_label: "Instructional Approach",
    form_method_label: "Teaching Method",
    form_time_label: "Time Allocation (Hours)",
    form_sessions_label: "Number of Sessions",
    btn_next_step: "Proceed to Next Step",
    btn_prev_step: "Back to Previous Step",
    step2_card_title: "2. Context & Learning Outcomes",
    step2_card_desc: "Define learning outcomes, objectives, and student characteristics.",
    form_cp_label: "Learning Outcomes (CP)",
    form_tp_label: "Learning Objectives (TP)",
    form_enrichment_label: "Enrichment / Additional Material",
    step3_card_title: "3. Review & Generator Confirmation",
    step3_card_desc: "Review the entered parameters before AI compiles the teaching module.",
    btn_start_generate: "Generate Teaching Module Now",
    btn_generate_now: "Generate Teaching Module Now",

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
    media_title: "Generate <span class=\"text-yellow\">Learning Media</span> With AI",
    media_subtitle: "Design interactive Canva & PowerPoint slide outlines ready to teach in seconds.",
    media_step_1: "Material Info",
    media_step_2: "Slide Outline",
    media_step_3: "Media Output",
    media_step1_title: "1. Presentation Material Info",
    media_step1_desc: "Specify the topic, lesson material, and number of slides for AI to design",
    media_source_modul: "Import from Module",
    media_source_manual: "Manual Input",
    media_select_modul_label: "Select Your Teaching Module:",
    media_select_modul_default: "-- Select Saved Module --",
    media_subject_label: "Subject",
    media_grade_label: "Grade / Level",
    media_topic_label: "Learning Material",
    media_slide_count_label: "Number of Slides",
    media_btn_generate: "Generate Slide Outline",

    // Admin Dashboard
    admin_dash_title: "Edu Workspace<br><span class=\"text-yellow\">Dashboard.</span>",
    admin_dash_desc: "Unified control and management center. Monitor user activity, verify educators, and manage the educational ecosystem efficiently.",
    card_user_list_title: "User Directory",
    card_user_list_desc: "Manage registrant accounts, educator feature access permissions, and subscription validity.",
    card_features_title: "Feature Manager",
    card_features_desc: "Teaching module settings, AI lesson plan generator, and system feature integrations.",
    card_notif_title: "Notifications",
    card_notif_desc: "Send mass announcements, system update info, and user broadcasts.",

    // Admin Daftar Pengguna
    admin_users_title: "User Directory",
    admin_users_desc: "Manage registrant accounts, educator feature access permissions, and subscription validity.",
    stat_active_accounts: "Active Accounts",
    stat_inactive_accounts: "Inactive / Expired",
    stat_lecturer_accounts: "Lecturer Accounts",
    stat_teacher_accounts: "Teacher Accounts",
    users_search_placeholder: "Search name, email, school...",
    th_user_email: "USER / EMAIL",
    th_instansi_mapel: "INSTITUTION & SUBJECT",
    th_role: "ROLE",
    th_validity: "SUBSCRIPTION VALIDITY",

    // Admin Pengelola Fitur
    admin_features_title: "Feature Manager",
    admin_features_desc: "Manage module access permissions, AI lesson plan generator, and feature integration for each user.",
    stat_total_users: "Total Users",
    stat_full_access: "Full Access",
    features_search_placeholder: "Search user name, email, or role...",
    th_user: "USER",
    th_features: "FEATURES",
    th_notes: "NOTES",
    modal_manage_features_title: "Manage Feature Access",
    modal_manage_features_desc: "Configure active feature modules for this user account.",
    btn_save_changes: "Save Changes",

    // Logout Modal
    logout_modal_title: "Confirm Logout",
    logout_modal_desc: "Are you sure you want to sign out of your current Edu Workspace session?",
    logout_btn_cancel: "Cancel",
    logout_btn_confirm: "Yes, Sign Out"
  }
};

/**
 * Tabel Frasa Universal untuk auto-terjemahan teks DOM
 * [Teks ID, Teks EN]
 */
const PHRASE_PAIRS = [
  // Steppers
  ['Info Dasar', 'Basic Info'],
  ['Konteks', 'Context'],
  ['Review & Generate', 'Review & Generate'],
  ['Review', 'Review'],
  ['Informasi Materi', 'Material Info'],
  ['Outline Slide', 'Slide Outline'],
  ['Hasil Media', 'Media Output'],

  // Judul & Header Utama
  ['Generate Modul Ajar With AI', 'Generate Teaching Module With AI'],
  ['Generate Modul Ajar', 'Generate Teaching Module'],
  ['Generate Media Pembelajaran With AI', 'Generate Learning Media With AI'],
  ['Generate Media Pembelajaran', 'Generate Learning Media'],
  ['Daftar Modul Ajar Saya', 'My Teaching Modules'],
  ['Daftar Modul Ajar.', 'My Teaching Modules.'],
  ['Daftar Modul Ajar', 'Teaching Modules List'],
  ['Manajemen API Key.', 'API Key Management.'],
  ['Manajemen API Key', 'API Key Management'],
  ['Pengaturan Kunci API AI', 'AI API Key Settings'],
  ['Profil & Informasi Akun', 'Profile & Account Info'],
  ['Profil Guru', 'Teacher Profile'],
  ['Profil Pendidik', 'Educator Profile'],
  ['Dapatkan Akses', 'Get Access'],
  ['Dashboard Edu Workspace.', 'Edu Workspace Dashboard.'],
  ['Dashboard Pengguna', 'User Directory'],
  ['Pengelola Fitur', 'Feature Manager'],
  ['Pemberitahuan', 'Notifications'],

  // Modul Ajar Form
  ['1. Info Dasar Modul Ajar', '1. Basic Teaching Module Info'],
  ['Lengkapi identitas pendidik dan informasi kurikulum akademik.', 'Complete educator identity and academic curriculum details.'],
  ['Informasi Pendidik', 'Educator Information'],
  ['Nama Penyusun', 'Author Name'],
  ['Institusi', 'Institution'],
  ['Otomatis dari data profil', 'Auto-filled from profile'],
  ['Informasi Akademik', 'Academic Information'],
  ['Tahun Penyusunan', 'Academic Year'],
  ['Jenjang Sekolah', 'School Level'],
  ['Fase & Kelas', 'Phase & Grade'],
  ['Mata Pelajaran', 'Subject'],
  ['Topik / Materi Pokok', 'Main Topic / Learning Material'],
  ['Model Pembelajaran', 'Instructional Model'],
  ['Pendekatan Pembelajaran', 'Instructional Approach'],
  ['Metode Pembelajaran', 'Teaching Method'],
  ['Alokasi Waktu (JP)', 'Time Allocation (Hours)'],
  ['Alokasi Waktu', 'Time Allocation'],
  ['Jumlah Pertemuan', 'Number of Sessions'],
  ['2. Konteks & Capaian Pembelajaran', '2. Context & Learning Outcomes'],
  ['Tentukan capaian, tujuan pembelajaran, dan karakteristik peserta didik.', 'Define learning outcomes, objectives, and student characteristics.'],
  ['Capaian Pembelajaran (CP)', 'Learning Outcomes (CP)'],
  ['Tujuan Pembelajaran (TP)', 'Learning Objectives (TP)'],
  ['Materi Tambahan / Pengayaan', 'Enrichment / Additional Material'],
  ['3. Review & Konfirmasi Generator', '3. Review & Generator Confirmation'],
  ['Periksa kembali parameter yang telah dimasukkan sebelum AI menyusun modul ajar.', 'Review the entered parameters before AI compiles the teaching module.'],
  ['Lanjut ke Tahap Berikutnya', 'Proceed to Next Step'],
  ['Kembali ke Tahap Sebelumnya', 'Back to Previous Step'],
  ['Generate Modul Ajar Sekarang', 'Generate Teaching Module Now'],
  ['Mulai Generate Modul Ajar', 'Generate Teaching Module Now'],

  // Media Pembelajaran Form
  ['1. Informasi Materi Presentasi', '1. Presentation Material Information'],
  ['Tentukan topik, materi pembelajaran, dan jumlah slide yang ingin dirancang AI', 'Specify the topic, lesson material, and number of slides for AI to design'],
  ['Ambil dari Modul Ajar', 'Import from Module'],
  ['Isi Manual Sendiri', 'Manual Input'],
  ['Pilih Modul Ajar Anda:', 'Select Your Teaching Module:'],
  ['-- Pilih Modul Ajar Tersimpan --', '-- Select Saved Module --'],
  ['Materi Pembelajaran', 'Learning Material'],
  ['Jumlah Slide', 'Number of Slides'],
  ['Generate Outline Slide', 'Generate Slide Outline'],

  // API Key Guide & Form
  ['Cara Mendapatkan Kunci API', 'How to Get API Key'],
  ['Ikuti 4 langkah mudah untuk mendapatkan Google Gemini API gratis', 'Follow 4 simple steps to get a free Google Gemini API key'],
  ['Kunjungi Google AI Studio', 'Visit Google AI Studio'],
  ['Buka situs resmi Google AI Studio pada browser Anda.', 'Open the official Google AI Studio website in your browser.'],
  ['Masuk dengan Akun Google', 'Sign In with Google Account'],
  ['Gunakan akun Google yang aktif (gratis tanpa biaya langganan).', 'Use an active Google account (free with no subscription fees).'],
  ['Klik "Get API Key"', 'Click "Get API Key"'],
  ['Pilih tombol Create API key in new project lalu salin kunci yang muncul.', 'Click Create API key in new project and copy the generated key.'],
  ['Tempelkan & Simpan', 'Paste & Save'],
  ['Tempelkan kunci berawalan AQ... (format baru) atau AIza... ke form di sebelah kanan lalu klik Simpan Kunci API.', 'Paste your key starting with AQ... or AIza... into the form on the right and click Save API Key.'],
  ['Konfigurasi Google Gemini', 'Google Gemini Configuration'],
  ['Masukkan Google Gemini API Key Anda untuk mengaktifkan AI Generator', 'Enter your Google Gemini API Key to activate the AI Generator'],
  ['Status Kunci API:', 'API Key Status:'],
  ['Kunci API Google Gemini', 'Google Gemini API Key'],
  ['Simpan Kunci API', 'Save API Key'],
  ['Uji Koneksi API', 'Test API Connection'],
  ['Kunci API Tersimpan', 'API Key Active & Saved'],
  ['Kunci API Belum Diatur', 'API Key Not Configured'],

  // Profil Form
  ['Lengkapi dan kelola informasi instansi dan mata pelajaran Anda untuk mengaktifkan seluruh fitur Edu Workspace.', 'Complete and manage your institution and subject information to enable all Edu Workspace features.'],
  ['Nama Lengkap & Gelar', 'Full Name & Degree'],
  ['Email Google (@gmail.com)', 'Google Email (@gmail.com)'],
  ['Asal Sekolah / Instansi Pendidikan', 'School / Educational Institution'],
  ['Jenjang Pendidikan Mengajar', 'Teaching Grade Level'],
  ['Pilih Jenjang Sekolah', 'Select School Level'],
  ['Pilih Jenjang Sekolah...', 'Select School Level...'],
  ['Simpan Data Profil', 'Save Profile Data'],
  ['Ke Dashboard →', 'To Dashboard →'],

  // Buttons & Links
  ['Dapatkan Sekarang', 'Get Started Now'],
  ['Buat Modul Ajar Baru', 'Create New Module'],
  ['Buka Menu →', 'Open Menu →'],
  ['Buka Generator →', 'Open Generator →'],
  ['Buka Modul →', 'Open Modules →'],
  ['Atur Kunci API →', 'Configure API Key →'],
  ['Lihat Profil →', 'View Profile →'],
  ['Kembali', 'Back'],
  ['Tutup', 'Close'],
  ['Batal', 'Cancel'],
  ['Simpan', 'Save'],
  ['Hapus', 'Delete'],
  ['Edit', 'Edit'],
  ['Lihat', 'View'],
  ['Pratinjau', 'Preview'],
  ['Download Word', 'Download Word'],
  ['Download PDF', 'Download PDF'],
  ['Mengerti', 'Got It'],
  ['Keluar', 'Log Out'],
  ['Log Out', 'Log Out'],

  // Stats & Badges
  ['Aktif', 'Active'],
  ['Nonaktif', 'Inactive'],
  ['Segera Hadir', 'Coming Soon'],
  ['Belum Tersedia', 'Not Available'],
  ['Akun Aktif', 'Active Accounts'],
  ['Nonaktif / Habis Langganan', 'Inactive / Expired'],
  ['Akun Dosen', 'Lecturer Accounts'],
  ['Akun Guru', 'Teacher Accounts'],
  ['Total Pengguna', 'Total Users'],
  ['Akses Lengkap', 'Full Access'],
  ['Total Modul Disusun', 'Total Modules Created'],
  ['Status Lengkap (Terverifikasi)', 'Complete Status (Verified)'],
  ['Terakhir Generate', 'Last Generated'],
  ['Sisa Waktu Akses:', 'Remaining Access:'],
  ['Akses Permanen', 'Permanent Access'],

  // Admin Descriptions
  ['Pusat kendali dan manajemen terpadu. Pantau aktivitas pengguna, verifikasi pendidik, dan kelola ekosistem edukasi secara efisien.', 'Unified control and management center. Monitor user activity, verify educators, and manage the educational ecosystem efficiently.'],
  ['Kelola data akun pendaftar, hak akses fitur pendidik, dan masa aktif langganan akun.', 'Manage registrant accounts, educator feature access permissions, and subscription validity.'],
  ['Pengaturan modul pembelajaran, generator RPP AI, dan integrasi fitur sistem.', 'Teaching module settings, AI lesson plan generator, and system feature integrations.'],
  ['Kirim pengumuman massal, info pembaruan sistem, dan siaran pesan ke pengguna.', 'Send mass announcements, system update info, and user broadcasts.'],
  ['Kelola hak akses modul pembelajaran, generator RPP AI, dan integrasi fitur sistem untuk setiap pengguna.', 'Manage module access permissions, AI lesson plan generator, and feature integration for each user.'],
  ['Kelola Akses Fitur', 'Manage Feature Access'],
  ['Atur modul fitur aktif untuk akun pengguna ini.', 'Configure active feature modules for this user account.'],
  ['Simpan Perubahan', 'Save Changes'],
  ['Catatan Admin', 'Admin Notes'],

  // User Dashboard Descriptions
  ['Selamat Datang di Edu Workspace', 'Welcome to Edu Workspace'],
  ['Pusat Pengelolaan Modul Ajar & Media Pembelajaran Berbasis AI', 'AI-Powered Teaching Module & Learning Media Hub'],
  ['Rancang modul ajar dan asesmen cerdas secara instan. Kelola kebutuhan pembelajaran lebih cepat, hemat waktu administrasi.', 'Design curriculum lesson plans and smart assessments instantly. Manage your classroom needs faster, save administrative hours.'],
  ['Buat naskah modul ajar Kurikulum Merdeka lengkap secara otomatis dengan panduan AI pakar kurikulum.', 'Automatically compile complete curriculum lesson plans guided by expert pedagogical AI.'],
  ['Rancang outline slide presentasi Canva & PowerPoint interaktif siap ajar dalam hitungan detik.', 'Design interactive Canva & PowerPoint slide outlines ready to teach in seconds.'],
  ['Lihat, edit, cetak, atau unduh kembali modul ajar yang telah berhasil dibuat sebelumnya.', 'View, edit, print, or download your previously generated lesson plan documents.'],
  ['Kelola dan simpan Google Gemini API Key Anda untuk akses generate dokumen tanpa batas.', 'Manage and save your Google Gemini API Key for unlimited document generation.'],
  ['Perbarui informasi pendidik, mata pelajaran, instansi sekolah, dan masa aktif langganan Anda.', 'Update your educator profile, subject specialties, institution, and subscription validity.'],
  ['Kelola, pratinjau, dan edit seluruh rancangan Modul Ajar Kurikulum Merdeka yang tersimpan pada akun Anda.', 'Manage, preview, and edit all curriculum lesson plans saved under your account.'],
  ['Belum ada modul ajar yang tersimpan.', 'No teaching modules saved yet.'],
  ['Mulai Buat Modul Pertama', 'Create Your First Module'],

  // Login
  ['Masuk menggunakan Akun Google personal (@gmail.com) untuk login', 'Sign in using your personal Google Account (@gmail.com) to access'],
  ['Login Berhasil!', 'Login Successful!'],
  ['Selamat datang kembali, mengalihkan ke dashboard...', 'Welcome back, redirecting to dashboard...'],

  // Table Headers
  ['PENGGUNA / EMAIL', 'USER / EMAIL'],
  ['INSTANSI & MAPEL', 'INSTITUTION & SUBJECT'],
  ['PERAN', 'ROLE'],
  ['MASA AKTIF', 'VALID UNTIL'],
  ['PENGGUNA', 'USER'],
  ['FITUR', 'FEATURES'],
  ['CATATAN', 'NOTES'],
  ['JUDUL MODUL & TOPIK', 'MODULE TITLE & TOPIC'],
  ['MATA PELAJARAN', 'SUBJECT'],
  ['JENJANG / KELAS', 'LEVEL / GRADE'],
  ['TANGGAL DIBUAT', 'CREATED DATE'],
  ['AKSI', 'ACTION']
];

/**
 * Placeholder Replacements
 */
const PLACEHOLDER_PAIRS = [
  ['Cari nama modul, topik, mata pelajaran...', 'Search module title, topic, subject...'],
  ['Cari nama, email, sekolah...', 'Search name, email, school...'],
  ['Cari nama pengguna, email, atau peran...', 'Search user name, email, or role...'],
  ['Contoh: Budi Santoso, S.Pd.', 'Example: Budi Santoso, S.Pd.'],
  ['Nama Institusi / Sekolah', 'School / Institution Name'],
  ['Contoh: Fotosintesis pada Tumbuhan Hijau', 'Example: Photosynthesis in Green Plants'],
  ['Contoh: Rico Eko Andrianto, S.Pd', 'Example: Rico Eko Andrianto, S.Pd'],
  ['Contoh: SMAN 1 Jakarta / SMP Negeri 5 Bandung', 'Example: SMAN 1 Jakarta / SMP Negeri 5 Bandung'],
  ['Tempelkan API Key Google Gemini di sini (AIzaSy... atau AQ...)', 'Paste your Google Gemini API Key here (AIzaSy... or AQ...)'],
  ['Contoh: 2026', 'Example: 2026'],
  ['nama@sekolah.sch.id atau gmail.com', 'name@school.edu or gmail.com'],
  ['Masukkan kata sandi akun Anda', 'Enter your account password']
];

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

  // Update button active states
  updateLanguageSwitcherUI(lang);

  // Broadcast event kustom ke seluruh halaman
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
 * Terapkan terjemahan ke elemen-elemen DOM yang memiliki atribut data-i18n atau melalui pencocokan frasa
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

  // 6. Update Title & Meta Description jika landing page
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

  // 1. Text Replacements berdasarkan PHRASE_PAIRS
  const targetSelectors = 'h1, h2, h3, h4, h5, p, span, a, button, label, th, td, option';
  const elements = root.querySelectorAll(targetSelectors);

  elements.forEach(el => {
    // Jangan overwrite jika elemen sudah diproses data-i18n
    if (el.hasAttribute('data-i18n') || el.hasAttribute('data-i18n-html')) return;
    // Jangan ubah container dengan banyak child tags complex kecuali span murni
    if (el.children.length > 0 && !el.classList.contains('step-name') && !el.classList.contains('btn-create-modul')) return;

    const rawText = el.textContent.trim();
    if (!rawText) return;

    for (const [idText, enText] of PHRASE_PAIRS) {
      if (isEn && rawText === idText) {
        el.textContent = enText;
        break;
      } else if (!isEn && rawText === enText) {
        el.textContent = idText;
        break;
      }
    }
  });

  // 2. Placeholder Replacements
  root.querySelectorAll('input, textarea').forEach(input => {
    if (input.hasAttribute('data-i18n-placeholder')) return;
    const currentPh = input.placeholder ? input.placeholder.trim() : '';
    if (!currentPh) return;

    for (const [idPh, enPh] of PLACEHOLDER_PAIRS) {
      if (isEn && currentPh === idPh) {
        input.placeholder = enPh;
        break;
      } else if (!isEn && currentPh === enPh) {
        input.placeholder = idPh;
        break;
      }
    }
  });

  // 3. Khusus Preview Modul Ajar
  const docHeading = root.querySelector('.doc-main-heading');
  if (docHeading) {
    docHeading.textContent = isEn ? 'LESSON PLAN & TEACHING MODULE' : 'MODUL AJAR KURIKULUM MERDEKA';
  }

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

  // 4. Logout modal text
  const logoutTitle = root.querySelector('#logoutModalTitle, .logout-modal-title');
  if (logoutTitle) logoutTitle.textContent = isEn ? 'Confirm Logout' : 'Konfirmasi Keluar';
  const logoutDesc = root.querySelector('#logoutModalDesc, .logout-modal-desc');
  if (logoutDesc) logoutDesc.textContent = isEn ? 'Are you sure you want to sign out of your current Edu Workspace session?' : 'Apakah Anda yakin ingin keluar dari sesi akun Edu Workspace saat ini?';
  const logoutCancel = root.querySelector('#btnCancelLogout, .btn-cancel-logout');
  if (logoutCancel) logoutCancel.textContent = isEn ? 'Cancel' : 'Batal';
  const logoutConfirm = root.querySelector('#btnConfirmLogout, .btn-confirm-logout');
  if (logoutConfirm) logoutConfirm.textContent = isEn ? 'Yes, Sign Out' : 'Ya, Keluar';
}

// Inisialisasi otomatis saat script dimuat
if (typeof window !== 'undefined') {
  window.EduI18n = {
    TRANSLATIONS,
    PHRASE_PAIRS,
    PLACEHOLDER_PAIRS,
    getAppLanguage,
    setAppLanguage,
    t,
    applyTranslations,
    autoTranslateCommonPhrases
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
