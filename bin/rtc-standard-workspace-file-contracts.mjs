import {
  RTC_TEMPLATE_MATERIALIZED_FILES,
  RTC_TEMPLATE_SOURCE_FILES,
} from './materialize-sdk-template-assets.mjs';

export const RTC_ROOT_REQUIRED_CONTRACT_FILES = Object.freeze([
  '.gitignore',
  '.sdkwork-assembly.json',
  'docs/multilanguage-capability-matrix.md',
  ...RTC_TEMPLATE_MATERIALIZED_FILES,
  ...RTC_TEMPLATE_SOURCE_FILES,
]);

export const RTC_TYPESCRIPT_REQUIRED_STANDARD_FILES = Object.freeze([
  'sdkwork-rtc-sdk-typescript/package.json',
  'sdkwork-rtc-sdk-typescript/README.md',
  'sdkwork-rtc-sdk-typescript/bin/package-task.mjs',
  'sdkwork-rtc-sdk-typescript/src/capability-catalog.ts',
  'sdkwork-rtc-sdk-typescript/src/capability-negotiation.ts',
  'sdkwork-rtc-sdk-typescript/src/errors.ts',
  'sdkwork-rtc-sdk-typescript/src/runtime-surface.ts',
  'sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-selection.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-support.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts',
  'sdkwork-rtc-sdk-typescript/src/index.ts',
  'sdkwork-rtc-sdk-typescript/src/provider-catalog.ts',
]);

export const RTC_TYPESCRIPT_REQUIRED_TEST_FILES = Object.freeze([
  'sdkwork-rtc-sdk-typescript/test/provider-extension-catalog.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/capability-negotiation.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/provider-selection-standard.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/provider-support-standard.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/driver-manager.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/data-source.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/built-in-providers.test.mjs',
  'sdkwork-rtc-sdk-typescript/test/provider-package-loader.test.mjs',
]);

export const RTC_TYPESCRIPT_PROVIDER_PACKAGE_ROOT_README =
  'sdkwork-rtc-sdk-typescript/providers/README.md';
