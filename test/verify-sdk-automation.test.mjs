import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const workspaceRoot = path.resolve('sdks/sdkwork-rtc-sdk');
const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
const sdksReadmePath = path.resolve('sdks/README.md');
const KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS = ['{providerKey}', '{providerPascal}'];
const LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS = [
  'reserved TypeScript provider package boundaries',
  'builtin_reference_boundary',
  'official_reserved_boundary',
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function toPascalCase(value) {
  return String(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toUpperSnakeCase(value) {
  return String(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.toUpperCase())
    .join('_');
}

function getCanonicalTypeScriptProviderPackageContract(providerKey) {
  const providerPascal = toPascalCase(providerKey);
  const providerUpperSnake = toUpperSnakeCase(providerKey);

  return {
    packageName: `@sdkwork/rtc-sdk-provider-${providerKey}`,
    sourceModule: `../../src/providers/${providerKey}.ts`,
    driverFactory: `create${providerPascal}RtcDriver`,
    metadataSymbol: `${providerUpperSnake}_RTC_PROVIDER_METADATA`,
    moduleSymbol: `${providerUpperSnake}_RTC_PROVIDER_MODULE`,
  };
}

function extractTemplateTokens(value) {
  return [...new Set(String(value).match(/\{[A-Za-z][A-Za-z0-9]*\}/g) ?? [])].sort();
}

function normalizeStringArray(values) {
  return [...new Set((values ?? []).map((value) => String(value)))].sort();
}

function materializeProviderPackagePattern(pattern, providerKey) {
  return String(pattern)
    .replaceAll('{providerKey}', providerKey)
    .replaceAll('{providerPascal}', toPascalCase(providerKey));
}

function buildProviderPackageManifestPath(providerPackageScaffold, providerKey) {
  return `${materializeProviderPackagePattern(providerPackageScaffold.directoryPattern, providerKey)}/${materializeProviderPackagePattern(providerPackageScaffold.manifestFileName, providerKey)}`;
}

function buildProviderPackageReadmePath(providerPackageScaffold, providerKey) {
  return `${materializeProviderPackagePattern(providerPackageScaffold.directoryPattern, providerKey)}/${providerPackageScaffold.readmeFileName}`;
}

function buildProviderPackageSourcePath(providerPackageScaffold, providerKey) {
  return `${materializeProviderPackagePattern(providerPackageScaffold.directoryPattern, providerKey)}/${materializeProviderPackagePattern(providerPackageScaffold.sourceFilePattern, providerKey)}`;
}

function buildProviderPackageSourceRelativePath(providerPackageScaffold, providerKey) {
  return materializeProviderPackagePattern(providerPackageScaffold.sourceFilePattern, providerKey);
}

function buildProviderPackageSourceSymbol(providerPackageScaffold, providerKey) {
  return materializeProviderPackagePattern(providerPackageScaffold.sourceSymbolPattern, providerKey);
}

function describeProviderActivationStatus(activationStatus) {
  switch (activationStatus) {
    case 'root-public-builtin':
      return {
        runtimeBridge: true,
        rootPublic: true,
        packageBoundary: true,
      };
    case 'package-boundary':
      return {
        runtimeBridge: true,
        rootPublic: false,
        packageBoundary: true,
      };
    case 'control-metadata-only':
    default:
      return {
        runtimeBridge: false,
        rootPublic: false,
        packageBoundary: false,
      };
  }
}

function buildLanguageProviderActivationCatalogEntries(languageEntry, providers) {
  const providerByKey = new Map((providers ?? []).map((provider) => [provider.providerKey, provider]));

  return (languageEntry.providerActivations ?? []).map((providerActivation) => {
    const provider = providerByKey.get(providerActivation.providerKey);
    const activationDetails = describeProviderActivationStatus(providerActivation.activationStatus);

    return {
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      activationStatus: providerActivation.activationStatus,
      runtimeBridge: activationDetails.runtimeBridge,
      rootPublic: activationDetails.rootPublic,
      packageBoundary: activationDetails.packageBoundary,
      builtin: provider.builtin === true,
      packageIdentity: materializeProviderPackagePattern(
        languageEntry.providerPackageScaffold.packagePattern,
        provider.providerKey,
      ),
    };
  });
}

function getReservedLanguageContractScaffolds(assembly) {
  return assembly.languages.filter((languageEntry) => languageEntry.language !== 'typescript');
}

function getReservedLanguagePackageScaffolds(assembly) {
  return assembly.languages.filter((languageEntry) => languageEntry.language !== 'typescript');
}

function getReservedLanguageProviderPackageScaffolds(assembly) {
  return assembly.languages.filter((languageEntry) => languageEntry.language !== 'typescript');
}

function getReservedLanguageMetadataScaffolds(assembly) {
  return assembly.languages.filter((languageEntry) => languageEntry.language !== 'typescript');
}

function getReservedLanguageResolutionScaffolds(assembly) {
  return assembly.languages.filter((languageEntry) => languageEntry.language !== 'typescript');
}

function getReservedLanguageLookupHelperPatterns(language) {
  switch (language) {
    case 'flutter':
      return {
        providerCatalog: [/getRtcProviderByProviderKey/],
        providerPackageCatalog: [/getRtcProviderPackageByProviderKey/],
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
        providerPackageCatalog: [/get_rtc_provider_package_by_provider_key/],
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
        providerPackageCatalog: [/getRtcProviderPackageByProviderKey/],
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
        providerPackageCatalog: [/GetRtcProviderPackageByProviderKey/],
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
        providerPackageCatalog: [/get_rtc_provider_package_by_provider_key/],
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toGoExportedFieldToken(token) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(token)) {
    return token;
  }

  return `${token.charAt(0).toUpperCase()}${token.slice(1)}`;
}

function matchesReservedLanguageToken(language, content, token) {
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

function assertReservedLanguageToken(language, content, token, label = token) {
  assert.equal(
    matchesReservedLanguageToken(language, content, token),
    true,
    `expected ${language} content to preserve ${label}`,
  );
}

function getReservedLanguageRootPublicContract(languageEntry) {
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
          /from \.provider_support import \(/,
          /ParsedRtcProviderUrl/,
          /RTC_PROVIDER_SELECTION_SOURCES/,
          /RTC_PROVIDER_SUPPORT_STATUSES/,
          /get_rtc_provider_extensions_for_provider/,
          /get_rtc_language_workspace_by_language/,
          /__all__ = \[/,
        ],
      };
    default:
      return null;
  }
}

function getGoPublicStructFieldContracts(languageEntry) {
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

function createVerifierFixture(mutator) {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-rtc-sdk-verify-'));
  const workspaceCopy = path.join(fixtureRoot, 'sdkwork-rtc-sdk');

  const filesToCopy = [
    'README.md',
    '.gitignore',
    '.sdkwork-assembly.json',
    'docs/README.md',
    'docs/package-standards.md',
    'docs/provider-adapter-standard.md',
    'docs/multilanguage-capability-matrix.md',
    'docs/verification-matrix.md',
    'bin/materialize-sdk.mjs',
    'bin/materialize-sdk.ps1',
    'bin/materialize-sdk.sh',
    'bin/smoke-sdk.mjs',
    'bin/smoke-sdk.ps1',
    'bin/smoke-sdk.sh',
    'bin/verify-sdk.mjs',
    'sdkwork-rtc-sdk-typescript/package.json',
    'sdkwork-rtc-sdk-typescript/README.md',
    'sdkwork-rtc-sdk-typescript/bin/package-task.mjs',
    'sdkwork-rtc-sdk-typescript/src/capability-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-selection.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-support.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/index.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-catalog.ts',
  ];

  const assemblySnapshot = readJson(assemblyPath);

  for (const language of assemblySnapshot.officialLanguages) {
    filesToCopy.push(`sdkwork-rtc-sdk-${language}/README.md`);
  }

  for (const languageEntry of assemblySnapshot.languages) {
    if (typeof languageEntry.workspaceCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.workspaceCatalogRelativePath}`,
      );
    }

    const rootPublicContract = getReservedLanguageRootPublicContract(languageEntry);
    if (rootPublicContract) {
      filesToCopy.push(`${languageEntry.workspace}/${rootPublicContract.relativePath}`);
    }
  }

  for (const languageEntry of getReservedLanguageContractScaffolds(assemblySnapshot)) {
    if (typeof languageEntry.contractScaffold?.relativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.contractScaffold.relativePath}`,
      );
    }
  }

  for (const languageEntry of getReservedLanguagePackageScaffolds(assemblySnapshot)) {
    if (typeof languageEntry.packageScaffold?.manifestRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.packageScaffold.manifestRelativePath}`,
      );
    }
  }

  for (const languageEntry of getReservedLanguageProviderPackageScaffolds(assemblySnapshot)) {
    if (typeof languageEntry.providerPackageScaffold?.relativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.providerPackageScaffold.relativePath}`,
      );
    }

    if (typeof languageEntry.providerPackageScaffold?.directoryPattern === 'string') {
      for (const provider of assemblySnapshot.providers) {
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
        filesToCopy.push(
          `${languageEntry.workspace}/${buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          )}`,
        );
      }
    }
  }

  for (const languageEntry of getReservedLanguageMetadataScaffolds(assemblySnapshot)) {
    if (typeof languageEntry.metadataScaffold?.providerCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerCatalogRelativePath}`,
      );
    }
    if (typeof languageEntry.metadataScaffold?.providerPackageCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}`,
      );
    }
    if (typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}`,
      );
    }
    if (typeof languageEntry.metadataScaffold?.capabilityCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.capabilityCatalogRelativePath}`,
      );
    }
    if (typeof languageEntry.metadataScaffold?.providerExtensionCatalogRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}`,
      );
    }
    if (typeof languageEntry.metadataScaffold?.providerSelectionRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.metadataScaffold.providerSelectionRelativePath}`,
      );
    }
  }

  for (const languageEntry of getReservedLanguageResolutionScaffolds(assemblySnapshot)) {
    if (typeof languageEntry.resolutionScaffold?.driverManagerRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.resolutionScaffold.driverManagerRelativePath}`,
      );
    }
    if (typeof languageEntry.resolutionScaffold?.dataSourceRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.resolutionScaffold.dataSourceRelativePath}`,
      );
    }
    if (typeof languageEntry.resolutionScaffold?.providerSupportRelativePath === 'string') {
      filesToCopy.push(
        `${languageEntry.workspace}/${languageEntry.resolutionScaffold.providerSupportRelativePath}`,
      );
    }
  }

  filesToCopy.push('sdkwork-rtc-sdk-typescript/providers/README.md');
  for (const provider of assemblySnapshot.providers) {
    filesToCopy.push(`sdkwork-rtc-sdk-typescript/src/providers/${provider.providerKey}.ts`);
    filesToCopy.push(
      `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/README.md`,
    );
    filesToCopy.push(
      `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.js`,
    );
    filesToCopy.push(
      `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`,
    );
    filesToCopy.push(
      `sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-${provider.providerKey}/package.json`,
    );
  }

  for (const relativePath of filesToCopy) {
    const sourcePath = path.join(workspaceRoot, relativePath);
    const targetPath = path.join(workspaceCopy, relativePath);
    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, readFileSync(sourcePath));
  }

  const copiedAssemblyPath = path.join(workspaceCopy, '.sdkwork-assembly.json');
  const assembly = readJson(copiedAssemblyPath);
  mutator(assembly);
  writeFileSync(copiedAssemblyPath, `${JSON.stringify(assembly, null, 2)}\n`);

  return {
    fixtureRoot,
    workspaceCopy,
  };
}

test('sdk overview lists sdkwork-rtc-sdk workspace', () => {
  const content = readFileSync(sdksReadmePath, 'utf8');
  assert.match(content, /sdkwork-rtc-sdk/);
});

test('root rtc workspace contract files exist', () => {
  const requiredFiles = [
    'README.md',
    '.gitignore',
    '.sdkwork-assembly.json',
    'docs/README.md',
    'docs/package-standards.md',
    'docs/provider-adapter-standard.md',
    'docs/multilanguage-capability-matrix.md',
    'docs/verification-matrix.md',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('root documentation and materialized readmes describe provider package entrypoints, vendor sdk contract, and default catalog constants', () => {
  const assembly = readJson(assemblyPath);
  const rootReadme = readFileSync(path.join(workspaceRoot, 'README.md'), 'utf8');
  const docsReadme = readFileSync(path.join(workspaceRoot, 'docs', 'README.md'), 'utf8');
  const packageStandards = readFileSync(path.join(workspaceRoot, 'docs', 'package-standards.md'), 'utf8');
  const providerAdapterStandard = readFileSync(
    path.join(workspaceRoot, 'docs', 'provider-adapter-standard.md'),
    'utf8',
  );
  const capabilityMatrix = readFileSync(
    path.join(workspaceRoot, 'docs', 'multilanguage-capability-matrix.md'),
    'utf8',
  );
  const verificationMatrix = readFileSync(
    path.join(workspaceRoot, 'docs', 'verification-matrix.md'),
    'utf8',
  );
  const typescriptReadme = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'README.md'),
    'utf8',
  );
  const typescriptLanguageWorkspaceCatalog = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'src', 'language-workspace-catalog.ts'),
    'utf8',
  );
  const providersReadme = readFileSync(
    path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'providers', 'README.md'),
    'utf8',
  );
  const builtinProviderReadme = readFileSync(
    path.join(
      workspaceRoot,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-volcengine',
      'README.md',
    ),
    'utf8',
  );
  const futureProviderReadme = readFileSync(
    path.join(
      workspaceRoot,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-agora',
      'README.md',
    ),
    'utf8',
  );

  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(rootReadme, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(rootReadme, /assembly-driven language workspace identity, role, and summary contracts/i);
  assert.match(rootReadme, /language workspace catalog/i);
  assert.match(rootReadme, /provider package scaffold boundaries/i);
  assert.match(rootReadme, /provider package boundar/i);
  assert.match(rootReadme, /template token/i);
  assert.match(rootReadme, /root-public/i);
  assert.match(rootReadme, /capability negotiation/i);
  assert.match(rootReadme, /degraded/i);
  assert.match(rootReadme, /unsupported/i);
  assert.match(rootReadme, /smoke-sdk\.mjs/);
  assert.match(rootReadme, /full regression/i);
  assert.match(rootReadme, /\.gitignore/);
  assert.match(rootReadme, /non-source artifacts/i);
  assert.match(rootReadme, /\.sdkwork-assembly\.json.*source/i);
  assert.match(rootReadme, /source stub/i);
  assert.match(rootReadme, /source symbol/i);
  assert.match(rootReadme, /provider activation catalog/i);
  assert.match(rootReadme, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(rootReadme, /getOfficialRtcProviderMetadataByKey/);
  assert.match(rootReadme, /getRtcProviderByProviderKey/);
  assert.match(rootReadme, /getRtcProviderPackageByProviderKey/);
  assert.match(rootReadme, /getRtcProviderActivationByProviderKey/);
  assert.match(rootReadme, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(rootReadme, /resolveRtcProviderSupportStatus/);
  assert.match(rootReadme, /createRtcProviderSupportState/);
  assert.match(rootReadme, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(rootReadme, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(rootReadme, /create<ProviderPascal>RtcDriver/);
  assert.match(rootReadme, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(rootReadme, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);

  assert.match(docsReadme, /provider-catalog\.ts/);
  assert.match(docsReadme, /provider-activation-catalog\.ts/);
  assert.match(docsReadme, /provider-selection\.ts/);
  assert.match(docsReadme, /provider-support\.ts/);
  assert.match(docsReadme, /provider-package-catalog\.ts/);
  assert.match(docsReadme, /language-workspace-catalog\.ts/);
  assert.match(docsReadme, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(docsReadme, /getOfficialRtcProviderMetadataByKey/);
  assert.match(docsReadme, /getRtcProviderByProviderKey/);
  assert.match(docsReadme, /getRtcProviderPackageByProviderKey/);
  assert.match(docsReadme, /getRtcProviderActivationByProviderKey/);
  assert.match(docsReadme, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(docsReadme, /provider support classification/i);
  assert.match(docsReadme, /provider lookup by key/i);

  assert.match(packageStandards, /index\.js/);
  assert.match(packageStandards, /index\.d\.ts/);
  assert.match(packageStandards, /exports/);
  assert.match(packageStandards, /consumer-supplied/);
  assert.match(packageStandards, /native-factory/);
  assert.match(packageStandards, /must-not-bundle/);
  assert.match(packageStandards, /reference-baseline/);
  assert.match(packageStandards, /official vendor sdk.*required/i);
  assert.match(packageStandards, /displayName/);
  assert.match(packageStandards, /currentRole/);
  assert.match(packageStandards, /workspaceSummary/);
  assert.match(packageStandards, /roleHighlights/);
  assert.match(packageStandards, /workspaceCatalogRelativePath/);
  assert.match(packageStandards, /language workspace catalog/i);
  assert.match(packageStandards, /providerActivations/);
  assert.match(packageStandards, /typescriptPackage/);
  assert.match(packageStandards, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(packageStandards, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(packageStandards, /create<ProviderPascal>RtcDriver/);
  assert.match(packageStandards, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(packageStandards, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);
  assert.match(packageStandards, /contractScaffold/);
  assert.match(packageStandards, /resolutionScaffold/);
  assert.match(packageStandards, /providerPackageScaffold/);
  assert.match(packageStandards, /directoryPattern/);
  assert.match(packageStandards, /packagePattern/);
  assert.match(packageStandards, /manifestFileName/);
  assert.match(packageStandards, /readmeFileName/);
  assert.match(packageStandards, /sourceFilePattern/);
  assert.match(packageStandards, /sourceSymbolPattern/);
  assert.match(packageStandards, /templateTokens/);
  assert.match(packageStandards, /sourceTemplateTokens/);
  assert.match(packageStandards, /future-runtime-bridge-only/);
  assert.match(packageStandards, /rootPublic/);
  assert.match(packageStandards, /provider package boundar/i);
  assert.match(packageStandards, /source stub/i);
  assert.match(packageStandards, /providerPackageCatalogRelativePath/);
  assert.match(packageStandards, /provider package catalog/i);
  assert.match(packageStandards, /providerActivationCatalogRelativePath/);
  assert.match(packageStandards, /provider activation catalog/i);
  assert.match(packageStandards, /providerExtensionCatalogRelativePath/);
  assert.match(packageStandards, /driver manager/i);
  assert.match(packageStandards, /data source/i);
  assert.match(packageStandards, /provider support/i);
  assert.match(packageStandards, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(packageStandards, /getRtcProviderActivationByProviderKey/);
  assert.match(packageStandards, /getRtcProviderPackageByProviderKey/);
  assert.match(packageStandards, /getRtcProviderByProviderKey/);
  assert.match(packageStandards, /RtcProviderSupportStateRequest/);
  assert.match(packageStandards, /resolveRtcProviderSupportStatus/);
  assert.match(packageStandards, /createRtcProviderSupportState/);
  assert.match(packageStandards, /root-public-builtin/);
  assert.match(packageStandards, /package-boundary/);
  assert.match(packageStandards, /control-metadata-only/);
  assert.match(packageStandards, /capabilityCatalog/);
  assert.match(packageStandards, /providerExtensionCatalog/);
  assert.match(packageStandards, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(packageStandards, /getOfficialRtcProviderMetadataByKey/);
  assert.match(packageStandards, /category/);
  assert.match(packageStandards, /surface/);
  assert.match(packageStandards, /cross-surface/);
  assert.match(packageStandards, /unwrap-only/);
  assert.match(packageStandards, /extension-object/);
  assert.match(packageStandards, /runtime-frozen/i);
  assert.match(packageStandards, /\.gitignore/);
  assert.match(packageStandards, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(packageStandards, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(packageStandards, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(packageStandards, /__pycache__/);
  assert.match(packageStandards, /\.sdkwork-assembly\.json/);

  assert.match(providerAdapterStandard, /index\.js/);
  assert.match(providerAdapterStandard, /index\.d\.ts/);
  assert.match(providerAdapterStandard, /exports/);
  assert.match(providerAdapterStandard, /builtin provider packages/i);
  assert.match(providerAdapterStandard, /consumer-supplied/);
  assert.match(providerAdapterStandard, /registerRtcProviderModules/);
  assert.match(providerAdapterStandard, /native-factory/);
  assert.match(providerAdapterStandard, /must-not-bundle/);
  assert.match(providerAdapterStandard, /reference-baseline/);
  assert.match(providerAdapterStandard, /official vendor sdk.*required/i);
  assert.match(providerAdapterStandard, /provider_module_contract_mismatch/);
  assert.match(providerAdapterStandard, /atomic/i);
  assert.match(providerAdapterStandard, /control-plane/i);
  assert.match(providerAdapterStandard, /runtime-bridge/i);
  assert.match(providerAdapterStandard, /cross-surface/i);
  assert.match(providerAdapterStandard, /capability negotiation/i);
  assert.match(providerAdapterStandard, /degraded/i);
  assert.match(providerAdapterStandard, /unsupported/i);
  assert.match(providerAdapterStandard, /getRtcProviderPackageByProviderKey/);
  assert.match(providerAdapterStandard, /getRtcProviderActivationByProviderKey/);
  assert.match(providerAdapterStandard, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(providerAdapterStandard, /getRtcProviderByProviderKey/);
  assert.match(providerAdapterStandard, /resolveRtcProviderSupportStatus/);
  assert.match(providerAdapterStandard, /createRtcProviderSupportState/);
  assert.match(providerAdapterStandard, /provider extension metadata/i);
  assert.match(providerAdapterStandard, /unwrap-only/i);
  assert.match(providerAdapterStandard, /extension-object/i);
  assert.match(providerAdapterStandard, /templateTokens/);
  assert.match(providerAdapterStandard, /sourceFilePattern/);
  assert.match(providerAdapterStandard, /sourceSymbolPattern/);
  assert.match(providerAdapterStandard, /sourceTemplateTokens/);
  assert.match(providerAdapterStandard, /future-runtime-bridge-only/);
  assert.match(providerAdapterStandard, /rootPublic/i);
  assert.match(providerAdapterStandard, /provider package boundar/i);
  assert.match(providerAdapterStandard, /provider package catalog/i);
  assert.match(providerAdapterStandard, /provider activation catalog/i);
  assert.match(providerAdapterStandard, /source stub/i);

  assert.match(capabilityMatrix, /Capability Catalog/i);
  assert.match(capabilityMatrix, /Capability key/i);
  assert.match(capabilityMatrix, /Category/i);
  assert.match(capabilityMatrix, /Surface/i);
  assert.match(capabilityMatrix, /control-plane/i);
  assert.match(capabilityMatrix, /runtime-bridge/i);
  assert.match(capabilityMatrix, /cross-surface/i);
  assert.match(capabilityMatrix, /Provider Extension Catalog/i);
  assert.match(capabilityMatrix, /Provider package catalog/i);
  assert.match(capabilityMatrix, /Provider activation catalog/i);
  assert.match(capabilityMatrix, /Reserved Language Provider Package Scaffold Matrix/i);
  assert.match(capabilityMatrix, /Directory pattern/i);
  assert.match(capabilityMatrix, /Package pattern/i);
  assert.match(capabilityMatrix, /Readme file name/i);
  assert.match(capabilityMatrix, /Source file pattern/i);
  assert.match(capabilityMatrix, /Source symbol pattern/i);
  assert.match(capabilityMatrix, /Template tokens/i);
  assert.match(capabilityMatrix, /Source template tokens/i);
  assert.match(capabilityMatrix, /Runtime bridge status/i);
  assert.match(capabilityMatrix, /Default provider package identity/i);
  assert.match(capabilityMatrix, /Default provider manifest path/i);
  assert.match(capabilityMatrix, /Default provider README path/i);
  assert.match(capabilityMatrix, /Default provider source path/i);
  assert.match(capabilityMatrix, /Default provider source symbol/i);
  assert.match(capabilityMatrix, /future-runtime-bridge-only/i);
  assert.match(capabilityMatrix, /root public/i);
  assert.match(capabilityMatrix, /Extension key/i);
  assert.match(capabilityMatrix, /Access/i);
  assert.match(capabilityMatrix, /Status/i);
  assert.match(capabilityMatrix, /unwrap-only/i);

  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(verificationMatrix, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(verificationMatrix, /index\.js/);
  assert.match(verificationMatrix, /index\.d\.ts/);
  assert.match(verificationMatrix, /dart analyze/i);
  assert.match(verificationMatrix, /consumer-supplied/);
  assert.match(verificationMatrix, /native-factory/);
  assert.match(verificationMatrix, /must-not-bundle/);
  assert.match(verificationMatrix, /reference-baseline/);
  assert.match(verificationMatrix, /official vendor sdk.*required/i);
  assert.match(verificationMatrix, /displayName/);
  assert.match(verificationMatrix, /currentRole/);
  assert.match(verificationMatrix, /workspaceSummary/);
  assert.match(verificationMatrix, /roleHighlights/);
  assert.match(verificationMatrix, /workspaceCatalogRelativePath/);
  assert.match(verificationMatrix, /language workspace catalog/i);
  assert.match(verificationMatrix, /providerActivations/);
  assert.match(verificationMatrix, /typescriptPackage/);
  assert.match(verificationMatrix, /@sdkwork\/rtc-sdk-provider-<providerKey>/);
  assert.match(verificationMatrix, /\.\.\/\.\.\/src\/providers\/<providerKey>\.ts/);
  assert.match(verificationMatrix, /create<ProviderPascal>RtcDriver/);
  assert.match(verificationMatrix, /<PROVIDER_UPPER>_RTC_PROVIDER_METADATA/);
  assert.match(verificationMatrix, /<PROVIDER_UPPER>_RTC_PROVIDER_MODULE/);
  assert.match(verificationMatrix, /contractScaffold/);
  assert.match(verificationMatrix, /resolutionScaffold/);
  assert.match(verificationMatrix, /providerPackageScaffold/);
  assert.match(verificationMatrix, /directoryPattern/);
  assert.match(verificationMatrix, /packagePattern/);
  assert.match(verificationMatrix, /manifestFileName/);
  assert.match(verificationMatrix, /readmeFileName/);
  assert.match(verificationMatrix, /sourceFilePattern/);
  assert.match(verificationMatrix, /sourceSymbolPattern/);
  assert.match(verificationMatrix, /templateTokens/);
  assert.match(verificationMatrix, /sourceTemplateTokens/);
  assert.match(verificationMatrix, /future-runtime-bridge-only/);
  assert.match(verificationMatrix, /rootPublic/);
  assert.match(verificationMatrix, /provider package boundar/i);
  assert.match(verificationMatrix, /source stub/i);
  assert.match(verificationMatrix, /providerPackageCatalogRelativePath/);
  assert.match(verificationMatrix, /provider package catalog/i);
  assert.match(verificationMatrix, /providerActivationCatalogRelativePath/);
  assert.match(verificationMatrix, /provider activation catalog/i);
  assert.match(verificationMatrix, /providerExtensionCatalogRelativePath/);
  assert.match(verificationMatrix, /driver manager/i);
  assert.match(verificationMatrix, /data source/i);
  assert.match(verificationMatrix, /provider support/i);
  assert.match(verificationMatrix, /getRtcProviderPackageByProviderKey/);
  assert.match(verificationMatrix, /getRtcProviderActivationByProviderKey/);
  assert.match(verificationMatrix, /getRtcLanguageWorkspaceByLanguage/);
  assert.match(verificationMatrix, /getRtcProviderByProviderKey/);
  assert.match(verificationMatrix, /root-public-builtin/);
  assert.match(verificationMatrix, /package-boundary/);
  assert.match(verificationMatrix, /control-metadata-only/);
  assert.match(verificationMatrix, /capabilityCatalog/);
  assert.match(verificationMatrix, /cross-surface/);
  assert.match(verificationMatrix, /capability negotiation/i);
  assert.match(verificationMatrix, /degraded/i);
  assert.match(verificationMatrix, /unsupported/i);
  assert.match(verificationMatrix, /runtime-frozen/i);
  assert.match(verificationMatrix, /registerRtcProviderModules/);
  assert.match(verificationMatrix, /provider_module_contract_mismatch/);
  assert.match(verificationMatrix, /atomic/i);
  assert.match(verificationMatrix, /providerExtensionCatalog/);
  assert.match(verificationMatrix, /resolveRtcProviderSupportStatus/);
  assert.match(verificationMatrix, /createRtcProviderSupportState/);
  assert.match(verificationMatrix, /getBuiltinRtcProviderMetadataByKey/);
  assert.match(verificationMatrix, /getOfficialRtcProviderMetadataByKey/);
  assert.match(verificationMatrix, /provider catalog lookup/i);
  assert.match(verificationMatrix, /unwrap-only/);
  assert.match(verificationMatrix, /extension-object/);
  assert.match(verificationMatrix, /smoke-sdk\.mjs/);
  assert.match(verificationMatrix, /compileall/i);
  assert.match(verificationMatrix, /cargo check/i);
  assert.match(verificationMatrix, /go build/i);
  assert.match(verificationMatrix, /dotnet build/i);
  assert.match(verificationMatrix, /javac/i);
  assert.match(verificationMatrix, /swift build/i);
  assert.match(verificationMatrix, /kotlinc/i);
  assert.match(verificationMatrix, /\.gitignore/);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(verificationMatrix, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(verificationMatrix, /__pycache__/);
  assert.match(verificationMatrix, /\.sdkwork-assembly\.json/);

  assert.match(typescriptReadme, /src\/provider-catalog\.ts/);
  assert.match(typescriptReadme, /src\/provider-package-catalog\.ts/);
  assert.match(typescriptReadme, /src\/provider-selection\.ts/);
  assert.match(typescriptReadme, /src\/provider-support\.ts/);
  assert.match(typescriptReadme, /src\/language-workspace-catalog\.ts/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_KEY/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_PLUGIN_ID/);
  assert.match(typescriptReadme, /DEFAULT_RTC_PROVIDER_DRIVER_ID/);
  assert.match(typescriptReadme, /provider-activation-catalog\.ts/);
  assert.match(typescriptReadme, /reference-baseline/);
  assert.match(typescriptReadme, /official vendor sdk.*required/i);
  assert.match(typescriptReadme, /root_public_reference_boundary/);
  assert.match(typescriptReadme, /package_reference_boundary/);

  assert.match(typescriptLanguageWorkspaceCatalog, /root_public_reference_boundary/);
  assert.match(typescriptLanguageWorkspaceCatalog, /package_reference_boundary/);

  assert.match(providersReadme, /index\.js/);
  assert.match(providersReadme, /index\.d\.ts/);
  assert.match(providersReadme, /exports/);
  assert.match(providersReadme, /consumer-supplied/);
  assert.match(providersReadme, /native-factory/);
  assert.match(providersReadme, /must-not-bundle/);
  assert.match(providersReadme, /reference-baseline/);
  assert.match(providersReadme, /official vendor sdk.*required/i);
  assert.match(providersReadme, /root_public_reference_boundary/);
  assert.match(providersReadme, /package_reference_boundary/);

  const typeScriptLanguage = assembly.languages.find((languageEntry) => languageEntry.language === 'typescript');
  assert.ok(typeScriptLanguage, 'expected TypeScript language workspace');
  assert.equal(
    typeScriptLanguage.roleHighlights.some((highlight) => /root_public_reference_boundary/.test(highlight)),
    true,
  );
  assert.equal(
    typeScriptLanguage.roleHighlights.some((highlight) => /package_reference_boundary/.test(highlight)),
    true,
  );

  for (const legacyTerm of LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS) {
    assert.doesNotMatch(typescriptReadme, new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(providersReadme, new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    assert.doesNotMatch(
      typescriptLanguageWorkspaceCatalog,
      new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    );
    assert.equal(
      typeScriptLanguage.roleHighlights.some(
        (highlight) => new RegExp(legacyTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(highlight),
      ),
      false,
    );
  }

  assert.match(builtinProviderReadme, /may be re-exported from the root `@sdkwork\/rtc-sdk` entrypoint/);
  assert.match(builtinProviderReadme, /vendor sdk provisioning:\s*`consumer-supplied`/i);
  assert.match(builtinProviderReadme, /binding strategy:\s*`native-factory`/i);
  assert.match(builtinProviderReadme, /bundle policy:\s*`must-not-bundle`/i);
  assert.match(builtinProviderReadme, /runtime bridge status:\s*`reference-baseline`/i);
  assert.match(builtinProviderReadme, /official vendor sdk requirement:\s*`required`/i);
  assert.match(futureProviderReadme, /not re-exported from the root `@sdkwork\/rtc-sdk` entrypoint/);
  assert.match(futureProviderReadme, /vendor sdk provisioning:\s*`consumer-supplied`/i);
  assert.match(futureProviderReadme, /binding strategy:\s*`native-factory`/i);
  assert.match(futureProviderReadme, /bundle policy:\s*`must-not-bundle`/i);
  assert.match(futureProviderReadme, /runtime bridge status:\s*`reference-baseline`/i);
  assert.match(futureProviderReadme, /official vendor sdk requirement:\s*`required`/i);
});

test('root gitignore keeps transient artifact boundaries out of source control', () => {
  const gitignore = readFileSync(path.join(workspaceRoot, '.gitignore'), 'utf8');

  assert.match(gitignore, /sdkwork-rtc-sdk-typescript\/dist\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-rust\/target\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-java\/target\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-csharp\/src\/\*\*\/bin\//);
  assert.match(gitignore, /sdkwork-rtc-sdk-csharp\/src\/\*\*\/obj\//);
  assert.match(gitignore, /__pycache__/);
  assert.match(gitignore, /\*\.tgz/);
  assert.doesNotMatch(gitignore, /^\/\.sdkwork-assembly\.json$/m);
});

test('rtc assembly declares official languages and default provider', () => {
  const assembly = readJson(assemblyPath);

  assert.equal(assembly.workspace, 'sdkwork-rtc-sdk');
  assert.equal(assembly.defaults?.providerKey, 'volcengine');
  assert.deepEqual(assembly.officialLanguages, [
    'typescript',
    'flutter',
    'rust',
    'java',
    'csharp',
    'swift',
    'kotlin',
    'go',
    'python',
  ]);

  const defaultSelectedProviders = assembly.providers
    .filter((provider) => provider.defaultSelected)
    .map((provider) => provider.providerKey);
  assert.deepEqual(defaultSelectedProviders, ['volcengine']);

  assert.equal(Array.isArray(assembly.capabilityCatalog), true);
  assert.equal(assembly.capabilityCatalog.length > 0, true);
  assert.equal(Array.isArray(assembly.providerExtensionCatalog), true);
  assert.equal(assembly.providerExtensionCatalog.length > 0, true);

  const capabilityKeys = new Set();
  for (const descriptor of assembly.capabilityCatalog) {
    assert.equal(typeof descriptor.capabilityKey, 'string');
    assert.equal(typeof descriptor.category, 'string');
    assert.equal(typeof descriptor.surface, 'string');
    assert.equal(capabilityKeys.has(descriptor.capabilityKey), false);
    capabilityKeys.add(descriptor.capabilityKey);
  }

  const providerExtensionKeys = new Set();
  for (const descriptor of assembly.providerExtensionCatalog) {
    assert.equal(typeof descriptor.extensionKey, 'string');
    assert.equal(typeof descriptor.providerKey, 'string');
    assert.equal(typeof descriptor.displayName, 'string');
    assert.equal(typeof descriptor.surface, 'string');
    assert.equal(typeof descriptor.access, 'string');
    assert.equal(typeof descriptor.status, 'string');
    assert.equal(providerExtensionKeys.has(descriptor.extensionKey), false);
    providerExtensionKeys.add(descriptor.extensionKey);
  }

  for (const provider of assembly.providers) {
    const canonicalTypeScriptPackage = getCanonicalTypeScriptProviderPackageContract(
      provider.providerKey,
    );

    assert.equal(typeof provider.defaultSelected, 'boolean');
    assert.equal(Array.isArray(provider.urlSchemes), true);
    assert.equal(provider.urlSchemes.length > 0, true);
    assert.equal(Array.isArray(provider.requiredCapabilities), true);
    assert.equal(provider.requiredCapabilities.length > 0, true);
    assert.equal(Array.isArray(provider.optionalCapabilities), true);
    assert.equal(Array.isArray(provider.extensionKeys), true);
    assert.equal(typeof provider.typescriptAdapter?.sdkProvisioning, 'string');
    assert.equal(typeof provider.typescriptAdapter?.bindingStrategy, 'string');
    assert.equal(typeof provider.typescriptAdapter?.bundlePolicy, 'string');
    assert.equal(typeof provider.typescriptAdapter?.runtimeBridgeStatus, 'string');
    assert.equal(typeof provider.typescriptAdapter?.officialVendorSdkRequirement, 'string');
    assert.equal(typeof provider.typescriptPackage?.packageName, 'string');
    assert.equal(typeof provider.typescriptPackage?.sourceModule, 'string');
    assert.equal(typeof provider.typescriptPackage?.driverFactory, 'string');
    assert.equal(typeof provider.typescriptPackage?.metadataSymbol, 'string');
    assert.equal(typeof provider.typescriptPackage?.moduleSymbol, 'string');
    assert.equal(typeof provider.typescriptPackage?.rootPublic, 'boolean');
    assert.equal(provider.typescriptPackage.packageName, canonicalTypeScriptPackage.packageName);
    assert.equal(provider.typescriptPackage.sourceModule, canonicalTypeScriptPackage.sourceModule);
    assert.equal(provider.typescriptPackage.driverFactory, canonicalTypeScriptPackage.driverFactory);
    assert.equal(provider.typescriptPackage.metadataSymbol, canonicalTypeScriptPackage.metadataSymbol);
    assert.equal(provider.typescriptPackage.moduleSymbol, canonicalTypeScriptPackage.moduleSymbol);

    for (const capability of provider.requiredCapabilities) {
      const descriptor = assembly.capabilityCatalog.find((entry) => entry.capabilityKey === capability);
      assert.ok(descriptor, `expected capability descriptor for ${capability}`);
      assert.equal(descriptor.category, 'required-baseline');
    }

    for (const capability of provider.optionalCapabilities) {
      const descriptor = assembly.capabilityCatalog.find((entry) => entry.capabilityKey === capability);
      assert.ok(descriptor, `expected capability descriptor for ${capability}`);
      assert.equal(descriptor.category, 'optional-advanced');
    }

    for (const extensionKey of provider.extensionKeys) {
      const descriptor = assembly.providerExtensionCatalog.find((entry) => entry.extensionKey === extensionKey);
      assert.ok(descriptor, `expected provider extension descriptor for ${extensionKey}`);
      assert.equal(descriptor.providerKey, provider.providerKey);
    }
  }

  assert.deepEqual(
    [...capabilityKeys].sort(),
    [...new Set(assembly.providers.flatMap((provider) => [
      ...provider.requiredCapabilities,
      ...provider.optionalCapabilities,
    ]))].sort(),
  );

  for (const languageEntry of assembly.languages) {
    assert.equal(typeof languageEntry.displayName, 'string');
    assert.equal(languageEntry.displayName.length > 0, true);
    assert.equal(typeof languageEntry.workspaceCatalogRelativePath, 'string');
    assert.equal(languageEntry.workspaceCatalogRelativePath.length > 0, true);
    assert.equal(typeof languageEntry.maturityTier, 'string');
    assert.equal(languageEntry.maturityTier.length > 0, true);
    assert.equal(typeof languageEntry.currentRole, 'string');
    assert.equal(languageEntry.currentRole.length > 0, true);
    assert.equal(typeof languageEntry.workspaceSummary, 'string');
    assert.equal(languageEntry.workspaceSummary.length > 0, true);
    assert.equal(Array.isArray(languageEntry.roleHighlights), true);
    assert.equal(Array.isArray(languageEntry.providerActivations), true);
    assert.equal(languageEntry.providerActivations.length, assembly.providers.length);

    if (languageEntry.language !== 'typescript') {
      assert.equal(typeof languageEntry.providerPackageScaffold?.readmeFileName, 'string');
      assert.equal(languageEntry.providerPackageScaffold.readmeFileName, 'README.md');
    }

    const seenProviderKeys = new Set();
    for (const providerActivation of languageEntry.providerActivations) {
      assert.equal(typeof providerActivation.providerKey, 'string');
      assert.equal(typeof providerActivation.activationStatus, 'string');
      assert.equal(seenProviderKeys.has(providerActivation.providerKey), false);
      seenProviderKeys.add(providerActivation.providerKey);
    }
  }

  const typescriptLanguage = assembly.languages.find((entry) => entry.language === 'typescript');
  assert.ok(typescriptLanguage);
  assert.deepEqual(
    typescriptLanguage.providerActivations.map((entry) => ({
      providerKey: entry.providerKey,
      activationStatus: entry.activationStatus,
    })),
    assembly.providers.map((provider) => ({
      providerKey: provider.providerKey,
      activationStatus: provider.builtin ? 'root-public-builtin' : 'package-boundary',
    })),
  );

  for (const languageEntry of assembly.languages.filter((entry) => entry.language !== 'typescript')) {
    assert.deepEqual(
      languageEntry.providerActivations.map((entry) => entry.activationStatus),
      assembly.providers.map(() => 'control-metadata-only'),
    );
  }
});

test('root verification entrypoints exist', () => {
  const requiredFiles = ['bin/verify-sdk.mjs', 'bin/verify-sdk.ps1', 'bin/verify-sdk.sh'];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('root smoke regression entrypoints exist', () => {
  const requiredFiles = ['bin/smoke-sdk.mjs', 'bin/smoke-sdk.ps1', 'bin/smoke-sdk.sh'];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }

  const smokeScript = readFileSync(path.join(workspaceRoot, 'bin', 'smoke-sdk.mjs'), 'utf8');
  assert.match(smokeScript, /python:compileall/);
  assert.match(smokeScript, /flutter:dart-analyze/);
  assert.match(smokeScript, /rust:cargo-check/);
  assert.match(smokeScript, /go:go-build/);
  assert.match(smokeScript, /csharp:dotnet-build/);
  assert.match(smokeScript, /java:javac/);
  assert.match(smokeScript, /swift:swift-build/);
  assert.match(smokeScript, /kotlin:kotlinc/);
});

test('root materialization entrypoints exist', () => {
  const requiredFiles = [
    'bin/materialize-sdk.mjs',
    'bin/materialize-sdk.ps1',
    'bin/materialize-sdk.sh',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('typescript workspace baseline files exist', () => {
  const requiredFiles = [
    'sdkwork-rtc-sdk-typescript/package.json',
    'sdkwork-rtc-sdk-typescript/README.md',
    'sdkwork-rtc-sdk-typescript/bin/package-task.mjs',
    'sdkwork-rtc-sdk-typescript/src/capability-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-selection.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-support.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts',
    'sdkwork-rtc-sdk-typescript/src/index.ts',
    'sdkwork-rtc-sdk-typescript/src/provider-catalog.ts',
    'sdkwork-rtc-sdk-typescript/test/provider-extension-catalog.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/capability-negotiation.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/provider-selection-standard.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/provider-support-standard.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/driver-manager.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/data-source.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/built-in-providers.test.mjs',
    'sdkwork-rtc-sdk-typescript/test/provider-package-loader.test.mjs',
  ];

  for (const relativePath of requiredFiles) {
    assert.equal(
      existsSync(path.join(workspaceRoot, relativePath)),
      true,
      `expected ${relativePath} to exist`,
    );
  }
});

test('official language workspace skeletons exist with readmes', () => {
  const assembly = readJson(assemblyPath);

  for (const language of assembly.officialLanguages) {
    const readmePath = path.join(workspaceRoot, `sdkwork-rtc-sdk-${language}`, 'README.md');
    assert.equal(existsSync(readmePath), true, `expected ${readmePath} to exist`);
  }
});

test('official language workspaces expose language workspace catalog assets', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    assert.equal(
      typeof languageEntry.workspaceCatalogRelativePath,
      'string',
      `expected workspaceCatalogRelativePath for ${languageEntry.language}`,
    );

    const catalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.workspaceCatalogRelativePath,
    );
    assert.equal(existsSync(catalogPath), true, `expected ${catalogPath} to exist`);

    const content = readFileSync(catalogPath, 'utf8');
    assert.match(content, /LanguageWorkspaceCatalog|RTC_LANGUAGE_WORKSPACE_CATALOG/);
    for (const token of [
      'language',
      'workspace',
      'displayName',
      'publicPackage',
      'maturityTier',
      'controlSdk',
      'runtimeBridge',
      'currentRole',
      'workspaceSummary',
      'roleHighlights',
    ]) {
      assert.equal(
        matchesReservedLanguageToken(languageEntry.language, content, token),
        true,
        `expected ${token} token in ${languageEntry.language} workspace catalog`,
      );
    }

    for (const expectedLanguage of assembly.languages) {
      assert.match(
        content,
        new RegExp(expectedLanguage.language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(expectedLanguage.workspaceSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
    }

    if (languageEntry.language === 'typescript') {
      assert.match(content, /getRtcLanguageWorkspaceByLanguage/);
      continue;
    }

    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).languageWorkspaceCatalog) {
      assert.match(content, pattern);
    }
  }
});

test('reserved language root public entrypoints expose the standard surface', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    const rootPublicContract = getReservedLanguageRootPublicContract(languageEntry);
    if (!rootPublicContract) {
      continue;
    }

    const rootPublicPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      rootPublicContract.relativePath,
    );
    assert.equal(existsSync(rootPublicPath), true, `expected ${rootPublicPath} to exist`);

    const content = readFileSync(rootPublicPath, 'utf8');
    for (const pattern of rootPublicContract.patterns) {
      assert.match(content, pattern);
    }
  }
});

test('go reserved workspace exports public struct fields for standard DTOs', () => {
  const assembly = readJson(assemblyPath);
  const goLanguage = assembly.languages.find((languageEntry) => languageEntry.language === 'go');
  assert.ok(goLanguage, 'expected go language workspace');

  for (const contract of getGoPublicStructFieldContracts(goLanguage)) {
    const contractPath = path.join(workspaceRoot, goLanguage.workspace, contract.relativePath);
    assert.equal(existsSync(contractPath), true, `expected ${contractPath} to exist`);

    const content = readFileSync(contractPath, 'utf8');
    for (const pattern of contract.patterns) {
      assert.match(content, pattern);
    }
  }
});

test('reserved language workspaces expose code-level standard contract scaffold files', () => {
  const assembly = readJson(assemblyPath);
  const requiredTokens = [
    'RtcProviderDriver',
    'RtcDriverManager',
    'RtcDataSource',
    'RtcClient',
    'RtcRuntimeController',
  ];

  for (const languageEntry of getReservedLanguageContractScaffolds(assembly)) {
    assert.equal(
      typeof languageEntry.contractScaffold?.relativePath,
      'string',
      `expected contractScaffold.relativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.contractScaffold?.symbol,
      'string',
      `expected contractScaffold.symbol for ${languageEntry.language}`,
    );

    const scaffoldPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.contractScaffold.relativePath,
    );
    assert.equal(existsSync(scaffoldPath), true, `expected ${scaffoldPath} to exist`);

    const content = readFileSync(scaffoldPath, 'utf8');
    assert.match(content, new RegExp(languageEntry.contractScaffold.symbol));
    for (const token of requiredTokens) {
      assert.match(
        content,
        new RegExp(token),
        `expected ${token} in ${languageEntry.language} contract scaffold`,
      );
    }
  }
});

test('reserved language workspaces expose package/build scaffold manifests', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguagePackageScaffolds(assembly)) {
    assert.equal(
      typeof languageEntry.packageScaffold?.buildSystem,
      'string',
      `expected packageScaffold.buildSystem for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.packageScaffold?.manifestRelativePath,
      'string',
      `expected packageScaffold.manifestRelativePath for ${languageEntry.language}`,
    );

    const manifestPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.packageScaffold.manifestRelativePath,
    );
    assert.equal(existsSync(manifestPath), true, `expected ${manifestPath} to exist`);

    const content = readFileSync(manifestPath, 'utf8');
    assert.match(content, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      content,
      new RegExp(languageEntry.packageScaffold.buildSystem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
});

test('reserved language workspaces expose provider package scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageProviderPackageScaffolds(assembly)) {
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.relativePath,
      'string',
      `expected providerPackageScaffold.relativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.directoryPattern,
      'string',
      `expected providerPackageScaffold.directoryPattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.packagePattern,
      'string',
      `expected providerPackageScaffold.packagePattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.manifestFileName,
      'string',
      `expected providerPackageScaffold.manifestFileName for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.readmeFileName,
      'string',
      `expected providerPackageScaffold.readmeFileName for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.sourceFilePattern,
      'string',
      `expected providerPackageScaffold.sourceFilePattern for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.sourceSymbolPattern,
      'string',
      `expected providerPackageScaffold.sourceSymbolPattern for ${languageEntry.language}`,
    );
    assert.equal(
      Array.isArray(languageEntry.providerPackageScaffold?.templateTokens),
      true,
      `expected providerPackageScaffold.templateTokens for ${languageEntry.language}`,
    );
    assert.equal(
      languageEntry.providerPackageScaffold.templateTokens.length > 0,
      true,
      `expected providerPackageScaffold.templateTokens to be non-empty for ${languageEntry.language}`,
    );
    assert.equal(
      Array.isArray(languageEntry.providerPackageScaffold?.sourceTemplateTokens),
      true,
      `expected providerPackageScaffold.sourceTemplateTokens for ${languageEntry.language}`,
    );
    assert.equal(
      languageEntry.providerPackageScaffold.sourceTemplateTokens.length > 0,
      true,
      `expected providerPackageScaffold.sourceTemplateTokens to be non-empty for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.runtimeBridgeStatus,
      'string',
      `expected providerPackageScaffold.runtimeBridgeStatus for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.rootPublic,
      'boolean',
      `expected providerPackageScaffold.rootPublic for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.providerPackageScaffold?.status,
      'string',
      `expected providerPackageScaffold.status for ${languageEntry.language}`,
    );

    const declaredTemplateTokens = normalizeStringArray(languageEntry.providerPackageScaffold.templateTokens);
    const usedTemplateTokens = normalizeStringArray([
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.directoryPattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.packagePattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.manifestFileName),
    ]);
    const declaredSourceTemplateTokens = normalizeStringArray(
      languageEntry.providerPackageScaffold.sourceTemplateTokens,
    );
    const usedSourceTemplateTokens = normalizeStringArray([
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceFilePattern),
      ...extractTemplateTokens(languageEntry.providerPackageScaffold.sourceSymbolPattern),
    ]);
    assert.deepEqual(
      declaredTemplateTokens,
      usedTemplateTokens,
      `expected exact providerPackageScaffold.templateTokens for ${languageEntry.language}`,
    );
    assert.deepEqual(
      declaredSourceTemplateTokens,
      usedSourceTemplateTokens,
      `expected exact providerPackageScaffold.sourceTemplateTokens for ${languageEntry.language}`,
    );
    for (const token of declaredTemplateTokens) {
      assert.ok(
        KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token),
        `expected known provider package template token for ${languageEntry.language}: ${token}`,
      );
    }
    for (const token of declaredSourceTemplateTokens) {
      assert.ok(
        KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS.includes(token),
        `expected known provider package source template token for ${languageEntry.language}: ${token}`,
      );
    }
    assert.equal(languageEntry.providerPackageScaffold.runtimeBridgeStatus, 'reserved');
    assert.equal(languageEntry.providerPackageScaffold.rootPublic, false);
    assert.equal(languageEntry.providerPackageScaffold.status, 'future-runtime-bridge-only');
    assert.equal(languageEntry.providerPackageScaffold.readmeFileName, 'README.md');

    const scaffoldPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.providerPackageScaffold.relativePath,
    );
    assert.equal(existsSync(scaffoldPath), true, `expected ${scaffoldPath} to exist`);

    const content = readFileSync(scaffoldPath, 'utf8');
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.directoryPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.packagePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.manifestFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.readmeFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.sourceFilePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(
      content,
      new RegExp(languageEntry.providerPackageScaffold.sourceSymbolPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    for (const templateToken of languageEntry.providerPackageScaffold.templateTokens) {
      assert.match(content, new RegExp(templateToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const templateToken of languageEntry.providerPackageScaffold.sourceTemplateTokens) {
      assert.match(content, new RegExp(templateToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(content, /future-runtime-bridge-only/);
    assert.match(content, /runtime bridge status:\s*`reserved`/i);
    assert.match(content, /root public exposure:\s*`false`/i);
    assert.match(content, /source stub/i);

    for (const provider of assembly.providers) {
      assert.match(content, new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(
        content,
        new RegExp(toPascalCase(provider.providerKey).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        content,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.directoryPattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        content,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );

      const providerManifestPath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageManifestPath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );
      const providerReadmePath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageReadmePath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );
      const providerSourcePath = path.join(
        workspaceRoot,
        languageEntry.workspace,
        buildProviderPackageSourcePath(
          languageEntry.providerPackageScaffold,
          provider.providerKey,
        ),
      );

      assert.equal(existsSync(providerManifestPath), true, `expected ${providerManifestPath} to exist`);
      assert.equal(existsSync(providerReadmePath), true, `expected ${providerReadmePath} to exist`);
      assert.equal(existsSync(providerSourcePath), true, `expected ${providerSourcePath} to exist`);

      const providerManifestContent = readFileSync(providerManifestPath, 'utf8');
      const providerReadmeContent = readFileSync(providerReadmePath, 'utf8');
      const providerSourceContent = readFileSync(providerSourcePath, 'utf8');

      assert.match(
        providerManifestContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerManifestContent,
        new RegExp(
          buildProviderPackageSourceRelativePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerManifestContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerManifestContent, /future-runtime-bridge-only/);
      assert.match(providerManifestContent, /reserved/);
      assert.match(providerManifestContent, /false/);

      assert.match(
        providerReadmeContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerReadmeContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerReadmeContent, /future-runtime-bridge-only/);
      assert.match(providerReadmeContent, /reserved/);
      assert.match(providerReadmeContent, /false/);
      assert.match(providerReadmeContent, /metadata-only/i);

      assert.match(
        providerSourceContent,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerSourceContent,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerSourceContent,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(providerSourceContent, /future-runtime-bridge-only/);
      assert.match(providerSourceContent, /reserved/);
      assert.match(providerSourceContent, /metadata-only/i);
    }
  }
});

test('reserved language workspaces expose metadata catalog, provider package catalog, provider activation catalog, provider extension catalog, and standalone provider selection helper scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageMetadataScaffolds(assembly)) {
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerPackageCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerPackageCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerActivationCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerActivationCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.capabilityCatalogRelativePath,
      'string',
      `expected metadataScaffold.capabilityCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerExtensionCatalogRelativePath,
      'string',
      `expected metadataScaffold.providerExtensionCatalogRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.metadataScaffold?.providerSelectionRelativePath,
      'string',
      `expected metadataScaffold.providerSelectionRelativePath for ${languageEntry.language}`,
    );

    const providerCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerCatalogRelativePath,
    );
    const capabilityCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.capabilityCatalogRelativePath,
    );
    const providerPackageCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
    );
    const providerActivationCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
    );
    const providerExtensionCatalogPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
    );
    const providerSelectionPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.metadataScaffold.providerSelectionRelativePath,
    );

    assert.equal(existsSync(providerCatalogPath), true, `expected ${providerCatalogPath} to exist`);
    assert.equal(
      existsSync(providerPackageCatalogPath),
      true,
      `expected ${providerPackageCatalogPath} to exist`,
    );
    assert.equal(
      existsSync(providerActivationCatalogPath),
      true,
      `expected ${providerActivationCatalogPath} to exist`,
    );
    assert.equal(existsSync(capabilityCatalogPath), true, `expected ${capabilityCatalogPath} to exist`);
    assert.equal(existsSync(providerExtensionCatalogPath), true, `expected ${providerExtensionCatalogPath} to exist`);
    assert.equal(existsSync(providerSelectionPath), true, `expected ${providerSelectionPath} to exist`);

    const providerCatalog = readFileSync(providerCatalogPath, 'utf8');
    assert.match(providerCatalog, /RtcProviderCatalog/);
    assert.match(providerCatalog, /DEFAULT_RTC_PROVIDER_KEY/);
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'providerKey', 'provider catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'pluginId', 'provider catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerCatalog, 'driverId', 'provider catalog driverId');
    assert.match(providerCatalog, /volcengine/);
    assert.match(providerCatalog, /aliyun/);
    assert.match(providerCatalog, /tencent/);
    assert.match(providerCatalog, /agora/);
    if (languageEntry.language !== 'typescript') {
      for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerCatalog) {
        assert.match(providerCatalog, pattern);
      }
    }

    const providerPackageCatalog = readFileSync(providerPackageCatalogPath, 'utf8');
    assert.match(providerPackageCatalog, /RtcProviderPackageCatalog/);
    assert.match(providerPackageCatalog, /RtcProviderPackageCatalogEntry/);
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'providerKey', 'provider package catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'pluginId', 'provider package catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'driverId', 'provider package catalog driverId');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'packageIdentity', 'provider package catalog packageIdentity');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'manifestPath', 'provider package catalog manifestPath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'readmePath', 'provider package catalog readmePath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'sourcePath', 'provider package catalog sourcePath');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'sourceSymbol', 'provider package catalog sourceSymbol');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'builtin', 'provider package catalog builtin');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'rootPublic', 'provider package catalog rootPublic');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'status', 'provider package catalog status');
    assertReservedLanguageToken(languageEntry.language, providerPackageCatalog, 'runtimeBridgeStatus', 'provider package catalog runtimeBridgeStatus');
    assert.match(providerPackageCatalog, /future-runtime-bridge-only/);
    assert.match(providerPackageCatalog, /reserved/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerPackageCatalog) {
      assert.match(providerPackageCatalog, pattern);
    }

    for (const provider of assembly.providers) {
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.providerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.pluginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(provider.driverId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          materializeProviderPackagePattern(
            languageEntry.providerPackageScaffold.packagePattern,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageManifestPath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageReadmePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageSourcePath(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        providerPackageCatalog,
        new RegExp(
          buildProviderPackageSourceSymbol(
            languageEntry.providerPackageScaffold,
            provider.providerKey,
          ).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
    }

    const providerActivationCatalog = readFileSync(providerActivationCatalogPath, 'utf8');
    assert.match(providerActivationCatalog, /RtcProviderActivationCatalog/);
    assert.match(providerActivationCatalog, /RtcProviderActivationCatalogEntry/);
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'providerKey', 'provider activation catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'pluginId', 'provider activation catalog pluginId');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'driverId', 'provider activation catalog driverId');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'activationStatus', 'provider activation catalog activationStatus');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'runtimeBridge', 'provider activation catalog runtimeBridge');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'rootPublic', 'provider activation catalog rootPublic');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'packageBoundary', 'provider activation catalog packageBoundary');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'builtin', 'provider activation catalog builtin');
    assertReservedLanguageToken(languageEntry.language, providerActivationCatalog, 'packageIdentity', 'provider activation catalog packageIdentity');
    assert.match(providerActivationCatalog, /root-public-builtin/);
    assert.match(providerActivationCatalog, /package-boundary/);
    assert.match(providerActivationCatalog, /control-metadata-only/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerActivationCatalog) {
      assert.match(providerActivationCatalog, pattern);
    }

    const expectedProviderActivationCatalogEntries = buildLanguageProviderActivationCatalogEntries(
      languageEntry,
      assembly.providers,
    );
    for (const entry of expectedProviderActivationCatalogEntries) {
      for (const value of [
        entry.providerKey,
        entry.pluginId,
        entry.driverId,
        entry.activationStatus,
        entry.packageIdentity,
      ]) {
        assert.match(
          providerActivationCatalog,
          new RegExp(String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        );
      }
    }

    const capabilityCatalog = readFileSync(capabilityCatalogPath, 'utf8');
    assert.match(capabilityCatalog, /RtcCapabilityCatalog/);
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'capabilityKey', 'capability catalog capabilityKey');
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'category', 'capability catalog category');
    assertReservedLanguageToken(languageEntry.language, capabilityCatalog, 'surface', 'capability catalog surface');
    assert.match(capabilityCatalog, /required-baseline/);
    assert.match(capabilityCatalog, /optional-advanced/);
    assert.match(capabilityCatalog, /control-plane/);
    assert.match(capabilityCatalog, /runtime-bridge/);
    assert.match(capabilityCatalog, /cross-surface/);
    assert.match(capabilityCatalog, /session/);
    assert.match(capabilityCatalog, /screen-share/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).capabilityCatalog) {
      assert.match(capabilityCatalog, pattern);
    }

    const providerExtensionCatalog = readFileSync(providerExtensionCatalogPath, 'utf8');
    assert.match(providerExtensionCatalog, /RtcProviderExtensionCatalog/);
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'extensionKey', 'provider extension catalog extensionKey');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'providerKey', 'provider extension catalog providerKey');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'displayName', 'provider extension catalog displayName');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'surface', 'provider extension catalog surface');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'access', 'provider extension catalog access');
    assertReservedLanguageToken(languageEntry.language, providerExtensionCatalog, 'status', 'provider extension catalog status');
    assert.match(providerExtensionCatalog, /volcengine\.native-client/);
    assert.match(providerExtensionCatalog, /agora\.native-client/);
    assert.match(providerExtensionCatalog, /unwrap-only/);
    assert.match(providerExtensionCatalog, /reference-baseline/);
    assert.match(providerExtensionCatalog, /reserved/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerExtensionCatalog) {
      assert.match(providerExtensionCatalog, pattern);
    }

    const providerSelection = readFileSync(providerSelectionPath, 'utf8');
    assert.match(providerSelection, /RtcProviderSelection/);
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'providerKey', 'provider selection providerKey');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'source', 'provider selection source');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'providerUrl', 'provider selection providerUrl');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'tenantOverrideProviderKey', 'provider selection tenantOverrideProviderKey');
    assertReservedLanguageToken(languageEntry.language, providerSelection, 'deploymentProfileProviderKey', 'provider selection deploymentProfileProviderKey');
    assert.match(providerSelection, /default_provider/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSelection) {
      assert.match(providerSelection, pattern);
    }
  }
});

test('reserved language workspaces expose metadata-only driver manager, data source, and standalone provider support helper scaffold files', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of getReservedLanguageResolutionScaffolds(assembly)) {
    assert.equal(
      typeof languageEntry.resolutionScaffold?.driverManagerRelativePath,
      'string',
      `expected resolutionScaffold.driverManagerRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.resolutionScaffold?.dataSourceRelativePath,
      'string',
      `expected resolutionScaffold.dataSourceRelativePath for ${languageEntry.language}`,
    );
    assert.equal(
      typeof languageEntry.resolutionScaffold?.providerSupportRelativePath,
      'string',
      `expected resolutionScaffold.providerSupportRelativePath for ${languageEntry.language}`,
    );

    const driverManagerPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.driverManagerRelativePath,
    );
    const dataSourcePath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.dataSourceRelativePath,
    );
    const providerSupportPath = path.join(
      workspaceRoot,
      languageEntry.workspace,
      languageEntry.resolutionScaffold.providerSupportRelativePath,
    );

    assert.equal(existsSync(driverManagerPath), true, `expected ${driverManagerPath} to exist`);
    assert.equal(existsSync(dataSourcePath), true, `expected ${dataSourcePath} to exist`);
    assert.equal(existsSync(providerSupportPath), true, `expected ${providerSupportPath} to exist`);

    const driverManager = readFileSync(driverManagerPath, 'utf8');
    assert.match(driverManager, /RtcDriverManager/);
    assert.match(driverManager, /resolveSelection/i);
    assert.match(driverManager, /describeProviderSupport/i);
    assert.match(driverManager, /listProviderSupport/i);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).driverManagerDelegates) {
      assert.match(driverManager, pattern);
    }

    const dataSource = readFileSync(dataSourcePath, 'utf8');
    assert.match(dataSource, /RtcDataSource/);
    assert.match(dataSource, /RtcDataSourceOptions/);
    assert.match(dataSource, /describeSelection/i);
    assert.match(dataSource, /describeProviderSupport/i);
    assert.match(dataSource, /listProviderSupport/i);
    assertReservedLanguageToken(languageEntry.language, dataSource, 'defaultProviderKey', 'data source defaultProviderKey');

    const providerSupport = readFileSync(providerSupportPath, 'utf8');
    assert.match(providerSupport, /RtcProviderSupport/);
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'providerKey', 'provider support providerKey');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'status', 'provider support status');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'builtin', 'provider support builtin');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'official', 'provider support official');
    assertReservedLanguageToken(languageEntry.language, providerSupport, 'registered', 'provider support registered');
    assert.match(providerSupport, /official_unregistered/);
    assert.match(providerSupport, /unknown/);
    for (const pattern of getReservedLanguageLookupHelperPatterns(languageEntry.language).providerSupport) {
      assert.match(providerSupport, pattern);
    }
  }
});

test('language workspace readmes align with the assembly language matrix', () => {
  const assembly = readJson(assemblyPath);

  for (const languageEntry of assembly.languages) {
    const readmePath = path.join(workspaceRoot, languageEntry.workspace, 'README.md');
    const readme = readFileSync(readmePath, 'utf8');

    const escapedDisplayName = languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(readme, new RegExp(`Language:\\s*\\\`${languageEntry.language}\\\``));
    assert.match(readme, new RegExp(`#\\s+SDKWork RTC SDK ${escapedDisplayName} Workspace`));
    assert.match(readme, /Planned public package:/);
    assert.match(readme, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      readme,
      new RegExp(`control SDK support:\\s*${languageEntry.controlSdk ? 'yes' : 'no'}`),
    );
    assert.match(
      readme,
      new RegExp(`runtime bridge support:\\s*${languageEntry.runtimeBridge ? 'yes' : 'reserved'}`),
    );
    assert.match(
      readme,
      new RegExp(`maturity tier:\\s*${languageEntry.maturityTier}`),
    );
    assert.match(readme, new RegExp(`Current role:\\s*[\\s\\S]*${languageEntry.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(readme, new RegExp(languageEntry.workspaceSummary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    for (const roleHighlight of languageEntry.roleHighlights) {
      assert.match(readme, new RegExp(roleHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(readme, /\.\.\/docs\/provider-adapter-standard\.md/);
    assert.match(readme, /\.\.\/docs\/multilanguage-capability-matrix\.md/);
    assert.match(
      readme,
      new RegExp(
        languageEntry.workspaceCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      ),
    );

    if (languageEntry.language !== 'typescript') {
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.driverManagerRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.dataSourceRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.resolutionScaffold.providerSupportRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerPackageCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerActivationCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
      assert.match(
        readme,
        new RegExp(
          languageEntry.metadataScaffold.providerExtensionCatalogRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        ),
      );
    }
  }
});

test('multilanguage capability matrix aligns with the assembly language and provider tier snapshot', () => {
  const assembly = readJson(assemblyPath);
  const matrixPath = path.join(workspaceRoot, 'docs', 'multilanguage-capability-matrix.md');
  const docsReadmePath = path.join(workspaceRoot, 'docs', 'README.md');
  const matrix = readFileSync(matrixPath, 'utf8');
  const docsReadme = readFileSync(docsReadmePath, 'utf8');

  assert.match(
    matrix,
    /\| Provider key \| Tier \| Builtin \| Default selected \| Display name \|/,
  );
  assert.match(
    matrix,
    /\| Provider key \| Runtime bridge status \| Vendor SDK requirement \| SDK provisioning \| Binding strategy \| Bundle policy \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Provider key \| Activation status \| Runtime bridge \| Root public \| Package boundary \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Provider catalog \| Provider package catalog \| Provider activation catalog \| Capability catalog \| Provider extension catalog \| Provider selection \|/,
  );
  assert.match(
    matrix,
    /\| Language \| Workspace catalog \| Public package \| Control SDK \| Runtime bridge \| Maturity tier \|/,
  );

  for (const provider of assembly.providers) {
    assert.match(matrix, new RegExp(`\\\`${provider.providerKey}\\\``));
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${provider.tier}\\\`\\s*\\|[^\\n]*\\|\\s*${provider.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`,
      ),
    );
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.runtimeBridgeStatus}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.officialVendorSdkRequirement}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.sdkProvisioning}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.bindingStrategy}\\\`\\s*\\|\\s*\\\`${provider.typescriptAdapter.bundlePolicy}\\\`\\s*\\|`,
      ),
    );
  }

  for (const languageEntry of assembly.languages) {
    assert.match(
      matrix,
      new RegExp(`\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`),
    );
    assert.match(matrix, new RegExp(languageEntry.publicPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(
      matrix,
      new RegExp(
        `\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|[^\\n]*\\|\\s*\\\`${languageEntry.maturityTier}\\\`\\s*\\|\\s*${languageEntry.currentRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|`,
      ),
    );

    for (const providerActivation of languageEntry.providerActivations) {
      const provider = assembly.providers.find((entry) => entry.providerKey === providerActivation.providerKey);
      assert.ok(provider);
      const expectedRuntimeBridge = providerActivation.activationStatus === 'control-metadata-only' ? 'No' : 'Yes';
      const expectedRootPublic = providerActivation.activationStatus === 'root-public-builtin' ? 'Yes' : 'No';
      const expectedPackageBoundary =
        providerActivation.activationStatus === 'control-metadata-only' ? 'No' : 'Yes';

      assert.match(
        matrix,
        new RegExp(
          `\\|\\s*${languageEntry.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|\\s*\\\`${provider.providerKey}\\\`\\s*\\|\\s*\\\`${providerActivation.activationStatus}\\\`\\s*\\|\\s*${expectedRuntimeBridge}\\s*\\|\\s*${expectedRootPublic}\\s*\\|\\s*${expectedPackageBoundary}\\s*\\|`,
        ),
      );
    }
  }

  assert.match(docsReadme, /multilanguage-capability-matrix\.md/);
  assert.match(docsReadme, /materialized from `\.sdkwork-assembly\.json`/);
  assert.match(docsReadme, /language workspace catalog/i);
  assert.match(docsReadme, /provider activation catalog/i);
});

test('typescript provider package skeletons exist for every official provider', () => {
  const assembly = readJson(assemblyPath);
  const providerRoot = path.join(workspaceRoot, 'sdkwork-rtc-sdk-typescript', 'providers');

  assert.equal(existsSync(path.join(providerRoot, 'README.md')), true);

  for (const provider of assembly.providers) {
    const packageDir = path.join(providerRoot, `rtc-sdk-provider-${provider.providerKey}`);
    const manifestPath = path.join(packageDir, 'package.json');
    const readmePath = path.join(packageDir, 'README.md');
    const entrypointPath = path.join(packageDir, 'index.js');
    const declarationPath = path.join(packageDir, 'index.d.ts');

    assert.equal(existsSync(manifestPath), true, `expected ${manifestPath} to exist`);
    assert.equal(existsSync(readmePath), true, `expected ${readmePath} to exist`);
    assert.equal(existsSync(entrypointPath), true, `expected ${entrypointPath} to exist`);
    assert.equal(existsSync(declarationPath), true, `expected ${declarationPath} to exist`);

    const manifest = readJson(manifestPath);
    assert.equal(manifest.name, provider.typescriptPackage.packageName);
    assert.equal(manifest.main, './index.js');
    assert.equal(manifest.types, './index.d.ts');
    assert.equal(manifest.exports?.['.']?.import, './index.js');
    assert.equal(manifest.exports?.['.']?.default, './index.js');
    assert.equal(manifest.exports?.['.']?.types, './index.d.ts');
    assert.equal(manifest.sdkworkRtcProvider?.providerKey, provider.providerKey);
    assert.equal(manifest.sdkworkRtcProvider?.builtin, provider.builtin);
    assert.equal(manifest.sdkworkRtcProvider?.tier, provider.tier);
    assert.equal(manifest.sdkworkRtcProvider?.registrationContract, 'RtcProviderModule');
    assert.equal(manifest.sdkworkRtcProvider?.sourceModule, provider.typescriptPackage.sourceModule);
    assert.equal(manifest.sdkworkRtcProvider?.driverFactory, provider.typescriptPackage.driverFactory);
    assert.equal(
      manifest.sdkworkRtcProvider?.metadataSymbol,
      provider.typescriptPackage.metadataSymbol,
    );
    assert.equal(manifest.sdkworkRtcProvider?.moduleSymbol, provider.typescriptPackage.moduleSymbol);
    assert.equal(manifest.sdkworkRtcProvider?.rootPublic, provider.typescriptPackage.rootPublic);
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.sdkProvisioning,
      provider.typescriptAdapter.sdkProvisioning,
    );
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.bindingStrategy,
      provider.typescriptAdapter.bindingStrategy,
    );
    assert.equal(
      manifest.sdkworkRtcProvider?.typescriptAdapter?.bundlePolicy,
      provider.typescriptAdapter.bundlePolicy,
    );
    assert.equal(
      existsSync(
        path.resolve(packageDir, manifest.sdkworkRtcProvider.sourceModule),
      ),
      true,
      `expected source module for ${provider.providerKey} to exist`,
    );
  }
});

test('root verifier rejects builtin provider drift in assembly metadata', async () => {
  const fixture = createVerifierFixture((assembly) => {
    assembly.providers = assembly.providers.filter((provider) => provider.providerKey !== 'aliyun');
    for (const languageEntry of assembly.languages) {
      languageEntry.providerActivations = languageEntry.providerActivations.filter(
        (entry) => entry.providerKey !== 'aliyun',
      );
    }
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /builtin providers/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects non-canonical TypeScript provider package naming patterns in assembly metadata', async () => {
  const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
  const cases = [
    {
      label: 'packageName',
      mutate(provider) {
        provider.typescriptPackage.packageName = '@sdkwork/rtc-provider-volcengine';
      },
      expected: /packageName must be @sdkwork\/rtc-sdk-provider-volcengine/i,
    },
    {
      label: 'sourceModule',
      mutate(provider) {
        provider.typescriptPackage.sourceModule = '../../src/provider/volcengine.ts';
      },
      expected: /sourceModule must be \.\.\/\.\.\/src\/providers\/volcengine\.ts/i,
    },
    {
      label: 'driverFactory',
      mutate(provider) {
        provider.typescriptPackage.driverFactory = 'createRtcDriverVolcengine';
      },
      expected: /driverFactory must be createVolcengineRtcDriver/i,
    },
    {
      label: 'metadataSymbol',
      mutate(provider) {
        provider.typescriptPackage.metadataSymbol = 'RTC_PROVIDER_METADATA_VOLCENGINE';
      },
      expected: /metadataSymbol must be VOLCENGINE_RTC_PROVIDER_METADATA/i,
    },
    {
      label: 'moduleSymbol',
      mutate(provider) {
        provider.typescriptPackage.moduleSymbol = 'RTC_PROVIDER_MODULE_VOLCENGINE';
      },
      expected: /moduleSymbol must be VOLCENGINE_RTC_PROVIDER_MODULE/i,
    },
  ];

  for (const contractCase of cases) {
    const fixture = createVerifierFixture((assembly) => {
      const provider = assembly.providers.find((entry) => entry.providerKey === 'volcengine');
      assert.ok(provider, 'expected volcengine provider in assembly fixture');
      contractCase.mutate(provider);
    });

    try {
      assert.throws(
        () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
        contractCase.expected,
        `expected verifier to reject non-canonical ${contractCase.label} contract`,
      );
    } finally {
      rmSync(fixture.fixtureRoot, { recursive: true, force: true });
    }
  }
});

test('root verifier rejects missing documentation clauses for provider package entrypoints and default constants', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const packageStandardsPath = path.join(fixture.workspaceCopy, 'docs', 'package-standards.md');
    const rootReadmePath = path.join(fixture.workspaceCopy, 'README.md');

    writeFileSync(
      packageStandardsPath,
      readFileSync(packageStandardsPath, 'utf8')
        .replace(/- provider package boundaries live under `providers\/rtc-sdk-provider-<providerKey>\/`\r?\n/, '')
        .replace(/- every provider package manifest must bind to one real source module and declare its driver\r?\n  factory, metadata symbol, module symbol, and root-public exposure policy\r?\n/, '')
        .replace(/- every provider package manifest must declare the TypeScript vendor SDK contract:.*\r?\n/, ''),
    );
    writeFileSync(
      rootReadmePath,
      readFileSync(rootReadmePath, 'utf8').replace(/DEFAULT_RTC_PROVIDER_KEY/g, 'DEFAULT_PROVIDER_KEY'),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|README\.md|package-standards/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing documentation clauses for the assembly-driven language workspace contract', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const packageStandardsPath = path.join(fixture.workspaceCopy, 'docs', 'package-standards.md');
    const verificationMatrixPath = path.join(fixture.workspaceCopy, 'docs', 'verification-matrix.md');

    writeFileSync(
      packageStandardsPath,
      readFileSync(packageStandardsPath, 'utf8')
        .replace(/- the assembly-driven `displayName`\r?\n/, '')
        .replace(/- the current role summary as `currentRole`\r?\n/, '')
        .replace(/- the workspace summary text as `workspaceSummary`\r?\n/, '')
        .replace(/- the role highlight list as `roleHighlights`, materialized into the workspace README\r?\n/, ''),
    );
    writeFileSync(
      verificationMatrixPath,
      readFileSync(verificationMatrixPath, 'utf8').replace(
        /- every language declares the assembly-driven language workspace contract fields:[\s\S]*?roleHighlights`\r?\n/,
        '',
      ),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|language workspace contract|displayName|roleHighlights/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing internal docs clauses for standard modules and provider lookup helpers', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const docsReadmePath = path.join(fixture.workspaceCopy, 'docs', 'README.md');

    writeFileSync(
      docsReadmePath,
      readFileSync(docsReadmePath, 'utf8')
        .replace(
          /- provider support: `sdkwork-rtc-sdk-typescript\/src\/provider-support\.ts`\r?\n  Keeps provider support classification and support-state construction explicit\.\r?\n/,
          '',
        )
        .replace(/getBuiltinRtcProviderMetadataByKey/g, 'getBuiltinRtcProviderMetadata')
        .replace(/getOfficialRtcProviderMetadataByKey/g, 'getOfficialRtcProviderMetadata'),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /documentation clause|docs\/README\.md|provider support|getOfficialRtcProviderMetadataByKey/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing typescript provider package boundaries', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        'sdkwork-rtc-sdk-typescript',
        'providers',
        'rtc-sdk-provider-agora',
      ),
      { recursive: true, force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects legacy TypeScript provider package boundary wording in materialized assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const typescriptReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'README.md',
    );
    writeFileSync(
      typescriptReadmePath,
      readFileSync(typescriptReadmePath, 'utf8').replace(
        /- TypeScript runtime bridge baseline: reference-baseline/,
        '- reserved TypeScript provider package boundaries\n- TypeScript runtime bridge baseline: reference-baseline',
      ),
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /legacy TypeScript provider package boundary wording|reserved TypeScript provider package boundaries/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects stale legacy provider catalog assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const legacyCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'providers',
      'catalog.ts',
    );
    mkdirSync(path.dirname(legacyCatalogPath), { recursive: true });
    writeFileSync(legacyCatalogPath, 'export const LEGACY_PROVIDER_CATALOG = true;\n');

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /legacy provider catalog|stale/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects drift in materialized language workspace assets', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const javaReadmePath = path.join(fixture.workspaceCopy, 'sdkwork-rtc-sdk-java', 'README.md');
    const javaProviderPackageScaffoldPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'provider-package-scaffold.md',
    );
    const javaAgoraProviderManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'pom.xml',
    );
    const javaAgoraProviderReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'README.md',
    );
    const javaAgoraProviderSourcePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'src',
      'main',
      'java',
      'com',
      'sdkwork',
      'rtc',
      'provider',
      'agora',
      'RtcProviderAgoraPackageContract.java',
    );
    const originalReadme = readFileSync(javaReadmePath, 'utf8');
    const driftedReadme = originalReadme.replace(
      'future enterprise runtime integration.',
      'future enterprise runtime orchestration.',
    );

    assert.notEqual(driftedReadme, originalReadme);
    writeFileSync(javaReadmePath, driftedReadme);

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /materialized asset|drift/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing assembly-driven language workspace contract fields', async () => {
  const fixture = createVerifierFixture((assembly) => {
    delete assembly.languages.find((entry) => entry.language === 'java').displayName;
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /language workspace contract|displayName|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing language provider activation matrix entries', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const typescriptLanguage = assembly.languages.find((entry) => entry.language === 'typescript');
    typescriptLanguage.providerActivations = typescriptLanguage.providerActivations.filter(
      (entry) => entry.providerKey !== 'agora',
    );
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider activation|typescript|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language contract scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        javaLanguage.contractScaffold.relativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /language contract scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language package scaffold manifests', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const pythonLanguage = assembly.languages.find((entry) => entry.language === 'python');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        pythonLanguage.workspace,
        pythonLanguage.packageScaffold.manifestRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /package scaffold|python/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const goLanguage = assembly.languages.find((entry) => entry.language === 'go');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        goLanguage.workspace,
        goLanguage.providerPackageScaffold.relativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects invalid reserved language provider package template token contracts', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');
    javaLanguage.providerPackageScaffold.templateTokens = ['{providerPascal}'];
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /templateTokens|provider package scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects invalid reserved language provider package source template token contracts', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const pythonLanguage = assembly.languages.find((entry) => entry.language === 'python');
    pythonLanguage.providerPackageScaffold.sourceTemplateTokens = ['{providerKey}'];
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /sourceTemplateTokens|provider package scaffold|python/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects reserved language provider package rootPublic drift', async () => {
  const fixture = createVerifierFixture((assembly) => {
    const goLanguage = assembly.languages.find((entry) => entry.language === 'go');
    goLanguage.providerPackageScaffold.rootPublic = true;
  });

  try {
    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /rootPublic|provider package scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package manifest boundaries', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        buildProviderPackageManifestPath(javaLanguage.providerPackageScaffold, 'agora'),
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package manifest|java|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language provider package source boundaries', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const swiftLanguage = assembly.languages.find((entry) => entry.language === 'swift');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        swiftLanguage.workspace,
        buildProviderPackageSourcePath(swiftLanguage.providerPackageScaffold, 'agora'),
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /provider package source scaffold|swift|agora/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language metadata scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const goLanguage = assembly.languages.find((entry) => entry.language === 'go');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        goLanguage.workspace,
        goLanguage.metadataScaffold.providerActivationCatalogRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /metadata scaffold|go/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root verifier rejects missing reserved language resolution scaffold files', async () => {
  const fixture = createVerifierFixture(() => {});
  const assembly = readJson(path.join(fixture.workspaceCopy, '.sdkwork-assembly.json'));
  const javaLanguage = assembly.languages.find((entry) => entry.language === 'java');

  try {
    rmSync(
      path.join(
        fixture.workspaceCopy,
        javaLanguage.workspace,
        javaLanguage.resolutionScaffold.driverManagerRelativePath,
      ),
      { force: true },
    );

    const verifierModule = await import(pathToFileURL(path.join(workspaceRoot, 'bin', 'verify-sdk.mjs')).href);
    assert.throws(
      () => verifierModule.verifyRtcSdkWorkspace(fixture.workspaceCopy),
      /resolution scaffold|java/i,
    );
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});

test('root materializer repairs provider package, provider catalog, and language readme drift idempotently', async () => {
  const fixture = createVerifierFixture(() => {});

  try {
    const docsReadmePath = path.join(fixture.workspaceCopy, 'docs', 'README.md');
    const matrixPath = path.join(
      fixture.workspaceCopy,
      'docs',
      'multilanguage-capability-matrix.md',
    );
    const javaReadmePath = path.join(fixture.workspaceCopy, 'sdkwork-rtc-sdk-java', 'README.md');
    const javaProviderPackageScaffoldPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'provider-package-scaffold.md',
    );
    const javaAgoraProviderManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'pom.xml',
    );
    const javaAgoraProviderReadmePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'README.md',
    );
    const javaAgoraProviderSourcePath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-java',
      'providers',
      'rtc-sdk-provider-agora',
      'src',
      'main',
      'java',
      'com',
      'sdkwork',
      'rtc',
      'provider',
      'agora',
      'RtcProviderAgoraPackageContract.java',
    );
    const agoraManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-agora',
      'package.json',
    );
    const agoraEntrypointPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'providers',
      'rtc-sdk-provider-agora',
      'index.js',
    );
    const catalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'capability-catalog.ts',
    );
    const providerCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'provider-catalog.ts',
    );
    const providerActivationCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'provider-activation-catalog.ts',
    );
    const flutterManifestPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-flutter',
      'pubspec.yaml',
    );
    const pythonProviderCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_catalog.py',
    );
    const pythonProviderPackageCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_package_catalog.py',
    );
    const pythonProviderActivationCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-python',
      'sdkwork_rtc_sdk',
      'provider_activation_catalog.py',
    );
    const rustDriverManagerPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-rust',
      'src',
      'driver_manager.rs',
    );
    const legacyCatalogPath = path.join(
      fixture.workspaceCopy,
      'sdkwork-rtc-sdk-typescript',
      'src',
      'providers',
      'catalog.ts',
    );

    writeFileSync(docsReadmePath, '# drifted docs readme\n');
    writeFileSync(matrixPath, '# drifted matrix\n');
    writeFileSync(javaReadmePath, '# drifted\n');
    writeFileSync(javaProviderPackageScaffoldPath, '# drifted provider package scaffold\n');
    writeFileSync(javaAgoraProviderManifestPath, '<project></project>\n');
    writeFileSync(javaAgoraProviderReadmePath, '# drifted provider package readme\n');
    writeFileSync(javaAgoraProviderSourcePath, 'public final class BrokenJavaProviderSource {}\n');
    writeFileSync(
      agoraManifestPath,
      `${JSON.stringify(
        {
          name: '@sdkwork/rtc-sdk-provider-agora',
          sdkworkRtcProvider: {
            providerKey: 'agora',
            builtin: false,
            tier: 'tier-b',
            registrationContract: 'BrokenContract',
          },
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(agoraEntrypointPath, 'export const BROKEN_ENTRYPOINT = true;\n');
    writeFileSync(catalogPath, 'export const RTC_CAPABILITY_CATALOG = [];\n');
    writeFileSync(providerCatalogPath, 'export const OFFICIAL_RTC_PROVIDER_CATALOG = [];\n');
    writeFileSync(providerActivationCatalogPath, 'export const RTC_PROVIDER_ACTIVATION_CATALOG = [];\n');
    writeFileSync(flutterManifestPath, 'name: broken_flutter_sdk\n');
    writeFileSync(pythonProviderCatalogPath, 'BROKEN_PROVIDER_CATALOG = []\n');
    writeFileSync(pythonProviderPackageCatalogPath, 'BROKEN_PROVIDER_PACKAGE_CATALOG = []\n');
    writeFileSync(pythonProviderActivationCatalogPath, 'BROKEN_PROVIDER_ACTIVATION_CATALOG = []\n');
    writeFileSync(rustDriverManagerPath, 'pub struct BrokenDriverManager;\n');
    mkdirSync(path.dirname(legacyCatalogPath), { recursive: true });
    writeFileSync(legacyCatalogPath, 'export const LEGACY_PROVIDER_CATALOG = true;\n');

    const materializerModule = await import(
      pathToFileURL(path.join(workspaceRoot, 'bin', 'materialize-sdk.mjs')).href
    );

    const firstRun = materializerModule.materializeRtcSdkWorkspace(fixture.workspaceCopy);
    assert.ok(firstRun.changedFiles.length >= 7);
    assert.ok(firstRun.changedFiles.includes('docs/README.md'));
    assert.ok(firstRun.changedFiles.includes('docs/multilanguage-capability-matrix.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/provider-package-scaffold.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/pom.xml'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/README.md'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-java/providers/rtc-sdk-provider-agora/src/main/java/com/sdkwork/rtc/provider/agora/RtcProviderAgoraPackageContract.java'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/capability-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/provider-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-typescript/src/providers/catalog.ts'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-flutter/pubspec.yaml'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_package_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/provider_activation_catalog.py'));
    assert.ok(firstRun.changedFiles.includes('sdkwork-rtc-sdk-rust/src/driver_manager.rs'));

    const repairedDocsReadme = readFileSync(docsReadmePath, 'utf8');
    assert.match(repairedDocsReadme, /multilanguage-capability-matrix\.md/);
    assert.match(repairedDocsReadme, /materialized from `\.sdkwork-assembly\.json`/);
    assert.match(repairedDocsReadme, /metadata-only source stub/i);

    const repairedMatrix = readFileSync(matrixPath, 'utf8');
    assert.match(repairedMatrix, /\| Capability key \| Category \| Surface \|/);
    assert.match(repairedMatrix, /\| `session` \| `required-baseline` \| `cross-surface` \|/);
    assert.match(repairedMatrix, /\| `recording` \| `optional-advanced` \| `control-plane` \|/);
    assert.match(repairedMatrix, /\| Language \| Public package \| Control SDK \| Runtime bridge \| Maturity tier \| Current role \|/);
    assert.match(repairedMatrix, /\| `volcengine` \| `tier-a` \|/);
    assert.match(repairedMatrix, /\| Provider key \| Runtime bridge status \| Vendor SDK requirement \| SDK provisioning \| Binding strategy \| Bundle policy \|/);
    assert.match(repairedMatrix, /\| `volcengine` \| `reference-baseline` \| `required` \| `consumer-supplied` \| `native-factory` \| `must-not-bundle` \|/);
    assert.match(repairedMatrix, /\| TypeScript \| `@sdkwork\/rtc-sdk` \| Yes \| Yes \| `reference` \|/);
    assert.match(repairedMatrix, /\| Language \| Provider key \| Activation status \| Runtime bridge \| Root public \| Package boundary \|/);
    assert.match(repairedMatrix, /\| TypeScript \| `volcengine` \| `root-public-builtin` \| Yes \| Yes \| Yes \|/);
    assert.match(repairedMatrix, /\| Java \| `agora` \| `control-metadata-only` \| No \| No \| No \|/);
    assert.match(repairedMatrix, /Reserved Language Metadata Scaffold Matrix/);
    assert.match(repairedMatrix, /Provider activation catalog/);
    assert.match(repairedMatrix, /Provider extension catalog/);
    assert.match(repairedMatrix, /RtcProviderActivationCatalog\.java/);
    assert.match(repairedMatrix, /RtcProviderExtensionCatalog\.java/);
    assert.match(repairedMatrix, /Reserved Language Resolution Scaffold Matrix/);
    assert.match(repairedMatrix, /Reserved Language Provider Package Scaffold Matrix/);
    assert.match(repairedMatrix, /Directory pattern/);
    assert.match(repairedMatrix, /Package pattern/);
    assert.match(repairedMatrix, /Source file pattern/);
    assert.match(repairedMatrix, /Source symbol pattern/);
    assert.match(repairedMatrix, /Template tokens/);
    assert.match(repairedMatrix, /Source template tokens/);
    assert.match(repairedMatrix, /Runtime bridge status/);
    assert.match(repairedMatrix, /Default provider package identity/);
    assert.match(repairedMatrix, /Default provider source path/);
    assert.match(repairedMatrix, /Default provider source symbol/);
    assert.match(repairedMatrix, /future-runtime-bridge-only/);
    assert.match(repairedMatrix, /`false`/);
    assert.match(repairedMatrix, /Driver manager/);
    assert.match(repairedMatrix, /Data source/);
    assert.match(repairedMatrix, /Provider support/);

    const repairedJavaReadme = readFileSync(javaReadmePath, 'utf8');
    assert.match(repairedJavaReadme, /# SDKWork RTC SDK Java Workspace/);
    assert.match(repairedJavaReadme, /Language:\s*`java`/);
    assert.match(repairedJavaReadme, /com\.sdkwork:rtc-sdk/);
    assert.match(repairedJavaReadme, /maturity tier:\s*reserved/);
    assert.match(repairedJavaReadme, /Current role:[\s\S]*Reserved workspace skeleton/);
    assert.match(repairedJavaReadme, /reserved Java standard boundary/);
    assert.match(repairedJavaReadme, /RtcProviderExtensionCatalog\.java/);
    assert.match(repairedJavaReadme, /Resolution scaffold:/);
    assert.match(repairedJavaReadme, /Provider package scaffold:/);
    assert.match(repairedJavaReadme, /providers\/provider-package-scaffold\.md/);
    assert.match(repairedJavaReadme, /com\.sdkwork:rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaReadme, /source file pattern:\s*`src\/main\/java\/com\/sdkwork\/rtc\/provider\/\{providerKey\}\/RtcProvider\{providerPascal\}PackageContract\.java`/i);
    assert.match(repairedJavaReadme, /source symbol pattern:\s*`RtcProvider\{providerPascal\}PackageContract`/i);
    assert.match(repairedJavaReadme, /template tokens:\s*`\{providerKey\}`/i);
    assert.match(repairedJavaReadme, /source template tokens:\s*`\{providerKey\}`,\s*`\{providerPascal\}`/i);
    assert.match(repairedJavaReadme, /status:\s*`future-runtime-bridge-only`/i);
    assert.match(repairedJavaReadme, /runtime bridge status:\s*`reserved`/i);
    assert.match(repairedJavaReadme, /root public exposure:\s*`false`/i);
    assert.match(repairedJavaReadme, /RtcDriverManager\.java/);
    assert.match(repairedJavaReadme, /RtcDataSource\.java/);
    assert.match(repairedJavaReadme, /RtcProviderSupport\.java/);
    assert.match(repairedJavaReadme, /\.\.\/docs\/provider-adapter-standard\.md/);

    const repairedAgoraManifest = readJson(agoraManifestPath);
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.registrationContract, 'RtcProviderModule');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.sourceModule, '../../src/providers/agora.ts');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.driverFactory, 'createAgoraRtcDriver');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.moduleSymbol, 'AGORA_RTC_PROVIDER_MODULE');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.rootPublic, false);
    assert.equal(repairedAgoraManifest.exports['.'].import, './index.js');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.typescriptAdapter.runtimeBridgeStatus, 'reference-baseline');
    assert.equal(repairedAgoraManifest.sdkworkRtcProvider.typescriptAdapter.officialVendorSdkRequirement, 'required');

    const repairedAgoraEntrypoint = readFileSync(agoraEntrypointPath, 'utf8');
    assert.match(repairedAgoraEntrypoint, /createAgoraRtcDriver/);
    assert.match(repairedAgoraEntrypoint, /AGORA_RTC_PROVIDER_MODULE/);

    const repairedCapabilityCatalog = readFileSync(catalogPath, 'utf8');
    assert.match(repairedCapabilityCatalog, /RTC_CAPABILITY_CATALOG/);
    assert.match(repairedCapabilityCatalog, /SESSION_RTC_CAPABILITY_DESCRIPTOR/);
    assert.match(repairedCapabilityCatalog, /surface:\s*'cross-surface'/);
    assert.match(repairedCapabilityCatalog, /getRtcCapabilityDescriptor/);

    const repairedProviderCatalog = readFileSync(providerCatalogPath, 'utf8');
    assert.match(repairedProviderCatalog, /OFFICIAL_RTC_PROVIDER_CATALOG/);
    assert.match(repairedProviderCatalog, /VOLCENGINE_RTC_PROVIDER_CATALOG_ENTRY/);
    assert.match(repairedProviderCatalog, /defaultSelected:\s*true/);
    assert.match(repairedProviderCatalog, /requiredCapabilities/);
    assert.match(repairedProviderCatalog, /optionalCapabilities/);

    const repairedProviderActivationCatalog = readFileSync(providerActivationCatalogPath, 'utf8');
    assert.match(repairedProviderActivationCatalog, /RTC_PROVIDER_ACTIVATION_CATALOG/);
    assert.match(repairedProviderActivationCatalog, /VOLCENGINE_RTC_PROVIDER_ACTIVATION_ENTRY/);
    assert.match(repairedProviderActivationCatalog, /root-public-builtin/);
    assert.match(repairedProviderActivationCatalog, /package-boundary/);

    const repairedJavaProviderPackageScaffold = readFileSync(javaProviderPackageScaffoldPath, 'utf8');
    assert.match(repairedJavaProviderPackageScaffold, /one provider per package boundary/i);
    assert.match(repairedJavaProviderPackageScaffold, /com\.sdkwork:rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaProviderPackageScaffold, /providers\/rtc-sdk-provider-\{providerKey\}/);
    assert.match(repairedJavaProviderPackageScaffold, /source file pattern:\s*`src\/main\/java\/com\/sdkwork\/rtc\/provider\/\{providerKey\}\/RtcProvider\{providerPascal\}PackageContract\.java`/i);
    assert.match(repairedJavaProviderPackageScaffold, /source symbol pattern:\s*`RtcProvider\{providerPascal\}PackageContract`/i);
    assert.match(repairedJavaProviderPackageScaffold, /template tokens:\s*`\{providerKey\}`/i);
    assert.match(repairedJavaProviderPackageScaffold, /source template tokens:\s*`\{providerKey\}`,\s*`\{providerPascal\}`/i);
    assert.match(repairedJavaProviderPackageScaffold, /status:\s*`future-runtime-bridge-only`/i);
    assert.match(repairedJavaProviderPackageScaffold, /runtime bridge status:\s*`reserved`/i);
    assert.match(repairedJavaProviderPackageScaffold, /root public exposure:\s*`false`/i);
    assert.match(repairedJavaProviderPackageScaffold, /pluginId/);
    assert.match(repairedJavaProviderPackageScaffold, /driverId/);
    assert.match(repairedJavaProviderPackageScaffold, /providers\/rtc-sdk-provider-volcengine\/pom\.xml/);
    assert.match(repairedJavaProviderPackageScaffold, /`Volcengine`/);

    const repairedJavaAgoraProviderManifest = readFileSync(javaAgoraProviderManifestPath, 'utf8');
    assert.match(repairedJavaAgoraProviderManifest, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderManifest, /src\/main\/java\/com\/sdkwork\/rtc\/provider\/agora\/RtcProviderAgoraPackageContract\.java/);
    assert.match(repairedJavaAgoraProviderManifest, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderManifest, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderManifest, /reserved/);

    const repairedJavaAgoraProviderReadme = readFileSync(javaAgoraProviderReadmePath, 'utf8');
    assert.match(repairedJavaAgoraProviderReadme, /Java Agora RTC Provider Package/);
    assert.match(repairedJavaAgoraProviderReadme, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderReadme, /providers\/rtc-sdk-provider-agora\/pom\.xml/);
    assert.match(repairedJavaAgoraProviderReadme, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderReadme, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderReadme, /reserved/);

    const repairedJavaAgoraProviderSource = readFileSync(javaAgoraProviderSourcePath, 'utf8');
    assert.match(repairedJavaAgoraProviderSource, /package com\.sdkwork\.rtc\.provider\.agora;/);
    assert.match(repairedJavaAgoraProviderSource, /RtcProviderAgoraPackageContract/);
    assert.match(repairedJavaAgoraProviderSource, /rtc-agora/);
    assert.match(repairedJavaAgoraProviderSource, /sdkwork-rtc-driver-agora/);
    assert.match(repairedJavaAgoraProviderSource, /com\.sdkwork:rtc-sdk-provider-agora/);
    assert.match(repairedJavaAgoraProviderSource, /future-runtime-bridge-only/);
    assert.match(repairedJavaAgoraProviderSource, /reserved/);

    const repairedFlutterManifest = readFileSync(flutterManifestPath, 'utf8');
    assert.match(repairedFlutterManifest, /^name:\s+rtc_sdk/m);
    assert.match(repairedFlutterManifest, /build system:\s+flutter-pub/);

    const repairedPythonProviderCatalog = readFileSync(pythonProviderCatalogPath, 'utf8');
    assert.match(repairedPythonProviderCatalog, /DEFAULT_RTC_PROVIDER_KEY = "volcengine"/);
    assert.match(repairedPythonProviderCatalog, /class RtcProviderCatalog/);
    assert.match(repairedPythonProviderCatalog, /RtcProviderCatalogEntry\("volcengine"/);

    const repairedPythonProviderPackageCatalog = readFileSync(
      pythonProviderPackageCatalogPath,
      'utf8',
    );
    assert.match(repairedPythonProviderPackageCatalog, /class RtcProviderPackageCatalog/);
    assert.match(repairedPythonProviderPackageCatalog, /RtcProviderPackageCatalogEntry/);
    assert.match(repairedPythonProviderPackageCatalog, /packageIdentity/);
    assert.match(repairedPythonProviderPackageCatalog, /manifestPath/);
    assert.match(repairedPythonProviderPackageCatalog, /sourceSymbol/);
    assert.match(repairedPythonProviderPackageCatalog, /sdkwork-rtc-driver-volcengine/);
    assert.match(
      repairedPythonProviderPackageCatalog,
      /sdkwork_rtc_sdk_provider_volcengine\/__init__\.py/,
    );
    assert.match(repairedPythonProviderPackageCatalog, /future-runtime-bridge-only/);
    assert.match(repairedPythonProviderPackageCatalog, /reserved/);

    const repairedPythonProviderActivationCatalog = readFileSync(
      pythonProviderActivationCatalogPath,
      'utf8',
    );
    assert.match(repairedPythonProviderActivationCatalog, /class RtcProviderActivationCatalog/);
    assert.match(repairedPythonProviderActivationCatalog, /RtcProviderActivationCatalogEntry/);
    assert.match(repairedPythonProviderActivationCatalog, /control-metadata-only/);
    assert.match(repairedPythonProviderActivationCatalog, /sdkwork-rtc-driver-volcengine/);

    const repairedRustDriverManager = readFileSync(rustDriverManagerPath, 'utf8');
    assert.match(repairedRustDriverManager, /pub struct RtcDriverManager/);
    assert.match(repairedRustDriverManager, /resolveSelection/);
    assert.match(repairedRustDriverManager, /describeProviderSupport/);
    assert.match(repairedRustDriverManager, /listProviderSupport/);
    assert.equal(existsSync(legacyCatalogPath), false);

    const secondRun = materializerModule.materializeRtcSdkWorkspace(fixture.workspaceCopy);
    assert.deepEqual(secondRun.changedFiles, []);
  } finally {
    rmSync(fixture.fixtureRoot, { recursive: true, force: true });
  }
});
