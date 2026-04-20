import 'dart:async';
import 'dart:convert';

import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_types.dart';
import 'rtc_errors.dart';

class CreateImRtcSignalingAdapterOptions {
  const CreateImRtcSignalingAdapterOptions({
    required this.sdk,
    required this.deviceId,
    this.pollingInterval = const Duration(seconds: 1),
    this.pullLimit = 50,
  });

  final ImSdkClient sdk;
  final String deviceId;
  final Duration pollingInterval;
  final int pullLimit;
}

RtcCallSignalingAdapter createImRtcSignalingAdapter(
  CreateImRtcSignalingAdapterOptions options,
) {
  return _ImRtcSignalingAdapter(options);
}

final class _ImRtcSignalingAdapter implements RtcCallSignalingAdapter {
  _ImRtcSignalingAdapter(CreateImRtcSignalingAdapterOptions options)
      : _sdk = options.sdk,
        _dispatcher = _ImRtcRealtimeDispatcher(options);

  final ImSdkClient _sdk;
  final _ImRtcRealtimeDispatcher _dispatcher;

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
    return _toSessionRecord(session);
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
    return _toSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> acceptSession(String rtcSessionId) async {
    final session = await _sdk.rtc.accept(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return _toSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> rejectSession(String rtcSessionId) async {
    final session = await _sdk.rtc.reject(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return _toSessionRecord(session);
  }

  @override
  Future<RtcCallSessionRecord> endSession(String rtcSessionId) async {
    final session = await _sdk.rtc.end(
      rtcSessionId,
      UpdateRtcSessionRequest(),
    );
    return _toSessionRecord(session);
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
    return _toSignal(signalEvent);
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
    return _toParticipantCredential(credential);
  }

  @override
  Future<RtcCallSignalSubscription> subscribeSessionSignals(
    String rtcSessionId,
    RtcCallSignalHandler handler,
  ) {
    return _dispatcher.subscribe(rtcSessionId, handler);
  }
}

final class _ImRtcRealtimeDispatcher {
  _ImRtcRealtimeDispatcher(CreateImRtcSignalingAdapterOptions options)
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

  bool _running = false;
  int _afterSeq = 0;

  Future<RtcCallSignalSubscription> subscribe(
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

  void _ensureLoop() {
    if (_running) {
      return;
    }

    _running = true;
    unawaited(_pollLoop());
  }

  Future<void> _pollLoop() async {
    while (_handlersBySessionId.isNotEmpty) {
      try {
        await _pollOnce();
      } catch (_) {
      }

      if (_handlersBySessionId.isEmpty) {
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
        continue;
      }

      final signal = _toSignalFromRealtimeEvent(event);
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
        items: _handlersBySessionId.keys
            .map(
              (rtcSessionId) => RealtimeSubscriptionItemInput(
                scopeType: 'rtc_session',
                scopeId: rtcSessionId,
                eventTypes: const <String>['rtc.signal'],
              ),
            )
            .toList(growable: false),
      ),
    );
  }
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

RtcCallSessionRecord _toSessionRecord(RtcSession? session) {
  final resolvedSession = _requireValue(
    session,
    message: 'IM RTC session response is empty.',
  );

  return RtcCallSessionRecord(
    rtcSessionId: _requireString(
      resolvedSession.rtcSessionId,
      message: 'IM RTC session is missing rtcSessionId.',
    ),
    conversationId: resolvedSession.conversationId,
    rtcMode: resolvedSession.rtcMode,
    state: _toCallState(
      resolvedSession.state,
      message: 'IM RTC session is missing state.',
    ),
    signalingStreamId: resolvedSession.signalingStreamId,
    initiatorId: resolvedSession.initiatorId,
    providerPluginId: resolvedSession.providerPluginId,
    providerSessionId: resolvedSession.providerSessionId,
    accessEndpoint: resolvedSession.accessEndpoint,
    providerRegion: resolvedSession.providerRegion,
    startedAt: resolvedSession.startedAt,
    endedAt: resolvedSession.endedAt,
  );
}

RtcCallParticipantCredential _toParticipantCredential(
  RtcParticipantCredential? credential,
) {
  final resolvedCredential = _requireValue(
    credential,
    message: 'IM RTC participant credential response is empty.',
  );

  return RtcCallParticipantCredential(
    rtcSessionId: _requireString(
      resolvedCredential.rtcSessionId,
      message: 'IM RTC participant credential is missing rtcSessionId.',
    ),
    participantId: _requireString(
      resolvedCredential.participantId,
      message: 'IM RTC participant credential is missing participantId.',
    ),
    credential: _requireString(
      resolvedCredential.credential,
      message: 'IM RTC participant credential is missing credential.',
    ),
    expiresAt: resolvedCredential.expiresAt,
  );
}

RtcCallSignal _toSignal(RtcSignalEvent? signalEvent) {
  final resolvedSignal = _requireValue(
    signalEvent,
    message: 'IM RTC signal response is empty.',
  );

  final rawPayload = resolvedSignal.payload ?? '';
  return RtcCallSignal(
    rtcSessionId: _requireString(
      resolvedSignal.rtcSessionId,
      message: 'IM RTC signal is missing rtcSessionId.',
    ),
    conversationId: resolvedSignal.conversationId,
    rtcMode: resolvedSignal.rtcMode,
    signalType: _requireString(
      resolvedSignal.signalType,
      message: 'IM RTC signal is missing signalType.',
    ),
    payload: _decodePayload(rawPayload),
    rawPayload: rawPayload,
    senderId: resolvedSignal.sender?.id,
    signalingStreamId: resolvedSignal.signalingStreamId,
    occurredAt: resolvedSignal.occurredAt,
  );
}

RtcCallSignal? _toSignalFromRealtimeEvent(RealtimeEvent event) {
  final payload = event.payload;
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final decodedPayload = jsonDecode(payload);
    if (decodedPayload is! Map<String, dynamic>) {
      return null;
    }

    return _toSignal(RtcSignalEvent.fromJson(decodedPayload));
  } catch (_) {
    return null;
  }
}

RtcCallState _toCallState(
  String? value, {
  required String message,
}) {
  switch (value) {
    case 'started':
      return RtcCallState.started;
    case 'accepted':
      return RtcCallState.accepted;
    case 'connected':
      return RtcCallState.connected;
    case 'rejected':
      return RtcCallState.rejected;
    case 'ended':
      return RtcCallState.ended;
    case 'idle':
      return RtcCallState.idle;
    default:
      throw RtcSdkException(
        code: 'vendor_error',
        message: message,
        details: <String, Object?>{
          'state': value,
        },
      );
  }
}

T _requireValue<T>(
  T? value, {
  required String message,
}) {
  if (value != null) {
    return value;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: message,
  );
}

String _requireString(
  String? value, {
  required String message,
}) {
  if (value != null && value.isNotEmpty) {
    return value;
  }

  throw RtcSdkException(
    code: 'vendor_error',
    message: message,
  );
}

Object? _decodePayload(String rawPayload) {
  if (rawPayload.isEmpty) {
    return null;
  }

  try {
    return jsonDecode(rawPayload);
  } catch (_) {
    return rawPayload;
  }
}
