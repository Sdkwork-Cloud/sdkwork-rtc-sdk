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

Language workspace catalog:

- workspace catalog: `lib/src/rtc_language_workspace_catalog.dart`


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
