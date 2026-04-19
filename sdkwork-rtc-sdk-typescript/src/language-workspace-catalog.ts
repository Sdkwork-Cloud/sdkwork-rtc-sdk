import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcLanguageWorkspaceCatalogEntry } from './types.js';

export const OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS = freezeRtcRuntimeValue(['typescript', 'flutter', 'rust', 'java', 'csharp', 'swift', 'kotlin', 'go', 'python'] as const);

export const TYPESCRIPT_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'typescript',
  workspace: 'sdkwork-rtc-sdk-typescript',
  displayName: 'TypeScript',
  publicPackage: '@sdkwork/rtc-sdk',
  maturityTier: 'reference',
  controlSdk: true,
  runtimeBridge: true,
  currentRole: 'Executable reference implementation',
  workspaceSummary: 'This workspace is the executable reference implementation for provider-neutral RTC contracts, JDBC-style driver selection, standardized runtime lifecycle delegation, and provider package boundaries in sdkwork-rtc-sdk.',
  roleHighlights: freezeRtcRuntimeValue(['provider-neutral RTC contracts', 'JDBC-style driver and data-source model', 'assembly-driven provider catalog at src/provider-catalog.ts', 'assembly-driven capability catalog at src/capability-catalog.ts with required-baseline and optional-advanced surface descriptors', 'assembly-driven provider extension catalog at src/provider-extension-catalog.ts with unwrap-only extension metadata', 'surface-aware capability negotiation and degradation helpers with supported, degraded, and unsupported outcomes', 'stable runtime bridge contract methods join, leave, publish, unpublish, muteAudio, and muteVideo', 'explicit native_sdk_not_available failure when no runtime bridge is registered', 'assembly-driven default provider constants DEFAULT_RTC_PROVIDER_KEY, DEFAULT_RTC_PROVIDER_PLUGIN_ID, and DEFAULT_RTC_PROVIDER_DRIVER_ID', 'built-in provider adapters for volcengine, aliyun, and tencent', 'TypeScript provider package statuses standardize built-in root-public packages as root_public_reference_boundary and executable non-builtin packages as package_reference_boundary', 'TypeScript runtime bridge baseline reference-baseline with official vendor SDK requirement required'] as const),
});

export const FLUTTER_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'flutter',
  workspace: 'sdkwork-rtc-sdk-flutter',
  displayName: 'Flutter',
  publicPackage: 'rtc_sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is materialized now so the official language matrix stays explicit and verifiable. Future Flutter runtime bridge work must follow the same provider-adapter and capability standards as the TypeScript baseline.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata, capability matrix, and driver selection standards', 'reserved Flutter language boundary with no runtime bridge claim in the current landing', 'future Flutter runtime bridge work must follow the TypeScript baseline contract', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const RUST_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'rust',
  workspace: 'sdkwork-rtc-sdk-rust',
  displayName: 'Rust',
  publicPackage: 'rtc_sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Rust standard boundary for provider metadata, selection, and future control-plane integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Rust workspace boundary for control-plane expansion', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const JAVA_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'java',
  workspace: 'sdkwork-rtc-sdk-java',
  displayName: 'Java',
  publicPackage: 'com.sdkwork:rtc-sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Java standard boundary for provider metadata, driver selection, and future enterprise runtime integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Java language boundary for future enterprise runtime integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const CSHARP_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'csharp',
  workspace: 'sdkwork-rtc-sdk-csharp',
  displayName: 'C#',
  publicPackage: 'Sdkwork.Rtc.Sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved C# standard boundary for provider metadata, driver selection, and future desktop or server-side control integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved C# language boundary for desktop or server-side control integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const SWIFT_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'swift',
  workspace: 'sdkwork-rtc-sdk-swift',
  displayName: 'Swift',
  publicPackage: 'RtcSdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Swift standard boundary for provider metadata, driver selection, and future iOS or macOS runtime bridge integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Swift language boundary for iOS or macOS runtime bridge integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const KOTLIN_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'kotlin',
  workspace: 'sdkwork-rtc-sdk-kotlin',
  displayName: 'Kotlin',
  publicPackage: 'com.sdkwork:rtc-sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Kotlin standard boundary for provider metadata, driver selection, and future Android runtime bridge integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Kotlin language boundary for Android runtime bridge integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const GO_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'go',
  workspace: 'sdkwork-rtc-sdk-go',
  displayName: 'Go',
  publicPackage: 'github.com/sdkwork/rtc-sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Go standard boundary for provider metadata, driver selection, and future control-plane tooling integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Go language boundary for control-plane tooling integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const PYTHON_RTC_LANGUAGE_WORKSPACE_ENTRY: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: 'python',
  workspace: 'sdkwork-rtc-sdk-python',
  displayName: 'Python',
  publicPackage: 'sdkwork-rtc-sdk',
  maturityTier: 'reserved',
  controlSdk: true,
  runtimeBridge: false,
  currentRole: 'Reserved workspace skeleton',
  workspaceSummary: 'This workspace is the reserved Python standard boundary for provider metadata, driver selection, and future automation or control-plane integration.',
  roleHighlights: freezeRtcRuntimeValue(['provider metadata and driver selection standards', 'reserved Python language boundary for automation or control-plane integration', 'no runtime bridge is claimed in the current landing', 'code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing', 'metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing', 'resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing'] as const),
});

export const RTC_LANGUAGE_WORKSPACE_CATALOG: readonly RtcLanguageWorkspaceCatalogEntry[] = freezeRtcRuntimeValue([
  TYPESCRIPT_RTC_LANGUAGE_WORKSPACE_ENTRY,
  FLUTTER_RTC_LANGUAGE_WORKSPACE_ENTRY,
  RUST_RTC_LANGUAGE_WORKSPACE_ENTRY,
  JAVA_RTC_LANGUAGE_WORKSPACE_ENTRY,
  CSHARP_RTC_LANGUAGE_WORKSPACE_ENTRY,
  SWIFT_RTC_LANGUAGE_WORKSPACE_ENTRY,
  KOTLIN_RTC_LANGUAGE_WORKSPACE_ENTRY,
  GO_RTC_LANGUAGE_WORKSPACE_ENTRY,
  PYTHON_RTC_LANGUAGE_WORKSPACE_ENTRY
]);

const RTC_LANGUAGE_WORKSPACE_BY_KEY = new Map<string, RtcLanguageWorkspaceCatalogEntry>(
  RTC_LANGUAGE_WORKSPACE_CATALOG.map((entry) => [entry.language, entry]),
);

export function getRtcLanguageWorkspaceCatalog(): readonly RtcLanguageWorkspaceCatalogEntry[] {
  return RTC_LANGUAGE_WORKSPACE_CATALOG;
}

export function getRtcLanguageWorkspaceByLanguage(
  language: string,
): RtcLanguageWorkspaceCatalogEntry | undefined {
  return RTC_LANGUAGE_WORKSPACE_BY_KEY.get(language);
}

export function getRtcLanguageWorkspace(
  language: string,
): RtcLanguageWorkspaceCatalogEntry | undefined {
  return getRtcLanguageWorkspaceByLanguage(language);
}
