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
