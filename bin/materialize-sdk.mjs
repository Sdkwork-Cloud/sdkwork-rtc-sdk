#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertRtcAssemblyWorkspaceBaseline } from './rtc-standard-assembly-baseline.mjs';
import {
  readJsonFile,
  readUtf8File,
  resolveRtcSdkWorkspaceRoot,
  writeUtf8File,
} from './rtc-standard-file-helpers.mjs';
import { buildReservedLanguageMaterializationPlan } from './materialize-sdk-reserved-scaffolds.mjs';
import { RTC_TEMPLATE_MATERIALIZATION_ASSETS } from './materialize-sdk-template-assets.mjs';
import {
  DEFAULT_RTC_PROVIDER_KEY,
  DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT,
  RTC_PROVIDER_ACTIVATION_STATUSES as PROVIDER_ACTIVATION_STATUSES,
} from './rtc-standard-contract-constants.mjs';
import {
  buildLanguageProviderActivationCatalogEntries,
  describeProviderActivationStatus,
  materializeProviderPackagePattern,
  toPascalCase,
  toUpperSnakeCase,
} from './rtc-standard-shared-helpers.mjs';
import { REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS } from './verify-sdk-standard-constants.mjs';

export const RTC_SDK_STALE_MATERIALIZED_FILES = [
  'sdkwork-rtc-sdk-typescript/src/providers/catalog.ts',
];

function readMaterializedTemplate(workspaceRoot, relativePath) {
  return readUtf8File(path.join(workspaceRoot, 'bin', 'templates', relativePath));
}

function renderStringLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderReadonlyStringArray(values) {
  return `[${values.map((value) => renderStringLiteral(value)).join(', ')}] as const`;
}

function renderReadonlyStringRecord(entries) {
  return `{
${Object.entries(entries ?? {})
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${renderStringLiteral(value)},`)
    .join('\n')}
}`;
}

function renderMarkdownCodeList(values) {
  return (values ?? []).map((value) => `\`${value}\``).join(', ');
}

function renderTypeScriptAdapterContract(contract) {
  return `{
    sdkProvisioning: ${renderStringLiteral(contract.sdkProvisioning)},
    bindingStrategy: ${renderStringLiteral(contract.bindingStrategy)},
    bundlePolicy: ${renderStringLiteral(contract.bundlePolicy)},
    runtimeBridgeStatus: ${renderStringLiteral(contract.runtimeBridgeStatus)},
    officialVendorSdkRequirement: ${renderStringLiteral(contract.officialVendorSdkRequirement)},
  }`;
}

function renderTypeScriptRuntimeSurface(assembly) {
  return `import type { RtcSdkErrorCode } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_SURFACE_METHODS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.runtimeSurfaceStandard?.methodTerms ?? [],
  )});

export type RtcRuntimeSurfaceMethodName = (typeof RTC_RUNTIME_SURFACE_METHODS)[number];

export type RtcRuntimeSurfaceFailureCode = Extract<RtcSdkErrorCode, ${renderStringLiteral(
    assembly.runtimeSurfaceStandard?.failureCode ?? '',
  )}>;

export const RTC_RUNTIME_SURFACE_FAILURE_CODE: RtcRuntimeSurfaceFailureCode = ${renderStringLiteral(
    assembly.runtimeSurfaceStandard?.failureCode ?? '',
  )};

export const RTC_RUNTIME_SURFACE_STANDARD = freezeRtcRuntimeValue({
  methodTerms: RTC_RUNTIME_SURFACE_METHODS,
  failureCode: RTC_RUNTIME_SURFACE_FAILURE_CODE,
} as const);
`;
}

function renderTypeScriptRuntimeImmutability(assembly) {
  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.frozenTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.snapshotTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.controllerContextTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM = ${renderStringLiteral(
    assembly.runtimeImmutabilityStandard?.nativeClientTerm ?? '',
  )};

export const RTC_RUNTIME_IMMUTABILITY_STANDARD = freezeRtcRuntimeValue({
  frozenTerm: RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM,
  snapshotTerm: RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM,
  controllerContextTerm: RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM,
  nativeClientTerm: RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM,
} as const);
`;
}

function renderTypeScriptRootPublicSurface(assembly) {
  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptProviderNeutralExportPaths ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptBuiltinProviderExportPaths ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.typescriptInlineHelperNames ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.rootPublicSurfaceStandard?.reservedSurfaceFamilies ?? [],
  )});

export const RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS = freezeRtcRuntimeValue(${renderReadonlyStringRecord(
    assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds ?? {},
  )} as const);

export const RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM = ${renderStringLiteral(
    assembly.rootPublicSurfaceStandard?.builtinProviderExposureTerm ?? '',
  )};

export const RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM = ${renderStringLiteral(
    assembly.rootPublicSurfaceStandard?.nonBuiltinProviderExposureTerm ?? '',
  )};

export {
  RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  RTC_LOOKUP_HELPER_NAMING_STANDARD,
} from './lookup-helper-naming.js';

export const RTC_ROOT_PUBLIC_SURFACE_STANDARD = freezeRtcRuntimeValue({
  typescriptProviderNeutralExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS,
  typescriptBuiltinProviderExportPaths:
    RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS,
  typescriptInlineHelperNames: RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES,
  reservedSurfaceFamilies: RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES,
  reservedEntryPointKinds: RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS,
  builtinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_BUILTIN_PROVIDER_EXPOSURE_TERM,
  nonBuiltinProviderExposureTerm: RTC_ROOT_PUBLIC_SURFACE_NON_BUILTIN_PROVIDER_EXPOSURE_TERM,
} as const);
`;
}

function renderTypeScriptLookupHelperNaming(assembly) {
  const profiles = Object.entries(assembly.lookupHelperNamingStandard?.profiles ?? {})
    .map(
      ([profileKey, profile]) => `  ${JSON.stringify(profileKey)}: freezeRtcRuntimeValue({
    languages: freezeRtcRuntimeValue(${renderReadonlyStringArray(profile.languages ?? [])}),
    helpers: freezeRtcRuntimeValue(${renderReadonlyStringRecord(profile.helpers ?? {})} as const),
  } as const),`,
    )
    .join('\n');

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.lookupHelperNamingStandard?.profileTerms ?? [],
  )});

export const RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    assembly.lookupHelperNamingStandard?.familyTerms ?? [],
  )});

export const RTC_LOOKUP_HELPER_NAMING_STANDARD = freezeRtcRuntimeValue({
  profileTerms: RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS,
  familyTerms: RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS,
  profiles: freezeRtcRuntimeValue({
${profiles}
  } as const),
} as const);
`;
}

function renderTypeScriptPackageContract(contract) {
  return `{
    packageName: ${renderStringLiteral(contract.packageName)},
    sourceModule: ${renderStringLiteral(contract.sourceModule)},
    driverFactory: ${renderStringLiteral(contract.driverFactory)},
    metadataSymbol: ${renderStringLiteral(contract.metadataSymbol)},
    moduleSymbol: ${renderStringLiteral(contract.moduleSymbol)},
    rootPublic: ${contract.rootPublic ? 'true' : 'false'},
  }`;
}

function getReferenceTypeScriptAdapterContract(assembly) {
  return (
    assembly.typescriptAdapterStandard?.referenceContract ??
    (assembly.providers ?? []).find((provider) => provider.providerKey === assembly.defaults?.providerKey)
      ?.typescriptAdapter ??
    (assembly.providers ?? [])[0]?.typescriptAdapter ??
    DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT
  );
}

function writeIfChanged(workspaceRoot, filePath, nextContent, changedFiles) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const currentContent = existsSync(filePath) ? readUtf8File(filePath) : null;
  if (currentContent !== nextContent) {
    writeUtf8File(filePath, nextContent);
    changedFiles.push(path.relative(workspaceRoot, filePath).replace(/\\/g, '/'));
  }
}

function removeIfExists(workspaceRoot, filePath, changedFiles) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
    changedFiles.push(path.relative(workspaceRoot, filePath).replace(/\\/g, '/'));
  }
}

function renderRoleHighlights(roleHighlights) {
  return (roleHighlights ?? []).map((item) => `- ${item}`).join('\n');
}

function renderReservedLanguagePackageScaffold(languageEntry) {
  if (!languageEntry.packageScaffold || !languageEntry.contractScaffold) {
    return '';
  }

  return `
Package scaffold:

- build system: ${languageEntry.packageScaffold.buildSystem}
- manifest: \`${languageEntry.packageScaffold.manifestRelativePath}\`
- contract scaffold: \`${languageEntry.contractScaffold.relativePath}\`
`;
}

function renderReservedLanguageMetadataScaffold(languageEntry) {
  if (!languageEntry.metadataScaffold) {
    return '';
  }

  return `
Metadata scaffold:

- provider catalog: \`${languageEntry.metadataScaffold.providerCatalogRelativePath}\`
- provider package catalog: \`${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}\`
- provider activation catalog: \`${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}\`
- capability catalog: \`${languageEntry.metadataScaffold.capabilityCatalogRelativePath}\`
- provider extension catalog: \`${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}\`
- provider selection: \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\`
- lookup helper naming contract: \`lookupHelperNamingStandard\`
- lookup helper naming profiles: \`lower-camel-rtc\`, \`upper-camel-rtc\`, \`snake-case-rtc\`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, provider URL parsing,
  provider selection resolution, provider support resolution, provider package loading, and
  language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  \`getRtc...\` for Flutter/Java/Swift/Kotlin, \`GetRtc...\` for C#/Go, and \`get_rtc...\` for Rust/Python
`;
}

function renderReservedLanguageResolutionScaffold(languageEntry) {
  if (!languageEntry.resolutionScaffold) {
    return '';
  }

  return `
Resolution scaffold:

- driver manager: \`${languageEntry.resolutionScaffold.driverManagerRelativePath}\`
- data source: \`${languageEntry.resolutionScaffold.dataSourceRelativePath}\`
- provider support: \`${languageEntry.resolutionScaffold.providerSupportRelativePath}\`
- provider package loader: \`${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}\`
`;
}

function renderReservedLanguageProviderPackageScaffold(languageEntry) {
  if (!languageEntry.providerPackageScaffold) {
    return '';
  }

  const providerPackageScaffoldNote =
    languageEntry.runtimeBridge
      ? '- this scaffold remains reserved for future extracted provider packages; the current executable runtime stays in the root workspace baseline\n'
      : '';

  return `
Provider package scaffold:

- scaffold: \`${languageEntry.providerPackageScaffold.relativePath}\`
- directory pattern: \`${languageEntry.providerPackageScaffold.directoryPattern}\`
- package pattern: \`${languageEntry.providerPackageScaffold.packagePattern}\`
- manifest file name: \`${languageEntry.providerPackageScaffold.manifestFileName}\`
- readme file name: \`${languageEntry.providerPackageScaffold.readmeFileName}\`
- source file pattern: \`${languageEntry.providerPackageScaffold.sourceFilePattern}\`
- source symbol pattern: \`${languageEntry.providerPackageScaffold.sourceSymbolPattern}\`
- template tokens: ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.templateTokens)}
- source template tokens: ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.sourceTemplateTokens)}
- status: \`${languageEntry.providerPackageScaffold.status}\`
- runtime bridge status: \`${languageEntry.providerPackageScaffold.runtimeBridgeStatus}\`
- root public exposure: \`${languageEntry.providerPackageScaffold.rootPublic}\`
${providerPackageScaffoldNote}`;
}

function renderLanguageWorkspaceProviderPackageBoundary(languageEntry) {
  if (!languageEntry.providerPackageBoundary) {
    return '';
  }

  const providerPackageBoundaryNote =
    languageEntry.runtimeBridge && languageEntry.providerPackageScaffold
      ? '- these terms describe future extracted provider packages, not the runnable root workspace baseline\n'
      : '';

  return `
Provider package boundary:

- mode: \`${languageEntry.providerPackageBoundary.mode}\`
- root public policy: \`${languageEntry.providerPackageBoundary.rootPublicPolicy}\`
- lifecycle status terms: ${renderMarkdownCodeList(
    languageEntry.providerPackageBoundary.lifecycleStatusTerms,
  )}
- runtime bridge status terms: ${renderMarkdownCodeList(
    languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms,
  )}
${providerPackageBoundaryNote}`;
}

function renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly) {
  const defaults = assembly.defaults ?? {};
  if (
    typeof defaults.providerKey !== 'string' ||
    typeof defaults.pluginId !== 'string' ||
    typeof defaults.driverId !== 'string'
  ) {
    return '';
  }

  if (languageEntry.language === 'typescript') {
    return `
Default provider contract:

- Web/browser default provider key: \`${defaults.providerKey}\`
- Web/browser default plugin id: \`${defaults.pluginId}\`
- Web/browser default driver id: \`${defaults.driverId}\`
- the TypeScript provider catalog must keep \`DEFAULT_RTC_PROVIDER_KEY\`,
  \`DEFAULT_RTC_PROVIDER_PLUGIN_ID\`, and \`DEFAULT_RTC_PROVIDER_DRIVER_ID\`
  aligned to that assembly default
- \`resolveRtcProviderSelection()\` falls back to \`DEFAULT_RTC_PROVIDER_KEY\`
  when web callers do not override providerUrl, providerKey, tenant override, or deployment profile
- \`RtcDataSource\` and \`RtcDriverManager\` therefore resolve the web default provider to
  \`${defaults.providerKey}\` unless the caller explicitly selects a different provider
`;
  }

  if (languageEntry.language === 'flutter') {
    return `
Default provider contract:

- Flutter/mobile default provider key: \`${defaults.providerKey}\`
- Flutter/mobile default plugin id: \`${defaults.pluginId}\`
- Flutter/mobile default driver id: \`${defaults.driverId}\`
- \`RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY\` must stay aligned to that assembly default
- \`resolveRtcProviderSelection()\` in \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\`
  falls back to \`RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY\` when Flutter callers do not
  provide providerUrl, providerKey, tenant override, or deployment profile values
- \`RtcDataSourceOptions.defaultProviderKey\` and \`RtcDataSource.describeSelection()\`
  therefore keep the Flutter/mobile default provider on \`${defaults.providerKey}\`
  until a caller explicitly overrides it
`;
  }

  return `
Default provider contract:

- default provider key: \`${defaults.providerKey}\`
- default plugin id: \`${defaults.pluginId}\`
- default driver id: \`${defaults.driverId}\`
- language metadata and selection scaffolds must preserve that assembly-driven default
  provider identity for future runtime bridge landings
`;
}

function buildTypeScriptProviderActivationCatalogEntries(assembly) {
  const typescriptLanguage = (assembly.languages ?? []).find(
    (languageEntry) => languageEntry.language === 'typescript',
  );
  if (!typescriptLanguage) {
    return [];
  }

  return buildLanguageProviderActivationCatalogEntries(typescriptLanguage, assembly.providers);
}

function buildTypeScriptProviderPackageCatalogEntries(assembly) {
  return (assembly.providers ?? []).map((provider) => ({
    providerKey: provider.providerKey,
    pluginId: provider.pluginId,
    driverId: provider.driverId,
    packageIdentity: provider.typescriptPackage.packageName,
    manifestPath: `providers/rtc-sdk-provider-${provider.providerKey}/package.json`,
    readmePath: `providers/rtc-sdk-provider-${provider.providerKey}/README.md`,
    sourcePath: `providers/rtc-sdk-provider-${provider.providerKey}/index.js`,
    declarationPath: `providers/rtc-sdk-provider-${provider.providerKey}/index.d.ts`,
    sourceSymbol: provider.typescriptPackage.moduleSymbol,
    sourceModule: provider.typescriptPackage.sourceModule,
    driverFactory: provider.typescriptPackage.driverFactory,
    metadataSymbol: provider.typescriptPackage.metadataSymbol,
    moduleSymbol: provider.typescriptPackage.moduleSymbol,
    builtin: provider.builtin === true,
    rootPublic: provider.typescriptPackage.rootPublic === true,
    status: provider.builtin
      ? 'root_public_reference_boundary'
      : 'package_reference_boundary',
    runtimeBridgeStatus: provider.typescriptAdapter.runtimeBridgeStatus,
    extensionKeys: [...(provider.extensionKeys ?? [])],
  }));
}

function buildLanguageWorkspaceCatalogEntries(assembly) {
  const defaultProviderContract =
    typeof assembly.defaults?.providerKey === 'string' &&
    typeof assembly.defaults?.pluginId === 'string' &&
    typeof assembly.defaults?.driverId === 'string'
      ? {
          providerKey: assembly.defaults.providerKey,
          pluginId: assembly.defaults.pluginId,
          driverId: assembly.defaults.driverId,
        }
      : undefined;
  const providerSelectionContract =
    Array.isArray(assembly.providerSelectionStandard?.sourceTerms) &&
    Array.isArray(assembly.providerSelectionStandard?.precedence) &&
    typeof assembly.providerSelectionStandard?.defaultSource === 'string'
      ? {
          sourceTerms: [...assembly.providerSelectionStandard.sourceTerms],
          precedence: [...assembly.providerSelectionStandard.precedence],
          defaultSource: assembly.providerSelectionStandard.defaultSource,
        }
      : undefined;
  const providerSupportContract = Array.isArray(assembly.providerSupportStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerSupportStandard.statusTerms],
      }
    : undefined;
  const providerActivationContract = Array.isArray(assembly.providerActivationStandard?.statusTerms)
    ? {
        statusTerms: [...assembly.providerActivationStandard.statusTerms],
      }
    : undefined;
  const providerPackageBoundaryContract =
    Array.isArray(assembly.providerPackageBoundaryStandard?.modeTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.rootPublicPolicyTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.lifecycleStatusTerms) &&
    Array.isArray(assembly.providerPackageBoundaryStandard?.runtimeBridgeStatusTerms)
      ? {
          modeTerms: [...assembly.providerPackageBoundaryStandard.modeTerms],
          rootPublicPolicyTerms: [...assembly.providerPackageBoundaryStandard.rootPublicPolicyTerms],
          lifecycleStatusTerms: [...assembly.providerPackageBoundaryStandard.lifecycleStatusTerms],
          runtimeBridgeStatusTerms: [
            ...assembly.providerPackageBoundaryStandard.runtimeBridgeStatusTerms,
          ],
        }
      : undefined;

  return (assembly.languages ?? []).map((languageEntry) => ({
    language: languageEntry.language,
    workspace: languageEntry.workspace,
    workspaceCatalogRelativePath: languageEntry.workspaceCatalogRelativePath,
    displayName: languageEntry.displayName,
    publicPackage: languageEntry.publicPackage,
    maturityTier: languageEntry.maturityTier,
    controlSdk: languageEntry.controlSdk === true,
    runtimeBridge: languageEntry.runtimeBridge === true,
    currentRole: languageEntry.currentRole,
    workspaceSummary: languageEntry.workspaceSummary,
    roleHighlights: [...(languageEntry.roleHighlights ?? [])],
    defaultProviderContract,
    providerSelectionContract,
    providerSupportContract,
    providerActivationContract,
    metadataScaffold: languageEntry.metadataScaffold
      ? {
          providerCatalogRelativePath: languageEntry.metadataScaffold.providerCatalogRelativePath,
          capabilityCatalogRelativePath: languageEntry.metadataScaffold.capabilityCatalogRelativePath,
          providerExtensionCatalogRelativePath:
            languageEntry.metadataScaffold.providerExtensionCatalogRelativePath,
          providerPackageCatalogRelativePath:
            languageEntry.metadataScaffold.providerPackageCatalogRelativePath,
          providerActivationCatalogRelativePath:
            languageEntry.metadataScaffold.providerActivationCatalogRelativePath,
          providerSelectionRelativePath:
            languageEntry.metadataScaffold.providerSelectionRelativePath,
        }
      : undefined,
    resolutionScaffold: languageEntry.resolutionScaffold
      ? {
          driverManagerRelativePath: languageEntry.resolutionScaffold.driverManagerRelativePath,
          dataSourceRelativePath: languageEntry.resolutionScaffold.dataSourceRelativePath,
          providerSupportRelativePath: languageEntry.resolutionScaffold.providerSupportRelativePath,
          providerPackageLoaderRelativePath:
            languageEntry.resolutionScaffold.providerPackageLoaderRelativePath,
        }
      : undefined,
    providerPackageBoundaryContract,
    providerPackageBoundary: languageEntry.providerPackageBoundary
      ? {
          mode: languageEntry.providerPackageBoundary.mode,
          rootPublicPolicy: languageEntry.providerPackageBoundary.rootPublicPolicy,
          lifecycleStatusTerms: [...(languageEntry.providerPackageBoundary.lifecycleStatusTerms ?? [])],
          runtimeBridgeStatusTerms: [
            ...(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms ?? []),
          ],
        }
      : undefined,
    providerPackageScaffold: languageEntry.providerPackageScaffold
      ? {
          relativePath: languageEntry.providerPackageScaffold.relativePath,
          directoryPattern: languageEntry.providerPackageScaffold.directoryPattern,
          packagePattern: languageEntry.providerPackageScaffold.packagePattern,
          manifestFileName: languageEntry.providerPackageScaffold.manifestFileName,
          readmeFileName: languageEntry.providerPackageScaffold.readmeFileName,
          sourceFilePattern: languageEntry.providerPackageScaffold.sourceFilePattern,
          sourceSymbolPattern: languageEntry.providerPackageScaffold.sourceSymbolPattern,
          templateTokens: [...(languageEntry.providerPackageScaffold.templateTokens ?? [])],
          sourceTemplateTokens: [
            ...(languageEntry.providerPackageScaffold.sourceTemplateTokens ?? []),
          ],
          runtimeBridgeStatus: languageEntry.providerPackageScaffold.runtimeBridgeStatus,
          rootPublic: languageEntry.providerPackageScaffold.rootPublic === true,
          status: languageEntry.providerPackageScaffold.status,
        }
      : undefined,
  }));
}

function renderLanguageWorkspaceCatalogSection(languageEntry) {
  if (typeof languageEntry.workspaceCatalogRelativePath !== 'string') {
    return '';
  }

  return `
Language workspace catalog:

- workspace catalog: \`${languageEntry.workspaceCatalogRelativePath}\`
- workspace catalog entries also keep \`workspaceCatalogRelativePath\`,
  \`defaultProviderContract\`, \`providerSelectionContract\`, \`providerSupportContract\`,
  \`providerActivationContract\`, \`providerPackageBoundaryContract\`, and any declared
  \`metadataScaffold\`, \`resolutionScaffold\`, \`providerPackageBoundary\`, and
  \`providerPackageScaffold\` boundaries so consumers can inspect official assembly-driven module
  locations, workspace-wide default provider identity, selection precedence, support-status
  vocabulary, activation-status vocabulary, and package-boundary vocabulary without rereading the
  assembly.
`;
}

function renderTypeScriptLanguageWorkspaceMetadataScaffold(metadataScaffold) {
  if (!metadataScaffold) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    providerCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerCatalogRelativePath)},
    capabilityCatalogRelativePath: ${renderStringLiteral(metadataScaffold.capabilityCatalogRelativePath)},
    providerExtensionCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerExtensionCatalogRelativePath)},
    providerPackageCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerPackageCatalogRelativePath)},
    providerActivationCatalogRelativePath: ${renderStringLiteral(metadataScaffold.providerActivationCatalogRelativePath)},
    providerSelectionRelativePath: ${renderStringLiteral(metadataScaffold.providerSelectionRelativePath)},
  })`;
}

function renderTypeScriptLanguageWorkspaceResolutionScaffold(resolutionScaffold) {
  if (!resolutionScaffold) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    driverManagerRelativePath: ${renderStringLiteral(resolutionScaffold.driverManagerRelativePath)},
    dataSourceRelativePath: ${renderStringLiteral(resolutionScaffold.dataSourceRelativePath)},
    providerSupportRelativePath: ${renderStringLiteral(resolutionScaffold.providerSupportRelativePath)},
    providerPackageLoaderRelativePath: ${renderStringLiteral(resolutionScaffold.providerPackageLoaderRelativePath)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageBoundary(providerPackageBoundary) {
  if (!providerPackageBoundary) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    mode: ${renderStringLiteral(providerPackageBoundary.mode)},
    rootPublicPolicy: ${renderStringLiteral(providerPackageBoundary.rootPublicPolicy)},
    lifecycleStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundary.lifecycleStatusTerms)}),
    runtimeBridgeStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundary.runtimeBridgeStatusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageScaffold(providerPackageScaffold) {
  if (!providerPackageScaffold) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    relativePath: ${renderStringLiteral(providerPackageScaffold.relativePath)},
    directoryPattern: ${renderStringLiteral(providerPackageScaffold.directoryPattern)},
    packagePattern: ${renderStringLiteral(providerPackageScaffold.packagePattern)},
    manifestFileName: ${renderStringLiteral(providerPackageScaffold.manifestFileName)},
    readmeFileName: ${renderStringLiteral(providerPackageScaffold.readmeFileName)},
    sourceFilePattern: ${renderStringLiteral(providerPackageScaffold.sourceFilePattern)},
    sourceSymbolPattern: ${renderStringLiteral(providerPackageScaffold.sourceSymbolPattern)},
    templateTokens: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageScaffold.templateTokens)}),
    sourceTemplateTokens: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageScaffold.sourceTemplateTokens)}),
    runtimeBridgeStatus: ${renderStringLiteral(providerPackageScaffold.runtimeBridgeStatus)},
    rootPublic: ${providerPackageScaffold.rootPublic ? 'true' : 'false'},
    status: ${renderStringLiteral(providerPackageScaffold.status)},
  })`;
}

function renderTypeScriptLanguageWorkspaceDefaultProviderContract(defaultProviderContract) {
  if (!defaultProviderContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    providerKey: ${renderStringLiteral(defaultProviderContract.providerKey)},
    pluginId: ${renderStringLiteral(defaultProviderContract.pluginId)},
    driverId: ${renderStringLiteral(defaultProviderContract.driverId)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderSelectionContract(
  providerSelectionContract,
) {
  if (!providerSelectionContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    sourceTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSelectionContract.sourceTerms)}),
    precedence: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSelectionContract.precedence)}),
    defaultSource: ${renderStringLiteral(providerSelectionContract.defaultSource)},
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderSupportContract(
  providerSupportContract,
) {
  if (!providerSupportContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    statusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerSupportContract.statusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderActivationContract(
  providerActivationContract,
) {
  if (!providerActivationContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    statusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerActivationContract.statusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceProviderPackageBoundaryContract(
  providerPackageBoundaryContract,
) {
  if (!providerPackageBoundaryContract) {
    return 'undefined';
  }

  return `freezeRtcRuntimeValue({
    modeTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.modeTerms)}),
    rootPublicPolicyTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.rootPublicPolicyTerms)}),
    lifecycleStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.lifecycleStatusTerms)}),
    runtimeBridgeStatusTerms: freezeRtcRuntimeValue(${renderReadonlyStringArray(providerPackageBoundaryContract.runtimeBridgeStatusTerms)}),
  })`;
}

function renderTypeScriptLanguageWorkspaceCatalog(assembly) {
  const entries = buildLanguageWorkspaceCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcLanguageWorkspaceCatalogEntry } from './types.js';

export const OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    entries.map((entry) => entry.language),
  )});

${entries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.language)}_RTC_LANGUAGE_WORKSPACE_ENTRY`;

    return `export const ${constantName}: RtcLanguageWorkspaceCatalogEntry = freezeRtcRuntimeValue({
  language: ${renderStringLiteral(entry.language)},
  workspace: ${renderStringLiteral(entry.workspace)},
  workspaceCatalogRelativePath: ${renderStringLiteral(entry.workspaceCatalogRelativePath)},
  displayName: ${renderStringLiteral(entry.displayName)},
  publicPackage: ${renderStringLiteral(entry.publicPackage)},
  maturityTier: ${renderStringLiteral(entry.maturityTier)},
  controlSdk: ${entry.controlSdk ? 'true' : 'false'},
  runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
  currentRole: ${renderStringLiteral(entry.currentRole)},
  workspaceSummary: ${renderStringLiteral(entry.workspaceSummary)},
  roleHighlights: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.roleHighlights)}),
  defaultProviderContract: ${renderTypeScriptLanguageWorkspaceDefaultProviderContract(entry.defaultProviderContract)},
  providerSelectionContract: ${renderTypeScriptLanguageWorkspaceProviderSelectionContract(entry.providerSelectionContract)},
  providerSupportContract: ${renderTypeScriptLanguageWorkspaceProviderSupportContract(entry.providerSupportContract)},
  providerActivationContract: ${renderTypeScriptLanguageWorkspaceProviderActivationContract(entry.providerActivationContract)},
  metadataScaffold: ${renderTypeScriptLanguageWorkspaceMetadataScaffold(entry.metadataScaffold)},
  resolutionScaffold: ${renderTypeScriptLanguageWorkspaceResolutionScaffold(entry.resolutionScaffold)},
  providerPackageBoundaryContract: ${renderTypeScriptLanguageWorkspaceProviderPackageBoundaryContract(entry.providerPackageBoundaryContract)},
  providerPackageBoundary: ${renderTypeScriptLanguageWorkspaceProviderPackageBoundary(entry.providerPackageBoundary)},
  providerPackageScaffold: ${renderTypeScriptLanguageWorkspaceProviderPackageScaffold(entry.providerPackageScaffold)},
});`;
  })
  .join('\n\n')}

export const RTC_LANGUAGE_WORKSPACE_CATALOG: readonly RtcLanguageWorkspaceCatalogEntry[] = freezeRtcRuntimeValue([
  ${entries
    .map((entry) => `${toUpperSnakeCase(entry.language)}_RTC_LANGUAGE_WORKSPACE_ENTRY`)
    .join(',\n  ')}
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
`;
}

function renderTypeScriptWorkspaceReadme(languageEntry, assembly) {
  const typeScriptAdapter = getReferenceTypeScriptAdapterContract(assembly);
  const roleHighlights = [
    languageEntry.currentRole,
    ...(languageEntry.roleHighlights ?? []),
    'assembly-driven language workspace catalog at src/language-workspace-catalog.ts',
    'standard provider selection helpers at src/provider-selection.ts',
    'standard capability negotiation helpers at src/capability-negotiation.ts',
    'standard provider support helpers at src/provider-support.ts',
    'standard call-stack composition helper at src/standard-call-stack.ts for default Volcengine plus sdkwork-im-sdk signaling',
    'assembly-driven provider package catalog at src/provider-package-catalog.ts',
    'standard provider package loader and installer SPI at src/provider-package-loader.ts',
    'assembly-driven provider activation catalog at src/provider-activation-catalog.ts',
    `TypeScript runtime bridge baseline: ${typeScriptAdapter.runtimeBridgeStatus}`,
    `TypeScript runtime bridge requires an official vendor SDK: ${typeScriptAdapter.officialVendorSdkRequirement}`,
    `TypeScript provider adapters remain ${typeScriptAdapter.sdkProvisioning}, bind through ${typeScriptAdapter.bindingStrategy}, and ${typeScriptAdapter.bundlePolicy} vendor SDKs`,
  ];

  return `# SDKWork RTC SDK ${languageEntry.displayName} Workspace

Language: \`${languageEntry.language}\`

Planned public package:

- \`${languageEntry.publicPackage}\`

Current boundary:

- control SDK support: ${languageEntry.controlSdk ? 'yes' : 'no'}
- runtime bridge support: ${languageEntry.runtimeBridge ? 'yes' : 'reserved'}
- maturity tier: ${languageEntry.maturityTier}

Current role:

${renderRoleHighlights(roleHighlights)}

${languageEntry.workspaceSummary}
This workspace does not bundle vendor SDK implementations. Provider adapters wrap caller-supplied
native client factories and expose vendor escape hatches through \`unwrap()\`.
The shared runtime-surface module at \`src/runtime-surface.ts\` materializes
\`runtimeSurfaceStandard\` into \`RTC_RUNTIME_SURFACE_METHODS\`,
\`RTC_RUNTIME_SURFACE_FAILURE_CODE\`, and \`RTC_RUNTIME_SURFACE_STANDARD\` so the provider-neutral
runtime method vocabulary and missing-runtime failure semantics stay assembly-governed.
The shared runtime-immutability module at \`src/runtime-immutability.ts\` materializes
\`runtimeImmutabilityStandard\` into \`RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM\`,
\`RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM\`, and
\`RTC_RUNTIME_IMMUTABILITY_STANDARD\` so runtime-frozen metadata, immutable snapshot contracts,
shallow-immutable runtime-controller contexts, and mutable native-client preservation stay
assembly-governed.
The shared root-public-surface module at \`src/root-public-surface.ts\` materializes
\`rootPublicSurfaceStandard\` into
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS\`,
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS\`,
\`RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES\`,
\`RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES\`,
\`RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS\`, and
\`RTC_ROOT_PUBLIC_SURFACE_STANDARD\` so the TypeScript root export graph, builtin-provider
root exposure, and reserved single-entrypoint families stay assembly-governed.
The shared lookup-helper-naming module at \`src/lookup-helper-naming.ts\` materializes
\`lookupHelperNamingStandard\` into \`RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS\`,
\`RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS\`, and \`RTC_LOOKUP_HELPER_NAMING_STANDARD\` so the
\`lower-camel-rtc\`, \`upper-camel-rtc\`, and \`snake-case-rtc\` helper profiles stay
assembly-governed across the web/browser baseline and the reserved mobile/server language
workspaces.
${renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly)}
${renderLanguageWorkspaceCatalogSection(languageEntry)}
${renderLanguageWorkspaceProviderPackageBoundary(languageEntry)}

Standards references:

- \`../docs/provider-adapter-standard.md\`
- \`../docs/multilanguage-capability-matrix.md\`
`;
}

function renderLanguageWorkspaceReadme(languageEntry, assembly) {
  if (languageEntry.language === 'typescript') {
    return renderTypeScriptWorkspaceReadme(languageEntry, assembly);
  }

  return `# SDKWork RTC SDK ${languageEntry.displayName} Workspace

Language: \`${languageEntry.language}\`

Planned public package:

- \`${languageEntry.publicPackage}\`

Current boundary:

- control SDK support: ${languageEntry.controlSdk ? 'yes' : 'no'}
- runtime bridge support: ${languageEntry.runtimeBridge ? 'yes' : 'reserved'}
- maturity tier: ${languageEntry.maturityTier}

Current role:

${renderRoleHighlights([languageEntry.currentRole, ...(languageEntry.roleHighlights ?? [])])}

${languageEntry.workspaceSummary}
${renderLanguageWorkspaceDefaultProviderContract(languageEntry, assembly)}
${renderLanguageWorkspaceCatalogSection(languageEntry)}
${renderLanguageWorkspaceProviderPackageBoundary(languageEntry)}
${renderReservedLanguagePackageScaffold(languageEntry)}
${renderReservedLanguageMetadataScaffold(languageEntry)}
${renderReservedLanguageResolutionScaffold(languageEntry)}
${renderReservedLanguageProviderPackageScaffold(languageEntry)}${languageEntry.language === 'flutter'
  ? `\n${renderReservedLanguageRuntimeUsage(languageEntry)}`
  : ''}

Standards references:

- \`../docs/provider-adapter-standard.md\`
- \`../docs/multilanguage-capability-matrix.md\`
`;
}

function renderReservedLanguageRuntimeUsage(languageEntry) {
  if (languageEntry.language !== 'flutter') {
    return '';
  }

  return `Executable baseline:

- Flutter/mobile now ships a runnable default adapter for \`volcengine\`
- media runtime delegates to the official \`volc_engine_rtc\` package
- signaling delegates to \`sdkwork-im-sdk\` through \`package:im_sdk/im_sdk.dart\`
- \`RtcDriverManager\` auto-registers \`createVolcengineRtcDriver()\`
- \`RtcDataSource()\` therefore resolves to \`volcengine\` by default with no extra provider selection
- \`createStandardRtcCallStack(...)\` is the recommended quick-start entrypoint for the default
  Volcengine plus \`sdkwork-im-sdk\` call flow
- \`StandardRtcCallSession\` composes media control and IM signaling into one video-call flow:
  create session, invite, issue RTC credential, join media room, publish tracks, exchange RTC
  signals, and end session

Quick start:

\`\`\`dart
import 'package:im_sdk/im_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required ImSdkClient imSdk,
  required String currentUserId,
}) async {
  final rtcStack =
      await createStandardRtcCallStack<RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallStackOptions(
      sdk: imSdk,
      deviceId: 'current-device-id',
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'your-volcengine-app-id',
        ),
      ),
    ),
  );

  await rtcStack.callSession.startOutgoing(
    RtcOutgoingCallOptions(
      rtcSessionId: 'rtc-session-001',
      conversationId: 'conversation-001',
      rtcMode: 'video_call',
      participantId: currentUserId,
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );
}
\`\`\`

Runtime notes:

- \`createStandardRtcCallStack(...)\` returns \`driverManager\`, \`dataSource\`, \`mediaClient\`,
  \`signaling\`, and \`callSession\` so callers can keep the standard pieces explicit
- \`RtcVolcengineFlutterNativeConfig.appId\` is mandatory; join will fail fast without it
- \`RtcJoinOptions.token\` is filled from \`sdkwork-im-sdk\` issued participant credentials, not by
  hardcoding vendor tokens in the caller
- \`RtcPublishOptions\` supports standard audio and video publishing through the Volcengine adapter
- signaling subscriptions are multiplexed through one shared IM realtime dispatcher so multiple RTC
  sessions do not overwrite each other at the subscription layer`;
}

function renderCapabilityMatrix(assembly) {
  const capabilityCatalogRows = (assembly.capabilityCatalog ?? [])
    .map(
      (descriptor) =>
        `| \`${descriptor.capabilityKey}\` | \`${descriptor.category}\` | \`${descriptor.surface}\` |`,
    )
    .join('\n');
  const providerExtensionRows = (assembly.providerExtensionCatalog ?? [])
    .map(
      (descriptor) =>
        `| \`${descriptor.extensionKey}\` | \`${descriptor.providerKey}\` | ${descriptor.displayName} | \`${descriptor.surface}\` | \`${descriptor.access}\` | \`${descriptor.status}\` |`,
    )
    .join('\n');
  const typeScriptRuntimeRows = (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | \`${provider.typescriptAdapter.runtimeBridgeStatus}\` | \`${provider.typescriptAdapter.officialVendorSdkRequirement}\` | \`${provider.typescriptAdapter.sdkProvisioning}\` | \`${provider.typescriptAdapter.bindingStrategy}\` | \`${provider.typescriptAdapter.bundlePolicy}\` |`,
    )
    .join('\n');
  const providerRows = (assembly.providers ?? [])
    .map(
      (provider) =>
        `| \`${provider.providerKey}\` | \`${provider.tier}\` | ${provider.builtin ? 'Yes' : 'No'} | ${provider.defaultSelected ? 'Yes' : 'No'} | ${provider.displayName} |`,
    )
    .join('\n');
  const languageRows = (assembly.languages ?? [])
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.publicPackage}\` | ${languageEntry.controlSdk ? 'Yes' : 'No'} | ${languageEntry.runtimeBridge ? 'Yes' : 'No'} | \`${languageEntry.maturityTier}\` | ${languageEntry.currentRole} |`,
    )
    .join('\n');
  const languageWorkspaceCatalogRows = (assembly.languages ?? [])
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.workspaceCatalogRelativePath}\` | \`${languageEntry.publicPackage}\` | ${languageEntry.controlSdk ? 'Yes' : 'No'} | ${languageEntry.runtimeBridge ? 'Yes' : 'No'} | \`${languageEntry.maturityTier}\` |`,
    )
    .join('\n');
  const languageProviderPackageBoundaryRows = (assembly.languages ?? [])
    .map((languageEntry) => {
      const scaffoldPath = languageEntry.providerPackageScaffold?.relativePath ?? '<none>';

      return `| ${languageEntry.displayName} | \`${languageEntry.providerPackageBoundary.mode}\` | \`${languageEntry.providerPackageBoundary.rootPublicPolicy}\` | ${renderMarkdownCodeList(languageEntry.providerPackageBoundary.lifecycleStatusTerms)} | ${renderMarkdownCodeList(languageEntry.providerPackageBoundary.runtimeBridgeStatusTerms)} | \`${scaffoldPath}\` |`;
    })
    .join('\n');
  const languageProviderActivationRows = (assembly.languages ?? [])
    .flatMap((languageEntry) =>
      (languageEntry.providerActivations ?? []).map((providerActivation) => {
        const activationDetails = describeProviderActivationStatus(providerActivation.activationStatus);
        return `| ${languageEntry.displayName} | \`${providerActivation.providerKey}\` | \`${providerActivation.activationStatus}\` | ${activationDetails.runtimeBridge ? 'Yes' : 'No'} | ${activationDetails.rootPublic ? 'Yes' : 'No'} | ${activationDetails.packageBoundary ? 'Yes' : 'No'} |`;
      }),
    )
    .join('\n');
  const reservedLanguagePackageScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.packageScaffold.buildSystem}\` | \`${languageEntry.packageScaffold.manifestRelativePath}\` | \`${languageEntry.contractScaffold.relativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageMetadataScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.metadataScaffold.providerCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerPackageCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerActivationCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.capabilityCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerExtensionCatalogRelativePath}\` | \`${languageEntry.metadataScaffold.providerSelectionRelativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageResolutionScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) =>
        `| ${languageEntry.displayName} | \`${languageEntry.resolutionScaffold.driverManagerRelativePath}\` | \`${languageEntry.resolutionScaffold.dataSourceRelativePath}\` | \`${languageEntry.resolutionScaffold.providerSupportRelativePath}\` | \`${languageEntry.resolutionScaffold.providerPackageLoaderRelativePath}\` |`,
    )
    .join('\n');
  const reservedLanguageProviderPackageScaffoldRows = (assembly.languages ?? [])
    .filter((languageEntry) => languageEntry.language !== 'typescript')
    .map(
      (languageEntry) => {
        const defaultProviderKey = assembly.defaults?.providerKey ?? DEFAULT_RTC_PROVIDER_KEY;
        const defaultExample = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.packagePattern,
          defaultProviderKey,
        );
        const defaultDirectory = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.directoryPattern,
          defaultProviderKey,
        );
        const defaultManifestPath = `${defaultDirectory}/${materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.manifestFileName,
          defaultProviderKey,
        )}`;
        const defaultReadmePath = `${defaultDirectory}/${languageEntry.providerPackageScaffold.readmeFileName}`;
        const defaultSourcePath = `${defaultDirectory}/${materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.sourceFilePattern,
          defaultProviderKey,
        )}`;
        const defaultSourceSymbol = materializeProviderPackagePattern(
          languageEntry.providerPackageScaffold.sourceSymbolPattern,
          defaultProviderKey,
        );

        return `| ${languageEntry.displayName} | \`${languageEntry.providerPackageScaffold.relativePath}\` | \`${languageEntry.providerPackageScaffold.directoryPattern}\` | \`${languageEntry.providerPackageScaffold.packagePattern}\` | \`${languageEntry.providerPackageScaffold.manifestFileName}\` | \`${languageEntry.providerPackageScaffold.readmeFileName}\` | \`${languageEntry.providerPackageScaffold.sourceFilePattern}\` | \`${languageEntry.providerPackageScaffold.sourceSymbolPattern}\` | ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.templateTokens)} | ${renderMarkdownCodeList(languageEntry.providerPackageScaffold.sourceTemplateTokens)} | \`${languageEntry.providerPackageScaffold.status}\` | \`${languageEntry.providerPackageScaffold.runtimeBridgeStatus}\` | \`${languageEntry.providerPackageScaffold.rootPublic}\` | \`${defaultExample}\` | \`${defaultManifestPath}\` | \`${defaultReadmePath}\` | \`${defaultSourcePath}\` | \`${defaultSourceSymbol}\` |`;
      },
    )
    .join('\n');
  const tierSummaryLines = Object.entries(assembly.providerTierStandard?.tierSummaries ?? {})
    .map(([tier, summary]) => `- \`${tier}\`: ${summary}`)
    .join('\n');
  const languageMaturitySummaryLines = Object.entries(
    assembly.languageMaturityStandard?.tierSummaries ?? {},
  )
    .map(([tier, summary]) => `- \`${tier}\`: ${summary}`)
    .join('\n');
  const capabilityStandardLines = [
    `- \`capabilityStandard.categoryTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityStandard?.categoryTerms ?? [],
    )}`,
    `- \`capabilityStandard.surfaceTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityStandard?.surfaceTerms ?? [],
    )}`,
  ].join('\n');
  const capabilityNegotiationStandardLines = [
    `- \`capabilityNegotiationStandard.statusTerms\`: ${renderMarkdownCodeList(
      assembly.capabilityNegotiationStandard?.statusTerms ?? [],
    )}`,
    `- \`capabilityNegotiationStandard.statusRules.supported\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.supported ?? ''}\``,
    `- \`capabilityNegotiationStandard.statusRules.degraded\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.degraded ?? ''}\``,
    `- \`capabilityNegotiationStandard.statusRules.unsupported\`: \`${assembly.capabilityNegotiationStandard?.statusRules?.unsupported ?? ''}\``,
  ].join('\n');
  const runtimeSurfaceStandardLines = [
    `- \`runtimeSurfaceStandard.methodTerms\`: ${renderMarkdownCodeList(
      assembly.runtimeSurfaceStandard?.methodTerms ?? [],
    )}`,
    `- \`runtimeSurfaceStandard.failureCode\`: \`${assembly.runtimeSurfaceStandard?.failureCode ?? ''}\``,
    '- TypeScript root public constants: `RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`',
  ].join('\n');
  const runtimeImmutabilityStandardLines = [
    `- \`runtimeImmutabilityStandard.frozenTerm\`: \`${assembly.runtimeImmutabilityStandard?.frozenTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.snapshotTerm\`: \`${assembly.runtimeImmutabilityStandard?.snapshotTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.controllerContextTerm\`: \`${assembly.runtimeImmutabilityStandard?.controllerContextTerm ?? ''}\``,
    `- \`runtimeImmutabilityStandard.nativeClientTerm\`: \`${assembly.runtimeImmutabilityStandard?.nativeClientTerm ?? ''}\``,
    '- TypeScript root public constants: `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`, `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`, `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, `RTC_RUNTIME_IMMUTABILITY_STANDARD`',
  ].join('\n');
  const rootPublicSurfaceStandardLines = [
    `- \`rootPublicSurfaceStandard.typescriptProviderNeutralExportPaths\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptProviderNeutralExportPaths ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.typescriptBuiltinProviderExportPaths\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptBuiltinProviderExportPaths ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.typescriptInlineHelperNames\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.typescriptInlineHelperNames ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.reservedSurfaceFamilies\`: ${renderMarkdownCodeList(
      assembly.rootPublicSurfaceStandard?.reservedSurfaceFamilies ?? [],
    )}`,
    `- \`rootPublicSurfaceStandard.reservedEntryPointKinds.flutter\`: \`${assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds?.flutter ?? ''}\``,
    `- \`rootPublicSurfaceStandard.reservedEntryPointKinds.python\`: \`${assembly.rootPublicSurfaceStandard?.reservedEntryPointKinds?.python ?? ''}\``,
    `- \`rootPublicSurfaceStandard.builtinProviderExposureTerm\`: \`${assembly.rootPublicSurfaceStandard?.builtinProviderExposureTerm ?? ''}\``,
    `- \`rootPublicSurfaceStandard.nonBuiltinProviderExposureTerm\`: \`${assembly.rootPublicSurfaceStandard?.nonBuiltinProviderExposureTerm ?? ''}\``,
    '- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`',
    '- TypeScript root public constants: `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`, `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`, `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, `RTC_ROOT_PUBLIC_SURFACE_STANDARD`',
  ].join('\n');
  const lookupHelperNamingStandardLines = [
    `- \`lookupHelperNamingStandard.profileTerms\`: ${renderMarkdownCodeList(
      assembly.lookupHelperNamingStandard?.profileTerms ?? [],
    )}`,
    `- \`lookupHelperNamingStandard.familyTerms\`: ${renderMarkdownCodeList(
      assembly.lookupHelperNamingStandard?.familyTerms ?? [],
    )}`,
    '- TypeScript root public module: `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`',
    '- TypeScript root public constants: `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`, `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, `RTC_LOOKUP_HELPER_NAMING_STANDARD`',
  ].join('\n');
  const errorCodeStandardLines = [
    `- \`errorCodeStandard.codeTerms\`: ${renderMarkdownCodeList(
      assembly.errorCodeStandard?.codeTerms ?? [],
    )}`,
    `- \`errorCodeStandard.fallbackCode\`: \`${assembly.errorCodeStandard?.fallbackCode ?? ''}\``,
  ].join('\n');
  const providerExtensionStandardLines = [
    `- \`providerExtensionStandard.accessTerms\`: ${renderMarkdownCodeList(
      assembly.providerExtensionStandard?.accessTerms ?? [],
    )}`,
    `- \`providerExtensionStandard.statusTerms\`: ${renderMarkdownCodeList(
      assembly.providerExtensionStandard?.statusTerms ?? [],
    )}`,
  ].join('\n');
  const typeScriptAdapterStandardLines = [
    `- \`typescriptAdapterStandard.sdkProvisioningTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.sdkProvisioningTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.bindingStrategyTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.bindingStrategyTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.bundlePolicyTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.bundlePolicyTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.runtimeBridgeStatusTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.runtimeBridgeStatusTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.officialVendorSdkRequirementTerms\`: ${renderMarkdownCodeList(
      assembly.typescriptAdapterStandard?.officialVendorSdkRequirementTerms ?? [],
    )}`,
    `- \`typescriptAdapterStandard.referenceContract.sdkProvisioning\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.sdkProvisioning ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.bindingStrategy\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.bindingStrategy ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.bundlePolicy\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.bundlePolicy ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.runtimeBridgeStatus\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.runtimeBridgeStatus ?? ''}\``,
    `- \`typescriptAdapterStandard.referenceContract.officialVendorSdkRequirement\`: \`${assembly.typescriptAdapterStandard?.referenceContract?.officialVendorSdkRequirement ?? ''}\``,
  ].join('\n');
  const typeScriptPackageStandardLines = [
    `- \`typescriptPackageStandard.packageNamePattern\`: \`${assembly.typescriptPackageStandard?.packageNamePattern ?? ''}\``,
    `- \`typescriptPackageStandard.sourceModulePattern\`: \`${assembly.typescriptPackageStandard?.sourceModulePattern ?? ''}\``,
    `- \`typescriptPackageStandard.driverFactoryPattern\`: \`${assembly.typescriptPackageStandard?.driverFactoryPattern ?? ''}\``,
    `- \`typescriptPackageStandard.metadataSymbolPattern\`: \`${assembly.typescriptPackageStandard?.metadataSymbolPattern ?? ''}\``,
    `- \`typescriptPackageStandard.moduleSymbolPattern\`: \`${assembly.typescriptPackageStandard?.moduleSymbolPattern ?? ''}\``,
    `- \`typescriptPackageStandard.rootPublicRule\`: \`${assembly.typescriptPackageStandard?.rootPublicRule ?? ''}\``,
  ].join('\n');

  return `# RTC SDK Multilanguage Capability Matrix

This matrix is materialized from \`.sdkwork-assembly.json\` so the official provider tiers, language
support boundaries, and maturity tiers stay exact and verifiable.

## Provider Tier Semantics

${tierSummaryLines}

## Language Maturity Semantics

${languageMaturitySummaryLines}

## Capability Standard

${capabilityStandardLines}

## Capability Negotiation Standard

${capabilityNegotiationStandardLines}

## Runtime Surface Standard

${runtimeSurfaceStandardLines}

## Runtime Immutability Standard

${runtimeImmutabilityStandardLines}

## Root Public Surface Standard

${rootPublicSurfaceStandardLines}

## Lookup Helper Naming Standard

${lookupHelperNamingStandardLines}

## Error Code Standard

${errorCodeStandardLines}

## Provider Extension Standard

${providerExtensionStandardLines}

## TypeScript Adapter Standard

${typeScriptAdapterStandardLines}

## TypeScript Package Standard

${typeScriptPackageStandardLines}

## Capability Catalog

| Capability key | Category | Surface |
| --- | --- | --- |
${capabilityCatalogRows}

## Provider Extension Catalog

| Extension key | Provider key | Display name | Surface | Access | Status |
| --- | --- | --- | --- | --- | --- |
${providerExtensionRows}

## Provider Matrix

| Provider key | Tier | Builtin | Default selected | Display name |
| --- | --- | --- | --- | --- |
${providerRows}

## TypeScript Provider Runtime Baseline

| Provider key | Runtime bridge status | Vendor SDK requirement | SDK provisioning | Binding strategy | Bundle policy |
| --- | --- | --- | --- | --- | --- |
${typeScriptRuntimeRows}

## Language Matrix

| Language | Public package | Control SDK | Runtime bridge | Maturity tier | Current role |
| --- | --- | --- | --- | --- | --- |
${languageRows}

## Language Workspace Catalog Matrix

| Language | Workspace catalog | Public package | Control SDK | Runtime bridge | Maturity tier |
| --- | --- | --- | --- | --- | --- |
${languageWorkspaceCatalogRows}

## Language Provider Package Boundary Matrix

| Language | Mode | Root public policy | Lifecycle status terms | Runtime bridge status terms | Concrete scaffold path |
| --- | --- | --- | --- | --- | --- |
${languageProviderPackageBoundaryRows}

## Reserved Language Package Scaffold Matrix

| Language | Build system | Manifest path | Contract scaffold |
| --- | --- | --- | --- |
${reservedLanguagePackageScaffoldRows}

## Reserved Language Metadata Scaffold Matrix

| Language | Provider catalog | Provider package catalog | Provider activation catalog | Capability catalog | Provider extension catalog | Provider selection |
| --- | --- | --- | --- | --- | --- | --- |
${reservedLanguageMetadataScaffoldRows}

## Reserved Language Resolution Scaffold Matrix

| Language | Driver manager | Data source | Provider support | Provider package loader |
| --- | --- | --- | --- | --- |
${reservedLanguageResolutionScaffoldRows}

## Reserved Language Provider Package Scaffold Matrix

| Language | Scaffold path | Directory pattern | Package pattern | Manifest file name | Readme file name | Source file pattern | Source symbol pattern | Template tokens | Source template tokens | Status | Runtime bridge status | Root public | Default provider package identity | Default provider manifest path | Default provider README path | Default provider source path | Default provider source symbol |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${reservedLanguageProviderPackageScaffoldRows}

## Language Provider Activation Matrix

| Language | Provider key | Activation status | Runtime bridge | Root public | Package boundary |
| --- | --- | --- | --- | --- | --- |
${languageProviderActivationRows}

## Reading Rules

- TypeScript and Flutter are the executable reference baselines in the current landing.
- The remaining official language workspaces are materialized reserved boundaries so the standard stays explicit.
- A provider package boundary may stay reserved even when the root workspace already has a verified runtime bridge.
- A workspace or provider package must not advertise runtime bridge support until it has a verified native bridge.
`;
}

function renderProviderPackageManifest(provider) {
  const packageContract = provider.typescriptPackage;
  const packageJson = {
    name: packageContract.packageName,
    version: '0.1.0',
    private: true,
    description: `Reference TypeScript provider boundary for ${provider.displayName} within sdkwork-rtc-sdk`,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.js',
        default: './index.js',
      },
    },
    sideEffects: false,
    files: ['index.js', 'index.d.ts', 'README.md'],
    sdkworkRtcProvider: {
      providerKey: provider.providerKey,
      displayName: provider.displayName,
      tier: provider.tier,
      builtin: provider.builtin,
      status: provider.builtin
        ? 'root_public_reference_boundary'
        : 'package_reference_boundary',
      registrationContract: 'RtcProviderModule',
      sourceModule: packageContract.sourceModule,
      driverFactory: packageContract.driverFactory,
      metadataSymbol: packageContract.metadataSymbol,
      moduleSymbol: packageContract.moduleSymbol,
      rootPublic: packageContract.rootPublic,
      extensionKeys: provider.extensionKeys ?? [],
      typescriptAdapter: {
        sdkProvisioning: provider.typescriptAdapter.sdkProvisioning,
        bindingStrategy: provider.typescriptAdapter.bindingStrategy,
        bundlePolicy: provider.typescriptAdapter.bundlePolicy,
        runtimeBridgeStatus: provider.typescriptAdapter.runtimeBridgeStatus,
        officialVendorSdkRequirement: provider.typescriptAdapter.officialVendorSdkRequirement,
      },
    },
  };

  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function renderProviderPackageEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;

  return `export {
  ${packageContract.driverFactory},
  ${packageContract.metadataSymbol},
  ${packageContract.moduleSymbol},
} from '../../dist/providers/${provider.providerKey}.js';
`;
}

function renderProviderPackageDeclarationEntrypoint(provider) {
  const packageContract = provider.typescriptPackage;

  return `export {
  ${packageContract.driverFactory},
  ${packageContract.metadataSymbol},
  ${packageContract.moduleSymbol},
} from '../../dist/providers/${provider.providerKey}.js';
`;
}

function renderProviderPackageReadme(provider) {
  const rootExposureRule = provider.builtin
    ? '- the driver factory and provider module symbol may be re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is builtin'
    : '- the driver factory and provider module symbol are not re-exported from the root `@sdkwork/rtc-sdk` entrypoint because this provider is not builtin';
  const packageStatus = provider.builtin
    ? 'root_public_reference_boundary'
    : 'package_reference_boundary';
  const extensionKeys =
    (provider.extensionKeys ?? []).length === 0
      ? '`<none>`'
      : (provider.extensionKeys ?? []).map((extensionKey) => `\`${extensionKey}\``).join(', ');

  return `# ${provider.typescriptPackage.packageName}

Reference TypeScript provider package boundary for ${provider.displayName}.

- provider key: \`${provider.providerKey}\`
- tier: \`${provider.tier}\`
- builtin: \`${provider.builtin}\`
- status: \`${packageStatus}\`
- vendor sdk provisioning: \`${provider.typescriptAdapter.sdkProvisioning}\`
- binding strategy: \`${provider.typescriptAdapter.bindingStrategy}\`
- bundle policy: \`${provider.typescriptAdapter.bundlePolicy}\`
- runtime bridge status: \`${provider.typescriptAdapter.runtimeBridgeStatus}\`
- official vendor sdk requirement: \`${provider.typescriptAdapter.officialVendorSdkRequirement}\`
- provider extension keys: ${extensionKeys}

Rules:

- wraps the official vendor SDK instead of re-implementing media runtime
- depends on the core \`@sdkwork/rtc-sdk\` contracts
- registers through the \`RtcProviderModule\` adapter contract
- ships executable \`index.js\` and \`index.d.ts\` entrypoints
- declares \`exports\` so \`import\` and \`default\` resolve to \`index.js\` and \`types\` resolve
  to \`index.d.ts\`
${rootExposureRule}
`;
}

function renderTypeScriptProviderCatalogEntry(provider) {
  const constantName = `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`;

  return `export const ${constantName}: RtcProviderCatalogEntry = {
  providerKey: ${renderStringLiteral(provider.providerKey)},
  pluginId: ${renderStringLiteral(provider.pluginId)},
  driverId: ${renderStringLiteral(provider.driverId)},
  displayName: ${renderStringLiteral(provider.displayName)},
  defaultSelected: ${provider.defaultSelected ? 'true' : 'false'},
  urlSchemes: ${renderReadonlyStringArray(provider.urlSchemes ?? [])},
  requiredCapabilities: REQUIRED_RTC_CAPABILITIES,
  optionalCapabilities: ${renderReadonlyStringArray(provider.optionalCapabilities ?? [])},
  extensionKeys: ${renderReadonlyStringArray(provider.extensionKeys ?? [])},
  tier: ${renderStringLiteral(provider.tier)},
  builtin: ${provider.builtin ? 'true' : 'false'},
  typescriptAdapter: ${renderTypeScriptAdapterContract(provider.typescriptAdapter)},
  typescriptPackage: ${renderTypeScriptPackageContract(provider.typescriptPackage)},
};`;
}

function renderTypeScriptProviderExtensionCatalogDescriptor(descriptor) {
  const constantName = `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`;

  return `export const ${constantName}: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> = {
  extensionKey: ${renderStringLiteral(descriptor.extensionKey)},
  providerKey: ${renderStringLiteral(descriptor.providerKey)},
  displayName: ${renderStringLiteral(descriptor.displayName)},
  surface: ${renderStringLiteral(descriptor.surface)},
  access: ${renderStringLiteral(descriptor.access)},
  status: ${renderStringLiteral(descriptor.status)},
};`;
}

function renderTypeScriptCapabilityCatalogDescriptor(descriptor) {
  const constantName = `${toUpperSnakeCase(descriptor.capabilityKey)}_RTC_CAPABILITY_DESCRIPTOR`;

  return `export const ${constantName}: RtcCapabilityDescriptor<RtcCapabilityKey> = {
  capabilityKey: ${renderStringLiteral(descriptor.capabilityKey)},
  category: ${renderStringLiteral(descriptor.category)},
  surface: ${renderStringLiteral(descriptor.surface)},
};`;
}

function renderTypeScriptCapabilityCatalog(assembly) {
  const descriptors = assembly.capabilityCatalog ?? [];
  const requiredCapabilities = descriptors
    .filter((descriptor) => descriptor.category === 'required-baseline')
    .map((descriptor) => descriptor.capabilityKey);
  const optionalCapabilities = descriptors
    .filter((descriptor) => descriptor.category === 'optional-advanced')
    .map((descriptor) => descriptor.capabilityKey);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcCapabilityDescriptor } from './types.js';

export const REQUIRED_RTC_CAPABILITIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(requiredCapabilities)});
export const OPTIONAL_RTC_CAPABILITIES = freezeRtcRuntimeValue(${renderReadonlyStringArray(optionalCapabilities)});

export type RtcRequiredCapability = (typeof REQUIRED_RTC_CAPABILITIES)[number];
export type RtcOptionalCapability = (typeof OPTIONAL_RTC_CAPABILITIES)[number];
export type RtcCapabilityKey = RtcRequiredCapability | RtcOptionalCapability;

${descriptors
  .map((descriptor) =>
    renderTypeScriptCapabilityCatalogDescriptor(descriptor).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const RTC_CAPABILITY_CATALOG: readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] = freezeRtcRuntimeValue([
  ${descriptors
    .map((descriptor) => `${toUpperSnakeCase(descriptor.capabilityKey)}_RTC_CAPABILITY_DESCRIPTOR`)
    .join(',\n  ')}
]);

const RTC_CAPABILITY_DESCRIPTOR_BY_KEY = new Map<
  RtcCapabilityKey,
  RtcCapabilityDescriptor<RtcCapabilityKey>
>(RTC_CAPABILITY_CATALOG.map((descriptor) => [descriptor.capabilityKey, descriptor]));

export function getRtcCapabilityCatalog(): readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] {
  return RTC_CAPABILITY_CATALOG;
}

export function getRtcCapabilityDescriptor(
  capabilityKey: RtcCapabilityKey,
): RtcCapabilityDescriptor<RtcCapabilityKey> | undefined {
  return RTC_CAPABILITY_DESCRIPTOR_BY_KEY.get(capabilityKey);
}
`;
}

function renderTypeScriptProviderExtensionCatalog(assembly) {
  const descriptors = assembly.providerExtensionCatalog ?? [];
  const providerKeys = [...new Set(descriptors.map((descriptor) => descriptor.providerKey))];

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderExtensionDescriptor } from './types.js';

export const RTC_PROVIDER_EXTENSION_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    descriptors.map((descriptor) => descriptor.extensionKey),
  )});
export type RtcKnownProviderExtensionKey = (typeof RTC_PROVIDER_EXTENSION_KEYS)[number];

${descriptors
  .map((descriptor) =>
    renderTypeScriptProviderExtensionCatalogDescriptor(descriptor).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const RTC_PROVIDER_EXTENSION_CATALOG: readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = freezeRtcRuntimeValue([
  ${descriptors
    .map(
      (descriptor) =>
        `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`,
    )
    .join(',\n  ')}
]);

const RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY = new Map<
  string,
  RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>
>(RTC_PROVIDER_EXTENSION_CATALOG.map((descriptor) => [descriptor.extensionKey, descriptor]));

const EMPTY_RTC_PROVIDER_EXTENSIONS = freezeRtcRuntimeValue([] as const);

const RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY = new Map<
  string,
  readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[]
>([
${providerKeys
  .map((providerKey) => {
    const descriptorConstants = descriptors
      .filter((descriptor) => descriptor.providerKey === providerKey)
      .map(
        (descriptor) =>
          `${toUpperSnakeCase(descriptor.extensionKey)}_RTC_PROVIDER_EXTENSION_DESCRIPTOR`,
      )
      .join(',\n    ');

    return `  [${renderStringLiteral(providerKey)}, freezeRtcRuntimeValue([\n    ${descriptorConstants}\n  ])],`;
  })
  .join('\n')}
]);

export function getRtcProviderExtensionCatalog(): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSION_CATALOG;
}

export function getRtcProviderExtensionDescriptor(
  extensionKey: string,
): RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey> | undefined {
  return RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
}

export function getRtcProviderExtensionsForProvider(
  providerKey: string,
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  return RTC_PROVIDER_EXTENSIONS_BY_PROVIDER_KEY.get(providerKey) ?? EMPTY_RTC_PROVIDER_EXTENSIONS;
}

export function getRtcProviderExtensions(
  extensionKeys: readonly string[],
): readonly RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] {
  const descriptors: RtcProviderExtensionDescriptor<RtcKnownProviderExtensionKey>[] = [];

  for (const extensionKey of extensionKeys) {
    const descriptor = RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.get(extensionKey);
    if (descriptor) {
      descriptors.push(descriptor);
    }
  }

  return freezeRtcRuntimeValue(descriptors);
}

export function hasRtcProviderExtension(
  extensionKeys: readonly string[],
  extensionKey: string,
): boolean {
  for (const providerExtensionKey of extensionKeys) {
    if (
      providerExtensionKey === extensionKey &&
      RTC_PROVIDER_EXTENSION_DESCRIPTOR_BY_KEY.has(extensionKey)
    ) {
      return true;
    }
  }

  return false;
}
`;
}

function renderTypeScriptProviderActivationCatalog(assembly) {
  const activationEntries = buildTypeScriptProviderActivationCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderActivationEntry } from './types.js';

export const RTC_PROVIDER_ACTIVATION_STATUSES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    PROVIDER_ACTIVATION_STATUSES,
  )});

${activationEntries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_ACTIVATION_ENTRY`;

    return `export const ${constantName}: RtcProviderActivationEntry = freezeRtcRuntimeValue({
  providerKey: ${renderStringLiteral(entry.providerKey)},
  pluginId: ${renderStringLiteral(entry.pluginId)},
  driverId: ${renderStringLiteral(entry.driverId)},
  activationStatus: ${renderStringLiteral(entry.activationStatus)},
  runtimeBridge: ${entry.runtimeBridge ? 'true' : 'false'},
  rootPublic: ${entry.rootPublic ? 'true' : 'false'},
  packageBoundary: ${entry.packageBoundary ? 'true' : 'false'},
  builtin: ${entry.builtin ? 'true' : 'false'},
  packageIdentity: ${renderStringLiteral(entry.packageIdentity)},
});`;
  })
  .join('\n\n')}

export const RTC_PROVIDER_ACTIVATION_CATALOG: readonly RtcProviderActivationEntry[] = freezeRtcRuntimeValue([
  ${activationEntries
    .map((entry) => `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_ACTIVATION_ENTRY`)
    .join(',\n  ')}
]);

const RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY = new Map<
  string,
  RtcProviderActivationEntry
>(RTC_PROVIDER_ACTIVATION_CATALOG.map((entry) => [entry.providerKey, entry]));

export function getRtcProviderActivationCatalog(): readonly RtcProviderActivationEntry[] {
  return RTC_PROVIDER_ACTIVATION_CATALOG;
}

export function getRtcProviderActivationByProviderKey(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return RTC_PROVIDER_ACTIVATION_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderActivation(
  providerKey: string,
): RtcProviderActivationEntry | undefined {
  return getRtcProviderActivationByProviderKey(providerKey);
}
`;
}

function renderTypeScriptProviderPackageCatalog(assembly) {
  const packageEntries = buildTypeScriptProviderPackageCatalogEntries(assembly);

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcProviderPackageCatalogEntry } from './types.js';

export const RTC_PROVIDER_PACKAGE_STATUSES = freezeRtcRuntimeValue(${renderReadonlyStringArray(
    REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
  )});

${packageEntries
  .map((entry) => {
    const constantName = `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_PACKAGE_ENTRY`;

    return `export const ${constantName}: RtcProviderPackageCatalogEntry = freezeRtcRuntimeValue({
  providerKey: ${renderStringLiteral(entry.providerKey)},
  pluginId: ${renderStringLiteral(entry.pluginId)},
  driverId: ${renderStringLiteral(entry.driverId)},
  packageIdentity: ${renderStringLiteral(entry.packageIdentity)},
  manifestPath: ${renderStringLiteral(entry.manifestPath)},
  readmePath: ${renderStringLiteral(entry.readmePath)},
  sourcePath: ${renderStringLiteral(entry.sourcePath)},
  declarationPath: ${renderStringLiteral(entry.declarationPath)},
  sourceSymbol: ${renderStringLiteral(entry.sourceSymbol)},
  sourceModule: ${renderStringLiteral(entry.sourceModule)},
  driverFactory: ${renderStringLiteral(entry.driverFactory)},
  metadataSymbol: ${renderStringLiteral(entry.metadataSymbol)},
  moduleSymbol: ${renderStringLiteral(entry.moduleSymbol)},
  builtin: ${entry.builtin ? 'true' : 'false'},
  rootPublic: ${entry.rootPublic ? 'true' : 'false'},
  status: ${renderStringLiteral(entry.status)},
  runtimeBridgeStatus: ${renderStringLiteral(entry.runtimeBridgeStatus)},
  extensionKeys: freezeRtcRuntimeValue(${renderReadonlyStringArray(entry.extensionKeys)}),
});`;
  })
  .join('\n\n')}

export const RTC_PROVIDER_PACKAGE_CATALOG: readonly RtcProviderPackageCatalogEntry[] = freezeRtcRuntimeValue([
  ${packageEntries
    .map((entry) => `${toUpperSnakeCase(entry.providerKey)}_RTC_PROVIDER_PACKAGE_ENTRY`)
    .join(',\n  ')}
]);

const RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.providerKey, entry]),
);

const RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY = new Map<string, RtcProviderPackageCatalogEntry>(
  RTC_PROVIDER_PACKAGE_CATALOG.map((entry) => [entry.packageIdentity, entry]),
);

export function getRtcProviderPackageCatalog(): readonly RtcProviderPackageCatalogEntry[] {
  return RTC_PROVIDER_PACKAGE_CATALOG;
}

export function getRtcProviderPackageByProviderKey(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PROVIDER_KEY.get(providerKey);
}

export function getRtcProviderPackageByPackageIdentity(
  packageIdentity: string,
): RtcProviderPackageCatalogEntry | undefined {
  return RTC_PROVIDER_PACKAGE_BY_PACKAGE_IDENTITY.get(packageIdentity);
}

export function getRtcProviderPackage(
  providerKey: string,
): RtcProviderPackageCatalogEntry | undefined {
  return getRtcProviderPackageByProviderKey(providerKey);
}
`;
}

function renderTypeScriptProviderCatalog(assembly) {
  const providers = assembly.providers ?? [];
  const builtinProviders = providers.filter((provider) => provider.builtin);
  const defaults = assembly.defaults ?? {};

  return `import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import { REQUIRED_RTC_CAPABILITIES } from './capability-catalog.js';
import type { RtcProviderCatalogEntry } from './types.js';

export const DEFAULT_RTC_PROVIDER_KEY = ${renderStringLiteral(defaults.providerKey)};
export const DEFAULT_RTC_PROVIDER_PLUGIN_ID = ${renderStringLiteral(defaults.pluginId)};
export const DEFAULT_RTC_PROVIDER_DRIVER_ID = ${renderStringLiteral(defaults.driverId)};
export const BUILTIN_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
  builtinProviders.map((provider) => provider.providerKey),
)});
export const OFFICIAL_RTC_PROVIDER_KEYS = freezeRtcRuntimeValue(${renderReadonlyStringArray(
  providers.map((provider) => provider.providerKey),
)});

${providers
  .map((provider) =>
    renderTypeScriptProviderCatalogEntry(provider).replace(
      ' = {',
      ' = freezeRtcRuntimeValue({',
    ).replace('\n};', '\n});'),
  )
  .join('\n\n')}

export const BUILTIN_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  ${builtinProviders
    .map((provider) => `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`)
    .join(',\n  ')}
]);

export const OFFICIAL_RTC_PROVIDER_CATALOG: readonly RtcProviderCatalogEntry[] = freezeRtcRuntimeValue([
  ${providers
    .map((provider) => `${toUpperSnakeCase(provider.providerKey)}_RTC_PROVIDER_CATALOG_ENTRY`)
    .join(',\n  ')}
]);

const BUILTIN_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  BUILTIN_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

const OFFICIAL_RTC_PROVIDER_BY_KEY = new Map<string, RtcProviderCatalogEntry>(
  OFFICIAL_RTC_PROVIDER_CATALOG.map((provider) => [provider.providerKey, provider]),
);

export function getBuiltinRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return BUILTIN_RTC_PROVIDER_CATALOG;
}

export function getBuiltinRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return BUILTIN_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getOfficialRtcProviderMetadata(): readonly RtcProviderCatalogEntry[] {
  return OFFICIAL_RTC_PROVIDER_CATALOG;
}

export function getOfficialRtcProviderMetadataByKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return OFFICIAL_RTC_PROVIDER_BY_KEY.get(providerKey);
}

export function getRtcProviderByProviderKey(
  providerKey: string,
): RtcProviderCatalogEntry | undefined {
  return getOfficialRtcProviderMetadataByKey(providerKey);
}
`;
}

export function materializeRtcSdkWorkspace(workspaceRoot) {
  const changedFiles = [];

  for (const entry of buildRtcSdkMaterializationPlan(workspaceRoot)) {
    writeIfChanged(
      workspaceRoot,
      path.join(workspaceRoot, entry.relativePath),
      entry.content,
      changedFiles,
    );
  }

  for (const relativePath of RTC_SDK_STALE_MATERIALIZED_FILES) {
    removeIfExists(workspaceRoot, path.join(workspaceRoot, relativePath), changedFiles);
  }

  return { changedFiles };
}

export function buildRtcSdkMaterializationPlan(workspaceRoot) {
  const assemblyPath = path.join(workspaceRoot, '.sdkwork-assembly.json');
  const assembly = readJsonFile(assemblyPath);
  assertRtcAssemblyWorkspaceBaseline(assembly);

  const entries = [
    ...RTC_TEMPLATE_MATERIALIZATION_ASSETS.map((asset) => ({
      relativePath: asset.materializedRelativePath,
      content: readMaterializedTemplate(workspaceRoot, asset.templateRelativePath),
    })),
    {
      relativePath: 'docs/multilanguage-capability-matrix.md',
      content: renderCapabilityMatrix(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/capability-catalog.ts',
      content: renderTypeScriptCapabilityCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts',
      content: renderTypeScriptLanguageWorkspaceCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts',
      content: renderTypeScriptProviderExtensionCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/runtime-surface.ts',
      content: renderTypeScriptRuntimeSurface(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts',
      content: renderTypeScriptRuntimeImmutability(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/root-public-surface.ts',
      content: renderTypeScriptRootPublicSurface(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts',
      content: renderTypeScriptLookupHelperNaming(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts',
      content: renderTypeScriptProviderPackageCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts',
      content: renderTypeScriptProviderActivationCatalog(assembly),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/src/provider-catalog.ts',
      content: renderTypeScriptProviderCatalog(assembly),
    },
  ];

  for (const languageEntry of assembly.languages ?? []) {
    entries.push({
      relativePath: `${languageEntry.workspace}/README.md`,
      content: renderLanguageWorkspaceReadme(languageEntry, assembly),
    });

    if (languageEntry.language !== 'typescript') {
      entries.push(...buildReservedLanguageMaterializationPlan(languageEntry, assembly));
    }
  }

  for (const provider of assembly.providers ?? []) {
    const providerPackageDir = path.posix.join(
      'sdkwork-rtc-sdk-typescript',
      'providers',
      `rtc-sdk-provider-${provider.providerKey}`,
    );

    entries.push({
      relativePath: `${providerPackageDir}/package.json`,
      content: renderProviderPackageManifest(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/index.js`,
      content: renderProviderPackageEntrypoint(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/index.d.ts`,
      content: renderProviderPackageDeclarationEntrypoint(provider),
    });
    entries.push({
      relativePath: `${providerPackageDir}/README.md`,
      content: renderProviderPackageReadme(provider),
    });
  }

  return entries;
}

const workspaceRoot = resolveRtcSdkWorkspaceRoot(import.meta.url);
const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
const isCliEntry = invokedPath === import.meta.url;

if (isCliEntry) {
  const result = materializeRtcSdkWorkspace(workspaceRoot);
  if (result.changedFiles.length === 0) {
    console.log('[sdkwork-rtc-sdk] materialization already up to date');
  } else {
    console.log('[sdkwork-rtc-sdk] materialized standard assets:');
    for (const changedFile of result.changedFiles) {
      console.log(`- ${changedFile}`);
    }
  }
}
