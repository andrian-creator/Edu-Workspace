/**
 * Edu Workspace - Halaman Login Google Logic
 * Google Identity Services Integration, JWT Decoder, Session Redirect
 */

// Pengecekan Sesi Aktif: Jika belum logout, langsung masuk ke Dashboard yang sesuai
(function checkExistingSession() {
  const loggedUserStr = localStorage.getItem(CURRENT_USER_KEY);
  if (loggedUserStr) {
    try {
      const user = JSON.parse(loggedUserStr);
      if (user && user.email) {
        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'Admin';
        if (isAdmin) {
          window.location.replace("../dashboard-admin/dashboard-admin.html");
        } else {
          if (user.status === 'Dihapus' || user.isDeleted === true) {
            window.location.replace("../dashboard-pengguna/profil.html");
            return;
          }
          // Guru langsung diarahkan ke Dashboard Pengguna
          window.location.replace("../dashboard-pengguna/dashboard-pengguna.html");
        }
      }
    } catch (e) {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
})();

// Callback saat login Google berhasil
function handleGoogleAuthCallback(response) {
  if (response && response.credential) {
    const payload = parseJwt(response.credential);
    if (payload && payload.email) {
      processLogin(payload);
    }
  }
}

function processLogin(payload) {
  const email = payload.email.toLowerCase();
  const name = payload.name || "Pengguna Google";
  const picture = getGoogleAvatar(name, payload.picture);

  if (!email.endsWith('@gmail.com')) {
    if (typeof showEduAlert === 'function') {
      showEduAlert({
        title: "Akses Ditolak",
        message: "Hanya dapat menggunakan akun Google personal yang berakhiran @gmail.com.",
        iconType: "warning",
        buttonText: "Mengerti"
      });
    } else {
      alert("Akses Ditolak! Hanya dapat menggunakan akun Google personal yang berakhiran @gmail.com");
    }
    return;
  }

  const isAdmin = email === ADMIN_EMAIL.toLowerCase();
  const role = isAdmin ? 'Admin' : 'Guru';
  const allFeatures = ['generate_modul_ajar', 'generate_media_pembelajaran'];

  let users = [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    users = data ? JSON.parse(data) : [];
  } catch (e) { users = []; }

  let matchedUser = users.find(u => u.email.toLowerCase() === email);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Tentukan user object dasar dulu dari localStorage
  if (!matchedUser || matchedUser.status === 'Dihapus' || matchedUser.isDeleted === true) {
    localStorage.removeItem(`edu_api_key_${email}`);
    localStorage.removeItem(`edu_modul_list_${email}`);
    localStorage.removeItem('edu_current_generated_modul');
    localStorage.removeItem('edu_editing_modul_payload');
    localStorage.removeItem('edu_last_modul_payload');
    localStorage.removeItem('edu_gemini_api_key');

    const existingIdx = users.findIndex(u => (u.email || '').toLowerCase() === email);
    if (existingIdx !== -1) users.splice(existingIdx, 1);

    matchedUser = {
      id: isAdmin ? 'ADM-001' : ('USR-' + String(Date.now()).slice(-6)),
      name: name,
      email: email,
      avatar: picture,
      role: role,
      institution: isAdmin ? 'Edu Workspace' : 'Pendidik',
      subject: isAdmin ? 'Super Admin' : 'Guru',
      gradeLevel: 'SMA/MA',
      registeredAt: dateStr,
      provider: 'Google Account (@gmail.com)',
      status: 'Aktif',
      isApproved: true,
      isProfileCompleted: true,
      features: isAdmin ? ['generate_modul_ajar'] : allFeatures,
      geminiApiKey: '',
      subscriptionStart: null,
      subscriptionEnd: null
    };
    users.push(matchedUser);
  } else {
    matchedUser.name = name;
    matchedUser.avatar = picture;
    matchedUser.role = role;
    if (isAdmin) {
      matchedUser.status = 'Aktif';
      matchedUser.isApproved = true;
      matchedUser.isProfileCompleted = true;
    } else {
      // Guru yang login langsung dipastikan aktif dan semua fitur terbuka jika tidak diblokir/dihapus
      if (matchedUser.status !== 'Nonaktif' && matchedUser.status !== 'Dinonaktifkan' && matchedUser.status !== 'Ditolak' && matchedUser.status !== 'Dihapus' && !matchedUser.isDeleted) {
        matchedUser.status = 'Aktif';
        matchedUser.isApproved = true;
        matchedUser.isProfileCompleted = true;
        if (!matchedUser.institution || matchedUser.institution === 'Sekolah / Instansi Guru') {
          matchedUser.institution = 'Pendidik';
        }
        if (!matchedUser.gradeLevel) {
          matchedUser.gradeLevel = 'SMA/MA';
        }
        if (!Array.isArray(matchedUser.features) || matchedUser.features.length === 0) {
          matchedUser.features = allFeatures;
        }
      }
    }
  }

  if (isAdmin) localStorage.setItem('edu_admin_avatar', picture);

  // Simpan ke localStorage dulu (cepat, tidak menunggu network)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(matchedUser));

  // Cek Supabase: jika user sudah ada di DB, ambil data lengkapnya
  SupabaseDB.getUserByEmail(email).then(dbUser => {
    let finalUser = matchedUser;
    if (dbUser) {
      finalUser.id = dbUser.id; // Gunakan ID Supabase yang sah
      if (dbUser.isDeleted || dbUser.status === 'Dihapus') {
        // Akun sebelumnya pernah dihapus, sekarang mendaftar ulang -> Langsung Aktif & semua fitur terbuka
        finalUser.status = 'Aktif';
        finalUser.isDeleted = false;
        finalUser.isApproved = true;
        finalUser.isProfileCompleted = true;
        finalUser.institution = 'Pendidik';
        finalUser.gradeLevel = 'SMA/MA';
        finalUser.features = allFeatures;
        finalUser.subscriptionStart = null;
        finalUser.subscriptionEnd = null;
        delete finalUser.subscriptionDays;
        delete finalUser.rejectReason;

        // Un-delete langsung di Supabase via PATCH
        SupabaseDB.updateUserByEmail(email, {
          isDeleted: false,
          status: 'Aktif',
          isApproved: true,
          isProfileCompleted: true,
          institution: 'Pendidik',
          gradeLevel: 'SMA/MA',
          subject: 'Guru',
          rejectReason: '',
          features: allFeatures,
          subscriptionStart: null,
          subscriptionEnd: null
        }).catch(() => {});
      } else {
        const isDeactivatedOrRejected = dbUser.status === 'Nonaktif' || dbUser.status === 'Dinonaktifkan' || dbUser.status === 'Ditolak';
        
        finalUser = {
          ...matchedUser,
          id: dbUser.id,
          name: name,
          avatar: picture,
          institution: dbUser.institution || matchedUser.institution || 'Pendidik',
          subject: dbUser.subject || matchedUser.subject || 'Guru',
          gradeLevel: dbUser.gradeLevel || matchedUser.gradeLevel || 'SMA/MA',
          subscriptionStart: dbUser.subscriptionStart || matchedUser.subscriptionStart || null,
          subscriptionEnd: dbUser.subscriptionEnd || matchedUser.subscriptionEnd || null,
          // Jika tidak berstatus nonaktif/ditolak oleh admin, otomatis aktif dan disetujui
          status: isDeactivatedOrRejected ? dbUser.status : 'Aktif',
          isApproved: isDeactivatedOrRejected ? false : true,
          isProfileCompleted: true,
          // Buka semua fitur secara otomatis jika belum diatur khusus
          features: isDeactivatedOrRejected 
            ? [] 
            : ((Array.isArray(dbUser.features) && dbUser.features.length > 0) ? dbUser.features : allFeatures)
        };
      }
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
    // Update users array in STORAGE_KEY as well
    const uIdx = users.findIndex(u => (u.email || '').toLowerCase() === email);
    if (uIdx !== -1) {
      users[uIdx] = finalUser;
    } else {
      users.push(finalUser);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    // Upsert ke Supabase
    supabaseUpsertLoginUser(finalUser).catch(() => {
      // Fallback: kirim ke server lokal
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUser)
      }).catch(() => {});
    });
  }).catch(() => {
    // Supabase tidak tersedia, fallback ke server lokal
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchedUser)
    }).catch(err => console.log("Backend sync note:", err));
  });

  // Tampilkan Popup Notifikasi Berhasil
  const popup = document.getElementById('loginSuccessPopup');
  const emailText = document.getElementById('popupEmailText');
  const roleDesc = document.getElementById('popupRoleDesc');

  emailText.textContent = email;
  if (isAdmin) {
    roleDesc.textContent = "Masuk sebagai Super Administrator. Mengalihkan ke Portal Admin...";
  } else {
    roleDesc.textContent = "Masuk sebagai Pendidik. Mengalihkan ke Workspace Guru...";
  }

  popup.classList.add('active');

  // Pengalihan Otomatis Berdasarkan Role dan Status Akun
  setTimeout(() => {
    const curRaw = localStorage.getItem(CURRENT_USER_KEY);
    const u = curRaw ? JSON.parse(curRaw) : matchedUser;

    if (isAdmin) {
      window.location.href = "../dashboard-admin/dashboard-admin.html";
    } else {
      const isBlocked = u.isDeleted === true || 
                        u.status === 'Dihapus' || 
                        u.status === 'Nonaktif' || 
                        u.status === 'Dinonaktifkan' || 
                        u.status === 'Ditolak' || 
                        isSubscriptionExpired(u);

      if (!isBlocked) {
        window.location.href = "../dashboard-pengguna/dashboard-pengguna.html";
      } else {
        window.location.href = "../dashboard-pengguna/profil.html";
      }
    }
  }, 1200);
}
