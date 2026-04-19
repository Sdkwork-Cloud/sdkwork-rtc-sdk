import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcCapabilityDescriptor } from './types.js';

export const REQUIRED_RTC_CAPABILITIES = freezeRtcRuntimeValue(['session', 'join', 'publish', 'subscribe', 'mute', 'basic-events', 'health', 'unwrap'] as const);
export const OPTIONAL_RTC_CAPABILITIES = freezeRtcRuntimeValue(['screen-share', 'recording', 'cloud-mix', 'cdn-relay', 'data-channel', 'transcription', 'beauty', 'spatial-audio', 'e2ee'] as const);

export type RtcRequiredCapability = (typeof REQUIRED_RTC_CAPABILITIES)[number];
export type RtcOptionalCapability = (typeof OPTIONAL_RTC_CAPABILITIES)[number];
export type RtcCapabilityKey = RtcRequiredCapability | RtcOptionalCapability;

export const SESSION_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'session',
  category: 'required-baseline',
  surface: 'cross-surface',
});

export const JOIN_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'join',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const PUBLISH_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'publish',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const SUBSCRIBE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'subscribe',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const MUTE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'mute',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const BASIC_EVENTS_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'basic-events',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const HEALTH_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'health',
  category: 'required-baseline',
  surface: 'control-plane',
});

export const UNWRAP_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'unwrap',
  category: 'required-baseline',
  surface: 'runtime-bridge',
});

export const SCREEN_SHARE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'screen-share',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const RECORDING_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'recording',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const CLOUD_MIX_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'cloud-mix',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const CDN_RELAY_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'cdn-relay',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const DATA_CHANNEL_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'data-channel',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const TRANSCRIPTION_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'transcription',
  category: 'optional-advanced',
  surface: 'control-plane',
});

export const BEAUTY_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'beauty',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const SPATIAL_AUDIO_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'spatial-audio',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const E2EE_RTC_CAPABILITY_DESCRIPTOR: RtcCapabilityDescriptor<RtcCapabilityKey> = freezeRtcRuntimeValue({
  capabilityKey: 'e2ee',
  category: 'optional-advanced',
  surface: 'runtime-bridge',
});

export const RTC_CAPABILITY_CATALOG: readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] = freezeRtcRuntimeValue([
  SESSION_RTC_CAPABILITY_DESCRIPTOR,
  JOIN_RTC_CAPABILITY_DESCRIPTOR,
  PUBLISH_RTC_CAPABILITY_DESCRIPTOR,
  SUBSCRIBE_RTC_CAPABILITY_DESCRIPTOR,
  MUTE_RTC_CAPABILITY_DESCRIPTOR,
  BASIC_EVENTS_RTC_CAPABILITY_DESCRIPTOR,
  HEALTH_RTC_CAPABILITY_DESCRIPTOR,
  UNWRAP_RTC_CAPABILITY_DESCRIPTOR,
  SCREEN_SHARE_RTC_CAPABILITY_DESCRIPTOR,
  RECORDING_RTC_CAPABILITY_DESCRIPTOR,
  CLOUD_MIX_RTC_CAPABILITY_DESCRIPTOR,
  CDN_RELAY_RTC_CAPABILITY_DESCRIPTOR,
  DATA_CHANNEL_RTC_CAPABILITY_DESCRIPTOR,
  TRANSCRIPTION_RTC_CAPABILITY_DESCRIPTOR,
  BEAUTY_RTC_CAPABILITY_DESCRIPTOR,
  SPATIAL_AUDIO_RTC_CAPABILITY_DESCRIPTOR,
  E2EE_RTC_CAPABILITY_DESCRIPTOR
]);

const RTC_CAPABILITY_DESCRIPTOR_BY_KEY = new Map<
  RtcCapabilityKey,
  RtcCapabilityDescriptor<RtcCapabilityKey>
>(RTC_CAPABILITY_CATALOG.map((descriptor) => [descriptor.capabilityKey, descriptor]));

export function getRtcCapabilityCatalog(): readonly RtcCapabilityDescriptor<RtcCapabilityKey>[] {
  return RTC_CAPABILITY_CATALOG;
}

export function getRtcCapabilityDescriptor(
  capabilityKey: RtcCapabilityKey,
): RtcCapabilityDescriptor<RtcCapabilityKey> | undefined {
  return RTC_CAPABILITY_DESCRIPTOR_BY_KEY.get(capabilityKey);
}
