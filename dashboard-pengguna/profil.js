/**
 * Edu Workspace - Profil Guru / Dosen Logic
 * Form Pengajuan, Realtime Polling Status Persetujuan, dan Custom Alert
 */

let lastKnownStatus = null;
let lastKnownApproved = null;
let lastKnownRejectReason = null;
let customAlertCallback = null;

async function initPage() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Silakan Login Terlebih Dahulu",
        message: "Sesi Anda belum terautentikasi. Silakan masuk untuk melihat profil akun Anda.",
        iconType: "lock",
        buttonText: "Ke Halaman Login",
        redirectUrl: "../halaman-login/halaman-login.html"
      });
    } else {
      window.location.href = "../halaman-login/halaman-login.html";
    }
    return;
  }

  let user = JSON.parse(loggedUserStr);

  // Jika akun yang login adalah Super Admin, langsung arahkan ke Dashboard Admin
  const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
  if (isAdmin) {
    user.role = 'Admin';
    user.status = 'Aktif';
    user.isApproved = true;
    user.isProfileCompleted = true;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    syncToDatabase(user);
    window.location.replace("../dashboard-admin/dashboard-admin.html");
    return;
  }

  // Render Header Global Terpusat (Tanpa tombol API Key, Kembali ke Landing Page)
  renderEduNavbar({
    homeUrl: '../index.html',
    showBack: true,
    backUrl: '../index.html',
    showApiKey: false,
    showDaftarModul: false
  });

  // Render state awal dari sesi lokal terlebih dahulu agar UI instan
  renderPageState(user);

  // Prioritas Utama: Ambil data & status verifikasi terakurat langsung dari Supabase
  try {
    const userEmail = (user.email || '').toLowerCase();
    const dbUser = await SupabaseDB.getUserByEmail(userEmail);
    if (dbUser) {
      if ((dbUser.isDeleted || dbUser.status === 'Dihapus' || dbUser.is_deleted) && !isReRegistering) {
        user.status = 'Dihapus';
        user.isDeleted = true;
        user.isApproved = false;
      } else if (!isReRegistering) {
        // Jangan timpa data lokal jika lokal baru saja submit profil (Menunggu Persetujuan)
        // sedangkan Supabase belum sempat menyelesaikan sinkronisasi
        const localIsSubmitted = user.isProfileCompleted === true && user.institution && (user.status === 'Menunggu Persetujuan' || user.status === 'Pending');
        const dbIsUncompleted = dbUser.status === 'Belum Lengkap' || !dbUser.isProfileCompleted;

        if (localIsSubmitted && dbIsUncompleted) {
          console.log('[Profil] Melakukan sinkronisasi ulang pengajuan profil ke Supabase...');
          SupabaseDB.upsertUser(user).catch(() => {});
        } else {
          user = { ...user, ...dbUser };
        }
      }
    } else {
      // Akun tidak ditemukan di Supabase -> Jadikan akun baru (Belum Lengkap) jika belum mengajukan profil
      if (user.status !== 'Menunggu Persetujuan' && !user.isProfileCompleted) {
        user.status = 'Belum Lengkap';
        user.isDeleted = false;
        user.isApproved = false;
      }
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Sinkronkan ke STORAGE_KEY juga
    try {
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const idx = allUsers.findIndex(u => (u.email || '').toLowerCase() === userEmail);
      if (user.status === 'Dihapus') {
        if (idx !== -1) allUsers.splice(idx, 1);
      } else {
        if (idx !== -1) allUsers[idx] = { ...allUsers[idx], ...user };
        else allUsers.push(user);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
    } catch (e) { }

    renderPageState(user);
  } catch (e) {
    console.warn('[Profil] Gagal sinkronisasi Supabase:', e);
  }
}

let isReRegistering = false;

async function reRegisterUser() {
  stopLiveStatusPolling();
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    window.location.href = "../halaman-login/halaman-login.html";
    return;
  }

  isReRegistering = true;
  let user = JSON.parse(loggedUserStr);
  const email = (user.email || '').trim().toLowerCase();

  // Bersihkan data modul & API key lama
  if (email) {
    try {
      localStorage.removeItem(`edu_api_key_${email}`);
      localStorage.removeItem(`edu_modul_list_${email}`);
    } catch (e) {}
  }
  localStorage.removeItem('edu_current_generated_modul');
  localStorage.removeItem('edu_editing_modul_payload');
  localStorage.removeItem('edu_last_modul_payload');
  localStorage.removeItem('edu_gemini_api_key');

  // Reset status akun kembali ke Akun Baru (Belum Lengkap) agar dapat input profil baru
  user.status = 'Belum Lengkap';
  user.isDeleted = false;
  user.is_deleted = false;
  user.isApproved = false;
  user.isProfileCompleted = false;
  user.institution = '';
  user.gradeLevel = '';
  user.subject = '';
  user.features = [];
  user.subscriptionStart = null;
  user.subscriptionEnd = null;
  user.subscriptionDays = null;
  delete user.subscriptionStart;
  delete user.subscriptionEnd;
  delete user.subscriptionDays;
  delete user.rejectReason;

  lastKnownStatus = 'Belum Lengkap';
  lastKnownApproved = false;
  lastKnownRejectReason = null;

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  // Simpan ke daftar user lokal
  try {
    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = allUsers.findIndex(u => (u.email || '').toLowerCase() === email);
    if (idx !== -1) {
      allUsers[idx] = { ...allUsers[idx], ...user };
    } else {
      allUsers.push(user);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
  } catch (e) {}

  // Update langsung ke Supabase: un-delete, ubah status menjadi Belum Lengkap, dan kosongkan masa langganan
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.updateUserByEmail) {
    SupabaseDB.updateUserByEmail(email, {
      isDeleted: false,
      status: 'Belum Lengkap',
      isApproved: false,
      isProfileCompleted: false,
      institution: '',
      gradeLevel: '',
      subject: '',
      rejectReason: '',
      features: [],
      subscriptionStart: null,
      subscriptionEnd: null
    }).catch(err => console.warn("Gagal reset status di Supabase:", err));
  }

  // Sinkronisasi ke backend lokal jika aktif
  fetch('/api/users/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      status: 'Belum Lengkap',
      isApproved: false,
      isDeleted: false,
      institution: '',
      gradeLevel: ''
    })
  }).catch(() => {});

  // Langsung tampilkan formulir pengisian profil baru di halaman ini!
  renderPageState(user);
  const form = document.getElementById('profileForm');
  const statusContainer = document.getElementById('statusStateContainer');
  if (form && statusContainer) {
    form.style.display = 'block';
    statusContainer.style.display = 'none';

    document.getElementById('inputName').value = user.name || '';
    document.getElementById('inputEmail').value = user.email || '';
    document.getElementById('inputInstitution').value = '';
    document.getElementById('inputGrade').value = '';

    document.getElementById('profileTitleText').textContent = 'Pendaftaran Ulang Profil';
    document.getElementById('profileDescText').textContent = 'Lengkapi identitas instansi dan jenjang pendidikan Anda untuk mengajukan akun baru.';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function renderPageState(user) {
  const hasExpiredSub = isSubscriptionExpired(user);
  if (hasExpiredSub && user.status === 'Aktif') {
    user.status = 'Nonaktif';
    user.isApproved = false;
    user.rejectReason = 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.';
  }

  lastKnownStatus = user.status;
  lastKnownApproved = user.isApproved;
  lastKnownRejectReason = user.rejectReason;

  if (document.getElementById('userAvatar')) {
    const avatarEl = document.getElementById('userAvatar');
    avatarEl.referrerPolicy = 'no-referrer';
    avatarEl.onerror = function() {
      this.onerror = null;
      this.src = getGoogleAvatar(user.name || 'User', null);
    };
    avatarEl.src = getGoogleAvatar(user.name, user.avatar);
  }

  document.getElementById('inputName').value = user.name || '';
  document.getElementById('inputEmail').value = user.email || '';
  if (user.institution && user.institution !== 'Sekolah / Instansi Guru') {
    document.getElementById('inputInstitution').value = user.institution;
  }
  if (user.gradeLevel) {
    document.getElementById('inputGrade').value = user.gradeLevel;
  }

  const form = document.getElementById('profileForm');
  const statusContainer = document.getElementById('statusStateContainer');
  const pendingBox = document.getElementById('pendingStateBox');
  const approvedBox = document.getElementById('approvedStateBox');
  const rejectedBox = document.getElementById('rejectedStateBox');
  const deletedBox = document.getElementById('deletedStateBox');

  const isDeleted = user.status === 'Dihapus' || user.isDeleted === true;
  const isProfileSubmitted = user.isProfileCompleted === true &&
    user.institution &&
    user.institution.trim() !== '' &&
    user.institution !== 'Sekolah / Instansi Guru' &&
    user.status !== 'Belum Lengkap';

  const isApproved = (user.isApproved === true || user.status === 'Aktif') && isProfileSubmitted && !isDeleted && !hasExpiredSub;
  const isDeactivated = (user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || hasExpiredSub) && !isDeleted;
  const isRejected = (user.status === 'Ditolak' || isDeactivated) && !isDeleted;
  const isPending = isProfileSubmitted && !isDeleted && (user.status === 'Menunggu Persetujuan' || user.status === 'Pending' || (!isApproved && !isRejected));

  if (isDeleted) {
    stopLiveStatusPolling();
    form.style.display = 'none';
    statusContainer.style.display = 'block';
    pendingBox.style.display = 'none';
    approvedBox.style.display = 'none';
    rejectedBox.style.display = 'none';
    deletedBox.style.display = 'block';

    document.getElementById('profileTitleText').textContent = user.name || 'Akun Dihapus';
    document.getElementById('profileDescText').textContent = user.email || '';
  } else if (isApproved) {
    stopLiveStatusPolling();
    window.location.replace("dashboard-pengguna.html");
    return;
  } else if (isRejected) {
    stopLiveStatusPolling();
    form.style.display = 'none';
    statusContainer.style.display = 'block';
    pendingBox.style.display = 'none';
    approvedBox.style.display = 'none';
    deletedBox.style.display = 'none';
    rejectedBox.style.display = 'block';

    if (isDeactivated) {
      document.getElementById('rejectedStateTitle').textContent = hasExpiredSub ? 'Masa Langganan Habis' : 'Akun Dinonaktifkan';
      document.getElementById('rejectedStateDesc').textContent = hasExpiredSub
        ? 'Masa aktif langganan akun kamu telah berakhir. Silahkan perpanjang langganan untuk kembali menggunakan layanan Edu Workspace.'
        : 'Akun kamu telah dinonaktifkan oleh Tim Edu Workspace karena tidak memenuhi syarat';
    } else {
      document.getElementById('rejectedStateTitle').textContent = 'Pengajuan Akun Ditolak';
      document.getElementById('rejectedStateDesc').textContent = 'Mohon maaf, data pengajuan Anda belum dapat disetujui oleh Tim Edu Workspace.';
    }

    const rawReason = user.rejectReason || (hasExpiredSub ? 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.' : (isDeactivated ? 'Akun dinonaktifkan oleh Tim Edu Workspace.' : 'Data asal sekolah atau identitas profil belum memenuhi verifikasi administrasi.'));
    const formattedReason = rawReason.replace(/(08[0-9]{8,12})/g, '<a href="https://wa.me/62$1" target="_blank" style="color: #15803d; font-weight: 700; text-decoration: underline;">$1 (Hubungi via WhatsApp ↗)</a>').replace(/6208/g, '628');
    document.getElementById('rejectReasonText').innerHTML = formattedReason;

    document.getElementById('profileTitleText').textContent = user.name || 'Profil Guru';
    document.getElementById('profileDescText').textContent = user.email || '';
  } else if (isPending) {
    startLiveStatusPolling();
    form.style.display = 'none';
    statusContainer.style.display = 'block';
    pendingBox.style.display = 'block';
    approvedBox.style.display = 'none';
    rejectedBox.style.display = 'none';
    deletedBox.style.display = 'none';

    document.getElementById('profileTitleText').textContent = user.name || 'Profil Guru';
    document.getElementById('profileDescText').textContent = user.email || '';
  } else {
    stopLiveStatusPolling();
    // Akun Baru / Belum Mengisi Profil -> Tampilkan Form Pengajuan
    form.style.display = 'block';
    statusContainer.style.display = 'none';
    document.getElementById('profileTitleText').textContent = 'Profil Guru';
    document.getElementById('profileDescText').textContent = 'Lengkapi dan kelola informasi instansi dan jenjang pendidikan Anda untuk mengaktifkan seluruh fitur Edu Workspace.';
  }
}

function enableEditProfile() {
  document.getElementById('statusStateContainer').style.display = 'none';
  document.getElementById('profileForm').style.display = 'block';
  document.getElementById('profileTitleText').textContent = 'Perbarui Data Profil';
  document.getElementById('profileDescText').textContent = 'Perbaiki informasi data yang diminta oleh Tim Edu Workspace, lalu klik Ajukan Verifikasi ulang.';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function syncToDatabase(user) {
  try {
    let allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const targetEmail = (user.email || '').toLowerCase();
    if (targetEmail && targetEmail !== ADMIN_EMAIL.toLowerCase()) {
      let index = allUsers.findIndex(u => (u.email || '').toLowerCase() === targetEmail);
      if (index !== -1) {
        if (!user.isApproved || user.status !== 'Aktif') {
          allUsers[index].subscriptionStart = null;
          allUsers[index].subscriptionEnd = null;
          delete allUsers[index].subscriptionStart;
          delete allUsers[index].subscriptionEnd;
          delete allUsers[index].subscriptionDays;
        }
        allUsers[index] = { ...allUsers[index], ...user };
      } else {
        allUsers.push(user);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));

    // Sync ke Supabase dan tunggu hasilnya
    let dbUser = null;
    try {
      dbUser = await SupabaseDB.upsertUser(user);
      if (!user.isApproved || user.status !== 'Aktif') {
        SupabaseDB.updateUserByEmail(user.email, {
          subscriptionStart: null,
          subscriptionEnd: null
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[Profil] Gagal upsert ke Supabase:', e);
    }

    // Fallback ke Backend Server
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).catch(e => { });

    try {
      const channel = new BroadcastChannel('edu_workspace_sync');
      channel.postMessage({ type: 'SYNC_USER', email: user.email });
    } catch (e) { }

    return dbUser;
  } catch (e) {
    return null;
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const name = document.getElementById('inputName').value.trim();
  const institution = document.getElementById('inputInstitution').value.trim();
  const gradeLevel = document.getElementById('inputGrade').value;

  if (!name || !institution || !gradeLevel) {
    showCustomAlert("Data Belum Lengkap", "Mohon lengkapi seluruh kolom formulir profil wajib sebelum mengajukan verifikasi.", "warning");
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitProfile');
  const originalBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.style.opacity = '0.7';
    btnSubmit.innerHTML = `<span>Sedang Mengajukan...</span>`;
  }

  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  let user = loggedUserStr ? JSON.parse(loggedUserStr) : {
    name: name,
    email: document.getElementById('inputEmail').value.trim() || 'guru@gmail.com'
  };

  // Tentukan role otomatis: Jika Perguruan Tinggi -> Dosen, lainnya -> Guru
  const role = (gradeLevel === 'Perguruan Tinggi' || gradeLevel.includes('Perguruan Tinggi') || gradeLevel.includes('Universitas')) ? 'Dosen' : 'Guru';

  user.name = name;
  user.institution = institution;
  user.gradeLevel = gradeLevel;
  user.role = role;
  user.isProfileCompleted = true;

  // Status reset menjadi Menunggu Persetujuan
  user.status = 'Menunggu Persetujuan';
  user.isApproved = false;
  user.isDeleted = false;
  user.is_deleted = false;
  user.rejectReason = '';
  delete user.rejectReason;
  isReRegistering = false;

  // Akun baru atau pengajuan profil ulang WAJIB bersih dari masa langganan lama
  user.subscriptionStart = null;
  user.subscriptionEnd = null;
  user.subscriptionDays = null;
  delete user.subscriptionStart;
  delete user.subscriptionEnd;
  delete user.subscriptionDays;

  const now = new Date();
  user.registeredAt = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Simpan segera ke sesi lokal
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  try {
    // Tunggu penyimpanan ke Supabase selesai agar data pertama pasti ter-save
    const savedUser = await syncToDatabase(user);
    if (savedUser && savedUser.id) {
      user.id = savedUser.id;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn('[Profil] Error sync database:', e);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.style.opacity = '1';
      btnSubmit.innerHTML = originalBtnHtml;
    }
  }

  showCustomAlert(
    "Pengajuan Berhasil Dikirim!",
    "Tim Edu Workspace akan segera meninjau pengajuan kamu",
    "success",
    () => {
      renderPageState(user);
    }
  );
  renderPageState(user);
}

let liveStatusTimer = null;

function startLiveStatusPolling() {
  stopLiveStatusPolling();
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) return;
  let user = null;
  try { user = JSON.parse(loggedUserStr); } catch (e) { return; }
  
  // Polling hanya aktif jika akun dalam status Menunggu Persetujuan (Pending)
  const isPending = user && (user.status === 'Menunggu Persetujuan' || user.status === 'Pending');
  if (isPending) {
    liveStatusTimer = setInterval(() => {
      checkLiveStatus(false);
    }, 8000);
  }
}

function stopLiveStatusPolling() {
  if (liveStatusTimer) {
    clearInterval(liveStatusTimer);
    liveStatusTimer = null;
  }
}

// Polling dan Event Listener Realtime Sinkronisasi
async function checkLiveStatus(force = false) {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) return;
  let user = null;
  try { user = JSON.parse(loggedUserStr); } catch (e) { return; }
  if (!user || !user.email) return;

  const isSuperAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
  if (isSuperAdmin) return;

  const isDeleted = user.status === 'Dihapus' || user.isDeleted === true || user.is_deleted === true;
  const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak';
  const isFormActive = isReRegistering || (user.status === 'Belum Lengkap' && !user.isProfileCompleted);

  // JANGAN jalankan polling jika akun berstatus Dihapus, Nonaktif, atau sedang mengisi formulir profil
  if (isDeleted || isDeactivated || isFormActive) {
    stopLiveStatusPolling();
    if (!force) return;
  }

  // Prioritas: Supabase
  try {
    const dbUser = await SupabaseDB.getUserByEmail((user.email || '').toLowerCase());
    if (dbUser) {
      // Jika akun telah diaktifkan kembali oleh Admin, langsung bawa ke dashboard pengguna
      if ((dbUser.status === 'Aktif' || dbUser.is_approved) && !dbUser.is_deleted && dbUser.status !== 'Dihapus') {
        user = { ...user, ...dbUser, status: 'Aktif', isApproved: true, isDeleted: false, rejectReason: '' };
        delete user.rejectReason;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        try {
          const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const idx = all.findIndex(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
          if (idx >= 0) all[idx] = user; else all.push(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch (e) {}
        window.location.replace("dashboard-pengguna.html");
        return;
      }

      // Jika di Supabase user ini berstatus Dihapus, dan user lokal bukan sedang Belum Lengkap
      if ((dbUser.isDeleted || dbUser.status === 'Dihapus' || dbUser.is_deleted) && user.status !== 'Belum Lengkap') {
        if (user.status !== 'Dihapus' || lastKnownStatus !== 'Dihapus') {
          user.status = 'Dihapus';
          user.isDeleted = true;
          user.isApproved = false;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          renderPageState(user);
        }
        return;
      }

      // Jangan timpa status jika user lokal berstatus Menunggu Persetujuan tapi di DB Supabase masih Belum Lengkap
      if ((user.status === 'Menunggu Persetujuan' || user.status === 'Pending') && (dbUser.status === 'Belum Lengkap' || !dbUser.isProfileCompleted)) {
        return;
      }

      const domNeedsUpdate = dbUser.status !== lastKnownStatus ||
        dbUser.isApproved !== lastKnownApproved ||
        dbUser.rejectReason !== lastKnownRejectReason;

      user = { ...user, ...dbUser, isDeleted: false };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      // Update cache lokal
      try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = all.findIndex(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
        if (idx >= 0) all[idx] = user; else all.push(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch (e) {}

      if (domNeedsUpdate) renderPageState(user);
      return;
    } else {
      // Gagal mengambil data Supabase (koneksi terputus / rate limit)
      // Pertahankan status lokal saat ini, jangan ubah status pengguna
      return;
    }
  } catch (e) {
    console.warn('[Profil LiveStatus] Gagal koneksi Supabase:', e);
  }
}


function showCustomAlert(title, message, type = 'success', callback = null) {
  customAlertCallback = callback;
  const modal = document.getElementById('customAlertModal');
  const titleEl = document.getElementById('customAlertTitle');
  const descEl = document.getElementById('customAlertDesc');
  const iconBox = document.getElementById('customAlertIconBox');
  const btn = document.getElementById('customAlertBtn');

  titleEl.textContent = title;
  descEl.textContent = message;

  if (type === 'success') {
    iconBox.style.background = '#dcfce7';
    iconBox.style.borderColor = '#86efac';
    iconBox.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    btn.style.background = '#ffd500';
    btn.style.color = '#111827';
  } else if (type === 'error' || type === 'warning') {
    iconBox.style.background = '#fee2e2';
    iconBox.style.borderColor = '#fca5a5';
    iconBox.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    btn.style.background = '#111827';
    btn.style.color = '#ffffff';
  }

  modal.classList.add('active');
}

function closeCustomAlert() {
  document.getElementById('customAlertModal').classList.remove('active');
  if (typeof customAlertCallback === 'function') {
    customAlertCallback();
    customAlertCallback = null;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

window.addEventListener('storage', () => {
  checkLiveStatus();
});

window.addEventListener('focus', () => {
  checkLiveStatus();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkLiveStatus();
  }
});

try {
  const channel = new BroadcastChannel('edu_workspace_sync');
  channel.onmessage = (event) => {
    if (event.data && event.data.type === 'USER_DELETED') {
      const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
      if (loggedUserStr) {
        const user = JSON.parse(loggedUserStr);
        if ((user.email || '').toLowerCase() === (event.data.email || '').toLowerCase()) {
          user.status = 'Dihapus';
          user.isDeleted = true;
          user.isApproved = false;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          renderPageState(user);
          return;
        }
      }
    }
    // Jika ada event sinkronisasi dari admin, lakukan satu kali pengecekan
    checkLiveStatus(true);
  };
} catch (e) { }

// Jalankan polling terjadwal hanya jika akun dalam status Menunggu Persetujuan
startLiveStatusPolling();
