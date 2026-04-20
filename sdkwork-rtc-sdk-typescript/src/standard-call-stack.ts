import type { RtcCallSignalingAdapter } from './call-types.js';
import { createBuiltinRtcDriverManagerInternal } from './builtin-driver-manager.js';
import { StandardRtcCallSession } from './call-session.js';
import { RtcDataSource, type RtcDataSourceConfig } from './data-source.js';
import { RtcDriverManager } from './driver-manager.js';
import {
  createImRtcSignalingAdapter,
  type CreateImRtcSignalingAdapterOptions,
} from './im-signaling.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcClient } from './client.js';

export interface StandardRtcCallStack<TNativeClient = unknown> {
  readonly driverManager: RtcDriverManager;
  readonly dataSource: RtcDataSource;
  readonly mediaClient: RtcClient<TNativeClient>;
  readonly signaling: RtcCallSignalingAdapter;
  readonly callSession: StandardRtcCallSession<TNativeClient>;
}

export interface CreateStandardRtcCallStackOptions<TNativeClient = unknown>
  extends CreateImRtcSignalingAdapterOptions {
  driverManager?: RtcDriverManager;
  dataSourceConfig?: Omit<RtcDataSourceConfig, 'driverManager'>;
}

export async function createStandardRtcCallStack<TNativeClient = unknown>(
  options: CreateStandardRtcCallStackOptions<TNativeClient>,
): Promise<StandardRtcCallStack<TNativeClient>> {
  const driverManager = options.driverManager ?? createBuiltinRtcDriverManagerInternal();
  const dataSource = new RtcDataSource({
    ...options.dataSourceConfig,
    driverManager,
  });
  const mediaClient = await dataSource.createClient<TNativeClient>();
  const signaling = createImRtcSignalingAdapter(options);
  const callSession = new StandardRtcCallSession<TNativeClient>({
    mediaClient,
    signaling,
  });

  return freezeRtcRuntimeValue({
    driverManager,
    dataSource,
    mediaClient,
    signaling,
    callSession,
  });
}
