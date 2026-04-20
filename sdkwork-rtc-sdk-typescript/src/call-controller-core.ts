import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcCallSessionRecord,
  RtcCallSignal,
  RtcCallSignalingAdapter,
} from './call-types.js';
import type { StandardRtcCallSession } from './call-session.js';
import { createImRtcSignalingAdapter } from './im-signaling.js';
import {
  RTC_CALL_ACCEPTED_SIGNAL_TYPE,
  RTC_CALL_ANSWER_SIGNAL_TYPE,
  RTC_CALL_ENDED_SIGNAL_TYPE,
  RTC_CALL_ICE_CANDIDATE_SCHEMA_REF,
  RTC_CALL_ICE_CANDIDATE_SIGNAL_TYPE,
  RTC_CALL_INVITE_SCHEMA_REF,
  RTC_CALL_INVITE_SIGNAL_TYPE,
  RTC_CALL_LIFECYCLE_SCHEMA_REF,
  RTC_CALL_OFFER_SIGNAL_TYPE,
  RTC_CALL_REJECTED_SIGNAL_TYPE,
  RTC_CALL_SESSION_DESCRIPTION_SCHEMA_REF,
} from './call-controller-contract.js';
import type {
  RtcCallControllerDirection,
  RtcCallControllerState,
} from './call-controller-contract.js';
import type {
  CreateStandardRtcCallControllerOptions,
  RtcCallControllerAcceptOptions,
  RtcCallControllerEndOptions,
  RtcCallControllerEvent,
  RtcCallControllerEventHandler,
  RtcCallControllerOutgoingOptions,
  RtcCallControllerRejectOptions,
  RtcCallControllerSnapshot,
  RtcCallControllerSnapshotHandler,
  RtcCallIceCandidatePayload,
  RtcCallInvitePayload,
  RtcCallLifecyclePayload,
  RtcCallSessionDescriptionPayload,
} from './call-controller-models.js';
import {
  type ImRtcCallControllerSdkLike,
  publishRtcConversationSignal,
  toRtcIncomingCallInvitation,
} from './call-controller-message.js';

export class StandardRtcCallController<TNativeClient = unknown> {
  readonly #sdk: ImRtcCallControllerSdkLike;
  readonly #callSession: StandardRtcCallSession<TNativeClient>;
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #connectOptions?: CreateStandardRtcCallControllerOptions['connectOptions'];
  readonly #eventHandlers = new Set<RtcCallControllerEventHandler>();
  readonly #snapshotHandlers = new Set<RtcCallControllerSnapshotHandler>();
  readonly #watchedConversationIds = new Set<string>();
  #controllerState: RtcCallControllerState = 'idle';
  #direction?: RtcCallControllerDirection;
  #activeInvitation?: import('./call-controller-models.js').RtcIncomingCallInvitation;
  #lastSignal?: RtcCallSignal;
  #lastError?: unknown;
  #activeSessionSubscription?: { unsubscribe(): void };
  #activeSessionId?: string;
  #invitationConnection?: import('./im-signaling.js').ImRtcLiveConnectionLike;
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
    await publishRtcConversationSignal(this.#sdk, options.conversationId, {
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
    context: import('./im-signaling.js').ImRtcLiveMessageContextLike,
  ): Promise<void> {
    const invitation = toRtcIncomingCallInvitation(message, context);
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

export async function createStandardRtcCallController<TNativeClient = unknown>(
  options: CreateStandardRtcCallControllerOptions<TNativeClient>,
): Promise<StandardRtcCallController<TNativeClient>> {
  const controller = new StandardRtcCallController(options);
  await controller.replaceWatchedConversations(options.watchConversationIds ?? []);
  return controller;
}
