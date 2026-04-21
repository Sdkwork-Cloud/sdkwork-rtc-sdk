import 'package:flutter_test/flutter_test.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

void main() {
  test(
      'Flutter root public surface exports RTC signaling transport standard constants',
      () {
    expect(rtcSignalingTransportTerm, 'websocket-only');
    expect(rtcSignalingTransportAuthConfigPath, 'connectOptions.webSocketAuth');
    expect(
      rtcSignalingTransportAuthPassThroughTerm,
      'signaling-sdk-pass-through',
    );
    expect(
      rtcSignalingTransportAuthModeTerms,
      <String>['automatic', 'headerBearer', 'queryBearer', 'none'],
    );
    expect(rtcSignalingTransportRecommendedAuthMode, 'automatic');
    expect(
      rtcSignalingTransportDeviceIdAuthorityTerm,
      'top-level-device-id',
    );
    expect(
      rtcSignalingTransportConnectOptionsDeviceIdRuleTerm,
      'must-match-top-level-device-id',
    );
    expect(
      rtcSignalingTransportLiveConnectionTerm,
      'shared-im-live-connection',
    );
    expect(rtcSignalingTransportPollingFallbackTerm, 'not-supported');
    expect(rtcSignalingTransportAuthFailureTerm, 'fail-fast');
    expect(rtcSignalingTransportStandard, {
      'transportTerm': 'websocket-only',
      'authConfigPath': 'connectOptions.webSocketAuth',
      'authPassThroughTerm': 'signaling-sdk-pass-through',
      'authModeTerms': <String>[
        'automatic',
        'headerBearer',
        'queryBearer',
        'none'
      ],
      'recommendedAuthMode': 'automatic',
      'deviceIdAuthorityTerm': 'top-level-device-id',
      'connectOptionsDeviceIdRuleTerm': 'must-match-top-level-device-id',
      'liveConnectionTerm': 'shared-im-live-connection',
      'pollingFallbackTerm': 'not-supported',
      'authFailureTerm': 'fail-fast',
    });
  });
}
