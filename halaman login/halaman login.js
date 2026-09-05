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
          window.location.replace("../dashboard admin/dashboard admin.html");
        } else {
          if (user.status === 'Dihapus' || user.isDeleted === true) {
            window.location.replace("../dashboard pengguna/profil.html");
            return;
          }
          if (user.isProfileCompleted === true && user.institution && user.institution !== 'Sekolah / Instansi Guru') {
            window.location.replace("../dashboard pengguna/dashboard pengguna.html");
          } else {
            window.location.replace("../dashboard pengguna/profil.html");
          }
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
    alert("Akses Ditolak! Hanya dapat menggunakan akun Google personal yang berakhiran @gmail.com");
    return;
  }

  const isAdmin = email === ADMIN_EMAIL.toLowerCase();
  const role = isAdmin ? 'Admin' : 'Guru';

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
      institution: isAdmin ? 'Edu Workspace' : '',
      subject: isAdmin ? 'Super Admin' : '',
      gradeLevel: '',
      registeredAt: dateStr,
      provider: 'Google Account (@gmail.com)',
      status: isAdmin ? 'Aktif' : 'Belum Lengkap',
      isApproved: isAdmin ? true : false,
      isProfileCompleted: isAdmin ? true : false,
      features: isAdmin ? ['generate_modul_ajar'] : [],
      geminiApiKey: ''
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
        // Akun sebelumnya pernah dihapus, sekarang login kembali untuk mendaftar profil baru
        finalUser.status = 'Belum Lengkap';
        finalUser.isDeleted = false;
        finalUser.isApproved = false;
        finalUser.isProfileCompleted = false;
        finalUser.institution = '';
        finalUser.gradeLevel = '';
        finalUser.features = [];
        delete finalUser.rejectReason;

        // Un-delete langsung di Supabase via PATCH
        SupabaseDB.updateUserByEmail(email, {
          isDeleted: false,
          status: 'Belum Lengkap',
          isApproved: false,
          isProfileCompleted: false,
          institution: '',
          gradeLevel: '',
          subject: '',
          rejectReason: '',
          features: []
        }).catch(() => {});
      } else {
        // Merge: prioritaskan data Supabase untuk field yang dikelola admin
        finalUser = {
          ...matchedUser,
          id: dbUser.id,
          features: dbUser.features && dbUser.features.length > 0 ? dbUser.features : matchedUser.features,
          subscriptionStart: dbUser.subscriptionStart || matchedUser.subscriptionStart || null,
          subscriptionEnd: dbUser.subscriptionEnd || matchedUser.subscriptionEnd || null,
          status: dbUser.status !== 'Belum Lengkap' ? dbUser.status : matchedUser.status,
          isApproved: dbUser.isApproved !== undefined ? dbUser.isApproved : matchedUser.isApproved,
          isProfileCompleted: dbUser.isProfileCompleted !== undefined ? dbUser.isProfileCompleted : matchedUser.isProfileCompleted,
          institution: dbUser.institution || matchedUser.institution,
          subject: dbUser.subject || matchedUser.subject,
          gradeLevel: dbUser.gradeLevel || matchedUser.gradeLevel,
          name: name,
          avatar: picture
        };
      }
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
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
    if (matchedUser.isProfileCompleted && matchedUser.institution) {
      roleDesc.textContent = "Masuk sebagai Pendidik. Mengalihkan ke Workspace Guru...";
    } else {
      roleDesc.textContent = "Login berhasil! Mengalihkan ke formulir profil...";
    }
  }

  popup.classList.add('active');

  // Pengalihan Otomatis Berdasarkan Role dan Status Profil
  setTimeout(() => {
    if (isAdmin) {
      window.location.href = "../dashboard admin/dashboard admin.html";
    } else {
      if (matchedUser.isProfileCompleted === true && matchedUser.institution && matchedUser.institution !== 'Sekolah / Instansi Guru') {
        window.location.href = "../dashboard pengguna/dashboard pengguna.html";
      } else {
        window.location.href = "../dashboard pengguna/profil.html";
      }
    }
  }, 1200);
}
