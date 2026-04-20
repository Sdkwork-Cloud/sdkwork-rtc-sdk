import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcCallSessionRecord,
  RtcCallSessionSnapshot,
  RtcCallSignal,
  RtcCallSignalingAdapter,
  RtcIncomingCallAcceptOptions,
  RtcIncomingCallRejectOptions,
  RtcOutgoingCallOptions,
} from './call-types.js';
import type { StandardRtcCallSession } from './call-session.js';
import {
  createImRtcSignalingAdapter,
  type CreateImRtcSignalingAdapterOptions,
  type ImRtcLiveConnectionLike,
  type ImRtcLiveMessageContextLike,
  type ImRtcSdkLike,
} from './im-signaling.js';

export const RTC_CALL_INVITE_SIGNAL_TYPE = 'sdkwork.rtc.call.invite';
export const RTC_CALL_ACCEPTED_SIGNAL_TYPE = 'sdkwork.rtc.call.accepted';
export const RTC_CALL_REJECTED_SIGNAL_TYPE = 'sdkwork.rtc.call.rejected';
export const RTC_CALL_ENDED_SIGNAL_TYPE = 'sdkwork.rtc.call.ended';
export const RTC_CALL_OFFER_SIGNAL_TYPE = 'sdkwork.rtc.call.offer';
export const RTC_CALL_ANSWER_SIGNAL_TYPE = 'sdkwork.rtc.call.answer';
export const RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE = 'sdkwork.rtc.call.ice-candidate';

export const RTC_CALL_INVITE_SCHEMA_REF = 'urn:sdkwork:rtc:call:invite:v1';
export const RTC_CALL_LIFECYCLE_SCHEMA_REF = 'urn:sdkwork:rtc:call:lifecycle:v1';
export const RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF =
  'urn:sdkwork:rtc:call:session-description:v1';
export const RTC_CALL_ICE_CANDIDATE_SCHEMA_REF =
  'urn:sdkwork:rtc:call:ice-candidate:v1';

export type RtcCallControllerDirection = 'incoming' | 'outgoing';

export type RtcCallControllerState =
  | 'idle'
  | 'watching'
  | 'incoming_ringing'
  | 'outgoing_ringing'
  | 'connecting'
  | 'connected'
  | 'rejected'
  | 'ended'
  | 'errored';

export interface RtcCallInvitePayload {
  rtcSessionId: string;
  conversationId: string;
  rtcMode: string;
  roomId?: string;
  signalingStreamId?: string;
  initiatorId?: string;
  initiatorDisplayName?: string;
  sentAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallLifecyclePayload {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  participantId?: string;
  reason?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallSessionDescriptionPayload {
  sdp: string;
}

export interface RtcCallIceCandidatePayload {
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export interface RtcIncomingCallInvitation extends RtcCallInvitePayload {
  occurredAt?: string;
}

export interface RtcCallControllerSnapshot extends RtcCallSessionSnapshot {
  controllerState: RtcCallControllerState;
  direction?: RtcCallControllerDirection;
  watchedConversationIds: readonly string[];
  activeInvitation?: RtcIncomingCallInvitation;
  lastSignal?: RtcCallSignal;
  lastError?: unknown;
}

export type RtcCallControllerEvent =
  | {
      type: 'snapshot';
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'incoming_invitation';
      invitation: RtcIncomingCallInvitation;
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'signal';
      signal: RtcCallSignal;
      snapshot: RtcCallControllerSnapshot;
    }
  | {
      type: 'error';
      error: unknown;
      snapshot: RtcCallControllerSnapshot;
    };

export type RtcCallControllerEventHandler = (event: RtcCallControllerEvent) => void;
export type RtcCallControllerSnapshotHandler = (
  snapshot: RtcCallControllerSnapshot,
) => void;

export interface RtcCallControllerOutgoingOptions extends RtcOutgoingCallOptions {
  conversationId: string;
  invitationText?: string;
  invitationMetadata?: Record<string, unknown>;
  initiatorDisplayName?: string;
}

export interface RtcCallControllerAcceptOptions extends RtcIncomingCallAcceptOptions {
  metadata?: Record<string, unknown>;
}

export interface RtcCallControllerRejectOptions extends RtcIncomingCallRejectOptions {
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface RtcCallControllerEndOptions {
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateStandardRtcCallControllerOptions<TNativeClient = unknown>
  extends CreateImRtcSignalingAdapterOptions {
  callSession: StandardRtcCallSession<TNativeClient>;
  signaling?: RtcCallSignalingAdapter;
  watchConversationIds?: readonly (string | number)[];
}

export class StandardRtcCallController<TNativeClient = unknown> {
  readonly #sdk: ImRtcCallControllerSdkLike;
  readonly #callSession: StandardRtcCallSession<TNativeClient>;
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #connectOptions?: CreateImRtcSignalingAdapterOptions['connectOptions'];
  readonly #eventHandlers = new Set<RtcCallControllerEventHandler>();
  readonly #snapshotHandlers = new Set<RtcCallControllerSnapshotHandler>();
  readonly #watchedConversationIds = new Set<string>();
  #controllerState: RtcCallControllerState = 'idle';
  #direction?: RtcCallControllerDirection;
  #activeInvitation?: RtcIncomingCallInvitation;
  #lastSignal?: RtcCallSignal;
  #lastError?: unknown;
  #activeSessionSubscription?: { unsubscribe(): void };
  #activeSessionId?: string;
  #invitationConnection?: ImRtcLiveConnectionLike;
  #invitationUnsubscribers: Array<() => void> = [];

  constructor(options: CreateStandardRtcCallControllerOptions<TNativeClient>) {
    this.#sdk = options.sdk as ImRtcCallControllerSdkLike;
    this.#callSession = options.callSession;
    this.#signaling = options.signaling ?? createImRtcSignalingAdapter(options);
    this.#connectOptions = options.connectOptions;
    for (const conversationId of options.watchConversationIds ?? []) {
      this.#watchedConversationIds.add(String(conversationId));
    }
  }

  getSnapshot(): RtcCallControllerSnapshot {
    return this.#createSnapshot();
  }

  onEvent(handler: RtcCallControllerEventHandler): () => void {
    this.#eventHandlers.add(handler);
    return () => {
      this.#eventHandlers.delete(handler);
    };
  }

  onSnapshot(handler: RtcCallControllerSnapshotHandler): () => void {
    this.#snapshotHandlers.add(handler);
    return () => {
      this.#snapshotHandlers.delete(handler);
    };
  }

  async replaceWatchedConversations(
    conversationIds: readonly (string | number)[],
  ): Promise<RtcCallControllerSnapshot> {
    this.#watchedConversationIds.clear();
    for (const conversationId of conversationIds) {
      this.#watchedConversationIds.add(String(conversationId));
    }

    await this.#reconnectInvitationWatch();
    return this.#emitSnapshot();
  }

  async startOutgoing(
    options: RtcCallControllerOutgoingOptions,
  ): Promise<RtcCallControllerSnapshot> {
    this.#ensureNoConflictingActiveCall(options.rtcSessionId);

    const sessionSnapshot = await this.#callSession.startOutgoing({
      ...options,
      subscribeSignals: false,
    });

    await this.#subscribeToSessionSignals(options.rtcSessionId);

    const invitation: RtcCallInvitePayload = freezeRtcRuntimeValue({
      rtcSessionId: options.rtcSessionId,
      conversationId: options.conversationId,
      rtcMode: options.rtcMode,
      roomId: sessionSnapshot.roomId ?? options.roomId ?? options.rtcSessionId,
      signalingStreamId: sessionSnapshot.signalingStreamId ?? options.signalingStreamId,
      initiatorId: options.participantId,
      initiatorDisplayName: options.initiatorDisplayName,
      sentAt: new Date().toISOString(),
      metadata: options.invitationMetadata,
    });
    await publishConversationSignal(this.#sdk, options.conversationId, {
      signalType: RTC_CALL_INVITE_SIGNAL_TYPE,
      schemaRef: RTC_CALL_INVITE_SCHEMA_REF,
      text: options.invitationText ?? 'RTC call invite',
      payload: invitation,
    });

    this.#direction = 'outgoing';
    this.#activeInvitation = undefined;
    this.#controllerState = 'outgoing_ringing';
    return this.#emitSnapshot();
  }

  async acceptIncoming(
    options: RtcCallControllerAcceptOptions,
  ): Promise<RtcCallControllerSnapshot> {
    this.#ensureNoConflictingActiveCall(options.rtcSessionId);
    await this.#subscribeToSessionSignals(options.rtcSessionId);
    this.#controllerState = 'connecting';
    this.#emitSnapshot();

    await this.#callSession.acceptIncoming({
      ...options,
      conversationId: options.conversationId ?? this.#activeInvitation?.conversationId,
      rtcMode: options.rtcMode ?? this.#activeInvitation?.rtcMode,
      roomId: options.roomId ?? this.#activeInvitation?.roomId,
      subscribeSignals: false,
    });

    await this.#signaling.sendSignal(
      options.rtcSessionId,
      RTC_CALL_ACCEPTED_SIGNAL_TYPE,
      freezeRtcRuntimeValue<RtcCallLifecyclePayload>({
        rtcSessionId: options.rtcSessionId,
        conversationId: this.#callSession.getSnapshot().conversationId,
        rtcMode: this.#callSession.getSnapshot().rtcMode,
        participantId: options.participantId,
        occurredAt: new Date().toISOString(),
        metadata: options.metadata,
      }),
      {
        signalingStreamId:
          this.#callSession.getSnapshot().signalingStreamId
          ?? this.#activeInvitation?.signalingStreamId,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      },
    );

    this.#direction = 'incoming';
    this.#activeInvitation = undefined;
    this.#controllerState = 'connected';
    return this.#emitSnapshot();
  }

  async rejectIncoming(
    options: RtcCallControllerRejectOptions,
  ): Promise<RtcCallControllerSnapshot> {
    await this.#signaling.sendSignal(
      options.rtcSessionId,
      RTC_CALL_REJECTED_SIGNAL_TYPE,
      freezeRtcRuntimeValue<RtcCallLifecyclePayload>({
        rtcSessionId: options.rtcSessionId,
        conversationId: this.#activeInvitation?.conversationId,
        rtcMode: this.#activeInvitation?.rtcMode,
        reason: options.reason,
        occurredAt: new Date().toISOString(),
        metadata: options.metadata,
      }),
      {
        signalingStreamId: this.#activeInvitation?.signalingStreamId,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      },
    );

    await this.#callSession.rejectIncoming(options);
    this.#direction = 'incoming';
    this.#activeInvitation = undefined;
    this.#controllerState = 'rejected';
    this.#clearActiveSessionSubscription();
    return this.#emitSnapshot();
  }

  async end(
    options: RtcCallControllerEndOptions = {},
  ): Promise<RtcCallControllerSnapshot> {
    const sessionSnapshot = this.#callSession.getSnapshot();
    const rtcSessionId = sessionSnapshot.rtcSessionId ?? this.#activeInvitation?.rtcSessionId;
    if (!rtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session to end.',
      });
    }

    await this.#signaling.sendSignal(
      rtcSessionId,
      RTC_CALL_ENDED_SIGNAL_TYPE,
      freezeRtcRuntimeValue<RtcCallLifecyclePayload>({
        rtcSessionId,
        conversationId: sessionSnapshot.conversationId ?? this.#activeInvitation?.conversationId,
        rtcMode: sessionSnapshot.rtcMode ?? this.#activeInvitation?.rtcMode,
        participantId: sessionSnapshot.participantId,
        reason: options.reason,
        occurredAt: new Date().toISOString(),
        metadata: options.metadata,
      }),
      {
        signalingStreamId:
          sessionSnapshot.signalingStreamId ?? this.#activeInvitation?.signalingStreamId,
        schemaRef: RTC_CALL_LIFECYCLE_SCHEMA_REF,
      },
    );

    await this.#callSession.end();
    this.#activeInvitation = undefined;
    this.#controllerState = 'ended';
    this.#clearActiveSessionSubscription();
    return this.#emitSnapshot();
  }

  async sendSignal(signalType: string, payload: unknown): Promise<RtcCallSignal> {
    const signal = await this.#callSession.sendSignal(signalType, payload);
    this.#lastSignal = signal;
    this.#emitSignal(signal);
    return signal;
  }

  sendOffer(payload: RtcCallSessionDescriptionPayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_OFFER_SIGNAL_TYPE,
      payload,
      RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
    );
  }

  sendAnswer(payload: RtcCallSessionDescriptionPayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_ANSWER_SIGNAL_TYPE,
      payload,
      RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
    );
  }

  sendIceCandidate(payload: RtcCallIceCandidatePayload): Promise<RtcCallSignal> {
    return this.#sendTypedSignal(
      RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE,
      payload,
      RTC_CALL_ICE_CANDIDATE_SCHEMA_REF,
    );
  }

  async dispose(): Promise<void> {
    this.#clearActiveSessionSubscription();
    this.#disconnectInvitationWatch();
    this.#controllerState = 'idle';
    this.#activeInvitation = undefined;
    this.#direction = undefined;
    this.#emitSnapshot();
  }

  async #subscribeToSessionSignals(rtcSessionId: string): Promise<void> {
    if (this.#activeSessionId === rtcSessionId && this.#activeSessionSubscription) {
      return;
    }

    this.#clearActiveSessionSubscription();
    this.#activeSessionId = rtcSessionId;
    this.#activeSessionSubscription = await this.#signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) => {
        void this.#handleSessionSignal(signal);
      },
    );
  }

  async #handleSessionSignal(signal: RtcCallSignal): Promise<void> {
    this.#lastSignal = signal;

    if (signal.signalType === RTC_CALL_ACCEPTED_SIGNAL_TYPE) {
      this.#controllerState = 'connected';
      this.#direction ??= 'outgoing';
    } else if (
      signal.signalType === RTC_CALL_REJECTED_SIGNAL_TYPE
      || signal.signalType === RTC_CALL_ENDED_SIGNAL_TYPE
    ) {
      await this.#callSession.leaveMedia();
      const nextState = signal.signalType === RTC_CALL_REJECTED_SIGNAL_TYPE ? 'rejected' : 'ended';
      this.#callSession.reconcileSessionRecord(
        freezeRtcRuntimeValue<RtcCallSessionRecord>({
          rtcSessionId: signal.rtcSessionId,
          conversationId: signal.conversationId,
          rtcMode: signal.rtcMode,
          state: nextState,
          signalingStreamId: signal.signalingStreamId,
          endedAt: signal.occurredAt,
        }),
      );
      this.#controllerState = nextState;
      this.#activeInvitation = undefined;
      this.#clearActiveSessionSubscription();
    }

    this.#emitSignal(signal);
  }

  async #reconnectInvitationWatch(): Promise<void> {
    this.#disconnectInvitationWatch();

    if (!this.#watchedConversationIds.size) {
      this.#controllerState = this.#activeSessionId ? this.#controllerState : 'idle';
      return;
    }

    if (typeof this.#sdk.connect !== 'function') {
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'IM live invitation watch is not available. Provide sdk.connect() for conversation subscriptions.',
      });
    }

    const conversationIds = [...this.#watchedConversationIds];
    const liveConnection = await this.#sdk.connect({
      ...this.#connectOptions,
      subscriptions: {
        conversations: conversationIds,
        ...(this.#connectOptions?.subscriptions?.rtcSessions
          ? {
              rtcSessions: this.#connectOptions.subscriptions.rtcSessions,
            }
          : {}),
        ...(this.#connectOptions?.subscriptions?.items
          ? {
              items: this.#connectOptions.subscriptions.items,
            }
          : {}),
      },
    });

    if (!liveConnection.messages) {
      liveConnection.disconnect?.();
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'IM live invitation watch is missing live.messages.onConversation(...) support.',
      });
    }

    this.#invitationConnection = liveConnection;
    this.#invitationUnsubscribers = conversationIds.map((conversationId) =>
      liveConnection.messages?.onConversation(conversationId, (message, context) => {
        void this.#handleConversationMessage(message, context);
      }) ?? (() => {}),
    );

    if (!this.#activeSessionId) {
      this.#controllerState = 'watching';
    }
  }

  #disconnectInvitationWatch(): void {
    for (const unsubscribe of this.#invitationUnsubscribers) {
      unsubscribe();
    }

    this.#invitationUnsubscribers = [];
    this.#invitationConnection?.disconnect?.();
    this.#invitationConnection = undefined;
  }

  async #handleConversationMessage(
    message: unknown,
    context: ImRtcLiveMessageContextLike,
  ): Promise<void> {
    const invitation = toIncomingCallInvitation(message, context);
    if (!invitation) {
      return;
    }

    this.#ensureNoConflictingActiveCall(invitation.rtcSessionId);
    await this.#subscribeToSessionSignals(invitation.rtcSessionId);
    this.#direction = 'incoming';
    this.#activeInvitation = invitation;
    this.#controllerState = 'incoming_ringing';
    this.#emitEvent({
      type: 'incoming_invitation',
      invitation,
      snapshot: this.#createSnapshot(),
    });
    this.#emitSnapshot();
  }

  async #sendTypedSignal(
    signalType: string,
    payload: unknown,
    schemaRef: string,
  ): Promise<RtcCallSignal> {
    const sessionSnapshot = this.#callSession.getSnapshot();
    const rtcSessionId = sessionSnapshot.rtcSessionId;
    if (!rtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session for signaling.',
      });
    }

    const signal = await this.#signaling.sendSignal(rtcSessionId, signalType, payload, {
      signalingStreamId: sessionSnapshot.signalingStreamId,
      schemaRef,
    });
    this.#lastSignal = signal;
    this.#emitSignal(signal);
    return signal;
  }

  #ensureNoConflictingActiveCall(nextRtcSessionId: string): void {
    const currentSnapshot = this.#callSession.getSnapshot();
    const currentRtcSessionId = currentSnapshot.rtcSessionId ?? this.#activeInvitation?.rtcSessionId;
    const controllerState = this.#controllerState;
    const hasActiveCall =
      currentRtcSessionId
      && controllerState !== 'idle'
      && controllerState !== 'watching'
      && controllerState !== 'rejected'
      && controllerState !== 'ended';

    if (hasActiveCall && currentRtcSessionId !== nextRtcSessionId) {
      throw new RtcSdkException({
        code: 'call_state_invalid',
        message: 'RTC call controller already has an active session.',
        details: {
          currentRtcSessionId,
          nextRtcSessionId,
        },
      });
    }
  }

  #clearActiveSessionSubscription(): void {
    this.#activeSessionSubscription?.unsubscribe();
    this.#activeSessionSubscription = undefined;
    this.#activeSessionId = undefined;
  }

  #createSnapshot(): RtcCallControllerSnapshot {
    const sessionSnapshot = this.#callSession.getSnapshot();
    return freezeRtcRuntimeValue({
      ...sessionSnapshot,
      rtcSessionId: sessionSnapshot.rtcSessionId ?? this.#activeInvitation?.rtcSessionId,
      conversationId:
        sessionSnapshot.conversationId ?? this.#activeInvitation?.conversationId,
      rtcMode: sessionSnapshot.rtcMode ?? this.#activeInvitation?.rtcMode,
      roomId: sessionSnapshot.roomId ?? this.#activeInvitation?.roomId,
      signalingStreamId:
        sessionSnapshot.signalingStreamId ?? this.#activeInvitation?.signalingStreamId,
      controllerState: this.#controllerState,
      direction: this.#direction,
      watchedConversationIds: [...this.#watchedConversationIds],
      activeInvitation: this.#activeInvitation,
      lastSignal: this.#lastSignal,
      lastError: this.#lastError,
    });
  }

  #emitSnapshot(): RtcCallControllerSnapshot {
    const snapshot = this.#createSnapshot();
    for (const handler of this.#snapshotHandlers) {
      handler(snapshot);
    }
    this.#emitEvent({
      type: 'snapshot',
      snapshot,
    });
    return snapshot;
  }

  #emitSignal(signal: RtcCallSignal): void {
    this.#emitEvent({
      type: 'signal',
      signal,
      snapshot: this.#createSnapshot(),
    });
  }

  #emitError(error: unknown): void {
    this.#lastError = error;
    this.#controllerState = 'errored';
    this.#emitEvent({
      type: 'error',
      error,
      snapshot: this.#createSnapshot(),
    });
    this.#emitSnapshot();
  }

  #emitEvent(event: RtcCallControllerEvent): void {
    for (const handler of this.#eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        this.#lastError = error;
      }
    }
  }
}

export interface StandardRtcCallControllerStack<TNativeClient = unknown> {
  readonly callController: StandardRtcCallController<TNativeClient>;
}

export async function createStandardRtcCallController<TNativeClient = unknown>(
  options: CreateStandardRtcCallControllerOptions<TNativeClient>,
): Promise<StandardRtcCallController<TNativeClient>> {
  const controller = new StandardRtcCallController(options);
  await controller.replaceWatchedConversations(options.watchConversationIds ?? []);
  return controller;
}

interface ImRtcConversationSignalMessageCreateOptions {
  conversationId: string | number;
  text?: string;
  signalType: string;
  schemaRef?: string;
  encoding?: string;
  payload?: string;
  state?: string;
}

interface ImRtcCallControllerSdkLike extends ImRtcSdkLike {
  createSignalMessage?(
    input: ImRtcConversationSignalMessageCreateOptions,
  ): unknown;
  send?(message: unknown): Promise<unknown> | unknown;
  readonly messages?: {
    createSignal?(
      input: ImRtcConversationSignalMessageCreateOptions,
    ): unknown;
    send?(message: unknown): Promise<unknown> | unknown;
  };
  connect?(
    options?: NonNullable<CreateImRtcSignalingAdapterOptions['connectOptions']>,
  ): Promise<ImRtcLiveConnectionLike> | ImRtcLiveConnectionLike;
}

async function publishConversationSignal(
  sdk: ImRtcCallControllerSdkLike,
  conversationId: string,
  options: {
    signalType: string;
    schemaRef?: string;
    text?: string;
    payload: unknown;
  },
): Promise<void> {
  const encodedPayload = JSON.stringify(options.payload);

  if (typeof sdk.createSignalMessage === 'function' && typeof sdk.send === 'function') {
    await sdk.send(
      sdk.createSignalMessage({
        conversationId,
        text: options.text,
        signalType: options.signalType,
        schemaRef: options.schemaRef,
        encoding: 'application/json',
        payload: encodedPayload,
      }),
    );
    return;
  }

  if (
    typeof sdk.messages?.createSignal === 'function'
    && typeof sdk.messages?.send === 'function'
  ) {
    await sdk.messages.send(
      sdk.messages.createSignal({
        conversationId,
        text: options.text,
        signalType: options.signalType,
        schemaRef: options.schemaRef,
        encoding: 'application/json',
        payload: encodedPayload,
      }),
    );
    return;
  }

  throw new RtcSdkException({
    code: 'signaling_not_available',
    message:
      'IM conversation invite signaling is not available. Provide createSignalMessage()/send() or messages.createSignal()/messages.send().',
    details: {
      conversationId,
      signalType: options.signalType,
    },
  });
}

function toIncomingCallInvitation(
  message: unknown,
  context: ImRtcLiveMessageContextLike,
): RtcIncomingCallInvitation | undefined {
  const record = toRecord(message);
  if (record.type !== 'signal') {
    return undefined;
  }

  const content = toRecord(record.content);
  if (content.signalType !== RTC_CALL_INVITE_SIGNAL_TYPE) {
    return undefined;
  }

  const payload = toRecord(normalizePayload(content.payload));
  const rtcSessionId = toOptionalString(payload.rtcSessionId);
  const conversationId =
    toOptionalString(payload.conversationId)
    ?? toOptionalString(context.conversationId)
    ?? toOptionalString(context.scopeId);
  const rtcMode = toOptionalString(payload.rtcMode);

  if (!rtcSessionId || !conversationId || !rtcMode) {
    return undefined;
  }

  return freezeRtcRuntimeValue({
    rtcSessionId,
    conversationId,
    rtcMode,
    roomId: toOptionalString(payload.roomId),
    signalingStreamId: toOptionalString(payload.signalingStreamId),
    initiatorId: toOptionalString(payload.initiatorId),
    initiatorDisplayName: toOptionalString(payload.initiatorDisplayName),
    sentAt: toOptionalString(payload.sentAt),
    metadata: toOptionalRecord(payload.metadata),
    occurredAt: toOptionalString(payload.sentAt) ?? context.receivedAt,
  });
}

function normalizePayload(payload: unknown): unknown {
  if (typeof payload !== 'string') {
    return payload;
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return payload;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return payload;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function toOptionalRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}
