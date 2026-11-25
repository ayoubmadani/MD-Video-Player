// Limits packaged native libraries (including libvlc, which ships every ABI) to the
// architectures listed in gradle.properties `reactNativeArchitectures`
// (set via expo-build-properties `android.buildArchs`).
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @md-abi-filters';

module.exports = function withAbiFilters(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /defaultConfig\s*\{/,
      (match) =>
        `${match}\n        ${MARKER}\n        ndk {\n            abiFilters(*((findProperty('reactNativeArchitectures') ?: 'arm64-v8a').split(',').collect { it.trim() }))\n        }`,
    );
    return cfg;
  });
};
