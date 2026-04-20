import { RtcSdkException } from './errors.js';
import { RTC_CALL_INVITE_SIGNAL_TYPE } from './call-controller-contract.js';
import { freezeRtcRuntimeValue } from './runtime-freeze.js';
import type { RtcIncomingCallInvitation } from './call-controller-models.js';
import type {
  CreateImRtcSignalingAdapterOptions,
  ImRtcLiveConnectionLike,
  ImRtcLiveMessageContextLike,
  ImRtcSdkLike,
} from './im-signaling.js';

export interface ImRtcConversationSignalMessageCreateOptions {
  conversationId: string | number;
  text?: string;
  signalType: string;
  schemaRef?: string;
  encoding?: string;
  payload?: string;
  state?: string;
}

export interface ImRtcCallControllerSdkLike extends ImRtcSdkLike {
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

export async function publishRtcConversationSignal(
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

export function toRtcIncomingCallInvitation(
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
