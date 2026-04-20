import { RtcSdkException } from './errors.js';
import type {
  RtcCallSignal,
  RtcCallSignalSubscription,
  RtcCallSignalingAdapter,
} from './call-types.js';
import type { CreateStandardRtcCallControllerOptions } from './call-controller-models.js';
import type { ImRtcCallControllerSdkLike } from './call-controller-message.js';
import type {
  ImRtcLiveConnectionLike,
  ImRtcLiveMessageContextLike,
} from './im-signaling.js';

export class RtcCallControllerSessionSubscriptionManager {
  readonly #signaling: RtcCallSignalingAdapter;
  readonly #onSignal: (signal: RtcCallSignal) => void | Promise<void>;
  #activeSessionId?: string;
  #activeSessionSubscription?: RtcCallSignalSubscription;

  constructor(input: {
    signaling: RtcCallSignalingAdapter;
    onSignal(signal: RtcCallSignal): void | Promise<void>;
  }) {
    this.#signaling = input.signaling;
    this.#onSignal = input.onSignal;
  }

  get activeSessionId(): string | undefined {
    return this.#activeSessionId;
  }

  async subscribe(rtcSessionId: string): Promise<void> {
    if (this.#activeSessionId === rtcSessionId && this.#activeSessionSubscription) {
      return;
    }

    const nextSubscription = await this.#signaling.subscribeSessionSignals(
      rtcSessionId,
      (signal) => {
        void this.#onSignal(signal);
      },
    );

    const previousSubscription = this.#activeSessionSubscription;
    this.#activeSessionId = rtcSessionId;
    this.#activeSessionSubscription = nextSubscription;
    previousSubscription?.unsubscribe();
  }

  clear(): void {
    this.#activeSessionSubscription?.unsubscribe();
    this.#activeSessionSubscription = undefined;
    this.#activeSessionId = undefined;
  }
}

export class RtcCallControllerConversationSubscriptionManager {
  readonly #sdk: ImRtcCallControllerSdkLike;
  readonly #connectOptions?: CreateStandardRtcCallControllerOptions['connectOptions'];
  readonly #onMessage:
    (message: unknown, context: ImRtcLiveMessageContextLike) => void | Promise<void>;
  #connection?: ImRtcLiveConnectionLike;
  #unsubscribers: Array<() => void> = [];

  constructor(input: {
    sdk: ImRtcCallControllerSdkLike;
    connectOptions?: CreateStandardRtcCallControllerOptions['connectOptions'];
    onMessage(message: unknown, context: ImRtcLiveMessageContextLike): void | Promise<void>;
  }) {
    this.#sdk = input.sdk;
    this.#connectOptions = input.connectOptions;
    this.#onMessage = input.onMessage;
  }

  async reconnect(conversationIds: readonly string[]): Promise<void> {
    if (!conversationIds.length) {
      this.disconnect();
      return;
    }

    if (typeof this.#sdk.connect !== 'function') {
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'IM live invitation watch is not available. Provide sdk.connect() for conversation subscriptions.',
      });
    }

    const nextConnection = await this.#sdk.connect({
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

    if (!nextConnection.messages) {
      nextConnection.disconnect?.();
      throw new RtcSdkException({
        code: 'signaling_not_available',
        message:
          'IM live invitation watch is missing live.messages.onConversation(...) support.',
      });
    }

    const messageStream = nextConnection.messages;
    const nextUnsubscribers = conversationIds.map((conversationId) =>
      messageStream.onConversation(conversationId, (message, context) => {
        void this.#onMessage(message, context);
      }),
    );

    const previousConnection = this.#connection;
    const previousUnsubscribers = this.#unsubscribers;
    this.#connection = nextConnection;
    this.#unsubscribers = nextUnsubscribers;
    for (const unsubscribe of previousUnsubscribers) {
      unsubscribe();
    }
    previousConnection?.disconnect?.();
  }

  disconnect(): void {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }

    this.#unsubscribers = [];
    this.#connection?.disconnect?.();
    this.#connection = undefined;
  }
}
