export const REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS = Object.freeze([
  'root_public_reference_boundary',
  'package_reference_boundary',
]);

export const REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS =
  Object.freeze(['reference-baseline']);

export const LEGACY_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_TERMS = Object.freeze([
  'reserved TypeScript provider package boundaries',
  'builtin_reference_boundary',
  'official_reserved_boundary',
]);

export const KNOWN_PROVIDER_PACKAGE_TEMPLATE_TOKENS = Object.freeze([
  '{providerKey}',
  '{providerPascal}',
]);

export const KNOWN_RESERVED_PROVIDER_PACKAGE_SCAFFOLD_STATUSES = Object.freeze([
  'future-runtime-bridge-only',
]);

export const KNOWN_RESERVED_PROVIDER_PACKAGE_RUNTIME_BRIDGE_STATUSES = Object.freeze([
  'reserved',
]);

export const REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS = Object.freeze([
  'future-runtime-bridge-only',
]);

export const REQUIRED_RESERVED_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS =
  Object.freeze(['reserved']);

export const KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_LIFECYCLE_STATUS_TERMS =
  Object.freeze([
    ...new Set([
      ...REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_STATUS_TERMS,
      ...KNOWN_RESERVED_PROVIDER_PACKAGE_SCAFFOLD_STATUSES,
    ]),
  ]);

export const KNOWN_LANGUAGE_WORKSPACE_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS =
  Object.freeze([
    ...new Set([
      ...REQUIRED_TYPESCRIPT_PROVIDER_PACKAGE_BOUNDARY_RUNTIME_BRIDGE_STATUS_TERMS,
      ...KNOWN_RESERVED_PROVIDER_PACKAGE_RUNTIME_BRIDGE_STATUSES,
    ]),
  ]);
