/**
 * Update Lead Links from Infoshop CSVs
 *
 * Reads downloaded infoshop.ge CSV files and updates existing leads
 * with actual website and facebook_url values (matched by phone number).
 *
 * Usage:
 *   node --env-file=.env.local scripts/update-lead-links.mjs
 *   node --env-file=.env.local scripts/update-lead-links.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';

// ---------- Config ----------

const BATCH_SIZE = 500;
const PLACEHOLDER = 'არ მოიძებნა';
const DOWNLOADS_DIR = 'C:/Users/hp/Downloads';

const CSV_FILES = [
  'განათლება, მეცნიერება (3).csv',
  'სავაჭრო ობიექტები.csv',
  'სამედიცინო.csv',
  'სამშენებლო.csv',
  'სასმელები (1).csv',
  'ტურიზმი (1).csv',
  'ფინანსები.csv',
  'წარმოება (1).csv',
  'ხელოვნება.csv',
];

// ---------- CLI ----------

const dryRun = process.argv.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !supabaseKey)) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('Run with: node --env-file=.env.local scripts/update-lead-links.mjs');
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
  return s.replace(/\s+/g, '');
}

function normalizeUrl(v) {
  const s = cleanValue(v);
  if (!s) return null;
  // Skip infoshop.ge URLs
  if (/infoshop\.ge/i.test(s)) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function normalizeFacebook(v) {
  const s = cleanValue(v);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('www.')) return `https://${s}`;
  // Bare handle
  return `https://www.facebook.com/${s}`;
}

// ---------- Parse CSVs ----------

console.log('=== Update Lead Links from Infoshop CSVs ===\n');

/** @type {Map<string, {website: string|null, facebook: string|null}>} phone -> links */
const phoneLinkMap = new Map();

for (const filename of CSV_FILES) {
  const filepath = `${DOWNLOADS_DIR}/${filename}`;
  let raw;
  try {
    raw = readFileSync(filepath, 'utf8');
  } catch (e) {
    console.warn(`  SKIP ${filename} — file not found`);
    continue;
  }

  // Remove BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  let count = 0;

  for (const row of rows) {
    const phone = normalizePhone(row.phone);
    if (!phone) continue;

    const website = normalizeUrl(row.website);
    const facebook = normalizeFacebook(row.facebook);

    if (!website && !facebook) continue;

    // Only store first occurrence per phone (avoid duplicates overwriting)
    if (!phoneLinkMap.has(phone)) {
      phoneLinkMap.set(phone, { website, facebook });
      count++;
    } else {
      // Fill in missing fields from later rows
      const existing = phoneLinkMap.get(phone);
      if (!existing.website && website) existing.website = website;
      if (!existing.facebook && facebook) existing.facebook = facebook;
    }
  }

  console.log(`  ${filename}: ${count} new phone→link entries`);
}

console.log(`\nTotal unique phones with links: ${phoneLinkMap.size}`);

if (dryRun) {
  console.log('\n[DRY RUN] Would update leads. Exiting.');
  // Show sample
  let i = 0;
  for (const [phone, links] of phoneLinkMap) {
    if (i++ >= 5) break;
    console.log(`  ${phone} → website: ${links.website || '—'}, fb: ${links.facebook || '—'}`);
  }
  process.exit(0);
}

// ---------- Update DB ----------

console.log('\nFetching existing leads by phone...\n');

const phones = [...phoneLinkMap.keys()];
let updated = 0;
let skipped = 0;

// Process in batches
for (let i = 0; i < phones.length; i += BATCH_SIZE) {
  const batch = phones.slice(i, i + BATCH_SIZE);

  // Fetch leads matching these phone numbers
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, phone, website, facebook_url')
    .in('phone', batch);

  if (error) {
    console.error(`  ERROR fetching batch ${i}: ${error.message}`);
    continue;
  }

  if (!leads || leads.length === 0) continue;

  // Update each lead
  for (const lead of leads) {
    const links = phoneLinkMap.get(lead.phone);
    if (!links) continue;

    const updates = {};

    // Only update website if lead has none or it points to infoshop
    if (links.website) {
      const currentSite = lead.website || '';
      if (!currentSite || /infoshop\.ge/i.test(currentSite)) {
        updates.website = links.website;
      }
    }

    // Only update facebook if lead has none
    if (links.facebook) {
      if (!lead.facebook_url) {
        updates.facebook_url = links.facebook;
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id);

    if (updateError) {
      console.error(`  ERROR updating lead ${lead.id}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  const progress = Math.min(i + BATCH_SIZE, phones.length);
  process.stdout.write(`  Processed ${progress}/${phones.length} phones (${updated} updated, ${skipped} skipped)\r`);
}

console.log(`\n\nDone! Updated ${updated} leads, skipped ${skipped} (already had data).`);
