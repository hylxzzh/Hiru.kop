"use strict";

/* ---------------------------------------------------------------------------
 * hiru.kop — Generator Kop Surat
 *
 * Penting: file ini memiliki TIGA renderer (pratinjau DOM, ekspor PDF/HTML,
 * dan ekspor Word) yang harus menghasilkan surat yang sama. Selisih di antara
 * ketiganya dulu tersebar di banyak tempat; sekarang semua angka tipografi
 * dikumpulkan di TEMPLATE_TOKENS. Ubah di satu tempat, ketiga renderer ikut.
 * ------------------------------------------------------------------------- */

const PAPER_WIDTH = 794;
const PAPER_HEIGHT = 1123;
/* Tinggi isi untuk hasil ekspor. Sengaja 1px lebih kecil dari PAPER_HEIGHT:
 * html2pdf membagi tinggi konten dengan tinggi halaman lalu memakai
 * Math.ceil, dan 1123/1123 = 1.0000000000000002 sehingga ceil-nya 2 dan
 * muncul halaman kedua yang kosong. */
const EXPORT_HEIGHT = 1122;
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const STORAGE_KEY = "hiru.kop/v1";
const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const MAX_LOGO_EDGE = 600;
const WORD_LOGO_EDGE = 200;
const CONTACT_ICONS = ["⌖", "☎", "✉", "↗"];

/* Nama berkas yang ditolak Windows sehingga unduhan tidak hilang diam-diam. */
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/* Nilai taken langsung dari style.css agar pratinjau dan ekspor selalu sama. */
const TEMPLATE_TOKENS = {
  official: {
    paperColor: "#ffffff",
    ink: "#191919",
    mutedInk: "#383838",
    footerInk: "#555555",
    padding: "58px 57px 55px",
    padTop: 58,
    padRight: 57,
    padBottom: 55,
    logoSize: 68,
    logoCell: 77,
    headGap: 14,
    headMinHeight: 112,
    identityAlign: "center",
orgFont: "700 19px/1.2 'Times New Roman', Times, serif",
    orgWordFont: 'Times New Roman',
    orgTransform: "uppercase",
    subtitleFont: "700 11px/1.3 'Times New Roman', Times, serif",
    subtitleWordFont: 'Times New Roman',
    subtitleWeight: 700,
    subtitleInk: "#242424",
    subtitleSpacing: "normal",
    subtitleMarginTop: 4,
    contactFont: "9px/1.35 Arial, sans-serif",
    contactInk: "#383838",
    contactGap: 7,
    contactMarginTop: 3,
    contactIcons: false,
    contactJustify: "center",
    rule: "double",
    ruleInk: "#171717",
    ruleTop: 12,
    ruleBottom: 25,
    metaFont: "11px/1.55 Arial, sans-serif",
    metaTop: 0,
    copyFont: "11px/1.55 Arial, sans-serif",
    copyAlign: "justify",
    copyIndent: 30,
    copyGap: 11,
    signatureFont: "11px/1.5 Arial, sans-serif",
    signatureSide: "right",
    signatureGap: 35,
    signoffHeight: 20,
    signerGap: 76,
    footerFont: "9px Arial, sans-serif",
    footerInset: 57,
    footerBottom: 29,
    band: false
  },
  modern: {
    paperColor: "#ffffff",
    ink: "#191919",
    mutedInk: "#333333",
    footerInk: "#555555",
    padding: "43px 57px 55px",
    padTop: 43,
    padRight: 57,
    padBottom: 55,
    logoSize: 68,
    logoCell: 74,
    headGap: 14,
    headMinHeight: 82,
    identityAlign: "left",
orgFont: "700 17px/1.2 'DM Sans', Arial, sans-serif",
    orgWordFont: "Arial",
    orgTransform: "uppercase",
    subtitleFont: "600 9px/1.5 'DM Sans', Arial, sans-serif",
    subtitleWordFont: "Arial",
    subtitleWeight: 600,
    subtitleInk: "#191919",
    subtitleSpacing: ".08em",
    subtitleMarginTop: 4,
    contactFont: "8px/1.35 'DM Sans', Arial, sans-serif",
    contactInk: "#333333",
    contactGap: 6,
    contactColumn: 200,
    iconInk: "#17304a",
    contactMarginTop: 3,
    contactIcons: true,
    contactJustify: "flex-start",
    rule: "wave",
    ruleInk: "#17304a",
    ruleTop: 10,
    ruleBottom: 0,
    metaFont: "11px/1.55 'DM Sans', Arial, sans-serif",
    metaTop: 22,
    copyFont: "10.5px/1.15 'DM Sans', Arial, sans-serif",
    copyAlign: "justify",
    copyIndent: 0,
    copyGap: 10,
    signatureFont: "11px/1.5 'DM Sans', Arial, sans-serif",
    signatureSide: "left",
    signatureGap: 28,
    signoffHeight: 20,
    signerGap: 73,
    footerFont: "9px Arial, sans-serif",
    footerInset: 57,
    footerBottom: 66,
    band: true
  },
  creative: {
    paperColor: "#fbf5e9",
    ink: "#34332f",
    mutedInk: "#655f55",
    footerInk: "#6b6255",
    padding: "72px 69px 64px",
    padTop: 72,
    padRight: 69,
    padBottom: 64,
    logoSize: 54,
    logoCell: 58,
    headGap: 12,
    headMinHeight: 145,
    headPadTop: 4,
    identityAlign: "center",
orgFont: "600 33px/1.12 'Cormorant Garamond', Georgia, serif",
    orgWordFont: "Georgia",
    orgTransform: "none",
    subtitleFont: "500 9px/1.5 'DM Sans', Arial, sans-serif",
    subtitleWordFont: "Arial",
    subtitleWeight: 500,
    subtitleInk: "#34332f",
    subtitleSpacing: ".24em",
    subtitleMarginTop: 9,
    contactFont: "8px/1.4 'DM Sans', Arial, sans-serif",
    contactInk: "#655f55",
    contactGap: 7,
    contactMarginTop: 5,
    contactIcons: false,
    contactJustify: "center",
    rule: "hairline",
    ruleInk: "#c9bba3",
    ruleTop: 0,
    ruleBottom: 30,
    metaFont: "11px/1.55 'DM Sans', Arial, sans-serif",
    metaTop: 0,
    copyFont: "11px/1.5 'DM Sans', Arial, sans-serif",
    copyAlign: "left",
    copyIndent: 0,
    copyGap: 15,
    signatureFont: "11px/1.5 'DM Sans', Arial, sans-serif",
    signatureSide: "left",
    signatureGap: 32,
    signoffHeight: 20,
    signerGap: 72,
    footerFont: "9px 'DM Sans', Arial, sans-serif",
    footerInset: 57,
    footerBottom: 29,
    band: false
  }
};

/* --------------------------------------------------------------------------
 * Bahasa
 *
 * Atribut yang dibaca: data-i18n (teks), data-i18n-placeholder,
 * data-i18n-aria-label, dan data-i18n-meta.
 *
 * PENTING: label yang tertanam di dalam surat ("Nomor", "Lampiran",
 * "Perihal", "Kepada Yth.", "di tempat") sengaja TIDAK diterjemahkan, dan
 * format tanggal tetap id-ID. Isi suratnya tetap bahasa Indonesia di semua
 * mode bahasa — ini keputusan yang sudah disepakati.
 * ------------------------------------------------------------------------- */

const I18N = {
  id: {
    "meta.title": "hiru.kop — Generator Kop Surat",
    "meta.description": "Buat kop surat profesional dengan tiga template dan ekspor PDF.",
    "topbar.note": "RUANG KREASI DOKUMEN",
    "a11y.brand": "hiru.kop, beranda",
    "a11y.langGroup": "Bahasa",
    "a11y.paper": "Pratinjau surat",
    "eyebrow.editor": "EDITOR SURAT",
    "eyebrow.result": "HASIL AKHIR",
    "h1.lead": "Generator",
    "h1.accent": "Kop Surat",
    "h2.lead": "Pratinjau",
    "h2.accent": "kertas",
    intro: "Rancang surat dengan karakter. Isi detail organisasi dan lihat hasilnya secara langsung.",
    "template.label": "Pilih Template",
    "template.official": "Template 1 — Resmi",
    "template.modern": "Template 2 — Modern",
    "template.creative": "Template 3 — Kreatif",
    "legend.identity": "IDENTITAS ORGANISASI",
    "legend.contact": "INFORMASI KONTAK",
    "legend.letter": "DETAIL SURAT",
    "legend.sign": "PENUTUP & TANDA TANGAN",
    "label.organization": "Nama organisasi",
    "label.subtitle": "Nama instansi / tagline",
    "label.logoLeft": "Unggah logo kiri",
    "label.logoRight": "Unggah logo kanan",
    "label.address": "Alamat",
    "label.phone": "Telepon",
    "label.email": "Email",
    "label.website": "Website",
    "label.letterNumber": "Nomor surat",
    "label.attachment": "Lampiran",
    "label.city": "Kota penanda tangan",
    "label.recipient": "Tujuan surat",
    "label.subject": "Perihal",
    "label.bodyText": "Isi surat",
    "label.closing": "Kalimat penutup",
    "label.signerTitle": "Jabatan penanda tangan",
    "label.signerName": "Nama penanda tangan",
    "note.city": "Dipakai pada baris tanggal surat",
    "note.bodyText": "Pisahkan paragraf dengan baris kosong",
    footnote: "Semua perubahan tersimpan langsung di pratinjau.",
    "filename.label": "Nama file ekspor",
    "filename.help": "Nama ini digunakan untuk file PDF dan Word.",
    "filename.placeholder": "Contoh: surat-undangan",
    "footer.attributionLead": "Generator Kop Surat By",
    "footer.attributionYear": "2k26",
    "caption.ready": "SIAP UNTUK DICETAK",
    "ph.organization": "Nama organisasi",
    "ph.subtitle": "Nama instansi atau tagline",
    "ph.address": "Alamat lengkap",
    "ph.phone": "Nomor telepon",
    "ph.email": "Alamat email",
    "ph.website": "Alamat website",
    "ph.letterNumber": "Nomor surat",
    "ph.attachment": "Jumlah lampiran",
    "ph.city": "Kota penanda tangan",
    "ph.recipient": "Yth. ...",
    "ph.subject": "Perihal surat",
    "ph.bodyText": "Tuliskan isi surat...",
    "ph.closing": "Contoh: Hormat kami,",
    "ph.signerTitle": "Jabatan",
    "ph.signerName": "Nama lengkap",
    "msg.pdfUnavailable": "Library PDF belum tersedia. Periksa koneksi internet lalu coba lagi.",
    "msg.pdfFailed": "PDF gagal dibuat. Silakan coba lagi.",
    "msg.wordUnavailable": "Library Word belum tersedia. Periksa koneksi internet lalu coba lagi.",
    "msg.logoNotImage": "Pilih berkas gambar untuk logo.",
    "msg.logoUnreadable": "Logo tidak dapat dibaca. Silakan pilih gambar lain.",
    "msg.logoNotPrepared": "Logo tidak dapat disiapkan.",
    "msg.logoUnsupported": "Format gambar logo tidak didukung.",
    "msg.wordLogoFailed": "Logo tidak dapat disiapkan untuk dokumen Word.",
    "msg.logoNotRead": "Logo tidak dapat dibaca.",
    "msg.logoNotConverted": "Logo tidak dapat dikonversi.",
    "msg.canvasUnavailable": "Kanvas tidak tersedia.",
    "msg.decorationFailed": "Dekorasi tidak dapat dirender.",
    "sample.organization": "Yayasan Cakrawala Nusantara",
    "sample.subtitle": "LEMBAGA PENDIDIKAN DAN KEBUDAYAAN",
    "sample.address": "Jl. Melati No. 18, Bandung, Jawa Barat",
    "sample.subject": "Permohonan Kerja Sama Program Literasi",
    "sample.bodyText": "Dengan hormat,\n\nDalam rangka meningkatkan minat baca dan memperluas akses literasi bagi generasi muda, kami bermaksud mengajak Bapak/Ibu untuk menjalin kerja sama dalam Program Literasi Cakrawala.\n\nBesar harapan kami agar rencana ini dapat memperoleh dukungan dan ditindaklanjuti bersama. Atas perhatian serta kerja sama yang baik, kami ucapkan terima kasih.",
    "sample.closing": "Hormat kami,",
    "sample.signerTitle": "Ketua Yayasan",
    /* Yang sengaja sama di semua bahasa: nomor surat & Instantiate Format,
     * nama kota, telepon, email, website, nama orang, serta "Lampiran" dan
     * "Tujuan surat" yang berpasangan dengan label surat yang tidak
     * diterjemahkan. */
    "sample.letterNumber": "014/YCN/IX/2026",
    "sample.phone": "(022) 7000 1234",
    "sample.email": "halo@cakrawala.id",
    "sample.website": "www.cakrawala.id",
    "sample.city": "Bandung",
    "sample.attachment": "1 berkas",
    "sample.recipient": "Yth. Kepala Dinas Pendidikan\nKota Bandung",
    "sample.signerName": "Aditya Pranawa, S.Sos."
  },

  en: {
    "meta.title": "hiru.kop — Letterhead Generator",
    "meta.description": "Create a professional letterhead with three templates and PDF export.",
    "topbar.note": "DOCUMENT DESIGN STUDIO",
    "a11y.brand": "hiru.kop, home",
    "a11y.langGroup": "Language",
    "a11y.paper": "Letter preview",
    "eyebrow.editor": "LETTER EDITOR",
    "eyebrow.result": "FINAL OUTPUT",
    "h1.lead": "Generator",
    "h1.accent": "Letterhead",
    "h2.lead": "Preview",
    "h2.accent": "the letter",
    intro: "Design a letter with character. Fill in your organization details and see the result instantly.",
    "template.label": "Choose Template",
    "template.official": "Template 1 — Formal",
    "template.modern": "Template 2 — Modern",
    "template.creative": "Template 3 — Creative",
    "legend.identity": "ORGANIZATION IDENTITY",
    "legend.contact": "CONTACT INFORMATION",
    "legend.letter": "LETTER DETAILS",
    "legend.sign": "CLOSING & SIGNATURE",
    "label.organization": "Organization name",
    "label.subtitle": "Institution name / tagline",
    "label.logoLeft": "Upload left logo",
    "label.logoRight": "Upload right logo",
    "label.address": "Address",
    "label.phone": "Phone",
    "label.email": "Email",
    "label.website": "Website",
    "label.letterNumber": "Letter number",
    "label.attachment": "Attachment",
    "label.city": "Signatory city",
    "label.recipient": "Recipient",
    "label.subject": "Subject",
    "label.bodyText": "Letter body",
    "label.closing": "Closing line",
    "label.signerTitle": "Signatory title",
    "label.signerName": "Signatory name",
    "note.city": "Used on the letter's date line",
    "note.bodyText": "Separate paragraphs with a blank line",
    footnote: "Every change is reflected in the preview instantly.",
    "filename.label": "Export filename",
    "filename.help": "This name is used for both the PDF and Word files.",
    "filename.placeholder": "Example: official-letter",
    "footer.attributionLead": "Letterhead Generator By",
    "footer.attributionYear": "2k26",
    "caption.ready": "READY TO PRINT",
    "ph.organization": "Organization name",
    "ph.subtitle": "Institution name or tagline",
    "ph.address": "Full address",
    "ph.phone": "Phone number",
    "ph.email": "Email address",
    "ph.website": "Website address",
    "ph.letterNumber": "Letter number",
    "ph.attachment": "Number of attachments",
    "ph.city": "Signatory city",
    "ph.recipient": "Yth. ...",
    "ph.subject": "Subject of the letter",
    "ph.bodyText": "Write the letter body...",
    "ph.closing": "Example: Hormat kami,",
    "ph.signerTitle": "Title",
    "ph.signerName": "Full name",
    "msg.pdfUnavailable": "The PDF library is unavailable. Check your internet connection and try again.",
    "msg.pdfFailed": "Could not create the PDF. Please try again.",
    "msg.wordUnavailable": "The Word library is unavailable. Check your internet connection and try again.",
    "msg.logoNotImage": "Choose an image file for the logo.",
    "msg.logoUnreadable": "The logo could not be read. Please choose another image.",
    "msg.logoNotPrepared": "The logo could not be prepared.",
    "msg.logoUnsupported": "This logo image format is not supported.",
    "msg.wordLogoFailed": "The logo could not be prepared for the Word document.",
    "msg.logoNotRead": "The logo could not be read.",
    "msg.logoNotConverted": "The logo could not be converted.",
    "msg.canvasUnavailable": "Canvas is unavailable.",
    "msg.decorationFailed": "The decoration could not be rendered.",
    "sample.organization": "Cakrawala Nusantara Foundation",
    "sample.subtitle": "INSTITUTE OF EDUCATION AND CULTURE",
    "sample.address": "18 Melati Street, Bandung, West Java",
    "sample.subject": "Literacy Program Partnership Request",
    "sample.bodyText": "Dear Sir or Madam,\n\nIn order to increase reading interest and expand literacy access for the younger generation, we would like to invite you to partner with us in the Cakrawala Literacy Program.\n\nWe sincerely hope this plan will receive your support and be followed through. Thank you for your attention and kind cooperation.",
    "sample.closing": "Sincerely,",
    "sample.signerTitle": "Chairman of the Foundation",
    "sample.letterNumber": "014/YCN/IX/2026",
    "sample.phone": "(022) 7000 1234",
    "sample.email": "halo@cakrawala.id",
    "sample.website": "www.cakrawala.id",
    "sample.city": "Bandung",
    "sample.attachment": "1 berkas",
    "sample.recipient": "Yth. Kepala Dinas Pendidikan\nKota Bandung",
    "sample.signerName": "Aditya Pranawa, S.Sos."
  }
};

const SUPPORTED_LANGUAGES = ["id", "en"];
const DEFAULT_LANGUAGE = "id";
let currentLanguage = DEFAULT_LANGUAGE;

/* Nama field yang isinya adalah data contoh, bukan milik pengguna. */
const SAMPLE_FIELDS = [
  "organization", "subtitle", "address", "phone", "email", "website",
  "letterNumber", "attachment", "city", "recipient", "subject", "bodyText",
  "closing", "signerTitle", "signerName"
];

function t(key) {
  const table = I18N[currentLanguage];
  return (table && table[key]) || I18N[DEFAULT_LANGUAGE][key] || key;
}

const textNodes = [...document.querySelectorAll("[data-i18n]")];
const placeholderNodes = [...document.querySelectorAll("[data-i18n-placeholder]")];
const ariaLabelNodes = [...document.querySelectorAll("[data-i18n-aria-label]")];
const metaDescription = document.querySelector('meta[name="description"][data-i18n-meta]');
const descriptionKey = metaDescription ? metaDescription.dataset.i18nMeta : "";
const langButtons = [...document.querySelectorAll(".lang-option")];
const documentTitle = document.querySelector("title");

function applyLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    language = DEFAULT_LANGUAGE;
  }
  currentLanguage = language;

  textNodes.forEach((node) => { node.textContent = t(node.dataset.i18n); });
  placeholderNodes.forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  ariaLabelNodes.forEach((node) => { node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel)); });
  if (metaDescription) {
    metaDescription.setAttribute("content", t(descriptionKey));
  }
  if (documentTitle) {
    documentTitle.textContent = t("meta.title");
  }

  document.documentElement.lang = language;
  langButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === language));
  });
}

/* Seed data contoh ke field yang masih kosong. Dipanggil setelah
 * restoreState() supaya nilai yang tersimpan tidak tertimpa. */
function seedSamples(language) {
  const table = I18N[language] || I18N[DEFAULT_LANGUAGE];
  SAMPLE_FIELDS.forEach((name) => {
    const field = fields[name];
    const value = table[`sample.${name}`];
    if (field && value !== undefined && field.value === "") {
      field.value = value;
    }
  });
}

/* Saat ganti bahasa, sebuah field hanya ditimpa bila nilainya masih persis
 * sama dengan data contoh bahasa LAMA. Isi yang sudah diedit pengguna tidak
 * pernah disentuh. */
function swapSampleContent(from, to) {
  const before = I18N[from];
  const after = I18N[to];
  if (!before || !after) {
    return;
  }
  SAMPLE_FIELDS.forEach((name) => {
    const field = fields[name];
    const key = `sample.${name}`;
    if (field && before[key] !== undefined && field.value === before[key] && after[key] !== undefined) {
      field.value = after[key];
    }
  });
}

function setLanguage(language) {
  if (language === currentLanguage) {
    return;
  }
  swapSampleContent(currentLanguage, language);
  applyLanguage(language);
  updateLetter();
  scheduleSave();
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

const form = document.querySelector("#letter-form");
const paper = document.querySelector("#letter-paper");
const paperStage = document.querySelector(".paper-stage");
const templateSelect = document.querySelector("#template");
const downloadButton = document.querySelector("#download-pdf");
const docButton = document.querySelector("#download-doc");
const filenameInput = document.querySelector("#export-filename");

const fields = {
  organization: document.querySelector("#organization"),
  subtitle: document.querySelector("#subtitle"),
  address: document.querySelector("#address"),
  phone: document.querySelector("#phone"),
  email: document.querySelector("#email"),
  website: document.querySelector("#website"),
  letterNumber: document.querySelector("#letter-number"),
  attachment: document.querySelector("#attachment"),
  city: document.querySelector("#city"),
  recipient: document.querySelector("#recipient"),
  subject: document.querySelector("#subject"),
  bodyText: document.querySelector("#body-text"),
  closing: document.querySelector("#closing"),
  signerTitle: document.querySelector("#signer-title"),
  signerName: document.querySelector("#signer-name")
};

const bindTargets = [...document.querySelectorAll("[data-bind]")];
const dateTargets = [...document.querySelectorAll("[data-date]")];
const bodyTargets = [...document.querySelectorAll("[data-body]")];
const logoFiles = {
  left: document.querySelector("#logo-left"),
  right: document.querySelector("#logo-right")
};
const logoUrls = { left: "", right: "" };

/* --------------------------------------------------------------------------
 * Tanggal
 * ----------------------------------------------------------------------- */

function formatToday() {
  return new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getLetterDate() {
  const city = fields.city.value.trim();
  const date = formatToday();
  return city ? `${city}, ${date}` : date;
}

function updateDate() {
  const value = getLetterDate();
  dateTargets.forEach((target) => {
    target.textContent = value;
  });
}

/* --------------------------------------------------------------------------
 * Pratinjau
 * ----------------------------------------------------------------------- */

function splitParagraphs(value) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function updateText(name) {
  const value = fields[name].value.trim();
  bindTargets
    .filter((target) => target.dataset.bind === name)
    .forEach((target) => {
      target.textContent = value;
    });
}

function updateBody() {
  const paragraphs = splitParagraphs(fields.bodyText.value);

  bodyTargets.forEach((target) => {
    target.replaceChildren(...paragraphs.map((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      return element;
    }));
  });
}

function updateLogos() {
  const leftLogos = document.querySelectorAll(".logo-left, .logo-modern");
  const rightLogos = document.querySelectorAll(".logo-right");
  const modernLogoUrl = logoUrls.left || logoUrls.right;
  const organization = fields.organization.value.trim();

  leftLogos.forEach((logo) => {
    const isModern = logo.classList.contains("logo-modern");
    const source = isModern ? modernLogoUrl : logoUrls.left;
    logo.hidden = !source;
    logo.src = source || EMPTY_IMAGE;
    logo.alt = isModern
      ? (organization ? `Logo ${organization}` : "Logo organisasi")
      : (organization ? `Logo ${organization}` : "Logo organisasi");
  });

  rightLogos.forEach((logo) => {
    logo.hidden = !logoUrls.right;
    logo.src = logoUrls.right || EMPTY_IMAGE;
    logo.alt = organization
      ? `Logo pendamping ${organization}`
      : "Logo pendamping";
  });
}

function updateLetter() {
  Object.keys(fields).forEach(updateText);
  updateBody();
  updateLogos();
  updateDate();
}

/* Kertas selalu selebar A4 asli (794px) lalu dikecilkan agar muat di panel.
 * Dihitung dari clientWidth (tidak memasukkan scrollbar) supaya stabil dan
 * tidak berfeedback ketika scrollbar muncul atau hilang. */
function updatePaperScale() {
  const styles = window.getComputedStyle(paperStage);
  const available = paperStage.clientWidth
    - parseFloat(styles.paddingLeft)
    - parseFloat(styles.paddingRight);
  const scale = Math.min(1, available / PAPER_WIDTH);
  paper.style.setProperty("--paper-scale", String(Math.max(scale, 0.1)));
}

/* --------------------------------------------------------------------------
 * Logo
 * ----------------------------------------------------------------------- */

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(t("msg.logoNotRead")));
      }
    });
    reader.addEventListener("error", () => {
      reject(new Error(t("msg.logoUnreadable")));
    });
    reader.readAsDataURL(file);
  });
}

function canvasToDataUrl(canvas, mime) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(t("msg.logoUnsupported")));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error(t("msg.logoNotConverted")));
        }
      });
      reader.addEventListener("error", () => {
        reject(new Error(t("msg.logoNotConverted")));
      });
      reader.readAsDataURL(blob);
    }, mime, 0.92);
  });
}

/* Memperkecil logo yang melebihi MAX_LOGO_EDGE. Tanpa ini foto 20 MB menjadi
 * data URL raksasa yang membuat html2canvas dan .docx berat, bahkan bisa gagal
 * karena batas ukuran kanvas di beberapa peramban. */
async function normalizeLogo(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error(t("msg.logoNotImage"));
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error(`Ukuran logo maksimal ${Math.round(MAX_LOGO_BYTES / 1024 / 1024)} MB.`);
  }

  const source = await readAsDataUrl(file);
  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error(t("msg.logoUnreadable"));
  }

  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longest || longest <= MAX_LOGO_EDGE) {
    return source;
  }

  const scale = MAX_LOGO_EDGE / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(t("msg.logoNotPrepared"));
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const keepAlpha = /^image\/(png|gif|svg\+xml|webp)$/i.test(file.type);
  return canvasToDataUrl(canvas, keepAlpha ? "image/png" : "image/jpeg");
}

async function handleLogoUpload(side) {
  const input = logoFiles[side];
  const file = input.files[0];
  if (!file) {
    return;
  }
  try {
    logoUrls[side] = await normalizeLogo(file);
    updateLogos();
    scheduleSave();
  } catch (error) {
    window.alert(error.message || "Logo tidak dapat dibaca.");
  } finally {
    input.value = "";
  }
}

/* --------------------------------------------------------------------------
 * Penyimpanan lokal
 * ----------------------------------------------------------------------- */

let saveTimer = 0;

function scheduleSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveState, 400);
}

function saveState() {
  const values = {};
  Object.keys(fields).forEach((name) => {
    values[name] = fields[name].value;
  });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      values,
      template: templateSelect.value,
      filename: filenameInput.value,
      lang: currentLanguage,
      logos: logoUrls
    }));
  } catch {
    /* kuota penuh atau localStorage diblokir (mode privat) — abaikan */
  }
}

function restoreState() {
  let payload = null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }

  Object.keys(fields).forEach((name) => {
    const value = payload.values?.[name];
    if (typeof value === "string") {
      fields[name].value = value;
    }
  });
  if (TEMPLATE_TOKENS[payload.template]) {
    templateSelect.value = payload.template;
  }
  if (typeof payload.filename === "string" && payload.filename) {
    filenameInput.value = payload.filename;
  }
  if (typeof payload.logos?.left === "string") {
    logoUrls.left = payload.logos.left;
  }
  if (typeof payload.logos?.right === "string") {
    logoUrls.right = payload.logos.right;
  }
  return SUPPORTED_LANGUAGES.includes(payload.lang) ? payload.lang : null;
}

/* --------------------------------------------------------------------------
 * Data & util
 * ----------------------------------------------------------------------- */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getLetterData() {
  const value = (name) => fields[name].value.trim();

  return {
    template: templateSelect.value,
    tokens: TEMPLATE_TOKENS[templateSelect.value],
    organization: value("organization"),
    subtitle: value("subtitle"),
    address: value("address"),
    phone: value("phone"),
    email: value("email"),
    website: value("website"),
    letterNumber: value("letterNumber"),
    attachment: value("attachment"),
    city: value("city"),
    recipient: value("recipient"),
    subject: value("subject"),
    paragraphs: splitParagraphs(fields.bodyText.value),
    closing: value("closing"),
    signerTitle: value("signerTitle"),
    signerName: value("signerName"),
    date: getLetterDate(),
    logoLeft: logoUrls.left,
    logoRight: logoUrls.right
  };
}

/* --------------------------------------------------------------------------
 * Ekspor PDF/HTML
 *
 * HTML ini dirender di luar layar lalu difoto html2canvas, jadi tidak boleh
 * bergantung pada style.css. Semua nilai diambil dari TEMPLATE_TOKENS.
 * ----------------------------------------------------------------------- */

function imageMarkup(source, size, alignment = "center") {
  if (!source) {
    return "";
  }
  const margin = alignment === "left"
    ? "0 auto 0 0"
    : alignment === "right"
      ? "0 0 0 auto"
      : "0 auto";
  return `<img src="${escapeHtml(source)}" alt="" style="display:block;width:${size}px;height:${size}px;object-fit:contain;margin:${margin};">`;
}

function paragraph(text, style = "", className = "") {
  const attr = className ? ` class="${className}"` : "";
  return `<p${attr} style="margin:0;${style}">${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function contactMarkup(tokens, data) {
  const rows = tokens.contactIcons
    ? [data.address, data.phone, data.email, data.website]
      .map((value, index) => ({ icon: CONTACT_ICONS[index], parts: [value] }))
    : [{ parts: [data.address] }, { parts: [data.phone, data.email] }];

  return rows
    .filter((row) => row.parts.some((part) => part && part.trim()))
    .map((row) => {
      const icon = row.icon
        ? `<span style="display:inline-block;flex:0 0 10px;width:10px;color:${tokens.iconInk};text-align:center;font-size:10px;">${row.icon}</span>`
        : "";
      const parts = row.parts
        .filter((part) => part && part.trim())
        .map((part) => `<span>${escapeHtml(part)}</span>`)
        .join("");
      return `<p class="kop-contact" style="display:flex;gap:${tokens.contactGap}px;justify-content:${tokens.contactJustify};align-items:flex-start;margin:${tokens.contactMarginTop}px 0 0;color:${tokens.contactInk};font:${tokens.contactFont};">${icon}${parts}</p>`;
    })
    .join("");
}

function ruleMarkup(tokens) {
  const margin = `margin:${tokens.ruleTop}px 0 ${tokens.ruleBottom}px;`;
  if (tokens.rule === "hairline") {
    return `<div class="kop-rule" style="height:1px;${margin}background:${tokens.ruleInk};"></div>`;
  }
  /* Hanya dua <div> anak yang diberi warna. Kalau warna dipasang pada
   * pembungkus, celah 3px di antaranya ikut terisi dan garis kop jadi
   * satu blok hitam solid. */
  return `<div class="kop-rule" style="${margin}"><div style="height:2px;background:${tokens.ruleInk};"></div><div style="height:1px;margin-top:3px;background:${tokens.ruleInk};"></div></div>`;
}

function waveMarkup(tokens) {
  const margin = `margin:${tokens.ruleTop}px -${tokens.padRight}px 0;`;
  if (decorationImages.wave) {
    return `<img class="kop-rule kop-wave" src="${decorationImages.wave}" alt="" style="display:block;${margin}width:calc(100% + ${tokens.padRight * 2}px);height:41px;">`;
  }
  return `<div class="kop-rule kop-wave" style="${margin}height:41px;">
    <svg viewBox="0 0 760 48" preserveAspectRatio="none" style="display:block;width:100%;height:100%;">
      <path fill="#e7e8eb" d="M0 13C150 45 238-1 380 19s252 24 380-4v33H0Z"/>
      <path fill="#17304a" d="M0 25c150 22 242-12 376 4s244 13 384-6v25H0Z"/>
      <path fill="#a82e3f" d="M0 33c158 15 240-7 377 5s255 9 383-5v15H0Z"/>
    </svg>
  </div>`;
}

/* Pita warna bawah template modern. Di pratinjau ini dibuat dengan clip-path
 * pada .letter-footer::before / ::after, yang lebarnya keluar dari padding
 * dan duduk 37px di bawah kotak footer. Karena html2canvas tidak mendukung
 * clip-path maupun SVG, pita diekspor sebagai gambar PNG. `bottom` dihitung
 * dari footerBottom - 37, bukan dari footerBottom. */
function bandMarkup(tokens) {
  if (!tokens.band) {
    return "";
  }
  const bottom = tokens.footerBottom - 37;
  if (decorationImages.navy) {
    return `<img aria-hidden="true" src="${decorationImages.navy}" alt="" style="position:absolute;right:0;bottom:${bottom}px;left:0;display:block;width:${PAPER_WIDTH}px;height:42px;">
    <img aria-hidden="true" src="${decorationImages.red}" alt="" style="position:absolute;right:0;bottom:${bottom}px;left:0;display:block;width:${PAPER_WIDTH}px;height:35px;">`;
  }
  const svg = (height, points) =>
    `<svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" style="display:block;width:100%;height:100%;"><polygon fill="currentColor" points="${points}"/></svg>`;
  return `<div aria-hidden="true" style="position:absolute;right:0;bottom:${bottom}px;left:0;height:42px;color:#17304a;">${svg(42, "0,10.08 29,23.1 57,13.44 100,24.36 100,42 0,42")}</div>
    <div aria-hidden="true" style="position:absolute;right:0;bottom:${bottom}px;left:0;height:35px;color:#a82e3f;">${svg(35, "0,12.6 28,23.8 58,15.05 100,24.5 100,35 0,35")}</div>`;
}

/* Lebar kolom kontak di pratinjau. Pratinjau bisa di-zoom, jadi hasilnya
 * dibagi faktor zoom agar kembali ke satuan piksel A4. */
function measureContactColumn() {
  const target = document.querySelector(".modern-contact");
  const paperNode = document.querySelector("#letter-paper");
  if (!target || !paperNode) {
    return TEMPLATE_TOKENS.modern.contactColumn;
  }
  const zoom = parseFloat(getComputedStyle(paperNode).zoom) || 1;
  const width = target.getBoundingClientRect().width / zoom;
  /* Bulatkan ke 0.1px, bukan ke px bulat: membulatkan ke bawah membuat
   * kolom 0.2px lebih sempit dan baris kontak jadi wrap. Ditambah 2px
   * cadangan karena html2canvas mengukur teks sedikit lebih lebar. */
  return Math.round(width * 10) / 10 + 2 || TEMPLATE_TOKENS.modern.contactColumn;
}

/* Sumber SVG dekoratif template modern. Bentuknya identik dengan yang dipakai
 * pratinjau, hanya ditulis ulang sebagai string agar bisa diraster jadi PNG. */
const SVG_WAVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 48" preserveAspectRatio="none">
<path fill="#e7e8eb" d="M0 13C150 45 238-1 380 19s252 24 380-4v33H0Z"/>
<path fill="#17304a" d="M0 25c150 22 242-12 376 4s244 13 384-6v25H0Z"/>
<path fill="#a82e3f" d="M0 33c158 15 240-7 377 5s255 9 383-5v15H0Z"/>
</svg>`;
const SVG_BAND_NAVY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 42" preserveAspectRatio="none"><polygon fill="#17304a" points="0,10.08 29,23.1 57,13.44 100,24.36 100,42 0,42"/></svg>`;
const SVG_BAND_RED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 35" preserveAspectRatio="none"><polygon fill="#a82e3f" points="0,12.6 28,23.8 58,15.05 100,24.5 100,35 0,35"/></svg>`;

/* html2canvas sama sekali TIDAK merender <svg> sebaris — gelombang atas dan
 * pita bawah akan hilang diam-diam dari PDF. Jadi keduanya diraster jadi PNG
 * (3x ukuran tampil) lalu dipasang sebagai <img>, yang selalu didukung. */
const decorationImages = { wave: "", navy: "", red: "" };
let decorationPromise = null;

function svgToPng(svg, width, height, scale = 3) {
  const source = svg.replace("<svg ", `<svg width="${Math.round(width * scale)}" height="${Math.round(height * scale)}" `);
  const objectUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      if (!context) { reject(new Error(t("msg.canvasUnavailable"))); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(t("msg.decorationFailed")));
    };
    image.src = objectUrl;
  });
}

function ensureDecorations() {
  if (decorationPromise) {
    return decorationPromise;
  }
  decorationPromise = Promise.all([
    svgToPng(SVG_WAVE, PAPER_WIDTH, 41),
    svgToPng(SVG_BAND_NAVY, PAPER_WIDTH, 42),
    svgToPng(SVG_BAND_RED, PAPER_WIDTH, 35)
  ]).then(([wave, navy, red]) => {
    decorationImages.wave = wave;
    decorationImages.navy = navy;
    decorationImages.red = red;
  }).catch((error) => {
    decorationPromise = null;
    throw error;
  });
  return decorationPromise;
}

function createExportHtml(data) {
  const tokens = data.tokens;

  /* margin:0 wajib ditulis eksplisit: <p> punya margin default 1em dari UA
   * stylesheet, yang akan menggeser seluruh isi kop. */
  const organizationStyle = `margin:0;font:${tokens.orgFont};color:${tokens.ink};text-transform:${tokens.orgTransform};`;
  const subtitleStyle = `margin:${tokens.subtitleMarginTop}px 0 0;font:${tokens.subtitleFont};color:${tokens.subtitleInk};letter-spacing:${tokens.subtitleSpacing};`;
  const contacts = contactMarkup(tokens, data);
  const org = `<p class="kop-org" style="${organizationStyle}">${escapeHtml(data.organization)}</p>`;
  const subtitle = `<p class="kop-subtitle" style="${subtitleStyle}">${escapeHtml(data.subtitle)}</p>`;

  /* Header kop memakai grid "<logo> <gap> 1fr <gap> <logo>" di style.css.
   * Semua lebar kolom ditulis eksplisit (termasuk kolom tengah) supaya
   * browser tidak bebas mendistribusikan sisa ruang seperti yang terjadi
   * pada <table> dengan <table-layout: fixed> yang hanya sebagian kolomnya
   * diberi width. */
  const spacer = (width) => `<td style="width:${width}px;"></td>`;
  const pad = (extra = "") => `padding-top:${tokens.headPadTop || 0}px;${extra}`;
  const innerWidth = PAPER_WIDTH - tokens.padRight * 2;

  /* Kolom kontak modern di pratinjau lebarnya ikut isi (auto) dengan batas
   * max 200px. Kalau dikunci 200px, kolom identitas melebar dan nama
   * organisasi bergeser. Jadi lebannya diukur langsung dari pratinjau. */
  const contactWidth = tokens.contactIcons ? measureContactColumn() : 0;
  /* Template modern hanya punya satu kolom logo (kiri), official dan
   * creative punya dua (kiri + kanan). */
  const fixedWidth = tokens.contactIcons
    ? tokens.logoCell + tokens.headGap * 2 + contactWidth
    : tokens.logoCell * 2 + tokens.headGap * 2;
  const centerWidth = innerWidth - fixedWidth;

  const headMarkup = tokens.contactIcons
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:${innerWidth}px;border-collapse:collapse;table-layout:fixed;"><tr style="height:${tokens.headMinHeight}px;">
        <td style="width:${tokens.logoCell}px;${pad()}vertical-align:middle;">${imageMarkup(data.logoLeft || data.logoRight, tokens.logoSize, "left")}</td>
        ${spacer(tokens.headGap)}
        <td style="width:${centerWidth}px;${pad()}text-align:${tokens.identityAlign};vertical-align:middle;">${org}${subtitle}</td>
        ${spacer(tokens.headGap)}
        <td style="width:${contactWidth}px;${pad()}vertical-align:middle;">${contacts}</td>
      </tr></table>
      ${waveMarkup(tokens)}`
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="width:${innerWidth}px;border-collapse:collapse;table-layout:fixed;"><tr style="height:${tokens.headMinHeight}px;">
        <td style="width:${tokens.logoCell}px;${pad()}vertical-align:middle;">${imageMarkup(data.logoLeft, tokens.logoSize, "left")}</td>
        ${spacer(tokens.headGap)}
        <td style="width:${centerWidth}px;${pad()}text-align:${tokens.identityAlign};vertical-align:middle;">${org}${subtitle}${contacts}</td>
        ${spacer(tokens.headGap)}
        <td style="width:${tokens.logoCell}px;${pad()}vertical-align:middle;">${imageMarkup(data.logoRight, tokens.logoSize, "right")}</td>
      </tr></table>
      ${ruleMarkup(tokens)}`;

  const metaLeft = [
    ["Nomor", data.letterNumber],
    ["Lampiran", data.attachment],
    ["Perihal", data.subject]
  ].map(([label, value]) =>
    `<p class="kop-meta-line" style="margin:0 0 3px;font:${tokens.metaFont};"><span class="kop-meta-label" style="display:inline-block;min-width:68px;">${label}</span><span style="display:inline-block;width:14px;">:</span> ${escapeHtml(value)}</p>`
  ).join("");

  const metaRight = [
    paragraph(data.date, `margin:0 0 20px;font:${tokens.metaFont};text-align:right;`, "kop-date"),
    paragraph("Kepada Yth.", `margin:0 0 2px;font:${tokens.metaFont};text-align:right;`, "kop-recipient-label"),
    paragraph(data.recipient, `margin:0 0 3px;font:${tokens.metaFont};text-align:right;white-space:pre-line;`, "kop-recipient"),
    paragraph("di tempat", `margin:0 0 3px;font:${tokens.metaFont};text-align:right;`, "kop-place")
  ].join("");

  const bodyMarkup = data.paragraphs.map((text, index) =>
    paragraph(text, `margin:0 0 ${tokens.copyGap}px;font:${tokens.copyFont};color:${tokens.ink};text-align:${tokens.copyAlign};text-indent:${index === 0 ? 0 : tokens.copyIndent}px;`, "kop-para")
  ).join("");

  /* Class di sini sengaja memakai awalan "kop-" agar tidak bentrok dengan
   * class di style.css. HTML ekspor dirender di dalam dokumen yang sama,
   * jadi class seperti .letter-meta (display:flex) akan bocor ke sini. */
  /* .signature di style.css tidak mengatur text-align, jadi teksnya rata
   * kiri di dalam blok 220px; hanya posisinya yang berbeda per template. */
  const signature = `<div class="kop-signature" style="width:220px;margin:${tokens.signatureGap}px 0 0 ${tokens.signatureSide === "right" ? "auto" : "0"};text-align:left;font:${tokens.signatureFont};color:${tokens.ink};page-break-inside:avoid;break-inside:avoid;">
    <p class="kop-signoff" style="margin:0;min-height:${tokens.signoffHeight}px;">${escapeHtml(data.closing)}</p>
    <p class="kop-signer-title" style="height:${tokens.signerGap}px;margin:0;line-height:1.5;">${escapeHtml(data.signerTitle)}</p>
    <p class="kop-signer-name" style="display:inline-block;margin:0;border-bottom:1px solid #191919;font-weight:700;">${escapeHtml(data.signerName)}</p>
  </div>`;
  /* .letter-meta di style.css memakai flex: kolom kiri min 48%, kanan
   * max 49%, dengan jarak 22px. Lebar dihitung dalam piksel supaya titik
   * wrap nilai tetap sama persis dengan pratinjau. */
  const leftWidth = Math.round(innerWidth * 0.48);
  const rightWidth = innerWidth - leftWidth - 22;

  return `<div class="kop-root" style="box-sizing:border-box;position:relative;width:${PAPER_WIDTH}px;min-height:${EXPORT_HEIGHT}px;padding:${tokens.padding};color:${tokens.ink};background:${tokens.paperColor};font:10px Arial,sans-serif;">
    ${headMarkup}
    <table class="kop-meta" role="presentation" cellpadding="0" cellspacing="0" style="width:${innerWidth}px;margin:${tokens.metaTop}px 0 27px;border-collapse:collapse;table-layout:fixed;page-break-inside:avoid;break-inside:avoid;">
      <tr><td style="width:${leftWidth}px;vertical-align:top;">${metaLeft}</td>
      <td style="width:${rightWidth}px;text-align:right;vertical-align:top;">${metaRight}</td></tr>
    </table>
    <div class="kop-body" style="color:${tokens.ink};">${bodyMarkup}</div>
    ${signature}
    ${bandMarkup(tokens)}
    <p class="kop-footer" style="position:absolute;right:${tokens.footerInset}px;bottom:${tokens.footerBottom}px;left:${tokens.footerInset}px;margin:0;color:${tokens.footerInk};text-align:center;font:${tokens.footerFont};">${escapeHtml(data.website)}</p>
  </div>`;
}

/* --------------------------------------------------------------------------
 * Ekspor Word
 *
 * Catatan: .docx adalah dokumen yang akan diedit di Word, jadi nama font
 * memakai font standar (Arial / Times New Roman / Georgia) agar tidak
 * bergantung pada font web yang mungkin tidak terpasang di komputer
 * penerima. Ukuran, spasi, perataan, dan warna tetap mengikuti token.
 * ----------------------------------------------------------------------- */

/* 1px = 15 twip pada 96dpi (1 twip = 1/1440 inci). */
const twip = (px) => Math.round(px * 15);
/* Ukuran font docx dalam setengah poin, jadi 1px = 1.5 half-point. */
const halfPoint = (px) => Math.round(px * 1.5);

/* Membaca ukuran huruf dan jarak baris dari shorthand CSS pada token,
 * misalnya '11px/1.55 Arial' atau '700 19px/1.2 'Times New Roman''. */
function fontSizeOf(shorthand, fallback = 11) {
  const match = shorthand.match(/(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : fallback;
}

function lineSpacingOf(shorthand, fallback = 1.4) {
  const match = shorthand.match(/\/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

async function rasterizeForWord(source, box) {
  if (!source) {
    return null;
  }

  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error(t("msg.logoUnreadable"));
  }

  const naturalWidth = image.naturalWidth || box;
  const naturalHeight = image.naturalHeight || box;
  const scale = Math.min(1, WORD_LOGO_EDGE / Math.max(naturalWidth, naturalHeight));
  const pixelWidth = Math.max(1, Math.round(naturalWidth * scale));
  const pixelHeight = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error(t("msg.wordLogoFailed"));
  }
  context.drawImage(image, 0, 0, pixelWidth, pixelHeight);

  const keepAlpha = /^data:image\/(png|gif|svg\+xml|webp)/i.test(source);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error(t("msg.logoUnsupported")));
      }
    }, keepAlpha ? "image/png" : "image/jpeg", 0.92);
  });

  /* Pratinjau memakai object-fit: contain, jadi rasio logo harus dijaga.
   * Memaksanya kotak persegi membuat logo lonjong jadi gepeng. */
  const ratio = naturalWidth / naturalHeight;
  const fitted = ratio >= 1
    ? { width: box, height: Math.max(1, Math.round(box / ratio)) }
    : { width: Math.max(1, Math.round(box * ratio)), height: box };

  return { bytes: new Uint8Array(await blob.arrayBuffer()), ...fitted };
}

async function createWordDocument(data) {
  const library = window.docx;
  if (!library) {
    throw new Error(t("msg.wordUnavailable"));
  }

  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    ImageRun,
    PageOrientation,
    Paragraph,
    Packer,
    ShadingType,
    Tab,
    TabStopType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    UnderlineType,
    VerticalAlign,
    WidthType
  } = library;

  const tokens = data.tokens;
  const isModern = tokens.contactIcons;
  const hex = (color) => color.replace("#", "").toUpperCase();

  const pageWidth = 11906;
  const pageHeight = 16838;
  const marginTop = twip(tokens.padTop);
  const marginSide = twip(tokens.padRight);
  const contentWidth = pageWidth - marginSide * 2;

  const noBorders = Object.fromEntries(
    ["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((side) => [
      side,
      { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
    ])
  );

  const [leftLogo, rightLogo] = await Promise.all([
    rasterizeForWord(
      data.logoLeft || (isModern ? data.logoRight : ""),
      isModern ? 58 : tokens.logoSize * 0.88
    ),
    rasterizeForWord(isModern ? "" : data.logoRight, tokens.logoSize * 0.88)
  ]);

  const textRun = (text, options = {}) => new TextRun({
    text,
    font: options.font || "Arial",
    size: options.size || halfPoint(11),
    color: options.color || hex(tokens.ink),
    bold: options.bold || false,
    ...(options.underline ? { underline: { type: UnderlineType.SINGLE, color: "191919" } } : {})
  });

  const paragraph = (text, options = {}) => {
    const lines = String(text || "").split("\n");
    const runs = lines.flatMap((line, index) => [
      ...(index ? [new TextRun({ text: "", break: 1 })] : []),
      textRun(line, options)
    ]);
    return new Paragraph({
      alignment: options.alignment,
      indent: options.indent,
      tabStops: options.tabStops,
      spacing: {
        before: options.before || 0,
        after: options.after ?? 80,
        line: options.line || 276
      },
      children: runs.length ? runs : [textRun("")]
    });
  };

  const imageParagraph = (logo, alignment) => new Paragraph({
    alignment,
    spacing: { before: 0, after: 0 },
    children: logo
      ? [new ImageRun({ data: logo.bytes, transformation: { width: logo.width, height: logo.height } })]
      : [textRun("")]
  });

  const cell = (width, children, options = {}) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: options.verticalAlign || VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    borders: noBorders,
    ...(options.shading ? { shading: { type: ShadingType.CLEAR, fill: options.shading, color: "auto" } } : {}),
    children: children.length ? children : [paragraph("")]
  });

  const table = (widths, rows) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows
  });

  const spacer = (points = 8) => new Paragraph({
    spacing: { before: 0, after: 0, line: points * 20 },
    children: [textRun("")]
  });

  /* Ukuran huruf diturunkan dari shorthand CSS pada token agar ukuran di Word
   * tidak lagi menyimpang dari pratinjau. */
  const copySize = halfPoint(fontSizeOf(tokens.copyFont));
  const copyLine = Math.round(fontSizeOf(tokens.copyFont) * lineSpacingOf(tokens.copyFont) * 15);
  const orgSize = halfPoint(fontSizeOf(tokens.orgFont));
  const subtitleSize = halfPoint(fontSizeOf(tokens.subtitleFont));
  const contactSize = halfPoint(fontSizeOf(tokens.contactFont));
  const metaSize = halfPoint(fontSizeOf(tokens.metaFont));
  const bodySize = halfPoint(11);

  /* Kolom label "Nomor / Lampiran / Perihal" lebar 68px, sama dengan
   * pratinjau. Tanpa tab stop, spasi di Arial tidak akan lurus. */
  const metaTab = [{ type: TabStopType.LEFT, position: twip(68) }];
  const metaParagraphs = [
    ["Nomor", data.letterNumber],
    ["Lampiran", data.attachment],
    ["Perihal", data.subject]
  ].map(([label, value]) => new Paragraph({
    tabStops: metaTab,
    spacing: { before: 0, after: 35, line: 290 },
    children: [
      textRun(label, { size: metaSize }),
      new Tab(),
      textRun(":", { size: metaSize }),
      textRun(" ", { size: metaSize }),
      textRun(value, { size: metaSize })
    ]
  }));

  const recipientParagraphs = [
    paragraph(data.date, { size: metaSize, alignment: AlignmentType.RIGHT, after: twip(20) }),
    paragraph("Kepada Yth.", { size: metaSize, alignment: AlignmentType.RIGHT, after: 30 }),
    paragraph(data.recipient, { size: metaSize, alignment: AlignmentType.RIGHT, after: 30 }),
    paragraph("di tempat", { size: metaSize, alignment: AlignmentType.RIGHT, after: 0 })
  ];

  const children = [];

  if (isModern) {
    const contactRows = [data.address, data.phone, data.email, data.website]
      .filter((value) => value)
      .map((value, index) => paragraph(`${CONTACT_ICONS[index]}  ${value}`, {
        size: contactSize,
        color: hex(tokens.contactInk),
        after: 35,
        line: 230
      }));
    const identity = [
      paragraph(data.organization, {
        font: tokens.orgWordFont,
        size: orgSize,
        bold: true,
        alignment: AlignmentType.CENTER,
        after: 120,
        line: 260
      }),
      paragraph(data.subtitle, {
        font: tokens.subtitleWordFont,
        size: subtitleSize,
        bold: tokens.subtitleWeight >= 600,
        alignment: AlignmentType.CENTER,
        after: 0
      })
    ];
    const logoColumn = twip(tokens.logoCell + tokens.headGap);
    const contactColumn = twip(tokens.contactColumn);
    children.push(table(
      [logoColumn, contentWidth - logoColumn - contactColumn, contactColumn],
      [new TableRow({ cantSplit: true, children: [
        cell(logoColumn, [imageParagraph(leftLogo, AlignmentType.LEFT)]),
        cell(contentWidth - logoColumn - contactColumn, identity),
        cell(contactColumn, contactRows)
      ] })]
    ));
    children.push(spacer(10));
    const third = Math.floor(contentWidth / 3);
    children.push(table(
      [third, third, contentWidth - 2 * third],
      [new TableRow({ cantSplit: true, children: [
        cell(third, [paragraph("", { size: 4, after: 0 })], { shading: "E7E8EB" }),
        cell(third, [paragraph("", { size: 4, after: 0 })], { shading: "17304A" }),
        cell(contentWidth - 2 * third, [paragraph("", { size: 4, after: 0 })], { shading: "A82E3F" })
      ] })]
    ));
  } else {
    const logoWidth = twip(tokens.logoCell + tokens.headGap);
    const centerWidth = contentWidth - logoWidth * 2;
    const organizationName = tokens.orgTransform === "uppercase"
      ? data.organization.toLocaleUpperCase("id-ID")
      : data.organization;
    const identity = [
      paragraph(organizationName, {
        font: tokens.orgWordFont,
        size: orgSize,
        bold: true,
        alignment: AlignmentType.CENTER,
        after: 120,
        line: 260
      }),
      paragraph(data.subtitle, {
        font: tokens.subtitleWordFont,
        size: subtitleSize,
        bold: tokens.subtitleWeight >= 600,
        alignment: AlignmentType.CENTER,
        after: 90
      }),
      paragraph(data.address, {
        size: contactSize,
        color: hex(tokens.mutedInk),
        alignment: AlignmentType.CENTER,
        after: 60,
        line: 230
      }),
      paragraph([data.phone, data.email].filter(Boolean).join("   "), {
        size: contactSize,
        color: hex(tokens.mutedInk),
        alignment: AlignmentType.CENTER,
        after: 0,
        line: 230
      })
    ];
    children.push(table(
      [logoWidth, centerWidth, logoWidth],
      [new TableRow({ cantSplit: true, children: [
        cell(logoWidth, [imageParagraph(leftLogo, AlignmentType.LEFT)]),
        cell(centerWidth, identity),
        cell(logoWidth, [imageParagraph(rightLogo, AlignmentType.RIGHT)])
      ] })]
    ));
    children.push(spacer(tokens.rule === "hairline" ? 18 : 10));

    /* Garis kop: "double" = 2px + 1px (sama dengan pratinjau), "hairline" = 1px. */
    const ruleLines = tokens.rule === "hairline"
      ? [6]
      : [12, 6];
    children.push(table(
      [contentWidth],
      [new TableRow({ cantSplit: true, children: [
        cell(contentWidth, ruleLines.map((size) => new Paragraph({
          spacing: { before: 0, after: 0, line: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size, color: hex(tokens.ruleInk), space: 0 } },
          children: [textRun("", { size: 2 })]
        })))
      ] })]
    ));
  }

  children.push(spacer(isModern ? 18 : tokens.rule === "hairline" ? 22 : 14));

  const leftMetaWidth = Math.floor(contentWidth * 0.52);
  children.push(table(
    [leftMetaWidth, contentWidth - leftMetaWidth],
    [new TableRow({ cantSplit: true, children: [
      cell(leftMetaWidth, metaParagraphs, { verticalAlign: VerticalAlign.TOP }),
      cell(contentWidth - leftMetaWidth, recipientParagraphs, { verticalAlign: VerticalAlign.TOP })
    ] })]
  ));

  children.push(spacer(16));

  data.paragraphs.forEach((text, index) => {
    children.push(paragraph(text, {
      size: copySize,
      alignment: tokens.copyAlign === "justify" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
      indent: index > 0 && tokens.copyIndent ? { firstLine: twip(tokens.copyIndent) } : undefined,
      after: twip(tokens.copyGap),
      line: copyLine
    }));
  });

  children.push(spacer(isModern ? 20 : 28));

  /* Tanda tangan: nama diberi garis bawah seperti border-bottom di pratinjau
   * dan PDF, dengan lebar mengikuti teks (bukan satu bar penuh). */
  const signatureAlignment = tokens.signatureSide === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT;
  children.push(paragraph(data.closing, { size: bodySize, alignment: signatureAlignment, after: 0 }));
  children.push(paragraph("", {
    size: bodySize, alignment: signatureAlignment, after: 0, line: twip(tokens.signerGap)
  }));
  children.push(paragraph(data.signerTitle, { size: bodySize, alignment: signatureAlignment, after: 60 }));
  children.push(paragraph(data.signerName, {
    size: bodySize, alignment: signatureAlignment, after: 0, bold: true, underline: true
  }));

  const footerChildren = [];
  if (isModern) {
    /* Pita warna bawah, diletakkan di footer agar menempel ke dasar halaman. */
    const third = Math.floor(contentWidth / 3);
    footerChildren.push(table(
      [third, third, contentWidth - 2 * third],
      [new TableRow({ cantSplit: true, children: [
        cell(third, [paragraph("", { size: 4, after: 0 })], { shading: "17304A" }),
        cell(third, [paragraph("", { size: 4, after: 0 })], { shading: "A82E3F" }),
        cell(contentWidth - 2 * third, [paragraph("", { size: 4, after: 0 })], { shading: "17304A" })
      ] })]
    ));
  }
  footerChildren.push(paragraph(data.website, {
    size: halfPoint(9),
    color: hex(tokens.footerInk),
    alignment: AlignmentType.CENTER,
    after: 0
  }));

  const document = new Document({
    creator: "hiru.kop",
    title: data.organization ? `Surat - ${data.organization}` : "Surat",
    sections: [{
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight, orientation: PageOrientation.PORTRAIT },
          margin: {
            top: marginTop,
            right: marginSide,
            bottom: twip(tokens.padBottom),
            left: marginSide,
            header: 425,
            footer: twip(tokens.footerBottom)
          }
        }
      },
      footers: { default: new Footer({ children: footerChildren }) },
      children
    }]
  });

  return Packer.toBlob(document);
}

/* --------------------------------------------------------------------------
 * Tombol ekspor
 * ----------------------------------------------------------------------- */

function prepareExportButton(button, label) {
  button.disabled = true;
  const labelNode = button.querySelector("span");
  if (labelNode) {
    labelNode.textContent = label;
  }
}

function restoreExportButton(button, originalContent) {
  button.disabled = false;
  button.innerHTML = originalContent;
}

function getExportFilename() {
  let filename = filenameInput.value
    .trim()
    .replace(/\.(pdf|docx)$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 80)
    .replace(/[. ]+$/g, "");

  /* CON, PRN, NUL, COM1, dan sejenisnya ditolak Windows sehingga berkas
   * tidak hilang diam-diam begitu diunduh. */
  if (WINDOWS_RESERVED.test(filename)) {
    filename = `surat-${filename}`;
  }
  filename = filename || "kop-surat";

  filenameInput.value = filename;
  return filename;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  /* Firefox lama hanya memproses klik pada anchor yang sudah ada di DOM. */
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

downloadButton.addEventListener("click", async () => {
  if (typeof window.html2pdf !== "function") {
    window.alert(t("msg.pdfUnavailable"));
    return;
  }

  const previousLabel = downloadButton.innerHTML;
  prepareExportButton(downloadButton, "Menyiapkan…");

  let exportHost;
  try {
    /* Dekorasi (gelombang + pita bawah) harus jadi PNG dulu: html2canvas
     * tidak merender <svg> sebaris sama sekali. Kalau gagal, ekspor tetap
     * berjalan dengan SVG sebaris (hanya hilang di PDF). */
    await ensureDecorations().catch(() => {});

    const data = getLetterData();
    const exportRoot = document.createElement("div");
    exportRoot.innerHTML = createExportHtml(data);
    exportHost = document.createElement("div");
    exportHost.setAttribute("aria-hidden", "true");
    /* Host tetap diletakkan di luar layar agar tidak pernah terlihat. Resi
     * html2canvas di bawah menetralkan koordinat yang dihitung dari posisi ini. */
    exportHost.style.cssText = "position:fixed;top:0;left:-10000px;width:794px;pointer-events:none;z-index:-1;";
    exportHost.append(exportRoot);
    document.body.append(exportHost);

    await Promise.all(
      [...exportRoot.querySelectorAll("img")].map((image) =>
        image.decode().catch(() => {
          /* satu gambar rusak tidak perlu menggagalkan seluruh ekspor */
        })
      )
    );
    await document.fonts.ready;
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    await window.html2pdf()
      .set({
        margin: 0,
        filename: `${getExportFilename()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: data.tokens.paperColor,
          scrollX: 0,
          scrollY: 0,
          windowWidth: PAPER_WIDTH,
          windowHeight: PAPER_HEIGHT,
          /* WAJIB. Tanpa empat properti ini html2canvas menghitung sendiri
           * area render dari getBoundingClientRect() elemen. Karena host
           * ekspor diletakkan di luar area tampil, koordinatnya salah dan
           * seluruh isi surat bergeser hundreds of piksel ke kiri serta
           * terpotong. Menentukan Kotak render secara eksplisit membuat
           * html2canvas mengabaikan perhitungan tersebut. */
          x: 0,
          y: 0,
          width: PAPER_WIDTH,
          height: EXPORT_HEIGHT
        },
        jsPDF: { unit: "pt", format: [595.28, 841.89], orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".kop-meta", ".kop-signature"] }
      })
      .from(exportRoot.firstElementChild)
      .save();
  } catch (error) {
    console.error("Gagal membuat PDF:", error);
    window.alert(t("msg.pdfFailed"));
  } finally {
    exportHost?.remove();
    restoreExportButton(downloadButton, previousLabel);
  }
});

docButton.addEventListener("click", async () => {
  if (!window.docx || typeof window.docx.Packer?.toBlob !== "function") {
    window.alert(t("msg.wordUnavailable"));
    return;
  }
  const previousLabel = docButton.innerHTML;
  prepareExportButton(docButton, "Menyiapkan…");
  try {
    const blob = await createWordDocument(getLetterData());
    downloadBlob(blob, `${getExportFilename()}.docx`);
  } catch (error) {
    console.error("Gagal membuat dokumen Word:", error);
    window.alert(error.message || "Dokumen Word gagal dibuat. Silakan coba lagi.");
  } finally {
    restoreExportButton(docButton, previousLabel);
  }
});

/* --------------------------------------------------------------------------
 * Wiring
 * ----------------------------------------------------------------------- */

form.addEventListener("input", (event) => {
  const name = event.target.name;
  if (!Object.hasOwn(fields, name)) {
    return;
  }
  if (name === "bodyText") {
    updateBody();
  } else if (name === "city") {
    updateDate();
  } else {
    updateText(name);
  }
  scheduleSave();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

logoFiles.left.addEventListener("change", () => handleLogoUpload("left"));
logoFiles.right.addEventListener("change", () => handleLogoUpload("right"));

templateSelect.addEventListener("change", () => {
  paper.classList.remove("template-official", "template-modern", "template-creative");
  paper.classList.add(`template-${templateSelect.value}`);
  updatePaperScale();
  scheduleSave();
});

filenameInput.addEventListener("input", scheduleSave);

if ("ResizeObserver" in window) {
  new ResizeObserver(updatePaperScale).observe(paperStage);
} else {
  window.addEventListener("resize", updatePaperScale);
}

/* Urutan inisialisasi penting:
 * 1. restoreState()  — nilai tersimpan selalu menang
 * 2. seedSamples()   — isi field yang masih kosong dengan data contoh
 * 3. applyLanguage() — pasang teks sesuai bahasa yang tersimpan/default
 */
const storedLanguage = restoreState();
seedSamples(storedLanguage || DEFAULT_LANGUAGE);
applyLanguage(storedLanguage || DEFAULT_LANGUAGE);
paper.classList.remove("template-official", "template-modern", "template-creative");
paper.classList.add(`template-${templateSelect.value}`);
updateLetter();
updatePaperScale();
