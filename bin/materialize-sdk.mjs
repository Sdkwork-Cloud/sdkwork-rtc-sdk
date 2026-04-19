#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReservedLanguageMaterializationPlan } from './materialize-sdk-reserved-scaffolds.mjs';

export const RTC_SDK_STALE_MATERIALIZED_FILES = [
  'sdkwork-rtc-sdk-typescript/src/providers/catalog.ts',
];

const PROVIDER_TIER_SUMMARIES = {
  'tier-a': 'Built-in baseline providers',
  'tier-b': 'Official extension targets with reserved adapter positions',
  'tier-c': 'Future SPI targets',
};

const PROVIDER_ACTIVATION_STATUSES = [
  'root-public-builtin',
  'package-boundary',
  'control-metadata-only',
];

const PROVIDER_PACKAGE_CATALOG_STATUSES = [
  'root_public_reference_boundary',
  'package_reference_boundary',
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readMaterializedTemplate(workspaceRoot, relativePath) {
  return readFileSync(path.join(workspaceRoot, 'bin', 'templates', relativePath), 'utf8');
}

function toPascalCase(value) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toUpperSnakeCase(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
}

function renderStringLiteral(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderReadonlyStringArray(values) {
  return `[${values.map((value) => renderStringLiteral(value)).join(', ')}] as const`;
}

function renderMarkdownCodeList(values) {
  return (values ?? []).map((value) => `\`${value}\``).join(', ');
}

function materializeProviderPackagePattern(pattern, providerKey) {
  return String(pattern)
    .replaceAll('{providerKey}', providerKey)
    .replaceAll('{providerPascal}', toPascalCase(providerKey));
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
    (assembly.providers ?? []).find((provider) => provider.providerKey === assembly.defaults?.providerKey)
      ?.typescriptAdapter ??
    (assembly.providers ?? [])[0]?.typescriptAdapter ?? {
      sdkProvisioning: 'consumer-supplied',
      bindingStrategy: 'native-factory',
      bundlePolicy: 'must-not-bundle',
      runtimeBridgeStatus: 'reference-baseline',
      officialVendorSdkRequirement: 'required',
    }
  );
}

function writeIfChanged(workspaceRoot, filePath, nextContent, changedFiles) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const currentContent = existsSync(filePath) ? readFileSync(filePath, 'utf8') : null;
  if (currentContent !== nextContent) {
    writeFileSync(filePath, nextContent, 'utf8');
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
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, and language workspace by language
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
`;
}

function renderLanguageWorkspaceProviderPackageBoundary(languageEntry) {
  if (!languageEntry.providerPackageBoundary) {
    return '';
  }

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
`;
}

function describeProviderActivationStatus(activationStatus) {
  switch (activationStatus) {
    case 'root-public-builtin':
      return {
        runtimeBridge: 'Yes',
        rootPublic: 'Yes',
        packageBoundary: 'Yes',
      };
    case 'package-boundary':
      return {
        runtimeBridge: 'Yes',
        rootPublic: 'No',
        packageBoundary: 'Yes',
      };
    case 'control-metadata-only':
      return {
        runtimeBridge: 'No',
        rootPublic: 'No',
        packageBoundary: 'No',
      };
    default:
      return {
        runtimeBridge: 'No',
        rootPublic: 'No',
        packageBoundary: 'No',
      };
  }
}

function buildTypeScriptProviderActivationCatalogEntries(assembly) {
  const typescriptLanguage = (assembly.languages ?? []).find(
    (languageEntry) => languageEntry.language === 'typescript',
  );
  const providerByKey = new Map((assembly.providers ?? []).map((provider) => [provider.providerKey, provider]));

  return (typescriptLanguage?.providerActivations ?? []).map((providerActivation) => {
    const provider = providerByKey.get(providerActivation.providerKey);
    if (!provider) {
      throw new Error(`Unknown TypeScript provider activation: ${providerActivation.providerKey}`);
    }

    const activationStatus = providerActivation.activationStatus;

    return {
      providerKey: provider.providerKey,
      pluginId: provider.pluginId,
      driverId: provider.driverId,
      activationStatus,
      runtimeBridge: activationStatus !== 'control-metadata-only',
      rootPublic: activationStatus === 'root-public-builtin',
      packageBoundary: activationStatus !== 'control-metadata-only',
      builtin: provider.builtin === true,
      packageIdentity: provider.typescriptPackage.packageName,
    };
  });
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
- workspace catalog entries also keep \`workspaceCatalogRelativePath\` plus any declared
  \`metadataScaffold\`, \`resolutionScaffold\`, \`providerPackageBoundary\`, and
  \`providerPackageScaffold\` boundaries so consumers can inspect official assembly-driven module
  locations without rereading the assembly.
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
  metadataScaffold: ${renderTypeScriptLanguageWorkspaceMetadataScaffold(entry.metadataScaffold)},
  resolutionScaffold: ${renderTypeScriptLanguageWorkspaceResolutionScaffold(entry.resolutionScaffold)},
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
    'standard provider support helpers at src/provider-support.ts',
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
${renderLanguageWorkspaceCatalogSection(languageEntry)}
${renderLanguageWorkspaceProviderPackageBoundary(languageEntry)}
${renderReservedLanguagePackageScaffold(languageEntry)}
${renderReservedLanguageMetadataScaffold(languageEntry)}
${renderReservedLanguageResolutionScaffold(languageEntry)}
${renderReservedLanguageProviderPackageScaffold(languageEntry)}

Standards references:

- \`../docs/provider-adapter-standard.md\`
- \`../docs/multilanguage-capability-matrix.md\`
`;
}

function renderDocsReadme() {
  return `# SDKWork RTC SDK Internal Docs

Use this directory when you need the exact internal standards for \`sdkwork-rtc-sdk\`.

Current docs:

- \`package-standards.md\`
  Naming, ownership, and public package rules.
- \`provider-adapter-standard.md\`
  JDBC-style driver and adapter rules.
- \`multilanguage-capability-matrix.md\`
  Capability catalog, provider extension catalog, provider tiers, language roles, maturity tiers,
  runtime support boundaries, assembly-driven language workspace catalog paths, cross-language
  \`providerPackageBoundary\` modes and root-public policies, TypeScript runtime bridge baselines,
  reserved language package/build scaffolds, reserved language metadata scaffolds, reserved
  language provider activation catalog scaffolds, reserved language resolution scaffolds, reserved
  language provider package scaffolds and materialized future provider package boundaries with
  template token, source file, source symbol, reserved status, and root public exposure contracts,
  and language-provider activation matrix.
- \`verification-matrix.md\`
  Root verification expectations and commands.

The TypeScript executable baseline fixes these standard modules as the executable source of truth:

- capability catalog: \`sdkwork-rtc-sdk-typescript/src/capability-catalog.ts\`
  Includes \`getRtcCapabilityCatalog(...)\` and \`getRtcCapabilityDescriptor(...)\` so capability
  metadata stays queryable by capability key.
- provider catalog: \`sdkwork-rtc-sdk-typescript/src/provider-catalog.ts\`
  Includes \`getBuiltinRtcProviderMetadataByKey(...)\` and
  \`getOfficialRtcProviderMetadataByKey(...)\`, plus the cross-language alias
  \`getRtcProviderByProviderKey(...)\`, so provider lookup by key stays standardized.
- provider activation catalog: \`sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts\`
  Includes \`getRtcProviderActivationByProviderKey(...)\` so provider activation lookup stays
  standardized by provider key.
- provider selection: \`sdkwork-rtc-sdk-typescript/src/provider-selection.ts\`
  Keeps JDBC-style provider selection precedence explicit.
- provider support: \`sdkwork-rtc-sdk-typescript/src/provider-support.ts\`
  Keeps provider support classification and support-state construction explicit.
- provider package catalog: \`sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts\`
  Includes \`getRtcProviderPackageByProviderKey(...)\` and
  \`getRtcProviderPackageByPackageIdentity(...)\` so one-provider package boundaries stay
  queryable by provider key and package identity.
- provider package loader: \`sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts\`
  Includes \`createRtcProviderPackageLoader(...)\`, \`resolveRtcProviderPackageLoadTarget(...)\`,
  \`loadRtcProviderModule(...)\`, \`installRtcProviderPackage(...)\`, and
  \`installRtcProviderPackages(...)\` so package-boundary adapters can be loaded and installed
  through one standard SPI instead of ad hoc application wiring.
- provider extension catalog: \`sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts\`
  Includes \`getRtcProviderExtensionCatalog(...)\`, \`getRtcProviderExtensionDescriptor(...)\`,
  \`getRtcProviderExtensionsForProvider(...)\`, \`getRtcProviderExtensions(...)\`, and
  \`hasRtcProviderExtension(...)\` so extension metadata stays queryable by extension key,
  provider key, and selected extension set.
- language workspace catalog: \`sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts\`
  Includes \`getRtcLanguageWorkspaceByLanguage(...)\` so the official language matrix stays
  queryable by language key inside the executable baseline.
  Each \`RtcLanguageWorkspaceCatalogEntry\` also declares \`providerPackageBoundary\` so
  package-boundary semantics stay explicit across languages instead of being inferred from
  TypeScript-only package manifests or reserved-language scaffold prose.
  TypeScript stays \`catalog-governed-mixed\` with \`rootPublicPolicy\` set to \`builtin-only\`,
  while reserved languages stay \`scaffold-per-provider-package\` with \`rootPublicPolicy\` set to
  \`none\`.

Reserved non-TypeScript language workspace catalogs and metadata scaffolds must also keep explicit
lookup helpers stable with language-idiomatic naming. The required helper families remain:

- capability catalog by capability key
- provider catalog by provider key
- provider package by provider key
- provider package by package identity
- provider activation by provider key
- provider extension catalog by extension key and provider key
- language workspace by language

Canonical naming forms:

- Flutter, Java, Swift, Kotlin: \`getRtcProviderByProviderKey(...)\`,
  \`getRtcProviderPackageByProviderKey(...)\`, \`getRtcProviderPackageByPackageIdentity(...)\`,
  \`getRtcProviderActivationByProviderKey(...)\`,
  \`getRtcCapabilityDescriptor(...)\`, \`getRtcProviderExtensionDescriptor(...)\`,
  \`getRtcProviderExtensionsForProvider(...)\`, \`hasRtcProviderExtension(...)\`,
  \`getRtcLanguageWorkspaceByLanguage(...)\`
- C#, Go: \`GetRtcProviderByProviderKey(...)\`,
  \`GetRtcProviderPackageByProviderKey(...)\`, \`GetRtcProviderPackageByPackageIdentity(...)\`,
  \`GetRtcProviderActivationByProviderKey(...)\`,
  \`GetRtcCapabilityDescriptor(...)\`, \`GetRtcProviderExtensionDescriptor(...)\`,
  \`GetRtcProviderExtensionsForProvider(...)\`, \`HasRtcProviderExtension(...)\`,
  \`GetRtcLanguageWorkspaceByLanguage(...)\`
- Rust, Python: \`get_rtc_provider_by_provider_key(...)\`,
  \`get_rtc_provider_package_by_provider_key(...)\`,
  \`get_rtc_provider_package_by_package_identity(...)\`, \`get_rtc_provider_activation_by_provider_key(...)\`,
  \`get_rtc_capability_descriptor(...)\`, \`get_rtc_provider_extension_descriptor(...)\`,
  \`get_rtc_provider_extensions_for_provider(...)\`, \`has_rtc_provider_extension(...)\`,
  \`get_rtc_language_workspace_by_language(...)\`

Reserved root public entrypoints must also stay standardized wherever the language ecosystem uses a
single package barrel or package initializer:

- Flutter root barrel: \`sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart\`
- Python package root: \`sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py\`

Those root public entrypoints must re-expose the standard contract, provider catalog, provider
package catalog, provider activation catalog, capability catalog, provider extension catalog,
language workspace catalog, provider selection helpers, provider package loader helpers, provider
support helpers, driver manager, and data source modules so downstream consumers never need deep
imports for standardized RTC metadata or selection behavior.

Go reserved-language public structs must also export their shared DTO fields in PascalCase, such as
\`ProviderKey\`, \`PluginId\`, \`DriverId\`, \`PackageIdentity\`, \`RuntimeBridgeStatus\`,
\`DefaultSelected\`, and \`RoleHighlights\`, so package consumers can inspect and construct
standardized values directly without local wrapper types.

The TypeScript executable workspace also reserves one-provider-only package boundaries under
\`sdkwork-rtc-sdk-typescript/providers/\`.
The root \`bin/materialize-sdk.mjs\` command rematerializes \`docs/multilanguage-capability-matrix.md\`, assembly-driven language workspace READMEs, the TypeScript provider package catalog at \`sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts\`, assembly-driven language workspace catalog assets, reserved language package/build/contract/metadata/provider-package-catalog/provider-activation-catalog/resolution/provider-package-loader/provider-package scaffolds with exact template token and root-public policies, materialized future provider package boundary READMEs and manifests, and provider package standard assets materialized from \`.sdkwork-assembly.json\`.
Reserved non-TypeScript provider package boundaries also materialize one metadata-only source stub
per official provider so future runtime bridge work inherits a deterministic code-entry layout.
The manual TypeScript provider package loader SPI at
\`sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts\` then turns those package-boundary
contracts into a standard load-and-install path for pluggable provider adapters.
Reserved non-TypeScript language workspaces now also materialize a future provider package loader
scaffold per language so runtime bridge work inherits a deterministic package-resolution and
installation boundary before executable adapters land.
The root \`bin/smoke-sdk.mjs\` command is the full regression entrypoint. It runs materialization,
root automation tests, root verification, TypeScript package tests, and optional language smoke
checks such as \`compileall\`, \`cargo check\`, \`dotnet build\`, and \`javac\` when those
toolchains are available.
The root \`.gitignore\` defines the non-source artifact boundary for verification outputs such as
\`dist/\`, \`target/\`, \`bin/\`, \`obj/\`, and \`__pycache__/\`, while
\`.sdkwork-assembly.json\` remains checked-in source of truth.
`;
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
        return `| ${languageEntry.displayName} | \`${providerActivation.providerKey}\` | \`${providerActivation.activationStatus}\` | ${activationDetails.runtimeBridge} | ${activationDetails.rootPublic} | ${activationDetails.packageBoundary} |`;
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
        const defaultProviderKey = assembly.defaults?.providerKey ?? 'volcengine';
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
  const tierSummaryLines = Object.entries(PROVIDER_TIER_SUMMARIES)
    .map(([tier, summary]) => `- \`${tier}\`: ${summary}`)
    .join('\n');

  return `# RTC SDK Multilanguage Capability Matrix

This matrix is materialized from \`.sdkwork-assembly.json\` so the official provider tiers, language
support boundaries, and maturity tiers stay exact and verifiable.

## Provider Tier Semantics

${tierSummaryLines}

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

- TypeScript is the only executable reference baseline in the first landing.
- Other official language workspaces are materialized reserved boundaries now so the standard stays explicit.
- A workspace must not advertise runtime bridge support until it has a verified native bridge.
`;
}

function renderProvidersDirectoryReadme() {
  return `# RTC TypeScript Provider Packages

This directory materializes one-provider-only TypeScript package boundaries for official RTC adapters.

Rules:

- one directory per official provider
- provider package identity is assembly-driven through each provider \`typescriptPackage\` contract
- runtime registration uses the \`RtcProviderModule\` contract
- every provider package must ship executable \`index.js\` and \`index.d.ts\` entrypoints
- every provider package must declare \`exports\` that map \`import\` and \`default\` to
  \`index.js\` and \`types\` to \`index.d.ts\`
- every package manifest must declare \`sourceModule\`, \`driverFactory\`, \`metadataSymbol\`, and
  \`moduleSymbol\`
- every package manifest must declare the provider extension keys bound to that provider package
- the assembly-driven machine-readable package boundary catalog lives at
  \`../src/provider-package-catalog.ts\`
- package boundary statuses are standardized as \`root_public_reference_boundary\` for builtin root-public
  packages and \`package_reference_boundary\` for non-builtin executable package boundaries
- every package manifest must declare the TypeScript vendor SDK contract:
  \`consumer-supplied\` provisioning, \`native-factory\` binding, \`must-not-bundle\`
  bundle policy, \`reference-baseline\` runtime bridge status, and official vendor SDK requirement of \`required\`
- built-in providers are the only provider packages whose driver factory and module symbol may be
  re-exported from the root \`@sdkwork/rtc-sdk\` entrypoint
- the root \`@sdkwork/rtc-sdk\` package does not re-export future non-builtin provider packages
- each provider package wraps the official vendor SDK instead of re-implementing media runtime
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
    PROVIDER_PACKAGE_CATALOG_STATUSES,
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
  const assembly = readJson(assemblyPath);
  const entries = [
    {
      relativePath: 'docs/README.md',
      content: renderDocsReadme(),
    },
    {
      relativePath: 'docs/package-standards.md',
      content: readMaterializedTemplate(workspaceRoot, 'package-standards.md'),
    },
    {
      relativePath: 'docs/provider-adapter-standard.md',
      content: readMaterializedTemplate(workspaceRoot, 'provider-adapter-standard.md'),
    },
    {
      relativePath: 'docs/multilanguage-capability-matrix.md',
      content: renderCapabilityMatrix(assembly),
    },
    {
      relativePath: 'docs/verification-matrix.md',
      content: readMaterializedTemplate(workspaceRoot, 'verification-matrix.md'),
    },
    {
      relativePath: 'sdkwork-rtc-sdk-typescript/providers/README.md',
      content: renderProvidersDirectoryReadme(),
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

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..');
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
