import { freezeRtcRuntimeValue } from './runtime-freeze.js';

export const RTC_SIGNALING_TRANSPORT_TERM = 'websocket-only';

export const RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH = 'connectOptions.webSocketAuth';

export const RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM = 'signaling-sdk-pass-through';

export const RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS = freezeRtcRuntimeValue(['automatic', 'headerBearer', 'queryBearer', 'none'] as const);

export type RtcSignalingTransportAuthMode =
  (typeof RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS)[number];

export const RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE: RtcSignalingTransportAuthMode = 'automatic';

export const RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM = 'top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM = 'must-match-top-level-device-id';

export const RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM = 'shared-im-live-connection';

export const RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM = 'not-supported';

export const RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM = 'fail-fast';

export const RTC_SIGNALING_TRANSPORT_STANDARD = freezeRtcRuntimeValue({
  transportTerm: RTC_SIGNALING_TRANSPORT_TERM,
  authConfigPath: RTC_SIGNALING_TRANSPORT_AUTH_CONFIG_PATH,
  authPassThroughTerm: RTC_SIGNALING_TRANSPORT_AUTH_PASS_THROUGH_TERM,
  authModeTerms: RTC_SIGNALING_TRANSPORT_AUTH_MODE_TERMS,
  recommendedAuthMode: RTC_SIGNALING_TRANSPORT_RECOMMENDED_AUTH_MODE,
  deviceIdAuthorityTerm: RTC_SIGNALING_TRANSPORT_DEVICE_ID_AUTHORITY_TERM,
  connectOptionsDeviceIdRuleTerm:
    RTC_SIGNALING_TRANSPORT_CONNECT_OPTIONS_DEVICE_ID_RULE_TERM,
  liveConnectionTerm: RTC_SIGNALING_TRANSPORT_LIVE_CONNECTION_TERM,
  pollingFallbackTerm: RTC_SIGNALING_TRANSPORT_POLLING_FALLBACK_TERM,
  authFailureTerm: RTC_SIGNALING_TRANSPORT_AUTH_FAILURE_TERM,
} as const);
