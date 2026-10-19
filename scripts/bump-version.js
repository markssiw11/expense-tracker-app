#!/usr/bin/env node
/**
 * Bumps the app version consistently across every place it lives:
 *   - app.json           -> expo.version
 *   - package.json       -> version
 *   - android/app/build.gradle -> versionName + versionCode
 *   - ios .pbxproj       -> MARKETING_VERSION + CURRENT_PROJECT_VERSION
 *
 * app.json is treated as the source of truth for the current version.
 * The native build numbers (Android versionCode / iOS CURRENT_PROJECT_VERSION)
 * are incremented together and kept in sync with each other.
 *
 * Usage:
 *   node scripts/bump-version.js            # bump patch  (1.0.3 -> 1.0.4)
 *   node scripts/bump-version.js patch      # same as above
 *   node scripts/bump-version.js minor      # 1.0.3 -> 1.1.0
 *   node scripts/bump-version.js major      # 1.0.3 -> 2.0.0
 *   node scripts/bump-version.js 1.2.5      # set an explicit version
 *   node scripts/bump-version.js --dry-run  # print changes without writing
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP_JSON = path.join(ROOT, "app.json");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const GRADLE = path.join(ROOT, "android/app/build.gradle");
const PBXPROJ = path.join(
  ROOT,
  "ios/FamilyExpenseTracker.xcodeproj/project.pbxproj",
);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const target = args.find((a) => !a.startsWith("--")) || "patch";

function fail(msg) {
  console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function computeNextVersion(current, bump) {
  // Explicit "x.y.z" version.
  if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump;
  }
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    fail(`Current version "${current}" is not in x.y.z format`);
  }
  let [major, minor, patch] = parts;
  switch (bump) {
    case "major":
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor += 1;
      patch = 0;
      break;
    case "patch":
      patch += 1;
      break;
    default:
      fail(
        `Unknown bump type "${bump}". Use patch | minor | major | x.y.z`,
      );
  }
  return `${major}.${minor}.${patch}`;
}

// --- read current state ------------------------------------------------------

const appJson = readJson(APP_JSON);
const currentVersion = appJson.expo?.version;
if (!currentVersion) fail("Could not read expo.version from app.json");

const nextVersion = computeNextVersion(currentVersion, target);

// Derive the next build number from the current Android versionCode so the
// stores always receive a higher build number than the previous upload.
const gradleSrc = fs.readFileSync(GRADLE, "utf8");
const versionCodeMatch = gradleSrc.match(/versionCode\s+(\d+)/);
if (!versionCodeMatch) fail("Could not find versionCode in build.gradle");
const currentBuild = parseInt(versionCodeMatch[1], 10);
const nextBuild = currentBuild + 1;

console.log(`Version:  ${currentVersion}  ->  ${nextVersion}`);
console.log(`Build no: ${currentBuild}  ->  ${nextBuild}`);

if (dryRun) {
  console.log("\n(dry run — no files were changed)");
  process.exit(0);
}

// --- write changes -----------------------------------------------------------

// 1. app.json
appJson.expo.version = nextVersion;
fs.writeFileSync(APP_JSON, JSON.stringify(appJson, null, 2) + "\n");

// 2. package.json (preserve formatting minimally by targeted replace)
const pkgSrc = fs.readFileSync(PACKAGE_JSON, "utf8");
const pkgOut = pkgSrc.replace(
  /("version"\s*:\s*")[^"]+(")/,
  `$1${nextVersion}$2`,
);
fs.writeFileSync(PACKAGE_JSON, pkgOut);

// 3. android/app/build.gradle
let gradleOut = gradleSrc
  .replace(/versionCode\s+\d+/, `versionCode ${nextBuild}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);
fs.writeFileSync(GRADLE, gradleOut);

// 4. ios project.pbxproj (both Debug + Release configs)
let pbxOut = fs.readFileSync(PBXPROJ, "utf8");
pbxOut = pbxOut
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextVersion};`)
  .replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${nextBuild};`,
  );
fs.writeFileSync(PBXPROJ, pbxOut);

console.log("\n\x1b[32m✔ Version bumped across app.json, package.json, Android and iOS.\x1b[0m");
console.log("Remember to Clean Build Folder in Xcode before archiving.");
