# SDKWork RTC SDK Flutter Workspace

Language: `flutter`

Planned public package:

- `rtc_sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata, capability matrix, and driver selection standards
- reserved Flutter language boundary with no runtime bridge claim in the current landing
- future Flutter runtime bridge work must follow the TypeScript baseline contract
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing

This workspace is materialized now so the official language matrix stays explicit and verifiable. Future Flutter runtime bridge work must follow the same provider-adapter and capability standards as the TypeScript baseline.

Default provider contract:

- Flutter/mobile default provider key: `volcengine`
- Flutter/mobile default plugin id: `rtc-volcengine`
- Flutter/mobile default driver id: `sdkwork-rtc-driver-volcengine`
- `RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY` must stay aligned to that assembly default
- `resolveRtcProviderSelection()` in `lib/src/rtc_provider_selection.dart`
  falls back to `RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY` when Flutter callers do not
  provide providerUrl, providerKey, tenant override, or deployment profile values
- `RtcDataSourceOptions.defaultProviderKey` and `RtcDataSource.describeSelection()`
  therefore keep the Flutter/mobile default provider on `volcengine`
  until a caller explicitly overrides it


Language workspace catalog:

- workspace catalog: `lib/src/rtc_language_workspace_catalog.dart`
- workspace catalog entries also keep `workspaceCatalogRelativePath` plus any declared
  `metadataScaffold`, `resolutionScaffold`, `providerPackageBoundary`, and
  `providerPackageScaffold` boundaries so consumers can inspect official assembly-driven module
  locations without rereading the assembly.


Provider package boundary:

- mode: `scaffold-per-provider-package`
- root public policy: `none`
- lifecycle status terms: `future-runtime-bridge-only`
- runtime bridge status terms: `reserved`


Package scaffold:

- build system: flutter-pub
- manifest: `pubspec.yaml`
- contract scaffold: `lib/src/rtc_standard_contract.dart`


Metadata scaffold:

- provider catalog: `lib/src/rtc_provider_catalog.dart`
- provider package catalog: `lib/src/rtc_provider_package_catalog.dart`
- provider activation catalog: `lib/src/rtc_provider_activation_catalog.dart`
- capability catalog: `lib/src/rtc_capability_catalog.dart`
- provider extension catalog: `lib/src/rtc_provider_extension_catalog.dart`
- provider selection: `lib/src/rtc_provider_selection.dart`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, and language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `lib/src/rtc_driver_manager.dart`
- data source: `lib/src/rtc_data_source.dart`
- provider support: `lib/src/rtc_provider_support.dart`
- provider package loader: `lib/src/rtc_provider_package_loader.dart`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/rtc_sdk_provider_{providerKey}`
- package pattern: `rtc_sdk_provider_{providerKey}`
- manifest file name: `pubspec.yaml`
- readme file name: `README.md`
- source file pattern: `lib/src/rtc_provider_{providerKey}_package_contract.dart`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerKey}`, `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
