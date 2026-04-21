# SDKWork RTC SDK TypeScript Usage

This document describes the current executable TypeScript baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default web runtime package: official `@volcengine/rtc`
- Default web runtime import path: `@volcengine/rtc`
- Default signaling package: `@sdkwork/im-sdk`
- Default signaling import path: `@sdkwork/im-sdk`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallController`
- Recommended quick-start entrypoint: `createStandardRtcCallControllerStack`
- Smoke command: `node ./bin/sdk-call-smoke.mjs --json`
- Smoke mode: `runtime-backed`
- Smoke variants: `default` and `reuse-live-connection`

## Install

```bash
npm install @sdkwork/rtc-sdk @volcengine/rtc @sdkwork/im-sdk
```

## Fast Smoke Verification

Run the public TypeScript smoke command inside `sdkwork-rtc-sdk-typescript` when you want to validate the
default provider entrypoint without depending on a live IM service or a real vendor credential:

```bash
node ./bin/sdk-call-smoke.mjs --json
```

The smoke CLI runs the public `@sdkwork/rtc-sdk` surface against mocked `@sdkwork/im-sdk`
signaling and a mocked official `@volcengine/rtc` module, then prints the resolved provider,
runtime calls, signaling calls, and final controller states.
Add `--reuse-live-connection` when you want the smoke to verify RTC reuses an app-owned IM
WebSocket live connection instead of opening another one.

## WebSocket Auth Standard

RTC delegates live signaling auth directly to `@sdkwork/im-sdk`.
Prefer the official IM auth helpers instead of hand-writing raw mode objects.

- `ImWebSocketAuthOptions.automatic()` is the recommended default; on the standard browser
  `WebSocket` path it resolves to query-bearer auth
- `ImWebSocketAuthOptions.queryBearer()` is the explicit browser/gateway override when the upstream
  only accepts query-parameter auth
- `ImWebSocketAuthOptions.headerBearer()` is the explicit Node or custom-socket override when
  headers are available
- `ImWebSocketAuthOptions.none()` is reserved for trusted internal links or pre-signed socket
  URLs
- prefer `credentialProvider` with a short-lived realtime ticket; avoid putting long-lived access
  tokens on the WebSocket URL
- keep `deviceId` at the RTC stack top level; `connectOptions.deviceId` is optional and must
  match when supplied
- when the application already owns a shared IM socket, pass `liveConnection` so RTC syncs
  subscriptions on that same WebSocket instead of opening another one

```ts
import { ImSdkClient, ImWebSocketAuthOptions } from '@sdkwork/im-sdk';
import { createStandardRtcCallControllerStack } from '@sdkwork/rtc-sdk';

const imSdk = new ImSdkClient({
  baseUrl: 'https://craw-chat.example.com',
  authToken: 'app-token',
});

const rtc = await createStandardRtcCallControllerStack({
  sdk: imSdk,
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: ImWebSocketAuthOptions.automatic(),
  },
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});
```

## Media Runtime Only

Use this path when the app already has its own session/token orchestration and only needs the RTC
media runtime.

```ts
import {
  createRtcCallTrackId,
  RtcDataSource,
  createBuiltinRtcDriverManager,
} from '@sdkwork/rtc-sdk';

const dataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  nativeConfig: {
    appId: 'volc-app-id',
    engineConfig: {
      env: 'production',
    },
    roomConfig: {
      profile: 'communication',
    },
    userExtraInfo: {
      displayName: 'Alice',
    },
    capture: {
      audioDeviceId: 'default-mic',
      videoDeviceId: 'default-camera',
    },
  },
});

const rtcClient = await dataSource.createClient();

await rtcClient.join({
  sessionId: 'rtc-session-1',
  roomId: 'room-1',
  participantId: 'user-1',
  token: 'provider-issued-token',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'audio'),
  kind: 'audio',
});

await rtcClient.publish({
  trackId: createRtcCallTrackId('rtc-session-1', 'video'),
  kind: 'video',
});
```

### Required Native Config

For the default Volcengine Web runtime, `nativeConfig.appId` is mandatory before `join()`.

Supported Volcengine Web native config shape:

```ts
type RtcVolcengineWebNativeConfig = {
  appId?: string;
  engineConfig?: Record<string, unknown>;
  roomConfig?: Record<string, unknown>;
  userExtraInfo?: Record<string, unknown>;
  capture?: {
    audioDeviceId?: string;
    videoDeviceId?: string;
  };
};
```

## Complete Call Flow With IM Signaling

Use this path when the app wants one standard session that combines:

- IM-side RTC session creation/invite/accept/reject/end
- conversation-scoped incoming call discovery through `@sdkwork/im-sdk`
- realtime session signal delivery through `@sdkwork/im-sdk`
- provider participant credential issuance
- Volcengine media join and auto publish
- typed offer/answer/ice signaling over the RTC session stream

```ts
import { ImSdkClient, ImWebSocketAuthOptions } from '@sdkwork/im-sdk';
import {
  createStandardRtcCallControllerStack,
  RTC_CALL_OFFER_SIGNAL_TYPE,
} from '@sdkwork/rtc-sdk';

const imSdk = new ImSdkClient({
  baseUrl: 'https://craw-chat.example.com',
  authToken: 'app-token',
});

const rtc = await createStandardRtcCallControllerStack({
  sdk: imSdk,
  deviceId: 'device-1',
  connectOptions: {
    webSocketAuth: ImWebSocketAuthOptions.automatic(),
  },
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});

rtc.callController.onEvent((event) => {
  if (event.type === 'incoming_invitation') {
    void rtc.callController.acceptIncoming({
      rtcSessionId: event.invitation.rtcSessionId,
      participantId: 'user-1',
      autoPublish: {
        audio: true,
        video: true,
      },
    });
  }

  if (event.type === 'signal' && event.signal.signalType === RTC_CALL_OFFER_SIGNAL_TYPE) {
    console.log('remote offer', event.signal.payload);
  }
});

await rtc.callController.startOutgoing({
  rtcSessionId: 'rtc-session-1',
  conversationId: 'conversation-1',
  rtcMode: 'video_call',
  roomId: 'room-1',
  participantId: 'user-1',
  signalingStreamId: 'rtc-signal-1',
  autoPublish: {
    audio: true,
    video: true,
  },
});

await rtc.callController.sendOffer({
  sdp: 'offer-sdp',
});

await rtc.callController.sendIceCandidate({
  candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
});

await rtc.callController.end();
```

## Reuse Existing IM WebSocket

When the application already owns one shared IM live connection, reuse it so RTC does not open a
second WebSocket:

```ts
const liveConnection = await imSdk.connect({
  deviceId: 'device-1',
  subscriptions: {
    conversations: ['conversation-1'],
  },
  webSocketAuth: ImWebSocketAuthOptions.automatic(),
});

const rtc = await createStandardRtcCallControllerStack({
  sdk: imSdk,
  deviceId: 'device-1',
  liveConnection,
  watchConversationIds: ['conversation-1'],
  dataSourceConfig: {
    nativeConfig: {
      appId: 'volc-app-id',
    },
  },
});
```

## Signaling Contract Mapping

`createImRtcSignalingAdapter(...)` maps the `@sdkwork/im-sdk` composed RTC surface to the RTC
standard call/signaling contract:

- `sdk.rtc.create(...)` -> `createSession(...)`
- `sdk.rtc.invite(...)` -> `inviteSession(...)`
- `sdk.rtc.accept(...)` -> `acceptSession(...)`
- `sdk.rtc.reject(...)` -> `rejectSession(...)`
- `sdk.rtc.end(...)` -> `endSession(...)`
- `sdk.rtc.postJsonSignal(...)` -> `sendSignal(...)`
- `sdk.rtc.issueParticipantCredential(...)` -> `issueParticipantCredential(...)`
- shared `RtcImRealtimeDispatcher` -> one IM WebSocket connection for both
  `sdk.connect(...).signals.onRtcSession(...)` and
  `sdk.connect(...).messages.onConversation(...)`
- `sdk.createSignalMessage(...)` + `sdk.send(...)` -> conversation-scoped invite publication
- `sdk.realtime.replaceSubscriptions(...)` -> live subscription sync without opening a second
  realtime connection

## Runtime Guarantees

- `createStandardRtcCallControllerStack(...)` returns `driverManager`, `dataSource`,
  `mediaClient`, `signaling`, `callSession`, `realtimeDispatcher`, and `callController`
  as one explicit standard bundle
- `createRtcCallTrackId(rtcSessionId, kind)` is the standard cross-language track id helper and
  yields canonical ids such as `rtc-session-1-audio`
- TypeScript now defaults `subscribeSignals` to `true`, aligned with Flutter/mobile
- `createBuiltinRtcDriverManager()` defaults to `volcengine`
- Volcengine Web runtime loading is lazy
- official vendor SDKs are not bundled into the RTC standard package
- IM signaling is WebSocket-first; the TypeScript RTC standard does not expose polling controls
- `connectOptions.webSocketAuth` is passed through to `@sdkwork/im-sdk`
  so browser gateways can prefer query-bearer WebSocket auth while non-browser callers can keep
  header-bearer mode
- `liveConnection` lets the TypeScript RTC standard reuse an app-owned shared IM WebSocket live
  connection instead of opening a second RTC-specific socket
- `deviceId` remains the authoritative RTC realtime identity; when
  `connectOptions.deviceId` is provided it must match the RTC stack `deviceId`
- signal payloads are exposed as parsed JSON when possible and as raw strings otherwise
- the call/session layer does not leak IM transport DTOs into the RTC public standard
- `StandardRtcCallController` is the default orchestration layer for invite discovery, remote
  lifecycle reconciliation, and typed offer/answer/ice signaling
