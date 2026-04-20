import { RtcSdkException } from './errors.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type {
  RtcCallParticipantCredential,
  RtcCallSessionRecord,
  RtcCallSignal,
  RtcCallSignalHandler,
  RtcCallSignalSubscription,
  RtcCallSignalingAdapter,
} from './call-types.js';

export interface ImRtcSignalingSessionLike {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  initiatorId?: string;
  providerPluginId?: string;
  providerSessionId?: string;
  accessEndpoint?: string;
  providerRegion?: string;
  state: 'started' | 'accepted' | 'rejected' | 'ended';
  signalingStreamId?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ImRtcSignalingEventLike {
  rtcSessionId: string;
  conversationId?: string;
  rtcMode?: string;
  signalType: string;
  payload: string;
  sender?: {
    id?: string;
  };
  signalingStreamId?: string;
  occurredAt?: string;
}

export interface ImRtcParticipantCredentialLike {
  rtcSessionId: string;
  participantId: string;
  credential: string;
  expiresAt?: string;
}

export interface ImRtcLiveSignalStreamLike {
  onRtcSession(
    rtcSessionId: string | number,
    handler: (signal: ImRtcSignalingEventLike, context: { scopeId?: string | number }) => void,
  ): () => void;
}

export interface ImRtcLiveConnectionLike {
  readonly signals: ImRtcLiveSignalStreamLike;
  disconnect?(): void;
}

export interface ImRtcSdkLike {
  readonly rtc: {
    create(body: {
      rtcSessionId: string;
      conversationId?: string;
      rtcMode: string;
    }): Promise<ImRtcSignalingSessionLike> | ImRtcSignalingSessionLike;
    invite(
      rtcSessionId: string | number,
      body: {
        signalingStreamId?: string;
      },
    ): Promise<ImRtcSignalingSessionLike> | ImRtcSignalingSessionLike;
    accept(
      rtcSessionId: string | number,
      body?: Record<string, never>,
    ): Promise<ImRtcSignalingSessionLike> | ImRtcSignalingSessionLike;
    reject(
      rtcSessionId: string | number,
      body?: Record<string, never>,
    ): Promise<ImRtcSignalingSessionLike> | ImRtcSignalingSessionLike;
    end(
      rtcSessionId: string | number,
      body?: Record<string, never>,
    ): Promise<ImRtcSignalingSessionLike> | ImRtcSignalingSessionLike;
    postJsonSignal(
      rtcSessionId: string | number,
      signalType: string,
      options: {
        payload: unknown;
        signalingStreamId?: string;
        schemaRef?: string;
      },
    ): Promise<ImRtcSignalingEventLike> | ImRtcSignalingEventLike;
    issueParticipantCredential(
      rtcSessionId: string | number,
      body: {
        participantId: string;
      },
    ): Promise<ImRtcParticipantCredentialLike> | ImRtcParticipantCredentialLike;
  };
  connect?(
    options?: {
      deviceId?: string;
      url?: string;
      headers?: Record<string, string>;
      protocols?: readonly string[];
      requestTimeoutMs?: number;
      subscriptions?: {
        rtcSessions?: readonly string[];
      };
    },
  ): Promise<ImRtcLiveConnectionLike> | ImRtcLiveConnectionLike;
}

export interface CreateImRtcSignalingAdapterOptions {
  sdk: ImRtcSdkLike;
  liveConnection?: ImRtcLiveConnectionLike;
  connectOptions?: {
    deviceId?: string;
    url?: string;
    headers?: Record<string, string>;
    protocols?: readonly string[];
    requestTimeoutMs?: number;
  };
}

function toSessionRecord(session: ImRtcSignalingSessionLike): RtcCallSessionRecord {
  return freezeRtcRuntimeValue({
    rtcSessionId: String(session.rtcSessionId),
    conversationId: session.conversationId,
    rtcMode: session.rtcMode,
    state: session.state,
    signalingStreamId: session.signalingStreamId,
    initiatorId: session.initiatorId,
    providerPluginId: session.providerPluginId,
    providerSessionId: session.providerSessionId,
    accessEndpoint: session.accessEndpoint,
    providerRegion: session.providerRegion,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
  });
}

function toParticipantCredential(
  credential: ImRtcParticipantCredentialLike,
): RtcCallParticipantCredential {
  return freezeRtcRuntimeValue({
    rtcSessionId: String(credential.rtcSessionId),
    participantId: String(credential.participantId),
    credential: credential.credential,
    expiresAt: credential.expiresAt,
  });
}

function parseSignalPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function toSignal(signal: ImRtcSignalingEventLike): RtcCallSignal {
  return freezeRtcRuntimeValue({
    rtcSessionId: String(signal.rtcSessionId),
    conversationId: signal.conversationId,
    rtcMode: signal.rtcMode,
    signalType: signal.signalType,
    payload: parseSignalPayload(signal.payload),
    rawPayload: signal.payload,
    senderId: signal.sender?.id,
    signalingStreamId: signal.signalingStreamId,
    occurredAt: signal.occurredAt,
  });
}

export function createImRtcSignalingAdapter(
  options: CreateImRtcSignalingAdapterOptions,
): RtcCallSignalingAdapter {
  return freezeRtcRuntimeValue({
    async createSession(request) {
      return toSessionRecord(await options.sdk.rtc.create(request));
    },
    async inviteSession(rtcSessionId, request) {
      return toSessionRecord(await options.sdk.rtc.invite(rtcSessionId, request));
    },
    async acceptSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.sdk.rtc.accept(rtcSessionId, request));
    },
    async rejectSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.sdk.rtc.reject(rtcSessionId, request));
    },
    async endSession(rtcSessionId, request = {}) {
      return toSessionRecord(await options.sdk.rtc.end(rtcSessionId, request));
    },
    async sendSignal(rtcSessionId, signalType, payload, signalOptions = {}) {
      return toSignal(
        await options.sdk.rtc.postJsonSignal(rtcSessionId, signalType, {
          payload,
          signalingStreamId: signalOptions.signalingStreamId,
          schemaRef: signalOptions.schemaRef,
        }),
      );
    },
    async issueParticipantCredential(rtcSessionId, request) {
      return toParticipantCredential(
        await options.sdk.rtc.issueParticipantCredential(rtcSessionId, request),
      );
    },
    async subscribeSessionSignals(
      rtcSessionId: string,
      handler: RtcCallSignalHandler,
    ): Promise<RtcCallSignalSubscription> {
      const liveConnection = await resolveLiveConnection(options, rtcSessionId);
      const unsubscribe = liveConnection.signals.onRtcSession(
        rtcSessionId,
        (signal) => {
          handler(toSignal(signal));
        },
      );

      return freezeRtcRuntimeValue({
        unsubscribe() {
          unsubscribe();
          if (!options.liveConnection) {
            liveConnection.disconnect?.();
          }
        },
      });
    },
  });
}

async function resolveLiveConnection(
  options: CreateImRtcSignalingAdapterOptions,
  rtcSessionId: string,
): Promise<ImRtcLiveConnectionLike> {
  if (options.liveConnection) {
    return options.liveConnection;
  }

  if (typeof options.sdk.connect !== 'function') {
    throw new RtcSdkException({
      code: 'signaling_not_available',
      message: 'IM live signaling connection is not available. Provide sdk.connect() or a liveConnection.',
      details: {
        rtcSessionId,
      },
    });
  }

  return options.sdk.connect({
    ...options.connectOptions,
    subscriptions: {
      rtcSessions: [rtcSessionId],
    },
  });
}
