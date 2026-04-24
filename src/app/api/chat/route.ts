import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

// ============================================================
// INISIALISASI
// ============================================================
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
const GROQ_MODEL_FAST = "llama-3.1-8b-instant";
const GROQ_MODEL_SMART = "llama-3.3-70b-versatile";

const bigquery = new BigQuery({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // credentials,///

});

// ============================================================
// REFERENSI TABEL
// ============================================================
const TABLE_REF = "`" + PROJECT_ID + ".chatbot_data.main_table`";
// const TABLE_REF = "`" + PROJECT_ID + ".chatbot_resource.source-chatbot`";

// ============================================================
// SCHEMA LENGKAP
// ============================================================
const TABLE_SCHEMA = `
Table: ${TABLE_REF}

Kolom:
- var_id   : INTEGER  — ID variabel
- metric   : STRING   — kode unik metrik, berisi kata kunci topik
- title    : STRING   — judul tabel statistik
- sub_name : STRING   — label baris data: jenis kelamin, kelompok umur, kecamatan, dll
- unit     : STRING   — satuan nilai (jiwa, persen, rupiah, ha, dll)
- variable : STRING   — nama variabel/kolom dalam tabel
- kategori : STRING   — kategori topik (kependudukan, ekonomi, pertanian, dll)
- tahun    : INTEGER  — tahun data
- value    : FLOAT    — nilai numerik

CARA DATA DISIMPAN (PENTING):
- Data detail seperti "laki-laki", "perempuan", "total" tersimpan di kolom sub_name
- Contoh: title="Jumlah Penduduk Menurut Jenis Kelamin", sub_name="Laki-Laki", tahun=2023, value=163234
- Contoh: title="Jumlah Penduduk Menurut Jenis Kelamin", sub_name="Perempuan", tahun=2023, value=158222
- Contoh: title="Jumlah Penduduk Menurut Jenis Kelamin", sub_name="Jumlah", tahun=2023, value=321456
`;

// ============================================================
// SYSTEM PROMPT SQL
// ============================================================
const SQL_SYSTEM_PROMPT = `
Kamu adalah generator SQL untuk Google BigQuery. Output HANYA SQL murni, tanpa teks lain apapun.

${TABLE_SCHEMA}

ATURAN WAJIB:
1. Output HANYA SQL murni. DILARANG ada teks, penjelasan, komentar, atau markdown.
2. Query HARUS dimulai tepat dengan kata SELECT.
3. SELALU pilih semua kolom: SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value
4. Nama tabel: ${TABLE_REF}
5. LIMIT maksimal 50 baris.
6. Gunakan LOWER() untuk semua perbandingan string.
7. Untuk pencarian topik, cari di SEMUA kolom teks dengan OR: title, metric, sub_name, kategori, variable.

POLA SQL BERDASARKAN JENIS PERTANYAAN:

[DATA TERBARU - tidak menyebut tahun spesifik]
SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value
FROM ${TABLE_REF}
WHERE (LOWER(title) LIKE '%keyword%' OR LOWER(metric) LIKE '%keyword%' OR LOWER(kategori) LIKE '%keyword%')
ORDER BY tahun DESC
LIMIT 30

[DATA TAHUN TERTENTU - menyebut angka tahun]
SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value
FROM ${TABLE_REF}
WHERE (LOWER(title) LIKE '%keyword%' OR LOWER(metric) LIKE '%keyword%' OR LOWER(kategori) LIKE '%keyword%')
  AND tahun = 2023
LIMIT 30

[DATA TREN / PERKEMBANGAN - beberapa tahun]
SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value
FROM ${TABLE_REF}
WHERE (LOWER(title) LIKE '%keyword%' OR LOWER(metric) LIKE '%keyword%' OR LOWER(kategori) LIKE '%keyword%')
ORDER BY tahun ASC
LIMIT 50

[DATA JENIS KELAMIN]
SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value
FROM ${TABLE_REF}
WHERE (LOWER(title) LIKE '%penduduk%' OR LOWER(metric) LIKE '%penduduk%')
  AND LOWER(sub_name) LIKE '%laki%'
ORDER BY tahun DESC
LIMIT 20

PEMETAAN TOPIK KE KEYWORD:
- penduduk/populasi → keyword: penduduk
- kemiskinan → keyword: kemiskinan
- pengangguran/tenaga kerja → keyword: pengangguran
- UMK/upah/gaji → keyword: upah
- PDRB/pertumbuhan ekonomi → keyword: pdrb
- pertanian/lahan → keyword: pertanian
- pendidikan/sekolah → keyword: pendidikan
- kesehatan/puskesmas → keyword: kesehatan
- IPM → keyword: ipm
- inflasi → keyword: inflasi
- kelahiran → keyword: kelahiran
- kematian → keyword: kematian
`;

// ============================================================
// SYSTEM PROMPT JAWABAN
// ============================================================
// ============================================================
// SYSTEM PROMPT JAWABAN
// ============================================================
const ANSWER_SYSTEM_PROMPT = `
Kamu adalah asisten statistik resmi BPS Kabupaten Tanjung Jabung Barat, Provinsi Jambi.

Tugasmu menjawab pertanyaan user BERDASARKAN DATA yang diberikan.

PANDUAN MENJAWAB:
- Gunakan Bahasa Indonesia yang ramah, jelas, dan profesional.
- SELALU sebutkan tahun data secara eksplisit.
- Format angka dengan pemisah ribuan Indonesia (contoh: 163.234 bukan 163234).
- JANGAN pernah menjumlahkan, menghitung, atau mengkalkulasi nilai dari beberapa baris — tampilkan data APA ADANYA sesuai yang ada di database.
- JANGAN menambah, mengurangi, atau memodifikasi angka apapun.
- Jika data memiliki kelompok (misal kelompok umur), tampilkan SETIAP kelompok secara terstruktur dengan sub-item laki-laki, perempuan, dan jumlah.
- Jika suatu nilai tidak tersedia dalam data, tulis "tidak tersedia" — JANGAN mengarang angka.
- Jika ada data berlabel "Jumlah" atau "Total" di sub_name untuk keseluruhan populasi, sebutkan itu sebagai angka utama di awal.
- Tampilkan rincian per kelompok/kategori dalam format daftar yang rapi.
- Jangan menyebut istilah teknis: BigQuery, SQL, database, tabel, baris, kolom.
- Jawab langsung sesuai pertanyaan, jangan bertele-tele.
- Akhiri dengan menawarkan bantuan lebih lanjut.

FORMAT UNTUK DATA BERKELOMPOK (misal kelompok umur):
- [Nama kelompok]:
  - Laki-laki: [nilai]
  - Perempuan: [nilai]
  - Jumlah: [nilai atau "tidak tersedia"]
`;

// ============================================================
// RATE LIMIT ERROR
// ============================================================
class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfter(errorMessage: string): number {
  const matchMin = errorMessage.match(/try again in\s+(\d+)m(\d+(?:\.\d+)?)s/i);
  if (matchMin) {
    return Math.ceil(parseInt(matchMin[1], 10) * 60 + parseFloat(matchMin[2]));
  }
  const matchSec = errorMessage.match(/try again in\s+(\d+(?:\.\d+)?)s/i);
  if (matchSec) return Math.ceil(parseFloat(matchSec[1]));
  return 900;
}

// ============================================================
// HELPER: Panggil Groq
// ============================================================
async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  label: string,
  model: string
): Promise<string> {
  if (!GROQ_API_KEY) throw new Error(`${label}: GROQ_API_KEY tidak dikonfigurasi`);

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  console.log(`[${label}] HTTP status: ${res.status}`);

  if (res.status === 429) {
    const errText = await res.text();
    const retryAfter = parseRetryAfter(errText);
    throw new RateLimitError(`Rate limit. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`, retryAfter);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${label} HTTP ${res.status}: ${errText.substring(0, 300)}`);
  }

  const data = await res.json();
  if (data.usage) {
    console.log(`[${label}] Tokens — prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens}`);
  }

  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) throw new Error(`${label} menghasilkan respons kosong`);
  return content.trim();
}

// ============================================================
// HELPER: Bersihkan SQL dari markdown
// ============================================================
function extractSQL(raw: string): string {
  if (!raw) return "";

  let cleaned = raw
    .replace(/```sql[\s\S]*?```/gi, (m) => m.replace(/```sql/gi, "").replace(/```/g, ""))
    .replace(/```[\s\S]*?```/gi, (m) => m.replace(/```/g, ""))
    .replace(/`/g, "")
    .trim();

  const idx = cleaned.search(/\bSELECT\b/i);
  if (idx === -1) return "";

  let sql = cleaned.substring(idx).trim();
  const semiIdx = sql.indexOf(";");
  if (semiIdx !== -1) sql = sql.substring(0, semiIdx).trim();

  return sql;
}

// ============================================================
// HELPER: Deteksi intent dari pertanyaan
// ============================================================
interface Intent {
  tahun: number | null;
  isTren: boolean;
  topicKeywords: string[];
  subNameFilter: string | null;
}

function detectIntent(question: string): Intent {
  const q = question.toLowerCase();

  const tahunMatch = q.match(/\b(20\d{2})\b/);
  const tahun = tahunMatch ? parseInt(tahunMatch[1]) : null;

  const isTren =
    /tren|perkembangan|dari tahun|per tahun|setiap tahun|historis|pertumbuhan|naik|turun|meningkat|menurun/.test(q);

  const topicMap: Record<string, string> = {
    penduduk: "penduduk",
    populasi: "penduduk",
    kemiskinan: "kemiskinan",
    miskin: "kemiskinan",
    pengangguran: "pengangguran",
    "tenaga kerja": "tenagakerja",
    ketenagakerjaan: "tenagakerja",
    "angkatan kerja": "angkatan",
    umk: "upah",
    upah: "upah",
    gaji: "upah",
    minimum: "minimum",
    pdrb: "pdrb",
    ekonomi: "pdrb",
    pertanian: "pertanian",
    sawah: "pertanian",
    pendidikan: "pendidikan",
    sekolah: "pendidikan",
    kesehatan: "kesehatan",
    puskesmas: "kesehatan",
    ipm: "ipm",
    "indeks pembangunan": "ipm",
    inflasi: "inflasi",
    harga: "inflasi",
    kelahiran: "kelahiran",
    kematian: "kematian",
    pernikahan: "pernikahan",
    ekspor: "ekspor",
    impor: "impor",
  };

  const topicKeywords: string[] = [];
  for (const [phrase, keyword] of Object.entries(topicMap)) {
    if (q.includes(phrase) && !topicKeywords.includes(keyword)) {
      topicKeywords.push(keyword);
    }
  }

  let subNameFilter: string | null = null;
  if (q.includes("laki-laki") || q.includes("laki laki") || q.includes("pria")) {
    subNameFilter = "laki";
  } else if (q.includes("perempuan") || q.includes("wanita")) {
    subNameFilter = "perempuan";
  }

  return { tahun, isTren, topicKeywords, subNameFilter };
}

// ============================================================
// HELPER: Buat SQL DETERMINISTIK (tidak pakai LLM, selalu berhasil)
// Ini adalah safety net — tidak bergantung pada LLM sama sekali
// ============================================================
function buildDeterministicSQL(question: string): string {
  const intent = detectIntent(question);
  console.log("[SQL Deterministik] Intent:", JSON.stringify(intent));

  const cols = `var_id, metric, title, sub_name, unit, variable, kategori, tahun, value`;

  // Bangun kondisi topik
  let topicParts: string[] = [];

  if (intent.topicKeywords.length > 0) {
    for (const kw of intent.topicKeywords) {
      topicParts.push(
        `(LOWER(title) LIKE '%${kw}%' OR LOWER(metric) LIKE '%${kw}%' OR LOWER(kategori) LIKE '%${kw}%' OR LOWER(variable) LIKE '%${kw}%')`
      );
    }
  } else {
    // Tidak ada topik terdeteksi → ekstrak kata dari pertanyaan
    const stopwords = new Set([
      "berapa", "apa", "siapa", "dimana", "kapan", "bagaimana", "yang", "ada",
      "dan", "atau", "di", "ke", "dari", "untuk", "dengan", "pada", "ini",
      "adalah", "data", "tanjung", "jabung", "barat", "kabupaten", "kab",
      "bps", "statistik", "tolong", "mohon", "saya", "tentang", "mengenai",
      "seputar", "informasi", "info", "jelaskan", "terbaru", "terkini",
      "terakhir", "saat", "sekarang", "jumlah", "total", "angka", "tahun",
    ]);

    const words = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopwords.has(w))
      .slice(0, 4);

    console.log("[SQL Deterministik] Kata kunci dari teks:", words);

    for (const w of words) {
      topicParts.push(
        `(LOWER(title) LIKE '%${w}%' OR LOWER(metric) LIKE '%${w}%' OR LOWER(sub_name) LIKE '%${w}%' OR LOWER(kategori) LIKE '%${w}%')`
      );
    }
  }

  // Gabung kondisi topik dengan OR (lebih longgar → lebih banyak hasil)
  const topicCondition = topicParts.length > 0 ? topicParts.join(" OR ") : "1=1";

  // Kondisi sub_name untuk jenis kelamin
  const subCond = intent.subNameFilter
    ? `AND LOWER(sub_name) LIKE '%${intent.subNameFilter}%'`
    : "";

  // Kondisi tahun
  const tahunCond = intent.tahun ? `AND tahun = ${intent.tahun}` : "";

  // Order dan limit
  const orderBy = intent.isTren
    ? "ORDER BY title ASC, tahun ASC, sub_name ASC"
    : "ORDER BY tahun DESC, title ASC, sub_name ASC";
  const limit = intent.isTren ? 50 : 30;

  return [
    `SELECT ${cols}`,
    `FROM ${TABLE_REF}`,
    `WHERE (${topicCondition})`,
    subCond,
    tahunCond,
    orderBy,
    `LIMIT ${limit}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ============================================================
// HELPER: Jalankan query BigQuery dengan fallback 3 lapis
// ============================================================
async function runBigQueryWithFallback(
  primarySQL: string,
  question: string
): Promise<any[]> {
  // === Lapis 1: SQL utama ===
  try {
    console.log("[BQ Lapis 1] SQL:\n", primarySQL);
    const [rows] = await bigquery.query({ query: primarySQL, location: "asia-southeast2" });
    console.log(`[BQ Lapis 1] Rows: ${rows?.length ?? 0}`);
    if (rows && rows.length > 0) return rows;
    console.warn("[BQ Lapis 1] 0 baris, lanjut ke lapis 2");
  } catch (err: any) {
    console.error("[BQ Lapis 1] Error:", err?.message?.substring(0, 300));
  }

  // === Lapis 2: SQL deterministik (jika berbeda dari primarySQL) ===
  const deterSQL = buildDeterministicSQL(question);
  if (deterSQL.trim() !== primarySQL.trim()) {
    try {
      console.log("[BQ Lapis 2] Deterministik SQL:\n", deterSQL);
      const [rows] = await bigquery.query({ query: deterSQL, location: "asia-southeast2" });
      console.log(`[BQ Lapis 2] Rows: ${rows?.length ?? 0}`);
      if (rows && rows.length > 0) return rows;
      console.warn("[BQ Lapis 2] 0 baris, lanjut ke lapis 3");
    } catch (err: any) {
      console.error("[BQ Lapis 2] Error:", err?.message?.substring(0, 300));
    }
  }

  // === Lapis 3: Super-broad — kata pendek, tanpa filter tahun, OR semua ===
  const broadWords = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);

  if (broadWords.length > 0) {
    const broadConds = broadWords
      .map(
        (w) =>
          `LOWER(title) LIKE '%${w}%' OR LOWER(metric) LIKE '%${w}%' OR LOWER(sub_name) LIKE '%${w}%' OR LOWER(kategori) LIKE '%${w}%'`
      )
      .join(" OR ");

    const broadSQL = [
      `SELECT var_id, metric, title, sub_name, unit, variable, kategori, tahun, value`,
      `FROM ${TABLE_REF}`,
      `WHERE ${broadConds}`,
      `ORDER BY tahun DESC`,
      `LIMIT 30`,
    ].join("\n");

    try {
      console.log("[BQ Lapis 3] Broad SQL:\n", broadSQL);
      const [rows] = await bigquery.query({ query: broadSQL, location: "asia-southeast2" });
      console.log(`[BQ Lapis 3] Rows: ${rows?.length ?? 0}`);
      if (rows && rows.length > 0) return rows;
    } catch (err: any) {
      console.error("[BQ Lapis 3] Error:", err?.message?.substring(0, 300));
    }
  }

  return [];
}

// ============================================================
// HELPER: Hitung jumlah otomatis laki-laki + perempuan
// jika sub_name "Jumlah" tidak tersedia dalam data
// ============================================================
// ============================================================
// HELPER: Hitung jumlah otomatis laki-laki + perempuan
// ============================================================
function enrichRowsWithTotal(rows: any[]): any[] {
  const byTable = new Map<string, any[]>();
  for (const row of rows) {
    const key = `${row.title ?? ""}|||${row.tahun ?? ""}`;
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key)!.push(row);
  }

  const enriched: any[] = [];

  for (const [tableKey, tableRows] of byTable) {
    // DEBUG: Log semua baris mentah dari BigQuery
    console.log(`\n[Enrich DEBUG] Tabel: "${tableKey}"`);
    for (const r of tableRows) {
      console.log(`  variable="${r.variable}" | sub_name="${r.sub_name}" | value=${r.value}`);
    }

    const hasAnyTotal = tableRows.some((r) =>
      /^(jumlah|total)\s*$/i.test((r.sub_name ?? "").trim())
    );

    if (hasAnyTotal) {
      console.log(`[Enrich] "${tableKey}" sudah punya total, skip enrichment`);
      enriched.push(...tableRows);
      continue;
    }

    const byVariable = new Map<string, any[]>();
    for (const row of tableRows) {
      const vKey = `${row.variable ?? ""}|||${row.metric ?? ""}`;
      if (!byVariable.has(vKey)) byVariable.set(vKey, []);
      byVariable.get(vKey)!.push(row);
    }

    for (const [, varRows] of byVariable) {
      enriched.push(...varRows);

      const lakiRow = varRows.find((r) => /laki[\s-]*laki/i.test((r.sub_name ?? "").trim()));
      const perempuanRow = varRows.find((r) => /^perempuan$/i.test((r.sub_name ?? "").trim()));
      const alreadyHasTotal = varRows.some((r) =>
        /^(jumlah|total)\s*$/i.test((r.sub_name ?? "").trim())
      );

      if (lakiRow && perempuanRow && !alreadyHasTotal) {
        const lakiVal = Number(lakiRow.value ?? 0);
        const perempuanVal = Number(perempuanRow.value ?? 0);
        enriched.push({
          ...lakiRow,
          sub_name: "Jumlah",
          value: lakiVal + perempuanVal,
          _synthetic: true,
        });
        console.log(`[Enrich] Synthetic total: ${lakiRow.variable} L=${lakiVal} + P=${perempuanVal} = ${lakiVal + perempuanVal}`);
      }
    }
  }

  return enriched;
}

// ============================================================
// HELPER: Format baris BigQuery → teks untuk LLM
// ============================================================
function formatRows(rows: any[]): string {
  if (!rows || rows.length === 0) return "Tidak ada data.";

  const grouped = new Map<string, any[]>();
  for (const row of rows.slice(0, 50)) {
    const key = `${row.title ?? ""}|||${row.tahun ?? ""}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const lines: string[] = [];
  let idx = 1;

  for (const [key, groupRows] of grouped) {
    const [title, tahun] = key.split("|||");
    lines.push(`\nJudul: "${title}" | Tahun: ${tahun}`);

    // Jumlah/Total diprioritaskan ke atas
    const sorted = [...groupRows].sort((a, b) => {
      const aTotal = /^(jumlah|total)$/i.test((a.sub_name ?? "").trim());
      const bTotal = /^(jumlah|total)$/i.test((b.sub_name ?? "").trim());
      if (aTotal && !bTotal) return -1;
      if (!aTotal && bTotal) return 1;
      return 0;
    });

    for (const row of sorted) {
      const parts: string[] = [];
      if (row.sub_name) parts.push(`sub_name: "${row.sub_name}"`);
      if (row.variable && row.variable !== row.sub_name) parts.push(`variable: "${row.variable}"`);
      if (row.value != null) parts.push(`value: ${Number(row.value).toLocaleString("id-ID")}`);
      if (row.unit) parts.push(`unit: ${row.unit}`);
      lines.push(`  ${idx}. ${parts.join(" | ")}`);
      idx++;
    }
  }

  return lines.join("\n");
}

// ============================================================
// HELPER: Hitung grand total dari enriched rows
// ============================================================
// ============================================================
// HELPER: Hitung grand total dari enriched rows
// Strategi: jumlahkan HANYA baris sub_name="Jumlah" per variable/kelompok
// ============================================================
function computeGrandTotal(
  rows: any[]
): Record<string, { laki: number; perempuan: number; jumlah: number }> {
  const totals: Record<string, { laki: number; perempuan: number; jumlah: number }> = {};

  const byTable = new Map<string, any[]>();
  for (const row of rows) {
    const key = `${row.title ?? ""}|||${row.tahun ?? ""}`;
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key)!.push(row);
  }

  for (const [key, tableRows] of byTable) {
    // Debug: lihat semua sub_name unik di tabel ini
    const uniqueSubs = [...new Set(tableRows.map((r) => r.sub_name))];
    console.log(`[GrandTotal] Tabel: "${key}" | sub_name unik:`, uniqueSubs);

    // Pisahkan baris berdasarkan variable (kelompok umur, dst)
    // lalu ambil nilai laki, perempuan, jumlah per variable
    const byVariable = new Map<string, any[]>();
    for (const row of tableRows) {
      const vKey = `${row.variable ?? ""}|||${row.metric ?? ""}`;
      if (!byVariable.has(vKey)) byVariable.set(vKey, []);
      byVariable.get(vKey)!.push(row);
    }

    let grandLaki = 0;
    let grandPerempuan = 0;
    let grandJumlah = 0;
    let countLaki = 0;
    let countPerempuan = 0;
    let countJumlah = 0;

    for (const [vKey, varRows] of byVariable) {
      // Cari nilai per sub_name dalam kelompok ini
      const lakiRow = varRows.find((r) => /laki[\s-]*laki/i.test((r.sub_name ?? "").trim()));
      const perempuanRow = varRows.find((r) => /^perempuan$/i.test((r.sub_name ?? "").trim()));
      const jumlahRow = varRows.find((r) => /^(jumlah|total)\s*$/i.test((r.sub_name ?? "").trim()));

      console.log(
        `[GrandTotal] variable="${vKey}" | ` +
        `L=${lakiRow?.value ?? "?"} P=${perempuanRow?.value ?? "?"} J=${jumlahRow?.value ?? "?"}`
      );

      if (lakiRow) { grandLaki += Number(lakiRow.value ?? 0); countLaki++; }
      if (perempuanRow) { grandPerempuan += Number(perempuanRow.value ?? 0); countPerempuan++; }

      if (jumlahRow) {
        // Gunakan nilai "Jumlah" dari database jika ada
        grandJumlah += Number(jumlahRow.value ?? 0);
        countJumlah++;
      } else if (lakiRow && perempuanRow) {
        // Hitung dari laki + perempuan jika tidak ada baris Jumlah
        grandJumlah += Number(lakiRow.value ?? 0) + Number(perempuanRow.value ?? 0);
        countJumlah++;
      }
    }

    // Validasi: jika grand total tidak masuk akal (terlalu besar karena double count),
    // hitung ulang dari laki + perempuan
    if (grandLaki > 0 && grandPerempuan > 0) {
      const calculatedTotal = grandLaki + grandPerempuan;
      // Jika grandJumlah jauh berbeda dari laki+perempuan, pakai kalkulasi
      if (Math.abs(grandJumlah - calculatedTotal) > calculatedTotal * 0.1) {
        console.warn(
          `[GrandTotal] Anomali: jumlah=${grandJumlah} vs L+P=${calculatedTotal}, pakai L+P`
        );
        grandJumlah = calculatedTotal;
      }
    }

    console.log(
      `[GrandTotal] FINAL "${key}": L=${grandLaki} P=${grandPerempuan} J=${grandJumlah}`
    );

    totals[key] = { laki: grandLaki, perempuan: grandPerempuan, jumlah: grandJumlah };
  }

  return totals;
}
// ============================================================
// HELPER: Jawaban fallback tanpa LLM
// ============================================================
function buildFallbackAnswer(rows: any[], question: string): string {
  const years = [...new Set(rows.map((r) => r.tahun).filter(Boolean))].sort(
    (a: number, b: number) => b - a
  );
  const latestYear = years[0];
  const latestRows = rows.filter((r) => r.tahun === latestYear);

  let reply = `Berikut data terkait "${question}"`;
  if (latestYear) reply += ` (tahun ${latestYear})`;
  reply += ":\n\n";

  for (const row of latestRows.slice(0, 15)) {
    const label = row.sub_name || row.variable || row.title || "-";
    const val = row.value != null ? Number(row.value).toLocaleString("id-ID") : "-";
    const unit = row.unit ? ` ${row.unit}` : "";
    reply += `• ${label}: ${val}${unit}\n`;
  }

  if (years.length > 1) {
    reply += `\nData tersedia untuk tahun: ${years.join(", ")}.`;
  }
  reply += `\n\nUntuk data lengkap, kunjungi https://tanjabbarkab.bps.go.id atau hubungi BPS: 082173054213.`;
  return reply;
}

// ============================================================
// HELPER: Deteksi sapaan / small talk
// ============================================================
function detectSmallTalk(query: string): string | null {
  const q = query.toLowerCase().trim();

  const greetings = [
    "halo", "hai", "hello", "assalamualaikum", "selamat pagi",
    "selamat siang", "selamat sore", "selamat malam", "hi", "hey",
  ];
  if (greetings.some((g) => q === g || q.startsWith(g + " ") || q.startsWith(g + "!"))) {
    if (q.includes("assalamualaikum")) {
      return "Wa'alaikumsalam! Selamat datang di Asisten Statistik BPS Tanjung Jabung Barat. Ada yang bisa saya bantu?";
    }
    return "Halo! Selamat datang di Asisten Statistik BPS Tanjung Jabung Barat.\n\nSaya dapat membantu mencari data:\n- Kependudukan\n- Ketenagakerjaan & UMK\n- Kemiskinan & ekonomi\n- Pertanian & perkebunan\n- Pendidikan & kesehatan\n\nSilakan ajukan pertanyaan Anda!";
  }

  const thanks = ["terima kasih", "makasih", "thanks", "thank you", "trims"];
  if (thanks.some((t) => q.includes(t))) {
    return "Sama-sama! Senang bisa membantu. Jika ada pertanyaan lain seputar data statistik BPS Tanjung Jabung Barat, jangan ragu untuk bertanya.";
  }

  return null;
}

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Format pesan tidak valid" }, { status: 400 });
    }

    const userQuestion: string = messages[messages.length - 1]?.content ?? "";
    if (!userQuestion.trim()) {
      return NextResponse.json({ error: "Pertanyaan kosong" }, { status: 400 });
    }

    console.log("\n========== REQUEST ==========");
    console.log("User:", userQuestion);

    // --- Tangani sapaan ---
    const smallTalk = detectSmallTalk(userQuestion);
    if (smallTalk) {
      return NextResponse.json({
        reply: smallTalk,
        sources: [{ uri: "https://tanjabbarkab.bps.go.id", title: "BPS Tanjung Jabung Barat" }],
      });
    }

    // ========== LANGKAH 1: Buat SQL ==========
    // Strategi: SELALU buat SQL deterministik dulu sebagai primary,
    // lalu coba improve dengan LLM. Jika LLM gagal, tetap pakai deterministik.
    console.log("[Step 1] Building SQL...");

    // SQL deterministik — SELALU tersedia, tidak bisa gagal
    const safeSQL = buildDeterministicSQL(userQuestion);
    let primarySQL = safeSQL;

    // Coba improve dengan LLM (opsional, tidak blocking)
    try {
      const intent = detectIntent(userQuestion);
      const promptForSQL = `Buat SQL BigQuery untuk menjawab: "${userQuestion}"

Konteks:
- Topik terdeteksi: ${intent.topicKeywords.join(", ") || "cari berdasarkan kata kunci dari pertanyaan"}
- Tahun spesifik: ${intent.tahun ?? "tidak ada (ambil semua, sort DESC)"}
- Mode tren: ${intent.isTren ? "YA" : "TIDAK"}
- Filter jenis kelamin di sub_name: ${intent.subNameFilter ?? "semua"}

Output HANYA SQL murni. Mulai tepat dari SELECT. Tanpa penjelasan apapun.`;

      const rawSQL = await callGroq(SQL_SYSTEM_PROMPT, promptForSQL, 0, "Groq-SQL", GROQ_MODEL_FAST);
      const llmSQL = extractSQL(rawSQL);

      // Validasi sederhana: harus SELECT dan harus ada FROM
      const isValidLLMSQL =
        llmSQL.toLowerCase().startsWith("select") &&
        llmSQL.toLowerCase().includes("from") &&
        llmSQL.length > 50;

      if (isValidLLMSQL) {
        primarySQL = llmSQL;
        console.log("[Step 1] Pakai SQL dari LLM");
      } else {
        console.warn("[Step 1] SQL LLM tidak valid:", llmSQL.substring(0, 150));
        console.log("[Step 1] Pakai SQL deterministik");
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { reply: "Rate limit tercapai.", rateLimitExceeded: true, retryAfterSeconds: err.retryAfterSeconds },
          { status: 429 }
        );
      }
      console.error("[Step 1] LLM SQL error, pakai deterministik:", err);
      // primarySQL sudah = safeSQL, tidak perlu ubah
    }

    console.log("[Step 1] Primary SQL:\n", primarySQL);

    // ========== LANGKAH 2: Jalankan Query ==========
    console.log("[Step 2] Running BigQuery...");

    // runBigQueryWithFallback sudah punya 3 lapis fallback
    const queryResult = await runBigQueryWithFallback(primarySQL, userQuestion);
    console.log(`[Step 2] Total rows ditemukan: ${queryResult.length}`);

    if (queryResult.length === 0) {
      // Benar-benar tidak ada data setelah 3 lapis fallback
      return NextResponse.json({
        reply: `Maaf, data untuk "${userQuestion}" tidak ditemukan dalam database BPS Tanjung Jabung Barat.\n\nMungkin data yang Anda cari belum tersedia dalam sistem kami. Silakan coba:\n- Gunakan kata kunci berbeda\n- Kunjungi https://tanjabbarkab.bps.go.id\n- Hubungi BPS: 082173054213`,
        sources: [{ uri: "https://tanjabbarkab.bps.go.id", title: "BPS Tanjung Jabung Barat" }],
      });
    }

    // ========== LANGKAH 3: Generate Jawaban ==========
   // ========== LANGKAH 3: Generate Jawaban ==========
    console.log("[Step 3] Generating answer...");

    const intent = detectIntent(userQuestion);

    // Enrich data: hitung jumlah otomatis jika tidak tersedia
    const enrichedResult = enrichRowsWithTotal(queryResult);
    console.log(`[Step 3] Rows setelah enrichment: ${enrichedResult.length}`);

    const formattedData = formatRows(enrichedResult);

    // Hitung grand total per tabel
    const grandTotals = computeGrandTotal(enrichedResult);

    // Format grand total menjadi teks
    const grandTotalText = Object.entries(grandTotals)
      .map(([key, val]) => {
        const [title, tahun] = key.split("|||");
        const parts: string[] = [];
        if (val.laki > 0) parts.push(`Laki-laki: ${val.laki.toLocaleString("id-ID")}`);
        if (val.perempuan > 0) parts.push(`Perempuan: ${val.perempuan.toLocaleString("id-ID")}`);
        if (val.jumlah > 0) parts.push(`Total Keseluruhan: ${val.jumlah.toLocaleString("id-ID")}`);
        return `"${title}" (${tahun}): ${parts.join(" | ")}`;
      })
      .join("\n");

    const availableYears = [
      ...new Set(enrichedResult.map((r) => r.tahun).filter(Boolean)),
    ].sort((a: number, b: number) => b - a);

    const latestYear = availableYears[0];

    const answerPrompt = `Pertanyaan: "${userQuestion}"

Konteks:
- Tahun yang ditanyakan: ${intent.tahun ?? `tidak spesifik → gunakan tahun terbaru (${latestYear})`}
- Mode tren: ${intent.isTren ? "YA — tampilkan perubahan antar tahun" : "TIDAK — fokus pada data tahun terbaru"}
- Filter gender: ${intent.subNameFilter ?? "semua"}
- Semua tahun yang ada dalam data: ${availableYears.join(", ")}

GRAND TOTAL KESELURUHAN (sudah dihitung, tampilkan di akhir rincian):
${grandTotalText}

Data dari BPS (${enrichedResult.length} baris):
${formattedData}

INSTRUKSI WAJIB:
1. Gunakan data tahun ${intent.tahun ?? latestYear} sebagai acuan utama.
2. TAMPILKAN data APA ADANYA — DILARANG KERAS menjumlahkan nilai antar kelompok berbeda secara manual.
3. Nilai "Jumlah" per kelompok sudah tersedia — tampilkan langsung tanpa kalkulasi ulang.
4. Jika data memiliki pengelompokan (misal kelompok umur), tampilkan SETIAP kelompok dengan rincian laki-laki, perempuan, dan jumlah.
5. WAJIB tampilkan grand total di bagian akhir rincian dengan format:
   "Total Keseluruhan Penduduk: [jumlah] jiwa (Laki-laki: [X] | Perempuan: [Y])"
6. Format angka dengan titik sebagai pemisah ribuan (163.234 bukan 163234).
7. Sebutkan judul tabel/data yang digunakan di awal jawaban.
8. Sebutkan tahun data secara eksplisit.
9. Jangan sebut istilah teknis (database, tabel, baris, SQL).`;
    let reply = "";
    try {
      reply = await callGroq(ANSWER_SYSTEM_PROMPT, answerPrompt, 0.2, "Groq-Answer", GROQ_MODEL_SMART);
      reply = reply.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*/g, "").trim();
      console.log("[Step 3] Answer length:", reply.length);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { reply: "Rate limit tercapai.", rateLimitExceeded: true, retryAfterSeconds: err.retryAfterSeconds },
          { status: 429 }
        );
      }
      console.error("[Step 3] LLM answer error, pakai fallback:", err);
      reply = buildFallbackAnswer(queryResult, userQuestion);
    }

    console.log("========== DONE ==========\n");

    return NextResponse.json({
      reply,
      sources: [{ uri: "https://tanjabbarkab.bps.go.id", title: "BPS Tanjung Jabung Barat" }],
    });
  } catch (error: any) {
    console.error("[Route] Unhandled error:", error?.message ?? error);
    return NextResponse.json(
      {
        reply:
          "Maaf, terjadi kesalahan tidak terduga. Silakan coba lagi atau hubungi BPS di 082173054213.",
        sources: [{ uri: "https://tanjabbarkab.bps.go.id", title: "BPS Tanjung Jabung Barat" }],
      },
      { status: 500 }
    );
  }
}