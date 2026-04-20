# SDKWork RTC SDK TypeScript Usage

This document describes the current executable TypeScript baseline of `sdkwork-rtc-sdk`.

## Current Runnable Baseline

- Default media provider: `volcengine`
- Default web runtime path: official `@volcengine/rtc`
- Default signaling integration path: `sdkwork-im-sdk`
- Standard media entrypoint: `RtcDataSource`
- Standard call/session entrypoint: `StandardRtcCallSession`

## Install

```bash
npm install @sdkwork/rtc-sdk @volcengine/rtc @sdkwork/im-sdk
```

## Media Runtime Only

Use this path when the app already has its own session/token orchestration and only needs the RTC
media runtime.

```ts
import {
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
  trackId: 'rtc-session-1-audio',
  kind: 'audio',
});

await rtcClient.publish({
  trackId: 'rtc-session-1-video',
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
- realtime signal delivery through `sdkwork-im-sdk`
- provider participant credential issuance
- Volcengine media join and auto publish

```ts
import { ImSdkClient } from '@sdkwork/im-sdk';
import {
  RtcDataSource,
  StandardRtcCallSession,
  createBuiltinRtcDriverManager,
  createImRtcSignalingAdapter,
} from '@sdkwork/rtc-sdk';

const imSdk = new ImSdkClient({
  baseUrl: 'https://craw-chat.example.com',
  authToken: 'app-token',
});

const signaling = createImRtcSignalingAdapter({
  sdk: imSdk,
  connectOptions: {
    deviceId: 'device-1',
  },
});

const mediaDataSource = new RtcDataSource({
  driverManager: createBuiltinRtcDriverManager(),
  nativeConfig: {
    appId: 'volc-app-id',
  },
});

const mediaClient = await mediaDataSource.createClient();
const callSession = new StandardRtcCallSession({
  mediaClient,
  signaling,
});

callSession.onSignal((signal) => {
  console.log(signal.signalType, signal.payload);
});

await callSession.startOutgoing({
  rtcSessionId: 'rtc-session-1',
  conversationId: 'conversation-1',
  rtcMode: 'video_call',
  roomId: 'room-1',
  participantId: 'user-1',
  signalingStreamId: 'rtc-signal-1',
  subscribeSignals: true,
  autoPublish: {
    audio: true,
    video: true,
  },
});

await callSession.sendSignal('custom-control', {
  action: 'pin_remote',
});

await callSession.end();
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
- `sdk.connect(...).signals.onRtcSession(...)` -> `subscribeSessionSignals(...)`

## Runtime Guarantees

- `createBuiltinRtcDriverManager()` defaults to `volcengine`
- Volcengine Web runtime loading is lazy
- official vendor SDKs are not bundled into the RTC standard package
- signal payloads are exposed as parsed JSON when possible and as raw strings otherwise
- the call/session layer does not leak IM transport DTOs into the RTC public standard
