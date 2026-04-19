# SDKWork RTC SDK Swift Workspace

Language: `swift`

Planned public package:

- `RtcSdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved Swift language boundary for iOS or macOS runtime bridge integration
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing

This workspace is the reserved Swift standard boundary for provider metadata, driver selection, and future iOS or macOS runtime bridge integration.

Language workspace catalog:

- workspace catalog: `Sources/RtcSdk/RtcLanguageWorkspaceCatalog.swift`


Package scaffold:

- build system: swift-package-manager
- manifest: `Package.swift`
- contract scaffold: `Sources/RtcSdk/RtcStandardContract.swift`


Metadata scaffold:

- provider catalog: `Sources/RtcSdk/RtcProviderCatalog.swift`
- provider package catalog: `Sources/RtcSdk/RtcProviderPackageCatalog.swift`
- provider activation catalog: `Sources/RtcSdk/RtcProviderActivationCatalog.swift`
- capability catalog: `Sources/RtcSdk/RtcCapabilityCatalog.swift`
- provider extension catalog: `Sources/RtcSdk/RtcProviderExtensionCatalog.swift`
- provider selection: `Sources/RtcSdk/RtcProviderSelection.swift`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, and language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `Sources/RtcSdk/RtcDriverManager.swift`
- data source: `Sources/RtcSdk/RtcDataSource.swift`
- provider support: `Sources/RtcSdk/RtcProviderSupport.swift`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `Providers/RtcSdkProvider{providerPascal}`
- package pattern: `RtcSdkProvider{providerPascal}`
- manifest file name: `Package.swift`
- readme file name: `README.md`
- source file pattern: `Sources/RtcSdkProvider{providerPascal}/RtcProvider{providerPascal}PackageContract.swift`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerPascal}`
- source template tokens: `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
