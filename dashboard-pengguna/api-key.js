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

function setGeminiBadgeEmpty() {
  const statusBadge = document.getElementById('apiStatusBadge');
  const box = document.getElementById('connectionStatusBox');
  const icon = document.getElementById('connectionStatusIcon');
  const title = document.getElementById('connectionStatusTitle');
  const desc = document.getElementById('connectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
    statusBadge.className = 'status-pill-badge status-pill-empty';
    statusBadge.innerHTML = '<span class="status-dot"></span> Belum Dikonfigurasi';
  }
  if (box) box.className = 'connection-status-box';
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

function setGeminiBadgeSuccess() {
  const statusBadge = document.getElementById('apiStatusBadge');
  const box = document.getElementById('connectionStatusBox');
  const icon = document.getElementById('connectionStatusIcon');
  const title = document.getElementById('connectionStatusTitle');
  const desc = document.getElementById('connectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
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
  if (title) title.textContent = 'API Key Google Gemini Terpasang & Aktif';
  if (desc) desc.textContent = 'Kunci API valid dan tersimpan pada akun Anda, siap digunakan untuk membuat rancangan modul ajar otomatis.';
}

function setGeminiBadgeError(errorMsg) {
  const statusBadge = document.getElementById('apiStatusBadge');
  const box = document.getElementById('connectionStatusBox');
  const icon = document.getElementById('connectionStatusIcon');
  const title = document.getElementById('connectionStatusTitle');
  const desc = document.getElementById('connectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
    statusBadge.className = 'status-pill-badge status-pill-error';
    statusBadge.innerHTML = '<span class="status-dot"></span> Gagal Terkoneksi';
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
  if (title) title.textContent = 'Kunci API Gemini Tidak Sesuai / Gagal Terkoneksi';
  if (desc) desc.textContent = errorMsg ? `Keterangan: ${errorMsg}. Pastikan kunci API Gemini valid. Tanda koneksi tidak akan hijau.` : 'Kunci API Google Gemini salah atau tidak sesuai. Tanda koneksi tidak akan hijau.';
}

async function verifyGeminiKeySilently(key) {
  const isAQ = key.startsWith('AQ.');
  const isAIza = key.startsWith('AIza');
  if (!isAQ && !isAIza) {
    setGeminiBadgeError("Format kunci tidak sesuai standar Google Gemini (harus diawali 'AQ.' atau 'AIza')");
    return;
  }
  try {
    // 1. Coba verifikasi dengan header x-goog-api-key (standar resmi untuk kunci AQ dan AIza)
    let response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': key
      }
    });

    // 2. Fallback via query parameter jika header ditolak
    if (!response.ok) {
      const qRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        method: 'GET'
      });
      if (qRes.ok) response = qRes;
    }

    if (response.ok) {
      setGeminiBadgeSuccess();
    } else {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) errText = errJson.error.message;
      } catch (e) {}
      setGeminiBadgeError(errText);
    }
  } catch (e) {
    // Jangan ubah status menjadi sukses jika jaringan gagal
    setGeminiBadgeError('Tidak dapat memverifikasi koneksi ke Google Gemini');
  }
}

function setChatgptBadgeEmpty() {
  const statusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const box = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const icon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const title = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const desc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
    statusBadge.className = 'status-pill-badge status-pill-empty';
    statusBadge.innerHTML = '<span class="status-dot"></span> Belum Dikonfigurasi';
  }
  if (box) box.className = 'connection-status-box';
  if (icon) {
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
  }
  if (title) title.textContent = 'Belum Ada Kunci API ChatGPT yang Terpasang';
  if (desc) desc.textContent = 'Silakan masukkan ChatGPT / OpenAI API Key Anda lalu klik tombol Simpan. Sistem akan memverifikasi kunci.';
}

function setChatgptBadgeSuccess() {
  const statusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const box = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const icon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const title = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const desc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
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
  if (title) title.textContent = 'API Key ChatGPT (OpenAI) Terpasang & Aktif';
  if (desc) desc.textContent = 'Kunci API valid dan tersimpan pada akun Anda, siap digunakan untuk layanan integrasi AI Edu Workspace.';
}

function setChatgptBadgeError(errorMsg) {
  const statusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const box = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const icon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const title = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const desc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (statusBadge) {
    statusBadge.removeAttribute('style');
    statusBadge.className = 'status-pill-badge status-pill-error';
    statusBadge.innerHTML = '<span class="status-dot"></span> Gagal Terkoneksi';
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
  if (title) title.textContent = 'Kunci API Tidak Sesuai / Gagal Terkoneksi';
  if (desc) desc.textContent = errorMsg ? `Keterangan: ${errorMsg}. Tanda koneksi tidak akan hijau sampai kunci yang valid dimasukkan.` : 'Kunci API ChatGPT (OpenAI) tidak valid atau ditolak oleh server OpenAI.';
}

async function verifyChatgptKeySilently(key) {
  if (!key.startsWith('sk-')) {
    setChatgptBadgeError("Format kunci tidak sesuai standar OpenAI (harus diawali 'sk-...')");
    return;
  }
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    if (response.ok) {
      setChatgptBadgeSuccess();
    } else {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error && errJson.error.message) errText = errJson.error.message;
      } catch (e) {}
      setChatgptBadgeError(errText);
    }
  } catch (e) {
    // Coba via proxy jika ada
    try {
      const proxyRes = await fetch('/api/openai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        if (pData.status === 'success') {
          setChatgptBadgeSuccess();
          return;
        }
      }
    } catch (pe) {}
    setChatgptBadgeError('Tidak dapat memverifikasi koneksi ke server OpenAI');
  }
}

function loadSavedApiKey() {
  const user = getCurrentUser();
  const userEmail = user && user.email ? user.email.trim().toLowerCase() : '';

  // 1. Ambil Kunci API Google Gemini
  const savedKey = (user && user.geminiApiKey) || (userEmail ? localStorage.getItem(`edu_api_key_${userEmail}`) : '') || '';
  const input = document.getElementById('apiKeyInput');
  if (input) input.value = savedKey;

  if (savedKey.trim().length > 0) {
    const statusBadge = document.getElementById('apiStatusBadge');
    if (statusBadge) {
      statusBadge.className = 'status-pill-badge';
      statusBadge.style.background = '#eff6ff';
      statusBadge.style.color = '#2563eb';
      statusBadge.style.borderColor = '#bfdbfe';
      statusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Memverifikasi...';
    }
    verifyGeminiKeySilently(savedKey.trim());
  } else {
    setGeminiBadgeEmpty();
  }

  // 2. Ambil Kunci API ChatGPT (OpenAI) - KHUSUS KUNCI OPENAI/CHATGPT, JANGAN NEOSANTARA
  const savedChatgptKey = (user && (user.openaiApiKey || user.chatgptApiKey)) ||
    (userEmail ? (localStorage.getItem(`edu_openai_api_key_${userEmail}`) || localStorage.getItem(`edu_chatgpt_api_key_${userEmail}`)) : '') ||
    localStorage.getItem('edu_openai_api_key') ||
    localStorage.getItem('edu_chatgpt_api_key') ||
    '';

  const chatgptInput = document.getElementById('chatgptApiKeyInput') || document.getElementById('neosantaraApiKeyInput');
  if (chatgptInput) chatgptInput.value = savedChatgptKey;

  if (savedChatgptKey.trim().length > 0) {
    const chatgptStatusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
    if (chatgptStatusBadge) {
      chatgptStatusBadge.className = 'status-pill-badge';
      chatgptStatusBadge.style.background = '#eff6ff';
      chatgptStatusBadge.style.color = '#2563eb';
      chatgptStatusBadge.style.borderColor = '#bfdbfe';
      chatgptStatusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Memverifikasi...';
    }
    verifyChatgptKeySilently(savedChatgptKey.trim());
  } else {
    setChatgptBadgeEmpty();
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

  if (!input) return;
  const key = input.value.trim();

  if (!key) {
    showNotificationModal('Kunci API Kosong', 'Silakan masukkan atau tempelkan Google Gemini API Key yang valid sebelum menyimpan.', 'warning');
    setGeminiBadgeError('Kunci API belum diisi.');
    return;
  }

  const isAQ = key.startsWith('AQ.');
  const isAIza = key.startsWith('AIza');

  if (!isAQ && !isAIza) {
    setGeminiBadgeError("Format kunci tidak sesuai (harus diawali 'AQ.' atau 'AIza')");
    showNotificationModal(
      'Format Kunci Salah',
      "Format kunci Google Gemini tidak sesuai. Kunci resmi dari Google AI Studio diawali dengan 'AQ.' (format baru) atau 'AIza' (format lama). Silakan periksa kembali.",
      'error'
    );
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

  const geminiStatusBadge = document.getElementById('apiStatusBadge');
  const geminiBox = document.getElementById('connectionStatusBox');
  const geminiIcon = document.getElementById('connectionStatusIcon');
  const geminiTitle = document.getElementById('connectionStatusTitle');
  const geminiDesc = document.getElementById('connectionStatusDesc');

  if (geminiStatusBadge) {
    geminiStatusBadge.className = 'status-pill-badge';
    geminiStatusBadge.style.background = '#eff6ff';
    geminiStatusBadge.style.color = '#2563eb';
    geminiStatusBadge.style.borderColor = '#bfdbfe';
    geminiStatusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Menguji Koneksi...';
  }
  if (geminiBox) geminiBox.className = 'connection-status-box status-testing';
  if (geminiIcon) {
    geminiIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `;
  }
  if (geminiTitle) geminiTitle.textContent = 'Sedang Menguji Koneksi ke Google Gemini...';
  if (geminiDesc) geminiDesc.textContent = 'Memverifikasi status dan autentikasi kunci API langsung ke server Google AI Studio.';

  // Uji koneksi nyata ke Google Gemini Models API
  let isConnected = false;
  let errorMsg = '';

  try {
    // 1. Coba verifikasi dengan header x-goog-api-key (standar resmi untuk kunci AQ dan AIza)
    let response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': key
      }
    });

    // 2. Fallback via query parameter jika diperlukan
    if (!response.ok) {
      const qRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        method: 'GET'
      });
      if (qRes.ok) response = qRes;
    }

    if (response.ok) {
      isConnected = true;
    } else {
      isConnected = false;
      let errData = {};
      try {
        errData = await response.json();
      } catch (e) {}

      if (errData && errData.error && errData.error.message) {
        errorMsg = errData.error.message;
      } else {
        errorMsg = `HTTP ${response.status}`;
      }

      if (errorMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || errorMsg.includes('UNAUTHENTICATED')) {
        errorMsg = "Autentikasi ditolak Google. Pastikan kunci telah diaktifkan di Google AI Studio (buka aistudio.google.com/app/apikey) dan seluruh karakter kunci tersalin lengkap.";
      }
    }
  } catch (err) {
    isConnected = false;
    errorMsg = 'Gagal menghubungi server Google Gemini. Periksa koneksi internet Anda.';
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

    setGeminiBadgeSuccess();
    showNotificationModal('Koneksi Berhasil!', 'Kunci API Google Gemini berhasil disimpan ke akun Anda dan terverifikasi aktif.', 'success');
  } else {
    setGeminiBadgeError(errorMsg);
    showNotificationModal('Kunci API Tidak Sesuai', `Kunci API Google Gemini tidak sesuai atau ditolak: "${errorMsg}". Tanda koneksi tidak akan hijau sampai kunci yang valid dimasukkan.`, 'error');
  }
}

/**
 * Simpan API Key ChatGPT (OpenAI) ke Akun Pengguna & Verifikasi Kunci Nyata
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

  if (!input) return;
  const key = input.value.trim();

  if (!key) {
    showNotificationModal('Kunci API Kosong', 'Silakan masukkan atau tempelkan ChatGPT / OpenAI API Key yang valid sebelum menyimpan.', 'warning');
    setChatgptBadgeError('Kunci API masih kosong.');
    return;
  }

  if (!key.startsWith('sk-')) {
    setChatgptBadgeError("Format kunci salah (kunci OpenAI harus diawali 'sk-...')");
    showNotificationModal('Format Kunci Salah', "Kunci API ChatGPT / OpenAI harus diawali dengan 'sk-...'. Tanda koneksi tidak akan hijau sampai kunci yang benar dimasukkan.", 'error');
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

  const chatgptStatusBadge = document.getElementById('chatgptStatusBadge') || document.getElementById('neosantaraStatusBadge');
  const chatgptBox = document.getElementById('chatgptConnectionStatusBox') || document.getElementById('neosantaraConnectionStatusBox');
  const chatgptIcon = document.getElementById('chatgptConnectionStatusIcon') || document.getElementById('neosantaraConnectionStatusIcon');
  const chatgptTitle = document.getElementById('chatgptConnectionStatusTitle') || document.getElementById('neosantaraConnectionStatusTitle');
  const chatgptDesc = document.getElementById('chatgptConnectionStatusDesc') || document.getElementById('neosantaraConnectionStatusDesc');

  if (chatgptStatusBadge) {
    chatgptStatusBadge.className = 'status-pill-badge';
    chatgptStatusBadge.style.background = '#eff6ff';
    chatgptStatusBadge.style.color = '#2563eb';
    chatgptStatusBadge.style.borderColor = '#bfdbfe';
    chatgptStatusBadge.innerHTML = '<span class="status-dot" style="background:#2563eb"></span> Menguji Koneksi...';
  }
  if (chatgptBox) chatgptBox.className = 'connection-status-box status-testing';
  if (chatgptIcon) {
    chatgptIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    `;
  }
  if (chatgptTitle) chatgptTitle.textContent = 'Sedang Menguji Koneksi ke OpenAI...';
  if (chatgptDesc) chatgptDesc.textContent = 'Memverifikasi status dan autentikasi kunci API langsung ke server OpenAI.';

  let isConnected = false;
  let errorMsg = '';

  // UJI NYATA KE SERVER OPENAI RESMI
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });

    if (response.ok) {
      isConnected = true;
    } else {
      isConnected = false;
      try {
        const errData = await response.json();
        if (errData && errData.error && errData.error.message) {
          errorMsg = errData.error.message;
        } else {
          errorMsg = `HTTP ${response.status} (Autentikasi ditolak)`;
        }
      } catch (e) {
        errorMsg = `HTTP ${response.status}`;
      }
    }
  } catch (err) {
    // Jika fetch browser terkena kendala jaringan, uji via proxy jika server lokal ada
    try {
      const proxyRes = await fetch('/api/openai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      if (proxyRes.ok) {
        const pData = await proxyRes.json();
        if (pData.status === 'success') {
          isConnected = true;
        } else {
          isConnected = false;
          errorMsg = pData.message || 'Kunci API OpenAI tidak valid.';
        }
      } else {
        const pErr = await proxyRes.json().catch(() => ({}));
        isConnected = false;
        errorMsg = pErr.message || `HTTP ${proxyRes.status}`;
      }
    } catch (pe) {
      isConnected = false;
      errorMsg = 'Gagal menghubungi server OpenAI. Periksa koneksi internet Anda.';
    }
  }

  if (btnSave) {
    btnSave.disabled = false;
    btnSave.innerHTML = `
      <img src="../Assets/icon/icon_save.png" class="btn-icon-img" alt="">
      <span>Simpan Kunci API</span>
    `;
  }

  // JIKA TERKONEKSI DAN VALID -> HIJAU
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

    setChatgptBadgeSuccess();
    showNotificationModal('Koneksi Berhasil!', 'Kunci API ChatGPT (OpenAI) berhasil disimpan ke akun Anda dan terverifikasi aktif.', 'success');
  } else {
    // JIKA SALAH / GAGAL / TIDAK SESUAI -> MERAH (TIDAK HIJAU!)
    setChatgptBadgeError(errorMsg);
    showNotificationModal(
      'Kunci API Tidak Sesuai',
      `Kunci API ChatGPT yang Anda masukkan tidak terhubung atau tidak sesuai: "${errorMsg}". Tanda koneksi tidak akan hijau sampai kunci yang valid dimasukkan.`,
      'error'
    );
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


