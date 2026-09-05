/**
 * Edu Workspace - Dashboard Pengguna (Guru / Dosen) Logic
 * Verifikasi Sesi, Cek Masa Aktif Langganan, dan Manajemen Navigasi
 */

function showUserToast(msg) {
  const toast = document.getElementById('userToast');
  const text = document.getElementById('userToastText');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 3000);
}

function isProfileComplete(user) {
  if (!user) return false;
  if (isSubscriptionExpired(user)) return false;
  return user.isProfileCompleted === true &&
    user.institution &&
    user.institution !== 'Sekolah / Instansi Guru' &&
    user.gradeLevel &&
    (user.isApproved === true || user.status === 'Aktif');
}

async function initUserDashboard() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    window.location.href = "../halaman-login/halaman-login.html";
    return;
  }

  let user = JSON.parse(loggedUserStr);

  // Jika akun yang login adalah Super Admin, langsung arahkan ke Dashboard Admin
  const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
  if (isAdmin) {
    window.location.replace("../dashboard-admin/dashboard-admin.html");
    return;
  }

  // 1. Prioritas Utama: Cek status langsung dari Supabase
  try {
    const userEmail = (user.email || '').toLowerCase();
    const dbUser = await SupabaseDB.getUserByEmail(userEmail);
    if (dbUser) {
      if (dbUser.isDeleted || dbUser.status === 'Dihapus' || dbUser.is_deleted) {
        user.status = 'Dihapus';
        user.isDeleted = true;
        user.isApproved = false;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        window.location.replace("profil.html");
        return;
      }
      user = { ...user, ...dbUser };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      try {
        const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const idx = allUsers.findIndex(u => (u.email || '').toLowerCase() === userEmail);
        if (idx !== -1) {
          allUsers[idx] = { ...allUsers[idx], ...user };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allUsers));
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn('[Dashboard] Gagal koneksi Supabase:', e);
  }

  // Periksa masa aktif langganan
  if (isSubscriptionExpired(user)) {
    user.status = 'Nonaktif';
    user.isApproved = false;
    user.rejectReason = 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.';
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    fetch('/api/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        status: 'Nonaktif',
        rejectReason: user.rejectReason
      })
    }).catch(e => { });
    window.location.replace("profil.html");
    return;
  }

  // Jika akun dinonaktifkan, ditolak, atau belum disetujui, langsung kembalikan ke profil.html untuk pengajuan ulang
  if (!isProfileComplete(user)) {
    window.location.replace("profil.html");
    return;
  }

  if (document.getElementById('welcomeName')) {
    document.getElementById('welcomeName').textContent = user.name || 'Bapak/Ibu Guru';
  }
  // Render Header Global Terpusat
  renderEduNavbar({
    user: user,
    homeUrl: '../index.html',
    showBack: false,
    showDaftarModul: true,
    daftarModulUrl: 'daftar-modul-ajar.html',
    showApiKey: true,
    apiKeyUrl: 'api-key.html',
    showAccessTime: true
  });

  // Pastikan pill sisa waktu akses langsung terisi dan sinkron
  if (typeof updateHeaderAccessPill === 'function') {
    updateHeaderAccessPill(user);
  }

  // Render Modul Fitur sesuai Hak Akses Akun Pengguna
  renderUserFeatures(user);
}

function renderUserFeatures(user) {
  const container = document.getElementById('fitur');
  if (!container) return;

  const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
  const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || user.isApproved === false || isExpired;

  // 1. Ambil hak akses fitur persis seperti yang diatur oleh Admin
  let activeFeatures = [];
  if (!isDeactivated && user && Array.isArray(user.features)) {
    activeFeatures = user.features;
  }

  const hasModulAjar = activeFeatures.includes('generate_modul_ajar');
  const hasMediaPembelajaran = activeFeatures.includes('generate_media_pembelajaran');

  let cardsHtml = '';

  if (hasModulAjar) {
    cardsHtml += `
      <!-- Tombol: Generate Modul Ajar -->
      <div class="user-action-card active-card" onclick="handleFeatureClick('Generate Modul Ajar')">
        <div class="action-card-header">
          <div class="action-card-icon-box">
            <img data-icon="modul_ajar" src="${getEduIconUrl('modul_ajar')}" alt="Generate Modul Ajar" class="action-card-icon-img">
          </div>
          <span class="action-badge-active">Aktif</span>
        </div>
        <div class="action-card-body">
          <h3 class="action-card-title">Generate Modul Ajar</h3>
          <p class="action-card-desc">Buat rancangan pembelajaran Kurikulum Merdeka / K13 lengkap dengan capaian dan asesmen secara instan.</p>
        </div>
        <div class="action-card-footer">
          <span class="action-card-link">Buka Generator &rarr;</span>
        </div>
      </div>
    `;
  }

  if (hasMediaPembelajaran) {
    cardsHtml += `
      <!-- Tombol: Generate Media Pembelajaran -->
      <div class="user-action-card active-card" onclick="handleFeatureClick('Generate Media Pembelajaran')">
        <div class="action-card-header">
          <div class="action-card-icon-box">
            <img data-icon="feature" src="${getEduIconUrl('feature')}" alt="Generate Media Pembelajaran" class="action-card-icon-img">
          </div>
          <span class="action-badge-active">Aktif</span>
        </div>
        <div class="action-card-body">
          <h3 class="action-card-title">Generate Media Pembelajaran</h3>
          <p class="action-card-desc">Generator media visual, presentasi materi, dan bahan pembelajaran interaktif bertenaga AI.</p>
        </div>
        <div class="action-card-footer">
          <span class="action-card-link">Buka Generator &rarr;</span>
        </div>
      </div>
    `;
  }

  if (cardsHtml) {
    container.innerHTML = cardsHtml;
  } else {
    container.innerHTML = `
      <div class="locked-features-box">
        <div class="locked-icon-wrapper">
          <img data-icon="lock" src="${getEduIconUrl('lock')}" alt="Terkunci" class="locked-icon-img">
        </div>
        <div class="locked-content">
          <h4 class="locked-title">Akses Fitur Belum Diaktifkan</h4>
          <p class="locked-desc">
            Saat ini belum ada fitur yang diaktifkan untuk akun Anda. Silakan hubungi <strong>Admin Edu Workspace</strong> untuk mengaktifkan akses modul pembelajaran.
          </p>
        </div>
      </div>
    `;
  }

  // Kelola layout adaptif berdasarkan jumlah tombol fitur yang aktif
  const actionCards = container.querySelectorAll('.user-action-card');
  container.classList.remove('single-item', 'count-1', 'count-2', 'count-3');
  if (actionCards.length === 1) {
    container.classList.add('single-item', 'count-1');
  } else if (actionCards.length === 2) {
    container.classList.add('count-2');
  } else if (actionCards.length >= 3) {
    container.classList.add('count-3');
  }
}

function handleFeatureClick(featureName) {
  if (featureName === 'Generate Modul Ajar') {
    window.location.href = "../fitur/generate-modul-ajar/modul-ajar.html";
  } else if (featureName === 'Generate Media Pembelajaran') {
    window.location.href = "../fitur/generate-media-pembelajaran/media-pembelajaran.html";
  } else {
    showUserToast(`Membuka ${featureName}... Modul siap digunakan.`);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initUserDashboard();
});

window.addEventListener('storage', () => {
  initUserDashboard();
});

window.addEventListener('focus', () => {
  initUserDashboard();
});

try {
  const channel = new BroadcastChannel('edu_workspace_sync');
  channel.onmessage = (event) => {
    if (event.data) {
      const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
      if (loggedUserStr) {
        const user = JSON.parse(loggedUserStr);
        if ((user.email || '').toLowerCase() === (event.data.email || '').toLowerCase()) {
          if (event.data.type === 'USER_DELETED') {
            user.status = 'Dihapus';
            user.isDeleted = true;
            user.isApproved = false;
          } else if (event.data.type === 'STATUS_UPDATED' || event.data.status) {
            user.status = event.data.status;
            if (event.data.status === 'Aktif') {
              user.isApproved = true;
              user.isProfileCompleted = true;
              delete user.rejectReason;
              if (event.data.features && event.data.features.length > 0) {
                user.features = event.data.features;
              } else if (!user.features || user.features.length === 0) {
                user.features = ['generate_modul_ajar'];
              }
            } else if (event.data.status === 'Nonaktif' || event.data.status === 'Dinonaktifkan' || event.data.status === 'Ditolak') {
              user.isApproved = false;
              user.features = [];
            }
          } else if (event.data.type === 'FEATURES_UPDATED') {
            user.features = event.data.features || [];
            if (user.features.length > 0 && user.status !== 'Dihapus') {
              user.status = 'Aktif';
              user.isApproved = true;
              delete user.rejectReason;
            }
          }
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

          const isDeleted = user.status === 'Dihapus' || user.isDeleted === true;
          const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
          const isDeactivated = (user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || isExpired) && !isDeleted;

          if (isDeleted || isDeactivated) {
            window.location.replace("profil.html");
            return;
          }
        }
      }
    }
    initUserDashboard();
  };
} catch (e) { }
