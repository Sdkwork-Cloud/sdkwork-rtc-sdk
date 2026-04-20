class RtcImConversationSignalMessage {
  const RtcImConversationSignalMessage({
    required this.conversationId,
    required this.signalType,
    this.payload,
    required this.rawPayload,
    this.schemaRef,
    this.occurredAt,
  });

  final String conversationId;
  final String signalType;
  final Object? payload;
  final String rawPayload;
  final String? schemaRef;
  final String? occurredAt;
}

typedef RtcImConversationSignalHandler = void Function(
  RtcImConversationSignalMessage signal,
);
