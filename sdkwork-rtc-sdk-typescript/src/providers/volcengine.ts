import { createRtcProviderDriver, type CreateRtcProviderDriverOptions } from '../driver.js';
import { VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY } from '../provider-catalog.js';
import { createRtcProviderModule } from '../provider-module.js';

export const VOLCENGINE_RTC_PROVIDER_METADATA = VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY;

export function createVolcengineRtcDriver<TNativeClient = unknown>(
  options: Omit<CreateRtcProviderDriverOptions<TNativeClient>, 'metadata'> = {},
) {
  return createRtcProviderDriver({
    metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
    nativeFactory: options.nativeFactory,
    runtimeController: options.runtimeController,
  });
}

export const VOLCENGINE_RTC_PROVIDER_MODULE = createRtcProviderModule({
  packageName: VOLCENGINE_RTC_PROVIDER_METADATA.typescriptPackage.packageName,
  metadata: VOLCENGINE_RTC_PROVIDER_METADATA,
  builtin: VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY.builtin,
  createDriver: createVolcengineRtcDriver,
});
