/**
 * Edu Workspace - Profil Guru / Dosen Logic
 * Form Pengajuan, Realtime Polling Status Persetujuan, dan Custom Alert
 */

let lastKnownStatus = null;
let lastKnownApproved = null;
let lastKnownRejectReason = null;
let customAlertCallback = null;

function initPage() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "../halaman login/halaman login.html";
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
    window.location.replace("../dashboard admin/dashboard admin.html");
    return;
  }

  // Selalu ambil status dan data verifikasi terbaru langsung dari database (STORAGE_KEY)
  try {
    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const latestUser = allUsers.find(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
    if (latestUser) {
      user = { ...user, ...latestUser };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) { }

  // Render Header Global Terpusat (Tanpa tombol API Key, Kembali ke Landing Page)
  renderEduNavbar({
    homeUrl: '../index.html',
    showBack: true,
    backUrl: '../index.html',
    showApiKey: false,
    showDaftarModul: false
  });

  renderPageState(user);
}

function reRegisterUser() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (loggedUserStr) {
    try {
      const u = JSON.parse(loggedUserStr);
      const email = (u.email || '').trim().toLowerCase();
      if (email) {
        localStorage.removeItem(`edu_api_key_${email}`);
        localStorage.removeItem(`edu_modul_list_${email}`);
      }
    } catch(e) {}
  }
  localStorage.removeItem('edu_current_generated_modul');
  localStorage.removeItem('edu_editing_modul_payload');
  localStorage.removeItem('edu_last_modul_payload');
  localStorage.removeItem('edu_gemini_api_key');
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "../halaman login/halaman login.html";
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
    document.getElementById('userAvatar').src = getGoogleAvatar(user.name, user.avatar);
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
    form.style.display = 'none';
    statusContainer.style.display = 'block';
    pendingBox.style.display = 'none';
    approvedBox.style.display = 'none';
    rejectedBox.style.display = 'none';
    deletedBox.style.display = 'block';

    document.getElementById('profileTitleText').textContent = user.name || 'Akun Dihapus';
    document.getElementById('profileDescText').textContent = user.email || '';
  } else if (isApproved) {
    window.location.replace("dashboard pengguna.html");
    return;
  } else if (isRejected) {
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
    form.style.display = 'none';
    statusContainer.style.display = 'block';
    pendingBox.style.display = 'block';
    approvedBox.style.display = 'none';
    rejectedBox.style.display = 'none';
    deletedBox.style.display = 'none';

    document.getElementById('profileTitleText').textContent = user.name || 'Profil Guru';
    document.getElementById('profileDescText').textContent = user.email || '';
  } else {
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

function syncToDatabase(user) {
  try {
    let allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    const targetEmail = (user.email || '').toLowerCase();
    if (targetEmail && targetEmail !== ADMIN_EMAIL.toLowerCase()) {
      let index = allUsers.findIndex(u => (u.email || '').toLowerCase() === targetEmail);
      if (index !== -1) {
        allUsers[index] = { ...allUsers[index], ...user };
      } else {
        allUsers.push(user);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));

    // Sync ke Supabase
    SupabaseDB.upsertUser(user).catch(() => {
      // Fallback ke Backend Server
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      }).catch(e => { });
    });

    try {
      const channel = new BroadcastChannel('edu_workspace_sync');
      channel.postMessage({ type: 'SYNC_USER', email: user.email });
    } catch (e) { }
  } catch (e) { }
}

function saveProfile(event) {
  event.preventDefault();
  const name = document.getElementById('inputName').value.trim();
  const institution = document.getElementById('inputInstitution').value.trim();
  const gradeLevel = document.getElementById('inputGrade').value;

  if (!name || !institution || !gradeLevel) {
    showCustomAlert("Data Belum Lengkap", "Mohon lengkapi seluruh kolom formulir profil wajib sebelum mengajukan verifikasi.", "warning");
    return;
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
  delete user.rejectReason;

  const now = new Date();
  user.registeredAt = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Simpan sesi dan database
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  syncToDatabase(user);

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

// Polling dan Event Listener Realtime Sinkronisasi
async function checkLiveStatus() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) return;
  let user = JSON.parse(loggedUserStr);

  const isSuperAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
  if (isSuperAdmin) return;

  // Prioritas: Supabase
  try {
    const dbUser = await SupabaseDB.getUserByEmail((user.email || '').toLowerCase());
    if (dbUser) {
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
      // User tidak ditemukan = dihapus
      if (user.status !== 'Dihapus' || lastKnownStatus !== 'Dihapus') {
        user.status = 'Dihapus';
        user.isDeleted = true;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        renderPageState(user);
      }
      return;
    }
  } catch (e) { }

  // Fallback ke /api/users
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      const allUsers = data.users || [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));

      const target = allUsers.find(u => (u.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase());
      if (target) {
        const domNeedsUpdate = target.status !== lastKnownStatus ||
          target.isApproved !== lastKnownApproved ||
          target.rejectReason !== lastKnownRejectReason;

        user = { ...user, ...target, isDeleted: false };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        if (domNeedsUpdate) renderPageState(user);
        return;
      } else {
        if (user.status !== 'Dihapus' || lastKnownStatus !== 'Dihapus') {
          user.status = 'Dihapus';
          user.isDeleted = true;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          renderPageState(user);
        }
        return;
      }
    }
  } catch (e) { }

  // Fallback ke localStorage lokal
  try {
    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const target = allUsers.find(u => (u.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase());
    if (target) {
      const domNeedsUpdate = target.status !== lastKnownStatus ||
        target.isApproved !== lastKnownApproved ||
        target.rejectReason !== lastKnownRejectReason;

      user = { ...user, ...target, isDeleted: false };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      if (domNeedsUpdate) renderPageState(user);
    } else if (allUsers.length > 0) {
      if (user.status !== 'Dihapus' || lastKnownStatus !== 'Dihapus') {
        user.status = 'Dihapus';
        user.isDeleted = true;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        renderPageState(user);
      }
    }
  } catch (e) { }
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

try {
  const channel = new BroadcastChannel('edu_workspace_sync');
  channel.onmessage = () => {
    checkLiveStatus();
  };
} catch (e) { }

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
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          renderPageState(user);
          return;
        }
      }
    }
    checkLiveStatus();
  };
} catch (e) { }
