import 'dart:convert';

import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_controller_contract.dart';
import 'rtc_call_controller_models.dart';
import 'rtc_im_signaling.dart';

Future<void> publishRtcConversationSignal(
  ImSdkClient sdk, {
  required String conversationId,
  required String signalType,
  required String schemaRef,
  required String text,
  required Object payload,
}) async {
  await sdk.conversations.postMessage(
    conversationId,
    PostMessageRequest(
      text: text,
      parts: <ContentPart>[
        ContentPart(
          kind: 'signal',
          signalType: signalType,
          schemaRef: schemaRef,
          encoding: 'application/json',
          payload: jsonEncode(payload),
        ),
      ],
    ),
  );
}

RtcIncomingCallInvitation? toRtcIncomingCallInvitation(
  RtcImConversationSignalMessage signal,
) {
  if (signal.signalType != rtcCallInviteSignalType) {
    return null;
  }

  final payload = _asMap(signal.payload);
  final rtcSessionId = _stringValue(payload['rtcSessionId']);
  final conversationId =
      _stringValue(payload['conversationId']) ?? signal.conversationId;
  final rtcMode = _stringValue(payload['rtcMode']);
  if (rtcSessionId == null || conversationId.isEmpty || rtcMode == null) {
    return null;
  }

  return RtcIncomingCallInvitation(
    rtcSessionId: rtcSessionId,
    conversationId: conversationId,
    rtcMode: rtcMode,
    roomId: _stringValue(payload['roomId']),
    signalingStreamId: _stringValue(payload['signalingStreamId']),
    initiatorId: _stringValue(payload['initiatorId']),
    initiatorDisplayName: _stringValue(payload['initiatorDisplayName']),
    sentAt: _stringValue(payload['sentAt']),
    metadata: _asObjectMap(payload['metadata']),
    occurredAt: _stringValue(payload['sentAt']) ?? signal.occurredAt,
  );
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return value.map(
      (key, item) => MapEntry(key.toString(), item),
    );
  }

  return <String, dynamic>{};
}

Map<String, Object?>? _asObjectMap(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }

  if (value is Map) {
    return value.map(
      (key, item) => MapEntry(key.toString(), item),
    );
  }

  return null;
}

String? _stringValue(Object? value) {
  if (value == null) {
    return null;
  }

  final resolved = value.toString();
  return resolved.isEmpty ? null : resolved;
}
