#!/usr/bin/env node

/**
 * Company Tools — validation & dedup for companies.json
 *
 * Usage:
 *   node scripts/company-tools.js validate          — full validation of companies.json
 *   node scripts/company-tools.js check <CUI>       — check if CUI already exists
 *   node scripts/company-tools.js check-bulk <CUI1> <CUI2> ...  — batch CUI check
 *   node scripts/company-tools.js stats              — directory statistics
 */

const fs = require("fs");
const path = require("path");

const COMPANIES_PATH = path.join(__dirname, "..", "data", "companies.json");
const COUNTIES_PATH = path.join(__dirname, "..", "data", "counties.json");
const SPECS_PATH = path.join(__dirname, "..", "data", "specializations.json");

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadCompanies() {
  return loadJSON(COMPANIES_PATH).companies;
}

// ─── CHECK: CUI dedup ──────────────────────────────────────────────

function checkCUI(cuiList) {
  const companies = loadCompanies();
  const existingCUIs = new Map(
    companies.map((c) => [c.cui.replace(/^RO/i, "").trim(), c])
  );

  let foundDupes = 0;

  for (const rawCUI of cuiList) {
    const normalized = rawCUI.replace(/^RO/i, "").trim();
    const match = existingCUIs.get(normalized);
    if (match) {
      console.log(`  DUPLICATE  CUI ${rawCUI} → ${match.name} (${match.slug})`);
      foundDupes++;
    } else {
      console.log(`  OK         CUI ${rawCUI} — not in directory`);
    }
  }

  console.log(
    `\n${foundDupes === 0 ? "✓" : "✗"} ${cuiList.length} checked, ${foundDupes} duplicate(s)\n`
  );
  return foundDupes;
}

// ─── VALIDATE: full companies.json validation ───────────────────────

function validate() {
  const companies = loadCompanies();
  const counties = loadJSON(COUNTIES_PATH).counties;
  const specs = loadJSON(SPECS_PATH).specializations.map((s) => s.id);

  const errors = [];
  const warnings = [];

  const seenCUIs = new Map();
  const seenSlugs = new Map();
  const seenIds = new Map();
  const seenNames = new Map();

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const prefix = `[${i + 1}] ${c.name || "UNNAMED"}`;

    // ── Required fields ──
    const requiredStrings = ["id", "slug", "name", "cui", "description"];
    for (const field of requiredStrings) {
      if (!c[field] || typeof c[field] !== "string" || c[field].trim() === "") {
        errors.push(`${prefix}: missing or empty required field "${field}"`);
      }
    }

    // ── CUI format ──
    // Prefixul RO înseamnă „înregistrat în scopuri de TVA". Firmele neplătitoare
    // de TVA (Sunlux Energy, Moldovan Ecoserv) au CUI-ul fără prefix la ANAF, deci
    // ambele forme sunt corecte.
    if (c.cui && !/^(RO)?\d+$/.test(c.cui.trim())) {
      errors.push(`${prefix}: invalid CUI format "${c.cui}" (expected digits, optionally RO-prefixed)`);
    }

    // ── Duplicate CUI ──
    if (c.cui) {
      const normCUI = c.cui.replace(/^RO/i, "").trim();
      if (seenCUIs.has(normCUI)) {
        errors.push(
          `${prefix}: DUPLICATE CUI ${c.cui} — also used by "${seenCUIs.get(normCUI)}"`
        );
      }
      seenCUIs.set(normCUI, c.name);
    }

    // ── Duplicate slug ──
    if (c.slug) {
      if (seenSlugs.has(c.slug)) {
        errors.push(
          `${prefix}: DUPLICATE slug "${c.slug}" — also used by "${seenSlugs.get(c.slug)}"`
        );
      }
      seenSlugs.set(c.slug, c.name);
    }

    // ── Duplicate id ──
    if (c.id) {
      if (seenIds.has(c.id)) {
        errors.push(
          `${prefix}: DUPLICATE id "${c.id}" — also used by "${seenIds.get(c.id)}"`
        );
      }
      seenIds.set(c.id, c.name);
    }

    // ── Duplicate name (warning, not error) ──
    if (c.name) {
      const normName = c.name.toLowerCase().trim();
      if (seenNames.has(normName)) {
        warnings.push(
          `${prefix}: similar name to "${seenNames.get(normName)}"`
        );
      }
      seenNames.set(normName, c.name);
    }

    // ── Slug format ──
    if (c.slug && !/^[a-z0-9-]+$/.test(c.slug)) {
      errors.push(`${prefix}: invalid slug "${c.slug}" (use lowercase, digits, hyphens)`);
    }

    // ── id === slug ──
    if (c.id && c.slug && c.id !== c.slug) {
      warnings.push(`${prefix}: id "${c.id}" differs from slug "${c.slug}"`);
    }

    // ── Location ──
    if (!c.location || !c.location.county) {
      errors.push(`${prefix}: missing location.county`);
    } else if (!counties.includes(c.location.county)) {
      errors.push(
        `${prefix}: invalid county "${c.location.county}" — not in counties.json`
      );
    }

    // ── Contact ──
    if (!c.contact || !c.contact.website) {
      warnings.push(`${prefix}: missing website`);
    }
    if (
      c.contact &&
      c.contact.website &&
      !c.contact.website.startsWith("http")
    ) {
      errors.push(
        `${prefix}: website should start with http(s): "${c.contact.website}"`
      );
    }

    // ── Coverage — valid counties ──
    if (c.coverage && Array.isArray(c.coverage)) {
      for (const county of c.coverage) {
        if (!counties.includes(county)) {
          errors.push(`${prefix}: invalid coverage county "${county}"`);
        }
      }
    }

    // ── Specializations — valid ids ──
    if (c.specializations && Array.isArray(c.specializations)) {
      for (const spec of c.specializations) {
        if (!specs.includes(spec)) {
          errors.push(`${prefix}: invalid specialization "${spec}"`);
        }
      }
    }

    // ── Financials ──
    if (c.financials) {
      if (
        c.financials.year &&
        (c.financials.year < 2000 || c.financials.year > 2026)
      ) {
        warnings.push(
          `${prefix}: unusual financial year ${c.financials.year}`
        );
      }
    }

    // ── Founded ──
    if (c.founded && (c.founded < 1900 || c.founded > 2026)) {
      errors.push(`${prefix}: unusual founded year ${c.founded}`);
    }

    // ── Dates ──
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (c.createdAt && !datePattern.test(c.createdAt)) {
      errors.push(`${prefix}: invalid createdAt format "${c.createdAt}"`);
    }
    if (c.updatedAt && !datePattern.test(c.updatedAt)) {
      errors.push(`${prefix}: invalid updatedAt format "${c.updatedAt}"`);
    }

    // ── Empty contact fields (info, not blocking) ──
    if (c.contact && !c.contact.phone && !c.contact.email) {
      warnings.push(`${prefix}: no phone or email`);
    }
  }

  // ── Output ──
  console.log(`\n📋 Validated ${companies.length} companies\n`);

  if (errors.length > 0) {
    console.log(`✗ ${errors.length} ERROR(S):`);
    errors.forEach((e) => console.log(`  ${e}`));
    console.log("");
  }

  if (warnings.length > 0) {
    console.log(`⚠ ${warnings.length} WARNING(S):`);
    warnings.forEach((w) => console.log(`  ${w}`));
    console.log("");
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✓ All checks passed — no errors, no warnings\n");
  } else if (errors.length === 0) {
    console.log("✓ No errors (warnings are non-blocking)\n");
  }

  return errors.length;
}

// ─── STATS: directory overview ──────────────────────────────────────

function stats() {
  const companies = loadCompanies();

  const byCounty = {};
  const bySpec = {};
  let totalRevenue = 0;
  let revenueCount = 0;
  let featured = 0;
  let withLogo = 0;
  let withPhone = 0;
  let withEmail = 0;

  for (const c of companies) {
    // County
    const county = c.location?.county || "Unknown";
    byCounty[county] = (byCounty[county] || 0) + 1;

    // Specializations
    for (const spec of c.specializations || []) {
      bySpec[spec] = (bySpec[spec] || 0) + 1;
    }

    // Revenue
    if (c.financials?.revenue > 0) {
      totalRevenue += c.financials.revenue;
      revenueCount++;
    }

    if (c.featured) featured++;
    if (c.logo) withLogo++;
    if (c.contact?.phone) withPhone++;
    if (c.contact?.email) withEmail++;
  }

  console.log(`\n📊 Directory Statistics`);
  console.log(`${"─".repeat(45)}`);
  console.log(`Total firme:        ${companies.length}`);
  console.log(`Featured:           ${featured}`);
  console.log(`Cu logo:            ${withLogo}`);
  console.log(`Cu telefon:         ${withPhone}`);
  console.log(`Cu email:           ${withEmail}`);
  console.log(
    `Revenue total:      ${(totalRevenue / 1_000_000).toFixed(1)}M RON (${revenueCount} firme cu date)`
  );
  console.log(`\nPer județ:`);
  Object.entries(byCounty)
    .sort((a, b) => b[1] - a[1])
    .forEach(([county, count]) => {
      console.log(`  ${county.padEnd(20)} ${count}`);
    });

  console.log(`\nPer specializare:`);
  Object.entries(bySpec)
    .sort((a, b) => b[1] - a[1])
    .forEach(([spec, count]) => {
      console.log(`  ${spec.padEnd(20)} ${count}`);
    });

  console.log("");
}

// ─── CLI ────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
  case "check":
    if (args.length === 0) {
      console.log("Usage: node company-tools.js check <CUI> [<CUI2> ...]");
      process.exit(1);
    }
    process.exit(checkCUI(args) > 0 ? 1 : 0);
    break;

  case "check-bulk":
    if (args.length === 0) {
      console.log(
        "Usage: node company-tools.js check-bulk <CUI1> <CUI2> ..."
      );
      process.exit(1);
    }
    process.exit(checkCUI(args) > 0 ? 1 : 0);
    break;

  case "validate":
    process.exit(validate() > 0 ? 1 : 0);
    break;

  case "stats":
    stats();
    break;

  default:
    console.log(`
Company Tools — validation & dedup for companies.json

Commands:
  validate                    Full validation (dupes, fields, formats)
  check <CUI>                 Check if CUI exists in directory
  check-bulk <CUI1> <CUI2>   Batch CUI check
  stats                       Directory statistics overview
`);
    break;
}
