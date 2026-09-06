/**
 * EDU WORKSPACE - GLOBAL LOGIC & SHARED UTILITIES
 * Konstanta Sesi, Autentikasi Admin, Parser JWT, dan Helper Avatar Google
 */

// ==========================================================================
// SUPABASE INTEGRATION LAYER
// Koneksi langsung ke Supabase REST API tanpa library tambahan
// ==========================================================================
const SUPABASE_URL = 'https://qrpcboreiulyqujublwl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycGNib3JlaXVseXF1anVibHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTkxMzgsImV4cCI6MjEwNDA5NTEzOH0.kTRBa2LmYN4qzIuewGqz5CwFKWTZjYM4NOgAvMf-G10';

/**
 * Helper untuk request ke Supabase REST API
 * @param {string} path - endpoint path, misal '/profiles'
 * @param {Object} options - fetch options (method, body, headers tambahan)
 * @returns {Promise<any>} - data JSON atau null jika error
 */
async function supabaseRequest(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[Supabase]', res.status, path, err.message || err);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (e) {
    console.warn('[Supabase] network error:', path, e);
    return null;
  }
}

/**
 * Mapping kolom DB (snake_case) ke format user lokal (camelCase) yang dipakai seluruh frontend
 */
function mapDbToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar || '',
    role: row.role || 'Guru',
    institution: row.institution || '',
    subject: row.subject || '',
    gradeLevel: row.grade_level || '',
    registeredAt: row.registered_at || '',
    provider: row.provider || 'Google Account (@gmail.com)',
    status: row.status || 'Belum Lengkap',
    isApproved: row.is_approved || false,
    isProfileCompleted: row.is_profile_completed || false,
    features: row.features || [],
    subscriptionStart: row.subscription_start || null,
    subscriptionEnd: row.subscription_end || null,
    rejectReason: row.reject_reason || '',
    geminiApiKey: row.gemini_api_key || '',
    isDeleted: row.is_deleted || false,
    adminNote: row.admin_note || row.adminNote || ''
  };
}

/**
 * Mapping user lokal (camelCase) ke format kolom DB (snake_case)
 */
function mapUserToDb(user) {
  if (!user) return null;
  const db = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role || 'Guru',
    institution: user.institution || '',
    subject: user.subject || '',
    grade_level: user.gradeLevel || '',
    registered_at: user.registeredAt || null,
    provider: user.provider || 'Google Account (@gmail.com)',
    status: user.status || 'Belum Lengkap',
    is_approved: user.isApproved || false,
    is_profile_completed: user.isProfileCompleted || false,
    features: user.features || [],
    subscription_start: user.subscriptionStart || null,
    subscription_end: user.subscriptionEnd || null,
    reject_reason: user.rejectReason || null,
    gemini_api_key: user.geminiApiKey || '',
    is_deleted: user.isDeleted || false,
    admin_note: user.adminNote || null
  };
  // Hapus key null/undefined agar tidak overwrite yang sudah ada di DB,
  // KECUALI subscription_start & subscription_end jika sengaja di-reset menjadi null
  Object.keys(db).forEach(k => {
    if ((k === 'subscription_start' || k === 'subscription_end') && (user.subscriptionStart === null || user.subscriptionEnd === null)) {
      return; // Pertahankan null agar kolom di Supabase benar-benar ter-reset
    }
    if (db[k] === null || db[k] === undefined) delete db[k];
  });
  return db;
}

/**
 * SupabaseDB: Objek terpusat untuk semua operasi database Supabase
 */
const SupabaseDB = {

  /**
   * Ambil semua users dari tabel profiles (non-deleted)
   */
  async getUsers() {
    const rows = await supabaseRequest('/profiles?select=*&is_deleted=eq.false&order=registered_at.asc');
    if (!rows) return null;
    return rows.map(mapDbToUser);
  },

  /**
   * Ambil user berdasarkan email
   */
  async getUserByEmail(email) {
    const rows = await supabaseRequest(`/profiles?select=*&email=ilike.${encodeURIComponent(email)}&limit=1`);
    if (!rows || rows.length === 0) return null;
    return mapDbToUser(rows[0]);
  },

  /**
   * Upsert user (update via PATCH jika email sudah ada, insert via POST jika baru)
   */
  async upsertUser(user) {
    const dbRow = mapUserToDb(user);
    if (!dbRow || !dbRow.email) return null;

    if (!dbRow.id) {
      dbRow.id = 'USR-' + String(Date.now()).slice(-6);
    }

    // 1. Coba PATCH terlebih dahulu berdasarkan email
    // Menjamin update profil berhasil tanpa memicu pelanggaran unique constraint 'profiles_email_key'
    try {
      const patchData = { ...dbRow };
      delete patchData.id; // Jangan overwrite primary key id saat PATCH!

      const patchResult = await supabaseRequest(
        `/profiles?email=ilike.${encodeURIComponent(user.email)}`,
        { method: 'PATCH', body: patchData }
      );
      if (patchResult && patchResult.length > 0) {
        return mapDbToUser(patchResult[0]);
      }
    } catch (e) {}

    // 2. Jika data belum ada di Supabase, lakukan INSERT baru
    const insertResult = await supabaseRequest('/profiles', {
      method: 'POST',
      prefer: 'return=representation',
      body: dbRow
    });
    if (!insertResult || insertResult.length === 0) return null;
    return mapDbToUser(insertResult[0]);
  },

  /**
   * Update field tertentu pada user berdasarkan email
   */
  async updateUserByEmail(email, fields) {
    const dbFields = {};
    if (fields.status !== undefined) dbFields.status = fields.status;
    if (fields.isApproved !== undefined) dbFields.is_approved = fields.isApproved;
    if (fields.isProfileCompleted !== undefined) dbFields.is_profile_completed = fields.isProfileCompleted;
    if (fields.role !== undefined) dbFields.role = fields.role;
    if (fields.institution !== undefined) dbFields.institution = fields.institution;
    if (fields.subject !== undefined) dbFields.subject = fields.subject;
    if (fields.gradeLevel !== undefined) dbFields.grade_level = fields.gradeLevel;
    if (fields.features !== undefined) dbFields.features = fields.features;
    if (fields.subscriptionStart !== undefined) dbFields.subscription_start = fields.subscriptionStart;
    if (fields.subscriptionEnd !== undefined) dbFields.subscription_end = fields.subscriptionEnd;
    if (fields.rejectReason !== undefined) dbFields.reject_reason = fields.rejectReason;
    if (fields.geminiApiKey !== undefined) dbFields.gemini_api_key = fields.geminiApiKey;
    if (fields.isDeleted !== undefined) dbFields.is_deleted = fields.isDeleted;
    if (fields.avatar !== undefined) dbFields.avatar = fields.avatar;
    if (fields.name !== undefined) dbFields.name = fields.name;

    const result = await supabaseRequest(
      `/profiles?email=ilike.${encodeURIComponent(email)}`,
      { method: 'PATCH', body: dbFields }
    );
    return result;
  },

  /**
   * Soft-delete user berdasarkan email (otomatis reset masa langganan dan status)
   */
  async deleteUserByEmail(email) {
    return await SupabaseDB.updateUserByEmail(email, {
      isDeleted: true,
      status: 'Dihapus',
      isApproved: false,
      isProfileCompleted: false,
      features: [],
      subscriptionStart: null,
      subscriptionEnd: null
    });
  },

  /**
   * Ambil semua modul dari tabel moduls
   */
  async getModuls(email = null) {
    let path = '/moduls?select=*&is_deleted=eq.false&order=created_at.desc';
    if (email) path += `&email=ilike.${encodeURIComponent(email.trim())}`;
    const rows = await supabaseRequest(path);
    return rows || [];
  },

  /**
   * Simpan modul baru ke Supabase (didukung user_id valid & merge-duplicates)
   */
  async saveModul(modul) {
    const dbRow = {
      id: modul.id,
      user_id: modul.userId || modul.user_id || 'b452d28a-4888-40a7-8a1e-930430df9f59',
      email: (modul.email || '').trim().toLowerCase(),
      user_name: modul.userName || modul.user_name || '',
      subject: modul.subject || '',
      grade_level: modul.gradeLevel || modul.grade_level || '',
      topic: modul.topic || '',
      curriculum: modul.curriculum || 'Kurikulum Merdeka',
      content_json: modul.contentJson || modul.content_json || null,
      is_deleted: false
    };
    const result = await supabaseRequest('/moduls', {
      method: 'POST',
      prefer: 'return=representation,resolution=merge-duplicates',
      headers: { 'Prefer': 'return=representation,resolution=merge-duplicates' },
      body: dbRow
    });
    return result;
  },

  /**
   * Soft-delete modul berdasarkan id
   */
  async deleteModul(id) {
    return await supabaseRequest(`/moduls?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { is_deleted: true }
    });
  }
};

// ==========================================================================
// SUPABASE SYNC HELPERS
// Sinkronisasi otomatis antara Supabase dan localStorage (fallback lokal)
// ==========================================================================

/**
 * Sync semua users dari Supabase ke localStorage (STORAGE_KEY)
 * Dipanggil saat load halaman atau setelah operasi admin
 */
async function syncUsersFromSupabase() {
  try {
    const users = await SupabaseDB.getUsers();
    if (users && Array.isArray(users)) {
      // Pastikan akun super admin selalu ada di daftar pengguna
      const hasAdmin = users.some(u => (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (!hasAdmin) {
        let localUsers = [];
        try { localUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) {}
        const localAdmin = localUsers.find(u => (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()) || {
          id: 'ADM-001',
          name: 'Rico Andrianto',
          email: ADMIN_EMAIL,
          avatar: localStorage.getItem('edu_admin_avatar') || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          role: 'Admin',
          institution: 'Edu Workspace',
          subject: 'Super Admin',
          registeredAt: '02 Sep 2026, 08:01',
          provider: 'Google Account (@gmail.com)',
          status: 'Aktif',
          isApproved: true,
          isProfileCompleted: true,
          features: ['generate_modul_ajar']
        };
        users.unshift(localAdmin);
      }
      // Pertahankan adminNote lokal jika profiles Supabase belum memiliki kolomnya
      let localNotes = {};
      try { localNotes = JSON.parse(localStorage.getItem('edu_admin_notes') || '{}'); } catch (e) {}
      let localUsers = [];
      try { localUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) {}
      users.forEach(u => {
        const uEmail = (u.email || '').toLowerCase();
        if (!u.adminNote) {
          if (localNotes[uEmail]) {
            u.adminNote = localNotes[uEmail];
          } else {
            const lu = localUsers.find(x => (x.email || '').toLowerCase() === uEmail);
            if (lu && lu.adminNote) {
              u.adminNote = lu.adminNote;
            }
          }
        }
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      } catch (e) {}
      return users;
    }
  } catch (e) {
    console.warn('[Sync] Supabase getUsers error:', e);
  }
  return null;
}

/**
 * Upsert user login ke Supabase + localStorage sekaligus
 * Dipanggil dari proses login Google (halaman-login.js)
 */
async function supabaseUpsertLoginUser(userObj) {
  const saved = await SupabaseDB.upsertUser(userObj);
  if (saved) {
    // Update CURRENT_USER_KEY dengan data terbaru dari Supabase
    try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(saved)); } catch (e) {}
    // Sinkron ke STORAGE_KEY juga
    const all = await SupabaseDB.getUsers();
    if (all) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) {}
    }
    return saved;
  }
  // Fallback: simpan ke localStorage saja jika Supabase gagal
  try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj)); } catch (e) {}
  return userObj;
}

// Expose ke window
if (typeof window !== 'undefined') {
  window.SupabaseDB = SupabaseDB;
  window.supabaseUpsertLoginUser = supabaseUpsertLoginUser;
  window.syncUsersFromSupabase = syncUsersFromSupabase;
  window.mapDbToUser = mapDbToUser;
  window.mapUserToDb = mapUserToDb;
}

const STORAGE_KEY = 'edu_registered_users';
const CURRENT_USER_KEY = 'edu_current_user';
const ADMIN_EMAIL = 'ric04ndri4nt0@gmail.com';
const ADMIN_EMAILS = [
  'ric04ndri4nt0@gmail.com'
];

/**
 * Generate Avatar Resmi Google Berwarna berdasarkan Inisial Nama Pengguna
 */
function getGoogleAvatar(name, avatarUrl) {
  if (avatarUrl && !avatarUrl.includes('default-user') && !avatarUrl.includes('placeholder') && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:image'))) {
    return avatarUrl;
  }
  const cleanName = (name || 'User').trim();
  const initial = cleanName.charAt(0).toUpperCase() || 'U';

  const googlePalette = [
    '#1a73e8', // Biru Google
    '#ea4335', // Merah Google
    '#f9ab00', // Kuning/Amber Google
    '#34a853', // Hijau Google
    '#9334e6', // Ungu Google
    '#e52592', // Pink Google
    '#12b5cb', // Toska Google
    '#fa7b17', // Oranye Google
    '#00897b'  // Hijau Pinus Google
  ];

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bg = googlePalette[Math.abs(hash) % googlePalette.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${bg}" rx="50"/><text x="50%" y="54%" font-family="Google Sans, Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="48" font-weight="500" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Decode payload Google JWT Token
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Ambil daftar users dari localStorage
 */
function getUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Simpan daftar users ke localStorage
 */
function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) { }
}

/**
 * Sanitasi string HTML untuk mencegah XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Deteksi apakah masa aktif langganan akun pengguna sudah kadaluarsa
 */
function isSubscriptionExpired(user) {
  if (!user || user.role === 'Admin' || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
    return false;
  }
  if (!user.subscriptionEnd) return false;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  return todayStr > user.subscriptionEnd;
}

/**
 * Hitung informasi sisa waktu masa aktif langganan akun pengguna
 * Mengembalikan objek status, teks, label, dan kelas CSS untuk header pill
 */
function getAccessRemainingInfo(user) {
  if (!user) return null;

  const userEmail = (user.email || '').trim().toLowerCase();
  // Super Admin utama tidak memerlukan pembatasan waktu akses
  const isSuperAdmin = (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(userEmail)) || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase());
  if (isSuperAdmin) {
    return null;
  }

  // Jika admin belum menentukan batas tanggal langganan
  if (!user.subscriptionEnd || typeof user.subscriptionEnd !== 'string' || !user.subscriptionEnd.trim()) {
    return {
      days: null,
      labelText: 'Sisa Waktu Akses:',
      valueText: 'Aktif',
      subtext: 'Masa aktif akun aktif (belum dibatasi admin)',
      badgeClass: 'access-pill-active',
      formattedDate: '-'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let yr, mo, dy;
  const cleanEnd = user.subscriptionEnd.trim();
  if (cleanEnd.includes('-')) {
    const parts = cleanEnd.split('T')[0].split('-').map(Number);
    yr = parts[0];
    mo = parts[1];
    dy = parts[2];
  } else if (cleanEnd.includes('/')) {
    const parts = cleanEnd.split('/').map(Number);
    yr = parts[2];
    mo = parts[1];
    dy = parts[0];
  }

  if (!yr || !mo || !dy || isNaN(yr) || isNaN(mo) || isNaN(dy)) {
    return {
      days: null,
      labelText: 'Sisa Waktu Akses:',
      valueText: 'Aktif',
      subtext: 'Masa aktif akun aktif',
      badgeClass: 'access-pill-active',
      formattedDate: '-'
    };
  }

  const endDate = new Date(yr, mo - 1, dy);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const formattedDate = `${String(dy).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${yr}`;

  if (diffDays < 0) {
    return {
      days: diffDays,
      labelText: 'Sisa Waktu Akses:',
      valueText: 'Habis',
      subtext: `Masa aktif langganan telah berakhir pada ${formattedDate}`,
      badgeClass: 'access-pill-expired',
      formattedDate
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      labelText: 'Sisa Waktu Akses:',
      valueText: 'Hari Ini',
      subtext: `Masa aktif langganan berakhir hari ini (${formattedDate})`,
      badgeClass: 'access-pill-warning',
      formattedDate
    };
  } else if (diffDays <= 3) {
    return {
      days: diffDays,
      labelText: 'Sisa Waktu Akses:',
      valueText: `${diffDays} Hari`,
      subtext: `Masa aktif berlaku hingga ${formattedDate} (${diffDays} hari lagi)`,
      badgeClass: 'access-pill-warning',
      formattedDate
    };
  } else {
    return {
      days: diffDays,
      labelText: 'Sisa Waktu Akses:',
      valueText: `${diffDays} Hari`,
      subtext: `Masa aktif berlaku hingga ${formattedDate} (${diffDays} hari lagi)`,
      badgeClass: 'access-pill-active',
      formattedDate
    };
  }
}

/**
 * Perbarui elemen badge/pill sisa waktu akses di header secara reaktif tanpa reload halaman
 */
function updateHeaderAccessPill(user) {
  if (!user) {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      user = raw ? JSON.parse(raw) : null;
    } catch (e) { }
  }

  // Jika user di CURRENT_USER_KEY belum punya subscriptionEnd, coba cari di STORAGE_KEY
  if (user && user.email && !user.subscriptionEnd) {
    try {
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const found = allUsers.find(u => (u.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase());
      if (found && found.subscriptionEnd) {
        user = { ...user, subscriptionEnd: found.subscriptionEnd, subscriptionStart: found.subscriptionStart };
      }
    } catch (e) { }
  }

  let pill = document.getElementById('headerAccessPill');
  const info = getAccessRemainingInfo(user);
  if (!info) {
    if (pill) pill.style.display = 'none';
    return;
  }

  const iconTimeUrl = typeof getEduIconUrl === 'function' ? getEduIconUrl('time') : '../Assets/icon/icon_time.png';

  // Jika pill belum ada di DOM, buat dan sisipkan langsung ke navbar
  if (!pill) {
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      pill = document.createElement('div');
      pill.className = `header-access-pill ${info.badgeClass}`;
      pill.id = 'headerAccessPill';
      pill.title = info.subtext;
      pill.style.cssText = `--icon-time-url: url('${iconTimeUrl}'); display: inline-flex;`;
      pill.innerHTML = `
        <span class="access-pill-icon" aria-hidden="true" style="-webkit-mask-image: url('${iconTimeUrl}'); mask-image: url('${iconTimeUrl}');"></span>
        <span class="access-pill-label">${info.labelText}</span>
        <span class="access-pill-value" id="headerAccessValue">${escapeHtml(info.valueText)}</span>
      `;
      navActions.insertBefore(pill, navActions.firstChild);
      return;
    }
  }

  if (pill) {
    pill.style.display = 'inline-flex';
    pill.className = `header-access-pill ${info.badgeClass}`;
    pill.title = info.subtext;

    const labelEl = pill.querySelector('.access-pill-label');
    if (labelEl) {
      labelEl.textContent = info.labelText;
    }
    const valEl = document.getElementById('headerAccessValue') || pill.querySelector('.access-pill-value');
    if (valEl) {
      valEl.textContent = info.valueText;
    }

    let iconEl = pill.querySelector('.access-pill-icon');
    if (!iconEl) {
      const dotEl = pill.querySelector('.access-pill-dot');
      if (dotEl) dotEl.remove();
      iconEl = document.createElement('span');
      iconEl.className = 'access-pill-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      pill.insertBefore(iconEl, pill.firstChild);
    }
    iconEl.style.webkitMaskImage = `url('${iconTimeUrl}')`;
    iconEl.style.maskImage = `url('${iconTimeUrl}')`;
  }
}

/**
 * Global Mobile Navigation Menu Handler (Hamburger Toggle)
 */
function toggleGlobalMobileNav() {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.querySelector('.nav-actions') || document.querySelector('.nav-actions-right');
  if (btn && menu) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    btn.classList.toggle('active');
    menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', !isExpanded);
  }
}

function closeGlobalMobileNav() {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.querySelector('.nav-actions') || document.querySelector('.nav-actions-right');
  if (btn && menu && menu.classList.contains('open')) {
    btn.classList.remove('active');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
}

// Tutup menu mobile ketika klik di luar menu
document.addEventListener('click', (e) => {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.querySelector('.nav-actions') || document.querySelector('.nav-actions-right');
  if (btn && menu && menu.classList.contains('open')) {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      btn.classList.remove('active');
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  const wrapper = document.getElementById('profileDropdownWrapper');
  const dropdown = document.getElementById('profileDropdown');
  if (wrapper && dropdown && !wrapper.contains(e.target)) {
    dropdown.classList.remove('active');
    wrapper.classList.remove('open');
  }
});

/**
 * Toggle Dropdown Menu Profil
 */
function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  const wrapper = document.getElementById('profileDropdownWrapper');
  if (dropdown) dropdown.classList.toggle('active');
  if (wrapper) wrapper.classList.toggle('open');
}

/**
 * Modal Logout Global
 */
function openLogoutModal() {
  let modal = document.getElementById('logoutConfirmModal');
  if (!modal) {
    injectLogoutModal();
    modal = document.getElementById('logoutConfirmModal');
  }
  if (modal) modal.classList.add('active');
}

function closeLogoutModal() {
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) modal.classList.remove('active');
}

/**
 * Dapatkan prefix relatif terhadap root proyek Edu Workspace
 */
function getAppSubDirPrefix() {
  let p = '';
  try {
    p = decodeURIComponent(window.location.pathname || '').toLowerCase().replace(/\\/g, '/');
  } catch (e) {
    p = (window.location.pathname || '').toLowerCase().replace(/\\/g, '/');
  }

  // Jika berada di sub-subfolder fitur (misal /fitur/generate-modul-ajar/ atau /fitur/generate-media-pembelajaran/)
  if (
    p.includes('/fitur/generate-modul-ajar') ||
    p.includes('/fitur/generate modul ajar') ||
    p.includes('/fitur/generate-media-pembelajaran') ||
    p.includes('/fitur/generate media pembelajaran')
  ) {
    return '../../';
  }

  if (
    p.includes('/fitur/') ||
    p.includes('/dashboard-pengguna/') ||
    p.includes('/dashboard-admin/') ||
    p.includes('/halaman-login/')
  ) {
    return '../';
  }
  return '';
}

/**
 * ==========================================================================
 * SISTEM REGISTRY IKON GLOBAL TERPUSAT (EDU WORKSPACE)
 * Menjamin 100% path ikon valid di level folder mana pun
 * ==========================================================================
 */
const EDU_GLOBAL_ICONS = {
  admin: 'Assets/icon/icon_admin.png',
  back: 'Assets/icon/icon_back.png',
  benefit: 'Assets/icon/icon_benefit.png',
  edit: 'Assets/icon/icon_edit.png',
  exit: 'Assets/icon/icon_exit.png',
  logout: 'Assets/icon/icon_exit.png',
  feature: 'Assets/icon/icon_feature.png',
  home: 'Assets/icon/icon_home.png',
  key: 'Assets/icon/icon_key.png',
  lock: 'Assets/icon/icon_lock.png',
  modul_ajar: 'Assets/icon/icon_modul_ajar.png',
  'modul-ajar': 'Assets/icon/icon_modul_ajar.png',
  media_pembelajaran: 'Assets/icon/icon_feature.png',
  'media-pembelajaran': 'Assets/icon/icon_feature.png',
  generate_media_pembelajaran: 'Assets/icon/icon_feature.png',
  file: 'Assets/icon/icon_file.png',
  daftar_modul: 'Assets/icon/icon_file.png',
  'daftar-modul': 'Assets/icon/icon_file.png',
  subscribe: 'Assets/icon/icon_subscribe.png',
  time: 'Assets/icon/icon_time.png',
  user: 'Assets/icon/icon_user.png',
  warning: 'Assets/icon/icon_warning.png',
};

/**
 * Dapatkan URL path ikon yang benar sesuai kedalaman folder
 * @param {string} iconKey - nama ikon (misal: 'back', 'logout', 'modul_ajar')
 * @returns {string} Path URL lengkap ikon
 */
function getEduIconUrl(iconKey) {
  if (!iconKey) return '';
  const key = String(iconKey).trim().toLowerCase();
  const relPath = EDU_GLOBAL_ICONS[key];
  if (!relPath) return '';
  return getAppSubDirPrefix() + relPath;
}

/**
 * Hydrate semua elemen yang memiliki atribut data-icon
 * Contoh di HTML: <img data-icon="back" alt="Kembali">
 */
function initGlobalIcons(rootElement = document) {
  if (!rootElement || !rootElement.querySelectorAll) return;
  const iconElements = rootElement.querySelectorAll('[data-icon]');
  iconElements.forEach(el => {
    const iconKey = el.getAttribute('data-icon');
    const url = getEduIconUrl(iconKey);
    if (url) {
      if (el.tagName.toLowerCase() === 'img') {
        if (el.getAttribute('src') !== url) {
          el.src = url;
        }
      } else {
        el.style.backgroundImage = `url('${url}')`;
      }
    }
  });
}

// Inisialisasi otomatis & observer perubahan DOM
if (typeof window !== 'undefined') {
  window.EDU_GLOBAL_ICONS = EDU_GLOBAL_ICONS;
  window.getEduIconUrl = getEduIconUrl;
  window.initGlobalIcons = initGlobalIcons;
  window.getAccessRemainingInfo = getAccessRemainingInfo;
  window.updateHeaderAccessPill = updateHeaderAccessPill;
  window.syncUserSubscription = syncUserSubscription;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGlobalIcons());
  } else {
    initGlobalIcons();
  }

  try {
    const iconObserver = new MutationObserver((mutations) => {
      let shouldHydrate = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          shouldHydrate = true;
          break;
        }
      }
      if (shouldHydrate) {
        initGlobalIcons();
      }
    });
    iconObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
}

function executeLogout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  const subPrefix = getAppSubDirPrefix();
  const loginUrl = subPrefix ? (subPrefix + 'halaman-login/halaman-login.html') : 'halaman-login/halaman-login.html';
  window.location.href = loginUrl;
}

function injectLogoutModal() {
  if (document.getElementById('logoutConfirmModal')) return;
  const iconExitUrl = getEduIconUrl('logout');

  const modalHtml = `
    <div class="confirm-modal-overlay" id="logoutConfirmModal">
      <div class="confirm-modal-card">
        <div class="confirm-icon-box">
          <img data-icon="logout" src="${iconExitUrl}" alt="Exit" class="confirm-icon-img">
        </div>
        <h3 class="confirm-modal-title">Konfirmasi Keluar</h3>
        <p class="confirm-modal-desc">Apakah Anda yakin ingin keluar dari sesi Edu Workspace?</p>
        <div class="confirm-btn-group">
          <button type="button" class="btn-cancel-modal" onclick="closeLogoutModal()">Batal</button>
          <button type="button" class="btn-confirm-logout" onclick="executeLogout()">Ya, Keluar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Tampilkan Modal Dialog Interaktif Modern Edu Workspace
 * Pengganti alert() bawaan browser yang kaku
 */
function showEduAlert(options = {}) {
  const title = options.title || 'Pemberitahuan';
  const message = options.message || '';
  const iconType = options.iconType || 'lock';
  const buttonText = options.buttonText || 'Mengerti';
  const redirectUrl = options.redirectUrl || null;
  const onConfirm = options.onConfirm || null;

  const existing = document.getElementById('eduGlobalAlertModal');
  if (existing) existing.remove();

  let iconBoxStyle = 'background: #eff6ff; border: 1.5px solid #bfdbfe; color: #2563eb;';
  let iconSvg = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `;

  if (iconType === 'warning') {
    iconBoxStyle = 'background: #fef3c7; border: 1.5px solid #fde68a; color: #d97706;';
    iconSvg = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  } else if (iconType === 'success') {
    iconBoxStyle = 'background: #dcfce7; border: 1.5px solid #86efac; color: #16a34a;';
    iconSvg = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }

  const safeTitle = typeof escapeHtml === 'function' ? escapeHtml(title) : title;
  const safeMessage = typeof escapeHtml === 'function' ? escapeHtml(message) : message;
  const safeBtnText = typeof escapeHtml === 'function' ? escapeHtml(buttonText) : buttonText;

  const modalHtml = `
    <div class="confirm-modal-overlay active" id="eduGlobalAlertModal" style="z-index: 999999;">
      <div class="confirm-modal-card" style="max-width: 440px; padding: 36px 32px 30px; text-align: center; border-radius: 24px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18); background: #ffffff; width: 100%; box-sizing: border-box;">
        <div class="confirm-icon-box" style="width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; ${iconBoxStyle}">
          ${iconSvg}
        </div>
        <h3 class="confirm-modal-title" style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 10px; letter-spacing: -0.02em;">
          ${safeTitle}
        </h3>
        <p class="confirm-modal-desc" style="font-size: 0.95rem; color: #64748b; line-height: 1.55; margin-bottom: 24px;">
          ${safeMessage}
        </p>
        <div style="width: 100%; box-sizing: border-box;">
          <button type="button" id="btnEduGlobalAlertConfirm" style="width: 100%; padding: 13px 24px; font-weight: 700; font-size: 0.95rem; border-radius: 9999px; background: #2563eb; color: #ffffff; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.28); transition: all 0.2s ease;">
            <span>${safeBtnText}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  function handleDismiss() {
    const modalEl = document.getElementById('eduGlobalAlertModal');
    if (modalEl) modalEl.remove();
    if (typeof onConfirm === 'function') {
      onConfirm();
    } else if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  const btn = document.getElementById('btnEduGlobalAlertConfirm');
  if (btn) {
    btn.addEventListener('click', handleDismiss);
    setTimeout(() => btn.focus(), 50);
  }

  const overlay = document.getElementById('eduGlobalAlertModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleDismiss();
    });
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      document.removeEventListener('keydown', handleKeydown);
      handleDismiss();
    }
  }
  document.addEventListener('keydown', handleKeydown);
}

if (typeof window !== 'undefined') {
  window.showEduAlert = showEduAlert;
}

/**
  * Universal Floating Toast Notification (Edu Workspace Style)
  */
let eduToastGlobalTimer = null;

function hideEduToast() {
  const toast = document.getElementById('adminToast') || document.getElementById('eduToast');
  if (toast) {
    toast.classList.remove('show');
  }
}

function showEduToast(msg, explicitType = null) {
  let toast = document.getElementById('adminToast') || document.getElementById('eduToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.id = 'adminToast';
    document.body.appendChild(toast);
  }

  const raw = String(msg || '').trim();
  let type = explicitType;
  
  if (!type) {
    if (raw.includes('🗓️') || /masa langganan|langganan|tanggal/i.test(raw)) {
      type = 'calendar';
    } else if (raw.includes('✓') || /berhasil diaktifkan|berhasil disimpan|sukses/i.test(raw)) {
      type = 'success';
    } else if (raw.includes('⚠️') || /tidak dapat|peringatan|perhatian|habis/i.test(raw)) {
      type = 'warning';
    } else if (raw.includes('🗑️') || /dihapus permanen|dihapus/i.test(raw)) {
      type = 'danger';
    } else {
      type = 'info';
    }
  }

  let iconSvg = '';
  let iconClass = '';

  if (type === 'calendar') {
    iconClass = 'admin-toast-icon-calendar';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
      </svg>
    `;
  } else if (type === 'success') {
    iconClass = 'admin-toast-icon-success';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  } else if (type === 'warning') {
    iconClass = 'admin-toast-icon-warning';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  } else if (type === 'danger') {
    iconClass = 'admin-toast-icon-danger';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
  } else {
    iconClass = 'admin-toast-icon-info';
    iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
  }

  const cleanMsg = raw.replace(/^(?:🗓️|✓|⚠️|🗑️|\u2713|\u26a0|\ud83d\uddd3|\ud83d\uddd1)\s*/u, '').trim();

  const safeText = (typeof escapeHtml === 'function' ? escapeHtml(cleanMsg) : cleanMsg)
    .replace(/&quot;(.*?)&quot;/g, '<strong class="toast-user-tag">"$1"</strong>')
    .replace(/"(.*?)"/g, '<strong class="toast-user-tag">"$1"</strong>');

  toast.innerHTML = `
    <div class="admin-toast-icon-wrapper ${iconClass}">
      ${iconSvg}
    </div>
    <div class="admin-toast-body">
      <span class="admin-toast-text" id="adminToastText">${safeText}</span>
    </div>
    <button type="button" class="admin-toast-close" onclick="hideEduToast()" title="Tutup Notifikasi">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  clearTimeout(eduToastGlobalTimer);
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  eduToastGlobalTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

if (typeof window !== 'undefined') {
  window.showEduToast = showEduToast;
  window.hideEduToast = hideEduToast;
  window.showAdminToast = showEduToast;
  window.hideAdminToast = hideEduToast;
}


/**
 * Periksa apakah user saat ini memiliki kewenangan Administrator
 */
function isCurrentUserAdmin(user) {
  if (!user || typeof user !== 'object') return false;
  const email = (user.email || '').trim().toLowerCase();
  const role = (user.role || '').trim();
  if (role === 'Admin') return true;
  if (typeof ADMIN_EMAILS !== 'undefined' && Array.isArray(ADMIN_EMAILS) && ADMIN_EMAILS.some(e => (e || '').toLowerCase() === email)) return true;
  if (typeof ADMIN_EMAIL !== 'undefined' && email === (ADMIN_EMAIL || '').toLowerCase()) return true;
  return false;
}

/**
 * Sembunyikan konten halaman admin jika user tidak berwenang
 */
function hideAdminPageContent() {
  try {
    const targets = document.querySelectorAll('.admin-content-wrapper, .admin-main-wrapper, .admin-content, main, .stats-recap-grid, .table-card');
    targets.forEach(el => {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
    });
  } catch (e) {}
}

/**
 * Proteksi Area Admin Terpusat:
 * Jika halaman berada di bawah /dashboard-admin/ dan pengguna bukan Admin atau belum login,
 * langsung sembunyikan seluruh isi halaman dan tampilkan modal alert peringatan (Akses Terbatas).
 */
function enforceAdminGuard() {
  const p = (window.location.pathname || '').toLowerCase();
  const isAdminArea = p.includes('/dashboard-admin/') || p.includes('/dashboard admin/');
  if (!isAdminArea) return true;

  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!loggedUserStr) {
    hideAdminPageContent();
    showEduAlert({
      title: "Silakan Login Terlebih Dahulu",
      message: "Sesi Anda belum terautentikasi. Silakan masuk dengan akun Google terdaftar untuk mengakses halaman Administrator.",
      iconType: "lock",
      buttonText: "Ke Halaman Login",
      redirectUrl: "../halaman-login/halaman-login.html"
    });
    return false;
  }

  let user = null;
  try {
    user = JSON.parse(loggedUserStr);
  } catch (e) {
    user = null;
  }

  if (!isCurrentUserAdmin(user)) {
    hideAdminPageContent();
    showEduAlert({
      title: "Akses Terbatas",
      message: "Halaman ini hanya dapat diakses oleh Administrator Edu Workspace.",
      iconType: "warning",
      buttonText: "Ke Dashboard Pengguna",
      redirectUrl: "../dashboard-pengguna/dashboard-pengguna.html"
    });
    return false;
  }

  return true;
}

if (typeof window !== 'undefined') {
  window.isCurrentUserAdmin = isCurrentUserAdmin;
  window.hideAdminPageContent = hideAdminPageContent;
  window.enforceAdminGuard = enforceAdminGuard;

  // Jalankan guard sesegera mungkin saat script global dimuat
  const currentPath = (window.location.pathname || '').toLowerCase();
  if (currentPath.includes('/dashboard-admin/') || currentPath.includes('/dashboard admin/')) {
    enforceAdminGuard();
  }
}

/**
 * Render Header / Navbar Global Edu Workspace Terpusat
 * @param {Object} options
/**
 * Auto-initsialiasi Header Global jika elemen #eduGlobalNavbar ada di halaman
 */
function autoInitEduNavbar() {
  const headerEl = document.getElementById('eduGlobalNavbar');
  if (!headerEl || headerEl.children.length > 0) return;
  renderEduNavbar();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoInitEduNavbar());
  } else {
    autoInitEduNavbar();
  }
}

/**
 * Render Header / Navbar Global Edu Workspace Terpusat
 * Mendukung 3 mode:
 * 1. Landing (index.html) -> Logo + Hamburger + Nav Links (Home, Benefit, Fitur)
 * 2. Login (halaman-login.html) -> Logo + Tombol Kembali
 * 3. Dashboard / Portal (Default) -> Logo + Api Key + Kembali + Profil Dropdown + Mobile Logout
 * @param {Object} options
 */
function renderEduNavbar(options = {}) {
  const targetId = options.targetId || 'eduGlobalNavbar';
  let headerEl = document.getElementById(targetId);
  if (!headerEl) {
    headerEl = document.querySelector('header.edu-navbar, header.site-header, header.login-header, header.user-navbar, header.api-navbar, header.modul-navbar, header.profile-navbar');
  }
  if (!headerEl) return;

  const subPrefix = getAppSubDirPrefix();

  let p = '';
  try {
    p = decodeURIComponent(window.location.pathname || '').toLowerCase();
  } catch (e) {
    p = (window.location.pathname || '').toLowerCase();
  }

  // 1. Mode Landing Page (index.html)
  const isLanding = options.type === 'landing' || p === '/' || p.endsWith('/index.html') || p.endsWith('07.%20eduworkspace/') || p.endsWith('07. eduworkspace/');
  if (isLanding) {
    headerEl.className = 'edu-navbar site-header';
    headerEl.innerHTML = `
      <div class="header-container">
        <a href="#hero" class="brand-logo" title="Edu Workspace">
          <span class="brand-bold">Edu</span> <span class="brand-thin">Workspace</span>
        </a>

        <!-- Hamburger Menu Button (Mobile Only) -->
        <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false" onclick="toggleGlobalMobileNav()">
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
          <span class="hamburger-bar"></span>
        </button>

        <!-- Navigation Links Landing Page -->
        <nav class="nav-links" id="navMenu">
          <a href="#hero" class="nav-link nav-home active" aria-label="Home">
            <img data-icon="home" src="${getEduIconUrl('home')}" alt="Home" class="nav-btn-icon">
            <span class="nav-home-text">Home</span>
          </a>
          <a href="#benefit" class="nav-link">
            <img data-icon="benefit" src="${getEduIconUrl('benefit')}" alt="Benefit" class="nav-btn-icon">
            <span>Benefit</span>
          </a>
          <a href="#fitur" class="nav-link">
            <img data-icon="feature" src="${getEduIconUrl('feature')}" alt="Fitur" class="nav-btn-icon">
            <span>Fitur</span>
          </a>
        </nav>
      </div>
    `;
    return;
  }

  // 2. Mode Login / Simple Back Header (halaman-login.html)
  const isLogin = options.type === 'login' || options.showProfile === false || p.includes('/halaman-login/') || p.includes('/halaman-login/');
  if (isLogin) {
    const backHref = options.backUrl || (subPrefix ? subPrefix + 'index.html' : '../index.html');
    const backText = options.backText || 'Kembali';
    headerEl.className = 'edu-navbar login-header';
    headerEl.innerHTML = `
      <div class="header-container">
        <a href="${options.homeUrl || backHref}" class="brand-logo" title="Edu Workspace">
          <span class="brand-bold">Edu</span> <span class="brand-thin">Workspace</span>
        </a>

        <a href="${backHref}" class="btn-back-home" title="${backText}">
          <img data-icon="back" src="${getEduIconUrl('back')}" alt="Kembali" class="nav-btn-icon">
          <span>${backText}</span>
        </a>
      </div>
    `;
    return;
  }

  // 3. Mode Dashboard / Portal Pengguna & Admin (Default)
  let user = options.user || null;
  if (!user) {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      user = raw ? JSON.parse(raw) : null;
    } catch (e) {}
  }

  // Jika user di CURRENT_USER_KEY belum punya data subscriptionEnd, coba sinkron dari STORAGE_KEY
  if (user && user.email && !user.subscriptionEnd) {
    try {
      const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const found = allUsers.find(u => (u.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase());
      if (found && found.subscriptionEnd && !found.isDeleted && found.status !== 'Dihapus') {
        user = { ...user, subscriptionEnd: found.subscriptionEnd, subscriptionStart: found.subscriptionStart };
      }
    } catch (e) {}
  }

  const isAdminArea = p.includes('/dashboard-admin/') || p.includes('/dashboard admin/');
  const isMainAdmin = isAdminArea && (
    p.endsWith('/dashboard-admin.html') || 
    p.endsWith('/dashboard-admin') || 
    p.endsWith('/dashboard admin.html') || 
    p.endsWith('/dashboard admin')
  );
  const isUserAdmin = isCurrentUserAdmin(user);

  if (isAdminArea && !isUserAdmin) {
    enforceAdminGuard();
    return;
  }

  let defaultName = (isAdminArea || isUserAdmin) ? 'Super Admin' : 'Bapak/Ibu Guru';
  let defaultEmail = (isAdminArea || isUserAdmin) ? 'Admin Edu Workspace' : 'guru@gmail.com';

  const userName = (user && user.name) ? user.name : defaultName;
  const userEmail = (user && user.email) ? user.email : defaultEmail;
  const userAvatar = getGoogleAvatar(userName, user ? user.avatar : null);

  const isInFitur = p.includes('/fitur/');
  const isNestedFitur = (
    p.includes('/fitur/generate-modul-ajar') ||
    p.includes('/fitur/generate modul ajar') ||
    p.includes('/fitur/generate-media-pembelajaran') ||
    p.includes('/fitur/generate media pembelajaran')
  );
  const fiturPrefix = isNestedFitur ? '../../' : (isInFitur ? '../' : '');

  const isDashboardPengguna = (
    p.includes('/dashboard-pengguna') || 
    p.includes('dashboard-pengguna') ||
    p.includes('/dashboard pengguna') || 
    p.includes('dashboard pengguna')
  ) && !p.includes('daftar-modul') && !p.includes('daftar modul') && !p.includes('api-key') && !p.includes('api key') && !p.includes('profil');

  let defaultPortalHome = 'dashboard-pengguna.html';
  if (isInFitur) {
    defaultPortalHome = fiturPrefix + 'dashboard-pengguna/dashboard-pengguna.html';
  } else if (isAdminArea) {
    defaultPortalHome = 'dashboard-admin.html';
  }

  // URL Brand Logo (Kiri Atas): Selalu mengarah ke Landing Page (index.html) sesuai permintaan pengguna
  const landingUrl = subPrefix ? subPrefix + 'index.html' : 'index.html';
  const logoUrl = options.homeUrl || landingUrl;

  let defaultShowBack = false;
  let defaultBackUrl = defaultPortalHome;
  if (isAdminArea && !isMainAdmin) {
    defaultShowBack = true;
    defaultBackUrl = 'dashboard-admin.html';
  }

  // Khusus Dashboard Pengguna: Otomatis tampilkan tombol Daftar Modul Ajar & API Key
  const defaultShowDaftarModul = isDashboardPengguna;
  const showDaftarModul = options.showDaftarModul !== undefined ? options.showDaftarModul : defaultShowDaftarModul;
  const defaultDaftarModulUrl = isInFitur ? (fiturPrefix + 'dashboard-pengguna/daftar-modul-ajar.html') : 'daftar-modul-ajar.html';
  const daftarModulUrl = options.daftarModulUrl || defaultDaftarModulUrl;

  const showBack = options.showBack !== undefined ? options.showBack : defaultShowBack;
  const backUrl = options.backUrl || defaultBackUrl;
  const backText = options.backText || 'Kembali';

  const defaultShowApiKey = isDashboardPengguna;
  const showApiKey = options.showApiKey !== undefined ? options.showApiKey : defaultShowApiKey;
  const defaultApiKeyUrl = isInFitur ? (fiturPrefix + 'dashboard-pengguna/api-key.html') : 'api-key.html';
  const apiKeyUrl = options.apiKeyUrl || defaultApiKeyUrl;

  // Khusus Dashboard Pengguna (Bukan Admin): Tampilkan informasi Sisa Waktu Akses
  const defaultShowAccessTime = isDashboardPengguna && !isUserAdmin && !isAdminArea;
  const showAccessTime = options.showAccessTime !== undefined ? options.showAccessTime : defaultShowAccessTime;

  let accessInfo = null;
  if (showAccessTime && user) {
    accessInfo = getAccessRemainingInfo(user);
    if (!accessInfo && !isUserAdmin && !isAdminArea) {
      accessInfo = {
        days: null,
        labelText: 'Sisa Waktu Akses:',
        valueText: 'Aktif',
        subtext: 'Masa aktif akun aktif',
        badgeClass: 'access-pill-active',
        formattedDate: '-'
      };
    }
  }

  const iconFileUrl = getEduIconUrl('file');
  const iconKeyUrl = getEduIconUrl('key');
  const iconBackUrl = getEduIconUrl('back');
  const iconLogoutUrl = getEduIconUrl('logout');
  const iconTimeUrl = getEduIconUrl('time');

  headerEl.className = 'edu-navbar';
  headerEl.innerHTML = `
    <div class="header-container">
      <a href="${logoUrl}" class="brand-logo" title="Edu Workspace">
        <span class="brand-bold">Edu</span> <span class="brand-thin">Workspace</span>
      </a>

      <!-- Hamburger Menu Button (Mobile Only) -->
      <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false" onclick="toggleGlobalMobileNav()">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <div class="nav-actions">
        ${options.customActionsHtml || ''}

        ${(showAccessTime && accessInfo) ? `
          <div class="header-access-pill ${accessInfo.badgeClass}" id="headerAccessPill" title="${escapeHtml(accessInfo.subtext)}" style="--icon-time-url: url('${iconTimeUrl}');">
            <span class="access-pill-icon" aria-hidden="true" style="-webkit-mask-image: url('${iconTimeUrl}'); mask-image: url('${iconTimeUrl}');"></span>
            <span class="access-pill-label">${accessInfo.labelText}</span>
            <span class="access-pill-value" id="headerAccessValue">${escapeHtml(accessInfo.valueText)}</span>
          </div>
        ` : ''}

        ${showDaftarModul ? `
          <a href="${daftarModulUrl}" class="btn-back-home" title="Daftar Modul Ajar">
            <img data-icon="file" src="${iconFileUrl}" alt="Daftar Modul Ajar" class="nav-btn-icon">
            <span>Daftar Modul Ajar</span>
          </a>
        ` : ''}

        ${showApiKey ? `
          <a href="${apiKeyUrl}" class="btn-back-home" title="Kelola Kunci API AI">
            <img data-icon="key" src="${iconKeyUrl}" alt="API Key" class="nav-btn-icon">
            <span>API Key</span>
          </a>
        ` : ''}

        ${showBack ? `
          <a href="${backUrl}" class="btn-back-home" title="${backText}">
            <img data-icon="back" src="${iconBackUrl}" alt="Kembali" class="nav-btn-icon">
            <span>${backText}</span>
          </a>
        ` : ''}

        ${(showDaftarModul || showApiKey || showBack || options.customActionsHtml || (showAccessTime && accessInfo)) ? '<div class="nav-divider"></div>' : ''}

        <!-- Profile dengan Teks Kiri dan Avatar Kanan -->
        <div class="profile-dropdown-wrapper" id="profileDropdownWrapper">
          <div class="user-profile-btn" onclick="toggleProfileDropdown(event)">
            <div class="profile-text-group">
              <span class="profile-name-text" id="userNameDisplay">${escapeHtml(userName)}</span>
              <span class="profile-email-text" id="userEmailDisplay">${escapeHtml(userEmail)}</span>
            </div>
            <img id="userAvatarImg" referrerpolicy="no-referrer" src="${userAvatar}" alt="Avatar" class="user-avatar-modern" onerror="this.onerror=null; this.src=getGoogleAvatar('${escapeHtml(userName)}', null);">
          </div>

          <div class="profile-dropdown-menu" id="profileDropdown">
            <button type="button" class="btn-dropdown-item dropdown-logout-item" onclick="openLogoutModal()">
              <img data-icon="logout" src="${iconLogoutUrl}" alt="Exit" class="dropdown-item-icon dropdown-logout-icon" width="18" height="18">
              <span>Log Out</span>
            </button>
          </div>
        </div>

        <!-- Tombol Log Out Khusus Mobile Menu -->
        <button type="button" class="mobile-logout-btn" onclick="openLogoutModal()">
          <img data-icon="logout" src="${iconLogoutUrl}" alt="Exit" class="nav-btn-icon">
          <span>Log Out</span>
        </button>
      </div>
    </div>
  `;

  if (showAccessTime) {
    initAccessTimeSync();
  }
}

/**
 * ==========================================================================
 * REALTIME ACCESS TIME SYNCHRONIZATION (Dashboard Pengguna)
 * Otomatis ter-sinkron dengan data masa langganan di Dashboard Admin
 * ==========================================================================
 */
let isAccessSyncInitialized = false;

function syncUserSubscription() {
  let raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return;
  let user = null;
  try { user = JSON.parse(raw); } catch (e) { return; }
  if (!user || !user.email) return;

  const userEmail = (user.email || '').trim().toLowerCase();
  if (user.role === 'Admin' || (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(userEmail)) || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase())) {
    return;
  }

  // 1. Cek instan dari database lokal localStorage (STORAGE_KEY)
  try {
    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const found = allUsers.find(u => (u.email || '').trim().toLowerCase() === userEmail);
    if (found) {
      user = { ...user, ...found };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      updateHeaderAccessPill(user);
    }
  } catch (e) { }

  // 2. Sinkronisasi langsung dengan Supabase (prioritas utama)
  SupabaseDB.getUserByEmail(userEmail)
    .then(dbUser => {
      if (dbUser) {
        user = { ...user, ...dbUser };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        updateHeaderAccessPill(user);
        // Update cache lokal juga
        try {
          const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const idx = all.findIndex(u => (u.email || '').toLowerCase() === userEmail);
          if (idx >= 0) all[idx] = user; else all.push(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch (e) {}
      }
    })
    .catch(() => {
      // Fallback ke /api/users jika Supabase tidak tersedia
      fetch('/api/users')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data || !Array.isArray(data.users)) return;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
          const found = data.users.find(u => (u.email || '').trim().toLowerCase() === userEmail);
          if (found) {
            user = { ...user, ...found };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            updateHeaderAccessPill(user);
          }
        })
        .catch(() => { });
    });
}

function initAccessTimeSync() {
  if (isAccessSyncInitialized) return;
  isAccessSyncInitialized = true;

  // A. Dengarkan BroadcastChannel untuk sinkronisasi realtime saat Admin simpan tanggal
  try {
    const syncChannel = new BroadcastChannel('edu_workspace_sync');
    syncChannel.addEventListener('message', (event) => {
      if (!event.data) return;
      if (event.data.type === 'SYNC_USER' || event.data.type === 'SYNC_ALL' || event.data.type === 'STATUS_UPDATED') {
        syncUserSubscription();
      }
    });
  } catch (e) { }

  // B. Storage event saat tab Admin mengubah data
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === 'edu_sync_timestamp' || e.key === CURRENT_USER_KEY) {
      syncUserSubscription();
    }
  });

  // C. Saat jendela kembali mendapatkan fokus
  window.addEventListener('focus', syncUserSubscription);

  // D. Polling fallback berkala setiap 60 detik (bukan per 3 detik agar tidak memicu rate limit)
  setInterval(syncUserSubscription, 60000);
}

/**
 * ==========================================================================
 * REALTIME USER ACCOUNT DELETION MONITOR
 * Jika akun pengguna dihapus saat pengguna sedang berada di halaman
 * "Dashboard Pengguna", "API Key", "Daftar Modul Ajar", atau halaman fitur,
 * sistem seketika mengalihkan pengguna ke tampilan Akun Dihapus (profil.html).
 * ==========================================================================
 */
/**
 * ==========================================================================
 * REALTIME USER ACCOUNT ACCESS GUARD
 * Jika akun pengguna DIHAPUS atau DINONAKTIFKAN (Nonaktif, Ditolak, atau Habis Langganan),
 * pengguna TIDAK BISA MENGAKSES MENU APAPUN di portal internal.
 * Setiap halaman internal (Dashboard Pengguna, API Key, Daftar Modul Ajar, Fitur Modul Ajar)
 * otomatis seketika dialihkan ke profil.html untuk menampilkan keterangan Akun Dihapus / Dinonaktifkan.
 * ==========================================================================
 */
(function setupUserAccountMonitor() {
  function getRedirectTarget(p) {
    if (p.includes('/fitur/')) {
      return '../dashboard-pengguna/profil.html';
    }
    if (p.includes('/dashboard-pengguna/') || p.includes('/dashboard-pengguna/')) {
      return 'profil.html';
    }
    return '../dashboard-pengguna/profil.html';
  }

  function isExcludedPublicPage(p) {
    return p === '/' || 
           p === '' || 
           p.endsWith('/index.html') || 
           p.endsWith('index.html') || 
           p.endsWith('07.%20eduworkspace/') || 
           p.endsWith('07. eduworkspace/') ||
           p.includes('/halaman-login') || 
           p.includes('/halaman login') || 
           p.includes('/halaman%20login') ||
           p.includes('/dashboard-admin') || 
           p.includes('/dashboard admin') || 
           p.includes('/dashboard%20admin') ||
           p.includes('profil');
  }

  let isChecking = false;

  async function verifyUserAccess() {
    if (isChecking) return;

    let p = '';
    try {
      p = decodeURIComponent(window.location.pathname || '').toLowerCase().replace(/\\/g, '/');
    } catch (e) {
      p = (window.location.pathname || '').toLowerCase().replace(/\\/g, '/');
    }

    if (isExcludedPublicPage(p)) {
      return;
    }

    let raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      const isNestedFitur = (
        p.includes('/fitur/generate-modul-ajar/') ||
        p.includes('/fitur/generate-modul-ajar') ||
        p.includes('/fitur/generate modul ajar/') ||
        p.includes('/fitur/generate modul ajar')
      );
      const loginTarget = isNestedFitur 
        ? '../../halaman-login/halaman-login.html' 
        : (p.includes('/fitur/') ? '../halaman-login/halaman-login.html' : (p.includes('/dashboard-pengguna/') ? '../halaman-login/halaman-login.html' : 'halaman-login/halaman-login.html'));
      window.location.replace(loginTarget);
      return;
    }

    let user = null;
    try {
      user = JSON.parse(raw);
    } catch (e) {
      return;
    }
    if (!user || !user.email) return;

    const userEmail = (user.email || '').trim().toLowerCase();

    // Jangan blokir akun Super Admin
    if (user.role === 'Admin' || (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(userEmail)) || (typeof ADMIN_EMAIL !== 'undefined' && userEmail === ADMIN_EMAIL.toLowerCase())) {
      return;
    }

    const redirectTarget = getRedirectTarget(p);

    // 1. Pemeriksaan Cepat Status Sesi Lokal (Instant Fast Check)
    const isLocalDeleted = user.status === 'Dihapus' || user.isDeleted === true;
    const isLocalExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(user);
    const isLocalDeactivated = user.status === 'Nonaktif' || 
                               user.status === 'Dinonaktifkan' || 
                               user.status === 'Ditolak' || 
                               user.isApproved === false || 
                               isLocalExpired;

    if (isLocalDeleted || isLocalDeactivated) {
      window.location.replace(redirectTarget);
      return;
    }

    // 2. Verifikasi Akurat & Terkini Langsung ke Cloud Supabase
    isChecking = true;
    try {
      const dbUser = await SupabaseDB.getUserByEmail(userEmail);
      if (!dbUser) {
        // Jika dbUser null (network error / timeout / rate limit), pertahankan sesi lokal pengguna saat ini
        // DILARANG menganggap network error sebagai akun dihapus!
        return;
      }

      if (dbUser.isDeleted || dbUser.status === 'Dihapus' || dbUser.is_deleted) {
        user.status = 'Dihapus';
        user.isDeleted = true;
        user.isApproved = false;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        window.location.replace(redirectTarget);
        return;
      }

      const isExpired = typeof isSubscriptionExpired === 'function' && isSubscriptionExpired(dbUser);
      const isDeactivated = dbUser.status === 'Nonaktif' || 
                            dbUser.status === 'Dinonaktifkan' || 
                            dbUser.status === 'Ditolak' || 
                            dbUser.isApproved === false || 
                            isExpired;

      if (isDeactivated) {
        user = { ...user, ...dbUser, isApproved: false };
        if (isExpired && user.status === 'Aktif') {
          user.status = 'Nonaktif';
          user.rejectReason = 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.';
        }
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        window.location.replace(redirectTarget);
        return;
      }

      // Jika akun AKTIF & lolos semua verifikasi di Supabase:
      // Sinkronkan data ke sesi lokal
      user = {
        ...user,
        ...dbUser,
        status: 'Aktif',
        isApproved: true,
        isDeleted: false
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('[Access Guard] Gagal sinkronisasi Supabase:', err);
    } finally {
      isChecking = false;
    }
  }

  // A. Jalankan pemeriksaan langsung saat script dimuat & saat DOM siap
  verifyUserAccess();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => verifyUserAccess());
  }

  // B. Polling berkala setiap 30 detik untuk deteksi sinkronisasi akun tanpa membebani server
  setInterval(() => {
    verifyUserAccess();
  }, 30000);

  // C. Sinyal broadcast realtime jika admin dan pengguna di browser yang sama
  try {
    const channel = new BroadcastChannel('edu_workspace_sync');
    channel.addEventListener('message', () => {
      verifyUserAccess();
    });
  } catch (e) {}

  // D. Storage event & focus saat jendela browser kembali aktif
  window.addEventListener('storage', (e) => {
    if (e.key === CURRENT_USER_KEY || e.key === 'edu_sync_timestamp') {
      verifyUserAccess();
    }
  });

  window.addEventListener('focus', () => {
    verifyUserAccess();
  });
})();

