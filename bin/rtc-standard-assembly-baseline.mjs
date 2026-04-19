import {
  BUILTIN_RTC_PROVIDER_KEYS,
  DEFAULT_RTC_PROVIDER_KEY,
  OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS,
  RTC_PROVIDER_SELECTION_PRECEDENCE,
  RTC_PROVIDER_SELECTION_SOURCES,
  RTC_PROVIDER_SUPPORT_STATUSES,
} from './rtc-standard-contract-constants.mjs';

function hasExactArray(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

export function assertRtcAssemblyWorkspaceBaseline(assembly) {
  if (assembly.workspace !== 'sdkwork-rtc-sdk') {
    throw new Error(`Unexpected workspace name: ${assembly.workspace}`);
  }

  if (assembly.defaults?.providerKey !== DEFAULT_RTC_PROVIDER_KEY) {
    throw new Error(
      `Default provider must be ${DEFAULT_RTC_PROVIDER_KEY}, received: ${assembly.defaults?.providerKey ?? '<missing>'}`,
    );
  }

  const officialLanguages = assembly.officialLanguages ?? [];
  if (
    !Array.isArray(officialLanguages) ||
    !hasExactArray(officialLanguages, OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS)
  ) {
    throw new Error(
      `officialLanguages must declare the full nine-language family: ${OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS.join(', ')}`,
    );
  }

  const providers = assembly.providers ?? [];
  const builtinProviderKeys = providers
    .filter((provider) => provider.builtin)
    .map((provider) => provider.providerKey);
  if (!hasExactArray(builtinProviderKeys, BUILTIN_RTC_PROVIDER_KEYS)) {
    throw new Error(`Builtin providers must be ${BUILTIN_RTC_PROVIDER_KEYS.join(', ')}`);
  }

  const defaultProviderEntry = providers.find(
    (provider) => provider.providerKey === DEFAULT_RTC_PROVIDER_KEY,
  );
  if (!defaultProviderEntry?.builtin) {
    throw new Error('Default provider must point at a builtin providers entry');
  }

  if (!defaultProviderEntry?.defaultSelected) {
    throw new Error('Default provider must also be marked as the default-selected provider');
  }

  const defaultSelectedProviders = providers
    .filter((provider) => provider.defaultSelected)
    .map((provider) => provider.providerKey);
  if (!hasExactArray(defaultSelectedProviders, [DEFAULT_RTC_PROVIDER_KEY])) {
    throw new Error(
      'Assembly must declare exactly one defaultSelected provider and it must match defaults.providerKey',
    );
  }

  const providerSelectionStandard = assembly.providerSelectionStandard ?? {};
  if (!hasExactArray(providerSelectionStandard.sourceTerms, RTC_PROVIDER_SELECTION_SOURCES)) {
    throw new Error(
      `providerSelectionStandard.sourceTerms must be ${RTC_PROVIDER_SELECTION_SOURCES.join(', ')}`,
    );
  }

  if (!hasExactArray(providerSelectionStandard.precedence, RTC_PROVIDER_SELECTION_PRECEDENCE)) {
    throw new Error(
      `providerSelectionStandard.precedence must be ${RTC_PROVIDER_SELECTION_PRECEDENCE.join(', ')}`,
    );
  }

  const canonicalDefaultSelectionSource =
    RTC_PROVIDER_SELECTION_SOURCES[RTC_PROVIDER_SELECTION_SOURCES.length - 1];
  if (providerSelectionStandard.defaultSource !== canonicalDefaultSelectionSource) {
    throw new Error(
      `providerSelectionStandard.defaultSource must be ${canonicalDefaultSelectionSource}, received: ${providerSelectionStandard.defaultSource ?? '<missing>'}`,
    );
  }

  const providerSupportStandard = assembly.providerSupportStandard ?? {};
  if (!hasExactArray(providerSupportStandard.statusTerms, RTC_PROVIDER_SUPPORT_STATUSES)) {
    throw new Error(
      `providerSupportStandard.statusTerms must be ${RTC_PROVIDER_SUPPORT_STATUSES.join(', ')}`,
    );
  }

  return {
    officialLanguages,
    providers,
    providerSelectionStandard,
    providerSupportStandard,
  };
}
