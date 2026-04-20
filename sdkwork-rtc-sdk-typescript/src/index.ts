export * from './errors.js';
export * from './runtime-surface.js';
export * from './runtime-immutability.js';
export * from './root-public-surface.js';
export * from './types.js';
export * from './call-types.js';
export * from './call-session.js';
export * from './im-signaling.js';
export * from './capability-catalog.js';
export * from './capability-negotiation.js';
export * from './language-workspace-catalog.js';
export * from './provider-selection.js';
export * from './provider-support.js';
export * from './provider-extension-catalog.js';
export * from './provider-package-catalog.js';
export * from './provider-package-loader.js';
export * from './provider-activation-catalog.js';
export * from './capabilities.js';
export * from './client.js';
export * from './driver.js';
export * from './driver-manager.js';
export * from './data-source.js';
export * from './provider-module.js';
export * from './providers/index.js';
export * from './providers/volcengine.js';
export * from './providers/aliyun.js';
export * from './providers/tencent.js';

import { RtcDriverManager } from './driver-manager.js';
import { DEFAULT_RTC_PROVIDER_KEY } from './provider-catalog.js';
import { registerRtcProviderModules } from './provider-module.js';
import { getBuiltinRtcProviderModules } from './providers/index.js';

export function createBuiltinRtcDriverManager(): RtcDriverManager {
  return registerRtcProviderModules(
    new RtcDriverManager({
      defaultProviderKey: DEFAULT_RTC_PROVIDER_KEY,
    }),
    getBuiltinRtcProviderModules().map((providerModule) => ({
      providerModule,
    })),
  );
}
