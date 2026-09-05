/**
 * Edu Workspace - Minimalist Editorial Landing Page Logic
 * Features:
 * 1. Mobile Hamburger Toggle Menu
 * 2. Nav Active State Switcher
 * 3. Smart Dashboard Routing
 */

document.addEventListener('DOMContentLoaded', () => {
  // Render navbar landing page dari sistem global
  if (typeof renderEduNavbar === 'function') {
    renderEduNavbar({ type: 'landing' });
  }
  initHamburgerMenu();
  initNavActiveState();
  initScrollSpy();
  initSmartDashboardRedirect();
  loadLandingPageStats();
});

/**
 * Smart Dashboard Routing jika sudah login
 */
function initSmartDashboardRedirect() {
  const ctaButtons = document.querySelectorAll('.btn-see-more, .btn-cta-primary');
  if (!ctaButtons || ctaButtons.length === 0) return;

  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (loggedUserStr) {
    try {
      const user = JSON.parse(loggedUserStr);
      if (user && user.email) {
        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
        let targetHref = 'dashboard-pengguna/dashboard-pengguna.html';
        if (isAdmin) {
          targetHref = 'dashboard-admin/dashboard-admin.html';
        } else {
          if (user.isProfileCompleted === true && user.institution && user.institution !== 'Sekolah / Instansi Guru') {
            targetHref = 'dashboard-pengguna/dashboard-pengguna.html';
          } else {
            targetHref = 'dashboard-pengguna/profil.html';
          }
        }
        ctaButtons.forEach(btn => {
          btn.href = targetHref;
        });
      }
    } catch (e) { }
  }
}


/**
 * Mobile Hamburger Menu Toggle
 */
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');

  if (!hamburgerBtn || !navMenu) return;

  hamburgerBtn.addEventListener('click', () => {
    const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
    hamburgerBtn.classList.toggle('active');
    navMenu.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
  });

  // Close mobile menu when a nav link is clicked
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
      hamburgerBtn.classList.remove('active');
      navMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Update Active State on Nav Click
 */
function initNavActiveState() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/**
 * ScrollSpy: Otomatis Menyorot Tombol Navbar Sesuai Posisi Scroll
 */
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [
    { id: 'hero', navHref: '#hero' },
    { id: 'kepercayaan', navHref: '#hero' },
    { id: 'mitra', navHref: '#hero' },
    { id: 'benefit', navHref: '#benefit' },
    { id: 'fitur', navHref: '#fitur' },
  ];

  let currentActive = '#hero';

  const updateActiveNav = (targetHref) => {
    if (currentActive === targetHref) return;
    currentActive = targetHref;
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === targetHref) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const matchingSection = sections.find(s => s.id === entry.target.id);
        if (matchingSection) {
          updateActiveNav(matchingSection.navHref);
        }
      }
    });
  }, observerOptions);

  sections.forEach(sec => {
    const el = document.getElementById(sec.id);
    if (el) observer.observe(el);
  });
}

/**
 * Muat data statistik landing page secara dinamis dari database & cache sistem:
 * 1. Pengguna Aktif: Semua pengguna (aktif maupun nonaktif), tidak termasuk pengguna yang berstatus dihapus.
 * 2. Total Modul Dibuat: Akumulasi modul yang telah dibuat oleh seluruh akun guru.
 */
async function loadLandingPageStats() {
  const statUserEl = document.getElementById('statPenggunaAktif');
  const statModulEl = document.getElementById('statTotalModul');
  if (!statUserEl && !statModulEl) return;

  // =========================================================================
  // 1. DATA PENGGUNA (Aktif maupun Nonaktif, Tidak Termasuk Pengguna Dihapus)
  // =========================================================================
  let totalUsers = 0;
  try {
    const userMap = new Map();

    // A. Ambil data pengguna dari database Supabase
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUsers) {
      try {
        const supabaseUsers = await SupabaseDB.getUsers();
        if (Array.isArray(supabaseUsers)) {
          supabaseUsers.forEach(u => {
            if (u && u.email) userMap.set(u.email.trim().toLowerCase(), u);
          });
        }
      } catch (eSupa) {
        console.warn('[Stats] Gagal mengambil pengguna dari Supabase:', eSupa);
      }
    }

    // B. Ambil data pengguna dari localStorage (STORAGE_KEY)
    try {
      const storageKey = typeof STORAGE_KEY !== 'undefined' ? STORAGE_KEY : 'edu_users_data';
      const rawLocal = localStorage.getItem(storageKey);
      if (rawLocal) {
        const localUsers = JSON.parse(rawLocal);
        if (Array.isArray(localUsers)) {
          localUsers.forEach(u => {
            if (u && u.email && !userMap.has(u.email.trim().toLowerCase())) {
              userMap.set(u.email.trim().toLowerCase(), u);
            }
          });
        }
      }
    } catch (eLocal) {}

    // C. Fallback ke users_database.json jika offline atau cache kosong
    if (userMap.size === 0) {
      try {
        const res = await fetch('users_database.json');
        if (res.ok) {
          const dbUsers = await res.json();
          if (Array.isArray(dbUsers)) {
            dbUsers.forEach(u => {
              if (u && u.email) userMap.set(u.email.trim().toLowerCase(), u);
            });
          }
        }
      } catch (eFetch) {}
    }

    // Filter: Hitung semua akun kecuali yang berstatus "Dihapus" / is_deleted = true
    userMap.forEach(u => {
      const isDel = u.is_deleted === true || u.isDeleted === true || (u.status || '').trim().toLowerCase() === 'dihapus';
      if (!isDel) {
        totalUsers++;
      }
    });
  } catch (err) {
    console.warn('[Stats] Error menghitung pengguna:', err);
  }

  // =========================================================================
  // 2. TOTAL MODUL DIBUAT (Akumulasi Modul dari Setiap Akun yang Telah Membuat)
  // =========================================================================
  let totalModuls = 0;
  try {
    const modulIdSet = new Set();

    // A. Ambil modul resmi dari database Supabase
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getModuls) {
      try {
        const supabaseModuls = await SupabaseDB.getModuls();
        if (Array.isArray(supabaseModuls)) {
          supabaseModuls.forEach(m => {
            if (m && m.id && !m.is_deleted) {
              modulIdSet.add(m.id);
            }
          });
        }
      } catch (eSupaModul) {
        console.warn('[Stats] Gagal mengambil modul dari Supabase:', eSupaModul);
      }
    }

    // B. Ambil modul dari seluruh akun yang tersimpan di localStorage (edu_modul_list_*)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('edu_modul_list_')) {
          try {
            const list = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(list)) {
              list.forEach(item => {
                if (item && item.id) {
                  modulIdSet.add(item.id);
                }
              });
            }
          } catch (eParsed) {}
        }
      }
    } catch (eStor) {}

    // C. Cek modul aktif sesi saat ini
    try {
      const curModul = localStorage.getItem('edu_current_generated_modul') || localStorage.getItem('edu_last_modul_payload');
      if (curModul) {
        const mObj = JSON.parse(curModul);
        if (mObj && mObj.id) modulIdSet.add(mObj.id);
      }
    } catch (eCur) {}

    totalModuls = modulIdSet.size;
  } catch (err) {
    console.warn('[Stats] Error menghitung total modul:', err);
  }

  // Animasikan angka statistik di landing page
  if (statUserEl) {
    animateStatNumber(statUserEl, totalUsers);
  }
  if (statModulEl) {
    animateStatNumber(statModulEl, totalModuls);
  }
}

/**
 * Animasi penghitung angka halus (count-up) pada statistik landing page
 */
function animateStatNumber(element, targetNum) {
  if (!element) return;
  if (targetNum <= 0) {
    element.textContent = '0';
    return;
  }

  const duration = 800; // milidetik
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing out quad agar terasa natural dan mulus
    const easeProgress = 1 - (1 - progress) * (1 - progress);
    const currentVal = Math.floor(easeProgress * targetNum);
    element.textContent = currentVal.toLocaleString('id-ID') + '+';

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = targetNum.toLocaleString('id-ID') + '+';
    }
  }

  requestAnimationFrame(updateCount);
}



