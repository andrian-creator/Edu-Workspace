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
        let targetHref = 'dashboard pengguna/dashboard pengguna.html';
        if (isAdmin) {
          targetHref = 'dashboard admin/dashboard admin.html';
        } else {
          if (user.isProfileCompleted === true && user.institution && user.institution !== 'Sekolah / Instansi Guru') {
            targetHref = 'dashboard pengguna/dashboard pengguna.html';
          } else {
            targetHref = 'dashboard pengguna/profil.html';
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


