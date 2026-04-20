# SDKWork RTC SDK Usage Guide

This document is the entrypoint for adopting `sdkwork-rtc-sdk`.

It focuses on the standardized provider model, current runnable baselines, default `volcengine`
selection contract, and the recommended runtime-specific guides.

## 1. Positioning

`sdkwork-rtc-sdk` is not a reimplementation of vendor media engines.

Its responsibility is to provide one provider-neutral RTC standard:

- JDBC-style `DriverManager` / `DataSource` / `Client` contracts
- standardized provider selection and default-provider resolution
- standardized capability negotiation, error semantics, and extension metadata
- pluggable provider integration through official catalogs and package boundaries
- one consistent runtime surface across web, mobile, and future language workspaces

The standard intentionally keeps vendor SDK ownership on the application side:

- official vendor SDKs remain consumer-supplied
- `sdkwork-rtc-sdk` provides the standard contracts and adapter boundaries
- runtime bridges map vendor behavior into the standard surface instead of hiding vendor engines

## 2. Official Providers

The current official provider catalog is:

| Provider key | Display name | Tier | Builtin | Current role |
| --- | --- | --- | --- | --- |
| `volcengine` | Volcengine RTC | `tier-a` | `true` | default provider and current runnable baseline on web and Flutter |
| `aliyun` | Aliyun RTC | `tier-a` | `true` | official builtin catalog entry, metadata-only outside the TypeScript web baseline |
| `tencent` | Tencent RTC | `tier-a` | `true` | official builtin catalog entry, metadata-only outside the TypeScript web baseline |
| `agora` | Agora RTC | `tier-b` | `false` | official package-boundary target |
| `zego` | ZEGO RTC | `tier-b` | `false` | official package-boundary target |
| `livekit` | LiveKit RTC | `tier-b` | `false` | official package-boundary target |
| `twilio` | Twilio Video | `tier-b` | `false` | official package-boundary target |
| `jitsi` | Jitsi Meet | `tier-b` | `false` | official package-boundary target |
| `janus` | Janus RTC | `tier-c` | `false` | future SPI target |
| `mediasoup` | mediasoup RTC | `tier-c` | `false` | future SPI target |

Notes:

- `builtin = true` means the provider is part of the official assembly-driven builtin catalog
- builtin does not mean the vendor runtime is bundled into every language workspace
- non-default providers still follow the same provider metadata, capability, and activation rules

## 3. Language Status

Current language workspace status:

| Language | Workspace | Public package | Maturity | Runtime bridge | Current role |
| --- | --- | --- | --- | --- | --- |
| TypeScript | `sdkwork-rtc-sdk-typescript` | `@sdkwork/rtc-sdk` | `reference` | yes | executable web/browser reference baseline |
| Flutter | `sdkwork-rtc-sdk-flutter` | `rtc_sdk` | `reference` | yes | executable mobile runtime baseline |
| Java | `sdkwork-rtc-sdk-java` | `com.sdkwork.rtc` | `reserved` | no | standard boundary scaffold |
| Kotlin | `sdkwork-rtc-sdk-kotlin` | `com.sdkwork.rtc` | `reserved` | no | standard boundary scaffold |
| Go | `sdkwork-rtc-sdk-go` | `rtcstandard` | `reserved` | no | standard boundary scaffold |
| C# | `sdkwork-rtc-sdk-csharp` | `Sdkwork.Rtc` | `reserved` | no | standard boundary scaffold |
| Swift | `sdkwork-rtc-sdk-swift` | `RtcSdk` | `reserved` | no | standard boundary scaffold |
| Rust | `sdkwork-rtc-sdk-rust` | `sdkwork_rtc_sdk` | `reserved` | no | standard boundary scaffold |
| Python | `sdkwork-rtc-sdk-python` | `sdkwork_rtc_sdk` | `reserved` | no | standard boundary scaffold |

Current conclusion:

- TypeScript is the executable web/browser baseline
- Flutter is the executable mobile baseline
- both runnable baselines default to `volcengine`
- remaining languages preserve standardized metadata, provider selection, lookup helpers, and
  package-boundary scaffolds for future runtime-bridge landings

## 4. Default Provider Contract

The default provider remains `volcengine`.

Canonical defaults:

- `DEFAULT_RTC_PROVIDER_KEY = 'volcengine'`
- `DEFAULT_RTC_PROVIDER_PLUGIN_ID = 'rtc-volcengine'`
- `DEFAULT_RTC_PROVIDER_DRIVER_ID = 'sdkwork-rtc-driver-volcengine'`

Provider selection precedence remains:

1. `providerUrl`
2. `providerKey`
3. `tenantOverrideProviderKey`
4. `deploymentProfileProviderKey`
5. `defaultProvider`

That means both the web and Flutter baselines fall back to `volcengine` when the caller does not
explicitly override provider selection.

## 5. Runnable Baselines

### TypeScript / Web

The current web runtime path is:

- standard package: `@sdkwork/rtc-sdk`
- default provider: `volcengine`
- default vendor runtime: official `@volcengine/rtc`
- default signaling integration: `sdkwork-im-sdk`
- standard call/session entrypoint: `StandardRtcCallSession`
- recommended quick-start entrypoint: `createStandardRtcCallStack(...)`

Use the detailed guide here:

- [`docs/typescript-volcengine-im-usage.md`](./typescript-volcengine-im-usage.md)

### Flutter / Mobile

The current mobile runtime path is:

- standard package: `rtc_sdk`
- default provider: `volcengine`
- default vendor runtime: official `package:volc_engine_rtc`
- default signaling integration: `sdkwork-im-sdk` through `package:im_sdk/im_sdk.dart`
- standard call/session entrypoint: `StandardRtcCallSession`
- recommended quick-start entrypoint: `createStandardRtcCallStack(...)`

Use the detailed guide here:

- [`docs/flutter-volcengine-im-usage.md`](./flutter-volcengine-im-usage.md)

## 6. Standard Integration Boundary

The correct vendor integration boundary is still the same:

- `sdkwork-rtc-sdk` owns the standard contracts and provider-neutral runtime surface
- the vendor SDK owns real media behavior
- the application wires vendor SDK instances into the standard driver/runtime-controller boundary
- signaling adapters map `sdkwork-im-sdk` transport semantics into the RTC call/session standard

For the current runnable baselines, this boundary is already materialized:

- TypeScript binds the standard surface to the official Volcengine Web SDK
- Flutter binds the standard surface to the official Volcengine Flutter SDK
- both baselines compose `sdkwork-im-sdk` signaling for RTC session lifecycle and participant
  credential issuance

## 7. Non-Builtin Provider Packages

For providers such as `agora`, `zego`, `livekit`, `twilio`, `jitsi`, `janus`, and `mediasoup`,
the standard path is package-boundary integration instead of deep root-entrypoint coupling.

That contract stays:

- official provider metadata remains assembly-driven
- package identity, manifest path, README path, and source symbol stay standardized
- runtime code is loaded through the provider-package loader SPI
- runtime bridge ownership stays with the integrating application or provider package

## 8. Error Semantics

Important standardized error codes include:

- `invalid_provider_url`
- `driver_not_found`
- `provider_not_supported`
- `provider_package_not_found`
- `provider_package_identity_mismatch`
- `provider_package_load_failed`
- `provider_module_export_missing`
- `provider_module_contract_mismatch`
- `provider_metadata_mismatch`
- `native_sdk_not_available`
- `signaling_not_available`
- `call_state_invalid`
- `vendor_error`

The two most important runtime distinctions are:

- `provider_not_supported`: the provider exists in the official catalog but no runnable driver is
  registered in the current runtime
- `native_sdk_not_available`: the standard surface exists but the actual vendor runtime bridge is
  missing or misconfigured

## 9. Local Verification

Use the following commands in the workspace root:

```powershell
node .\bin\materialize-sdk.mjs
node .\test\verify-sdk-automation.test.mjs
node .\bin\verify-sdk.mjs
node .\bin\smoke-sdk.mjs
```

Verification intent:

- `materialize-sdk.mjs` keeps generated catalogs, READMEs, and matrices aligned to the assembly
- `verify-sdk-automation.test.mjs` protects standard assets and materialization behavior
- `verify-sdk.mjs` validates assembly contracts and generated output
- `smoke-sdk.mjs` runs the repository regression entrypoint, including `flutter analyze` when the
  Flutter toolchain is available

## 10. Practical Adoption Guidance

Use this rule of thumb:

- if you need the web/browser baseline, start from
  [`docs/typescript-volcengine-im-usage.md`](./typescript-volcengine-im-usage.md)
- if you need the mobile baseline, start from
  [`docs/flutter-volcengine-im-usage.md`](./flutter-volcengine-im-usage.md)
- if you need to understand the cross-language standard and provider package boundary model, read
  [`docs/package-standards.md`](./package-standards.md) and
  [`docs/provider-adapter-standard.md`](./provider-adapter-standard.md)

Current reality is straightforward:

- `volcengine` is the default provider
- TypeScript and Flutter are both real runnable baselines now
- `sdkwork-im-sdk` is the standard signaling path for the current end-to-end call flow
- the remaining language workspaces stay standardized and extensible without pretending they are
  already executable runtimes
