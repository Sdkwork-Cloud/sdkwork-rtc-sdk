import 'dart:async';

import 'package:im_sdk/im_sdk.dart';

export 'rtc_im_signaling_message.dart';

import 'rtc_call_types.dart';
import 'rtc_im_signaling_codec.dart';
import 'rtc_im_signaling_message.dart';

class CreateImRtcSignalingAdapterOptions {
  const CreateImRtcSignalingAdapterOptions({
    required this.sdk,
    required this.deviceId,
    this.pollingInterval = const Duration(seconds: 1),
    this.pullLimit = 50,
    this.realtimeDispatcher,
  });

  final ImSdkClient sdk;
  final String deviceId;
  final Duration pollingInterval;
  final int pullLimit;
  final RtcImRealtimeDispatcher? realtimeDispatcher;
}

RtcCallSignalingAdapter createImRtcSignalingAdapter(
  CreateImRtcSignalingAdapterOptions options,
) {
  return _ImRtcSignalingAdapter(options);
}

final class _ImRtcSignalingAdapter implements RtcCallSignalingAdapter {
  _ImRtcSignalingAdapter(CreateImRtcSignalingAdapterOptions options)
      : _sdk = options.sdk,
        _dispatcher = options.realtimeDispatcher ?? RtcImRealtimeDispatcher(options);

  final ImSdkClient _sdk;
  final RtcImRealtimeDispatcher _dispatcher;

  @override
  Future<RtcCallSessionRecord> createSession({
    required String rtcSessionId,
    String? conversationId,
    required String rtcMode,
  }) async {
    final session = await _sdk.rtc.create(
      CreateRtcSessionRequest(
        rtcSessionId: rtcSessionId,
        conversationId: conversationId,
        rtcMode: rtcMode,
      ),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> inviteSession(
    String rtcSessionId, {
    String? signalingStreamId,
  }) async {
    final session = await _sdk.rtc.invite(
      rtcSessionId,
      InviteRtcSessionRequest(signalingStreamId: signalingStreamId),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> acceptSession(String rtcSessionId) async {
    final session = await _sdk.rtc.accept(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> rejectSession(String rtcSessionId) async {
    final session = await _sdk.rtc.reject(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> endSession(String rtcSessionId) async {
    final session = await _sdk.rtc.end(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return toRtcCallSessionRecord(session);
  }

  @override
  Future<RtcCallSignal> sendSignal(
    String rtcSessionId,
    String signalType,
    Object? payload, {
    RtcCallSignalSendOptions options = const RtcCallSignalSendOptions(),
  }) async {
    final signalEvent = await _sdk.rtc.postJsonSignal(
      rtcSessionId,
      signalType: signalType,
      options: ImPostJsonSignalOptions(
        payload: payload,
        signalingStreamId: options.signalingStreamId,
        schemaRef: options.schemaRef,
      ),
    );
    return toRtcCallSignal(signalEvent);
  }

  @override
  Future<RtcCallParticipantCredential> issueParticipantCredential(
    String rtcSessionId, {
    required String participantId,
  }) async {
    final credential = await _sdk.rtc.issueParticipantCredential(
      rtcSessionId,
      IssueRtcParticipantCredentialRequest(participantId: participantId),
    );
    return toRtcCallParticipantCredential(credential);
  }

  @override
  Future<RtcCallSignalSubscription> subscribeSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  ) {
    return _dispatcher.subscribeRtcSessionSignals(rtcSessionId, handler);
  }
}

class RtcImRealtimeDispatcher {
  RtcImRealtimeDispatcher(CreateImRtcSignalingAdapterOptions options)
      : _sdk = options.sdk,
        _deviceId = options.deviceId,
        _pollingInterval = options.pollingInterval,
        _pullLimit = options.pullLimit;

  final ImSdkClient _sdk;
  final String _deviceId;
  final Duration _pollingInterval;
  final int _pullLimit;
  final Map<String, Set<RtcCallSignalHandler>> _handlersBySessionId =
      <String, Set<RtcCallSignalHandler>>{};
  final Map<String, Set<RtcImConversationSignalHandler>>
      _conversationHandlersById = <String, Set<RtcImConversationSignalHandler>>{};

  bool _running = false;
  int _afterSeq = 0;

  Future<RtcCallSignalSubscription> subscribeRtcSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  ) async {
    final handlers = _handlersBySessionId.putIfAbsent(
      rtcSessionId,
      () => <RtcCallSignalHandler>{},
    );
    handlers.add(handler);

    await _syncSubscriptions();
    _ensureLoop();

    return _ImRtcCallSignalSubscription(
      onUnsubscribe: () {
        final currentHandlers = _handlersBySessionId[rtcSessionId];
        if (currentHandlers == null) {
          return;
        }

        currentHandlers.remove(handler);
        if (currentHandlers.isEmpty) {
          _handlersBySessionId.remove(rtcSessionId);
        }

        unawaited(_syncSubscriptions());
      },
    );
  }

  Future<RtcCallSignalSubscription> subscribeConversationSignals(
    String conversationId,
    RtcImConversationSignalHandler handler,
  ) async {
    final handlers = _conversationHandlersById.putIfAbsent(
      conversationId,
      () => <RtcImConversationSignalHandler>{},
    );
    handlers.add(handler);

    await _syncSubscriptions();
    _ensureLoop();

    return _ImRtcCallSignalSubscription(
      onUnsubscribe: () {
        final currentHandlers = _conversationHandlersById[conversationId];
        if (currentHandlers == null) {
          return;
        }

        currentHandlers.remove(handler);
        if (currentHandlers.isEmpty) {
          _conversationHandlersById.remove(conversationId);
        }

        unawaited(_syncSubscriptions());
      },
    );
  }

  void _ensureLoop() {
    if (_running) {
      return;
    }

    _running = true;
    unawaited(_pollLoop());
  }

  Future<void> _pollLoop() async {
    while (_hasSubscriptions) {
      try {
        await _pollOnce();
      } catch (_) {
      }

      if (!_hasSubscriptions) {
        break;
      }

      await Future<void>.delayed(_pollingInterval);
    }

    _running = false;
  }

  Future<void> _pollOnce() async {
    final realtimeWindow = await _sdk.realtime.pullEvents(
      <String, dynamic>{
        'deviceId': _deviceId,
        if (_afterSeq > 0) 'afterSeq': _afterSeq,
        'limit': _pullLimit,
      },
    );

    final events = realtimeWindow?.items ?? const <RealtimeEvent>[];
    var highestSeq = _afterSeq;

    for (final event in events) {
      final realtimeSeq = event.realtimeSeq ?? 0;
      if (realtimeSeq > highestSeq) {
        highestSeq = realtimeSeq;
      }

      if (event.scopeType != 'rtc_session' ||
          event.eventType != 'rtc.signal' ||
          event.scopeId == null) {
        final conversationSignal =
            toRtcImConversationSignalMessageFromRealtimeEvent(event);
        if (conversationSignal == null) {
          continue;
        }

        final handlers = _conversationHandlersById[conversationSignal.conversationId];
        if (handlers == null || handlers.isEmpty) {
          continue;
        }

        final dispatchedHandlers = handlers.toList(growable: false);
        for (final handler in dispatchedHandlers) {
          handler(conversationSignal);
        }
        continue;
      }

      final signal = toRtcCallSignalFromRealtimeEvent(event);
      if (signal == null) {
        continue;
      }

      final handlers = _handlersBySessionId[event.scopeId];
      if (handlers == null || handlers.isEmpty) {
        continue;
      }

      final dispatchedHandlers = handlers.toList(growable: false);
      for (final handler in dispatchedHandlers) {
        handler(signal);
      }
    }

    final nextAfterSeq = realtimeWindow?.nextAfterSeq;
    if (nextAfterSeq != null && nextAfterSeq > highestSeq) {
      highestSeq = nextAfterSeq;
    }

    if (highestSeq > _afterSeq) {
      _afterSeq = highestSeq;
      await _sdk.realtime.ackEvents(
        AckRealtimeEventsRequest(
          deviceId: _deviceId,
          ackedSeq: highestSeq,
        ),
      );
    }
  }

  Future<void> _syncSubscriptions() async {
    await _sdk.realtime.replaceSubscriptions(
      SyncRealtimeSubscriptionsRequest(
        deviceId: _deviceId,
        items: <RealtimeSubscriptionItemInput>[
          ..._conversationHandlersById.keys.map(
            (conversationId) => RealtimeSubscriptionItemInput(
              scopeType: 'conversation',
              scopeId: conversationId,
              eventTypes: const <String>['message.created'],
            ),
          ),
          ..._handlersBySessionId.keys.map(
            (rtcSessionId) => RealtimeSubscriptionItemInput(
              scopeType: 'rtc_session',
              scopeId: rtcSessionId,
              eventTypes: const <String>['rtc.signal'],
            ),
          ),
        ],
      ),
    );
  }

  bool get _hasSubscriptions =>
      _handlersBySessionId.isNotEmpty || _conversationHandlersById.isNotEmpty;
}

final class _ImRtcCallSignalSubscription implements RtcCallSignalSubscription {
  _ImRtcCallSignalSubscription({
    required void Function() onUnsubscribe,
  }) : _onUnsubscribe = onUnsubscribe;

  final void Function() _onUnsubscribe;
  bool _unsubscribed = false;

  @override
  void unsubscribe() {
    if (_unsubscribed) {
      return;
    }

    _unsubscribed = true;
    _onUnsubscribe();
  }
}
