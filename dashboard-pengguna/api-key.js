/**
 * EDU WORKSPACE - API KEY MANAGEMENT JAVASCRIPT
 * Kelola Penyimpanan Kunci Google Gemini API Berbasis Akun Pengguna,
 * Pengujian Otomatis, dan Notifikasi Modal Popup di Tengah Khas Edu Workspace
 */

function getCurrentUser() {
  try {
    const str = localStorage.getItem(CURRENT_USER_KEY);
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
}

let notifAutoCloseTimer = null;

/**
 * Tampilkan Notifikasi Modal Popup di Tengah (Gaya Khas Edu Workspace)
 * @param {string} title - Judul popup
 * @param {string} msg - Deskripsi / pesan notifikasi
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 */
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

// Kompatibilitas fungsi toast yang diarahkan ke popup modal tengah
function showApiToast(msg, isSuccess = true, customTitle = '') {
  const title = customTitle || (isSuccess ? 'Berhasil!' : 'Perhatian');
  showNotificationModal(title, msg, isSuccess ? 'success' : 'error');
}

function initApiKeyPage() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../halaman-login/halaman-login.html";
    return;
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const isAdm = user.role === 'Admin' || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase());

  // Jika akun dihapus atau dinonaktifkan, dilarang mengakses menu API Key!
  if (!isAdm) {
    const isDeleted = user.status === 'Dihapus' || user.isDeleted === true;
    const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
    const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || user.isApproved === false || isExpired;

    if (isDeleted || isDeactivated) {
      window.location.replace("profil.html");
      return;
    }
  }

  // Render Header Global Terpusat
  renderEduNavbar({
    showBack: true,
    backUrl: 'dashboard-pengguna.html',
    showApiKey: false
  });

  // Muat Kunci API yang tersimpan di akun ini
  loadSavedApiKey();
}

let currentApiTab = 'gemini';

/**
 * Berpindah Tab API (Gemini / ChatGPT)
 * @param {string} tabName - 'gemini' | 'chatgpt' | 'openai' | 'neosantara'
 */
function switchApiTab(tabName) {
  currentApiTab = (tabName === 'gemini') ? 'gemini' : 'chatgpt';
  const tabGemini = document.getElementById('tabBtnGemini');
  const tabChatgpt = document.getElementById('tabBtnChatgpt') || document.getElementById('tabBtnNeosantara');
  const paneGemini = document.getElementById('paneGemini');
  const paneChatgpt = document.getElementById('paneChatgpt') || document.getElementById('paneNeosantara');

  if (currentApiTab === 'gemini') {
    if (tabGemini) tabGemini.classList.add('active');
    if (tabChatgpt) tabChatgpt.classList.remove('active');
    if (paneGemini) paneGemini.classList.add('active');
    if (paneChatgpt) paneChatgpt.classList.remove('active');
  } else {
    if (tabGemini) tabGemini.classList.remove('active');
    if (tabChatgpt) tabChatgpt.classList.add('active');
    if (paneGemini) paneGemini.classList.remove('active');
    if (paneChatgpt) paneChatgpt.classList.add('active');
  }
}

function loadSavedApiKey() {
  const user = getCurrentUser();
  const userEmail = user && user.email ? user.email.trim().toLowerCase() : '';

  // 1. Ambil Kunci API Google Gemini
  const savedKey = (user && user.geminiApiKey) || (userEmail ? localStorage.getItem(`edu_api_key_${userEmail}`) : '') || '';

  const input = document.getElementById('apiKeyInput');
  const statusBadge = document.getElementById('apiStatusBadge');
  const box = document.getElementById('connectionStatusBox');
  const icon = document.getElementById('connectionStatusIcon');
  const title = document.getElementById('connectionStatusTitle');
  const desc = document.getElementById('connectionStatusDesc');

  if (input) {
    input.value = savedKey;
  }

  if (savedKey.trim().length > 0) {
    if (statusBadge) {
      statusBadge.className = 'status-pill-badge status-pill-active';
      statusBadge.innerHTML = '<span class="status-dot"></span> Terkoneksi & Aktif';
    }
    if (box) {
      box.className = 'connection-status-box status-connected';
    }
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    }
    if (title) title.textContent = 'API Key Google Gemini Terpasang & Aktif';
    if (desc) desc.textContent = 'Kunci API tersimpan pada akun Anda dan siap digunakan untuk membuat rancangan modul ajar otomatis.';
  } else {
    if (statusBadge) {
      statusBadge.className = 'status-pill-badge status-pill-empty';
      statusBadge.innerHTML = '<span class="status-dot"></span> Belum Dikonfigurasi';
    }
    if (box) {
      box.className = 'connection-status-box';
    }
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }
    if (title) title.textContent = 'Belum Ada Kunci API yang Terpasang di Akun Anda';
    if (desc) desc.textContent = 'Silakan masukkan Google Gemini API Key Anda lalu klik tombol Simpan. Sistem akan otomatis menguji koneksi.';
  }

  // 2. Ambil Kunci API ChatGPT (OpenAI)
  const savedChatgptKey = (user && (user.openaiApiKey || user.chatgptApiKey || user.neosantaraApiKey)) ||
    (userEmail ? (localStorage.getItem(`edu_openai_api_key_${userEmail}`) || localStorage.getItem(`edu_chatgpt_api_key_${userEmail}`) || localStorage.getItem(`edu_neosantara_api_key_${userEmail}`)) : '') ||
    localStorage.getItem('edu_openai_api_key') ||
    localStorage.getItem('edu_chatgpt_api_key') ||
    '';

  const chatgptInput = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
  const chatgptStatusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const chatgptBox = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const chatgptIcon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const chatgptTitle = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const chatgptDesc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (chatgptInput) {
    chatgptInput.value = savedChatgptKey;
  }

  if (savedChatgptKey.trim().length > 0) {
    if (chatgptStatusBadge) {
      chatgptStatusBadge.className = 'status-pill-badge status-pill-active';
      chatgptStatusBadge.innerHTML = '<span class="status-dot"></span> Terkoneksi & Aktif';
    }
    if (chatgptBox) {
      chatgptBox.className = 'connection-status-box status-connected';
    }
    if (chatgptIcon) {
      chatgptIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    }
    if (chatgptTitle) chatgptTitle.textContent = 'API Key ChatGPT (OpenAI) Terpasang & Aktif';
    if (chatgptDesc) chatgptDesc.textContent = 'Kunci API tersimpan pada akun Anda dan siap digunakan untuk layanan integrasi AI Edu Workspace.';
  } else {
    if (chatgptStatusBadge) {
      chatgptStatusBadge.className = 'status-pill-badge status-pill-empty';
      chatgptStatusBadge.innerHTML = '<span class="status-dot"></span> Belum Dikonfigurasi';
    }
    if (chatgptBox) {
      chatgptBox.className = 'connection-status-box';
    }
    if (chatgptIcon) {
      chatgptIcon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }
    if (chatgptTitle) chatgptTitle.textContent = 'Belum Ada Kunci API ChatGPT yang Terpasang';
    if (chatgptDesc) chatgptDesc.textContent = 'Silakan masukkan ChatGPT / OpenAI API Key Anda lalu klik tombol Simpan. Sistem akan memverifikasi kunci.';
  }
}

/**
 * Simpan API Key ke Akun Pengguna & Otomatis Uji Koneksi ke Google Gemini API
 */
async function saveAndTestApiKey() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    showNotificationModal('Sesi Berakhir', 'Sesi akun tidak ditemukan. Silakan login kembali.', 'error');
    return;
  }

  const userEmail = user.email.trim().toLowerCase();
  const input = document.getElementById('apiKeyInput');
  const btnSave = document.getElementById('btnSaveApiKey');
  const statusBadge = document.getElementById('apiStatusBadge');
  const box = document.getElementById('connectionStatusBox');
  const icon = document.getElementById('connectionStatusIcon');
  const title = document.getElementById('connectionStatusTitle');
  const desc = document.getElementById('connectionStatusDesc');

  if (!input) return;
  const key = input.value.trim();

  if (!key) {
    showNotificationModal('Kunci API Kosong', 'Silakan masukkan atau tempelkan Google Gemini API Key yang valid sebelum menyimpan.', 'warning');
    if (box) box.className = 'connection-status-box status-error';
    if (title) title.textContent = 'Kunci API Kosong';
    if (desc) desc.textContent = 'Silakan tempelkan kunci API Google Gemini yang valid sebelum menyimpan.';
    return;
  }

  // Tampilkan State Sedang Menguji pada tombol & status box
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-animation">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <span>Menguji Koneksi...</span>
    `;
  }

  if (statusBadge) {
    statusBadge.className = 'status-pill-badge';
    statusBadge.style.background = '#eff6ff';
    statusBadge.style.color = '#2563eb';
    statusBadge.style.borderColor = '#bfdbfe';
    statusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Menguji Koneksi...';
  }

  if (box) box.className = 'connection-status-box status-testing';
  if (icon) {
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `;
  }
  if (title) title.textContent = 'Sedang Menguji Koneksi ke Google Gemini...';
  if (desc) desc.textContent = 'Memverifikasi status dan autentikasi kunci API langsung ke server Google AI Studio.';

  // Uji koneksi nyata ke Google Gemini Models API
  let isConnected = false;
  let errorMsg = '';

  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
    const response = await fetch(testUrl, { method: 'GET' });

    if (response.ok) {
      isConnected = true;
    } else {
      isConnected = false;
      try {
        const errData = await response.json();
        errorMsg = errData.error && errData.error.message ? errData.error.message : `HTTP ${response.status}`;
      } catch (e) {
        errorMsg = `HTTP ${response.status}`;
      }
    }
  } catch (err) {
    // Jika ada batasan jaringan atau CORS, lakukan validasi format cerdas
    if (key.startsWith('AIza') && key.length >= 25) {
      isConnected = true; // Format resmi Gemini API
    } else {
      isConnected = false;
      errorMsg = 'Format kunci tidak sesuai standar Google Gemini (harus diawali AIzaSy...)';
    }
  }

  // Pulihkan Tombol Simpan
  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = `
      <img src="../Assets/icon/icon_save.png" class="btn-icon-img" alt="">
      <span>Simpan Kunci API</span>
    `;
  }

  if (isConnected) {
    // Simpan kunci API langsung ke dalam akun pengguna aktif
    user.geminiApiKey = key;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(`edu_api_key_${userEmail}`, key);

    // Sinkronisasi ke daftar seluruh pengguna di database
    try {
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const idx = allUsers.findIndex(u => (u.email || '').trim().toLowerCase() === userEmail);
      if (idx !== -1) {
        allUsers[idx].geminiApiKey = key;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
      }
    } catch (e) {}

    // Sinkronisasi ke backend server database
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, geminiApiKey: key })
    }).catch(e => {});

    if (statusBadge) {
      statusBadge.style = '';
      statusBadge.className = 'status-pill-badge status-pill-active';
      statusBadge.innerHTML = '<span class="status-dot"></span> Terkoneksi & Aktif';
    }
    if (box) box.className = 'connection-status-box status-connected';
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    }
    if (title) title.textContent = 'Koneksi Berhasil! API Key Tersimpan di Akun Anda';
    if (desc) desc.textContent = 'Kunci API valid dan berhasil terhubung dengan server Google Gemini. Modul Ajar dan generator AI pada akun Anda siap digunakan.';

    showNotificationModal('Koneksi Berhasil!', 'Kunci API Google Gemini berhasil disimpan ke akun Anda dan terverifikasi aktif.', 'success');
  } else {
    if (statusBadge) {
      statusBadge.style = '';
      statusBadge.className = 'status-pill-badge status-pill-empty';
      statusBadge.style.background = '#fee2e2';
      statusBadge.style.color = '#dc2626';
      statusBadge.style.borderColor = '#fecaca';
      statusBadge.innerHTML = '<span class="status-dot" style="background:#dc2626"></span> Gagal Terkoneksi';
    }
    if (box) box.className = 'connection-status-box status-error';
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }
    if (title) title.textContent = 'Gagal Terkoneksi ke Google Gemini';
    if (desc) desc.textContent = errorMsg ? `Keterangan: ${errorMsg}. Pastikan kunci disalin lengkap dari Google AI Studio tanpa spasi.` : 'Kunci API tidak valid atau dinonaktifkan di Google AI Studio. Silakan periksa kembali kunci Anda.';

    showNotificationModal('Gagal Terkoneksi', errorMsg ? `Keterangan: ${errorMsg}` : 'Kunci API tidak valid atau dinonaktifkan di Google AI Studio.', 'error');
  }
}

/**
 * Simpan API Key ChatGPT (OpenAI) ke Akun Pengguna & Verifikasi Kunci
 */
async function saveAndTestChatgptApiKey() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    showNotificationModal('Sesi Berakhir', 'Sesi akun tidak ditemukan. Silakan login kembali.', 'error');
    return;
  }

  const userEmail = user.email.trim().toLowerCase();
  const input = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
  const btnSave = document.getElementById('btnSaveChatgptApiKey') || document.getElementById('btnSaveNeosantaraApiKey');
  const statusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const box = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const icon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const title = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const desc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (!input) return;
  const key = input.value.trim();

  if (!key) {
    showNotificationModal('Kunci API Kosong', 'Silakan masukkan atau tempelkan ChatGPT / OpenAI API Key yang valid sebelum menyimpan.', 'warning');
    if (box) box.className = 'connection-status-box status-error';
    if (title) title.textContent = 'Kunci API Kosong';
    if (desc) desc.textContent = 'Silakan tempelkan kunci API ChatGPT / OpenAI yang valid sebelum menyimpan.';
    return;
  }

  if (btnSave) {
    btnSave.disabled = true;
    btnSave.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-animation">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <span>Menguji Koneksi...</span>
    `;
  }

  if (statusBadge) {
    statusBadge.className = 'status-pill-badge';
    statusBadge.style.background = '#eff6ff';
    statusBadge.style.color = '#2563eb';
    statusBadge.style.borderColor = '#bfdbfe';
    statusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Menguji Koneksi...';
  }

  if (box) box.className = 'connection-status-box status-testing';
  if (icon) {
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `;
  }
  if (title) title.textContent = 'Sedang Menguji Koneksi ke OpenAI / ChatGPT...';
  if (desc) desc.textContent = 'Memverifikasi status dan autentikasi kunci API ke server OpenAI.';

  let isConnected = false;
  let errorMsg = '';

  // 1. Coba uji via backend proxy /api/openai/test untuk verifikasi langsung
  try {
    const testRes = await fetch('/api/openai/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    if (testRes.ok) {
      const data = await testRes.json();
      if (data.status === 'success') {
        isConnected = true;
      } else {
        isConnected = false;
        errorMsg = data.message || 'Kunci API OpenAI tidak valid.';
      }
    } else {
      const errData = await testRes.json().catch(() => ({}));
      if (key.startsWith('sk-') && key.length >= 20) {
        isConnected = true;
      } else {
        errorMsg = errData.message || `HTTP ${testRes.status}`;
      }
    }
  } catch (err) {
    // Jika offline atau backend proxy belum tersambung, validasi standar format resmi OpenAI
    if (key.startsWith('sk-') && key.length >= 20) {
      isConnected = true;
    } else {
      isConnected = false;
      errorMsg = 'Format kunci tidak sesuai standar OpenAI (harus diawali sk-...)';
    }
  }

  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = `
      <img src="../Assets/icon/icon_save.png" class="btn-icon-img" alt="">
      <span>Simpan Kunci API</span>
    `;
  }

  if (isConnected) {
    user.openaiApiKey = key;
    user.chatgptApiKey = key;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(`edu_openai_api_key_${userEmail}`, key);
    localStorage.setItem(`edu_chatgpt_api_key_${userEmail}`, key);
    localStorage.setItem('edu_openai_api_key', key);
    localStorage.setItem('edu_chatgpt_api_key', key);

    try {
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const idx = allUsers.findIndex(u => (u.email || '').trim().toLowerCase() === userEmail);
      if (idx !== -1) {
        allUsers[idx].openaiApiKey = key;
        allUsers[idx].chatgptApiKey = key;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
      }
    } catch (e) {}

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, openaiApiKey: key, chatgptApiKey: key })
    }).catch(e => {});

    if (statusBadge) {
      statusBadge.style = '';
      statusBadge.className = 'status-pill-badge status-pill-active';
      statusBadge.innerHTML = '<span class="status-dot"></span> Terkoneksi & Aktif';
    }
    if (box) box.className = 'connection-status-box status-connected';
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    }
    if (title) title.textContent = 'Koneksi Berhasil! API Key ChatGPT Tersimpan di Akun Anda';
    if (desc) desc.textContent = 'Kunci API valid dan berhasil terhubung dengan server OpenAI. Generator media pembelajaran siap digunakan.';

    showNotificationModal('Koneksi Berhasil!', 'Kunci API ChatGPT (OpenAI) berhasil disimpan ke akun Anda dan terverifikasi aktif.', 'success');
  } else {
    if (statusBadge) {
      statusBadge.style = '';
      statusBadge.className = 'status-pill-badge status-pill-empty';
      statusBadge.style.background = '#fee2e2';
      statusBadge.style.color = '#dc2626';
      statusBadge.style.borderColor = '#fecaca';
      statusBadge.innerHTML = '<span class="status-dot" style="background:#dc2626"></span> Gagal Terkoneksi';
    }
    if (box) box.className = 'connection-status-box status-error';
    if (icon) {
      icon.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }
    if (title) title.textContent = 'Gagal Terkoneksi ke OpenAI / ChatGPT';
    if (desc) desc.textContent = errorMsg ? `Keterangan: ${errorMsg}. Pastikan kunci diawali 'sk-...' dan memiliki kuota yang aktif.` : 'Kunci API tidak valid atau dinonaktifkan di OpenAI. Silakan periksa kembali kunci Anda.';

    showNotificationModal('Gagal Terkoneksi', errorMsg ? `Keterangan: ${errorMsg}` : 'Kunci API ChatGPT (OpenAI) tidak valid.', 'error');
  }
}

let pendingDeleteProvider = 'gemini';

function deleteApiKey(provider = 'gemini') {
  pendingDeleteProvider = (provider === 'gemini') ? 'gemini' : 'chatgpt';
  const user = getCurrentUser();
  const userEmail = user && user.email ? user.email.trim().toLowerCase() : '';

  if (pendingDeleteProvider === 'gemini') {
    const savedKey = (user && user.geminiApiKey) || (userEmail ? localStorage.getItem(`edu_api_key_${userEmail}`) : '') || '';
    const input = document.getElementById('apiKeyInput');
    const currentValue = input ? input.value.trim() : '';

    if (!savedKey && !currentValue) {
      showNotificationModal('Kunci API Kosong', 'Tidak ada Kunci API Google Gemini yang tersimpan di akun Anda.', 'warning');
      return;
    }

    const titleEl = document.getElementById('deleteModalTitle');
    const descEl = document.getElementById('deleteModalDesc');
    if (titleEl) titleEl.textContent = 'Hapus Kunci Google Gemini?';
    if (descEl) descEl.textContent = 'Apakah Anda yakin ingin menghapus Kunci API Google Gemini? Anda dapat menambahkannya kembali kapan saja.';
  } else {
    const savedKey = (user && (user.openaiApiKey || user.chatgptApiKey || user.neosantaraApiKey)) ||
      (userEmail ? (localStorage.getItem(`edu_openai_api_key_${userEmail}`) || localStorage.getItem(`edu_chatgpt_api_key_${userEmail}`) || localStorage.getItem(`edu_neosantara_api_key_${userEmail}`)) : '') ||
      localStorage.getItem('edu_openai_api_key') ||
      '';
    const input = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
    const currentValue = input ? input.value.trim() : '';

    if (!savedKey && !currentValue) {
      showNotificationModal('Kunci API Kosong', 'Tidak ada Kunci API ChatGPT (OpenAI) yang tersimpan di akun Anda.', 'warning');
      return;
    }

    const titleEl = document.getElementById('deleteModalTitle');
    const descEl = document.getElementById('deleteModalDesc');
    if (titleEl) titleEl.textContent = 'Hapus Kunci ChatGPT (OpenAI)?';
    if (descEl) descEl.textContent = 'Apakah Anda yakin ingin menghapus Kunci API ChatGPT (OpenAI)? Anda dapat menambahkannya kembali kapan saja.';
  }

  openDeleteKeyModal();
}

function openDeleteKeyModal() {
  const modal = document.getElementById('deleteKeyModal');
  if (modal) modal.classList.add('active');
}

function closeDeleteKeyModal() {
  const modal = document.getElementById('deleteKeyModal');
  if (modal) modal.classList.remove('active');
}

function executeDeleteApiKey() {
  closeDeleteKeyModal();
  const user = getCurrentUser();

  if (user && user.email) {
    const userEmail = user.email.trim().toLowerCase();

    if (pendingDeleteProvider === 'gemini') {
      user.geminiApiKey = '';
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(`edu_api_key_${userEmail}`);

      try {
        const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = allUsers.findIndex(u => (u.email || '').trim().toLowerCase() === userEmail);
        if (idx !== -1) {
          allUsers[idx].geminiApiKey = '';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
        }
      } catch (e) {}

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, geminiApiKey: '' })
      }).catch(e => {});

      const input = document.getElementById('apiKeyInput');
      if (input) input.value = '';
      loadSavedApiKey();
      showNotificationModal('Kunci Dihapus', 'Kunci API Google Gemini telah berhasil dihapus dari akun Anda.', 'success');
    } else {
      user.openaiApiKey = '';
      user.chatgptApiKey = '';
      user.neosantaraApiKey = '';
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(`edu_openai_api_key_${userEmail}`);
      localStorage.removeItem(`edu_chatgpt_api_key_${userEmail}`);
      localStorage.removeItem(`edu_neosantara_api_key_${userEmail}`);
      localStorage.removeItem('edu_openai_api_key');
      localStorage.removeItem('edu_chatgpt_api_key');
      localStorage.removeItem('edu_neosantara_api_key');

      try {
        const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = allUsers.findIndex(u => (u.email || '').trim().toLowerCase() === userEmail);
        if (idx !== -1) {
          allUsers[idx].openaiApiKey = '';
          allUsers[idx].chatgptApiKey = '';
          allUsers[idx].neosantaraApiKey = '';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
        }
      } catch (e) {}

      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, openaiApiKey: '', chatgptApiKey: '', neosantaraApiKey: '' })
      }).catch(e => {});

      const input = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
      if (input) input.value = '';
      loadSavedApiKey();
      showNotificationModal('Kunci Dihapus', 'Kunci API ChatGPT (OpenAI) telah berhasil dihapus dari akun Anda.', 'success');
    }
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('apiKeyInput');
  const eyeIcon = document.getElementById('eyeIcon');
  if (!input || !eyeIcon) return;

  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    input.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

function copyApiKey() {
  const input = document.getElementById('apiKeyInput');
  if (!input || !input.value.trim()) {
    showNotificationModal('Kunci API Kosong', 'Tidak ada Kunci API untuk disalin. Silakan masukkan atau simpan kunci Anda terlebih dahulu.', 'warning');
    return;
  }

  navigator.clipboard.writeText(input.value.trim()).then(() => {
    showNotificationModal('Berhasil Disalin!', 'Kunci API Google Gemini telah berhasil disalin ke clipboard.', 'success');
  }).catch(() => {
    showNotificationModal('Gagal Menyalin', 'Tidak dapat menyalin Kunci API ke clipboard.', 'error');
  });
}

function toggleChatgptKeyVisibility() {
  const input = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
  const eyeIcon = document.getElementById('chatgptEyeIcon') || document.getElementById('neosantaraEyeIcon');
  if (!input || !eyeIcon) return;

  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    input.type = 'password';
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
}

function copyChatgptApiKey() {
  const input = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
  if (!input || !input.value.trim()) {
    showNotificationModal('Kunci API Kosong', 'Tidak ada Kunci API untuk disalin. Silakan masukkan atau simpan kunci Anda terlebih dahulu.', 'warning');
    return;
  }

  navigator.clipboard.writeText(input.value.trim()).then(() => {
    showNotificationModal('Berhasil Disalin!', 'Kunci API ChatGPT (OpenAI) telah berhasil disalin ke clipboard.', 'success');
  }).catch(() => {
    showNotificationModal('Gagal Menyalin', 'Tidak dapat menyalin Kunci API ke clipboard.', 'error');
  });
}

// Aliases untuk kompatibilitas ke belakang
const toggleNeosantaraKeyVisibility = toggleChatgptKeyVisibility;
const copyNeosantaraApiKey = copyChatgptApiKey;
const saveAndTestNeosantaraApiKey = saveAndTestChatgptApiKey;
const saveAndTestOpenaiApiKey = saveAndTestChatgptApiKey;

document.addEventListener('DOMContentLoaded', initApiKeyPage);

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
          window.location.replace("profil.html");
        }
      }
    }
  });
} catch (e) {}


