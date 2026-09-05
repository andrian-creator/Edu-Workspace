/**
 * Edu Workspace - Dashboard Admin (Pengelola Fitur) Logic
 * Manajemen Hak Akses Modul & Fitur Akun Pengguna
 */

const ALL_SYSTEM_FEATURES = [
  {
    id: 'generate_modul_ajar',
    name: 'Generate Modul Ajar',
    desc: 'Generator RPP & Perangkat Pembelajaran Berbasis AI Otomatis',
    get iconImg() {
      return getEduIconUrl('modul_ajar') || '../Assets/icon/icon_modul_ajar.png';
    }
  }
];

let currentEditingUserEmail = null;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById('adminToast');
  const toastText = document.getElementById('adminToastText');
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

function updateStatsCards(users) {
  const totalUsers = users.length;
  let fullAccessCount = 0;
  let dosenCount = 0;
  let guruCount = 0;

  users.forEach(u => {
    const isAdm = u.role === 'Admin' || (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const isDosen = (u.role === 'Dosen') || (u.gradeLevel && (u.gradeLevel.includes('Perguruan Tinggi') || u.gradeLevel.includes('Universitas')));
    const isGuru = (u.role === 'Guru') || (!isAdm && !isDosen);

    if (isDosen && !isAdm) dosenCount++;
    if (isGuru && !isAdm) guruCount++;

    const isDeactivated = !isAdm && (u.status === 'Nonaktif' || u.status === 'Dinonaktifkan' || u.status === 'Ditolak');
    const userFeatures = isAdm ? ALL_SYSTEM_FEATURES.map(f => f.id) : (isDeactivated ? [] : (Array.isArray(u.features) ? u.features : []));
    if (userFeatures.length === ALL_SYSTEM_FEATURES.length) {
      fullAccessCount++;
    }
  });

  if (document.getElementById('statTotalUsers')) {
    document.getElementById('statTotalUsers').textContent = totalUsers;
  }
  if (document.getElementById('statFullAccess')) {
    document.getElementById('statFullAccess').textContent = fullAccessCount;
  }
  if (document.getElementById('statDosenCount')) {
    document.getElementById('statDosenCount').textContent = dosenCount;
  }
  if (document.getElementById('statGuruCount')) {
    document.getElementById('statGuruCount').textContent = guruCount;
  }
}

function renderFeatureTable() {
  const users = getUsers();
  updateStatsCards(users);

  const searchInput = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const tableBody = document.getElementById('featureTableBody');
  const tableInfo = document.getElementById('tableInfo');

  if (!tableBody) return;

  const filteredUsers = users.filter(u => {
    const nameMatch = (u.name || '').toLowerCase().includes(searchInput);
    const emailMatch = (u.email || '').toLowerCase().includes(searchInput);
    const roleMatch = (u.role || '').toLowerCase().includes(searchInput);
    return nameMatch || emailMatch || roleMatch;
  });

  if (tableInfo) {
    tableInfo.textContent = `Menampilkan ${filteredUsers.length} dari ${users.length} pengguna`;
  }

  if (filteredUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px; color: var(--color-text-muted);">
          Tidak ada pengguna yang cocok dengan pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredUsers.map((u, index) => {
    const isAdm = u.role === 'Admin' || (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const avatarUrl = getGoogleAvatar(u.name, u.avatar);
    
    // Role styling
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

    // User features: Admin default penuh, pengguna umum default kosong (harus diaktifkan manual)
    const isDeactivated = !isAdm && (u.status === 'Nonaktif' || u.status === 'Dinonaktifkan' || u.status === 'Ditolak');
    const activeFeatureIds = isAdm ? ALL_SYSTEM_FEATURES.map(f => f.id) : (isDeactivated ? [] : (Array.isArray(u.features) ? u.features : []));

    let featureChipsHtml = '';
    if (activeFeatureIds.length === 0) {
      featureChipsHtml = `
        <span class="feature-chip" style="color: #dc2626; background: #fee2e2; border-color: #fecaca;">
          Tidak Ada Fitur Aktif
        </span>
      `;
    } else {
      featureChipsHtml = activeFeatureIds.map(fId => {
        const featObj = ALL_SYSTEM_FEATURES.find(f => f.id === fId);
        return featObj ? `
          <span class="feature-chip chip-active" style="display: inline-flex; align-items: center; gap: 8px;">
            <img src="${featObj.iconImg}" alt="${featObj.name}" style="width: 15px; height: 15px; object-fit: contain;">
            <span>${featObj.name}</span>
          </span>
        ` : '';
      }).join('');
    }

    const safeEmail = escapeHtml(u.email || '');
    const editIconUrl = getEduIconUrl('edit') || '../Assets/icon/icon_edit.png';
    const actionBtnHtml = isAdm 
      ? `<span style="font-size: 0.8rem; font-weight: 700; color: #854d0e; background: #fef08a; padding: 5px 14px; border-radius: 999px; white-space: nowrap; display: inline-block;">Akses Penuh</span>`
      : `<button type="button" class="btn-edit-features" onclick="openManageFeaturesModal('${safeEmail}')">
          <img data-icon="edit" src="${editIconUrl}" alt="Kelola" style="width: 14px; height: 14px; object-fit: contain;">
          <span>Kelola</span>
        </button>`;

    return `
      <tr>
        <td style="text-align: center; font-weight: 600; color: var(--color-text-muted);">${index + 1}</td>
        <td>
          <div class="user-info">
            <img src="${avatarUrl}" referrerpolicy="no-referrer" alt="Avatar" class="user-avatar-tiny" onerror="this.onerror=null; this.src=getGoogleAvatar('${escapeHtml(u.name || 'Pengguna')}', null);">
            <div>
              <div class="user-name">${escapeHtml(u.name || 'Pengguna')}</div>
              <div class="user-email">${escapeHtml(u.email || '-')}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center;">
          ${roleBadgeHtml}
        </td>
        <td>
          <div class="features-cell">
            ${featureChipsHtml}
          </div>
        </td>
        <td style="text-align: center;">
          ${actionBtnHtml}
        </td>
      </tr>
    `;
  }).join('');
}

function openManageFeaturesModal(email) {
  const users = getUsers();
  const user = users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!user) return;

  currentEditingUserEmail = email;
  document.getElementById('modalUserDesc').textContent = `Atur modul fitur aktif untuk ${user.name} (${user.email}).`;

  const isAdm = user.role === 'Admin' || (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const activeFeatureIds = isAdm ? ALL_SYSTEM_FEATURES.map(f => f.id) : (Array.isArray(user.features) ? user.features : []);
  const toggleList = document.getElementById('featureToggleList');

  toggleList.innerHTML = ALL_SYSTEM_FEATURES.map(feat => {
    const isChecked = activeFeatureIds.includes(feat.id) ? 'checked' : '';
    return `
      <div class="feature-toggle-item" style="padding: 16px 20px; border-radius: 16px; background: #ffffff; border: 1.5px solid #e2e8f0;">
        <div class="feature-item-info" style="gap: 16px;">
          <div class="feature-item-icon">
            <img src="${feat.iconImg}" alt="${feat.name}" style="width: 38px; height: 38px; object-fit: contain;">
          </div>
          <div>
            <div class="feature-item-name" style="font-size: 1.05rem; font-weight: 800; color: var(--color-text-main);">${feat.name}</div>
            <div class="feature-item-desc" style="font-size: 0.86rem; color: var(--color-text-muted); margin-top: 3px;">${feat.desc}</div>
          </div>
        </div>
        <label class="switch">
          <input type="checkbox" id="feat_toggle_${feat.id}" value="${feat.id}" ${isChecked}>
          <span class="slider"></span>
        </label>
      </div>
    `;
  }).join('');

  document.getElementById('manageFeaturesModal').classList.add('active');
}

function closeManageFeaturesModal() {
  currentEditingUserEmail = null;
  document.getElementById('manageFeaturesModal').classList.remove('active');
}

function saveUserFeatures() {
  if (!currentEditingUserEmail) return;

  const users = getUsers();
  const userIndex = users.findIndex(u => (u.email || '').toLowerCase() === currentEditingUserEmail.toLowerCase());
  if (userIndex === -1) return;

  const selectedFeatures = [];
  ALL_SYSTEM_FEATURES.forEach(feat => {
    const checkbox = document.getElementById(`feat_toggle_${feat.id}`);
    if (checkbox && checkbox.checked) {
      selectedFeatures.push(feat.id);
    }
  });

  users[userIndex].features = selectedFeatures;

  // Jika admin mengaktifkan minimal 1 fitur dan akun sebelumnya non-aktif, otomatis jadikan Aktif
  const shouldReactivate = selectedFeatures.length > 0 && (
    users[userIndex].status === 'Nonaktif' || 
    users[userIndex].status === 'Dinonaktifkan' || 
    users[userIndex].status === 'Ditolak' || 
    !users[userIndex].isApproved
  );

  if (shouldReactivate) {
    users[userIndex].status = 'Aktif';
    users[userIndex].isApproved = true;
    users[userIndex].isProfileCompleted = true;
    delete users[userIndex].rejectReason;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

  // Update current user session jika akun yang sedang login sama
  const currentUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (currentUserStr) {
    try {
      const curUser = JSON.parse(currentUserStr);
      if ((curUser.email || '').toLowerCase() === currentEditingUserEmail.toLowerCase()) {
        curUser.features = selectedFeatures;
        if (shouldReactivate) {
          curUser.status = 'Aktif';
          curUser.isApproved = true;
          delete curUser.rejectReason;
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(curUser));
      }
    } catch (e) { }
  }

  // Sync ke Supabase
  const supabasePayload = { features: selectedFeatures };
  if (shouldReactivate) {
    supabasePayload.status = 'Aktif';
    supabasePayload.isApproved = true;
    supabasePayload.rejectReason = '';
  }

  SupabaseDB.updateUserByEmail(currentEditingUserEmail, supabasePayload)
    .catch(() => {
      // Fallback ke backend lokal
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEditingUserEmail, ...supabasePayload })
      }).catch(err => console.error("Error saving features to backend:", err));
    });

  // Broadcast sync realtime ke seluruh tab yang terbuka
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.postMessage({
      type: 'FEATURES_UPDATED',
      email: currentEditingUserEmail,
      features: selectedFeatures
    });
    if (shouldReactivate) {
      channel.postMessage({
        type: 'STATUS_UPDATED',
        email: currentEditingUserEmail,
        status: 'Aktif',
        features: selectedFeatures
      });
    }
  } catch (e) { }

  closeManageFeaturesModal();
  renderFeatureTable();
  showToast(`Hak akses fitur untuk ${users[userIndex].name} berhasil diperbarui.`);
}

function initAdminFeaturesDashboard() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "../halaman-login/halaman-login.html";
    return;
  }

  let user = JSON.parse(loggedUserStr);
  const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
  if (!isAdmin) {
    alert("Akses Terbatas: Halaman ini hanya untuk Administrator.");
    window.location.href = "../dashboard-pengguna/dashboard-pengguna.html";
    return;
  }

  // Render Global Navbar Terpusat
  renderEduNavbar();

  // 1. Tampilkan data lokal segera agar tabel tidak kosong saat loading
  renderFeatureTable();

  // 2. Sinkronkan data terbaru dari Supabase di background, lalu re-render tabel
  syncUsersFromSupabase().then(() => {
    renderFeatureTable();
  }).catch(() => {
    renderFeatureTable();
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initAdminFeaturesDashboard();
});

document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('profileDropdownWrapper');
  const dropdown = document.getElementById('profileDropdown');
  if (wrapper && !wrapper.contains(e.target)) {
    if (dropdown) dropdown.classList.remove('active');
    wrapper.classList.remove('open');
  }
});

// Sinkronisasi Realtime Perubahan Data / Status Pengguna dari Dashboard Admin Lainnya
try {
  const syncChannel = new BroadcastChannel('edu_workspace_sync');
  syncChannel.onmessage = (event) => {
    if (event.data && (event.data.type === 'STATUS_UPDATED' || event.data.type === 'FEATURES_UPDATED' || event.data.type === 'USER_DELETED' || event.data.type === 'SYNC_USER')) {
      renderFeatureTable();
    }
  };
} catch (e) {}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY || e.key === 'edu_sync_timestamp' || e.key === 'edu_registered_users') {
    renderFeatureTable();
  }
});
