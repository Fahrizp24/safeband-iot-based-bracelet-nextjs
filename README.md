Pusat sistem Smart Fall Detection ini berjalan pada server lokal di alamat default `http://localhost:3000`.

Berikut adalah *mapping* lengkap URL yang dapat Anda akses di browser untuk melihat masing-masing fitur ke-13 halaman yang telah kita buat:

---

### 🏠 **Area Publik**
1. **Landing Page:**
   👉 `http://localhost:3000/`

2. **Login Portal (Masuk):**
   👉 `http://localhost:3000/auth/login`

3. **Register Portal (Daftar Akun Baru & Integrasi ESP32):**
   👉 `http://localhost:3000/auth/register`

---

### 👨‍👩‍👧 **Sisi Pelanggan (Customer Dashboard)**
*Syarat masuk: Anda harus login ke akun dengan status _Customer/Keluarga_, atau klik langsung link berikut jika sistem middleware mengizinkan (bypass lokal).*

4. **Customer Home (Indikator SAFE/FALL DETECTED):**
   👉 `http://localhost:3000/dashboard/overview`

5. **Live Tracking (Peta / Leaflet):**
   👉 `http://localhost:3000/dashboard/tracking`

6. **Activity Logs (History Sensor):**
   👉 `http://localhost:3000/dashboard/activity`

7. **Emergency Setup (Nomor SOS / WhatsApp):**
   👉 `http://localhost:3000/dashboard/emergency`

8. **Notifications (Notifikasi Baterai & Update):**
   👉 `http://localhost:3000/dashboard/notifications`

---

### 🛡️ **Sisi Sistem Manajemen (Admin Dashboard)**
*Syarat masuk: Anda harus login menggunakan akun email `admin@example.com` (terkalibrasi dalam mock kredensial `src/auth.ts`).*

9.  **Admin Dashboard (Global Stats):**
    👉 `http://localhost:3000/admin/overview`

10. **User Management (Data Pelanggan):**
    👉 `http://localhost:3000/admin/users`

11. **Device Management (Inventori Hardware ESP32):**
    👉 `http://localhost:3000/admin/devices`

12. **System Health (API Uptime Server):**
    👉 `http://localhost:3000/admin/health`

13. **Incident Reports (Log Global Kejadian Jatuh):**
    👉 `http://localhost:3000/admin/incidents`

14. **Broadcast News (Push Notifikasi Sistem):**
    👉 `http://localhost:3000/admin/broadcast`

---
### 🛠️ **Rute API ESP32 (Backend Tapping)**
Endpoint URL (POST/GET) yang bisa dipanggil oleh C++ *script* alat gelang Anda (seperti modul ESP32/WiFi):
👉 **`http://localhost:3000/api/sensor`**

📝 **Cara Menjalankannya Sekarang:**
Buka terminal di dalam VS Code (tekan `Ctrl` + `~`), pastikan posisi direktori sudah benar (*D:\KULIAH\SMT 6\next-shadcn-dashboard-starter-main*), lalu jalankan perintah:

```bash
npm run dev
```
Setelah command tersebut menuliskan pesan "*ready - started server on...*", klik salah satu URL di atas untuk menjelajahinya!