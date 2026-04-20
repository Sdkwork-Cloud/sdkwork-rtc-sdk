import assert from 'node:assert/strict';
import test from 'node:test';

const {
  getRtcCallSmokeHelpText,
  parseRtcCallSmokeArgs,
  runRtcCallSmokeCli,
} = await import('../bin/sdk-call-smoke.mjs');

function createWriter() {
  let buffer = '';
  return {
    write(chunk) {
      buffer += String(chunk);
    },
    toString() {
      return buffer;
    },
  };
}

test('rtc call smoke cli help keeps the mocked public usage contract explicit', () => {
  const helpText = getRtcCallSmokeHelpText();

  assert.match(helpText, /sdk-call-smoke\.mjs/);
  assert.match(helpText, /mocked sdkwork-im-sdk signaling/i);
  assert.match(helpText, /mocked official Volcengine Web SDK module/i);

  const parsed = parseRtcCallSmokeArgs(['--help']);
  assert.equal(parsed.help, true);
});

test('rtc call smoke cli verifies the default volcengine plus im-signaling stack through the public package', async () => {
  const stdout = createWriter();
  const result = await runRtcCallSmokeCli(['--json'], {
    stdout,
  });

  assert.equal(result.exitCode, 0);

  const summary = JSON.parse(stdout.toString());
  assert.equal(summary.defaultProviderKey, 'volcengine');
  assert.equal(summary.selectedProviderKey, 'volcengine');
  assert.equal(summary.mediaProviderKey, 'volcengine');
  assert.equal(summary.endedControllerState, 'ended');
  assert.equal(summary.closedControllerState, 'idle');
  assert.equal(summary.closedCallState, 'idle');
  assert.ok(
    summary.runtimeCalls.some(([name]) => name === 'createEngine'),
    'expected the official Volcengine runtime bridge to create an engine',
  );
  assert.ok(
    summary.runtimeCalls.some(([name]) => name === 'joinRoom'),
    'expected the official Volcengine runtime bridge to join a room',
  );
  assert.ok(
    summary.signalingCalls.some(([name]) => name === 'create'),
    'expected the IM signaling adapter to create an RTC session',
  );
  assert.ok(
    summary.signalingCalls.some(
      ([name, , signalType]) => name === 'postJsonSignal' && signalType === 'sdkwork.rtc.call.offer',
    ),
    'expected the IM signaling adapter to publish an SDP offer through the standard signal path',
  );
  assert.ok(
    summary.signalingCalls.some(
      ([name, , signalType]) =>
        name === 'postJsonSignal' && signalType === 'sdkwork.rtc.call.ice-candidate',
    ),
    'expected the IM signaling adapter to publish an ICE candidate through the standard signal path',
  );
});
