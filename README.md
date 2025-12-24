# Simulasi Antrean Bank (Single-Channel M/M/1)

Aplikasi simulasi interaktif ini memodelkan sistem antrean bank menggunakan model **M/M/1** (Single-Server, Exponential Arrival, Exponential Service). Aplikasi ini dibangun untuk membantu memvisualisasikan bagaimana variasi dalam laju kedatangan nasabah dan kecepatan pelayanan teller mempengaruhi panjang antrean dan waktu tunggu.

![Preview Simulasi](./preview.png)

## 🚀 Fitur Utama

- **Visualisasi Real-time**: Melihat nasabah datang, mengantre, dan dilayani oleh teller dengan animasi indikator status.
- **Kontrol Parameter Dinamis**:
  - **Laju Kedatangan (λ - Lambda)**: Mengatur seberapa sering nasabah datang (orang/menit).
  - **Laju Pelayanan (μ - Mu)**: Mengatur kecepatan teller melayani nasabah (orang/menit).
  - **Kecepatan Simulasi**: Mempercepat waktu simulasi (1x, 5x, 20x) untuk melihat hasil jangka panjang lebih cepat.
- **Statistik Langsung**:
  - Total nasabah dilayani.
  - Rata-rata waktu tunggu.
  - Persentase utilisasi teller (kesibukan).
  - Panjang antrean saat ini.
- **Grafik Kinerja**: Grafik garis yang bergerak secara real-time menunjukkan fluktuasi panjang antrean seiring waktu.
- **Analisis Stabilitas**: Indikator otomatis apakah sistem dalam keadaan stabil atau tidak stabil (berdasarkan Intensitas Trafik ρ).

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan teknologi web modern:

- **[React](https://react.dev/)**: Library UI utama.
- **[TypeScript](https://www.typescriptlang.org/)**: Untuk keamanan tipe dan pengembangan yang lebih robust.
- **[Vite](https://vitejs.dev/)**: Build tool yang sangat cepat untuk pengembangan frontend.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework utility-first untuk styling yang cepat dan responsif.
- **[Recharts](https://recharts.org/)**: Library charting untuk visualisasi data antrean.
- **[Lucide React](https://lucide.dev/)**: Koleksi ikon yang bersih.

## 📦 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- **Node.js** (Versi 16 atau lebih baru direkomendasikan)
- **npm** (biasanya disertakan dengan Node.js)

## 🔧 Instalasi dan Cara Menjalankan

Ikuti langkah-langkah ini untuk menjalankan proyek di komputer lokal Anda:

1.  **Clone atau Unduh** repositori/folder proyek ini.

2.  **Buka Terminal** dan navigasikan ke direktori proyek:

    ```bash
    cd "path/to/Bank_Simulation"
    ```

3.  **Instal Dependensi**:
    Jalankan perintah berikut untuk mengunduh semua library yang diperlukan:

    ```bash
    npm install
    ```

4.  **Jalankan Mode Pengembangan**:
    Mulai server lokal:

    ```bash
    npm run dev
    ```

5.  **Buka di Browser**:
    Klik link yang muncul di terminal (biasanya `http://localhost:5173/`).

## 📚 Teori Singkat (Model M/M/1)

Simulasi ini didasarkan pada Teori Antrean dengan notasi Kendall **M/M/1**:

- **M (Markov/Memoryless)**: Kedatangan nasabah bersifat acak (Distribusi Poisson) dengan waktu antar-kedatangan berdistribusi Eksponensial.
- **M (Markov/Memoryless)**: Waktu pelayanan bersifat acak (Distribusi Eksponensial).
- **1**: Hanya ada satu server (Satu Teller).

**Rumus Penting:**

- **Intensitas Trafik (ρ)**: `ρ = λ / μ`
  - Jika `ρ < 1`: Sistem stabil (antrean tidak akan membesar tanpa batas).
  - Jika `ρ >= 1`: Sistem tidak stabil (antrean akan terus bertambah).

## 📁 Struktur Proyek

```
Bank_Simulation/
├── node_modules/       # Dependensi proyek
├── public/             # Aset statis
├── src/
│   ├── SingleChannelBank.tsx  # Komponen utama simulasi
│   ├── main.tsx              # Entry point React
│   ├── index.css             # Konfigurasi Tailwind & Global CSS
│   └── vite-env.d.ts         # Definisi tipe Vite
├── index.html          # HTML utama
├── package.json        # Manifes proyek dan skrip
├── tailwind.config.js  # Konfigurasi Tailwind
├── tsconfig.json       # Konfigurasi TypeScript
└── vite.config.ts      # Konfigurasi Vite
```

## 📝 Lisensi

Proyek ini dibuat untuk tujuan edukasi dan simulasi. Bebas untuk dimodifikasi dan didistribusikan.
