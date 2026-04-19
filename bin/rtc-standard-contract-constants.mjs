export const RTC_PROVIDER_SELECTION_SOURCES = Object.freeze([
  'provider_url',
  'provider_key',
  'tenant_override',
  'deployment_profile',
  'default_provider',
]);

export const RTC_PROVIDER_SELECTION_PRECEDENCE = RTC_PROVIDER_SELECTION_SOURCES;

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
