/**
 * Edu Workspace - Dashboard Admin (Portal Utama) Logic
 * Manajemen Navigasi Sesi Super Admin
 */
function initAdminDashboard() {
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
}

// Render navbar global admin terpusat
renderEduNavbar();

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
