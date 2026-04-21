import 'package:flutter_test/flutter_test.dart';
import 'package:im_sdk/im_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

void main() {
  test(
    'RtcImRealtimeDispatcher fails fast when websocket auth connect is rejected',
    () async {
      final sdk = _FakeImSdkClient(
        connectImpl: ([
          ImConnectOptions options = const ImConnectOptions(),
        ]) async {
          throw StateError('websocket auth rejected');
        },
      );
      final dispatcher = RtcImRealtimeDispatcher(
        CreateImRtcSignalingAdapterOptions(
          sdk: sdk,
          deviceId: 'device-1',
          reconnectInterval: const Duration(milliseconds: 20),
          connectOptions: const ImConnectOptions(
            webSocketAuth: ImWebSocketAuthOptions.queryBearer(),
          ),
        ),
      );

      await expectLater(
        dispatcher.subscribeRtcSessionSignals(
          'rtc-session-1',
          (signal) async {},
        ),
        throwsA(
          isA<StateError>().having(
            (error) => error.message,
            'message',
            contains('auth rejected'),
          ),
        ),
      );

      await Future<void>.delayed(const Duration(milliseconds: 80));

      expect(sdk.connectCalls, 1);
      expect(sdk.lastConnectOptions?.deviceId, 'device-1');
      expect(
        sdk.lastConnectOptions?.subscriptions?.rtcSessions,
        <String>['rtc-session-1'],
      );
      expect(
        sdk.lastConnectOptions?.webSocketAuth?.mode,
        ImWebSocketAuthMode.queryBearer,
      );
      expect(sdk.fakeRealtime.replaceSubscriptionsCalls, 0);
    },
  );
}

class _FakeImSdkClient extends ImSdkClient {
  _FakeImSdkClient({
    required this.connectImpl,
  })  : fakeRealtime = _FakeRealtimeModule(),
        super(
          ImSdkClientOptions(
            transportClient: ImTransportClient(
              config: const ImGeneratedConfig(baseUrl: 'http://127.0.0.1'),
            ),
          ),
        );

  final _FakeRealtimeModule fakeRealtime;
  final Future<ImLiveConnection> Function([
    ImConnectOptions options,
  ]) connectImpl;
  int connectCalls = 0;
  ImConnectOptions? lastConnectOptions;

  @override
  ImRealtimeModule get realtime => fakeRealtime;

  @override
  Future<ImLiveConnection> connect([
    ImConnectOptions options = const ImConnectOptions(),
  ]) {
    connectCalls += 1;
    lastConnectOptions = options;
    return connectImpl(options);
  }
}

class _FakeRealtimeModule extends ImRealtimeModule {
  _FakeRealtimeModule()
      : super(
          ImSdkContext(
            transportClient: ImTransportClient(
              config: const ImGeneratedConfig(baseUrl: 'http://127.0.0.1'),
            ),
          ),
        );

  int replaceSubscriptionsCalls = 0;

  @override
  Future<RealtimeSubscriptionSnapshot?> replaceSubscriptions(
    SyncRealtimeSubscriptionsRequest body,
  ) async {
    replaceSubscriptionsCalls += 1;
    return null;
  }
}
