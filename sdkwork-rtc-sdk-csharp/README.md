# SDKWork RTC SDK C# Workspace

Language: `csharp`

Planned public package:

- `Sdkwork.Rtc.Sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved C# language boundary for desktop or server-side control integration
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, provider support, and provider package loader boundaries before runtime bridge landing

This workspace is the reserved C# standard boundary for provider metadata, driver selection, and future desktop or server-side control integration.

Language workspace catalog:

- workspace catalog: `src/SDKWork.Rtc.Sdk/RtcLanguageWorkspaceCatalog.cs`
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

- build system: dotnet-sdk
- manifest: `src/SDKWork.Rtc.Sdk/SDKWork.Rtc.Sdk.csproj`
- contract scaffold: `src/SDKWork.Rtc.Sdk/RtcStandardContract.cs`


Metadata scaffold:

- provider catalog: `src/SDKWork.Rtc.Sdk/RtcProviderCatalog.cs`
- provider package catalog: `src/SDKWork.Rtc.Sdk/RtcProviderPackageCatalog.cs`
- provider activation catalog: `src/SDKWork.Rtc.Sdk/RtcProviderActivationCatalog.cs`
- capability catalog: `src/SDKWork.Rtc.Sdk/RtcCapabilityCatalog.cs`
- provider extension catalog: `src/SDKWork.Rtc.Sdk/RtcProviderExtensionCatalog.cs`
- provider selection: `src/SDKWork.Rtc.Sdk/RtcProviderSelection.cs`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, and language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `src/SDKWork.Rtc.Sdk/RtcDriverManager.cs`
- data source: `src/SDKWork.Rtc.Sdk/RtcDataSource.cs`
- provider support: `src/SDKWork.Rtc.Sdk/RtcProviderSupport.cs`
- provider package loader: `src/SDKWork.Rtc.Sdk/RtcProviderPackageLoader.cs`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/Sdkwork.Rtc.Sdk.Provider.{providerPascal}`
- package pattern: `Sdkwork.Rtc.Sdk.Provider.{providerPascal}`
- manifest file name: `Sdkwork.Rtc.Sdk.Provider.{providerPascal}.csproj`
- readme file name: `README.md`
- source file pattern: `src/RtcProvider{providerPascal}PackageContract.cs`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerPascal}`
- source template tokens: `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
