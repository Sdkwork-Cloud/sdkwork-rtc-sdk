# SDKWork RTC SDK Workspace

`sdkwork-rtc-sdk` is the provider-standard RTC SDK workspace for Craw Chat.

It is a workspace, not a single package. The workspace owns:

- the JDBC-style RTC provider integration standard
- provider-neutral RTC contracts and capability vocabulary
- official provider adapter naming, selection, and verification rules
- reserved provider package boundaries for one-provider-only adapter extraction
- the executable TypeScript reference implementation
- the official multi-language workspace family for `typescript`, `flutter`, `rust`, `java`,
  `csharp`, `swift`, `kotlin`, `go`, and `python`
- code-level contract scaffold boundaries for reserved language workspaces
- package/build scaffold boundaries for reserved language workspaces
- provider package scaffold boundaries for reserved language workspaces
- materialized future provider package manifest and README boundaries for reserved language workspaces
- materialized metadata-only source stub boundaries for reserved language provider packages
- metadata/catalog scaffold boundaries for reserved language workspaces
- metadata-only driver manager, data source, provider support, and provider package loader
  scaffold boundaries for reserved language workspaces
- package-level documentation for provider adapters, capability matrices, and verification

## Scope

This workspace standardizes:

- provider driver discovery and selection
- the explicit TypeScript provider selection contract at
  `sdkwork-rtc-sdk-typescript/src/provider-selection.ts`
- the explicit TypeScript provider support contract at
  `sdkwork-rtc-sdk-typescript/src/provider-support.ts`
- provider metadata and capability declaration from one assembly source of truth
- explicit capability negotiation and degradation with surface-aware results
- assembly-driven RTC error vocabulary and fallback semantics
- provider extension metadata and escape hatch contracts from one assembly source of truth
- assembly-driven default provider constants materialized into the core catalog
- assembly-driven provider-tier and language-maturity documentation
- assembly-driven `capabilityStandard`, `capabilityNegotiationStandard`,
  `errorCodeStandard`, `providerExtensionStandard`, `providerTierStandard`, and
  `languageMaturityStandard` vocabularies
- assembly-driven `typescriptAdapterStandard` and `typescriptPackageStandard` contracts for
  TypeScript provider adapter and package identity normalization
- assembly-driven language workspace identity, role, summary, and default-provider contracts
- assembly-driven language workspace catalog contracts across the TypeScript baseline and reserved
  language workspaces
- assembly-driven language-provider activation matrix contracts
- assembly-driven provider activation catalog contracts across the TypeScript baseline and reserved
  language workspaces
- assembly-driven provider package catalog contracts across the TypeScript baseline and reserved
  language workspaces
- standard TypeScript provider package loader and installer SPI for package-boundary adapter loading
- assembly-driven TypeScript vendor SDK package contracts
- assembly-driven TypeScript runtime bridge baseline contracts
- assembly-driven reserved provider package template token, source file, source symbol, lifecycle
  status, and root-public exposure contracts for future non-TypeScript provider packages
- provider-neutral client and data-source interfaces
- built-in provider adapter baselines for `volcengine`, `aliyun`, and `tencent`
- future provider adapter positions for `agora`, `zego`, `livekit`, `twilio`, `jitsi`, `janus`,
  and `mediasoup`
- cross-language control-plane and runtime-bridge boundaries

This workspace does not:

- re-implement vendor media engines
- claim uniform support for all provider-specific advanced features
- turn RTC runtime integration into an OpenAPI-generated transport problem

## Current Standard Baseline

The workspace follows a JDBC-inspired architecture:

- `RtcProviderDriver`
- `RtcDriverManager`
- `RtcDataSource`
- `RtcClient`
- `RtcProviderMetadata`
- `RtcSdkException`
- `unwrap()`

RTC-specific additions to that JDBC model are mandatory:

- explicit `RtcCapabilitySet`
- provider degradation rules
- capability negotiation statuses `supported`, `degraded`, and `unsupported`
- stable runtime surface methods `join`, `leave`, `publish`, `unpublish`, `muteAudio`, and
  `muteVideo`
- provider extension escape hatches
- explicit runtime bridge failure semantics through `native_sdk_not_available`

Capability negotiation must stay explicit.
If all requested capabilities are present, the result is `supported`.
If required capabilities are present but optional capabilities are missing, the result is `degraded`.
If any required capability is missing, the result is `unsupported`.

The top-level assembly also fixes the shared vocabulary standards:

- `capabilityStandard.categoryTerms`
- `capabilityStandard.surfaceTerms`
- `capabilityNegotiationStandard.statusTerms`
- `capabilityNegotiationStandard.statusRules`
- `errorCodeStandard.codeTerms`
- `errorCodeStandard.fallbackCode`
- `providerExtensionStandard.accessTerms`
- `providerExtensionStandard.statusTerms`
- `providerTierStandard.tierTerms`
- `providerTierStandard.tierSummaries`
- `languageMaturityStandard.tierTerms`
- `languageMaturityStandard.tierSummaries`
- `typescriptAdapterStandard.sdkProvisioningTerms`
- `typescriptAdapterStandard.bindingStrategyTerms`
- `typescriptAdapterStandard.bundlePolicyTerms`
- `typescriptAdapterStandard.runtimeBridgeStatusTerms`
- `typescriptAdapterStandard.officialVendorSdkRequirementTerms`
- `typescriptAdapterStandard.referenceContract`
- `typescriptPackageStandard.packageNamePattern`
- `typescriptPackageStandard.sourceModulePattern`
- `typescriptPackageStandard.driverFactoryPattern`
- `typescriptPackageStandard.metadataSymbolPattern`
- `typescriptPackageStandard.moduleSymbolPattern`
- `typescriptPackageStandard.rootPublicRule`

The runtime surface is standardized, but vendor media engines are still consumer-supplied.
Provider adapters delegate runtime work through a consumer-supplied runtime bridge bound to the
official vendor SDK. If no runtime bridge is supplied, the stable runtime methods must fail
explicitly with `native_sdk_not_available` instead of pretending a provider-neutral RTC engine
exists.

## Default Provider

The default provider remains `volcengine`, aligned with the current platform runtime provider
registry and existing built-in adapters under:

- `adapters/rtc-volcengine`
- `adapters/rtc-aliyun`
- `adapters/rtc-tencent`

The root assembly and the materialized TypeScript catalog are the single source of truth for that
default selection. The core provider catalog at
`sdkwork-rtc-sdk-typescript/src/provider-catalog.ts` must expose:

- `DEFAULT_RTC_PROVIDER_KEY`
- `DEFAULT_RTC_PROVIDER_PLUGIN_ID`
- `DEFAULT_RTC_PROVIDER_DRIVER_ID`
- `getBuiltinRtcProviderMetadataByKey(...)`
- `getOfficialRtcProviderMetadataByKey(...)`
- `getRtcProviderByProviderKey(...)`

The TypeScript selection helper module at
`sdkwork-rtc-sdk-typescript/src/provider-selection.ts` fixes the standard precedence order:

- `provider_url`
- `provider_key`
- `tenant_override`
- `deployment_profile`
- `default_provider`

It must also keep `parseRtcProviderUrl(...)` and `resolveRtcProviderSelection(...)` stable so
selection behavior stays explicit instead of being hidden inside driver-manager internals.
Reserved non-TypeScript workspaces must preserve the same semantics through standalone
provider-selection helper modules with language-idiomatic names, stable source and precedence
catalogs, explicit provider-URL parsing helpers, and a driver-manager delegation rule:
`RtcDriverManager` resolves selection by calling the provider-selection helper module instead of
re-embedding precedence logic.

The TypeScript provider-support helper module at
`sdkwork-rtc-sdk-typescript/src/provider-support.ts` fixes the support-status contract for
provider discovery and registration introspection. The stable status set is:

- `builtin_registered`
- `official_registered`
- `official_unregistered`
- `unknown`

It must also keep `resolveRtcProviderSupportStatus(...)` and `createRtcProviderSupportState(...)`
stable so provider-support classification stays explicit instead of being reimplemented ad hoc
across runtime entrypoints.
Reserved non-TypeScript workspaces must preserve the same semantics through standalone
provider-support helper modules with language-idiomatic names, explicit
`RtcProviderSupportStateRequest` contracts, stable support-status catalogs, and a driver-manager
delegation rule: provider-support description must flow through the support helper after querying
the provider catalog and provider-activation catalog, not through ad hoc inline status logic.

The TypeScript capability catalog module at `sdkwork-rtc-sdk-typescript/src/capability-catalog.ts`
must also keep `getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)` stable so
capability metadata stays queryable by capability key instead of being reimplemented through ad hoc
array scans.

The TypeScript capability negotiation module at
`sdkwork-rtc-sdk-typescript/src/capability-negotiation.ts` must also keep
`RTC_CAPABILITY_NEGOTIATION_STATUSES`, `RTC_CAPABILITY_NEGOTIATION_RULES`, and
`resolveRtcCapabilityNegotiationStatus(...)` stable so negotiation outcomes and downgrade rules stay
assembly-governed instead of being re-embedded as ad hoc string literals inside runtime entrypoints.

The TypeScript errors module at `sdkwork-rtc-sdk-typescript/src/errors.ts` must also keep
`RTC_SDK_ERROR_CODES`, `RTC_SDK_ERROR_FALLBACK_CODE`, and `RtcSdkException` stable so the shared
error vocabulary stays assembly-governed instead of being re-embedded as ad hoc string literals.
The canonical fallback remains `vendor_error`.

The TypeScript provider-package catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts` must also keep
`getRtcProviderPackageByProviderKey(...)` and `getRtcProviderPackageByPackageIdentity(...)` stable
so provider package boundary lookup stays explicit instead of being reimplemented through ad hoc
manifest scans.

The TypeScript provider-package loader module at
`sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts` must also keep
`createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
`loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
`installRtcProviderPackages(...)` stable so package-boundary provider loading and installation stay
standardized instead of being rebuilt differently in every host application.

The TypeScript provider-activation catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts` must also keep
`getRtcProviderActivationByProviderKey(...)` stable so package-boundary versus root-public runtime
activation lookup stays explicit by provider key.

The TypeScript provider-extension catalog module at
`sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts` must also keep
`getRtcProviderExtensionCatalog(...)`, `getRtcProviderExtensionDescriptor(...)`,
`getRtcProviderExtensionsForProvider(...)`, `getRtcProviderExtensions(...)`, and
`hasRtcProviderExtension(...)` stable so extension metadata stays queryable by extension key,
provider key, and selected extension set.

The TypeScript language-workspace catalog module at
`sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts` must also keep
`getRtcLanguageWorkspaceByLanguage(...)` stable so official language workspace lookup stays
explicit instead of being inferred from README prose or directory scanning.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`defaultProviderContract` with `providerKey`, `pluginId`, and `driverId` aligned to the
assembly-driven default provider identity, a `providerSelectionContract` with
`sourceTerms`, `precedence`, and `defaultSource` aligned to the assembly-driven
`providerSelectionStandard`, and a `providerSupportContract` with `statusTerms` aligned to the
assembly-driven `providerSupportStandard`.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`providerActivationContract` with `statusTerms` aligned to the assembly-driven
`providerActivationStandard`.
Each `RtcLanguageWorkspaceCatalogEntry` must also keep a machine-readable
`providerPackageBoundaryContract` with `modeTerms`, `rootPublicPolicyTerms`,
`lifecycleStatusTerms`, and `runtimeBridgeStatusTerms` aligned to the assembly-driven
`providerPackageBoundaryStandard`.

Reserved non-TypeScript metadata scaffolds must keep the same explicit lookup semantics with
language-idiomatic naming:

- provider catalog by provider key
- provider package catalog by provider key
- provider package catalog by package identity
- provider activation catalog by provider key
- capability descriptor by capability key
- provider extension catalog by extension key and provider key
- language workspace catalog by language

Canonical forms:

- Flutter, Java, Swift, Kotlin:
  `getRtcProviderByProviderKey(...)`, `getRtcProviderPackageByProviderKey(...)`,
  `getRtcProviderPackageByPackageIdentity(...)`,
  `getRtcProviderActivationByProviderKey(...)`, `getRtcCapabilityDescriptor(...)`,
  `getRtcProviderExtensionDescriptor(...)`, `getRtcProviderExtensionsForProvider(...)`,
  `hasRtcProviderExtension(...)`, `getRtcLanguageWorkspaceByLanguage(...)`
- C#, Go:
  `GetRtcProviderByProviderKey(...)`, `GetRtcProviderPackageByProviderKey(...)`,
  `GetRtcProviderPackageByPackageIdentity(...)`,
  `GetRtcProviderActivationByProviderKey(...)`, `GetRtcCapabilityDescriptor(...)`,
  `GetRtcProviderExtensionDescriptor(...)`, `GetRtcProviderExtensionsForProvider(...)`,
  `HasRtcProviderExtension(...)`, `GetRtcLanguageWorkspaceByLanguage(...)`
- Rust, Python:
  `get_rtc_provider_by_provider_key(...)`, `get_rtc_provider_package_by_provider_key(...)`,
  `get_rtc_provider_package_by_package_identity(...)`,
  `get_rtc_provider_activation_by_provider_key(...)`, `get_rtc_capability_descriptor(...)`,
  `get_rtc_provider_extension_descriptor(...)`, `get_rtc_provider_extensions_for_provider(...)`,
  `has_rtc_provider_extension(...)`, `get_rtc_language_workspace_by_language(...)`

Every official language workspace entry must also declare a cross-language
`providerPackageBoundary` contract in the language workspace catalog.
That boundary summary is the canonical package-topology contract:
`providerPackageBoundary.mode`, `providerPackageBoundary.rootPublicPolicy`,
`providerPackageBoundary.lifecycleStatusTerms`, and
`providerPackageBoundary.runtimeBridgeStatusTerms`.
The same language workspace catalog entry must also preserve `defaultProviderContract.providerKey`,
`defaultProviderContract.pluginId`, and `defaultProviderContract.driverId` so the default provider
identity stays machine-readable across languages.
It must also preserve `providerSelectionContract.sourceTerms`,
`providerSelectionContract.precedence`, `providerSelectionContract.defaultSource`, and
`providerSupportContract.statusTerms` so selection precedence and provider-support vocabulary stay
assembly-governed across languages instead of becoming runtime-private conventions.
It must also preserve `providerActivationContract.statusTerms` so provider activation vocabulary
stays assembly-governed through `providerActivationStandard`, and
`providerPackageBoundaryContract.modeTerms`,
`providerPackageBoundaryContract.rootPublicPolicyTerms`,
`providerPackageBoundaryContract.lifecycleStatusTerms`, and
`providerPackageBoundaryContract.runtimeBridgeStatusTerms` so the allowed package-boundary
vocabulary stays assembly-governed through `providerPackageBoundaryStandard`.
TypeScript is the only `catalog-governed-mixed` workspace and keeps
`rootPublicPolicy` fixed at `builtin-only`, while reserved languages stay
`scaffold-per-provider-package` and keep `rootPublicPolicy` fixed at `none`.

TypeScript provider package boundaries under
`sdkwork-rtc-sdk-typescript/providers/rtc-sdk-provider-<providerKey>/` must also ship executable
`index.js` and `index.d.ts` entrypoints and declare `exports` for `import`, `default`, and `types`.
TypeScript provider package statuses are standardized as
`root_public_reference_boundary` for builtin root-public package boundaries and
`package_reference_boundary` for executable non-builtin package boundaries.
The assembly-driven `typescriptAdapterStandard` fixes the TypeScript adapter baseline as
`consumer-supplied`, `native-factory`, `must-not-bundle`, `reference-baseline`, and `required`.
The assembly-driven `typescriptPackageStandard` and per-provider `typescriptPackage` contract are
canonical and must not drift:
`@sdkwork/rtc-sdk-provider-<providerKey>`,
`../../src/providers/<providerKey>.ts`,
`create<ProviderPascal>RtcDriver`,
`<PROVIDER_UPPER>_RTC_PROVIDER_METADATA`, and
`<PROVIDER_UPPER>_RTC_PROVIDER_MODULE`.
Legacy TypeScript package-boundary wording such as
`reserved TypeScript provider package boundaries`, `builtin_reference_boundary`, and
`official_reserved_boundary` is invalid in assembly-driven language workspace contracts,
materialized language workspace READMEs, and language workspace catalogs.
The TypeScript runtime bridge baseline for official providers is `reference-baseline`, and it always
keeps the official vendor SDK requirement set to `required`.
Reserved non-TypeScript provider package boundaries must also materialize one metadata-only source
stub per official provider so future adapter work inherits a deterministic source stub and source
symbol layout before runtime code exists.

Reserved root public entrypoints must also stay standardized wherever the language ecosystem uses a
single package barrel or package initializer:

- Flutter root barrel: `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart`
- Python package root: `sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py`

Those root public entrypoints must re-expose the standard contract, provider catalog, provider
package catalog, provider activation catalog, capability catalog, provider extension catalog,
language workspace catalog, provider-selection helpers, provider-package loader helpers,
provider-support helpers, driver manager, and data source without forcing consumers onto private
module paths.

The TypeScript root public entrypoint may additionally expose the provider package loader and
installer SPI because that surface is provider-neutral package-boundary infrastructure, not a
non-builtin driver factory.
Reserved non-TypeScript language workspaces must also reserve one provider-package loader scaffold
per language so future runtime bridge work inherits a deterministic package-resolution and
package-installation boundary before executable adapters land.

Go reserved-language public structs must also export their shared DTO fields in PascalCase so the
standard metadata stays usable from external packages. The required public field family includes
`ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`, and
`DefaultProviderKey`.

## Workspace Layout

```text
sdkwork-rtc-sdk/
  docs/
  bin/
  test/
  sdkwork-rtc-sdk-typescript/
    providers/
  sdkwork-rtc-sdk-flutter/
  sdkwork-rtc-sdk-rust/
  sdkwork-rtc-sdk-java/
  sdkwork-rtc-sdk-csharp/
  sdkwork-rtc-sdk-swift/
  sdkwork-rtc-sdk-kotlin/
  sdkwork-rtc-sdk-go/
  sdkwork-rtc-sdk-python/
```

## Verification

The root materialization entrypoint is:

```powershell
node .\bin\materialize-sdk.mjs
```

Use it to rematerialize:

- `README.md`
- `docs/README.md`
- `docs/multilanguage-capability-matrix.md`
- official language workspace READMEs, including assembly-driven display names, current roles,
  workspace summaries, and role highlights
- the assembly-driven language workspace catalog at
  `sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts`
- reserved language package/build manifests
- reserved language code-level contract scaffolds
- reserved language workspace catalog assets
- reserved language provider package scaffolds
- reserved language future provider package manifests, READMEs, and metadata-only source stubs
- reserved language metadata scaffolds for provider catalog, provider package catalog, capability
  catalog, provider activation catalog, provider extension catalog, and provider selection
- reserved language resolution scaffolds for driver manager, data source, provider support, and
  provider package loader
- the assembly-driven language workspace catalog matrix inside
  `docs/multilanguage-capability-matrix.md`
- the assembly-driven language-provider activation matrix inside
  `docs/multilanguage-capability-matrix.md`
- the materialized TypeScript provider package catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`
- the manual TypeScript provider package loader module at
  `sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`
- the materialized TypeScript provider catalog at `sdkwork-rtc-sdk-typescript/src/provider-catalog.ts`
- the materialized TypeScript provider activation catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts`
- the explicit lookup helpers inside the materialized TypeScript language workspace, provider
  package, provider activation, capability, and provider extension catalogs
- the standard TypeScript provider package load-and-install helpers used to resolve package
  boundaries, import provider modules, and atomically install provider adapters
- the materialized TypeScript provider extension catalog at
  `sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts`
- the assembly-driven default provider constants inside that provider catalog
- the TypeScript vendor SDK contract inside the materialized provider catalog entries
- the TypeScript runtime bridge baseline and official vendor SDK requirement inside the materialized
  provider catalog entries
- the provider extension key mapping inside the materialized provider catalog entries
- TypeScript provider package manifests
- TypeScript provider package `index.js` and `index.d.ts` entrypoints
- TypeScript provider package READMEs
- the TypeScript vendor SDK contract inside each provider package manifest and README
- the TypeScript runtime bridge baseline contract inside each provider package manifest and README
- the provider extension keys inside each provider package manifest and README
- stale legacy generated assets such as `sdkwork-rtc-sdk-typescript/src/providers/catalog.ts`

The root verification entrypoint is:

```powershell
node .\bin\verify-sdk.mjs
```

The root full regression entrypoint is:

```powershell
node .\bin\smoke-sdk.mjs
```

Run the full regression command before describing the RTC SDK workspace as complete. It executes
materialization, root automation tests, root verification, TypeScript package tests, and optional
language smoke checks when the corresponding toolchains are installed.

The verifier is responsible for:

- root docs presence
- root documentation clause coverage for provider package entrypoints and default provider constants
- root documentation clause coverage for capability negotiation and degradation semantics
- root documentation clause coverage for provider extension metadata semantics
- TypeScript provider selection standard presence and token coverage
- TypeScript provider support standard presence and token coverage
- assembly metadata alignment
- exact materialized standard asset alignment, not just presence
- stale legacy generated asset rejection
- official language workspace presence
- language workspace catalog presence
- TypeScript executable baseline presence
- built-in provider baseline presence
- TypeScript provider package boundary presence
- reserved language provider package scaffold presence
- reserved language future provider package boundary presence
- reserved language provider package source stub presence
- reserved language provider package loader scaffold presence

## Ownership Rules

The root `.gitignore` is part of the RTC workspace contract.
Verification and smoke commands are allowed to create local non-source artifacts such as
`sdkwork-rtc-sdk-typescript/dist/`, `sdkwork-rtc-sdk-rust/target/`,
`sdkwork-rtc-sdk-java/target/`, `sdkwork-rtc-sdk-csharp/src/**/bin/`,
`sdkwork-rtc-sdk-csharp/src/**/obj/`, and `sdkwork-rtc-sdk-python/**/__pycache__/`.
Those directories are build outputs, not contract inputs, and they must stay ignored instead of
being treated as source drift.

The assembly snapshot `.sdkwork-assembly.json` remains checked-in source of truth.
It must not be ignored or relocated into transient local state.

## Related Docs

- `docs/README.md`
- `docs/package-standards.md`
- `docs/provider-adapter-standard.md`
- `docs/multilanguage-capability-matrix.md`
- `docs/verification-matrix.md`
