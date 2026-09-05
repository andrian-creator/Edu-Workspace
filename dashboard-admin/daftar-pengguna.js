/**
 * Edu Workspace - Dashboard Admin Logic
 * Manajemen Akun, Persetujuan Profil, dan Masa Langganan
 */

let currentRejectTargetEmail = null;
let currentDeleteTargetEmail = null;
let currentSubTargetEmail = null;

function showAdminToast(msg) {
  const toast = document.getElementById('adminToast');
  const text = document.getElementById('adminToastText');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// Proteksi Keamanan: Periksa apakah user saat ini adalah Admin
function checkAdminAuth() {
  if (typeof enforceAdminGuard === 'function') {
    const passed = enforceAdminGuard();
    if (!passed) return false;
  } else {
    const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!loggedUserStr) {
      if (typeof hideAdminPageContent === 'function') hideAdminPageContent();
      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "Silakan Login Terlebih Dahulu",
          message: "Sesi Anda belum terautentikasi. Silakan masuk dengan akun Google terdaftar untuk mengakses Dashboard Admin.",
          iconType: "lock",
          buttonText: "Ke Halaman Login",
          redirectUrl: "../halaman-login/halaman-login.html"
        });
      } else {
        window.location.href = "../halaman-login/halaman-login.html";
      }
      return false;
    }

    let user = null;
    try { user = JSON.parse(loggedUserStr); } catch (e) {}
    const isAdm = typeof isCurrentUserAdmin === 'function' 
      ? isCurrentUserAdmin(user) 
      : (user && (user.role === 'Admin' || (user.email || '').toLowerCase() === (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL.toLowerCase() : '')));
    if (!isAdm) {
      if (typeof hideAdminPageContent === 'function') hideAdminPageContent();
      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "Akses Terbatas",
          message: "Halaman ini hanya dapat diakses oleh Administrator Edu Workspace.",
          iconType: "warning",
          buttonText: "Ke Dashboard Pengguna",
          redirectUrl: "../dashboard-pengguna/dashboard-pengguna.html"
        });
      } else {
        window.location.href = "../dashboard-pengguna/dashboard-pengguna.html";
      }
      return false;
    }
  }

  // Render Global Navbar Terpusat (Otomatis: homeUrl & backUrl ke dashboard-admin.html)
  renderEduNavbar();
  return true;
}

// Sistem Pengiriman Email Notifikasi ke Pengguna
function sendEmailNotification(userEmail, userName, type, details = {}) {
  const isApproved = type === 'approved';
  const subject = isApproved
    ? '[Edu Workspace] Selamat! Pengajuan Akun Pendidik Anda Telah Disetujui'
    : '[Edu Workspace] Status Pengajuan Akun: Memerlukan Perbaikan Data';

  const bodyText = isApproved
    ? `Selamat ${userName}!\n\nPengajuan pendaftaran akun guru Anda di Edu Workspace telah berhasil diverifikasi dan disetujui oleh Edu Workspace.\n\nInstansi: ${details.institution || '-'}\nMata Pelajaran: ${details.subject || '-'}\nStatus: Disetujui & Aktif\n\nAnda sekarang dapat mengakses seluruh fitur administrasi mengajar Edu Workspace.`
    : `Halo ${userName},\n\nTerima kasih atas pengajuan akun Anda di Edu Workspace. Mohon maaf, saat ini pengajuan akun Anda belum dapat disetujui.\n\nCatatan Admin: "${details.reason || 'Data instansi/sekolah belum terverifikasi'}"\n\nSilakan buka akun Edu Workspace Anda untuk memperbaiki data profil dan mengajukan ulang verifikasi.`;

  // Kirim ke backend API /api/send-email
  fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: userEmail,
      name: userName,
      subject: subject,
      type: type,
      reason: details.reason || '',
      institution: details.institution || '',
      subject_taught: details.subject || '',
      body: bodyText
    })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Email Dispatch Success:", data);
    })
    .catch(err => {
      console.log("Email Dispatch Logged:", err);
    });
}

function ensureInitialData() {
  let data = localStorage.getItem(STORAGE_KEY);
  let users = [];

  if (!data) {
    const savedAdminAvatar = localStorage.getItem('edu_admin_avatar') || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
    users = [
      {
        id: 'ADM-001',
        name: 'Rico Andrianto',
        email: 'ric04ndri4nt0@gmail.com',
        avatar: savedAdminAvatar,
        role: 'Admin',
        institution: 'Edu Workspace',
        subject: 'Super Admin',
        registeredAt: '02 Sep 2026, 08:01',
        provider: 'Google Account (@gmail.com)',
        status: 'Aktif',
        isApproved: true,
        isProfileCompleted: true
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } else {
    try {
      users = JSON.parse(data);
    } catch (e) {
      users = [];
    }
  }

  // Pastikan akun admin utama selalu terdaftar dengan status Aktif & Super Admin
  let adminIndex = users.findIndex(u => (u.email || '').toLowerCase() === 'ric04ndri4nt0@gmail.com');
  const savedAdminAvatar = localStorage.getItem('edu_admin_avatar') || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
  if (adminIndex === -1) {
    users.unshift({
      id: 'ADM-001',
      name: 'Rico Andrianto',
      email: 'ric04ndri4nt0@gmail.com',
      avatar: savedAdminAvatar,
      role: 'Admin',
      institution: 'Edu Workspace',
      subject: 'Super Admin',
      registeredAt: '02 Sep 2026, 08:01',
      provider: 'Google Account (@gmail.com)',
      status: 'Aktif',
      isApproved: true,
      isProfileCompleted: true
    });
  } else {
    users[adminIndex].name = 'Rico Andrianto';
    users[adminIndex].role = 'Admin';
    users[adminIndex].status = 'Aktif';
    users[adminIndex].isApproved = true;
    users[adminIndex].isProfileCompleted = true;
    users[adminIndex].institution = 'Edu Workspace';
    users[adminIndex].subject = 'Super Admin';
    if (savedAdminAvatar && !savedAdminAvatar.includes('default-user')) {
      users[adminIndex].avatar = savedAdminAvatar;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return users;
}

function getUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const list = data ? JSON.parse(data) : [];
    // Jangan pernah tampilkan user yang berstatus Dihapus / isDeleted
    return list.filter(u => !u.isDeleted && u.status !== 'Dihapus');
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) { }
}

function approveUserByEmail(email) {
  let users = getUsers();
  const index = users.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (index === -1) return;
  const targetUser = users[index];

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  // Jika masa langganan kosong atau sudah habis, otomatis aktifkan masa langganan baru 30 hari ke depan
  if (!targetUser.subscriptionEnd || todayStr > targetUser.subscriptionEnd) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.getFullYear() + '-' + String(nextMonth.getMonth() + 1).padStart(2, '0') + '-' + String(nextMonth.getDate()).padStart(2, '0');
    targetUser.subscriptionStart = targetUser.subscriptionStart || todayStr;
    targetUser.subscriptionEnd = nextMonthStr;
  }

  targetUser.status = 'Aktif';
  targetUser.isApproved = true;
  targetUser.isProfileCompleted = true;
  targetUser.rejectReason = '';
  delete targetUser.rejectReason;
  targetUser.approvedAt = new Date().toISOString();

  // Aktifkan seluruh fitur modul pembelajaran untuk akun yang telah disetujui / diaktifkan
  targetUser.features = ['generate_modul_ajar'];

  saveUsers(users);

  // Sync ke Supabase (Prioritas Utama Cloud)
  SupabaseDB.updateUserByEmail(targetUser.email, {
    status: 'Aktif',
    isApproved: true,
    isProfileCompleted: true,
    rejectReason: '',
    features: ['generate_modul_ajar'],
    subscriptionStart: targetUser.subscriptionStart,
    subscriptionEnd: targetUser.subscriptionEnd
  }).catch((err) => {
    console.warn("Gagal update status persetujuan akun di Supabase:", err);
  });

  // Fallback ke backend lokal jika aktif
  fetch('/api/users/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: targetUser.email,
      status: 'Aktif',
      isApproved: true,
      features: ['generate_modul_ajar'],
      subscriptionStart: targetUser.subscriptionStart,
      subscriptionEnd: targetUser.subscriptionEnd
    })
  }).catch(e => { });

  // Kirim Notifikasi Email
  sendEmailNotification(targetUser.email, targetUser.name, 'approved', {
    institution: targetUser.institution,
    subject: targetUser.subject
  });

  // Sinkronkan akun sesi jika sama
  const currentLogged = localStorage.getItem(CURRENT_USER_KEY);
  if (currentLogged) {
    try {
      const cur = JSON.parse(currentLogged);
      if ((cur.email || '').toLowerCase() === email.toLowerCase()) {
        cur.status = 'Aktif';
        cur.isApproved = true;
        cur.isProfileCompleted = true;
        cur.rejectReason = '';
        delete cur.rejectReason;
        cur.features = ['generate_modul_ajar'];
        cur.subscriptionStart = targetUser.subscriptionStart;
        cur.subscriptionEnd = targetUser.subscriptionEnd;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
      }
    } catch (e) { }
  }

  // Trigger event storage & BroadcastChannel realtime antar tab
  localStorage.setItem('edu_sync_timestamp', Date.now().toString());
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.postMessage({ type: 'STATUS_UPDATED', email: targetUser.email, status: 'Aktif' });
    channel.postMessage({ type: 'FEATURES_UPDATED', email: targetUser.email, features: ['generate_modul_ajar'] });
    channel.postMessage({ type: 'SYNC_USER', email: targetUser.email });
  } catch (e) { }

  showAdminToast(`✓ Akun "${targetUser.name}" berhasil diaktifkan dengan akses penuh ke seluruh fitur!`);
  renderTable();
}

function openRejectModal(email) {
  document.querySelectorAll('.action-popup-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.btn-action-more').forEach(b => b.classList.remove('active'));

  const users = getUsers();
  const targetUser = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!targetUser) return;

  currentRejectTargetEmail = email;
  const isCurrentlyActive = targetUser.status === 'Aktif' || targetUser.isApproved;

  const modalTitle = document.getElementById('rejectModalTitleText');
  if (modalTitle) {
    modalTitle.textContent = isCurrentlyActive ? 'Nonaktifkan Akun Pengguna' : 'Tolak Pengajuan Profil';
  }

  document.getElementById('rejectTargetName').textContent = targetUser.name || 'Guru Edukasi';
  document.getElementById('rejectTargetEmail').textContent = targetUser.email || '-';
  document.getElementById('rejectReasonInput').value = targetUser.rejectReason || (isCurrentlyActive ? 'Masa langganan telah habis. Silakan lakukan perpanjangan langganan melalui WhatsApp resmi di 085608673357.' : 'Identitas pendidik perlu diperbaiki. Silakan periksa dan perbarui kelengkapan data profil Anda.');

  document.querySelectorAll('.reason-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('rejectUserModal').classList.add('active');
}

function selectRejectReason(reasonText) {
  document.getElementById('rejectReasonInput').value = reasonText;
  document.querySelectorAll('.reason-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(reasonText.slice(0, 15)));
  });
}

function closeRejectModal() {
  document.getElementById('rejectUserModal').classList.remove('active');
  currentRejectTargetEmail = null;
}

function confirmRejectUser() {
  if (!currentRejectTargetEmail) return;

  const reason = (document.getElementById('rejectReasonInput').value || '').trim() || 'Data pengajuan belum memenuhi verifikasi administrasi.';
  let users = getUsers();
  const targetUser = users.find(u => (u.email || '').toLowerCase() === currentRejectTargetEmail.toLowerCase());

  if (!targetUser) {
    closeRejectModal();
    return;
  }

  const isCurrentlyActive = targetUser.status === 'Aktif' || targetUser.isApproved;
  const nextStatus = isCurrentlyActive ? 'Nonaktif' : 'Ditolak';

  targetUser.status = nextStatus;
  targetUser.isApproved = false;
  targetUser.rejectReason = reason;
  targetUser.rejectedAt = new Date().toISOString();

  // Otomatis nonaktifkan semua fitur jika akun dinonaktifkan / ditolak
  if (nextStatus === 'Nonaktif' || nextStatus === 'Ditolak') {
    targetUser.features = [];
  }

  saveUsers(users);

  // Sync ke Supabase
  SupabaseDB.updateUserByEmail(targetUser.email, {
    status: nextStatus,
    isApproved: false,
    rejectReason: reason,
    features: []
  }).catch(() => {
    // Fallback ke backend lokal
    fetch('/api/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetUser.email,
        status: nextStatus,
        isApproved: false,
        reason: reason,
        features: []
      })
    }).catch(e => { });
  });

  // Kirim Notifikasi Email Penolakan
  sendEmailNotification(targetUser.email, targetUser.name, 'rejected', {
    reason: reason,
    institution: targetUser.institution,
    subject: targetUser.subject
  });

  // Sinkronkan akun sesi jika sama
  const currentLogged = localStorage.getItem(CURRENT_USER_KEY);
  if (currentLogged) {
    try {
      const cur = JSON.parse(currentLogged);
      if ((cur.email || '').toLowerCase() === currentRejectTargetEmail.toLowerCase()) {
        cur.status = nextStatus;
        cur.isApproved = false;
        cur.rejectReason = reason;
        cur.features = [];
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
      }
    } catch (e) { }
  }

  // Trigger event storage & BroadcastChannel realtime antar tab
  localStorage.setItem('edu_sync_timestamp', Date.now().toString());
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.postMessage({ type: 'STATUS_UPDATED', email: targetUser.email, status: nextStatus, reason: reason });
    channel.postMessage({ type: 'FEATURES_UPDATED', email: targetUser.email, features: [] });
  } catch (e) { }

  const statusLabel = nextStatus === 'Nonaktif' ? 'dinonaktifkan' : 'ditolak';
  showAdminToast(`⚠️ Akun "${targetUser.name}" berhasil ${statusLabel}.`);
  closeRejectModal();
  renderTable();
}

function openDeleteModal(email) {
  document.querySelectorAll('.action-popup-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.btn-action-more').forEach(b => b.classList.remove('active'));

  const users = getUsers();
  const targetUser = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!targetUser) return;

  if (ADMIN_EMAILS.includes((targetUser.email || '').toLowerCase())) {
    showAdminToast("⚠️ Tidak dapat menghapus akun Super Administrator utama!");
    return;
  }

  currentDeleteTargetEmail = email;
  document.getElementById('deleteTargetName').textContent = targetUser.name || 'Guru Edukasi';
  document.getElementById('deleteTargetEmail').textContent = targetUser.email || '-';
  document.getElementById('deleteUserModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteUserModal').classList.remove('active');
  currentDeleteTargetEmail = null;
}

function confirmDeleteUser() {
  if (!currentDeleteTargetEmail) return;
  const email = currentDeleteTargetEmail.trim().toLowerCase();
  closeDeleteModal();

  let users = getUsers();
  const index = users.findIndex(u => (u.email || '').toLowerCase() === email);
  if (index === -1) return;
  const targetUser = users[index];

  // Reset total masa langganan dan status pengguna yang dihapus
  targetUser.subscriptionStart = null;
  targetUser.subscriptionEnd = null;
  targetUser.subscriptionDays = null;
  delete targetUser.subscriptionStart;
  delete targetUser.subscriptionEnd;
  delete targetUser.subscriptionDays;
  targetUser.isDeleted = true;
  targetUser.status = 'Dihapus';
  targetUser.isApproved = false;
  targetUser.isProfileCompleted = false;
  targetUser.features = [];

  users.splice(index, 1);
  saveUsers(users);

  // Bersihkan data lokal yang terkait dengan akun pengguna yang dihapus
  try {
    localStorage.removeItem(`edu_api_key_${email}`);
    localStorage.removeItem(`edu_modul_list_${email}`);

    // Jika akun yang dihapus kebetulan sedang aktif di browser ini, tandai statusnya sebagai Dihapus & reset langganannya
    const curRaw = localStorage.getItem(CURRENT_USER_KEY);
    if (curRaw) {
      const curUser = JSON.parse(curRaw);
      if ((curUser.email || '').trim().toLowerCase() === email) {
        curUser.status = 'Dihapus';
        curUser.isDeleted = true;
        curUser.isApproved = false;
        curUser.isProfileCompleted = false;
        curUser.subscriptionStart = null;
        curUser.subscriptionEnd = null;
        curUser.subscriptionDays = null;
        delete curUser.subscriptionStart;
        delete curUser.subscriptionEnd;
        delete curUser.subscriptionDays;
        curUser.features = [];
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(curUser));
        localStorage.removeItem('edu_current_generated_modul');
        localStorage.removeItem('edu_editing_modul_payload');
        localStorage.removeItem('edu_last_modul_payload');
        localStorage.removeItem('edu_gemini_api_key');
      }
    }
  } catch (e) {
    console.warn('Gagal membersihkan cache lokal pengguna:', e);
  }

  // Sinkronisasi Cascade Delete ke Supabase (soft-delete)
  SupabaseDB.deleteUserByEmail(targetUser.email).catch(() => {
    // Fallback ke backend lokal
    fetch('/api/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetUser.email })
    }).catch(e => console.error("Gagal sinkronisasi hapus user:", e));
  });

  // Soft-delete semua modul milik pengguna di Supabase
  SupabaseDB.getModuls(targetUser.email).then(moduls => {
    if (moduls && moduls.length > 0) {
      moduls.forEach(m => {
        SupabaseDB.deleteModul(m.id).catch(() => {});
      });
    }
  }).catch(() => {
    // Fallback ke backend lokal
    fetch(`/api/moduls?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.moduls) && d.moduls.length > 0) {
          d.moduls.forEach(m => {
            fetch('/api/moduls/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: m.id, email: email })
            }).catch(() => {});
          });
        }
      }).catch(() => {});
  });

  localStorage.setItem('edu_sync_timestamp', Date.now().toString());
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.postMessage({ type: 'USER_DELETED', email: targetUser.email });
  } catch (e) { }

  showAdminToast(`🗑️ Akun "${targetUser.name}" beserta seluruh data modul & API berhasil dihapus permanen.`);
  renderTable();
}

function updateMinEndDate() {
  const startVal = document.getElementById('subStartDateInput').value;
  if (!startVal) return;
  const [y, m, d] = startVal.split('-').map(Number);
  const nextDay = new Date(y, m - 1, d + 1);
  const nextDayStr = nextDay.getFullYear() + '-' + String(nextDay.getMonth() + 1).padStart(2, '0') + '-' + String(nextDay.getDate()).padStart(2, '0');

  const endInput = document.getElementById('subEndDateInput');
  endInput.min = nextDayStr;
  if (endInput.value && endInput.value < nextDayStr) {
    endInput.value = nextDayStr;
  }
}

function openSubscriptionModal(email) {
  document.querySelectorAll('.action-popup-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.btn-action-more').forEach(b => b.classList.remove('active'));

  const users = getUsers();
  const targetUser = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!targetUser) return;

  currentSubTargetEmail = email;
  document.getElementById('subTargetName').textContent = targetUser.name || 'Guru Edukasi';
  document.getElementById('subTargetEmail').textContent = targetUser.email || '-';

  // Default tanggal awal: tanggal hari ini YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('subStartDateInput').value = targetUser.subscriptionStart || today;

  // Update batas minimum tanggal berakhir
  updateMinEndDate();

  // Default tanggal akhir: 1 bulan dari hari ini atau tanggal tersimpan
  if (targetUser.subscriptionEnd) {
    document.getElementById('subEndDateInput').value = targetUser.subscriptionEnd;
  } else {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    document.getElementById('subEndDateInput').value = nextMonth.toISOString().split('T')[0];
  }

  // Pastikan tanggal akhir tidak kurang dari batas minimum
  updateMinEndDate();

  document.getElementById('subscriptionModal').classList.add('active');
}

function closeSubscriptionModal() {
  document.getElementById('subscriptionModal').classList.remove('active');
  currentSubTargetEmail = null;
}

async function confirmSaveSubscription() {
  if (!currentSubTargetEmail) return;
  const email = currentSubTargetEmail;
  const startDate = document.getElementById('subStartDateInput').value;
  const endDate = document.getElementById('subEndDateInput').value;

  if (!startDate) {
    showAdminToast("⚠️ Silakan tentukan tanggal awal aktif langganan.");
    return;
  }
  if (!endDate) {
    showAdminToast("⚠️ Silakan tentukan tanggal batas waktu langganan.");
    return;
  }
  if (endDate <= startDate) {
    showAdminToast("⚠️ Batas waktu berakhir langganan tidak bisa sebelum atau sama dengan tanggal awal (harus mulai besok dan seterusnya)!");
    return;
  }

  let users = getUsers();
  const index = users.findIndex(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (index === -1) return;

  users[index].subscriptionStart = startDate;
  users[index].subscriptionEnd = endDate;

  // Jika sebelumnya dinonaktifkan karena masa langganan habis, dan sekarang diperpanjang
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  let statusUpdated = false;
  if (users[index].status === 'Nonaktif' && (users[index].rejectReason || '').includes('Masa langganan') && endDate >= todayStr) {
    users[index].status = 'Aktif';
    users[index].isApproved = true;
    delete users[index].rejectReason;
    statusUpdated = true;
  }

  saveUsers(users);

  // Tutup modal dan render tabel seketika agar UI responsif tanpa jeda
  closeSubscriptionModal();
  renderTable();
  showAdminToast(`🗓️ Menyimpan masa langganan "${users[index].name}"...`);

  // Sinkronkan akun sesi jika yang diedit adalah akun yang sedang aktif di tab ini
  const currentLogged = localStorage.getItem(CURRENT_USER_KEY);
  if (currentLogged) {
    try {
      const cur = JSON.parse(currentLogged);
      if ((cur.email || '').toLowerCase() === email.toLowerCase()) {
        cur.subscriptionStart = startDate;
        cur.subscriptionEnd = endDate;
        if (statusUpdated) {
          cur.status = 'Aktif';
          cur.isApproved = true;
          delete cur.rejectReason;
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
      }
    } catch (e) { }
  }

  // 1. Sync ke Supabase (Prioritas Utama untuk Publish Cloud / Vercel)
  const supabasePayload = {
    subscriptionStart: startDate,
    subscriptionEnd: endDate
  };
  if (statusUpdated) {
    supabasePayload.status = 'Aktif';
    supabasePayload.isApproved = true;
    supabasePayload.rejectReason = '';
  }

  if (window.SupabaseDB && typeof SupabaseDB.updateUserByEmail === 'function') {
    try {
      await SupabaseDB.updateUserByEmail(users[index].email, supabasePayload);
      showAdminToast(`🗓️ Masa langganan "${users[index].name}" berhasil disimpan.`);
    } catch (err) {
      console.warn("Gagal update masa langganan di Supabase:", err);
    }
  }

  // 2. Sync ke backend server lokal (fallback jika server.py aktif)
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users[index])
  }).catch(e => { });

  localStorage.setItem('edu_sync_timestamp', Date.now().toString());
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.postMessage({ type: 'SYNC_USER', email: users[index].email });
  } catch (e) { }

  renderTable();
}

async function fetchUsersFromBackend() {
  // Prioritas utama: Supabase
  try {
    const supabaseUsers = await SupabaseDB.getUsers();
    if (supabaseUsers && Array.isArray(supabaseUsers)) {
      // Pastikan akun admin utama tidak hilang
      const hasAdmin = supabaseUsers.some(u => (u.email || '').toLowerCase() === 'ric04ndri4nt0@gmail.com');
      if (!hasAdmin) {
        const localUsers = getUsers();
        const localAdmin = localUsers.find(u => (u.email || '').toLowerCase() === 'ric04ndri4nt0@gmail.com');
        if (localAdmin) supabaseUsers.unshift(localAdmin);
      }

      const currentStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const newStr = JSON.stringify(supabaseUsers);
      if (currentStr !== newStr) {
        localStorage.setItem(STORAGE_KEY, newStr);
        renderTable();
      }
      return;
    }
  } catch (e) { }

  // Fallback: server lokal
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        const currentStr = localStorage.getItem(STORAGE_KEY) || '[]';
        const newStr = JSON.stringify(data.users);
        if (currentStr !== newStr) {
          localStorage.setItem(STORAGE_KEY, newStr);
          renderTable();
        }
      }
    }
  } catch (e) { }
}

function updateStatsCards(users) {
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  let activeCount = 0;
  let inactiveCount = 0;
  let dosenCount = 0;
  let guruCount = 0;

  users.forEach(u => {
    const isAdm = u.role === 'Admin' || ADMIN_EMAILS.includes((u.email || '').toLowerCase());
    const isExpired = !isAdm && u.subscriptionEnd && todayStr > u.subscriptionEnd;
    const isActive = (u.status === 'Aktif' || u.isApproved === true) && !isExpired;
    const isInactive = !isAdm && (u.status === 'Nonaktif' || u.status === 'Ditolak' || u.status === 'Dinonaktifkan' || isExpired);

    if (isActive) activeCount++;
    if (isInactive) inactiveCount++;

    const isDosen = (u.role === 'Dosen') || (u.gradeLevel && (u.gradeLevel.includes('Perguruan Tinggi') || u.gradeLevel.includes('Universitas')));
    const isGuru = (u.role === 'Guru') || (!isAdm && !isDosen);

    if (isDosen && !isAdm) dosenCount++;
    if (isGuru && !isAdm) guruCount++;
  });

  if (document.getElementById('statActiveCount')) {
    document.getElementById('statActiveCount').textContent = activeCount;
  }
  if (document.getElementById('statInactiveCount')) {
    document.getElementById('statInactiveCount').textContent = inactiveCount;
  }
  if (document.getElementById('statDosenCount')) {
    document.getElementById('statDosenCount').textContent = dosenCount;
  }
  if (document.getElementById('statGuruCount')) {
    document.getElementById('statGuruCount').textContent = guruCount;
  }
}

function renderTable() {
  const users = getUsers();
  updateStatsCards(users);

  const tbody = document.getElementById('userTableBody');
  const searchQuery = (document.getElementById('searchInput').value || '').toLowerCase();

  const filtered = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(searchQuery)) ||
    (u.email && u.email.toLowerCase().includes(searchQuery)) ||
    (u.institution && u.institution.toLowerCase().includes(searchQuery)) ||
    (u.gradeLevel && u.gradeLevel.toLowerCase().includes(searchQuery)) ||
    (u.role && u.role.toLowerCase().includes(searchQuery))
  );

  document.getElementById('tableInfo').textContent = `Menampilkan ${filtered.length} dari ${users.length} akun`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          Belum ada data akun yang sesuai dengan pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((u, i) => {
    const isAdm = u.role === 'Admin' || ADMIN_EMAILS.includes((u.email || '').toLowerCase());
    const avatarUrl = getGoogleAvatar(u.name, u.avatar);

    // Deteksi apakah langganan sudah habis
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const isExpired = !isAdm && u.subscriptionEnd && todayStr > u.subscriptionEnd;

    // Jika masa langganan habis, status otomatis menjadi Nonaktif
    if (isExpired && u.status === 'Aktif') {
      u.status = 'Nonaktif';
      u.isApproved = false;
      u.rejectReason = 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.';
      u.features = [];
    }

    const isProfileComplete = u.isProfileCompleted === true && u.institution && u.institution.trim() !== '' && u.institution !== 'Sekolah / Instansi Guru';
    const isPending = !isAdm && isProfileComplete && !isExpired && (u.status === 'Menunggu Persetujuan' || (!u.isApproved && u.status !== 'Ditolak' && u.status !== 'Nonaktif'));
    const isRejected = !isAdm && (u.status === 'Ditolak' || u.status === 'Nonaktif' || isExpired);
    const isDraft = !isAdm && !isProfileComplete;
    const safeEmail = escapeHtml(u.email || '');

    let statusBadgeHtml = '';
    if (isAdm) {
      statusBadgeHtml = `<span class="status-badge">Aktif</span>`;
    } else if (isDraft) {
      statusBadgeHtml = `<span class="status-badge" style="background: #f1f5f9; color: #64748b; border-color: #cbd5e1;">Belum Mengisi</span>`;
    } else if (isPending) {
      statusBadgeHtml = `<span class="status-badge status-badge-pending">Menunggu</span>`;
    } else if (u.status === 'Nonaktif' || isExpired) {
      statusBadgeHtml = `<span class="status-badge status-badge-rejected" title="${escapeHtml(u.rejectReason || 'Masa Langganan Habis')}">Nonaktif</span>`;
    } else if (isRejected) {
      statusBadgeHtml = `<span class="status-badge status-badge-rejected" title="${escapeHtml(u.rejectReason || 'Pengajuan Ditolak')}">Ditolak</span>`;
    } else {
      statusBadgeHtml = `<span class="status-badge">${escapeHtml(u.status || 'Aktif')}</span>`;
    }

    // Tentukan teks keterangan peran (Admin / Dosen / Guru)
    let roleLabel = 'Guru';
    let roleClass = 'role-text-guru';
    if (isAdm) {
      roleLabel = 'Admin';
      roleClass = 'role-text-admin';
    } else if (u.role === 'Dosen' || (u.gradeLevel && (u.gradeLevel.includes('Perguruan Tinggi') || u.gradeLevel.includes('Universitas')))) {
      roleLabel = 'Dosen';
      roleClass = 'role-text-dosen';
    }
    const roleBadgeHtml = `<span class="role-badge-text ${roleClass}">${roleLabel}</span>`;

    // Masa Langganan (Otomatis hitung sisa ... Hari, clickable langsung untuk setting)
    let subInfoHtml = '';
    if (isAdm) {
      subInfoHtml = `<span style="color: #94a3b8; font-size: 0.85rem;">Permanen</span>`;
    } else if (u.subscriptionEnd) {
      const endParts = u.subscriptionEnd.split('-');
      const formattedEnd = endParts.length === 3 ? `${endParts[2]}/${endParts[1]}/${endParts[0]}` : u.subscriptionEnd;

      // Hitung selisih hari dari hari ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [yr, mo, dy] = u.subscriptionEnd.split('-').map(Number);
      const endDate = new Date(yr, mo - 1, dy);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Sudah Habis
        subInfoHtml = `
          <button type="button" class="sub-badge-clickable sub-badge-expired" onclick="openSubscriptionModal('${safeEmail}')" title="Masa langganan telah habis pada ${formattedEnd}. Klik untuk perpanjang">
            <span>Habis</span>
          </button>
        `;
      } else if (diffDays === 0) {
        // Hari ini terakhir
        subInfoHtml = `
          <button type="button" class="sub-badge-clickable sub-badge-warning" onclick="openSubscriptionModal('${safeEmail}')" title="Masa langganan berakhir hari ini (${formattedEnd}). Klik untuk perpanjang">
            <span>Hari Ini</span>
          </button>
        `;
      } else if (diffDays <= 3) {
        // Kurang dari atau sama dengan 3 hari (kuning peringatan)
        subInfoHtml = `
          <button type="button" class="sub-badge-clickable sub-badge-warning" onclick="openSubscriptionModal('${safeEmail}')" title="Berakhir pada ${formattedEnd} (${diffDays} hari lagi). Klik untuk atur ulang">
            <span>${diffDays} Hari</span>
          </button>
        `;
      } else {
        // Aktif normal (biru)
        subInfoHtml = `
          <button type="button" class="sub-badge-clickable sub-badge-active" onclick="openSubscriptionModal('${safeEmail}')" title="Berakhir pada ${formattedEnd} (${diffDays} hari lagi). Klik untuk atur ulang">
            <span>${diffDays} Hari</span>
          </button>
        `;
      }
    } else {
      // Belum diatur
      subInfoHtml = `
        <button type="button" class="sub-badge-clickable sub-badge-unset" onclick="openSubscriptionModal('${safeEmail}')" title="Belum diatur. Klik untuk atur masa langganan">
          <span>Atur Hari</span>
        </button>
      `;
    }

    let actionHtml = '';
    if (isAdm) {
      actionHtml = `<span style="font-size: 0.8rem; color: #854d0e; font-weight: 700;">Super Admin</span>`;
    } else if (isPending) {
      actionHtml = `
        <div class="action-menu-cell">
          <button type="button" class="btn-action-more" onclick="toggleRowActionMenu(event, 'actionMenu-${i}')" title="Pilihan Aksi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #64748b;">
              <circle cx="12" cy="5" r="2.2"></circle>
              <circle cx="12" cy="12" r="2.2"></circle>
              <circle cx="12" cy="19" r="2.2"></circle>
            </svg>
          </button>
          <div class="action-popup-menu" id="actionMenu-${i}">
            <button type="button" class="btn-action-approve" onclick="approveUserByEmail('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Setujui</span>
            </button>
            <button type="button" class="btn-action-reject" onclick="openRejectModal('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Tolak</span>
            </button>
          </div>
        </div>
      `;
    } else if (isRejected) {
      const approveButtonMarkup = isExpired
        ? `
          <button type="button" class="btn-action-approve" style="opacity: 0.38; cursor: not-allowed; background: #f8fafc; color: #94a3b8;" title="Masa langganan telah habis. Perpanjang tanggal masa langganan terlebih dahulu." onclick="showAdminToast('⚠️ Masa langganan telah habis. Silakan perpanjang tanggal masa langganan terlebih dahulu!')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Aktifkan / Setujui</span>
          </button>
        `
        : `
          <button type="button" class="btn-action-approve" onclick="approveUserByEmail('${safeEmail}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Aktifkan / Setujui</span>
          </button>
        `;

      actionHtml = `
        <div class="action-menu-cell">
          <button type="button" class="btn-action-more" onclick="toggleRowActionMenu(event, 'actionMenu-${i}')" title="Pilihan Aksi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #64748b;">
              <circle cx="12" cy="5" r="2.2"></circle>
              <circle cx="12" cy="12" r="2.2"></circle>
              <circle cx="12" cy="19" r="2.2"></circle>
            </svg>
          </button>
          <div class="action-popup-menu" id="actionMenu-${i}">
            ${approveButtonMarkup}
            <button type="button" class="btn-action-reject" onclick="openRejectModal('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Ubah Alasan</span>
            </button>
            <button type="button" class="btn-action-reject" onclick="openDeleteModal('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      `;
    } else {
      actionHtml = `
        <div class="action-menu-cell">
          <button type="button" class="btn-action-more" onclick="toggleRowActionMenu(event, 'actionMenu-${i}')" title="Pilihan Aksi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: #64748b;">
              <circle cx="12" cy="5" r="2.2"></circle>
              <circle cx="12" cy="12" r="2.2"></circle>
              <circle cx="12" cy="19" r="2.2"></circle>
            </svg>
          </button>
          <div class="action-popup-menu" id="actionMenu-${i}">
            <button type="button" class="btn-action-reject" onclick="openRejectModal('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Nonaktifkan Akun</span>
            </button>
            <button type="button" class="btn-action-reject" onclick="openDeleteModal('${safeEmail}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="user-info">
            <img src="${avatarUrl}" referrerpolicy="no-referrer" alt="Avatar" class="user-avatar-tiny" onerror="this.onerror=null; this.src=getGoogleAvatar('${escapeHtml(u.name || 'Guru')}', null);">
            <div>
              <div class="user-name">${escapeHtml(u.name || 'Guru')}</div>
              <div class="user-email">${escapeHtml(u.email || '-')}</div>
            </div>
          </div>
        </td>
        <td>${roleBadgeHtml}</td>
        <td>${escapeHtml(u.institution || '-')}</td>
        <td>${escapeHtml(u.gradeLevel || '-')}</td>
        <td style="color: var(--color-text-muted); font-size: 0.88rem;">${escapeHtml(u.registeredAt || '-')}</td>
        <td>${statusBadgeHtml}</td>
        <td>${subInfoHtml}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function toggleRowActionMenu(event, menuId) {
  if (event) {
    event.stopPropagation();
  }
  const targetMenu = document.getElementById(menuId);
  if (!targetMenu) return;

  const isOpen = targetMenu.classList.contains('show');
  document.querySelectorAll('.action-popup-menu').forEach(m => m.classList.remove('show'));
  document.querySelectorAll('.btn-action-more').forEach(b => b.classList.remove('active'));

  if (!isOpen) {
    targetMenu.classList.add('show');
    const btn = event.currentTarget;
    if (btn) btn.classList.add('active');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAdminAuth()) {
    return;
  }
  ensureInitialData();
  renderTable();
  fetchUsersFromBackend();
});

// Event listener sync realtime instan tanpa spam HTTP request
window.addEventListener('storage', () => {
  if (checkAdminAuth()) {
    renderTable();
  }
});

window.addEventListener('focus', () => {
  if (checkAdminAuth()) {
    fetchUsersFromBackend();
  }
});

try {
  const syncChannel = new BroadcastChannel('edu_workspace_sync');
  syncChannel.onmessage = () => {
    fetchUsersFromBackend();
  };
} catch (e) { }

document.addEventListener('click', (e) => {
  if (!e.target.closest('.action-menu-cell')) {
    document.querySelectorAll('.action-popup-menu').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.btn-action-more').forEach(b => b.classList.remove('active'));
  }
  const wrapper = document.getElementById('profileDropdownWrapper');
  const dropdown = document.getElementById('profileDropdown');
  if (wrapper && !wrapper.contains(e.target)) {
    if (dropdown) dropdown.classList.remove('active');
    wrapper.classList.remove('open');
  }
});

window.addEventListener('storage', () => {
  fetchUsersFromBackend();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    fetchUsersFromBackend();
  }
});

try {
  const channel = new BroadcastChannel('edu_workspace_sync');
  channel.onmessage = () => {
    fetchUsersFromBackend();
  };
} catch (e) { }
