const String rtcSignalingTransportTerm = 'websocket-only';
const String rtcSignalingTransportAuthConfigPath =
    'connectOptions.webSocketAuth';
const String rtcSignalingTransportAuthPassThroughTerm =
    'signaling-sdk-pass-through';
const List<String> rtcSignalingTransportAuthModeTerms = <String>[
  'automatic',
  'headerBearer',
  'queryBearer',
  'none',
];
const String rtcSignalingTransportRecommendedAuthMode = 'automatic';
const String rtcSignalingTransportDeviceIdAuthorityTerm =
    'top-level-device-id';
const String rtcSignalingTransportConnectOptionsDeviceIdRuleTerm =
    'must-match-top-level-device-id';
const String rtcSignalingTransportLiveConnectionTerm =
    'shared-im-live-connection';
const String rtcSignalingTransportPollingFallbackTerm = 'not-supported';
const String rtcSignalingTransportAuthFailureTerm = 'fail-fast';

const Map<String, Object> rtcSignalingTransportStandard = <String, Object>{
  'transportTerm': rtcSignalingTransportTerm,
  'authConfigPath': rtcSignalingTransportAuthConfigPath,
  'authPassThroughTerm': rtcSignalingTransportAuthPassThroughTerm,
  'authModeTerms': rtcSignalingTransportAuthModeTerms,
  'recommendedAuthMode': rtcSignalingTransportRecommendedAuthMode,
  'deviceIdAuthorityTerm': rtcSignalingTransportDeviceIdAuthorityTerm,
  'connectOptionsDeviceIdRuleTerm':
      rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
  'liveConnectionTerm': rtcSignalingTransportLiveConnectionTerm,
  'pollingFallbackTerm': rtcSignalingTransportPollingFallbackTerm,
  'authFailureTerm': rtcSignalingTransportAuthFailureTerm,
};
