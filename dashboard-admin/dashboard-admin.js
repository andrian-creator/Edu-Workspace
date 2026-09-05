/**
 * Edu Workspace - Dashboard Admin (Portal Utama) Logic
 * Manajemen Navigasi Sesi Super Admin
 */
function initAdminDashboard() {
  if (typeof enforceAdminGuard === 'function') {
    const passed = enforceAdminGuard();
    if (!passed) return false;
  } else {
    const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!loggedUserStr) {
      if (typeof hideAdminPageContent === 'function') hideAdminPageContent();
      showEduAlert({
        title: "Silakan Login Terlebih Dahulu",
        message: "Sesi Anda belum terautentikasi. Silakan masuk dengan akun Google terdaftar untuk mengakses Dashboard Admin.",
        iconType: "lock",
        buttonText: "Ke Halaman Login",
        redirectUrl: "../halaman-login/halaman-login.html"
      });
      return false;
    }

    let user = null;
    try { user = JSON.parse(loggedUserStr); } catch (e) {}
    const isAdm = typeof isCurrentUserAdmin === 'function'
      ? isCurrentUserAdmin(user)
      : (user && (user.role === 'Admin' || (user.email || '').toLowerCase() === (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL.toLowerCase() : '')));
    if (!isAdm) {
      if (typeof hideAdminPageContent === 'function') hideAdminPageContent();
      showEduAlert({
        title: "Akses Terbatas",
        message: "Halaman ini hanya dapat diakses oleh Administrator Edu Workspace.",
        iconType: "warning",
        buttonText: "Ke Dashboard Pengguna",
        redirectUrl: "../dashboard-pengguna/dashboard-pengguna.html"
      });
      return false;
    }
  }

  // Render navbar global admin terpusat jika terbukti admin
  renderEduNavbar();
  return true;
}

// Jalankan autentikasi admin segera
initAdminDashboard();

function showComingSoonToast(menuName) {
  const toast = document.getElementById('adminToast');
  const toastText = document.getElementById('adminToastText');
  if (toast && toastText) {
    toastText.textContent = `Fitur "${menuName}" sedang dalam tahap pengembangan (Segera Hadir).`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  } else {
    alert(`Fitur "${menuName}" sedang dalam tahap pengembangan (Segera Hadir).`);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('profileDropdownWrapper');
  const dropdown = document.getElementById('profileDropdown');
  if (wrapper && !wrapper.contains(e.target)) {
    if (dropdown) dropdown.classList.remove('active');
    wrapper.classList.remove('open');
  }
});
