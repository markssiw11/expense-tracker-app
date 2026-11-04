const { withStringsXml, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Localized app display names per language.
// "en" is the base/default name; the others override it when the device
// language matches. Add a new entry here to support another language.
const APP_NAMES = {
  en: "FamFinance Family Budget",
  vi: "Sổ Tay Gia Đình",
  ja: "家計簿",
  ko: "가계부",
  id: "Keuangan Keluarga",
  hi: "पारिवारिक बजट",
  th: "การเงินครอบครัว",
  fil: "Pananalapi ng Pamilya",
};

// Non-base locales that need their own localization folder/variant.
const EXTRA_LOCALES = Object.keys(APP_NAMES).filter((lng) => lng !== "en");

function escapeXcode(value) {
  return value.replace(/"/g, '\\"');
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function withAppNameLocalization(config) {
  // iOS: write a localized InfoPlist.strings for each language.
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(projectRoot, "ios");

    const writeInfoPlistStrings = (locale, name) => {
      const dir = path.join(iosPath, `${locale}.lproj`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "InfoPlist.strings"),
        `CFBundleDisplayName = "${escapeXcode(name)}";\nCFBundleName = "${escapeXcode(
          name,
        )}";\n`,
      );
    };

    // Base (English) + all extra locales.
    writeInfoPlistStrings("en", APP_NAMES.en);
    EXTRA_LOCALES.forEach((locale) =>
      writeInfoPlistStrings(locale, APP_NAMES[locale]),
    );

    EXTRA_LOCALES.forEach((locale) => project.addKnownRegion(locale));

    // The xcode lib's addResourceFile calls correctForResourcesPath, which
    // throws if there is no PBXGroup named "Resources". Expo projects don't
    // ship one, so create it first.
    if (!project.pbxGroupByName("Resources")) {
      project.addPbxGroup([], "Resources", "Resources");
    }

    // Reuse an existing group on repeated prebuilds and add only missing files.
    const groupKey =
      project.findPBXVariantGroupKey({ name: "InfoPlist.strings" }) ||
      project.addLocalizationVariantGroup("InfoPlist.strings");
    const variantGroup = project.getPBXVariantGroupByKey(groupKey);
    const fileReferences = project.hash.project.objects.PBXFileReference;
    const registeredLocales = new Set(
      (variantGroup?.children ?? [])
        .map(({ value }) => {
          const fileReference = fileReferences[value];
          const filePath = fileReference?.path?.replace(/^"|"$/g, "");
          return filePath?.match(/(?:^|\/)([^/]+)\.lproj\//)?.[1];
        })
        .filter(Boolean),
    );

    ["en", ...EXTRA_LOCALES].forEach((locale) => {
      if (registeredLocales.has(locale)) return;
      try {
        project.addResourceFile(
          `${locale}.lproj/InfoPlist.strings`,
          { variantGroup: true },
          groupKey,
        );
        registeredLocales.add(locale);
      } catch (e) {
        console.warn(
          `withAppNameLocalization: could not add ${locale}.lproj/InfoPlist.strings`,
          e.message,
        );
      }
    });

    return config;
  });

  // Android: set the default app_name (English) in the base strings.xml.
  config = withStringsXml(config, (config) => {
    config.modResults = setStringItem(
      config.modResults,
      "app_name",
      APP_NAMES.en,
    );
    return config;
  });

  // Android: write a values-<locale>/strings.xml for each extra locale.
  config = withStringsXml(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    EXTRA_LOCALES.forEach((locale) => {
      const valuesDir = path.join(
        projectRoot,
        `android/app/src/main/res/values-${locale}`,
      );
      fs.mkdirSync(valuesDir, { recursive: true });
      fs.writeFileSync(
        path.join(valuesDir, "strings.xml"),
        `<resources>\n  <string name="app_name">${escapeXml(
          APP_NAMES[locale],
        )}</string>\n</resources>\n`,
      );
    });
    return config;
  });

  return config;
}

function setStringItem(stringsXml, name, value) {
  const existingItem = stringsXml.resources.string?.find(
    (item) => item.$?.name === name,
  );
  if (existingItem) {
    existingItem._ = value;
  }
  return stringsXml;
}

module.exports = withAppNameLocalization;
