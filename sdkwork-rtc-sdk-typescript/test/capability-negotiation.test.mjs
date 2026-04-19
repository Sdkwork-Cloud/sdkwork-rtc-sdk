import assert from 'node:assert/strict';
import test from 'node:test';

async function loadSdk() {
  return import('../dist/index.js');
}

test('data source negotiates optional capability degradation with surface-aware missing sets', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'aliyun',
  });

  assert.deepEqual(
    dataSource.negotiateCapabilities({
      required: ['session', 'join'],
      optional: ['recording', 'data-channel'],
    }),
    {
      status: 'degraded',
      supportedRequired: ['session', 'join'],
      missingRequired: [],
      supportedOptional: ['recording'],
      missingOptional: ['data-channel'],
      missingBySurface: {
        controlPlane: [],
        runtimeBridge: ['data-channel'],
        crossSurface: [],
      },
    },
  );
});

test('client describes capability support with category and surface metadata', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'aliyun',
  });
  const client = await dataSource.createClient();

  assert.deepEqual(client.describeCapability('session'), {
    capabilityKey: 'session',
    category: 'required-baseline',
    surface: 'cross-surface',
    supported: true,
  });
  assert.deepEqual(client.describeCapability('data-channel'), {
    capabilityKey: 'data-channel',
    category: 'optional-advanced',
    surface: 'runtime-bridge',
    supported: false,
  });
});

test('client negotiation reports unsupported when required capabilities are missing', async () => {
  const { RtcDataSource, createBuiltinRtcDriverManager } = await loadSdk();

  const dataSource = new RtcDataSource({
    driverManager: createBuiltinRtcDriverManager(),
    providerKey: 'aliyun',
  });
  const client = await dataSource.createClient();

  assert.deepEqual(
    client.negotiateCapabilities({
      required: ['session', 'data-channel'],
      optional: ['recording'],
    }),
    {
      status: 'unsupported',
      supportedRequired: ['session'],
      missingRequired: ['data-channel'],
      supportedOptional: ['recording'],
      missingOptional: [],
      missingBySurface: {
        controlPlane: [],
        runtimeBridge: ['data-channel'],
        crossSurface: [],
      },
    },
  );
});
