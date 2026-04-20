import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('root public API keeps core contracts and builtin helpers only', async () => {
  const sdk = await loadSdk();

  assert.equal(typeof sdk.RtcDriverManager, 'function');
  assert.equal(typeof sdk.RtcDataSource, 'function');
  assert.equal(typeof sdk.resolveRtcProviderSelection, 'function');
  assert.equal(typeof sdk.parseRtcProviderUrl, 'function');
  assert.equal(typeof sdk.RTC_PROVIDER_SELECTION_SOURCES, 'object');
  assert.equal(typeof sdk.RTC_PROVIDER_SELECTION_PRECEDENCE, 'object');
  assert.equal(typeof sdk.resolveRtcCapabilityNegotiationStatus, 'function');
  assert.equal(typeof sdk.RTC_CAPABILITY_NEGOTIATION_STATUSES, 'object');
  assert.equal(typeof sdk.RTC_CAPABILITY_NEGOTIATION_RULES, 'object');
  assert.equal(typeof sdk.RtcSdkException, 'function');
  assert.equal(typeof sdk.RTC_SDK_ERROR_CODES, 'object');
  assert.equal(typeof sdk.RTC_SDK_ERROR_FALLBACK_CODE, 'string');
  assert.equal(typeof sdk.RTC_RUNTIME_SURFACE_METHODS, 'object');
  assert.equal(typeof sdk.RTC_RUNTIME_SURFACE_FAILURE_CODE, 'string');
  assert.equal(typeof sdk.RTC_RUNTIME_IMMUTABILITY_STANDARD, 'object');
  assert.equal(typeof sdk.RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM, 'string');
  assert.equal(typeof sdk.RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM, 'string');
  assert.equal(typeof sdk.RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM, 'string');
  assert.equal(typeof sdk.RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM, 'string');
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_STANDARD, 'object');
  assert.equal(
    typeof sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
    'object',
  );
  assert.equal(
    typeof sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
    'object',
  );
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES, 'object');
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES, 'object');
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS, 'object');
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM, 'string');
  assert.equal(typeof sdk.RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM, 'string');
  assert.equal(typeof sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD, 'object');
  assert.equal(typeof sdk.RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS, 'object');
  assert.equal(typeof sdk.RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS, 'object');
  assert.deepEqual(sdk.RTC_SDK_ERROR_CODES, [
    'provider_package_not_found',
    'provider_package_identity_mismatch',
    'provider_package_load_failed',
    'provider_module_export_missing',
    'provider_module_contract_mismatch',
    'driver_already_registered',
    'driver_not_found',
    'provider_not_official',
    'provider_not_supported',
    'provider_metadata_mismatch',
    'provider_selection_failed',
    'capability_not_supported',
    'invalid_provider_url',
    'native_sdk_not_available',
    'vendor_error',
  ]);
  assert.deepEqual(sdk.RTC_RUNTIME_SURFACE_METHODS, [
    'join',
    'leave',
    'publish',
    'unpublish',
    'muteAudio',
    'muteVideo',
  ]);
  assert.deepEqual(sdk.RTC_RUNTIME_IMMUTABILITY_STANDARD, {
    frozenTerm: 'runtime-frozen',
    snapshotTerm: 'immutable-snapshots',
    controllerContextTerm: 'shallow-immutable-context',
    nativeClientTerm: 'mutable-native-client',
  });
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_STANDARD, {
    typescriptProviderNeutralExportPaths: [
      './errors.js',
      './runtime-surface.js',
      './runtime-immutability.js',
      './root-public-surface.js',
      './types.js',
      './capability-catalog.js',
      './capability-negotiation.js',
      './language-workspace-catalog.js',
      './provider-selection.js',
      './provider-support.js',
      './provider-extension-catalog.js',
      './provider-package-catalog.js',
      './provider-package-loader.js',
      './provider-activation-catalog.js',
      './capabilities.js',
      './client.js',
      './driver.js',
      './driver-manager.js',
      './data-source.js',
      './provider-module.js',
      './providers/index.js',
    ],
    typescriptBuiltinProviderExportPaths: [
      './providers/volcengine.js',
      './providers/aliyun.js',
      './providers/tencent.js',
    ],
    typescriptInlineHelperNames: ['createBuiltinRtcDriverManager'],
    reservedSurfaceFamilies: [
      'standard-contract',
      'provider-catalog',
      'provider-package-catalog',
      'provider-activation-catalog',
      'capability-catalog',
      'provider-extension-catalog',
      'language-workspace-catalog',
      'provider-selection',
      'provider-package-loader',
      'provider-support',
      'driver-manager',
      'data-source',
    ],
    reservedEntryPointKinds: {
      flutter: 'barrel',
      python: 'package-init',
    },
    builtinProviderExposureTerm: 'root-public-builtin-only',
    nonBuiltinProviderExposureTerm: 'package-boundary-only',
  });
  assert.deepEqual(sdk.RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS, [
    'lower-camel-rtc',
    'upper-camel-rtc',
    'snake-case-rtc',
  ]);
  assert.deepEqual(sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD.profiles['lower-camel-rtc'].languages, [
    'typescript',
    'flutter',
    'java',
    'swift',
    'kotlin',
  ]);
  assert.equal(
    sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD.profiles['lower-camel-rtc'].helpers.providerCatalogByProviderKey,
    'getRtcProviderByProviderKey',
  );
  assert.equal(
    sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD.profiles['upper-camel-rtc'].helpers.providerCatalogByProviderKey,
    'GetRtcProviderByProviderKey',
  );
  assert.equal(
    sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD.profiles['snake-case-rtc'].helpers.providerCatalogByProviderKey,
    'get_rtc_provider_by_provider_key',
  );
  assert.equal(Object.isFrozen(sdk.RTC_SDK_ERROR_CODES), true);
  assert.equal(Object.isFrozen(sdk.RTC_RUNTIME_SURFACE_METHODS), true);
  assert.equal(Object.isFrozen(sdk.RTC_RUNTIME_IMMUTABILITY_STANDARD), true);
  assert.equal(Object.isFrozen(sdk.RTC_ROOT_PUBLIC_SURFACE_STANDARD), true);
  assert.equal(Object.isFrozen(sdk.RTC_LOOKUP_HELPER_NAMING_STANDARD), true);
  assert.equal(sdk.RTC_SDK_ERROR_FALLBACK_CODE, 'vendor_error');
  assert.equal(sdk.RTC_RUNTIME_SURFACE_FAILURE_CODE, 'native_sdk_not_available');
  assert.equal(sdk.RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM, 'runtime-frozen');
  assert.equal(sdk.RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM, 'immutable-snapshots');
  assert.equal(
    sdk.RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
    'shallow-immutable-context',
  );
  assert.equal(sdk.RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM, 'mutable-native-client');
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES, [
    'createBuiltinRtcDriverManager',
  ]);
  assert.deepEqual(sdk.RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS, {
    flutter: 'barrel',
    python: 'package-init',
  });
  assert.equal(
    sdk.RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
    'root-public-builtin-only',
  );
  assert.equal(
    sdk.RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
    'package-boundary-only',
  );
  assert.equal(typeof sdk.resolveRtcProviderSupportStatus, 'function');
  assert.equal(typeof sdk.createRtcProviderSupportState, 'function');
  assert.equal(typeof sdk.RTC_PROVIDER_SUPPORT_STATUSES, 'object');
  assert.equal(typeof sdk.getRtcLanguageWorkspaceCatalog, 'function');
  assert.equal(typeof sdk.getRtcLanguageWorkspaceByLanguage, 'function');
  assert.equal(typeof sdk.getRtcLanguageWorkspace, 'function');
  assert.equal(typeof sdk.getRtcProviderPackageCatalog, 'function');
  assert.equal(typeof sdk.getRtcProviderPackageByProviderKey, 'function');
  assert.equal(typeof sdk.getRtcProviderPackage, 'function');
  assert.equal(typeof sdk.createBuiltinRtcDriverManager, 'function');
  assert.equal(typeof sdk.registerRtcProviderModule, 'function');
  assert.equal(typeof sdk.registerRtcProviderModules, 'function');
  assert.equal(typeof sdk.getBuiltinRtcProviderMetadata, 'function');
  assert.equal(typeof sdk.getBuiltinRtcProviderMetadataByKey, 'function');
  assert.equal(typeof sdk.getBuiltinRtcProviderModules, 'function');
  assert.equal(typeof sdk.getOfficialRtcProviderMetadata, 'function');
  assert.equal(typeof sdk.getOfficialRtcProviderMetadataByKey, 'function');
  assert.equal(typeof sdk.getRtcProviderByProviderKey, 'function');
  assert.equal(typeof sdk.getRtcProviderActivationCatalog, 'function');
  assert.equal(typeof sdk.getRtcProviderActivationByProviderKey, 'function');
  assert.equal(typeof sdk.getRtcProviderActivation, 'function');
  assert.equal(typeof sdk.createVolcengineRtcDriver, 'function');
  assert.equal(typeof sdk.createAliyunRtcDriver, 'function');
  assert.equal(typeof sdk.createTencentRtcDriver, 'function');
  assert.equal(typeof sdk.VOLCENGINE_RTC_PROVIDER_MODULE, 'object');
  assert.equal(typeof sdk.ALIYUN_RTC_PROVIDER_MODULE, 'object');
  assert.equal(typeof sdk.TENCENT_RTC_PROVIDER_MODULE, 'object');
});

test('root public API does not export non-builtin provider driver factories', async () => {
  const sdk = await loadSdk();

  assert.equal('createAgoraRtcDriver' in sdk, false);
  assert.equal('createZegoRtcDriver' in sdk, false);
  assert.equal('createLivekitRtcDriver' in sdk, false);
  assert.equal('createTwilioRtcDriver' in sdk, false);
  assert.equal('createJitsiRtcDriver' in sdk, false);
  assert.equal('createJanusRtcDriver' in sdk, false);
  assert.equal('createMediasoupRtcDriver' in sdk, false);
  assert.equal('getOfficialRtcProviderModules' in sdk, false);
  assert.equal('AGORA_RTC_PROVIDER_MODULE' in sdk, false);
  assert.equal('ZEGO_RTC_PROVIDER_MODULE' in sdk, false);
});
