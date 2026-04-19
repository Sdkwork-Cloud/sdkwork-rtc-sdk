export const RTC_PROVIDER_SELECTION_SOURCES = Object.freeze([
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
]);

export const RTC_PROVIDER_SELECTION_PRECEDENCE = RTC_PROVIDER_SELECTION_SOURCES;

export const DEFAULT_RTC_PROVIDER_KEY = 'volcengine';

export const BUILTIN_RTC_PROVIDER_KEYS = Object.freeze([
  'volcengine',
  'aliyun',
  'tencent',
]);

export const OFFICIAL_RTC_LANGUAGE_WORKSPACE_KEYS = Object.freeze([
  'typescript',
  'flutter',
  'rust',
  'java',
  'csharp',
  'swift',
  'kotlin',
  'go',
  'python',
]);

export const RTC_PROVIDER_SUPPORT_STATUSES = Object.freeze([
  'builtin_registered',
  'official_registered',
  'official_unregistered',
  'unknown',
]);

export const RTC_PROVIDER_ACTIVATION_STATUSES = Object.freeze([
  'root-public-builtin',
  'package-boundary',
  'control-metadata-only',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_MODES = Object.freeze([
  'catalog-governed-mixed',
  'scaffold-per-provider-package',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_ROOT_PUBLIC_POLICIES = Object.freeze([
  'builtin-only',
  'none',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS = Object.freeze([
  'root_public_reference_boundary',
  'package_reference_boundary',
  'future-runtime-bridge-only',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS = Object.freeze([
  'reference-baseline',
  'reserved',
]);

export const RTC_PROVIDER_PACKAGE_BOUNDARY_PROFILES = Object.freeze({
  reference: Object.freeze({
    mode: 'catalog-governed-mixed',
    rootPublicPolicy: 'builtin-only',
    lifecycleStatusTerms: Object.freeze([
      'root_public_reference_boundary',
      'package_reference_boundary',
    ]),
    runtimeBridgeStatusTerms: Object.freeze(['reference-baseline']),
  }),
  reserved: Object.freeze({
    mode: 'scaffold-per-provider-package',
    rootPublicPolicy: 'none',
    lifecycleStatusTerms: Object.freeze(['future-runtime-bridge-only']),
    runtimeBridgeStatusTerms: Object.freeze(['reserved']),
  }),
});

export const REQUIRED_RTC_CAPABILITIES = Object.freeze([
  'session',
  'join',
  'publish',
  'subscribe',
  'mute',
  'basic-events',
  'health',
  'unwrap',
]);

export const OPTIONAL_RTC_CAPABILITIES = Object.freeze([
  'screen-share',
  'recording',
  'cloud-mix',
  'cdn-relay',
  'data-channel',
  'transcription',
  'beauty',
  'spatial-audio',
  'e2ee',
]);

export const RTC_CAPABILITY_CATEGORIES = Object.freeze([
  'required-baseline',
  'optional-advanced',
]);

export const RTC_CAPABILITY_SURFACES = Object.freeze([
  'control-plane',
  'runtime-bridge',
  'cross-surface',
]);

export const RTC_PROVIDER_EXTENSION_ACCESSES = Object.freeze([
  'unwrap-only',
  'extension-object',
]);

export const RTC_PROVIDER_EXTENSION_STATUSES = Object.freeze([
  'reference-baseline',
  'reserved',
]);

export const RTC_LANGUAGE_MATURITY_TIERS = Object.freeze([
  'reference',
  'reserved',
]);

export const TYPESCRIPT_ADAPTER_SDK_PROVISIONING_VALUES = Object.freeze([
  'consumer-supplied',
]);

export const TYPESCRIPT_ADAPTER_BINDING_STRATEGIES = Object.freeze([
  'native-factory',
]);

export const TYPESCRIPT_ADAPTER_BUNDLE_POLICIES = Object.freeze([
  'must-not-bundle',
]);

export const TYPESCRIPT_ADAPTER_RUNTIME_BRIDGE_STATUSES = Object.freeze([
  'reference-baseline',
]);

export const TYPESCRIPT_ADAPTER_OFFICIAL_VENDOR_SDK_REQUIREMENTS = Object.freeze([
  'required',
]);

export const DEFAULT_TYPESCRIPT_ADAPTER_CONTRACT = Object.freeze({
  sdkProvisioning: 'consumer-supplied',
  bindingStrategy: 'native-factory',
  bundlePolicy: 'must-not-bundle',
  runtimeBridgeStatus: 'reference-baseline',
  officialVendorSdkRequirement: 'required',
});
