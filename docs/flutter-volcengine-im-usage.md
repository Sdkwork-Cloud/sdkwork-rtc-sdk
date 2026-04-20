# SDKWork RTC SDK Flutter Usage

This document describes the current executable Flutter/mobile baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default mobile runtime package: official `volc_engine_rtc`
- Default mobile runtime import path: `package:volc_engine_rtc/volc_engine_rtc.dart`
- Default signaling package: `im_sdk`
- Default signaling import path: `package:im_sdk/im_sdk.dart`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallController`
- Recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- Smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- Smoke mode: `analysis-backed`

## Install

Add the standard RTC package, the official Volcengine Flutter SDK, and the IM SDK:

```yaml
dependencies:
  flutter:
    sdk: flutter
  rtc_sdk:
    path: ../sdkwork-rtc-sdk/sdkwork-rtc-sdk-flutter
  im_sdk:
    path: ../../sdkwork-im-sdk/sdkwork-im-sdk-flutter/composed
  volc_engine_rtc: ^3.60.3
```

## Fast Smoke Verification

Run the public Flutter smoke command inside `sdkwork-rtc-sdk-flutter` when you need to verify the default
`volcengine + im_sdk` path without live services:

```powershell
node ./bin/sdk-call-smoke.mjs --json
```

The executable wrapper is currently analyze-backed because the official
`volc_engine_rtc` package crashes under Dart VM CLI compilation in the current toolchain.
It still gives one stable command for maintainers to verify the standard smoke scenario source.

The verified smoke surface is:

- `createStandardRtcCallControllerStack(...)`
- the default `volcengine` provider selection path
- `im_sdk` client composition through `ImSdkClient.create(...)`
- the official Volcengine Flutter bridge smoke scenario source in `bin/sdk-call-smoke.dart`
- the future runtime-backed path that will be used once the vendor package is CLI-runnable in the
  active toolchain

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
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.audio),
      kind: RtcTrackKind.audio,
    ),
  );

  await rtcClient.publish(
    RtcPublishOptions(
      trackId: createRtcCallTrackId('rtc-session-1', RtcTrackKind.video),
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
- conversation-scoped incoming call discovery through `im_sdk`
- realtime session signal delivery through `im_sdk`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

```dart
import 'package:im_sdk/im_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';

Future<void> startRtcCall({
  required ImSdkClient imSdk,
  required String currentUserId,
}) async {
  final rtc = await createStandardRtcCallControllerStack<
      RtcVolcengineFlutterNativeClient>(
    CreateStandardRtcCallControllerStackOptions(
      sdk: imSdk,
      deviceId: 'device-1',
      watchConversationIds: const <String>['conversation-1'],
      dataSourceOptions: const RtcDataSourceOptions(
        nativeConfig: RtcVolcengineFlutterNativeConfig(
          appId: 'volc-app-id',
        ),
      ),
    ),
  );

  rtc.callController.onEvent((event) {
    if (event.type == RtcCallControllerEventType.incomingInvitation) {
      unawaited(
        rtc.callController.acceptIncoming(
          RtcCallControllerAcceptOptions(
            rtcSessionId: event.invitation!.rtcSessionId,
            participantId: currentUserId,
            autoPublish: const RtcCallAutoPublishOptions(
              audio: true,
              video: true,
            ),
          ),
        ),
      );
    }
  });

  await rtc.callController.startOutgoing(
    RtcCallControllerOutgoingOptions(
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

  await rtc.callController.sendOffer(
    const RtcCallSessionDescriptionPayload(
      sdp: 'offer-sdp',
    ),
  );

  await rtc.callController.sendIceCandidate(
    const RtcCallIceCandidatePayload(
      candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
    ),
  );

  await rtc.callController.end();
}
```

## Signaling Contract Mapping

`createImRtcSignalingAdapter(...)` maps the `im_sdk` composed RTC surface to the RTC
standard call/signaling contract:

- `sdk.rtc.create(...)` -> `createSession(...)`
- `sdk.rtc.invite(...)` -> `inviteSession(...)`
- `sdk.rtc.accept(...)` -> `acceptSession(...)`
- `sdk.rtc.reject(...)` -> `rejectSession(...)`
- `sdk.rtc.end(...)` -> `endSession(...)`
- `sdk.rtc.postJsonSignal(...)` -> `sendSignal(...)`
- `sdk.rtc.issueParticipantCredential(...)` -> `issueParticipantCredential(...)`
- `sdk.realtime.pullEvents(...)` -> internal shared RTC realtime dispatcher
- `sdk.conversations.postMessage(...)` with a signal part -> conversation-scoped invite publication

## Runtime Guarantees

- `createStandardRtcCallControllerStack(...)` returns `driverManager`, `dataSource`,
  `mediaClient`, `signaling`, `callSession`, `realtimeDispatcher`, and `callController`
  in one explicit standard bundle
- `createRtcCallTrackId(rtcSessionId, kind)` is the standard cross-language track id helper and
  yields canonical ids such as `rtc-session-1-audio`
- `RtcDriverManager()` auto-registers the default Volcengine Flutter driver
- `RtcDataSource()` defaults to `volcengine`
- the call/session layer does not leak IM transport DTOs into the RTC public standard
- `StandardRtcCallController` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
- `StandardRtcCallSession` remains the focused single-session executor under the controller
- `RtcJoinOptions.token` is sourced from IM-issued participant credentials in the standard call
  flow instead of hardcoding vendor tokens in the caller
- audio and video auto-publish are standardized through `RtcCallAutoPublishOptions`
