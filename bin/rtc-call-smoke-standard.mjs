#!/usr/bin/env node
import path from 'node:path';
import {
  getRtcDefaultCallSmokeLanguage,
  getRtcExecutableLanguageEntryByLanguage,
} from './rtc-standard-assembly-baseline.mjs';

export const RTC_CALL_SMOKE_DEFAULT_VARIANT = Object.freeze({
  id: 'default',
  labelSuffix: '',
  forwardArgs: Object.freeze([]),
});

export const RTC_CALL_SMOKE_REUSE_LIVE_CONNECTION_VARIANT = Object.freeze({
  id: 'reuse-live-connection',
  labelSuffix: ':reuse-live-connection',
  forwardArgs: Object.freeze(['--reuse-live-connection']),
});

function normalizeLanguage(language) {
  return String(language ?? '').trim().toLowerCase();
}

function renderMarkdownCodeNaturalList(values) {
  const items = (values ?? []).filter(Boolean).map((value) => `\`${value}\``);
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function getRtcCallSmokeVariantDescriptorById(variantId) {
  switch (variantId) {
    case RTC_CALL_SMOKE_DEFAULT_VARIANT.id:
      return RTC_CALL_SMOKE_DEFAULT_VARIANT;
    case RTC_CALL_SMOKE_REUSE_LIVE_CONNECTION_VARIANT.id:
      return RTC_CALL_SMOKE_REUSE_LIVE_CONNECTION_VARIANT;
    default:
      throw new Error(`Unknown RTC call smoke variant id: ${variantId}`);
  }
}

export function getRtcCallSmokeVariantDescriptorsForLanguageEntry(languageEntry) {
  const variantIds = Array.isArray(languageEntry?.runtimeBaseline?.smokeVariants)
    ? languageEntry.runtimeBaseline.smokeVariants
    : [RTC_CALL_SMOKE_DEFAULT_VARIANT.id];

  return variantIds.map(getRtcCallSmokeVariantDescriptorById);
}

export function getRtcCallSmokeVariantDescriptors(assembly, language) {
  const normalizedLanguage = normalizeLanguage(language);
  const languageEntry = getRtcExecutableLanguageEntryByLanguage(assembly, normalizedLanguage);
  if (!languageEntry) {
    return [RTC_CALL_SMOKE_DEFAULT_VARIANT];
  }

  return getRtcCallSmokeVariantDescriptorsForLanguageEntry(languageEntry);
}

export function renderRtcRootCallSmokeCommand(assembly, language) {
  const normalizedLanguage = normalizeLanguage(language);
  const defaultLanguage = getRtcDefaultCallSmokeLanguage(assembly);
  const baseCommand = 'node .\\bin\\sdk-call-smoke.mjs';

  if (normalizedLanguage === defaultLanguage) {
    return `${baseCommand} --json`;
  }

  return `${baseCommand} --language ${normalizedLanguage} --json`;
}

export function renderRtcRootCallSmokeCommandVariants(assembly, language) {
  const baseCommand = renderRtcRootCallSmokeCommand(assembly, language);
  return getRtcCallSmokeVariantDescriptors(assembly, language).map((variant) =>
    variant.forwardArgs.length === 0
      ? baseCommand
      : `${baseCommand} ${variant.forwardArgs.join(' ')}`,
  );
}

export function buildRtcRootCallSmokeSteps(workspaceRoot, languageEntry) {
  const normalizedLanguage = normalizeLanguage(languageEntry?.language);
  const baseArgs = [
    path.join(workspaceRoot, 'bin', 'sdk-call-smoke.mjs'),
    '--language',
    normalizedLanguage,
    '--json',
  ];

  return getRtcCallSmokeVariantDescriptorsForLanguageEntry(languageEntry).map((variant) => ({
    label: `${normalizedLanguage}:call-cli-smoke${variant.labelSuffix}`,
    args: [...baseArgs, ...variant.forwardArgs],
  }));
}

export function renderRtcCallSmokeForwardedVariantHelp(executableLanguageEntries) {
  const supportedLanguages = (executableLanguageEntries ?? [])
    .filter((languageEntry) =>
      getRtcCallSmokeVariantDescriptorsForLanguageEntry(languageEntry).some(
        (variant) => variant.id === RTC_CALL_SMOKE_REUSE_LIVE_CONNECTION_VARIANT.id,
      ),
    )
    .map((languageEntry) => languageEntry.language);

  if (supportedLanguages.length === 0) {
    return '';
  }

  return `  standard forwarded variant: --reuse-live-connection (${renderMarkdownCodeNaturalList(
    supportedLanguages,
  )})`;
}
