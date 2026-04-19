final class RtcLanguageWorkspaceCatalogEntry {
  const RtcLanguageWorkspaceCatalogEntry({
    required this.language,
    required this.workspace,
    required this.workspaceCatalogRelativePath,
    required this.displayName,
    required this.publicPackage,
    required this.maturityTier,
    required this.controlSdk,
    required this.runtimeBridge,
    required this.currentRole,
    required this.workspaceSummary,
    required this.roleHighlights,
    required this.metadataScaffold,
    required this.resolutionScaffold,
    required this.providerPackageScaffold,
  });

  final String language;
  final String workspace;
  final String workspaceCatalogRelativePath;
  final String displayName;
  final String publicPackage;
  final String maturityTier;
  final bool controlSdk;
  final bool runtimeBridge;
  final String currentRole;
  final String workspaceSummary;
  final List<String> roleHighlights;
  final RtcLanguageWorkspaceMetadataScaffold metadataScaffold;
  final RtcLanguageWorkspaceResolutionScaffold resolutionScaffold;
  final RtcLanguageWorkspaceProviderPackageScaffold? providerPackageScaffold;
}

final class RtcLanguageWorkspaceMetadataScaffold {
  const RtcLanguageWorkspaceMetadataScaffold({
    required this.providerCatalogRelativePath,
    required this.capabilityCatalogRelativePath,
    required this.providerExtensionCatalogRelativePath,
    required this.providerPackageCatalogRelativePath,
    required this.providerActivationCatalogRelativePath,
    required this.providerSelectionRelativePath,
  });

  final String providerCatalogRelativePath;
  final String capabilityCatalogRelativePath;
  final String providerExtensionCatalogRelativePath;
  final String providerPackageCatalogRelativePath;
  final String providerActivationCatalogRelativePath;
  final String providerSelectionRelativePath;
}

final class RtcLanguageWorkspaceResolutionScaffold {
  const RtcLanguageWorkspaceResolutionScaffold({
    required this.driverManagerRelativePath,
    required this.dataSourceRelativePath,
    required this.providerSupportRelativePath,
    required this.providerPackageLoaderRelativePath,
  });

  final String driverManagerRelativePath;
  final String dataSourceRelativePath;
  final String providerSupportRelativePath;
  final String providerPackageLoaderRelativePath;
}

final class RtcLanguageWorkspaceProviderPackageScaffold {
  const RtcLanguageWorkspaceProviderPackageScaffold({
    required this.relativePath,
    required this.directoryPattern,
    required this.packagePattern,
    required this.manifestFileName,
    required this.readmeFileName,
    required this.sourceFilePattern,
    required this.sourceSymbolPattern,
    required this.templateTokens,
    required this.sourceTemplateTokens,
    required this.runtimeBridgeStatus,
    required this.rootPublic,
    required this.status,
  });

  final String relativePath;
  final String directoryPattern;
  final String packagePattern;
  final String manifestFileName;
  final String readmeFileName;
  final String sourceFilePattern;
  final String sourceSymbolPattern;
  final List<String> templateTokens;
  final List<String> sourceTemplateTokens;
  final String runtimeBridgeStatus;
  final bool rootPublic;
  final String status;
}

final class RtcLanguageWorkspaceCatalog {
  static const List<RtcLanguageWorkspaceCatalogEntry> entries =
      <RtcLanguageWorkspaceCatalogEntry>[
    RtcLanguageWorkspaceCatalogEntry(
      language: "typescript",
      workspace: "sdkwork-rtc-sdk-typescript",
      workspaceCatalogRelativePath: "src/language-workspace-catalog.ts",
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
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "src/provider-catalog.ts",
        capabilityCatalogRelativePath: "src/capability-catalog.ts",
        providerExtensionCatalogRelativePath: "src/provider-extension-catalog.ts",
        providerPackageCatalogRelativePath: "src/provider-package-catalog.ts",
        providerActivationCatalogRelativePath: "src/provider-activation-catalog.ts",
        providerSelectionRelativePath: "src/provider-selection.ts",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "src/driver-manager.ts",
        dataSourceRelativePath: "src/data-source.ts",
        providerSupportRelativePath: "src/provider-support.ts",
        providerPackageLoaderRelativePath: "src/provider-package-loader.ts",
      ),
      providerPackageScaffold: null,
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "flutter",
      workspace: "sdkwork-rtc-sdk-flutter",
      workspaceCatalogRelativePath: "lib/src/rtc_language_workspace_catalog.dart",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "lib/src/rtc_provider_catalog.dart",
        capabilityCatalogRelativePath: "lib/src/rtc_capability_catalog.dart",
        providerExtensionCatalogRelativePath: "lib/src/rtc_provider_extension_catalog.dart",
        providerPackageCatalogRelativePath: "lib/src/rtc_provider_package_catalog.dart",
        providerActivationCatalogRelativePath: "lib/src/rtc_provider_activation_catalog.dart",
        providerSelectionRelativePath: "lib/src/rtc_provider_selection.dart",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "lib/src/rtc_driver_manager.dart",
        dataSourceRelativePath: "lib/src/rtc_data_source.dart",
        providerSupportRelativePath: "lib/src/rtc_provider_support.dart",
        providerPackageLoaderRelativePath: "lib/src/rtc_provider_package_loader.dart",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/rtc_sdk_provider_{providerKey}",
        packagePattern: "rtc_sdk_provider_{providerKey}",
        manifestFileName: "pubspec.yaml",
        readmeFileName: "README.md",
        sourceFilePattern: "lib/src/rtc_provider_{providerKey}_package_contract.dart",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerKey}", "{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "rust",
      workspace: "sdkwork-rtc-sdk-rust",
      workspaceCatalogRelativePath: "src/language_workspace_catalog.rs",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "src/provider_catalog.rs",
        capabilityCatalogRelativePath: "src/capability_catalog.rs",
        providerExtensionCatalogRelativePath: "src/provider_extension_catalog.rs",
        providerPackageCatalogRelativePath: "src/provider_package_catalog.rs",
        providerActivationCatalogRelativePath: "src/provider_activation_catalog.rs",
        providerSelectionRelativePath: "src/provider_selection.rs",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "src/driver_manager.rs",
        dataSourceRelativePath: "src/data_source.rs",
        providerSupportRelativePath: "src/provider_support.rs",
        providerPackageLoaderRelativePath: "src/provider_package_loader.rs",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/rtc-sdk-provider-{providerKey}",
        packagePattern: "rtc-sdk-provider-{providerKey}",
        manifestFileName: "Cargo.toml",
        readmeFileName: "README.md",
        sourceFilePattern: "src/lib.rs",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "java",
      workspace: "sdkwork-rtc-sdk-java",
      workspaceCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcLanguageWorkspaceCatalog.java",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderCatalog.java",
        capabilityCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcCapabilityCatalog.java",
        providerExtensionCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderExtensionCatalog.java",
        providerPackageCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageCatalog.java",
        providerActivationCatalogRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderActivationCatalog.java",
        providerSelectionRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderSelection.java",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcDriverManager.java",
        dataSourceRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcDataSource.java",
        providerSupportRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderSupport.java",
        providerPackageLoaderRelativePath: "src/main/java/com/sdkwork/rtc/metadata/RtcProviderPackageLoader.java",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/rtc-sdk-provider-{providerKey}",
        packagePattern: "com.sdkwork:rtc-sdk-provider-{providerKey}",
        manifestFileName: "pom.xml",
        readmeFileName: "README.md",
        sourceFilePattern: "src/main/java/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.java",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerKey}", "{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "csharp",
      workspace: "sdkwork-rtc-sdk-csharp",
      workspaceCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcLanguageWorkspaceCatalog.cs",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderCatalog.cs",
        capabilityCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcCapabilityCatalog.cs",
        providerExtensionCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderExtensionCatalog.cs",
        providerPackageCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderPackageCatalog.cs",
        providerActivationCatalogRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderActivationCatalog.cs",
        providerSelectionRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderSelection.cs",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "src/SDKWork.Rtc.Sdk/RtcDriverManager.cs",
        dataSourceRelativePath: "src/SDKWork.Rtc.Sdk/RtcDataSource.cs",
        providerSupportRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderSupport.cs",
        providerPackageLoaderRelativePath: "src/SDKWork.Rtc.Sdk/RtcProviderPackageLoader.cs",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/Sdkwork.Rtc.Sdk.Provider.{providerPascal}",
        packagePattern: "Sdkwork.Rtc.Sdk.Provider.{providerPascal}",
        manifestFileName: "Sdkwork.Rtc.Sdk.Provider.{providerPascal}.csproj",
        readmeFileName: "README.md",
        sourceFilePattern: "src/RtcProvider{providerPascal}PackageContract.cs",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerPascal}"],
        sourceTemplateTokens: <String>["{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "swift",
      workspace: "sdkwork-rtc-sdk-swift",
      workspaceCatalogRelativePath: "Sources/RtcSdk/RtcLanguageWorkspaceCatalog.swift",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "Sources/RtcSdk/RtcProviderCatalog.swift",
        capabilityCatalogRelativePath: "Sources/RtcSdk/RtcCapabilityCatalog.swift",
        providerExtensionCatalogRelativePath: "Sources/RtcSdk/RtcProviderExtensionCatalog.swift",
        providerPackageCatalogRelativePath: "Sources/RtcSdk/RtcProviderPackageCatalog.swift",
        providerActivationCatalogRelativePath: "Sources/RtcSdk/RtcProviderActivationCatalog.swift",
        providerSelectionRelativePath: "Sources/RtcSdk/RtcProviderSelection.swift",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "Sources/RtcSdk/RtcDriverManager.swift",
        dataSourceRelativePath: "Sources/RtcSdk/RtcDataSource.swift",
        providerSupportRelativePath: "Sources/RtcSdk/RtcProviderSupport.swift",
        providerPackageLoaderRelativePath: "Sources/RtcSdk/RtcProviderPackageLoader.swift",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "Providers/RtcSdkProvider{providerPascal}",
        packagePattern: "RtcSdkProvider{providerPascal}",
        manifestFileName: "Package.swift",
        readmeFileName: "README.md",
        sourceFilePattern: "Sources/RtcSdkProvider{providerPascal}/RtcProvider{providerPascal}PackageContract.swift",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerPascal}"],
        sourceTemplateTokens: <String>["{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "kotlin",
      workspace: "sdkwork-rtc-sdk-kotlin",
      workspaceCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcLanguageWorkspaceCatalog.kt",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderCatalog.kt",
        capabilityCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcCapabilityCatalog.kt",
        providerExtensionCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderExtensionCatalog.kt",
        providerPackageCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderPackageCatalog.kt",
        providerActivationCatalogRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderActivationCatalog.kt",
        providerSelectionRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderSelection.kt",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcDriverManager.kt",
        dataSourceRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcDataSource.kt",
        providerSupportRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderSupport.kt",
        providerPackageLoaderRelativePath: "src/main/kotlin/com/sdkwork/rtc/metadata/RtcProviderPackageLoader.kt",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/rtc-sdk-provider-{providerKey}",
        packagePattern: "com.sdkwork:rtc-sdk-provider-{providerKey}",
        manifestFileName: "build.gradle.kts",
        readmeFileName: "README.md",
        sourceFilePattern: "src/main/kotlin/com/sdkwork/rtc/provider/{providerKey}/RtcProvider{providerPascal}PackageContract.kt",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerKey}", "{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "go",
      workspace: "sdkwork-rtc-sdk-go",
      workspaceCatalogRelativePath: "rtcstandard/language_workspace_catalog.go",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "rtcstandard/provider_catalog.go",
        capabilityCatalogRelativePath: "rtcstandard/capability_catalog.go",
        providerExtensionCatalogRelativePath: "rtcstandard/provider_extension_catalog.go",
        providerPackageCatalogRelativePath: "rtcstandard/provider_package_catalog.go",
        providerActivationCatalogRelativePath: "rtcstandard/provider_activation_catalog.go",
        providerSelectionRelativePath: "rtcstandard/provider_selection.go",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "rtcstandard/driver_manager.go",
        dataSourceRelativePath: "rtcstandard/data_source.go",
        providerSupportRelativePath: "rtcstandard/provider_support.go",
        providerPackageLoaderRelativePath: "rtcstandard/provider_package_loader.go",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/rtc-sdk-provider-{providerKey}",
        packagePattern: "github.com/sdkwork/rtc-sdk-provider-{providerKey}",
        manifestFileName: "go.mod",
        readmeFileName: "README.md",
        sourceFilePattern: "provider_package_contract.go",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
    ),
    RtcLanguageWorkspaceCatalogEntry(
      language: "python",
      workspace: "sdkwork-rtc-sdk-python",
      workspaceCatalogRelativePath: "sdkwork_rtc_sdk/language_workspace_catalog.py",
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
        "resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing",
      ],
      metadataScaffold: RtcLanguageWorkspaceMetadataScaffold(
        providerCatalogRelativePath: "sdkwork_rtc_sdk/provider_catalog.py",
        capabilityCatalogRelativePath: "sdkwork_rtc_sdk/capability_catalog.py",
        providerExtensionCatalogRelativePath: "sdkwork_rtc_sdk/provider_extension_catalog.py",
        providerPackageCatalogRelativePath: "sdkwork_rtc_sdk/provider_package_catalog.py",
        providerActivationCatalogRelativePath: "sdkwork_rtc_sdk/provider_activation_catalog.py",
        providerSelectionRelativePath: "sdkwork_rtc_sdk/provider_selection.py",
      ),
      resolutionScaffold: RtcLanguageWorkspaceResolutionScaffold(
        driverManagerRelativePath: "sdkwork_rtc_sdk/driver_manager.py",
        dataSourceRelativePath: "sdkwork_rtc_sdk/data_source.py",
        providerSupportRelativePath: "sdkwork_rtc_sdk/provider_support.py",
        providerPackageLoaderRelativePath: "sdkwork_rtc_sdk/provider_package_loader.py",
      ),
      providerPackageScaffold: RtcLanguageWorkspaceProviderPackageScaffold(
        relativePath: "providers/provider-package-scaffold.md",
        directoryPattern: "providers/sdkwork_rtc_sdk_provider_{providerKey}",
        packagePattern: "sdkwork-rtc-sdk-provider-{providerKey}",
        manifestFileName: "pyproject.toml",
        readmeFileName: "README.md",
        sourceFilePattern: "sdkwork_rtc_sdk_provider_{providerKey}/__init__.py",
        sourceSymbolPattern: "RtcProvider{providerPascal}PackageContract",
        templateTokens: <String>["{providerKey}"],
        sourceTemplateTokens: <String>["{providerKey}", "{providerPascal}"],
        runtimeBridgeStatus: "reserved",
        rootPublic: false,
        status: "future-runtime-bridge-only",
      ),
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
