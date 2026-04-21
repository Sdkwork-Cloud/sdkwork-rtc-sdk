import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:im_sdk/im_sdk.dart';
import 'package:rtc_sdk/rtc_sdk.dart';
import 'package:volc_engine_rtc/volc_engine_rtc.dart';
import 'package:volc_engine_rtc/codegen/pack/keytype.dart' as volc_pack;

const _defaultOptions = _RtcCallSmokeOptions(
  appId: 'volc-app-smoke',
  sessionId: 'rtc-session-smoke',
  conversationId: 'conversation-smoke',
  roomId: 'room-smoke',
  participantId: 'user-smoke',
  signalingStreamId: 'signal-smoke',
  deviceId: 'device-smoke',
  reuseLiveConnection: false,
  json: false,
  help: false,
);

final class _RtcCallSmokeOptions {
  const _RtcCallSmokeOptions({
    required this.appId,
    required this.sessionId,
    required this.conversationId,
    required this.roomId,
    required this.participantId,
    required this.signalingStreamId,
    required this.deviceId,
    required this.reuseLiveConnection,
    required this.json,
    required this.help,
  });

  final String appId;
  final String sessionId;
  final String conversationId;
  final String roomId;
  final String participantId;
  final String signalingStreamId;
  final String deviceId;
  final bool reuseLiveConnection;
  final bool json;
  final bool help;
}

Never _fail(String message) {
  throw ArgumentError(message);
}

void _writeLine(IOSink sink, [String line = '']) {
  sink.writeln(line);
}

String _normalizeOptionName(String token) {
  return token.replaceFirst(RegExp(r'^-+'), '').trim();
}

Map<String, Object> _parseOptionEntries(List<String> argv) {
  final entries = <String, Object>{};

  for (var index = 0; index < argv.length; index += 1) {
    final token = argv[index];
    if (!token.startsWith('-')) {
      _fail('Unexpected positional argument "$token".');
    }

    final normalizedToken = _normalizeOptionName(token);
    if (normalizedToken.isEmpty) {
      _fail('Invalid empty option token "$token".');
    }

    final inlineEqualsIndex = normalizedToken.indexOf('=');
    final optionName = inlineEqualsIndex >= 0
        ? normalizedToken.substring(0, inlineEqualsIndex)
        : normalizedToken;
    final inlineValue = inlineEqualsIndex >= 0
        ? normalizedToken.substring(inlineEqualsIndex + 1)
        : null;
    final nextToken = index + 1 < argv.length ? argv[index + 1] : null;
    final hasSeparateValue =
        inlineValue == null && nextToken != null && !nextToken.startsWith('-');

    if (inlineValue != null) {
      entries[optionName] = inlineValue;
      continue;
    }

    if (hasSeparateValue) {
      entries[optionName] = nextToken;
      index += 1;
      continue;
    }

    entries[optionName] = true;
  }

  return entries;
}

String _readStringOption(
  Map<String, Object> entries,
  String optionName,
  String fallback,
) {
  final value = entries[optionName];
  if (value == null || value == true) {
    return fallback;
  }

  final normalized = value.toString().trim();
  if (normalized.isEmpty) {
    _fail('$optionName must not be empty.');
  }

  return normalized;
}

_RtcCallSmokeOptions _parseRtcCallSmokeArgs(List<String> argv) {
  final entries = _parseOptionEntries(argv);
  final helpRequested = entries['help'] == true || entries['h'] == true;

  if (helpRequested) {
    return const _RtcCallSmokeOptions(
      appId: 'volc-app-smoke',
      sessionId: 'rtc-session-smoke',
      conversationId: 'conversation-smoke',
      roomId: 'room-smoke',
      participantId: 'user-smoke',
      signalingStreamId: 'signal-smoke',
      deviceId: 'device-smoke',
      reuseLiveConnection: false,
      json: false,
      help: true,
    );
  }

  return _RtcCallSmokeOptions(
    appId: _readStringOption(entries, 'app-id', _defaultOptions.appId),
    sessionId:
        _readStringOption(entries, 'session-id', _defaultOptions.sessionId),
    conversationId: _readStringOption(
      entries,
      'conversation-id',
      _defaultOptions.conversationId,
    ),
    roomId: _readStringOption(entries, 'room-id', _defaultOptions.roomId),
    participantId: _readStringOption(
      entries,
      'participant-id',
      _defaultOptions.participantId,
    ),
    signalingStreamId: _readStringOption(
      entries,
      'signaling-stream-id',
      _defaultOptions.signalingStreamId,
    ),
    deviceId: _readStringOption(entries, 'device-id', _defaultOptions.deviceId),
    reuseLiveConnection: entries['reuse-live-connection'] == true,
    json: entries['json'] == true,
    help: false,
  );
}

String getRtcCallSmokeHelpText() {
  return <String>[
    'SDKWork RTC Flutter call smoke CLI',
    '',
    'Usage:',
    '  flutter pub run ./bin/sdk-call-smoke.dart [--json] [--app-id <id>] [--session-id <id>]',
    '',
    'Behavior:',
    '  runs the public rtc_sdk surface against sdkwork-im-sdk using a local fake IM service',
    '  and a fake official Volcengine Flutter engine factory',
    '  does not hit external services or require live credentials',
    '',
    'Options:',
    '  --json                        Print the smoke summary as JSON',
    '  --app-id <id>                Override the mocked Volcengine appId',
    '  --session-id <id>            Override the RTC session id',
    '  --conversation-id <id>       Override the conversation id',
    '  --room-id <id>               Override the room id',
    '  --participant-id <id>        Override the participant id',
    '  --signaling-stream-id <id>   Override the signaling stream id',
    '  --device-id <id>             Override the IM realtime device id',
    '  --reuse-live-connection      Reuse one preconnected IM WebSocket live connection',
  ].join('\n');
}

ImConnectOptions buildRtcCallSmokeConnectOptions({
  required String deviceId,
  String? conversationId,
  bool includeConversationSubscriptions = false,
}) {
  if (includeConversationSubscriptions && conversationId != null) {
    return ImConnectOptions(
      deviceId: deviceId,
      subscriptions: ImRealtimeSubscriptionGroups(
        conversations: <String>[conversationId],
      ),
      webSocketAuth: const ImWebSocketAuthOptions.automatic(),
    );
  }

  return ImConnectOptions(
    deviceId: deviceId,
    webSocketAuth: const ImWebSocketAuthOptions.automatic(),
  );
}

Map<String, Object?> buildRtcCallSmokeSignalingTransportSummary({
  required String deviceId,
  ImConnectOptions? connectOptions,
  ImLiveConnection? liveConnection,
}) {
  final resolvedConnectOptions =
      connectOptions ?? buildRtcCallSmokeConnectOptions(deviceId: deviceId);
  return describeRtcSignalingTransport(
    deviceId: deviceId,
    connectOptions: resolvedConnectOptions,
    liveConnection: liveConnection,
  ).toJson();
}

String _nowIso() {
  return DateTime.now().toUtc().toIso8601String();
}

final class _RealtimeSubscriptionRecord {
  const _RealtimeSubscriptionRecord({
    required this.scopeType,
    required this.scopeId,
    required this.eventTypes,
  });

  final String scopeType;
  final String scopeId;
  final List<String> eventTypes;
}

final class _RealtimeSocketClient {
  _RealtimeSocketClient({
    required this.deviceId,
    required this.socket,
  });

  final String deviceId;
  final WebSocket socket;
}

final class _RtcCallSmokeServer {
  _RtcCallSmokeServer(this.options);

  final _RtcCallSmokeOptions options;
  final List<String> transportCalls = <String>[];
  final Map<String, List<_RealtimeSubscriptionRecord>>
      _subscriptionsByDeviceId = <String, List<_RealtimeSubscriptionRecord>>{};
  final List<RealtimeEvent> _realtimeEvents = <RealtimeEvent>[];
  final List<_RealtimeSocketClient> _socketClients = <_RealtimeSocketClient>[];
  final Map<String, int> _pushedThroughSeqByDeviceId = <String, int>{};

  HttpServer? _server;
  int _nextRealtimeSeq = 1;
  int _nextMessageSeq = 1;
  int _ackedThroughSeq = 0;
  String _sessionState = 'idle';
  String? _startedAt;
  String? _endedAt;
  String? _signalingStreamId;
  String? _lastResumedDeviceId;

  String get baseUrl {
    final server = _server;
    if (server == null) {
      throw StateError('RTC call smoke server has not started.');
    }

    return 'http://${server.address.address}:${server.port}';
  }

  Future<void> start() async {
    _server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    _server!.listen(_handleRequest);
  }

  Future<void> close() async {
    await _server?.close(force: true);
    _server = null;
  }

  Future<void> _handleRequest(HttpRequest request) async {
    try {
      final method = request.method.toUpperCase();
      final path = request.uri.path;

      if (method == 'POST' && path == '/api/v1/rtc/sessions') {
        await _handleCreateRtcSession(request);
        return;
      }

      if (method == 'POST' && path == '/api/v1/sessions/resume') {
        await _handleResumeSession(request);
        return;
      }

      if (method == 'POST' && path == '/api/v1/realtime/subscriptions/sync') {
        await _handleSyncRealtimeSubscriptions(request);
        return;
      }

      if (method == 'GET' && path == '/api/v1/realtime/events') {
        await _handleListRealtimeEvents(request);
        return;
      }

      if (method == 'POST' && path == '/api/v1/realtime/events/ack') {
        await _handleAckRealtimeEvents(request);
        return;
      }

      if (method == 'GET' && path == '/api/v1/realtime/ws') {
        await _handleRealtimeWebSocket(request);
        return;
      }

      final rtcSessionMatch = RegExp(
        r'^/api/v1/rtc/sessions/([^/]+)/(invite|accept|reject|end|signals|credentials)$',
      ).firstMatch(path);
      if (method == 'POST' && rtcSessionMatch != null) {
        final rtcSessionId = rtcSessionMatch.group(1)!;
        final action = rtcSessionMatch.group(2)!;
        await switch (action) {
          'invite' => _handleInviteRtcSession(request, rtcSessionId),
          'accept' => _handleAcceptRtcSession(request, rtcSessionId),
          'reject' => _handleRejectRtcSession(request, rtcSessionId),
          'end' => _handleEndRtcSession(request, rtcSessionId),
          'signals' => _handlePostRtcSignal(request, rtcSessionId),
          'credentials' =>
            _handleIssueParticipantCredential(request, rtcSessionId),
          _ => _writeNotFound(request),
        };
        return;
      }

      final conversationMessageMatch = RegExp(
        r'^/api/v1/conversations/([^/]+)/messages$',
      ).firstMatch(path);
      if (method == 'POST' && conversationMessageMatch != null) {
        await _handlePostConversationMessage(
          request,
          conversationMessageMatch.group(1)!,
        );
        return;
      }

      await _writeNotFound(request);
    } catch (error, stackTrace) {
      stderr.writeln('[sdkwork-rtc-sdk-flutter] IM smoke server error: $error');
      stderr.writeln(stackTrace);
      await _writeJson(
        request.response,
        HttpStatus.internalServerError,
        <String, Object?>{
          'error': error.toString(),
        },
      );
    }
  }

  Future<void> _handleCreateRtcSession(HttpRequest request) async {
    transportCalls.add('rtc.create');
    final payload = await _readJsonBody(request);
    _sessionState = 'started';
    _startedAt ??= _nowIso();

    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSession(
        rtcSessionId: payload['rtcSessionId']?.toString(),
        conversationId: payload['conversationId']?.toString(),
        rtcMode: payload['rtcMode']?.toString(),
        initiatorId: options.participantId,
        providerPluginId: 'rtc-volcengine',
        providerSessionId: 'provider-${options.sessionId}',
        accessEndpoint: 'volcengine://smoke-endpoint',
        providerRegion: 'cn-shanghai',
        state: _sessionState,
        startedAt: _startedAt,
      ).toJson(),
    );
  }

  Future<void> _handleResumeSession(HttpRequest request) async {
    transportCalls.add('session.resume');
    final payload = await _readJsonBody(request);
    final deviceId = payload['deviceId']?.toString() ?? options.deviceId;
    _lastResumedDeviceId = deviceId;

    await _writeJson(
      request.response,
      HttpStatus.ok,
      SessionResumeView(
        tenantId: 'tenant-smoke',
        actorId: options.participantId,
        actorKind: 'user',
        sessionId: 'session-$deviceId',
        deviceId: deviceId,
        resumeRequired: false,
        resumeFromSyncSeq: _ackedThroughSeq,
        latestSyncSeq: _nextRealtimeSeq - 1,
        resumedAt: _nowIso(),
      ).toJson(),
    );
  }

  Future<void> _handleInviteRtcSession(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    transportCalls.add('rtc.invite');
    final payload = await _readJsonBody(request);
    _signalingStreamId =
        payload['signalingStreamId']?.toString() ?? options.signalingStreamId;

    _enqueueRtcSignalEvent(
      rtcSessionId: rtcSessionId,
      signalType: rtcCallAcceptedSignalType,
      schemaRef: rtcCallLifecycleSchemaRef,
      payload: <String, Object?>{
        'rtcSessionId': rtcSessionId,
        'conversationId': options.conversationId,
        'acceptedBy': 'remote-user-smoke',
        'occurredAt': _nowIso(),
      },
      signalingStreamId: _signalingStreamId,
    );

    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSession(
        rtcSessionId: rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        initiatorId: options.participantId,
        providerPluginId: 'rtc-volcengine',
        providerSessionId: 'provider-$rtcSessionId',
        accessEndpoint: 'volcengine://smoke-endpoint',
        providerRegion: 'cn-shanghai',
        state: _sessionState,
        signalingStreamId: _signalingStreamId,
        startedAt: _startedAt,
      ).toJson(),
    );
  }

  Future<void> _handleAcceptRtcSession(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    transportCalls.add('rtc.accept');
    await _readJsonBody(request);
    _sessionState = 'accepted';
    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSession(
        rtcSessionId: rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        initiatorId: options.participantId,
        providerPluginId: 'rtc-volcengine',
        providerSessionId: 'provider-$rtcSessionId',
        accessEndpoint: 'volcengine://smoke-endpoint',
        providerRegion: 'cn-shanghai',
        state: _sessionState,
        signalingStreamId: _signalingStreamId,
        startedAt: _startedAt,
      ).toJson(),
    );
  }

  Future<void> _handleRejectRtcSession(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    transportCalls.add('rtc.reject');
    await _readJsonBody(request);
    _sessionState = 'rejected';
    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSession(
        rtcSessionId: rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        providerPluginId: 'rtc-volcengine',
        providerSessionId: 'provider-$rtcSessionId',
        accessEndpoint: 'volcengine://smoke-endpoint',
        providerRegion: 'cn-shanghai',
        state: _sessionState,
        signalingStreamId: _signalingStreamId,
        startedAt: _startedAt,
      ).toJson(),
    );
  }

  Future<void> _handleEndRtcSession(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    transportCalls.add('rtc.end');
    await _readJsonBody(request);
    _sessionState = 'ended';
    _endedAt = _nowIso();
    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSession(
        rtcSessionId: rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        providerPluginId: 'rtc-volcengine',
        providerSessionId: 'provider-$rtcSessionId',
        accessEndpoint: 'volcengine://smoke-endpoint',
        providerRegion: 'cn-shanghai',
        state: _sessionState,
        signalingStreamId: _signalingStreamId,
        startedAt: _startedAt,
        endedAt: _endedAt,
      ).toJson(),
    );
  }

  Future<void> _handlePostRtcSignal(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    final payload = await _readJsonBody(request);
    transportCalls.add(
      'rtc.postSignal:${payload['signalType']?.toString() ?? 'unknown'}',
    );
    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcSignalEvent(
        rtcSessionId: rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: 'video_call',
        signalType: payload['signalType']?.toString(),
        schemaRef: payload['schemaRef']?.toString(),
        payload: payload['payload']?.toString(),
        sender: Sender(
          id: options.participantId,
          kind: 'user',
          deviceId: options.deviceId,
        ),
        signalingStreamId:
            payload['signalingStreamId']?.toString() ?? _signalingStreamId,
        occurredAt: _nowIso(),
      ).toJson(),
    );
  }

  Future<void> _handleIssueParticipantCredential(
    HttpRequest request,
    String rtcSessionId,
  ) async {
    transportCalls.add('rtc.issueParticipantCredential');
    final payload = await _readJsonBody(request);
    await _writeJson(
      request.response,
      HttpStatus.ok,
      RtcParticipantCredential(
        rtcSessionId: rtcSessionId,
        participantId: payload['participantId']?.toString(),
        credential: 'volc-token-smoke',
        expiresAt: DateTime.now()
            .toUtc()
            .add(const Duration(minutes: 30))
            .toIso8601String(),
      ).toJson(),
    );
  }

  Future<void> _handleSyncRealtimeSubscriptions(HttpRequest request) async {
    transportCalls.add('realtime.sync');
    final payload = await _readJsonBody(request);
    final deviceId = payload['deviceId']?.toString() ?? options.deviceId;
    final items = (payload['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map>()
        .map(
          (item) => _RealtimeSubscriptionRecord(
            scopeType: item['scopeType']?.toString() ?? '',
            scopeId: item['scopeId']?.toString() ?? '',
            eventTypes:
                (item['eventTypes'] as List<dynamic>? ?? const <dynamic>[])
                    .map((entry) => entry.toString())
                    .toList(growable: false),
          ),
        )
        .toList(growable: false);
    _subscriptionsByDeviceId[deviceId] = items;

    await _writeJson(
      request.response,
      HttpStatus.ok,
      RealtimeSubscriptionSnapshot(
        deviceId: deviceId,
        items: items
            .map(
              (item) => RealtimeSubscription(
                scopeType: item.scopeType,
                scopeId: item.scopeId,
                eventTypes: item.eventTypes,
                subscribedAt: _nowIso(),
              ),
            )
            .toList(growable: false),
        syncedAt: _nowIso(),
      ).toJson(),
    );

    await _pushPendingRealtimeEventsForDevice(deviceId);
  }

  Future<void> _handleListRealtimeEvents(HttpRequest request) async {
    transportCalls.add('realtime.pull');
    final deviceId =
        request.uri.queryParameters['deviceId'] ?? options.deviceId;
    final afterSeq =
        int.tryParse(request.uri.queryParameters['afterSeq'] ?? '') ?? 0;
    final limit =
        int.tryParse(request.uri.queryParameters['limit'] ?? '') ?? 50;
    final subscriptions = _subscriptionsByDeviceId[deviceId] ??
        const <_RealtimeSubscriptionRecord>[];

    final matchingEvents = _realtimeEvents
        .where(
          (event) =>
              (event.realtimeSeq ?? 0) > afterSeq &&
              _matchesRealtimeSubscription(event, subscriptions),
        )
        .take(limit)
        .toList(growable: false);

    final highestSeq = matchingEvents.fold<int>(
      afterSeq,
      (current, event) => (event.realtimeSeq ?? current) > current
          ? event.realtimeSeq!
          : current,
    );

    await _writeJson(
      request.response,
      HttpStatus.ok,
      RealtimeEventWindow(
        deviceId: deviceId,
        items: matchingEvents,
        nextAfterSeq: highestSeq,
        hasMore: false,
        ackedThroughSeq: _ackedThroughSeq,
        trimmedThroughSeq: 0,
      ).toJson(),
    );
  }

  Future<void> _handleAckRealtimeEvents(HttpRequest request) async {
    transportCalls.add('realtime.ack');
    final payload = await _readJsonBody(request);
    final ackedSeq = payload['ackedSeq'] is int
        ? payload['ackedSeq'] as int
        : int.tryParse(payload['ackedSeq']?.toString() ?? '') ?? 0;
    if (ackedSeq > _ackedThroughSeq) {
      _ackedThroughSeq = ackedSeq;
    }

    await _writeJson(
      request.response,
      HttpStatus.ok,
      RealtimeAckState(
        deviceId: payload['deviceId']?.toString() ?? options.deviceId,
        ackedThroughSeq: _ackedThroughSeq,
        trimmedThroughSeq: 0,
        retainedEventCount: _realtimeEvents.length,
        ackedAt: _nowIso(),
      ).toJson(),
    );
  }

  Future<void> _handleRealtimeWebSocket(HttpRequest request) async {
    transportCalls.add('realtime.ws.connect');
    final socket = await WebSocketTransformer.upgrade(request);
    final deviceId = _lastResumedDeviceId ?? options.deviceId;
    final client = _RealtimeSocketClient(deviceId: deviceId, socket: socket);
    _socketClients.add(client);

    try {
      socket.add(
        jsonEncode(<String, Object?>{
          'type': 'realtime.connected',
          'deviceId': deviceId,
          'connectedAt': _nowIso(),
        }),
      );
      await _pushPendingRealtimeEventsForDevice(deviceId);
      await socket.done;
    } finally {
      _socketClients.remove(client);
    }
  }

  Future<void> _handlePostConversationMessage(
    HttpRequest request,
    String conversationId,
  ) async {
    transportCalls.add('conversation.postMessage');
    await _readJsonBody(request);
    await _writeJson(
      request.response,
      HttpStatus.ok,
      PostMessageResult(
        messageId: 'message-smoke-${_nextMessageSeq}',
        messageSeq: _nextMessageSeq,
        eventId: 'conversation-event-smoke-${_nextMessageSeq++}',
      ).toJson(),
    );
  }

  bool _matchesRealtimeSubscription(
    RealtimeEvent event,
    List<_RealtimeSubscriptionRecord> subscriptions,
  ) {
    for (final subscription in subscriptions) {
      if (subscription.scopeType != (event.scopeType ?? '')) {
        continue;
      }
      if (subscription.scopeId != (event.scopeId ?? '')) {
        continue;
      }
      if (subscription.eventTypes.isEmpty ||
          subscription.eventTypes.contains(event.eventType)) {
        return true;
      }
    }

    return false;
  }

  void _enqueueRtcSignalEvent({
    required String rtcSessionId,
    required String signalType,
    required String schemaRef,
    required Map<String, Object?> payload,
    required String? signalingStreamId,
  }) {
    final signalEvent = RtcSignalEvent(
      rtcSessionId: rtcSessionId,
      conversationId: options.conversationId,
      rtcMode: 'video_call',
      signalType: signalType,
      schemaRef: schemaRef,
      payload: jsonEncode(payload),
      sender: Sender(
        id: 'remote-user-smoke',
        kind: 'user',
        deviceId: 'remote-device-smoke',
      ),
      signalingStreamId: signalingStreamId,
      occurredAt: _nowIso(),
    );

    _realtimeEvents.add(
      RealtimeEvent(
        realtimeSeq: _nextRealtimeSeq++,
        deviceId: options.deviceId,
        scopeType: 'rtc_session',
        scopeId: rtcSessionId,
        eventType: 'rtc.signal',
        deliveryClass: 'realtime',
        payload: jsonEncode(signalEvent.toJson()),
        occurredAt: signalEvent.occurredAt,
      ),
    );

    unawaited(_pushPendingRealtimeEvents());
  }

  Future<void> _pushPendingRealtimeEvents() async {
    for (final client in _socketClients.toList(growable: false)) {
      await _pushPendingRealtimeEventsForDevice(client.deviceId);
    }
  }

  Future<void> _pushPendingRealtimeEventsForDevice(String deviceId) async {
    final matchingClients = _socketClients
        .where((client) => client.deviceId == deviceId)
        .toList(growable: false);
    if (matchingClients.isEmpty) {
      return;
    }

    final subscriptions = _subscriptionsByDeviceId[deviceId] ??
        const <_RealtimeSubscriptionRecord>[];
    if (subscriptions.isEmpty) {
      return;
    }

    final lastPushedSeq = _pushedThroughSeqByDeviceId[deviceId] ?? 0;
    final matchingEvents = _realtimeEvents.where((event) {
      final sequence = event.realtimeSeq ?? 0;
      return sequence > lastPushedSeq &&
          _matchesRealtimeSubscription(event, subscriptions);
    }).toList(growable: false);
    if (matchingEvents.isEmpty) {
      return;
    }

    final highestSeq = matchingEvents.fold<int>(
      lastPushedSeq,
      (current, event) => (event.realtimeSeq ?? current) > current
          ? event.realtimeSeq!
          : current,
    );

    final frame = jsonEncode(<String, Object?>{
      'type': 'event.window',
      'window': RealtimeEventWindow(
        deviceId: deviceId,
        items: matchingEvents,
        nextAfterSeq: highestSeq,
        hasMore: false,
        ackedThroughSeq: _ackedThroughSeq,
        trimmedThroughSeq: 0,
      ).toJson(),
    });

    for (final client in matchingClients) {
      if (client.socket.closeCode != null) {
        continue;
      }
      transportCalls.add('realtime.ws.push');
      client.socket.add(frame);
    }

    _pushedThroughSeqByDeviceId[deviceId] = highestSeq;
  }

  Future<Map<String, Object?>> _readJsonBody(HttpRequest request) async {
    final body = await utf8.decoder.bind(request).join();
    if (body.trim().isEmpty) {
      return <String, Object?>{};
    }

    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    if (decoded is Map) {
      return decoded.map(
        (key, value) => MapEntry(key.toString(), value),
      );
    }

    _fail('Expected a JSON object request body for ${request.uri.path}.');
  }

  Future<void> _writeJson(
    HttpResponse response,
    int statusCode,
    Map<String, Object?> body,
  ) async {
    response.statusCode = statusCode;
    response.headers.contentType = ContentType.json;
    response.write(jsonEncode(body));
    await response.close();
  }

  Future<void> _writeNotFound(HttpRequest request) {
    transportCalls
        .add('unmatched:${request.method.toUpperCase()}:${request.uri.path}');
    return _writeJson(
      request.response,
      HttpStatus.notFound,
      <String, Object?>{
        'error': 'Not found',
        'path': request.uri.path,
      },
    );
  }
}

final class _FakeVolcengineEngine extends RTCEngine {
  _FakeVolcengineEngine(this.runtimeCalls);

  final List<String> runtimeCalls;

  @override
  Future<RTCRoom?> createRTCRoom(
    String roomId, {
    bool autoInitRangeAudio = false,
    bool autoInitSpatialAudio = false,
  }) async {
    runtimeCalls.add('volcengine.createRTCRoom');
    return _FakeVolcengineRoom(roomId, runtimeCalls);
  }

  @override
  Future<int?> startAudioCapture() async {
    runtimeCalls.add('volcengine.startAudioCapture');
    return 0;
  }

  @override
  Future<int?> stopAudioCapture() async {
    runtimeCalls.add('volcengine.stopAudioCapture');
    return 0;
  }

  @override
  Future<int?> startVideoCapture() async {
    runtimeCalls.add('volcengine.startVideoCapture');
    return 0;
  }

  @override
  Future<int?> stopVideoCapture() async {
    runtimeCalls.add('volcengine.stopVideoCapture');
    return 0;
  }

  @override
  void destroy() {
    runtimeCalls.add('volcengine.destroy');
  }
}

final class _FakeVolcengineRoom extends RTCRoom {
  _FakeVolcengineRoom(super.roomId, this.runtimeCalls);

  final List<String> runtimeCalls;

  @override
  Future<int?> joinRoom({
    required string token,
    required UserInfo userInfo,
    required bool userVisibility,
    required volc_pack.RoomConfig roomConfig,
  }) async {
    runtimeCalls.add('volcengine.joinRoom');
    return 0;
  }

  @override
  Future<int?> leaveRoom() async {
    runtimeCalls.add('volcengine.leaveRoom');
    return 0;
  }

  @override
  Future<int?> publishStreamAudio(bool publish) async {
    runtimeCalls.add('volcengine.publishStreamAudio:$publish');
    return 0;
  }

  @override
  Future<int?> publishStreamVideo(bool publish) async {
    runtimeCalls.add('volcengine.publishStreamVideo:$publish');
    return 0;
  }
}

Future<void> _waitForControllerState(
  StandardRtcCallController<RtcVolcengineFlutterNativeClient> controller,
  RtcCallControllerState expectedState,
) async {
  final deadline = DateTime.now().add(const Duration(seconds: 2));
  while (DateTime.now().isBefore(deadline)) {
    if (controller.getSnapshot().controllerState == expectedState) {
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 20));
  }

  throw StateError(
    'Timed out waiting for controller state ${expectedState.name}. '
    'Current state: ${controller.getSnapshot().controllerState.name}',
  );
}

Map<String, Object?> _buildSummary({
  required _RtcCallSmokeOptions options,
  required ImConnectOptions connectOptions,
  required ImLiveConnection? liveConnection,
  required StandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>
      stack,
  required RtcCallControllerSnapshot endedSnapshot,
  required RtcCallControllerState acceptedControllerState,
  required List<String> runtimeCalls,
  required List<String> transportCalls,
  required List<String> eventTypes,
  required List<String> snapshotStates,
}) {
  final selection = stack.dataSource.describeSelection();
  return <String, Object?>{
    'defaultProviderKey': RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
    'selectedProviderKey': selection.providerKey,
    'mediaProviderKey': stack.mediaClient.metadata.providerKey,
    'reuseLiveConnection': options.reuseLiveConnection,
    'acceptedControllerState': acceptedControllerState.name,
    'endedControllerState': endedSnapshot.controllerState.name,
    'endedCallState': endedSnapshot.state.name,
    'closedControllerState':
        stack.callController.getSnapshot().controllerState.name,
    'closedCallState': stack.callController.getSnapshot().state.name,
    'signalingTransport': buildRtcCallSmokeSignalingTransportSummary(
      deviceId: options.deviceId,
      connectOptions: connectOptions,
      liveConnection: liveConnection,
    ),
    'webSocketConnectCount':
        transportCalls.where((call) => call == 'realtime.ws.connect').length,
    'pollingPullCount':
        transportCalls.where((call) => call == 'realtime.pull').length,
    'sessionId': options.sessionId,
    'conversationId': options.conversationId,
    'runtimeCalls': runtimeCalls,
    'transportCalls': transportCalls,
    'eventTypes': eventTypes,
    'snapshotStates': snapshotStates,
  };
}

String _createTextSummary(Map<String, Object?> summary) {
  final runtimeCalls = (summary['runtimeCalls'] as List<Object?>).join(', ');
  final transportCalls =
      (summary['transportCalls'] as List<Object?>).join(', ');
  final eventTypes = (summary['eventTypes'] as List<Object?>).join(', ');
  final signalingTransport =
      summary['signalingTransport'] as Map<String, Object?>;
  return <String>[
    'SDKWork RTC Flutter call smoke',
    'default provider: ${summary['defaultProviderKey']}',
    'selected provider: ${summary['selectedProviderKey']}',
    'media provider: ${summary['mediaProviderKey']}',
    'reuse live connection: ${summary['reuseLiveConnection']}',
    'signaling transport: ${signalingTransport['transportTerm']}',
    'signaling auth mode: ${signalingTransport['authMode']}',
    'signaling device id: ${signalingTransport['deviceId']}',
    'signaling connectOptions.deviceId: '
        '${signalingTransport['connectOptionsDeviceId'] ?? 'n/a'}',
    'signaling shared live connection: '
        '${signalingTransport['usesSharedLiveConnection']}',
    'signaling polling fallback: '
        '${signalingTransport['pollingFallbackTerm']}',
    'accepted controller state: ${summary['acceptedControllerState']}',
    'ended controller state: ${summary['endedControllerState']}',
    'closed controller state: ${summary['closedControllerState']}',
    'websocket connect count: ${summary['webSocketConnectCount']}',
    'polling pull count: ${summary['pollingPullCount']}',
    'runtime calls: $runtimeCalls',
    'transport calls: $transportCalls',
    'event types: $eventTypes',
  ].join('\n');
}

Future<Map<String, Object?>> runRtcCallSmokeScenario(
  _RtcCallSmokeOptions options,
) async {
  final runtimeCalls = <String>[];
  final eventTypes = <String>[];
  final snapshotStates = <String>[];
  final smokeServer = _RtcCallSmokeServer(options);
  await smokeServer.start();

  final imSdk = ImSdkClient.create(
    baseUrl: smokeServer.baseUrl,
  );
  final driverManager = RtcDriverManager(
    registerDefaultDrivers: false,
    drivers: <RtcProviderDriver<dynamic>>[
      createOfficialVolcengineFlutterRtcDriver(
        engineFactory: (_) async {
          runtimeCalls.add('volcengine.createEngine');
          return _FakeVolcengineEngine(runtimeCalls);
        },
      ),
    ],
  );

  StandardRtcCallControllerStack<RtcVolcengineFlutterNativeClient>? stack;
  ImLiveConnection? providedLiveConnection;
  final connectOptions =
      buildRtcCallSmokeConnectOptions(deviceId: options.deviceId);
  try {
    if (options.reuseLiveConnection) {
      providedLiveConnection = await imSdk.connect(
        buildRtcCallSmokeConnectOptions(
          deviceId: options.deviceId,
          conversationId: options.conversationId,
          includeConversationSubscriptions: true,
        ),
      );
    }

    stack = await createStandardRtcCallControllerStack<
        RtcVolcengineFlutterNativeClient>(
      CreateStandardRtcCallControllerStackOptions(
        sdk: imSdk,
        deviceId: options.deviceId,
        liveConnection: providedLiveConnection,
        reconnectInterval: const Duration(milliseconds: 10),
        connectOptions: connectOptions,
        driverManager: driverManager,
        dataSourceOptions: RtcDataSourceOptions(
          nativeConfig: RtcVolcengineFlutterNativeConfig(
            appId: options.appId,
          ),
        ),
      ),
    );

    final stopEventSubscription = stack.callController.onEvent((event) {
      eventTypes.add(event.type.name);
    });
    final stopSnapshotSubscription =
        stack.callController.onSnapshot((snapshot) {
      snapshotStates.add(snapshot.controllerState.name);
    });

    try {
      await stack.callController.startOutgoing(
        RtcCallControllerOutgoingOptions(
          rtcSessionId: options.sessionId,
          conversationId: options.conversationId,
          rtcMode: 'video_call',
          roomId: options.roomId,
          participantId: options.participantId,
          signalingStreamId: options.signalingStreamId,
          autoPublish: const RtcCallAutoPublishOptions(
            audio: true,
            video: true,
          ),
        ),
      );

      await _waitForControllerState(
        stack.callController,
        RtcCallControllerState.connected,
      );
      final acceptedControllerState =
          stack.callController.getSnapshot().controllerState;

      await stack.callController.sendOffer(
        const RtcCallSessionDescriptionPayload(
          sdp: 'offer-sdp-smoke',
        ),
      );
      await stack.callController.sendIceCandidate(
        const RtcCallIceCandidatePayload(
          candidate: 'candidate:1 1 udp 2122260223 10.0.0.2 55000 typ host',
        ),
      );

      final webSocketConnectCount = smokeServer.transportCalls
          .where((call) => call == 'realtime.ws.connect')
          .length;
      if (webSocketConnectCount != 1) {
        _fail(
          'Expected exactly one IM WebSocket connection in the Flutter RTC smoke, '
          'but observed $webSocketConnectCount.',
        );
      }

      final pollingPullCount = smokeServer.transportCalls
          .where((call) => call == 'realtime.pull')
          .length;
      if (pollingPullCount != 0) {
        _fail(
          'Flutter RTC smoke must stay WebSocket-first. '
          'Observed $pollingPullCount realtime pull calls.',
        );
      }

      final endedSnapshot = await stack.callController.end();
      await stack.close();

      return _buildSummary(
        options: options,
        connectOptions: connectOptions,
        liveConnection: providedLiveConnection,
        stack: stack,
        endedSnapshot: endedSnapshot,
        acceptedControllerState: acceptedControllerState,
        runtimeCalls: runtimeCalls,
        transportCalls: smokeServer.transportCalls,
        eventTypes: eventTypes,
        snapshotStates: snapshotStates,
      );
    } finally {
      stopEventSubscription();
      stopSnapshotSubscription();
    }
  } finally {
    if (stack != null) {
      await stack.close();
    }
    if (providedLiveConnection != null) {
      await providedLiveConnection.disconnect();
    }
    await smokeServer.close();
  }
}

Future<int> runRtcCallSmokeCli(
  List<String> argv, {
  IOSink? stdoutSink,
}) async {
  final stdoutWriter = stdoutSink ?? stdout;
  final options = _parseRtcCallSmokeArgs(argv);

  if (options.help) {
    _writeLine(stdoutWriter, getRtcCallSmokeHelpText());
    return 0;
  }

  final summary = await runRtcCallSmokeScenario(options);
  if (options.json) {
    _writeLine(
        stdoutWriter, const JsonEncoder.withIndent('  ').convert(summary));
  } else {
    _writeLine(stdoutWriter, _createTextSummary(summary));
  }

  return 0;
}

Future<void> main(List<String> args) async {
  try {
    final resultCode = await runRtcCallSmokeCli(args);
    if (resultCode != 0) {
      stderr.writeln('[sdkwork-rtc-sdk-flutter] sdk-call-smoke failed.');
    }
    exitCode = resultCode;
  } catch (error) {
    stderr.writeln('[sdkwork-rtc-sdk-flutter] $error');
    exitCode = 1;
  }
}
