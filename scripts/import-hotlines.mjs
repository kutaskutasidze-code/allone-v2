/**
 * Hotline CSV Importer
 *
 * Imports the 14 infoshop.ge CSV files into the `leads` table.
 * Each filename maps to an English industry; the file's rows become leads.
 *
 * Usage:
 *   HOTLINE_CSV_DIR=/path/to/csvs node --env-file=.env.local scripts/import-hotlines.mjs
 *   node --env-file=.env.local scripts/import-hotlines.mjs --path /path/to/csvs
 *   node --env-file=.env.local scripts/import-hotlines.mjs --path /path/to/csvs --dry-run
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (and either
 * HOTLINE_CSV_DIR env var or --path arg pointing at the CSV directory).
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

// ---------- Config ----------

const BATCH_SIZE = 500;
const PLACEHOLDER = 'არ მოიძებნა'; // "not found" in Georgian

// Filename (without .csv, decoded UTF-8) → English industry label
const FILENAME_TO_INDUSTRY = {
  'განათლება, მეცნიერება': 'Education & Science',
  'იმპორტი_ექსპროტი': 'Import & Export',
  'იურიდიული': 'Legal',
  'კომუნიკაცია_მასმედია': 'Communications & Media',
  'კომუნიკაცია_მასმედია2': 'Communications & Media',
  'სავაჭრო ობიექტები': 'Retail',
  'სამშენებლო': 'Construction',
  'სასმელები': 'Beverages',
  'სასმელები2': 'Beverages',
  'ტურიზმი': 'Tourism',
  'ტურიზმი2': 'Tourism',
  'ფინანსები': 'Finance',
  'წარმოება': 'Manufacturing',
  'ხელოვნება': 'Arts & Culture',
};

// ---------- CLI args ----------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pathArgIdx = args.indexOf('--path');
const csvDir = pathArgIdx >= 0 ? args[pathArgIdx + 1] : process.env.HOTLINE_CSV_DIR;

if (!csvDir) {
  console.error('Missing CSV directory. Pass --path <dir> or set HOTLINE_CSV_DIR env var.');
  process.exit(1);
}

// ---------- Env ----------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !supabaseKey)) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Run with: node --env-file=.env.local scripts/import-hotlines.mjs');
  process.exit(1);
}

const supabase = dryRun ? null : createClient(supabaseUrl, supabaseKey);

// ---------- Helpers ----------

function cleanValue(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === PLACEHOLDER) return null;
  return s;
}

function normalizePhone(v) {
  const s = cleanValue(v);
  if (!s) return null;
  // Keep shortcodes like *4444 as-is; for numeric/intl strip spaces
  return s.replace(/\s+/g, '');
}

function normalizeUrl(v) {
  const s = cleanValue(v);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function normalizeEmail(v) {
  const s = cleanValue(v);
  if (!s) return null;
  // basic sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s.toLowerCase();
}

function trimTrailingPunct(s) {
  return s.replace(/[,\s]+$/, '').trim();
}

function deriveCompany(row) {
  // 1) Facebook handle
  const fb = cleanValue(row.facebook);
  if (fb) {
    const m = fb.match(/facebook\.com\/([^/?#]+)/i);
    if (m && m[1] && m[1].toLowerCase() !== 'pages') return m[1].replace(/[._-]/g, ' ').trim();
  }
  // 2) Website domain (drop www, drop TLD)
  const site = cleanValue(row.website);
  if (site) {
    const stripped = site.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0];
    if (stripped) {
      const parts = stripped.split('.');
      if (parts.length >= 2) return parts[0]; // e.g. bog from bog.ge, tbcbank from tbcbank.com.ge
      return stripped;
    }
  }
  // 3) Email local-part
  const email = cleanValue(row.email);
  if (email && email.includes('@')) {
    return email.split('@')[0];
  }
  // 4) Director name
  return cleanValue(row.director) || null;
}

function bucketCompanySize(employeesRaw) {
  const s = cleanValue(employeesRaw);
  if (!s) return null;
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 10) return 'small';
  if (n < 100) return 'medium';
  if (n < 500) return 'large';
  return 'enterprise';
}

function buildDescription(row) {
  const parts = [];
  const push = (label, raw) => {
    const v = cleanValue(raw);
    if (v) parts.push(`${label}: ${v}`);
  };
  push('Legal status', row.legal_status);
  push('ID', row.id_code);
  push('Founded', row.founding_date);
  push('Employees', row.employees);
  push('Partner bank', row.partner_bank);
  push('Postal', row.postal_index);
  return parts.length ? parts.join(' · ') : null;
}

function buildTags(row) {
  const tags = [];
  const cat = cleanValue(row.category);
  if (cat) tags.push(trimTrailingPunct(cat));
  return tags;
}

function mapRow(row, industry) {
  const phone = normalizePhone(row.phone);
  // Skip rows without a hotline phone — the dataset is "companies that operate hotlines".
  if (!phone) return null;

  const email = normalizeEmail(row.email);
  const website = normalizeUrl(row.website);
  const facebook = normalizeUrl(row.facebook);

  const director = cleanValue(row.director);
  const company = deriveCompany(row);
  // `name` is NOT NULL in the DB — use director, else company, else industry
  const name = director || company || `${industry} hotline`;

  return {
    name,
    company,
    phone,
    email,
    website,
    facebook_url: facebook,
    industry,
    company_size: bucketCompanySize(row.employees),
    description: buildDescription(row),
    tags: buildTags(row),
    source: 'infoshop.ge',
    source_url: cleanValue(row.url),
    country: 'GE',
    status: 'new',
    is_scraped: true,
  };
}

function getIndustryForFile(filename) {
  const base = basename(filename, '.csv');
  const industry = FILENAME_TO_INDUSTRY[base];
  if (!industry) {
    throw new Error(`Unknown CSV filename (no industry mapping): ${base}`);
  }
  return industry;
}

// ---------- Main ----------

async function main() {
  console.log(`\nHotline CSV importer ${dryRun ? '(DRY RUN — no DB writes)' : ''}`);
  console.log(`Source folder: ${csvDir}\n`);

  const files = readdirSync(csvDir).filter(f => f.toLowerCase().endsWith('.csv'));
  if (files.length === 0) {
    console.error('No .csv files in folder.');
    process.exit(1);
  }

  // Parse + map every row
  const allRows = [];
  const perFile = {};
  for (const file of files) {
    const industry = getIndustryForFile(file);
    const raw = readFileSync(join(csvDir, file));
    const parsed = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true,
      trim: true,
    });

    let skippedNoPhone = 0;
    const mapped = [];
    for (const row of parsed) {
      const m = mapRow(row, industry);
      if (!m) {
        skippedNoPhone++;
        continue;
      }
      mapped.push(m);
    }
    perFile[file] = { industry, total: parsed.length, kept: mapped.length, skippedNoPhone };
    allRows.push(...mapped);

    console.log(
      `  ${file.padEnd(40)} → ${industry.padEnd(24)} (${parsed.length} parsed, ${mapped.length} kept, ${skippedNoPhone} no-phone)`
    );
  }

  // Dedupe within batch by phone (then by source_url as a fallback for rows w/o phone)
  const seenPhone = new Set();
  const seenUrl = new Set();
  const uniqueRows = [];
  let dupInBatch = 0;
  for (const r of allRows) {
    if (r.phone) {
      if (seenPhone.has(r.phone)) {
        dupInBatch++;
        continue;
      }
      seenPhone.add(r.phone);
    } else if (r.source_url) {
      if (seenUrl.has(r.source_url)) {
        dupInBatch++;
        continue;
      }
      seenUrl.add(r.source_url);
    }
    uniqueRows.push(r);
  }

  console.log(`\nParsed total: ${allRows.length}`);
  console.log(`In-batch duplicates removed: ${dupInBatch}`);
  console.log(`Unique candidates: ${uniqueRows.length}`);

  if (uniqueRows.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Check existing DB to dedupe (by phone AND website) — skip in dry-run.
  // Website has a DB-level UNIQUE constraint (idx_leads_website_unique), so a collision aborts the batch.
  let toInsert = uniqueRows;
  if (!dryRun) {
    const fetchExisting = async (col, values) => {
      const existing = new Set();
      for (let i = 0; i < values.length; i += 200) {
        const chunk = values.slice(i, i + 200);
        const { data, error: dbError } = await supabase.from('leads').select(col).in(col, chunk);
        if (dbError) {
          console.error(`Failed to read existing ${col}:`, dbError.message);
          process.exit(1);
        }
        for (const r of data || []) {
          if (r[col]) existing.add(r[col]);
        }
      }
      return existing;
    };

    const phones = uniqueRows.map(r => r.phone).filter(Boolean);
    const existingPhones = await fetchExisting('phone', phones);

    const websites = uniqueRows.map(r => r.website).filter(Boolean);
    const existingWebsites = await fetchExisting('website', websites);

    const before = toInsert.length;
    toInsert = toInsert.filter(
      r => (!r.phone || !existingPhones.has(r.phone)) && (!r.website || !existingWebsites.has(r.website)),
    );
    const alreadyInDb = before - toInsert.length;
    console.log(`Already in DB (by phone or website): ${alreadyInDb}`);

    // In-batch dedupe by website (some rows may share a website even with different phones)
    const seenWebsite = new Set();
    const beforeWebDedupe = toInsert.length;
    toInsert = toInsert.filter(r => {
      if (!r.website) return true;
      if (seenWebsite.has(r.website)) return false;
      seenWebsite.add(r.website);
      return true;
    });
    const inBatchWebDupes = beforeWebDedupe - toInsert.length;
    if (inBatchWebDupes > 0) console.log(`In-batch website duplicates removed: ${inBatchWebDupes}`);

    console.log(`Will insert: ${toInsert.length}`);
  } else {
    console.log(`Would insert (dry-run): ${toInsert.length}`);
    console.log('\nSample mapped row:');
    console.log(JSON.stringify(toInsert[0], null, 2));
    console.log('\nDry run complete. Re-run without --dry-run to commit.\n');
    return;
  }

  // Batched insert
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error: dbError } = await supabase.from('leads').insert(batch);
    if (dbError) {
      console.error(`\nInsert failed at batch ${i / BATCH_SIZE + 1}:`, dbError.message);
      console.error('Sample of failing batch (first row):');
      console.error(JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r  Inserted ${inserted} / ${toInsert.length}`);
  }
  console.log(`\n\nDone. Inserted ${inserted} leads.\n`);

  // Per-file summary
  console.log('Per-file summary:');
  for (const [file, info] of Object.entries(perFile)) {
    console.log(`  ${file.padEnd(40)} ${String(info.kept).padStart(5)} kept (${info.industry})`);
  }
}

main().catch(err => {
  console.error('\nFatal:', err);
  process.exit(1);
});
