# hiru.kop

Generator kop surat dengan pratinjau langsung. Isi detail organisasi, pilih satu dari tiga template, lalu ekspor sebagai **PDF A4 satu halaman** atau **`.docx` yang bisa langsung diedit di Microsoft Word**.

Berjalan sepenuhnya di browser. Tidak ada server, tidak ada proses build, tidak ada dependensi yang perlu dipasang — cukup buka `index.html`.

## Fitur

- **Tiga template** — Resmi, Modern, dan Kreatif
- **Pratinjau langsung** — kertas A4 asli (794 × 1123 px) yang selalu dikecilkan agar muat di layar, jadi tata letaknya persis sama dengan hasil ekspor
- **Dua bentuk ekspor** — PDF untuk dicetak, `.docx` untuk diedit
- **Dua slot logo** — kiri dan kanan, dengan rasio gambar dipertahankan
- **Isi surat multi-paragraf** — pisahkan paragraf dengan baris kosong
- **Nama file ekspor** — bisa diatur, dan cleans up karakter terlarang Windows
- **Autosave** — isian, template, logo, dan pilihan bahasa tersimpan di `localStorage`
- **Dua bahasa** — Indonesia dan Inggris, lewat tombol di header
- **Siap cetak** — `Ctrl+P` menghasilkan surat yang sama persis dengan PDF

## Cara pakai

```
git clone <repo-url>
cd Aplikasi-Kop-Surat
```

Lalu buka `index.html` di browser. Tidak ada langkah pemasangan lain.

Butuh koneksi internet untuk memuat dua pustaka dari CDN. Setelah keduanya ter-cache, aplikasinya tetap berjalan.

## Tumpukan teknologi

HTML, CSS, dan JavaScript biasa — tanpa framework dan tanpa toolchain.

| Pustaka | Versi | Untuk |
|---|---|---|
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | 0.10.1 | Ekspor PDF |
| [docx](https://github.com/dolanmiu/docx) | 8.5.0 | Ekspor Word |

Keduanya dimuat dari CDN dengan **Subresource Integrity** (`integrity` + `crossorigin`) sehingga file yang diterima browser diverifikasi terhadap hash yang dicantumkan di `index.html`.

> **Mengapa `docx` dipin ke 8.5.0?** Mulai versi 9.x, paket `docx` tidak lagi menyediakan build UMD — hanya `dist/index.umd.cjs`. Karena aplikasi ini memuatnya lewat `<script>` dan bergantung pada global `window.docx`, naik ke 9.x akan membuat ekspor Word berhenti bekerja. Naik ke 9.x berarti pindah ke `import` ESM.

## Struktur

```
index.html   Markup + titik pasok terjemahan (data-i18n)
style.css    Tampilan aplikasi + tiga template surat
script.js    Kamus bahasa, pratinjau, dan kedua eksportir
```

Pratinjau, ekspor PDF, dan ekspor Word adalah tiga renderer terpisah yang harus menghasilkan surat yang identik. Semua angka tipografi dikumpulkan di satu objek `TEMPLATE_TOKENS` di `script.js`, lalu dibaca ketiganya — sehingga mengubah ukuran huruf, warna, atau jarak hanya perlu dilakukan di satu tempat.

## Catatan teknis

Bagian ini merekam beberapa jebakan yang sudah ditangani di kode. Semuanya berasal dari `html2canvas`, yang dipakai di balik `html2pdf`.

<details>
<summary><b>1. html2canvas salah menghitung area render → seluruh PDF bergeser</b></summary>

Elemen yang akan dirender diletakkan di luar area layar agar tidak pernah terlihat. `html2canvas` menghitung batas render dari `getBoundingClientRect()` elemen itu, jadi koordinatnya menjadi negatif dan seluruh isi surat bergeser ratusan piksel ke kiri sampai terpotong — nama organisasi, label `Nomor`/`Lampiran`/`Perihal`, dan awal paragraf hilang.

Perbaikannya adalah menentukan kotak render secara eksplisit:

```js
html2canvas: {
  x: 0, y: 0, width: 794, height: 1122,   // wajib
  windowWidth: 794, windowHeight: 1123
}
```

Tanpa keempat properti ini, menggeser posisi host tidak memperbaiki apa pun.
</details>

<details>
<summary><b>2. html2canvas tidak merender <code>&lt;svg&gt;</code> sebaris sama sekali</b></summary>

GELombang atas dan pita warna bawah pada template Modern dihapus begitu saja dari PDF — tanpa error, tanpa peringatan. Gelombang itu `<svg>` sebaris, dan `html2canvas` mengabaikannya.

Solusinya: SVG di-raster sekali ke PNG (3× ukuran tampil) lalu dipasang sebagai `<img>`, yang selalu didukung. Bentuknya tetap sama persis dengan yang dipakai di pratinjau.
</details>

<details>
<summary><b>3. Tinggi 1123px menghasilkan halaman kedua yang kosong</b></summary>

`html2pdf` membagi tinggi konten dengan tinggi halaman lalu memakai `Math.ceil`. Karena `1123 / 1123 = 1.0000000000000002`, hasilnya `2` — dan PDF keluar dua halaman, yang kedua kosong.

Konten ekspor karena itu dikunci ke 1122px, bukan 1123px.
</details>

<details>
<summary><b>4. Spasi tidak bisa mengembalikan kolom di Word</b></summary>

Label `Nomor`, `Lampiran`, `Perihal` pada kolom kiri semula disejajarkan dengan spasi. Arial bersifat proporsional, jadi titik dua-nya tidak pernah lurus.

Perbaikannya memakai tab stop di level dokumen, bukan spasi:

```js
new Paragraph({
  tabStops: [{ type: TabStopType.LEFT, position: 68 * 15 }],  // 1px = 15 twip
  children: [textRun(label), new Tab(), textRun(":"), ...]
});
```
</details>

## Tentang

Proyek tugas sekolah.

Label yang tertanam di dalam surat (`Nomor`, `Lampiran`, `Perihal`, `Kepada Yth.`, `di tempat`) sengaja tidak ikut diterjemahkan, begitu juga format tanggal — isi suratnya tetap bahasa Indonesia di kedua mode bahasa.
