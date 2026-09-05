/**
 * Edu Workspace - Generate Media Pembelajaran Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Silakan Login Terlebih Dahulu",
        message: "Sesi Anda belum terautentikasi. Silakan masuk untuk mengakses fitur Generate Media Pembelajaran.",
        iconType: "lock",
        buttonText: "Ke Halaman Login",
        redirectUrl: "../../halaman-login/halaman-login.html"
      });
    } else {
      window.location.href = "../../halaman-login/halaman-login.html";
    }
    return;
  }

  let user = null;
  try {
    user = JSON.parse(loggedUserStr);
  } catch (e) {
    user = null;
  }

  const isAdm = typeof isCurrentUserAdmin === 'function'
    ? isCurrentUserAdmin(user)
    : (user && (user.role === 'Admin' || (user.email || '').toLowerCase() === (typeof ADMIN_EMAIL !== 'undefined' ? ADMIN_EMAIL.toLowerCase() : '')));

  // Periksa hak akses fitur untuk pengguna biasa
  if (!isAdm && user) {
    const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
    const isDeactivated = user.status === 'Nonaktif' || user.status === 'Dinonaktifkan' || user.status === 'Ditolak' || user.isApproved === false || isExpired;
    const activeFeatures = Array.isArray(user.features) ? user.features : [];

    if (isDeactivated || !activeFeatures.includes('generate_media_pembelajaran')) {
      if (typeof showEduAlert === 'function') {
        showEduAlert({
          title: "Akses Fitur Terkunci",
          message: "Akses ke fitur Generate Media Pembelajaran belum diaktifkan untuk akun Anda. Silakan hubungi Administrator Edu Workspace.",
          iconType: "warning",
          buttonText: "Ke Dashboard Pengguna",
          redirectUrl: "../../dashboard-pengguna/dashboard-pengguna.html"
        });
      } else {
        window.location.href = "../../dashboard-pengguna/dashboard-pengguna.html";
      }
      return;
    }
  }

  // Render Header Global Terpusat (Hanya tombol kembali sesuai permintaan pengguna)
  if (typeof renderEduNavbar === 'function') {
    renderEduNavbar({
      showBack: true,
      backUrl: '../../dashboard-pengguna/dashboard-pengguna.html',
      showApiKey: false
    });
  }
});
