# SDKWork RTC SDK TypeScript Workspace

Language: `typescript`

Planned public package:

- `@sdkwork/rtc-sdk`

Current boundary:

- control SDK support: yes
- runtime bridge support: yes
- maturity tier: reference

Current role:

- Executable reference implementation
- provider-neutral RTC contracts
- JDBC-style driver and data-source model
- assembly-driven provider catalog at src/provider-catalog.ts
- assembly-driven capability catalog at src/capability-catalog.ts with required-baseline and optional-advanced surface descriptors
- assembly-driven provider extension catalog at src/provider-extension-catalog.ts with unwrap-only extension metadata
- surface-aware capability negotiation and degradation helpers with supported, degraded, and unsupported outcomes
- stable runtime bridge contract methods join, leave, publish, unpublish, muteAudio, and muteVideo
- explicit native_sdk_not_available failure when no runtime bridge is registered
- assembly-driven default provider constants DEFAULT_RTC_PROVIDER_KEY, DEFAULT_RTC_PROVIDER_PLUGIN_ID, and DEFAULT_RTC_PROVIDER_DRIVER_ID
- built-in provider adapters for volcengine, aliyun, and tencent
- TypeScript provider package statuses standardize built-in root-public packages as root_public_reference_boundary and executable non-builtin packages as package_reference_boundary
- TypeScript runtime bridge baseline reference-baseline with official vendor SDK requirement required
- assembly-driven language workspace catalog at src/language-workspace-catalog.ts
- standard provider selection helpers at src/provider-selection.ts
- standard provider support helpers at src/provider-support.ts
- assembly-driven provider package catalog at src/provider-package-catalog.ts
- standard provider package loader and installer SPI at src/provider-package-loader.ts
- assembly-driven provider activation catalog at src/provider-activation-catalog.ts
- TypeScript runtime bridge baseline: reference-baseline
- TypeScript runtime bridge requires an official vendor SDK: required
- TypeScript provider adapters remain consumer-supplied, bind through native-factory, and must-not-bundle vendor SDKs

This workspace is the executable reference implementation for provider-neutral RTC contracts, JDBC-style driver selection, standardized runtime lifecycle delegation, and provider package boundaries in sdkwork-rtc-sdk.
This workspace does not bundle vendor SDK implementations. Provider adapters wrap caller-supplied
native client factories and expose vendor escape hatches through `unwrap()`.

Language workspace catalog:

- workspace catalog: `src/language-workspace-catalog.ts`


Standards references:

- `../docs/provider-adapter-standard.md`
- `../docs/multilanguage-capability-matrix.md`
