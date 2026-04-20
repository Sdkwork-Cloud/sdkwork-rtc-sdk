# SDKWork RTC SDK Internal Docs

Use this directory when you need the exact internal standards for `sdkwork-rtc-sdk`.

Current docs:

- `usage-guide.md`
  Practical usage guide, default `volcengine` behavior, TypeScript quick start, and current
  runtime-boundary expectations.
- `package-standards.md`
  Naming, ownership, and public package rules.
- `provider-adapter-standard.md`
  JDBC-style driver and adapter rules.
- `multilanguage-capability-matrix.md`
  Capability catalog, provider extension catalog, provider tiers, language roles, maturity tiers,
  `capabilityStandard`, `capabilityNegotiationStandard`, `runtimeSurfaceStandard`,
  `runtimeImmutabilityStandard`, `rootPublicSurfaceStandard`, `lookupHelperNamingStandard`,
  `errorCodeStandard`,
  `providerExtensionStandard`, `providerTierStandard`, `languageMaturityStandard`,
  runtime support boundaries, assembly-driven language workspace catalog paths, cross-language
  `providerPackageBoundary` modes and root-public policies, TypeScript runtime bridge baselines,
  reserved language package/build scaffolds, reserved language metadata scaffolds, reserved
  language provider activation catalog scaffolds, reserved language resolution scaffolds, reserved
  language provider package scaffolds and materialized future provider package boundaries with
  template token, source file, source symbol, reserved status, and root public exposure contracts,
  and language-provider activation matrix.
- `verification-matrix.md`
  Root verification expectations and commands.

The TypeScript executable baseline fixes these standard modules as the executable source of truth:

- capability catalog: `sdkwork-rtc-sdk-typescript/src/capability-catalog.ts`
  Includes `getRtcCapabilityCatalog(...)` and `getRtcCapabilityDescriptor(...)` so capability
  metadata stays queryable by capability key.
- provider catalog: `sdkwork-rtc-sdk-typescript/src/provider-catalog.ts`
  Includes `getBuiltinRtcProviderMetadataByKey(...)` and
  `getOfficialRtcProviderMetadataByKey(...)`, plus the cross-language alias
  `getRtcProviderByProviderKey(...)`, so provider lookup by key stays standardized.
- provider activation catalog: `sdkwork-rtc-sdk-typescript/src/provider-activation-catalog.ts`
  Includes `getRtcProviderActivationByProviderKey(...)` so provider activation lookup stays
  standardized by provider key.
- provider selection: `sdkwork-rtc-sdk-typescript/src/provider-selection.ts`
  Keeps JDBC-style provider selection precedence explicit.
- capability negotiation: `sdkwork-rtc-sdk-typescript/src/capability-negotiation.ts`
  Keeps `RTC_CAPABILITY_NEGOTIATION_STATUSES`, `RTC_CAPABILITY_NEGOTIATION_RULES`, and
  `resolveRtcCapabilityNegotiationStatus(...)` explicit so capability negotiation statuses,
  downgrade rules, and resolution semantics stay standardized.
- error vocabulary: `sdkwork-rtc-sdk-typescript/src/errors.ts`
  Keeps `RTC_SDK_ERROR_CODES`, `RTC_SDK_ERROR_FALLBACK_CODE`, and `RtcSdkException` explicit so
  runtime failures stay standardized around one canonical error vocabulary. The fallback remains
  `vendor_error`.
- runtime surface: `sdkwork-rtc-sdk-typescript/src/runtime-surface.ts`
  Keeps `RTC_RUNTIME_SURFACE_METHODS`, `RTC_RUNTIME_SURFACE_FAILURE_CODE`, and
  `RTC_RUNTIME_SURFACE_STANDARD` explicit so provider-neutral runtime method vocabulary and
  missing-runtime failure semantics stay aligned to `runtimeSurfaceStandard`.
- runtime immutability: `sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts`
  Keeps `RTC_RUNTIME_IMMUTABILITY_FROZEN_TERM`, `RTC_RUNTIME_IMMUTABILITY_SNAPSHOT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_CONTROLLER_CONTEXT_TERM`,
  `RTC_RUNTIME_IMMUTABILITY_NATIVE_CLIENT_TERM`, and `RTC_RUNTIME_IMMUTABILITY_STANDARD` explicit
  so runtime-frozen metadata, immutable snapshot semantics, shallow-immutable runtime-controller
  context semantics, and mutable native-client preservation stay aligned to
  `runtimeImmutabilityStandard`.
- root public surface: `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`
  Keeps `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_PROVIDER_NEUTRAL_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_BUILTIN_PROVIDER_EXPORT_PATHS`,
  `RTC_ROOT_PUBLIC_SURFACE_TYPESCRIPT_INLINE_HELPER_NAMES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_SURFACE_FAMILIES`,
  `RTC_ROOT_PUBLIC_SURFACE_RESERVED_ENTRYPOINT_KINDS`, and
  `RTC_ROOT_PUBLIC_SURFACE_STANDARD` explicit so the root export graph, builtin-provider root
  exposure, and reserved single-entrypoint families stay aligned to `rootPublicSurfaceStandard`.
- lookup helper naming: `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`
  Keeps `RTC_LOOKUP_HELPER_NAMING_PROFILE_TERMS`,
  `RTC_LOOKUP_HELPER_NAMING_FAMILY_TERMS`, and `RTC_LOOKUP_HELPER_NAMING_STANDARD` explicit so
  the `lower-camel-rtc`, `upper-camel-rtc`, and `snake-case-rtc` helper profiles stay aligned to
  `lookupHelperNamingStandard`.
- provider support: `sdkwork-rtc-sdk-typescript/src/provider-support.ts`
  Keeps provider support classification and support-state construction explicit.
- provider package catalog: `sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`
  Includes `getRtcProviderPackageByProviderKey(...)` and
  `getRtcProviderPackageByPackageIdentity(...)` so one-provider package boundaries stay
  queryable by provider key and package identity.
- provider package loader: `sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`
  Includes `createRtcProviderPackageLoader(...)`, `resolveRtcProviderPackageLoadTarget(...)`,
  `loadRtcProviderModule(...)`, `installRtcProviderPackage(...)`, and
  `installRtcProviderPackages(...)` so package-boundary adapters can be loaded and installed
  through one standard SPI instead of ad hoc application wiring.
- provider extension catalog: `sdkwork-rtc-sdk-typescript/src/provider-extension-catalog.ts`
  Includes `getRtcProviderExtensionCatalog(...)`, `getRtcProviderExtensionDescriptor(...)`,
  `getRtcProviderExtensionsForProvider(...)`, `getRtcProviderExtensions(...)`, and
  `hasRtcProviderExtension(...)` so extension metadata stays queryable by extension key,
  provider key, and selected extension set.
- language workspace catalog: `sdkwork-rtc-sdk-typescript/src/language-workspace-catalog.ts`
  Includes `getRtcLanguageWorkspaceByLanguage(...)` so the official language matrix stays
  queryable by language key inside the executable baseline.
  Each `RtcLanguageWorkspaceCatalogEntry` also declares `defaultProviderContract`,
  `providerSelectionContract`, `providerSupportContract`, `providerActivationContract`,
  `providerPackageBoundaryContract`, and `providerPackageBoundary` so default-provider identity,
  provider-selection precedence, provider-support vocabulary, provider-activation vocabulary, and
  package-boundary semantics stay explicit across languages instead of being inferred from
  TypeScript-only package manifests or reserved-language scaffold prose.
  The same catalog also preserves the assembly-driven top-level standards
  `providerSelectionStandard`, `providerSupportStandard`, `providerActivationStandard`,
  `providerPackageBoundaryStandard`, `capabilityStandard`, `capabilityNegotiationStandard`,
  `runtimeSurfaceStandard`, `runtimeImmutabilityStandard`, `errorCodeStandard`,
  `providerExtensionStandard`, `providerTierStandard`, `languageMaturityStandard`,
  `typescriptAdapterStandard`, and `typescriptPackageStandard` through those machine-readable
  contracts.
  TypeScript stays `catalog-governed-mixed` with `rootPublicPolicy` set to `builtin-only`,
  while reserved languages stay `scaffold-per-provider-package` with `rootPublicPolicy` set to
  `none`.

Reserved non-TypeScript language workspace catalogs and metadata scaffolds must also keep explicit
lookup helpers stable with language-idiomatic naming. `lookupHelperNamingStandard` is the
canonical source of truth. The required helper families remain:

- capability catalog by capability key
- provider catalog by provider key
- provider package by provider key
- provider package by package identity
- provider activation by provider key
- provider extension catalog by extension key and provider key
- language workspace by language

Canonical naming forms:

- Flutter, Java, Swift, Kotlin: `getRtcProviderByProviderKey(...)`,
  `getRtcProviderPackageByProviderKey(...)`, `getRtcProviderPackageByPackageIdentity(...)`,
  `getRtcProviderActivationByProviderKey(...)`,
  `getRtcCapabilityDescriptor(...)`, `getRtcProviderExtensionDescriptor(...)`,
  `getRtcProviderExtensionsForProvider(...)`, `hasRtcProviderExtension(...)`,
  `getRtcLanguageWorkspaceByLanguage(...)`
- C#, Go: `GetRtcProviderByProviderKey(...)`,
  `GetRtcProviderPackageByProviderKey(...)`, `GetRtcProviderPackageByPackageIdentity(...)`,
  `GetRtcProviderActivationByProviderKey(...)`,
  `GetRtcCapabilityDescriptor(...)`, `GetRtcProviderExtensionDescriptor(...)`,
  `GetRtcProviderExtensionsForProvider(...)`, `HasRtcProviderExtension(...)`,
  `GetRtcLanguageWorkspaceByLanguage(...)`
- Rust, Python: `get_rtc_provider_by_provider_key(...)`,
  `get_rtc_provider_package_by_provider_key(...)`,
  `get_rtc_provider_package_by_package_identity(...)`, `get_rtc_provider_activation_by_provider_key(...)`,
  `get_rtc_capability_descriptor(...)`, `get_rtc_provider_extension_descriptor(...)`,
  `get_rtc_provider_extensions_for_provider(...)`, `has_rtc_provider_extension(...)`,
  `get_rtc_language_workspace_by_language(...)`

Reserved root public entrypoints must also stay standardized wherever the language ecosystem uses a
single package barrel or package initializer:

- Flutter root barrel: `sdkwork-rtc-sdk-flutter/lib/rtc_sdk.dart`
- Python package root: `sdkwork-rtc-sdk-python/sdkwork_rtc_sdk/__init__.py`

Those root public entrypoints must re-expose the standard contract, provider catalog, provider
package catalog, provider activation catalog, capability catalog, provider extension catalog,
language workspace catalog, provider selection helpers, provider package loader helpers, provider
support helpers, driver manager, and data source modules so downstream consumers never need deep
imports for standardized RTC metadata or selection behavior.
The assembly-governed root exposure constants live in
`sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`, where `rootPublicSurfaceStandard`,
`RTC_ROOT_PUBLIC_SURFACE_STANDARD`, `root-public-builtin-only`, and `package-boundary-only`
remain explicit.
The assembly-governed lookup-helper naming constants live in
`sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`, where `lookupHelperNamingStandard`,
`RTC_LOOKUP_HELPER_NAMING_STANDARD`, `lower-camel-rtc`, `upper-camel-rtc`, and
`snake-case-rtc` remain explicit.

Go reserved-language public structs must also export their shared DTO fields in PascalCase, such as
`ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`,
`DefaultSelected`, and `RoleHighlights`, so package consumers can inspect and construct
standardized values directly without local wrapper types.

The TypeScript executable workspace also reserves one-provider-only package boundaries under
`sdkwork-rtc-sdk-typescript/providers/`.
The root `bin/materialize-sdk.mjs` command rematerializes `docs/multilanguage-capability-matrix.md`,
assembly-driven language workspace READMEs, the TypeScript runtime-immutability module at
`sdkwork-rtc-sdk-typescript/src/runtime-immutability.ts`, the TypeScript root-public-surface
module at `sdkwork-rtc-sdk-typescript/src/root-public-surface.ts`, the TypeScript
lookup-helper-naming module at `sdkwork-rtc-sdk-typescript/src/lookup-helper-naming.ts`, the
TypeScript provider package catalog at
`sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`, assembly-driven language workspace
catalog assets, reserved language package/build/contract/metadata/provider-package-catalog/provider-activation-catalog/resolution/provider-package-loader/provider-package scaffolds with exact template token and root-public policies, materialized future provider package boundary READMEs and manifests, and provider package standard assets materialized from `.sdkwork-assembly.json`.
Reserved non-TypeScript provider package boundaries also materialize one metadata-only source stub
per official provider so future runtime bridge work inherits a deterministic code-entry layout.
The manual TypeScript provider package loader SPI at
`sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts` then turns those package-boundary
contracts into a standard load-and-install path for pluggable provider adapters.
Reserved non-TypeScript language workspaces now also materialize a future provider package loader
scaffold per language so runtime bridge work inherits a deterministic package-resolution and
installation boundary before executable adapters land.
The root `bin/smoke-sdk.mjs` command is the full regression entrypoint. It runs materialization,
root automation tests, root verification, TypeScript package tests, and optional language smoke
checks such as `compileall`, `cargo check`, `dotnet build`, and `javac` when those
toolchains are available.
The root `.gitignore` defines the non-source artifact boundary for verification outputs such as
`dist/`, `target/`, `bin/`, `obj/`, and `__pycache__/`, while
`.sdkwork-assembly.json` remains checked-in source of truth.
