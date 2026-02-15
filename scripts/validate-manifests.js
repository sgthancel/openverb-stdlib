#!/usr/bin/env node

/**
 * Validates all OpenVerb manifest files in manifests/
 *
 * Checks:
 * 1. Valid JSON
 * 2. Has required top-level fields: family, version, verbs
 * 3. Each verb has: id, version, summary, input, output
 * 4. Verb ids start with the family name
 * 5. Input and output are objects with "type": "object"
 */

const fs = require("fs");
const path = require("path");

const MANIFESTS_DIR = path.join(__dirname, "..", "manifests");

let errors = 0;
let verbCount = 0;
let familyCount = 0;

function fail(file, message) {
  console.error(`  FAIL  ${file}: ${message}`);
  errors++;
}

function pass(message) {
  console.log(`  OK    ${message}`);
}

console.log("\nOpenVerb Manifest Validator\n");

// Find all JSON files in manifests/
const files = fs.readdirSync(MANIFESTS_DIR).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error("No manifest files found in manifests/");
  process.exit(1);
}

for (const file of files) {
  const filePath = path.join(MANIFESTS_DIR, file);
  let manifest;

  // 1. Valid JSON
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    manifest = JSON.parse(raw);
  } catch (err) {
    fail(file, `Invalid JSON: ${err.message}`);
    continue;
  }

  // 2. Top-level fields
  if (!manifest.family || typeof manifest.family !== "string") {
    fail(file, 'Missing or invalid "family" field');
  }
  if (!manifest.version || typeof manifest.version !== "string") {
    fail(file, 'Missing or invalid "version" field');
  }
  if (!Array.isArray(manifest.verbs) || manifest.verbs.length === 0) {
    fail(file, 'Missing or empty "verbs" array');
    continue;
  }

  familyCount++;

  // 3. Validate each verb
  for (const verb of manifest.verbs) {
    if (!verb.id || typeof verb.id !== "string") {
      fail(file, `Verb missing "id"`);
      continue;
    }

    // 4. Verb id must start with family name
    if (!verb.id.startsWith(manifest.family + ".")) {
      fail(file, `Verb "${verb.id}" does not start with family "${manifest.family}."`);
    }

    if (!verb.version) {
      fail(file, `Verb "${verb.id}" missing "version"`);
    }
    if (!verb.summary || typeof verb.summary !== "string") {
      fail(file, `Verb "${verb.id}" missing "summary"`);
    }

    // 5. Input schema
    if (!verb.input || verb.input.type !== "object") {
      fail(file, `Verb "${verb.id}" input must be { type: "object", ... }`);
    }

    // 5. Output schema
    if (!verb.output || verb.output.type !== "object") {
      fail(file, `Verb "${verb.id}" output must be { type: "object", ... }`);
    }

    verbCount++;
  }

  pass(`${file} — ${manifest.family} (${manifest.verbs.length} verbs)`);
}

console.log(
  `\n${familyCount} families, ${verbCount} verbs validated across ${files.length} files.`
);

if (errors > 0) {
  console.error(`\n${errors} error(s) found.\n`);
  process.exit(1);
} else {
  console.log("All manifests valid.\n");
  process.exit(0);
}
