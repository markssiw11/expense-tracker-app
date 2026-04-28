const {
  withInfoPlist,
  withStringsXml,
  withXcodeProject,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withAppNameLocalization(config) {
  const enName = "FamFinance";
  const viName = "Sổ Tay Gia Đình";

  // iOS: Add localized InfoPlist.strings
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosPath = path.join(
      projectRoot,
      "ios",
      config.modRequest.projectName,
    );

    // Create en.lproj
    const enDir = path.join(iosPath, "en.lproj");
    fs.mkdirSync(enDir, { recursive: true });
    fs.writeFileSync(
      path.join(enDir, "InfoPlist.strings"),
      `CFBundleDisplayName = "${enName}";\nCFBundleName = "${enName}";\n`,
    );

    // Create vi.lproj
    const viDir = path.join(iosPath, "vi.lproj");
    fs.mkdirSync(viDir, { recursive: true });
    fs.writeFileSync(
      path.join(viDir, "InfoPlist.strings"),
      `CFBundleDisplayName = "${viName}";\nCFBundleName = "${viName}";\n`,
    );

    // Add known region
    const pbxProject = project.hash.project;
    const projectUuid = Object.keys(pbxProject)[0];
    if (pbxProject[projectUuid] && pbxProject[projectUuid].knownRegions) {
      const regions = pbxProject[projectUuid].knownRegions;
      if (!regions.includes("vi")) {
        regions.splice(regions.length - 1, 0, "vi");
      }
    }

    // Add variant group for InfoPlist.strings
    project.addKnownRegion("vi");
    const groupKey = project.addLocalizationVariantGroup("InfoPlist.strings");
    project.addResourceFile(
      "en.lproj/InfoPlist.strings",
      { variantGroup: true },
      groupKey,
    );
    project.addResourceFile(
      "vi.lproj/InfoPlist.strings",
      { variantGroup: true },
      groupKey,
    );

    return config;
  });

  // Android: Add localized strings
  config = withStringsXml(config, (config) => {
    config.modResults = setStringItem(config.modResults, "app_name", enName);
    return config;
  });

  // Write Android vi strings
  config = withStringsXml(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const viValuesDir = path.join(
      projectRoot,
      "android/app/src/main/res/values-vi",
    );
    fs.mkdirSync(viValuesDir, { recursive: true });
    fs.writeFileSync(
      path.join(viValuesDir, "strings.xml"),
      `<resources>\n  <string name="app_name">${viName}</string>\n</resources>\n`,
    );
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
