import 'dart:convert';

import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_im_signaling_message.dart';

RtcCallSessionRecord toRtcCallSessionRecord(RtcSession? session) {
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

RtcCallParticipantCredential toRtcCallParticipantCredential(
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

RtcCallSignal toRtcCallSignal(RtcSignalEvent? signalEvent) {
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

RtcCallSignal? toRtcCallSignalFromRealtimeEvent(RealtimeEvent event) {
  final payload = event.payload;
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final decodedPayload = jsonDecode(payload);
    if (decodedPayload is! Map<String, dynamic>) {
      return null;
    }

    return toRtcCallSignal(RtcSignalEvent.fromJson(decodedPayload));
  } catch (_) {
    return null;
  }
}

RtcImConversationSignalMessage? toRtcImConversationSignalMessageFromRealtimeEvent(
  RealtimeEvent event,
) {
  if (event.scopeType != 'conversation' ||
      event.scopeId == null ||
      !(event.eventType?.startsWith('message.') ?? false)) {
    return null;
  }

  final payload = event.payload;
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final decodedPayload = jsonDecode(payload);
    if (decodedPayload is! Map<String, dynamic>) {
      return null;
    }

    final bodyMap = _extractMessageBodyMap(decodedPayload);
    if (bodyMap == null) {
      return null;
    }

    final body = MessageBody.fromJson(bodyMap);
    final signalPart = body.parts
        ?.cast<ContentPart?>()
        .whereType<ContentPart>()
        .firstWhere(
          (part) =>
              part.kind == 'signal' &&
              part.signalType != null &&
              part.signalType!.isNotEmpty,
          orElse: () => ContentPart(),
        );

    final signalType = signalPart?.signalType;
    if (signalType == null || signalType.isEmpty) {
      return null;
    }

    final rawPayload = signalPart?.payload ?? '';
    return RtcImConversationSignalMessage(
      conversationId:
          decodedPayload['conversationId']?.toString() ?? event.scopeId!,
      signalType: signalType,
      payload: _decodePayload(rawPayload),
      rawPayload: rawPayload,
      schemaRef: signalPart?.schemaRef,
      occurredAt: event.occurredAt,
    );
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

Map<String, dynamic>? _extractMessageBodyMap(Map<String, dynamic> payload) {
  final body = payload['body'];
  if (body is Map<String, dynamic>) {
    return body;
  }

  if (body is Map) {
    return body.cast<String, dynamic>();
  }

  if (payload.containsKey('parts') ||
      payload.containsKey('text') ||
      payload.containsKey('summary')) {
    return payload;
  }

  return null;
}
