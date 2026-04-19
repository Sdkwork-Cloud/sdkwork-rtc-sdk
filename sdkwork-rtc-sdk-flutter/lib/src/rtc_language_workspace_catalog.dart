final class RtcLanguageWorkspaceCatalogEntry {
  const RtcLanguageWorkspaceCatalogEntry({
    required this.language,
    required this.workspace,
    required this.displayName,
    required this.publicPackage,
    required this.maturityTier,
    required this.controlSdk,
    required this.runtimeBridge,
    required this.currentRole,
    required this.workspaceSummary,
    required this.roleHighlights,
  });

  final String language;
  final String workspace;
  final String displayName;
  final String publicPackage;
  final String maturityTier;
  final bool controlSdk;
  final bool runtimeBridge;
  final String currentRole;
  final String workspaceSummary;
  final List<String> roleHighlights;
}

final class RtcLanguageWorkspaceCatalog {
  static const List<RtcLanguageWorkspaceCatalogEntry> entries =
      <RtcLanguageWorkspaceCatalogEntry>[
    RtcLanguageWorkspaceCatalogEntry(
      language: "typescript",
      workspace: "sdkwork-rtc-sdk-typescript",
      displayName: "TypeScript",
      publicPackage: "@sdkwork/rtc-sdk",
      maturityTier: "reference",
      controlSdk: true,
      runtimeBridge: true,
      currentRole: "Executable reference implementation",
      workspaceSummary: "This workspace is the executable reference implementation for provider-neutral RTC contracts, JDBC-style driver selection, standardized runtime lifecycle delegation, and provider package boundaries in sdkwork-rtc-sdk.",
      roleHighlights: <String>[
        "provider-neutral RTC contracts",
        "JDBC-style driver and data-source model",
        "assembly-driven provider catalog at src/provider-catalog.ts",
        "assembly-driven capability catalog at src/capability-catalog.ts with required-baseline and optional-advanced surface descriptors",
        "assembly-driven provider extension catalog at src/provider-extension-catalog.ts with unwrap-only extension metadata",
        "surface-aware capability negotiation and degradation helpers with supported, degraded, and unsupported outcomes",
        "stable runtime bridge contract methods join, leave, publish, unpublish, muteAudio, and muteVideo",
        "explicit native_sdk_not_available failure when no runtime bridge is registered",
        "assembly-driven default provider constants DEFAULT_RTC_PROVIDER_KEY, DEFAULT_RTC_PROVIDER_PLUGIN_ID, and DEFAULT_RTC_PROVIDER_DRIVER_ID",
        "built-in provider adapters for volcengine, aliyun, and tencent",
        "TypeScript provider package statuses standardize built-in root-public packages as root_public_reference_boundary and executable non-builtin packages as package_reference_boundary",
        "TypeScript runtime bridge baseline reference-baseline with official vendor SDK requirement required",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "flutter",
      workspace: "sdkwork-rtc-sdk-flutter",
      displayName: "Flutter",
      publicPackage: "rtc_sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is materialized now so the official language matrix stays explicit and verifiable. Future Flutter runtime bridge work must follow the same provider-adapter and capability standards as the TypeScript baseline.",
      roleHighlights: <String>[
        "provider metadata, capability matrix, and driver selection standards",
        "reserved Flutter language boundary with no runtime bridge claim in the current landing",
        "future Flutter runtime bridge work must follow the TypeScript baseline contract",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "rust",
      workspace: "sdkwork-rtc-sdk-rust",
      displayName: "Rust",
      publicPackage: "rtc_sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Rust standard boundary for provider metadata, selection, and future control-plane integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Rust workspace boundary for control-plane expansion",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "java",
      workspace: "sdkwork-rtc-sdk-java",
      displayName: "Java",
      publicPackage: "com.sdkwork:rtc-sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Java standard boundary for provider metadata, driver selection, and future enterprise runtime integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Java language boundary for future enterprise runtime integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "csharp",
      workspace: "sdkwork-rtc-sdk-csharp",
      displayName: "C#",
      publicPackage: "Sdkwork.Rtc.Sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved C# standard boundary for provider metadata, driver selection, and future desktop or server-side control integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved C# language boundary for desktop or server-side control integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "swift",
      workspace: "sdkwork-rtc-sdk-swift",
      displayName: "Swift",
      publicPackage: "RtcSdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Swift standard boundary for provider metadata, driver selection, and future iOS or macOS runtime bridge integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Swift language boundary for iOS or macOS runtime bridge integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "kotlin",
      workspace: "sdkwork-rtc-sdk-kotlin",
      displayName: "Kotlin",
      publicPackage: "com.sdkwork:rtc-sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Kotlin standard boundary for provider metadata, driver selection, and future Android runtime bridge integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Kotlin language boundary for Android runtime bridge integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "go",
      workspace: "sdkwork-rtc-sdk-go",
      displayName: "Go",
      publicPackage: "github.com/sdkwork/rtc-sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Go standard boundary for provider metadata, driver selection, and future control-plane tooling integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Go language boundary for control-plane tooling integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "python",
      workspace: "sdkwork-rtc-sdk-python",
      displayName: "Python",
      publicPackage: "sdkwork-rtc-sdk",
      maturityTier: "reserved",
      controlSdk: true,
      runtimeBridge: false,
      currentRole: "Reserved workspace skeleton",
      workspaceSummary: "This workspace is the reserved Python standard boundary for provider metadata, driver selection, and future automation or control-plane integration.",
      roleHighlights: <String>[
        "provider metadata and driver selection standards",
        "reserved Python language boundary for automation or control-plane integration",
        "no runtime bridge is claimed in the current landing",
        "code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing",
        "metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing",
        "resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing",
      ],
    ),
      ];

  const RtcLanguageWorkspaceCatalog._();
}

RtcLanguageWorkspaceCatalogEntry? getRtcLanguageWorkspaceByLanguage(String language) {
  for (final entry in RtcLanguageWorkspaceCatalog.entries) {
    if (entry.language == language) {
      return entry;
    }
  }

  return null;
}
