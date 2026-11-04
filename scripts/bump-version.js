#!/usr/bin/env node
/**
 * Bumps the app version consistently across every place it lives:
 *   - app.json           -> expo.version, ios.buildNumber, android.versionCode
 *   - package.json       -> version
 *   - android/app/build.gradle -> versionName + versionCode
 *   - ios .pbxproj       -> MARKETING_VERSION + CURRENT_PROJECT_VERSION
 *   - ios Info.plist     -> CFBundleShortVersionString + CFBundleVersion
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

const ROOT = path.resolve(path.dirname(process.argv[1]), "..");
const APP_JSON = path.join(ROOT, "app.json");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const GRADLE = path.join(ROOT, "android/app/build.gradle");
const PBXPROJ = path.join(
  ROOT,
  "ios/FamilyExpenseTracker.xcodeproj/project.pbxproj",
);
const INFO_PLIST = path.join(ROOT, "ios/FamilyExpenseTracker/Info.plist");

const VERSION_CODE_RE = /^([ \t]*versionCode[ \t]+)(\d+)\b/gm;
const VERSION_NAME_RE = /^([ \t]*versionName[ \t]+")([^"]+)(")/gm;
const MARKETING_VERSION_RE = /(\bMARKETING_VERSION\s*=\s*)[^;]+;/g;
const PROJECT_VERSION_RE = /(\bCURRENT_PROJECT_VERSION\s*=\s*)(\d+);/g;
const PLIST_SHORT_VERSION_RE =
  /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/g;
const PLIST_BUILD_VERSION_RE =
  /(<key>CFBundleVersion<\/key>\s*<string>)(\d+)(<\/string>)/g;

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  let dryRun = false;
  let target;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node scripts/bump-version.js [patch|minor|major|x.y.z] [--dry-run]",
      );
      process.exit(0);
    } else if (arg.startsWith("-")) {
      fail(`Unknown option "${arg}". Use --help for usage.`);
    } else if (target) {
      fail("Specify only one bump type or explicit version.");
    } else {
      target = arg;
    }
  }

  return { dryRun, target: target || "patch" };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(
      `Could not read valid JSON from ${path.relative(ROOT, file)}: ${error.message}`,
    );
  }
}

function matchesFor(source, regex, label, expectedCount) {
  const matches = [...source.matchAll(regex)];
  if (!matches.length) fail(`Could not find ${label}.`);
  if (expectedCount !== undefined && matches.length !== expectedCount) {
    fail(`Expected ${expectedCount} ${label}, found ${matches.length}.`);
  }
  return matches;
}

function replaceChecked(source, regex, replacer, label, expectedCount) {
  matchesFor(source, regex, label, expectedCount);
  return source.replace(regex, replacer);
}

function parseBuildNumber(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    fail(`${label} must be a non-negative integer; found "${value}".`);
  }
  return number;
}

function computeNextVersion(current, bump) {
  const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!versionPattern.test(current)) {
    fail(`Current version "${current}" is not in x.y.z format.`);
  }
  if (versionPattern.test(bump)) return bump;

  const parts = current.split(".").map(Number);
  switch (bump) {
    case "major":
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case "minor":
      parts[1] += 1;
      parts[2] = 0;
      break;
    case "patch":
      parts[2] += 1;
      break;
    default:
      fail(`Unknown bump type "${bump}". Use patch | minor | major | x.y.z.`);
  }
  if (parts.some((part) => !Number.isSafeInteger(part))) {
    fail("The next version exceeds the safe integer range.");
  }
  return parts.join(".");
}

function main() {
  const { dryRun, target } = parseArgs(process.argv.slice(2));
  const appJson = readJson(APP_JSON);
  const packageJson = readJson(PACKAGE_JSON);
  const expo = appJson.expo;
  if (!expo?.version || !expo.ios || !expo.android) {
    fail("app.json must define expo.version, expo.ios, and expo.android.");
  }
  if (!packageJson.version) fail("Could not read version from package.json.");

  const currentVersion = expo.version;
  const nextVersion = computeNextVersion(currentVersion, target);
  const gradleSrc = fs.readFileSync(GRADLE, "utf8");
  const pbxSrc = fs.readFileSync(PBXPROJ, "utf8");
  const infoPlistSrc = fs.readFileSync(INFO_PLIST, "utf8");

  const gradleBuildMatches = matchesFor(
    gradleSrc,
    VERSION_CODE_RE,
    "versionCode in build.gradle",
    1,
  );
  matchesFor(gradleSrc, VERSION_NAME_RE, "versionName in build.gradle", 1);
  const projectBuildMatches = matchesFor(
    pbxSrc,
    PROJECT_VERSION_RE,
    "CURRENT_PROJECT_VERSION in project.pbxproj",
  );
  matchesFor(
    pbxSrc,
    MARKETING_VERSION_RE,
    "MARKETING_VERSION in project.pbxproj",
  );
  matchesFor(
    infoPlistSrc,
    PLIST_SHORT_VERSION_RE,
    "CFBundleShortVersionString in Info.plist",
    1,
  );
  const plistBuildMatches = matchesFor(
    infoPlistSrc,
    PLIST_BUILD_VERSION_RE,
    "CFBundleVersion in Info.plist",
    1,
  );

  const buildNumbers = [
    parseBuildNumber(expo.ios.buildNumber, "app.json ios.buildNumber"),
    parseBuildNumber(expo.android.versionCode, "app.json android.versionCode"),
    ...gradleBuildMatches.map((match) =>
      parseBuildNumber(match[2], "Android versionCode"),
    ),
    ...projectBuildMatches.map((match) =>
      parseBuildNumber(match[2], "iOS CURRENT_PROJECT_VERSION"),
    ),
    ...plistBuildMatches.map((match) =>
      parseBuildNumber(match[2], "iOS CFBundleVersion"),
    ),
  ];
  const currentBuild = Math.max(...buildNumbers);
  const nextBuild = currentBuild + 1;
  if (!Number.isSafeInteger(nextBuild))
    fail("The next build number is too large.");

  const nextAppJson = {
    ...appJson,
    expo: {
      ...expo,
      version: nextVersion,
      ios: { ...expo.ios, buildNumber: String(nextBuild) },
      android: { ...expo.android, versionCode: nextBuild },
    },
  };
  const nextPackageJson = { ...packageJson, version: nextVersion };
  const gradleOut = replaceChecked(
    replaceChecked(
      gradleSrc,
      VERSION_CODE_RE,
      (_match, prefix) => `${prefix}${nextBuild}`,
      "versionCode in build.gradle",
      1,
    ),
    VERSION_NAME_RE,
    (_match, prefix, _current, suffix) => `${prefix}${nextVersion}${suffix}`,
    "versionName in build.gradle",
    1,
  );
  const pbxOut = replaceChecked(
    replaceChecked(
      pbxSrc,
      MARKETING_VERSION_RE,
      (_match, prefix) => `${prefix}${nextVersion};`,
      "MARKETING_VERSION in project.pbxproj",
    ),
    PROJECT_VERSION_RE,
    (_match, prefix) => `${prefix}${nextBuild};`,
    "CURRENT_PROJECT_VERSION in project.pbxproj",
  );
  const infoPlistOut = replaceChecked(
    replaceChecked(
      infoPlistSrc,
      PLIST_SHORT_VERSION_RE,
      (_match, prefix, suffix) => `${prefix}${nextVersion}${suffix}`,
      "CFBundleShortVersionString in Info.plist",
      1,
    ),
    PLIST_BUILD_VERSION_RE,
    (_match, prefix, _current, suffix) => `${prefix}${nextBuild}${suffix}`,
    "CFBundleVersion in Info.plist",
    1,
  );

  console.log(`Version:  ${currentVersion}  ->  ${nextVersion}`);
  console.log(`Build no: ${currentBuild}  ->  ${nextBuild}`);
  if (dryRun) {
    console.log("\n(dry run — no files were changed)");
    return;
  }

  const updates = [
    [APP_JSON, `${JSON.stringify(nextAppJson, null, 2)}\n`],
    [PACKAGE_JSON, `${JSON.stringify(nextPackageJson, null, 2)}\n`],
    [GRADLE, gradleOut],
    [PBXPROJ, pbxOut],
    [INFO_PLIST, infoPlistOut],
  ];

  for (const [file, contents] of updates) {
    fs.writeFileSync(file, contents);
  }

  console.log(
    "\n✔ Version and build number synchronized across Expo, npm, Android, and iOS.",
  );
  console.log("Create a new Xcode archive to use the updated version.");
}

try {
  main();
} catch (error) {
  console.error(`\x1b[31m✖ ${error.message}\x1b[0m`);
  process.exitCode = 1;
}
