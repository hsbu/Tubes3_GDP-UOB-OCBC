# Judol Detector

Judol Detector adalah extension Chromium/Chrome untuk mendeteksi konten yang berhubungan dengan judi online pada halaman web. Extension ini melakukan pemindaian teks halaman menggunakan beberapa algoritma string matching, menampilkan statistik deteksi di popup, serta mendukung deteksi teks pada gambar melalui OCR.

## Algoritma Utama

### Knuth-Morris-Pratt (KMP)

KMP digunakan untuk exact matching antara teks halaman dan daftar keyword. Implementasi KMP pada project ini membuat tabel failure/border terlebih dahulu untuk setiap keyword. Tabel tersebut menyimpan panjang prefix yang juga suffix pada pattern, sehingga ketika terjadi mismatch, proses pencarian tidak perlu mengulang pencocokan dari awal.

Dengan cara ini, KMP dapat mencari kemunculan keyword secara efisien dalam teks dan tetap mendukung kemunculan yang overlap. Implementasi juga menghitung jumlah perbandingan karakter untuk kebutuhan statistik.

### Boyer-Moore (BM)

Boyer-Moore juga digunakan untuk exact matching keyword, tetapi proses pencocokannya dilakukan dari kanan ke kiri pada pattern. Implementasi BM pada project ini menggunakan last occurrence table, yaitu tabel posisi terakhir setiap karakter di pattern.

Ketika terjadi mismatch, algoritma dapat menggeser pattern berdasarkan posisi terakhir karakter yang gagal dicocokkan. Pada banyak kasus, pendekatan ini membuat BM dapat melewati beberapa karakter sekaligus dan menjadi lebih cepat dibanding pencarian karakter-per-karakter biasa.

## Fitur Singkat

- Scan halaman web dari popup extension.
- Highlight teks yang terdeteksi.
- Tooltip berisi keyword, algoritma, jumlah kemunculan, dan waktu eksekusi.
- Statistik per algoritma pada popup.
- Toggle blur untuk menyamarkan konten terdeteksi.
- Toggle bonus algorithm untuk Aho-Corasick dan Rabin-Karp.
- Toggle OCR untuk membaca teks pada gambar menggunakan Tesseract.js.
- Gambar yang terdeteksi oleh OCR akan dihitamkan.

## Requirement

Pastikan perangkat sudah memiliki:

- Node.js 18 atau lebih baru.
- npm.
- Google Chrome atau browser Chromium lain yang mendukung Manifest V3.

Dependency utama project:

- TypeScript
- Vite
- Preact
- Vitest
- Tesseract.js
- CRXJS Vite Plugin

## Instalasi

Clone atau buka folder project, lalu install dependency:

```bash
npm install
```

## Build Extension

Untuk membuat build production extension:

```bash
npm run build
```

Hasil build akan dibuat di folder:

```text
dist/
```

Untuk mode development dengan rebuild otomatis:

```bash
npm run dev
```

## Cara Load Extension di Chrome

1. Jalankan build terlebih dahulu:

   ```bash
   npm run build
   ```

2. Buka Google Chrome.

3. Masuk ke halaman:

   ```text
   chrome://extensions
   ```

4. Aktifkan **Developer mode** di kanan atas.

5. Klik **Load unpacked**.

6. Pilih folder `dist/` dari project ini.

7. Extension **Judol Detector** akan muncul di daftar extension Chrome.

8. Buka halaman web yang ingin diuji.

9. Klik icon extension, lalu klik **Scan Page**.

## Cara Penggunaan

1. Buka halaman web target.
2. Klik popup **Judol Detector**.
3. Gunakan toggle sesuai kebutuhan:
   - **Bonus ON/OFF** untuk menjalankan atau mematikan Aho-Corasick dan Rabin-Karp.
   - **Blur ON/OFF** untuk menyamarkan konten yang terdeteksi.
   - **OCR ON/OFF** untuk menjalankan atau mematikan deteksi teks pada gambar.
4. Klik **Scan Page**.
5. Lihat total hasil, statistik algoritma, dan chart keyword pada popup.
6. Hover highlight pada halaman untuk melihat detail deteksi.
7. Klik **Clear** untuk membersihkan highlight, blur, dan hasil OCR dari halaman.

## Struktur Project

```text
public/
  manifest.json
  keywords.txt
  images/

src/
  algorithms/
    kmp.ts
    boyer-moore.ts
    regex-match.ts
    levenshtein.ts
    aho-corasick.ts
    rabin-karp.ts

  content/
    scanner.ts
    ocr.ts
    highlighter.ts
    blur.ts
    tooltip.ts

  popup/
    popup.tsx
    popup.css

  shared/
    config.ts
    keywords.ts
    storage.ts
    text-utils.ts
    types.ts
```

## Author

| No. | Nama Panjang | NIM |
| --- | --- | --- |
| 1 | Muhamad Hasbullah Faris | 18223014 |
| 2 | Stanislaus Ardy Bramantyo | 18223057 |
| 3 | Nazwan Siddqi Muttaqin | 18223066 |
