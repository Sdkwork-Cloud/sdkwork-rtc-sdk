import 'package:flutter_test/flutter_test.dart';
import 'package:im_sdk/im_sdk.dart';

import '../bin/sdk-call-smoke.dart' as smoke_cli;

void main() {
  test('Flutter call smoke helper emits the RTC signaling transport descriptor', () {
    final signalingTransport = smoke_cli.buildRtcCallSmokeSignalingTransportSummary(
      deviceId: 'device-smoke',
    );

    expect(signalingTransport, <String, Object?>{
      'deviceId': 'device-smoke',
      'connectOptionsDeviceId': 'device-smoke',
      'authMode': 'automatic',
      'usesSharedLiveConnection': false,
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
  });

  test('Flutter call smoke helper reports shared IM WebSocket reuse in the signaling descriptor',
      () {
    final signalingTransport = smoke_cli.buildRtcCallSmokeSignalingTransportSummary(
      deviceId: 'device-smoke',
      liveConnection: _FakeImLiveConnection(),
    );

    expect(signalingTransport['usesSharedLiveConnection'], true);
    expect(signalingTransport['deviceId'], 'device-smoke');
    expect(signalingTransport['connectOptionsDeviceId'], 'device-smoke');
    expect(signalingTransport['authMode'], 'automatic');
  });
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
