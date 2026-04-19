# SDKWork RTC SDK Go Workspace

Language: `go`

Planned public package:

- `github.com/sdkwork/rtc-sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: reserved
- maturity tier: reserved

Current role:

- Reserved workspace skeleton
- provider metadata and driver selection standards
- reserved Go language boundary for control-plane tooling integration
- no runtime bridge is claimed in the current landing
- code-level RtcStandardContract scaffold keeps provider-neutral core abstractions fixed before runtime bridge landing
- metadata scaffold fixes provider catalog, capability catalog, provider extension catalog, and provider selection skeleton boundaries before runtime bridge landing
- resolution scaffold fixes metadata-only driver manager, data source, and provider support boundaries before runtime bridge landing

This workspace is the reserved Go standard boundary for provider metadata, driver selection, and future control-plane tooling integration.

Language workspace catalog:

- workspace catalog: `rtcstandard/language_workspace_catalog.go`


Package scaffold:

- build system: go-modules
- manifest: `go.mod`
- contract scaffold: `rtcstandard/contract.go`


Metadata scaffold:

- provider catalog: `rtcstandard/provider_catalog.go`
- provider package catalog: `rtcstandard/provider_package_catalog.go`
- provider activation catalog: `rtcstandard/provider_activation_catalog.go`
- capability catalog: `rtcstandard/capability_catalog.go`
- provider extension catalog: `rtcstandard/provider_extension_catalog.go`
- provider selection: `rtcstandard/provider_selection.go`
- explicit lookup helpers stay mandatory for metadata catalogs:
  provider catalog by provider key, provider package by provider key,
  provider activation by provider key, capability descriptor by capability key,
  provider extension catalog by extension key and provider key, and language workspace by language
- helper naming stays language-idiomatic while preserving the same semantics:
  `getRtc...` for Flutter/Java/Swift/Kotlin, `GetRtc...` for C#/Go, and `get_rtc...` for Rust/Python


Resolution scaffold:

- driver manager: `rtcstandard/driver_manager.go`
- data source: `rtcstandard/data_source.go`
- provider support: `rtcstandard/provider_support.go`


Provider package scaffold:

- scaffold: `providers/provider-package-scaffold.md`
- directory pattern: `providers/rtc-sdk-provider-{providerKey}`
- package pattern: `github.com/sdkwork/rtc-sdk-provider-{providerKey}`
- manifest file name: `go.mod`
- readme file name: `README.md`
- source file pattern: `provider_package_contract.go`
- source symbol pattern: `RtcProvider{providerPascal}PackageContract`
- template tokens: `{providerKey}`
- source template tokens: `{providerPascal}`
- status: `future-runtime-bridge-only`
- runtime bridge status: `reserved`
- root public exposure: `false`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
