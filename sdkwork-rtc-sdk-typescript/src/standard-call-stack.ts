import type { RtcCallSignalingAdapter } from './call-types.js';
import { createBuiltinRtcDriverManagerInternal } from './builtin-driver-manager.js';
import { StandardRtcCallSession } from './call-session.js';
import {
  createStandardRtcCallController,
  type CreateStandardRtcCallControllerOptions,
  type StandardRtcCallController,
} from './call-controller-internal.js';
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

export interface StandardRtcCallControllerStack<TNativeClient = unknown>
  extends StandardRtcCallStack<TNativeClient> {
  readonly callController: StandardRtcCallController<TNativeClient>;
}

export interface CreateStandardRtcCallStackOptions<TNativeClient = unknown>
  extends CreateImRtcSignalingAdapterOptions {
  driverManager?: RtcDriverManager;
  dataSourceConfig?: Omit<RtcDataSourceConfig, 'driverManager'>;
}

export interface CreateStandardRtcCallControllerStackOptions<TNativeClient = unknown>
  extends CreateStandardRtcCallStackOptions<TNativeClient> {
  watchConversationIds?: readonly (string | number)[];
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

export async function createStandardRtcCallControllerStack<TNativeClient = unknown>(
  options: CreateStandardRtcCallControllerStackOptions<TNativeClient>,
): Promise<StandardRtcCallControllerStack<TNativeClient>> {
  const rtcStack = await createStandardRtcCallStack<TNativeClient>(options);
  const callController = await createStandardRtcCallController<TNativeClient>({
    ...options,
    callSession: rtcStack.callSession,
    signaling: rtcStack.signaling,
  } satisfies CreateStandardRtcCallControllerOptions<TNativeClient>);

  return freezeRtcRuntimeValue({
    ...rtcStack,
    callController,
  });
}

export {
  createStandardRtcCallController,
  StandardRtcCallController,
  RTC_CALL_ACCEPTED_SIGNAL_TYPE,
  RTC_CALL_ANSWER_SIGNAL_TYPE,
  RTC_CALL_ENDED_SIGNAL_TYPE,
  RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE,
  RTC_CALL_INVITE_SCHEMA_REF,
  RTC_CALL_INVITE_SIGNAL_TYPE,
  RTC_CALL_LIFECYCLE_SCHEMA_REF,
  RTC_CALL_OFFER_SIGNAL_TYPE,
  RTC_CALL_REJECTED_SIGNAL_TYPE,
  RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
  RTC_CALL_ICE_CANDIDATE_SCHEMA_REF,
} from './call-controller-internal.js';
export type {
  CreateStandardRtcCallControllerOptions,
  RtcCallControllerAcceptOptions,
  RtcCallControllerDirection,
  RtcCallControllerEndOptions,
  RtcCallControllerEvent,
  RtcCallControllerEventHandler,
  RtcCallControllerOutgoingOptions,
  RtcCallControllerRejectOptions,
  RtcCallControllerSnapshot,
  RtcCallControllerSnapshotHandler,
  RtcCallControllerState,
  RtcCallIceCandidatePayload,
  RtcCallInvitePayload,
  RtcCallLifecyclePayload,
  RtcCallSessionDescriptionPayload,
  RtcIncomingCallInvitation,
} from './call-controller-internal.js';
