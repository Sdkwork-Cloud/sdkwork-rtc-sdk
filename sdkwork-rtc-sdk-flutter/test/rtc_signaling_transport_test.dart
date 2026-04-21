import 'package:flutter_test/flutter_test.dart';
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:im_sdk/im_sdk.dart';

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

  test(
    'Flutter root public surface describes websocket auth and liveConnection reuse',
    () {
      final descriptor = describeRtcSignalingTransport(
        deviceId: ' device-1 ',
        connectOptions: const ImConnectOptions(
          deviceId: 'device-1',
        ),
        liveConnection: _FakeImLiveConnection(),
      );

      expect(descriptor.deviceId, 'device-1');
      expect(descriptor.connectOptionsDeviceId, 'device-1');
      expect(descriptor.authMode, 'automatic');
      expect(descriptor.usesSharedLiveConnection, isTrue);
      expect(descriptor.transportTerm, 'websocket-only');
      expect(descriptor.authConfigPath, 'connectOptions.webSocketAuth');
      expect(descriptor.authPassThroughTerm, 'signaling-sdk-pass-through');
      expect(descriptor.recommendedAuthMode, 'automatic');
      expect(descriptor.deviceIdAuthorityTerm, 'top-level-device-id');
      expect(
        descriptor.connectOptionsDeviceIdRuleTerm,
        'must-match-top-level-device-id',
      );
      expect(descriptor.liveConnectionTerm, 'shared-im-live-connection');
      expect(descriptor.pollingFallbackTerm, 'not-supported');
      expect(descriptor.authFailureTerm, 'fail-fast');
      expect(descriptor.toJson(), {
        'deviceId': 'device-1',
        'connectOptionsDeviceId': 'device-1',
        'authMode': 'automatic',
        'usesSharedLiveConnection': true,
        'transportTerm': 'websocket-only',
        'authConfigPath': 'connectOptions.webSocketAuth',
        'authPassThroughTerm': 'signaling-sdk-pass-through',
        'recommendedAuthMode': 'automatic',
        'deviceIdAuthorityTerm': 'top-level-device-id',
        'connectOptionsDeviceIdRuleTerm': 'must-match-top-level-device-id',
        'liveConnectionTerm': 'shared-im-live-connection',
        'pollingFallbackTerm': 'not-supported',
        'authFailureTerm': 'fail-fast',
      });
    },
  );

  test(
    'Flutter root public surface rejects mismatched connectOptions.deviceId',
    () {
      expect(
        () => describeRtcSignalingTransport(
          deviceId: 'device-1',
          connectOptions: const ImConnectOptions(
            deviceId: 'device-2',
          ),
        ),
        throwsA(
          isA<ArgumentError>().having(
            (error) => error.message,
            'message',
            contains('deviceId'),
          ),
        ),
      );
    },
  );
}

class _FakeImLiveConnection implements ImLiveConnection {
  @override
  ImLiveEventStream get events => throw UnimplementedError();

  @override
  ImLiveLifecycleStream get lifecycle => throw UnimplementedError();

  @override
  ImLiveMessageStream get messages => throw UnimplementedError();

  @override
  ImLiveSignalStream get signals => throw UnimplementedError();

  @override
  Future<void> disconnect([int? code, String? reason]) async {}
}
