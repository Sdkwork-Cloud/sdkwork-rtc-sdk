# SDKWork RTC SDK Flutter Usage

This document describes the current executable Flutter/mobile baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default mobile runtime path: official `package:volc_engine_rtc`
- Default signaling integration path: `sdkwork-im-sdk` through `package:im_sdk/im_sdk.dart`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallSession`

## Install

Add the standard RTC package, the official Volcengine Flutter SDK, and the IM SDK:

```yaml
dependencies:
  rtc_sdk:
    path: ../sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter
  im_sdk:
    path: ../sdkwork-im-sdk/sdkwork-im-sdk-flutter/composed
  volc_engine_rtc: ^3.60.3
```

## Media Runtime Only

Use this path when the application already owns its own session orchestration and only needs the
standard media runtime.

```dart
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcMediaOnly() async {
  final dataSource = RtcDataSource(
    options: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
        room: RtcVolcengineFlutterRoomConfig(
          userId: 'user-1',
          profile: 'communication',
          scenario: 'general',
        ),
      ),
    ),
  );

  final rtcClient = await dataSource.createClient<RtcVolcengineFlutterNativeClient>();

  await rtcClient.join(
    const RtcJoinOptions(
      sessionId: 'rtc-session-1',
      roomId: 'room-1',
      participantId: 'user-1',
      token: 'provider-issued-token',
    ),
  );

  await rtcClient.publish(
    const RtcPublishOptions(
      trackId: 'rtc-session-1-audio',
      kind: RtcTrackKind.audio,
    ),
  );

  await rtcClient.publish(
    const RtcPublishOptions(
      trackId: 'rtc-session-1-video',
      kind: RtcTrackKind.video,
    ),
  );
}
```

## Required Native Config

For the default Volcengine Flutter runtime, `RtcVolcengineFlutterNativeConfig.appId` is mandatory.
The driver fails fast before `join()` if it is missing.

The standard native config shape is:

```dart
const RtcVolcengineFlutterNativeConfig(
  appId: 'volc-app-id',
  room: RtcVolcengineFlutterRoomConfig(
    userId: 'user-1',
    profile: 'communication',
    scenario: 'general',
    token: 'optional-direct-room-token',
  ),
);
```

## Complete Call Flow With IM Signaling

Use this path when the app wants one standard session that combines:

- IM-side RTC session creation, invite, accept, reject, and end
- realtime signal delivery through `sdkwork-im-sdk`
- provider participant credential issuance
- Volcengine media join and auto publish

```dart
import 'package:im_sdk/im_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startOutgoingRtcCall({
  required ImSdkClient imSdk,
  required String currentUserId,
}) async {
  final mediaDataSource = RtcDataSource(
    options: const RtcDataSourceOptions(
      nativeConfig: RtcVolcengineFlutterNativeConfig(
        appId: 'volc-app-id',
      ),
    ),
  );

  final mediaClient =
      await mediaDataSource.createClient<RtcVolcengineFlutterNativeClient>();

  final signaling = createImRtcSignalingAdapter(
    CreateImRtcSignalingAdapterOptions(
      sdk: imSdk,
      deviceId: 'device-1',
    ),
  );

  final callSession = StandardRtcCallSession(
    mediaClient: mediaClient,
    signaling: signaling,
  );

  callSession.onSignal((signal) {
    print('${signal.signalType}: ${signal.rawPayload}');
  });

  await callSession.startOutgoing(
    RtcOutgoingCallOptions(
      rtcSessionId: 'rtc-session-1',
      conversationId: 'conversation-1',
      rtcMode: 'video_call',
      roomId: 'room-1',
      participantId: currentUserId,
      signalingStreamId: 'rtc-signal-1',
      autoPublish: const RtcCallAutoPublishOptions(
        audio: true,
        video: true,
      ),
    ),
  );

  await callSession.sendSignal(
    'custom-control',
    <String, Object?>{
      'action': 'pin_remote',
    },
  );

  await callSession.end();
}
```

## Signaling Contract Mapping

`createImRtcSignalingAdapter(...)` maps the `sdkwork-im-sdk` composed RTC surface to the RTC
standard call/signaling contract:

- `sdk.rtc.create(...)` -> `createSession(...)`
- `sdk.rtc.invite(...)` -> `inviteSession(...)`
- `sdk.rtc.accept(...)` -> `acceptSession(...)`
- `sdk.rtc.reject(...)` -> `rejectSession(...)`
- `sdk.rtc.end(...)` -> `endSession(...)`
- `sdk.rtc.postJsonSignal(...)` -> `sendSignal(...)`
- `sdk.rtc.issueParticipantCredential(...)` -> `issueParticipantCredential(...)`
- `sdk.realtime.pullEvents(...)` -> internal shared RTC realtime dispatcher

## Runtime Guarantees

- `RtcDriverManager()` auto-registers the default Volcengine Flutter driver
- `RtcDataSource()` defaults to `volcengine`
- the call/session layer does not leak IM transport DTOs into the RTC public standard
- `StandardRtcCallSession` composes signaling and media into one provider-neutral call flow
- `RtcJoinOptions.token` is sourced from IM-issued participant credentials in the standard call
  flow instead of hardcoding vendor tokens in the caller
- audio and video auto-publish are standardized through `RtcCallAutoPublishOptions`
