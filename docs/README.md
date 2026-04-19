# SDKWork RTC SDK Internal Docs

Use this directory when you need the exact internal standards for `sdkwork-rtc-sdk`.

Current docs:

- `package-standards.md`
  Naming, ownership, and public package rules.
- `provider-adapter-standard.md`
  JDBC-style driver and adapter rules.
- `multilanguage-capability-matrix.md`
  Capability catalog, provider extension catalog, provider tiers, language roles, maturity tiers,
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
  Each `RtcLanguageWorkspaceCatalogEntry` also declares `defaultProviderContract` and
  `providerPackageBoundary` so default-provider identity and package-boundary semantics stay
  explicit across languages instead of being inferred from TypeScript-only package manifests or
  reserved-language scaffold prose.
  TypeScript stays `catalog-governed-mixed` with `rootPublicPolicy` set to `builtin-only`,
  while reserved languages stay `scaffold-per-provider-package` with `rootPublicPolicy` set to
  `none`.

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

Go reserved-language public structs must also export their shared DTO fields in PascalCase, such as
`ProviderKey`, `PluginId`, `DriverId`, `PackageIdentity`, `RuntimeBridgeStatus`,
`DefaultSelected`, and `RoleHighlights`, so package consumers can inspect and construct
standardized values directly without local wrapper types.

The TypeScript executable workspace also reserves one-provider-only package boundaries under
`sdkwork-rtc-sdk-typescript/providers/`.
The root `bin/materialize-sdk.mjs` command rematerializes `docs/multilanguage-capability-matrix.md`, assembly-driven language workspace READMEs, the TypeScript provider package catalog at `sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`, assembly-driven language workspace catalog assets, reserved language package/build/contract/metadata/provider-package-catalog/provider-activation-catalog/resolution/provider-package-loader/provider-package scaffolds with exact template token and root-public policies, materialized future provider package boundary READMEs and manifests, and provider package standard assets materialized from `.sdkwork-assembly.json`.
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
