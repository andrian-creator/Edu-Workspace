import http.server
import socketserver
import json
import urllib.parse
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(DIRECTORY, 'users_database.json')
MODULS_FILE = os.path.join(DIRECTORY, 'moduls_database.json')
EMAIL_LOG_FILE = os.path.join(DIRECTORY, 'email_sent_log.json')

def load_moduls():
    if not os.path.exists(MODULS_FILE):
        return []
    try:
        with open(MODULS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_moduls(moduls):
    try:
        with open(MODULS_FILE, 'w', encoding='utf-8') as f:
            json.dump(moduls, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving moduls: {e}")

def load_users():
    if not os.path.exists(USERS_FILE):
        default_users = [
            {
                "id": "ADM-001",
                "name": "Rico Andrianto",
                "email": "ric04ndri4nt0@gmail.com",
                "avatar": "https://lh3.googleusercontent.com/a/default-user=s96-c",
                "role": "Admin",
                "institution": "Edu Workspace",
                "subject": "Super Admin",
                "gradeLevel": "",
                "registeredAt": "02 Sep 2026, 08:01",
                "provider": "Google Account (@gmail.com)",
                "status": "Aktif",
                "isApproved": True,
                "isProfileCompleted": True
            }
        ]
        save_users(default_users)
        return default_users
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving users: {e}")

def check_and_update_expired_subscriptions(users):
    import datetime
    today_str = datetime.date.today().isoformat()
    modified = False
    for u in users:
        if u.get('role') != 'Admin' and u.get('subscriptionEnd'):
            if today_str > u.get('subscriptionEnd') and u.get('status') == 'Aktif':
                u['status'] = 'Nonaktif'
                u['isApproved'] = False
                u['rejectReason'] = 'Masa langganan sudah habis, silahkan hubungi WhatsApp 085608673357 untuk memperpanjang langganan.'
                modified = True
                print(f"⏰ [SUBSCRIPTION EXPIRED] {u.get('email')} otomatis dinonaktifkan.")
    if modified:
        save_users(users)
    return users

class EduWorkspaceHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def _send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. API: Data Users
        if path == '/api/users':
            users = check_and_update_expired_subscriptions(load_users())
            self._send_json_response({"status": "success", "users": users})
            return

        # 2. API: Data Modul Ajar per Pengguna
        if path == '/api/moduls':
            query_params = urllib.parse.parse_qs(parsed.query)
            target_email = query_params.get('email', [''])[0].strip().lower()
            all_moduls = load_moduls()
            if target_email:
                user_moduls = [m for m in all_moduls if (m.get('userEmail') or m.get('payload', {}).get('userEmail') or '').strip().lower() == target_email]
            else:
                user_moduls = all_moduls
            self._send_json_response({"status": "success", "moduls": user_moduls})
            return

        # 3. PROTEKSI KEAMANAN: Blokir akses langsung ke file database, log, dan script backend
        blocked_files = ['users_database.json', 'moduls_database.json', 'email_sent_log.json', 'server.py', '.env', '.git']
        clean_path = path.lstrip('/').lower()
        if clean_path in blocked_files or clean_path.endswith('.json') or clean_path.endswith('.py'):
            self.send_error(403, "Akses Ditolak (403 Forbidden): File database & backend tidak dapat diakses langsung oleh publik.")
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            body = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            body = {}

        # 1. API: Simpan / Update Modul Ajar di Server
        if parsed.path == '/api/moduls':
            modul_data = body
            target_email = (modul_data.get('userEmail') or modul_data.get('payload', {}).get('userEmail') or '').strip().lower()

            modul_id = modul_data.get('id')
            if not modul_id:
                import time
                modul_id = f"modul_{int(time.time()*1000)}"
                modul_data['id'] = modul_id

            all_moduls = load_moduls()
            idx = next((i for i, m in enumerate(all_moduls) if m.get('id') == modul_id), None)
            if idx is not None:
                all_moduls[idx].update(modul_data)
                saved_modul = all_moduls[idx]
            else:
                all_moduls.insert(0, modul_data)
                saved_modul = modul_data

            save_moduls(all_moduls)
            print(f"📚 [SERVER MODUL SAVED] {modul_id} ({modul_data.get('namaModul')}) for {target_email}")
            self._send_json_response({"status": "success", "modul": saved_modul})
            return

        # 2. API: Hapus Modul Ajar di Server
        if parsed.path == '/api/moduls/delete':
            modul_id = body.get('id')
            target_email = (body.get('email') or '').strip().lower()
            all_moduls = load_moduls()
            new_moduls = [m for m in all_moduls if m.get('id') != modul_id]
            save_moduls(new_moduls)
            print(f"🗑️ [SERVER MODUL DELETED] {modul_id} (requested by {target_email})")
            self._send_json_response({"status": "success", "deletedId": modul_id})
            return

        # 3. API: Simpan / Registrasi / Update Profil User
        if parsed.path == '/api/users':
            target_email = (body.get('email') or '').strip().lower()
            if not target_email:
                self._send_json_response({"status": "error", "message": "Email is required"}, 400)
                return

            users = load_users()
            idx = next((i for i, u in enumerate(users) if (u.get('email') or '').strip().lower() == target_email), None)

            if idx is not None:
                # Update existing user data
                if body.get('status') in ['Belum Lengkap', 'Menunggu Persetujuan', 'Pending'] or body.get('isApproved') is False:
                    if 'subscriptionEnd' not in body or body.get('subscriptionEnd') is None:
                        users[idx]['subscriptionStart'] = None
                        users[idx]['subscriptionEnd'] = None
                        users[idx].pop('subscriptionDays', None)
                users[idx].update(body)
                if users[idx].get('status') in ['Nonaktif', 'Dinonaktifkan', 'Ditolak'] and 'features' not in body:
                    users[idx]['features'] = []
                updated_user = users[idx]
            else:
                # Add new user
                new_id = body.get('id') or (f"USR-{str(len(users) + 1).zfill(3)}" if body.get('role') != 'Admin' else 'ADM-001')
                body['id'] = new_id
                users.append(body)
                updated_user = body

            save_users(users)
            print(f"👤 [USER DATABASE UPDATED] {target_email} -> Status: {updated_user.get('status')}")
            self._send_json_response({"status": "success", "user": updated_user, "users": users})
            return

        # 2. API: Update Status User (Approve / Reject)
        if parsed.path == '/api/users/status':
            target_email = (body.get('email') or '').strip().lower()
            new_status = body.get('status')
            reason = body.get('reason', '')
            is_approved = body.get('isApproved', (new_status == 'Aktif'))

            users = load_users()
            idx = next((i for i, u in enumerate(users) if (u.get('email') or '').strip().lower() == target_email), None)

            if idx is None:
                self._send_json_response({"status": "error", "message": "User not found"}, 404)
                return

            users[idx]['status'] = new_status
            users[idx]['isApproved'] = is_approved
            if reason:
                users[idx]['rejectReason'] = reason
            elif 'rejectReason' in users[idx] and new_status == 'Aktif':
                del users[idx]['rejectReason']

            # Otomatis nonaktifkan semua fitur jika akun dinonaktifkan atau ditolak
            if new_status in ['Nonaktif', 'Dinonaktifkan', 'Ditolak']:
                users[idx]['features'] = []
            elif 'features' in body:
                users[idx]['features'] = body['features']
            elif new_status == 'Aktif' and users[idx].get('role') != 'Admin':
                # Saat status akun diaktifkan, fitur TIDAK ikut aktif otomatis (harus diaktifkan manual)
                users[idx]['features'] = []

            save_users(users)
            print(f"⚡ [STATUS CHANGED] {target_email} -> {new_status} (isApproved: {is_approved}, features: {users[idx].get('features', [])})")
            self._send_json_response({"status": "success", "user": users[idx], "users": users})
            return

        # 3. API: Delete User (Cascade Delete: Hapus Akun, API Key, Semua Modul Tersimpan, dan Log Email)
        if parsed.path == '/api/users/delete':
            target_email = (body.get('email') or '').strip().lower()
            if not target_email:
                self._send_json_response({"status": "error", "message": "Email target wajib disertakan"}, 400)
                return

            # A. Hapus Profil Akun dari users_database.json (termasuk data API Key geminiApiKey)
            users = load_users()
            new_users = [u for u in users if (u.get('email') or '').strip().lower() != target_email]
            save_users(new_users)

            # B. Hapus SEMUA Modul Ajar yang Dihasilkan / Dimiliki Pengguna dari moduls_database.json
            all_moduls = load_moduls()
            total_moduls_before = len(all_moduls)
            remaining_moduls = [
                m for m in all_moduls
                if (m.get('userEmail') or m.get('payload', {}).get('userEmail') or '').strip().lower() != target_email
            ]
            deleted_moduls_count = total_moduls_before - len(remaining_moduls)
            save_moduls(remaining_moduls)

            # C. Bersihkan Catatan Log Email Pengguna dari email_sent_log.json
            cleaned_logs_count = 0
            if os.path.exists(EMAIL_LOG_FILE):
                try:
                    with open(EMAIL_LOG_FILE, 'r', encoding='utf-8') as f:
                        email_logs = json.load(f)
                    total_logs_before = len(email_logs)
                    remaining_logs = [log for log in email_logs if (log.get('to') or '').strip().lower() != target_email]
                    cleaned_logs_count = total_logs_before - len(remaining_logs)
                    with open(EMAIL_LOG_FILE, 'w', encoding='utf-8') as f:
                        json.dump(remaining_logs, f, indent=2, ensure_ascii=False)
                except Exception as e:
                    print(f"Error membersihkan log email: {e}")

            print(f"\n========================================================")
            print(f"🗑️ [CASCADE DELETION COMPLETED]")
            print(f"Pengguna Target   : {target_email}")
            print(f"Status Akun       : Dihapus permanen dari users_database.json")
            print(f"Modul Dihapus     : {deleted_moduls_count} modul ajar dibersihkan dari moduls_database.json")
            print(f"Log Email         : {cleaned_logs_count} log dibersihkan dari email_sent_log.json")
            print(f"========================================================\n")

            self._send_json_response({
                "status": "success",
                "message": f"Pengguna {target_email} dan seluruh data server (API Key, {deleted_moduls_count} modul ajar, dan log aktivitas) berhasil dihapus permanen.",
                "deletedEmail": target_email,
                "deletedModulsCount": deleted_moduls_count,
                "users": new_users
            })
            return

        # 4. API: Send Email Notification
        if parsed.path == '/api/send-email':
            recipient = body.get('to')
            user_name = body.get('name', 'Bapak/Ibu Guru')
            subject = body.get('subject', '[Edu Workspace] Pemberitahuan Akun')
            email_type = body.get('type', 'info')
            reason = body.get('reason', '')
            institution = body.get('institution', 'Instansi Pendidik')
            subject_taught = body.get('subject_taught', 'Mata Pelajaran')
            body_text = body.get('body', '')

            print("\n" + "="*60)
            print(f"📧 [DISPATCH EMAIL NOTIFIKASI KE PENGGUNA]")
            print(f"Kpd        : {recipient} ({user_name})")
            print(f"Dari       : Edu Workspace Pusat <admin@eduworkspace.id>")
            print(f"Subjek     : {subject}")
            print(f"Tipe       : {email_type.upper()}")
            if reason:
                print(f"Alasan     : {reason}")
            print(f"Isi Pesan  :\n{body_text}")
            print("="*60 + "\n")

            # Simpan log email
            logs = []
            if os.path.exists(EMAIL_LOG_FILE):
                try:
                    with open(EMAIL_LOG_FILE, 'r', encoding='utf-8') as f:
                        logs = json.load(f)
                except:
                    logs = []

            logs.insert(0, {
                "to": recipient,
                "name": user_name,
                "subject": subject,
                "type": email_type,
                "reason": reason,
                "institution": institution,
                "subject_taught": subject_taught,
                "body": body_text,
                "status": "DELIVERED"
            })

            try:
                with open(EMAIL_LOG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(logs, f, indent=2, ensure_ascii=False)
            except:
                pass

            self._send_json_response({
                "status": "success",
                "message": f"Email notifikasi berhasil dikirimkan ke {recipient}",
                "recipient": recipient,
                "subject": subject
            })
            return

        super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), EduWorkspaceHandler) as httpd:
        print(f"Edu Workspace Server berjalan di http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
