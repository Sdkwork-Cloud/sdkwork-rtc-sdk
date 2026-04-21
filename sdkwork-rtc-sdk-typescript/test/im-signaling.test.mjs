import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test(
  'RtcImRealtimeDispatcher fails fast on websocket auth rejection without redundant subscription sync',
  async () => {
    const { RtcImRealtimeDispatcher } = await loadSdk();

    const connectCalls = [];
    const replaceSubscriptionsCalls = [];
    const dispatcher = new RtcImRealtimeDispatcher({
      sdk: {
        realtime: {
          async replaceSubscriptions(body) {
            replaceSubscriptionsCalls.push(body);
            return {
              deviceId: body.deviceId,
              items: body.items,
            };
          },
        },
        rtc: {},
        async connect(options) {
          connectCalls.push(options);
          throw new Error('websocket auth rejected');
        },
      },
      deviceId: 'device-1',
      connectOptions: {
        webSocketAuth: {
          mode: 'queryBearer',
        },
      },
      reconnectIntervalMs: 20,
    });

    await assert.rejects(
      dispatcher.subscribeSessionSignals('rtc-session-1', async () => {}),
      /websocket auth rejected/,
    );

    await new Promise((resolve) => setTimeout(resolve, 80));

    assert.equal(connectCalls.length, 1);
    assert.deepEqual(connectCalls[0], {
      deviceId: 'device-1',
      webSocketAuth: {
        mode: 'queryBearer',
      },
      subscriptions: {
        rtcSessions: ['rtc-session-1'],
      },
    });
    assert.equal(replaceSubscriptionsCalls.length, 0);
  },
);
