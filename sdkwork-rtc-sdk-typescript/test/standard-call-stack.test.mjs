import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('createStandardRtcCallStack composes an explicit call stack around media and IM signaling', async () => {
  const {
    createStandardRtcCallStack,
    RtcDriverManager,
    createVolcengineRtcDriver,
  } = await loadSdk();

  const runtimeCalls = [];
  const driverManager = new RtcDriverManager({
    drivers: [
      createVolcengineRtcDriver({
        nativeFactory: async () => ({
          runtime: 'mock-volcengine-web',
        }),
        runtimeController: {
          async join(options, context) {
            runtimeCalls.push(['join', options, context.selection.providerKey]);
            return {
              sessionId: options.sessionId,
              roomId: options.roomId,
              participantId: options.participantId,
              providerKey: context.metadata.providerKey,
              connectionState: 'joined',
            };
          },
          async leave(context) {
            runtimeCalls.push(['leave', context.selection.providerKey]);
            return {
              sessionId: 'rtc-session-1',
              roomId: 'room-1',
              participantId: 'user-1',
              providerKey: context.metadata.providerKey,
              connectionState: 'left',
            };
          },
          async publish(options) {
            runtimeCalls.push(['publish', options.trackId, options.kind]);
            return {
              trackId: options.trackId,
              kind: options.kind,
              muted: false,
            };
          },
          async unpublish(trackId) {
            runtimeCalls.push(['unpublish', trackId]);
          },
          async muteAudio(muted = true) {
            runtimeCalls.push(['muteAudio', muted]);
            return {
              kind: 'audio',
              muted,
            };
          },
          async muteVideo(muted = true) {
            runtimeCalls.push(['muteVideo', muted]);
            return {
              kind: 'video',
              muted,
            };
          },
        },
      }),
    ],
  });

  const signalingCalls = [];
  const imSdk = {
    rtc: {
      async create(body) {
        signalingCalls.push(['create', body]);
        return {
          rtcSessionId: body.rtcSessionId,
          conversationId: body.conversationId,
          rtcMode: body.rtcMode,
          state: 'started',
        };
      },
      async invite(rtcSessionId, body) {
        signalingCalls.push(['invite', rtcSessionId, body]);
        return {
          rtcSessionId: String(rtcSessionId),
          conversationId: 'conversation-1',
          rtcMode: 'video_call',
          state: 'started',
          signalingStreamId: body.signalingStreamId,
        };
      },
      async accept() {
        throw new Error('not used');
      },
      async reject() {
        throw new Error('not used');
      },
      async end(rtcSessionId) {
        signalingCalls.push(['end', rtcSessionId]);
        return {
          rtcSessionId: String(rtcSessionId),
          conversationId: 'conversation-1',
          rtcMode: 'video_call',
          state: 'ended',
        };
      },
      async postJsonSignal(rtcSessionId, signalType, options) {
        signalingCalls.push(['postJsonSignal', rtcSessionId, signalType, options]);
        return {
          rtcSessionId: String(rtcSessionId),
          conversationId: 'conversation-1',
          rtcMode: 'video_call',
          signalType,
          payload: JSON.stringify(options.payload),
        };
      },
      async issueParticipantCredential(rtcSessionId, body) {
        signalingCalls.push(['issueParticipantCredential', rtcSessionId, body]);
        return {
          rtcSessionId: String(rtcSessionId),
          participantId: body.participantId,
          credential: 'volc-token-1',
        };
      },
    },
    async connect(options) {
      signalingCalls.push(['connect', options]);
      return {
        signals: {
          onRtcSession(rtcSessionId) {
            signalingCalls.push(['onRtcSession', rtcSessionId]);
            return () => {
              signalingCalls.push(['unsubscribeRtcSession', rtcSessionId]);
            };
          },
        },
      };
    },
  };

  const rtcStack = await createStandardRtcCallStack({
    sdk: imSdk,
    deviceId: 'device-1',
    connectOptions: {
      webSocketAuth: {
        mode: 'queryBearer',
      },
    },
    driverManager,
    dataSourceConfig: {
      nativeConfig: {
        appId: 'volc-app-id',
      },
    },
  });

  assert.equal(rtcStack.driverManager, driverManager);
  assert.equal(rtcStack.dataSource.describeSelection().providerKey, 'volcengine');
  assert.equal(rtcStack.mediaClient.metadata.providerKey, 'volcengine');
  assert.equal(typeof rtcStack.realtimeDispatcher.subscribeSessionSignals, 'function');
  assert.equal(typeof rtcStack.realtimeDispatcher.subscribeConversationSignals, 'function');
  assert.equal(typeof rtcStack.close, 'function');

  const snapshot = await rtcStack.callSession.startOutgoing({
    rtcSessionId: 'rtc-session-1',
    conversationId: 'conversation-1',
    rtcMode: 'video_call',
    roomId: 'room-1',
    participantId: 'user-1',
    signalingStreamId: 'signal-1',
    autoPublish: {
      audio: true,
      video: false,
    },
  });

  assert.equal(snapshot.state, 'connected');
  assert.deepEqual(runtimeCalls, [
    [
      'join',
      {
        sessionId: 'rtc-session-1',
        roomId: 'room-1',
        participantId: 'user-1',
        token: 'volc-token-1',
        metadata: {
          rtcMode: 'video_call',
          conversationId: 'conversation-1',
        },
      },
      'volcengine',
    ],
    ['publish', 'rtc-session-1-audio', 'audio'],
  ]);
  assert.deepEqual(signalingCalls.slice(0, 5), [
    [
      'connect',
      {
        deviceId: 'device-1',
        webSocketAuth: {
          mode: 'queryBearer',
        },
        subscriptions: {
          rtcSessions: ['rtc-session-1'],
        },
      },
    ],
    ['onRtcSession', 'rtc-session-1'],
    [
      'create',
      {
        rtcSessionId: 'rtc-session-1',
        conversationId: 'conversation-1',
        rtcMode: 'video_call',
      },
    ],
    ['invite', 'rtc-session-1', { signalingStreamId: 'signal-1' }],
    ['issueParticipantCredential', 'rtc-session-1', { participantId: 'user-1' }],
  ]);

  await rtcStack.close();

  assert.equal(rtcStack.callSession.getSnapshot().state, 'idle');
  assert.equal(rtcStack.callSession.getSnapshot().rtcSessionId, undefined);
  assert.deepEqual(runtimeCalls.slice(-1), [['leave', 'volcengine']]);
  assert.equal(
    signalingCalls.some(([type]) => type === 'end'),
    false,
  );
  assert.deepEqual(signalingCalls.slice(-1), [['unsubscribeRtcSession', 'rtc-session-1']]);
});

test('RtcImRealtimeDispatcher rejects mismatched deviceId inputs', async () => {
  const { RtcImRealtimeDispatcher } = await loadSdk();

  assert.throws(
    () =>
      new RtcImRealtimeDispatcher({
        sdk: {
          rtc: {},
        },
        deviceId: 'device-1',
        connectOptions: {
          deviceId: 'device-2',
        },
      }),
    /RTC signaling deviceId must match connectOptions\.deviceId/,
  );
});
