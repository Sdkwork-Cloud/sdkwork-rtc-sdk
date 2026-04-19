export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toGoExportedFieldToken(token) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(token)) {
    return token;
  }

  return `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
}

export function matchesReservedLanguageToken(language, content, token) {
  if (new RegExp(escapeRegExp(token)).test(content)) {
    return true;
  }

  if (language === 'go') {
    const goToken = toGoExportedFieldToken(token);
    if (goToken !== token && new RegExp(escapeRegExp(goToken)).test(content)) {
      return true;
    }
  }

  return false;
}

export function getReservedLanguageLookupHelperPatterns(language) {
  switch (language) {
    case 'flutter':
      return {
        providerCatalog: [/getRtcProviderByProviderKey/],
        providerPackageCatalog: [/getRtcProviderPackageByProviderKey/, /getRtcProviderPackageByPackageIdentity/],
        providerActivationCatalog: [/getRtcProviderActivationByProviderKey/],
        capabilityCatalog: [/getRtcCapabilityCatalog/, /getRtcCapabilityDescriptor/],
        providerExtensionCatalog: [
          /getRtcProviderExtensionCatalog/,
          /getRtcProviderExtensionDescriptor/,
          /getRtcProviderExtensionsForProvider/,
          /getRtcProviderExtensions\(/,
          /hasRtcProviderExtension/,
        ],
        languageWorkspaceCatalog: [/getRtcLanguageWorkspaceByLanguage/],
        providerSelection: [
          /rtcProviderSelectionSources/,
          /rtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          /parseRtcProviderUrl/,
          /resolveRtcProviderSelection/,
        ],
        providerSupport: [
          /rtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          /resolveRtcProviderSupportStatus/,
          /createRtcProviderSupportState/,
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          /createRtcProviderPackageLoader/,
          /resolveRtcProviderPackageLoadTarget/,
          /loadRtcProviderModule/,
          /installRtcProviderPackage/,
          /installRtcProviderPackages/,
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          /resolveRtcProviderSelection/,
          /getRtcProviderByProviderKey/,
          /getRtcProviderActivationByProviderKey/,
          /createRtcProviderSupportState/,
        ],
      };
    case 'rust':
      return {
        providerCatalog: [/get_rtc_provider_by_provider_key/],
        providerPackageCatalog: [/get_rtc_provider_package_by_provider_key/, /get_rtc_provider_package_by_package_identity/],
        providerActivationCatalog: [/get_rtc_provider_activation_by_provider_key/],
        capabilityCatalog: [/get_rtc_capability_catalog/, /get_rtc_capability_descriptor/],
        providerExtensionCatalog: [
          /get_rtc_provider_extension_catalog/,
          /get_rtc_provider_extension_descriptor/,
          /get_rtc_provider_extensions_for_provider/,
          /get_rtc_provider_extensions/,
          /has_rtc_provider_extension/,
        ],
        languageWorkspaceCatalog: [/get_rtc_language_workspace_by_language/],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE/,
          /ParsedRtcProviderUrl/,
          /parse_rtc_provider_url/,
          /resolve_rtc_provider_selection/,
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /RtcProviderSupportStateRequest/,
          /resolve_rtc_provider_support_status/,
          /create_rtc_provider_support_state/,
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          /create_rtc_provider_package_loader/,
          /resolve_rtc_provider_package_load_target/,
          /load_rtc_provider_module/,
          /install_rtc_provider_package/,
          /install_rtc_provider_packages/,
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          /resolve_rtc_provider_selection/,
          /get_rtc_provider_by_provider_key/,
          /get_rtc_provider_activation_by_provider_key/,
          /create_rtc_provider_support_state/,
        ],
      };
    case 'java':
    case 'swift':
    case 'kotlin':
      return {
        providerCatalog: [/getRtcProviderByProviderKey/],
        providerPackageCatalog: [/getRtcProviderPackageByProviderKey/, /getRtcProviderPackageByPackageIdentity/],
        providerActivationCatalog: [/getRtcProviderActivationByProviderKey/],
        capabilityCatalog: [/getRtcCapabilityCatalog/, /getRtcCapabilityDescriptor/],
        providerExtensionCatalog: [
          /getRtcProviderExtensionCatalog/,
          /getRtcProviderExtensionDescriptor/,
          /getRtcProviderExtensionsForProvider/,
          /getRtcProviderExtensions/,
          /hasRtcProviderExtension/,
        ],
        languageWorkspaceCatalog: [/getRtcLanguageWorkspaceByLanguage/],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES|rtcProviderSelectionSources/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE|rtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          /parseRtcProviderUrl/,
          /resolveRtcProviderSelection/,
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES|rtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          /resolveRtcProviderSupportStatus/,
          /createRtcProviderSupportState/,
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          /createRtcProviderPackageLoader/,
          /resolveRtcProviderPackageLoadTarget/,
          /loadRtcProviderModule/,
          /installRtcProviderPackage/,
          /installRtcProviderPackages/,
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          /resolveRtcProviderSelection/,
          /getRtcProviderByProviderKey/,
          /getRtcProviderActivationByProviderKey/,
          /createRtcProviderSupportState/,
        ],
      };
    case 'csharp':
    case 'go':
      return {
        providerCatalog: [/GetRtcProviderByProviderKey/],
        providerPackageCatalog: [/GetRtcProviderPackageByProviderKey/, /GetRtcProviderPackageByPackageIdentity/],
        providerActivationCatalog: [/GetRtcProviderActivationByProviderKey/],
        capabilityCatalog: [/GetRtcCapabilityCatalog/, /GetRtcCapabilityDescriptor/],
        providerExtensionCatalog: [
          /GetRtcProviderExtensionCatalog/,
          /GetRtcProviderExtensionDescriptor/,
          /GetRtcProviderExtensionsForProvider/,
          /GetRtcProviderExtensions/,
          /HasRtcProviderExtension/,
        ],
        languageWorkspaceCatalog: [/GetRtcLanguageWorkspaceByLanguage/],
        providerSelection: [
          /RtcProviderSelectionSources/,
          /RtcProviderSelectionPrecedence/,
          /ParsedRtcProviderUrl/,
          /ParseRtcProviderUrl/,
          /ResolveRtcProviderSelection/,
        ],
        providerSupport: [
          /RtcProviderSupportStatuses/,
          /RtcProviderSupportStateRequest/,
          /ResolveRtcProviderSupportStatus/,
          /CreateRtcProviderSupportState/,
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          /CreateRtcProviderPackageLoader/,
          /ResolveRtcProviderPackageLoadTarget/,
          /LoadRtcProviderModule/,
          /InstallRtcProviderPackage/,
          /InstallRtcProviderPackages/,
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          /ResolveRtcProviderSelection/,
          /GetRtcProviderByProviderKey/,
          /GetRtcProviderActivationByProviderKey/,
          /CreateRtcProviderSupportState/,
        ],
      };
    case 'python':
      return {
        providerCatalog: [/get_rtc_provider_by_provider_key/],
        providerPackageCatalog: [/get_rtc_provider_package_by_provider_key/, /get_rtc_provider_package_by_package_identity/],
        providerActivationCatalog: [/get_rtc_provider_activation_by_provider_key/],
        capabilityCatalog: [/get_rtc_capability_catalog/, /get_rtc_capability_descriptor/],
        providerExtensionCatalog: [
          /get_rtc_provider_extension_catalog/,
          /get_rtc_provider_extension_descriptor/,
          /get_rtc_provider_extensions_for_provider/,
          /get_rtc_provider_extensions/,
          /has_rtc_provider_extension/,
        ],
        languageWorkspaceCatalog: [/get_rtc_language_workspace_by_language/],
        providerSelection: [
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SELECTION_PRECEDENCE/,
          /ParsedRtcProviderUrl/,
          /parse_rtc_provider_url/,
          /resolve_rtc_provider_selection/,
        ],
        providerSupport: [
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /RtcProviderSupportStateRequest/,
          /resolve_rtc_provider_support_status/,
          /create_rtc_provider_support_state/,
        ],
        providerPackageLoader: [
          /RtcProviderPackageLoadRequest/,
          /RtcResolvedProviderPackageLoadTarget/,
          /RtcProviderPackageLoader/,
          /create_rtc_provider_package_loader/,
          /resolve_rtc_provider_package_load_target/,
          /load_rtc_provider_module/,
          /install_rtc_provider_package/,
          /install_rtc_provider_packages/,
          /provider_package_not_found/,
          /provider_package_identity_mismatch/,
          /provider_package_load_failed/,
          /provider_module_export_missing/,
        ],
        driverManagerDelegates: [
          /resolve_rtc_provider_selection/,
          /get_rtc_provider_by_provider_key/,
          /get_rtc_provider_activation_by_provider_key/,
          /create_rtc_provider_support_state/,
        ],
      };
    default:
      throw new Error(`Unsupported reserved language lookup helper contract: ${language}`);
  }
}

export function getReservedLanguageRootPublicContract(languageEntry) {
  switch (languageEntry.language) {
    case 'flutter':
      return {
        relativePath: 'lib/rtc_sdk.dart',
        patterns: [
          /library rtc_sdk;/,
          /export 'src\/rtc_standard_contract\.dart';/,
          /export 'src\/rtc_provider_catalog\.dart';/,
          /export 'src\/rtc_provider_package_catalog\.dart';/,
          /export 'src\/rtc_provider_activation_catalog\.dart';/,
          /export 'src\/rtc_capability_catalog\.dart';/,
          /export 'src\/rtc_provider_extension_catalog\.dart';/,
          /export 'src\/rtc_language_workspace_catalog\.dart';/,
          /export 'src\/rtc_provider_selection\.dart';/,
          /export 'src\/rtc_provider_package_loader\.dart';/,
          /export 'src\/rtc_provider_support\.dart';/,
          /export 'src\/rtc_driver_manager\.dart';/,
          /export 'src\/rtc_data_source\.dart';/,
        ],
      };
    case 'python':
      return {
        relativePath: 'sdkwork_rtc_sdk/__init__.py',
        patterns: [
          /from \.provider_catalog import \(/,
          /from \.provider_package_catalog import \(/,
          /from \.provider_activation_catalog import \(/,
          /from \.language_workspace_catalog import \(/,
          /from \.provider_selection import \(/,
          /from \.provider_package_loader import \(/,
          /from \.provider_support import \(/,
          /ParsedRtcProviderUrl/,
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /create_rtc_provider_package_loader/,
          /resolve_rtc_provider_package_load_target/,
          /get_rtc_provider_extensions_for_provider/,
          /get_rtc_language_workspace_by_language/,
          /__all__ = \[/,
        ],
      };
    default:
      return null;
  }
}

export function getGoPublicStructFieldContracts(languageEntry) {
  if (languageEntry.language !== 'go') {
    return [];
  }

  return [
    {
      relativePath: languageEntry.metadataScaffold.providerCatalogRelativePath,
      patterns: [/ProviderKey\s+string/, /PluginId\s+string/, /DriverId\s+string/, /DefaultSelected\s+bool/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /PackageIdentity\s+string/,
        /RootPublic\s+bool/,
        /RuntimeBridgeStatus\s+string/,
      ],
    },
    {
      relativePath: languageEntry.metadataScaffold.capabilityCatalogRelativePath,
      patterns: [/CapabilityKey\s+string/, /Category\s+string/, /Surface\s+string/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
      patterns: [/ExtensionKey\s+string/, /ProviderKey\s+string/, /DisplayName\s+string/],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerSelectionRelativePath,
      patterns: [
        /ProviderUrl\s+string/,
        /ProviderKey\s+string/,
        /TenantOverrideProviderKey\s+string/,
        /DeploymentProfileProviderKey\s+string/,
      ],
    },
    {
      relativePath: languageEntry.resolutionScaffold.providerSupportRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /Status\s+string/,
        /Builtin\s+bool/,
        /Official\s+bool/,
        /Registered\s+bool/,
      ],
    },
    {
      relativePath: languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
      patterns: [
        /ProviderKey\s+string/,
        /ActivationStatus\s+string/,
        /RuntimeBridge\s+bool/,
        /PackageIdentity\s+string/,
      ],
    },
    {
      relativePath: languageEntry.workspaceCatalogRelativePath,
      patterns: [/Language\s+string/, /PublicPackage\s+string/, /RoleHighlights\s+\[\]string/],
    },
    {
      relativePath: languageEntry.resolutionScaffold.dataSourceRelativePath,
      patterns: [
        /ProviderUrl\s+string/,
        /DefaultProviderKey\s+string/,
        /selection\.ProviderKey/,
      ],
    },
  ];
}
