# StampPop — Digital Loyalty Stamp SaaS

> **Single-Merchant & Multi-Merchant** — Kartu stamp digital tanpa aplikasi untuk pelanggan. Scan QR, kumpulkan stamp, tukar reward. Berbasis Apple Wallet, Google Wallet, dan Web App.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
![PRD Version](https://img.shields.io/badge/PRD-v1.0-emerald)
![Target Speed](https://img.shields.io/badge/Target%20Stamp-%3C%205s-blue)
![Customer App](https://img.shields.io/badge/Customer%20App-0%20Installs-orange)

---

## 🎯 Ringkasan & Prinsip Produk (PRD v1.0)
1. **0 Aplikasi yang harus diinstal pelanggan**: Hidup langsung di Apple Wallet (`.pkpass`), Google Wallet, atau universal Web Card.
2. **< 30 Detik Target Enroll**: Pelanggan scan QR poster kasir, isi nama & WhatsApp (atau mode tamu), langsung aktif.
3. **< 5 Detik Target Pemberian Stamp**: Staf memindai QR pelanggan melalui PWA Scanner, memasukkan PIN 4 digit, stamp langsung bertambah.
4. **Single Source of Truth**: Saldo stamp dihitung dari buku besar (immutable append-only ledger `StampTransaction`), sinkron real-time untuk Wallet dan Web.
5. **Single & Multi-Tenant**: Satu codebase siap melayani satu brand mandiri maupun platform SaaS multi-merchant dengan Row-Level Security (`tenant_id`).

---

## ⚡ Fitur Utama

### 1. Kartu Loyalitas Pelanggan (Customer Web Card & Wallet Pass)
- **Tampilan Kartu Stamp Fisik Digital**: Visual grid stamp (default 9 slot) dengan segel bintang terisi dan slot hadiah.
- **Dynamic QR Code**: QR unik terenkripsi untuk dipindai oleh kasir saat transaksi.
- **Apple Wallet (.pkpass)**: Generator pass Apple Wallet dengan manifest dan standard payload.
- **Google Wallet**: Integrasi save pass Google Wallet.
- **Riwayat Transaksi**: 10 transaksi terakhir (pemberian stamp, penukaran hadiah, koreksi).
- **Haptic & Sound Celebration**: Suara lonceng dan konfeti saat mencapai target hadiah.

### 2. PWA Scanner Staf Kasir
- **Lensa Kamera QR Belakang**: Menggunakan `html5-qrcode` untuk memindai QR ponsel pelanggan dalam hitungan detik.
- **Login PIN Individual Staf**: Setiap staf/kasir memiliki PIN tersendiri untuk menjamin akuntabilitas audit log.
- **Batas Anti-Fraud Bawaan**: Maksimal 1 stamp per member per 15 menit untuk mencegah duplikasi (bisa di-bypass dengan otorisasi PIN Manager).
- **1-Tap Reward Redemption**: Tombol klaim hadiah otomatis muncul saat stamp mencapai target (mis. 9/9 stamp), mencatat *Redemption*, dan mereset siklus kartu baru tanpa menghapus riwayat.

### 3. Dashboard Pemilik Merchant (Owner & Manager)
- **Executive 5-Question Board (< 10 Detik)**:
  1. Berapa member baru minggu ini?
  2. Berapa total stamp beredar dan outlet mana yang paling aktif?
  3. Berapa reward ditukar & berapa redeem rate-nya?
  4. Berapa persen pelanggan yang kembali (&ge; 2x dalam 30 hari)?
  5. Status anomali dan proteksi anti-fraud.
- **Generator Poster QR Cetak**: Format A4 & Meja (Tent Card) siap cetak langsung dari browser (`window.print()`).
- **Aturan Program**: Ubah target stamp, nama hadiah, dan minimum transaksi.
- **Buku Besar Transaksi & Koreksi**: Koreksi kesalahan input staf hanya oleh Owner/Manager dengan alasan wajib.
- **Export Data**: Unduh CSV member dan buku besar transaksi dengan pencatatan audit log.

### 4. Mode Multi-Tenant & Superadmin
- Pengalihan tenant instan: Kopi Kenangan Senja (Cafe), BarberPop (Barbershop), CleanAuto (Car Wash).
- Status paket langganan (Starter, Growth, SaaS).
- Row-Level Security isolation check.

---

## 🛠️ Stack Teknologi
- **Framework**: React 18 / Vite / TypeScript
- **Styling**: Tailwind CSS, Plus Jakarta Sans
- **Icons & Visuals**: Lucide Icons, Canvas Confetti
- **QR & Scanner**: `qrcode`, `html5-qrcode`
- **Wallet Generator**: `jszip` (Apple Wallet `.pkpass` bundle)
- **Audio Feedback**: Web Audio API (real-time chimes & fanfares)
- **Hosting / Deploy**: Vercel (Team: Tim Fluxy)

---

## 🚀 Menjalankan Secara Lokal

```bash
# Clone repository
git clone https://github.com/ibobatsuga/stamppop.git
cd stamppop

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:3000` di browser.

---

## 📦 Deployment ke Vercel

```bash
# Deploy production ke tim Fluxy
npx vercel --yes --prod --scope fluxyid
```

---

*Dikembangkan untuk Tim Fluxy — PRD Digital Loyalty Stamp SaaS v1.0 (November 2026)*
