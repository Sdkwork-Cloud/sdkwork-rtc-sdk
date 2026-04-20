import 'dart:async';
import 'dart:convert';

import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_errors.dart';
import 'rtc_im_signaling.dart';

const String rtcCallInviteSignalType = 'sdkwork.rtc.call.invite';
const String rtcCallAcceptedSignalType = 'sdkwork.rtc.call.accepted';
const String rtcCallRejectedSignalType = 'sdkwork.rtc.call.rejected';
const String rtcCallEndedSignalType = 'sdkwork.rtc.call.ended';
const String rtcCallOfferSignalType = 'sdkwork.rtc.call.offer';
const String rtcCallAnswerSignalType = 'sdkwork.rtc.call.answer';
const String rtcCallIceCandidateSignalType = 'sdkwork.rtc.call.ice-candidate';

const String rtcCallInviteSchemaRef = 'urn:sdkwork:rtc:call:invite:v1';
const String rtcCallLifecycleSchemaRef = 'urn:sdkwork:rtc:call:lifecycle:v1';
const String rtcCallSessionDescriptionSchemaRef =
    'urn:sdkwork:rtc:call:session-description:v1';
const String rtcCallIceCandidateSchemaRef =
    'urn:sdkwork:rtc:call:ice-candidate:v1';

enum RtcCallControllerDirection {
  incoming,
  outgoing,
}

enum RtcCallControllerState {
  idle,
  watching,
  incomingRinging,
  outgoingRinging,
  connecting,
  connected,
  rejected,
  ended,
  errored,
}

class RtcCallInvitePayload {
  const RtcCallInvitePayload({
    required this.rtcSessionId,
    required this.conversationId,
    required this.rtcMode,
    this.roomId,
    this.signalingStreamId,
    this.initiatorId,
    this.initiatorDisplayName,
    this.sentAt,
    this.metadata,
  });

  final String rtcSessionId;
  final String conversationId;
  final String rtcMode;
  final String? roomId;
  final String? signalingStreamId;
  final String? initiatorId;
  final String? initiatorDisplayName;
  final String? sentAt;
  final Map<String, Object?>? metadata;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'roomId': roomId,
      'signalingStreamId': signalingStreamId,
      'initiatorId': initiatorId,
      'initiatorDisplayName': initiatorDisplayName,
      'sentAt': sentAt,
      'metadata': metadata,
    };
  }
}

class RtcIncomingCallInvitation extends RtcCallInvitePayload {
  const RtcIncomingCallInvitation({
    required super.rtcSessionId,
    required super.conversationId,
    required super.rtcMode,
    super.roomId,
    super.signalingStreamId,
    super.initiatorId,
    super.initiatorDisplayName,
    super.sentAt,
    super.metadata,
    this.occurredAt,
  });

  final String? occurredAt;
}

class RtcCallLifecyclePayload {
  const RtcCallLifecyclePayload({
    required this.rtcSessionId,
    this.conversationId,
    this.rtcMode,
    this.participantId,
    this.reason,
    this.occurredAt,
    this.metadata,
  });

  final String rtcSessionId;
  final String? conversationId;
  final String? rtcMode;
  final String? participantId;
  final String? reason;
  final String? occurredAt;
  final Map<String, Object?>? metadata;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'rtcSessionId': rtcSessionId,
      'conversationId': conversationId,
      'rtcMode': rtcMode,
      'participantId': participantId,
      'reason': reason,
      'occurredAt': occurredAt,
      'metadata': metadata,
    };
  }
}

class RtcCallSessionDescriptionPayload {
  const RtcCallSessionDescriptionPayload({
    required this.sdp,
  });

  final String sdp;

  Map<String, Object?> toJson() => <String, Object?>{'sdp': sdp};
}

class RtcCallIceCandidatePayload {
  const RtcCallIceCandidatePayload({
    required this.candidate,
    this.sdpMid,
    this.sdpMLineIndex,
  });

  final String candidate;
  final String? sdpMid;
  final int? sdpMLineIndex;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'candidate': candidate,
      'sdpMid': sdpMid,
      'sdpMLineIndex': sdpMLineIndex,
    };
  }
}

class RtcCallControllerSnapshot extends RtcCallSessionSnapshot {
  const RtcCallControllerSnapshot({
    super.rtcSessionId,
    super.conversationId,
    super.rtcMode,
    super.roomId,
    super.participantId,
    super.providerKey,
    super.signalingStreamId,
    super.providerPluginId,
    super.providerSessionId,
    super.accessEndpoint,
    super.providerRegion,
    super.startedAt,
    super.endedAt,
    required super.state,
    super.mediaConnectionState,
    required this.controllerState,
    required this.watchedConversationIds,
    this.direction,
    this.activeInvitation,
    this.lastSignal,
    this.lastError,
  });

  final RtcCallControllerState controllerState;
  final List<String> watchedConversationIds;
  final RtcCallControllerDirection? direction;
  final RtcIncomingCallInvitation? activeInvitation;
  final RtcCallSignal? lastSignal;
  final Object? lastError;
}

enum RtcCallControllerEventType {
  snapshot,
  incomingInvitation,
  signal,
  error,
}

class RtcCallControllerEvent {
  const RtcCallControllerEvent({
    required this.type,
    required this.snapshot,
    this.invitation,
    this.signal,
    this.error,
  });

  final RtcCallControllerEventType type;
  final RtcCallControllerSnapshot snapshot;
  final RtcIncomingCallInvitation? invitation;
  final RtcCallSignal? signal;
  final Object? error;
}

typedef RtcCallControllerEventHandler = void Function(
  RtcCallControllerEvent event,
);
typedef RtcCallControllerSnapshotHandler = void Function(
  RtcCallControllerSnapshot snapshot,
);

class RtcCallControllerOutgoingOptions extends RtcOutgoingCallOptions {
  const RtcCallControllerOutgoingOptions({
    required super.rtcSessionId,
    required super.conversationId,
    required super.rtcMode,
    super.roomId,
    required super.participantId,
    super.signalingStreamId,
    super.subscribeSignals = false,
    super.autoPublish = const RtcCallAutoPublishOptions(),
    this.invitationText,
    this.initiatorDisplayName,
    this.invitationMetadata,
  });

  final String? invitationText;
  final String? initiatorDisplayName;
  final Map<String, Object?>? invitationMetadata;
}

class RtcCallControllerAcceptOptions extends RtcIncomingCallAcceptOptions {
  const RtcCallControllerAcceptOptions({
    required super.rtcSessionId,
    super.conversationId,
    super.rtcMode,
    super.roomId,
    required super.participantId,
    super.subscribeSignals = false,
    super.autoPublish = const RtcCallAutoPublishOptions(),
    this.metadata,
  });

  final Map<String, Object?>? metadata;
}

class RtcCallControllerRejectOptions extends RtcIncomingCallRejectOptions {
  const RtcCallControllerRejectOptions({
    required super.rtcSessionId,
    this.reason,
    this.metadata,
  });

  final String? reason;
  final Map<String, Object?>? metadata;
}

class RtcCallControllerEndOptions {
  const RtcCallControllerEndOptions({
    this.reason,
    this.metadata,
  });

  final String? reason;
  final Map<String, Object?>? metadata;
}

class CreateStandardRtcCallControllerOptions<TNativeClient> {
  const CreateStandardRtcCallControllerOptions({
    required this.sdk,
    required this.callSession,
    required this.deviceId,
    this.pollingInterval = const Duration(seconds: 1),
    this.pullLimit = 50,
    this.watchConversationIds = const <String>[],
    this.signaling,
    this.realtimeDispatcher,
  });

  final ImSdkClient sdk;
  final StandardRtcCallSession<TNativeClient> callSession;
  final String deviceId;
  final Duration pollingInterval;
  final int pullLimit;
  final List<String> watchConversationIds;
  final RtcCallSignalingAdapter? signaling;
  final RtcImRealtimeDispatcher? realtimeDispatcher;
}

class StandardRtcCallController<TNativeClient> {
  factory StandardRtcCallController(
    CreateStandardRtcCallControllerOptions<TNativeClient> options,
  ) {
    final realtimeDispatcher = options.realtimeDispatcher ??
        RtcImRealtimeDispatcher(
          CreateImRtcSignalingAdapterOptions(
            sdk: options.sdk,
            deviceId: options.deviceId,
            pollingInterval: options.pollingInterval,
            pullLimit: options.pullLimit,
          ),
        );
    final signaling = options.signaling ??
        createImRtcSignalingAdapter(
          CreateImRtcSignalingAdapterOptions(
            sdk: options.sdk,
            deviceId: options.deviceId,
            pollingInterval: options.pollingInterval,
            pullLimit: options.pullLimit,
            realtimeDispatcher: realtimeDispatcher,
          ),
        );

    return StandardRtcCallController._(
      sdk: options.sdk,
      callSession: options.callSession,
      signaling: signaling,
      realtimeDispatcher: realtimeDispatcher,
      watchConversationIds: options.watchConversationIds,
    );
  }

  StandardRtcCallController._({
    required ImSdkClient sdk,
    required StandardRtcCallSession<TNativeClient> callSession,
    required RtcCallSignalingAdapter signaling,
    required RtcImRealtimeDispatcher realtimeDispatcher,
    required List<String> watchConversationIds,
  })   : _sdk = sdk,
        _callSession = callSession,
        _signaling = signaling,
        _realtimeDispatcher = realtimeDispatcher {
    _watchedConversationIds.addAll(watchConversationIds);
  }

  final ImSdkClient _sdk;
  final StandardRtcCallSession<TNativeClient> _callSession;
  final RtcCallSignalingAdapter _signaling;
  final RtcImRealtimeDispatcher _realtimeDispatcher;
  final Set<RtcCallControllerEventHandler> _eventHandlers =
      <RtcCallControllerEventHandler>{};
  final Set<RtcCallControllerSnapshotHandler> _snapshotHandlers =
      <RtcCallControllerSnapshotHandler>{};
  final Set<String> _watchedConversationIds = <String>{};
  final Map<String, RtcCallSignalSubscription> _conversationSubscriptions =
      <String, RtcCallSignalSubscription>{};

  RtcCallControllerState _controllerState = RtcCallControllerState.idle;
  RtcCallControllerDirection? _direction;
  RtcIncomingCallInvitation? _activeInvitation;
  RtcCallSignal? _lastSignal;
  Object? _lastError;
  String? _activeSessionId;
  RtcCallSignalSubscription? _activeSessionSubscription;

  RtcCallControllerSnapshot getSnapshot() => _createSnapshot();

  void Function() onEvent(RtcCallControllerEventHandler handler) {
    _eventHandlers.add(handler);
    return () {
      _eventHandlers.remove(handler);
    };
  }

  void Function() onSnapshot(RtcCallControllerSnapshotHandler handler) {
    _snapshotHandlers.add(handler);
    return () {
      _snapshotHandlers.remove(handler);
    };
  }

  Future<RtcCallControllerSnapshot> replaceWatchedConversations(
    List<String> conversationIds,
  ) async {
    final nextIds = conversationIds.toSet();
    final removedIds = _watchedConversationIds.difference(nextIds);
    final addedIds = nextIds.difference(_watchedConversationIds);

    for (final conversationId in removedIds) {
      _conversationSubscriptions.remove(conversationId)?.unsubscribe();
      _watchedConversationIds.remove(conversationId);
    }

    for (final conversationId in addedIds) {
      _conversationSubscriptions[conversationId] =
          await _realtimeDispatcher.subscribeConversationSignals(
        conversationId,
        (signal) {
          unawaited(_handleConversationSignal(signal));
        },
      );
      _watchedConversationIds.add(conversationId);
    }

    if (_watchedConversationIds.isEmpty && _activeSessionId == null) {
      _controllerState = RtcCallControllerState.idle;
    } else if (_activeSessionId == null) {
      _controllerState = RtcCallControllerState.watching;
    }

    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> startOutgoing(
    RtcCallControllerOutgoingOptions options,
  ) async {
    _ensureNoConflictingActiveCall(options.rtcSessionId);

    final sessionSnapshot = await _callSession.startOutgoing(
      RtcOutgoingCallOptions(
        rtcSessionId: options.rtcSessionId,
        conversationId: options.conversationId,
        rtcMode: options.rtcMode,
        roomId: options.roomId,
        participantId: options.participantId,
        signalingStreamId: options.signalingStreamId,
        subscribeSignals: false,
        autoPublish: options.autoPublish,
      ),
    );

    await _subscribeToSessionSignals(options.rtcSessionId);

    await _publishConversationSignal(
      conversationId: options.conversationId!,
      signalType: rtcCallInviteSignalType,
      schemaRef: rtcCallInviteSchemaRef,
      text: options.invitationText ?? 'RTC call invite',
      payload: RtcCallInvitePayload(
        rtcSessionId: options.rtcSessionId,
        conversationId: options.conversationId!,
        rtcMode: options.rtcMode,
        roomId: sessionSnapshot.roomId ?? options.roomId ?? options.rtcSessionId,
        signalingStreamId:
            sessionSnapshot.signalingStreamId ?? options.signalingStreamId,
        initiatorId: options.participantId,
        initiatorDisplayName: options.initiatorDisplayName,
        sentAt: DateTime.now().toUtc().toIso8601String(),
        metadata: options.invitationMetadata,
      ).toJson(),
    );

    _direction = RtcCallControllerDirection.outgoing;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.outgoingRinging;
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> acceptIncoming(
    RtcCallControllerAcceptOptions options,
  ) async {
    _ensureNoConflictingActiveCall(options.rtcSessionId);
    await _subscribeToSessionSignals(options.rtcSessionId);
    _controllerState = RtcCallControllerState.connecting;
    _emitSnapshot();

    await _callSession.acceptIncoming(
      RtcIncomingCallAcceptOptions(
        rtcSessionId: options.rtcSessionId,
        conversationId: options.conversationId ?? _activeInvitation?.conversationId,
        rtcMode: options.rtcMode ?? _activeInvitation?.rtcMode,
        roomId: options.roomId ?? _activeInvitation?.roomId,
        participantId: options.participantId,
        subscribeSignals: false,
        autoPublish: options.autoPublish,
      ),
    );

    await _signaling.sendSignal(
      options.rtcSessionId,
      rtcCallAcceptedSignalType,
      RtcCallLifecyclePayload(
        rtcSessionId: options.rtcSessionId,
        conversationId: _callSession.getSnapshot().conversationId,
        rtcMode: _callSession.getSnapshot().rtcMode,
        participantId: options.participantId,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
        metadata: options.metadata,
      ).toJson(),
      options: RtcCallSignalSendOptions(
        signalingStreamId: _callSession.getSnapshot().signalingStreamId ??
            _activeInvitation?.signalingStreamId,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.connected;
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> rejectIncoming(
    RtcCallControllerRejectOptions options,
  ) async {
    await _signaling.sendSignal(
      options.rtcSessionId,
      rtcCallRejectedSignalType,
      RtcCallLifecyclePayload(
        rtcSessionId: options.rtcSessionId,
        conversationId: _activeInvitation?.conversationId,
        rtcMode: _activeInvitation?.rtcMode,
        reason: options.reason,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
        metadata: options.metadata,
      ).toJson(),
      options: RtcCallSignalSendOptions(
        signalingStreamId: _activeInvitation?.signalingStreamId,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    await _callSession.rejectIncoming(options);
    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.rejected;
    _clearActiveSessionSubscription();
    return _emitSnapshot();
  }

  Future<RtcCallControllerSnapshot> end([
    RtcCallControllerEndOptions options = const RtcCallControllerEndOptions(),
  ]) async {
    final sessionSnapshot = _callSession.getSnapshot();
    final rtcSessionId = sessionSnapshot.rtcSessionId ?? _activeInvitation?.rtcSessionId;
    if (rtcSessionId == null || rtcSessionId.isEmpty) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session to end.',
      );
    }

    await _signaling.sendSignal(
      rtcSessionId,
      rtcCallEndedSignalType,
      RtcCallLifecyclePayload(
        rtcSessionId: rtcSessionId,
        conversationId:
            sessionSnapshot.conversationId ?? _activeInvitation?.conversationId,
        rtcMode: sessionSnapshot.rtcMode ?? _activeInvitation?.rtcMode,
        participantId: sessionSnapshot.participantId,
        reason: options.reason,
        occurredAt: DateTime.now().toUtc().toIso8601String(),
        metadata: options.metadata,
      ).toJson(),
      options: RtcCallSignalSendOptions(
        signalingStreamId:
            sessionSnapshot.signalingStreamId ?? _activeInvitation?.signalingStreamId,
        schemaRef: rtcCallLifecycleSchemaRef,
      ),
    );

    await _callSession.end();
    _activeInvitation = null;
    _controllerState = RtcCallControllerState.ended;
    _clearActiveSessionSubscription();
    return _emitSnapshot();
  }

  Future<RtcCallSignal> sendSignal(String signalType, Object? payload) async {
    final signal = await _callSession.sendSignal(signalType, payload);
    _lastSignal = signal;
    _emitSignal(signal);
    return signal;
  }

  Future<RtcCallSignal> sendOffer(
    RtcCallSessionDescriptionPayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallOfferSignalType,
      payload.toJson(),
      rtcCallSessionDescriptionSchemaRef,
    );
  }

  Future<RtcCallSignal> sendAnswer(
    RtcCallSessionDescriptionPayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallAnswerSignalType,
      payload.toJson(),
      rtcCallSessionDescriptionSchemaRef,
    );
  }

  Future<RtcCallSignal> sendIceCandidate(
    RtcCallIceCandidatePayload payload,
  ) {
    return _sendTypedSignal(
      rtcCallIceCandidateSignalType,
      payload.toJson(),
      rtcCallIceCandidateSchemaRef,
    );
  }

  Future<void> dispose() async {
    _clearActiveSessionSubscription();
    for (final subscription in _conversationSubscriptions.values) {
      subscription.unsubscribe();
    }
    _conversationSubscriptions.clear();
    _watchedConversationIds.clear();
    _activeInvitation = null;
    _direction = null;
    _controllerState = RtcCallControllerState.idle;
    _emitSnapshot();
  }

  Future<void> _subscribeToSessionSignals(String rtcSessionId) async {
    if (_activeSessionId == rtcSessionId && _activeSessionSubscription != null) {
      return;
    }

    _clearActiveSessionSubscription();
    _activeSessionId = rtcSessionId;
    _activeSessionSubscription =
        await _realtimeDispatcher.subscribeRtcSessionSignals(
      rtcSessionId,
      (signal) {
        unawaited(_handleSessionSignal(signal));
      },
    );
  }

  Future<void> _handleSessionSignal(RtcCallSignal signal) async {
    _lastSignal = signal;

    if (signal.signalType == rtcCallAcceptedSignalType) {
      _controllerState = RtcCallControllerState.connected;
      _direction ??= RtcCallControllerDirection.outgoing;
    } else if (signal.signalType == rtcCallRejectedSignalType ||
        signal.signalType == rtcCallEndedSignalType) {
      await _callSession.leaveMedia();
      _callSession.reconcileSessionRecord(
        RtcCallSessionRecord(
          rtcSessionId: signal.rtcSessionId,
          conversationId: signal.conversationId,
          rtcMode: signal.rtcMode,
          state: signal.signalType == rtcCallRejectedSignalType
              ? RtcCallState.rejected
              : RtcCallState.ended,
          signalingStreamId: signal.signalingStreamId,
          endedAt: signal.occurredAt,
        ),
      );
      _controllerState = signal.signalType == rtcCallRejectedSignalType
          ? RtcCallControllerState.rejected
          : RtcCallControllerState.ended;
      _activeInvitation = null;
      _clearActiveSessionSubscription();
    }

    _emitSignal(signal);
  }

  Future<void> _handleConversationSignal(
    RtcImConversationSignalMessage signal,
  ) async {
    final invitation = _toIncomingCallInvitation(signal);
    if (invitation == null) {
      return;
    }

    _ensureNoConflictingActiveCall(invitation.rtcSessionId);
    await _subscribeToSessionSignals(invitation.rtcSessionId);
    _direction = RtcCallControllerDirection.incoming;
    _activeInvitation = invitation;
    _controllerState = RtcCallControllerState.incomingRinging;
    _emitEvent(
      RtcCallControllerEvent(
        type: RtcCallControllerEventType.incomingInvitation,
        invitation: invitation,
        snapshot: _createSnapshot(),
      ),
    );
    _emitSnapshot();
  }

  void _ensureNoConflictingActiveCall(String nextRtcSessionId) {
    final sessionSnapshot = _callSession.getSnapshot();
    final currentRtcSessionId =
        sessionSnapshot.rtcSessionId ?? _activeInvitation?.rtcSessionId;
    final hasActiveCall = currentRtcSessionId != null &&
        _controllerState != RtcCallControllerState.idle &&
        _controllerState != RtcCallControllerState.watching &&
        _controllerState != RtcCallControllerState.rejected &&
        _controllerState != RtcCallControllerState.ended;

    if (hasActiveCall && currentRtcSessionId != nextRtcSessionId) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller already has an active session.',
        details: <String, Object?>{
          'currentRtcSessionId': currentRtcSessionId,
          'nextRtcSessionId': nextRtcSessionId,
        },
      );
    }
  }

  void _clearActiveSessionSubscription() {
    _activeSessionSubscription?.unsubscribe();
    _activeSessionSubscription = null;
    _activeSessionId = null;
  }

  RtcCallControllerSnapshot _createSnapshot() {
    final sessionSnapshot = _callSession.getSnapshot();
    return RtcCallControllerSnapshot(
      rtcSessionId: sessionSnapshot.rtcSessionId ?? _activeInvitation?.rtcSessionId,
      conversationId:
          sessionSnapshot.conversationId ?? _activeInvitation?.conversationId,
      rtcMode: sessionSnapshot.rtcMode ?? _activeInvitation?.rtcMode,
      roomId: sessionSnapshot.roomId ?? _activeInvitation?.roomId,
      participantId: sessionSnapshot.participantId,
      providerKey: sessionSnapshot.providerKey,
      signalingStreamId:
          sessionSnapshot.signalingStreamId ?? _activeInvitation?.signalingStreamId,
      providerPluginId: sessionSnapshot.providerPluginId,
      providerSessionId: sessionSnapshot.providerSessionId,
      accessEndpoint: sessionSnapshot.accessEndpoint,
      providerRegion: sessionSnapshot.providerRegion,
      startedAt: sessionSnapshot.startedAt,
      endedAt: sessionSnapshot.endedAt,
      state: sessionSnapshot.state,
      mediaConnectionState: sessionSnapshot.mediaConnectionState,
      controllerState: _controllerState,
      direction: _direction,
      watchedConversationIds: _watchedConversationIds.toList(growable: false),
      activeInvitation: _activeInvitation,
      lastSignal: _lastSignal,
      lastError: _lastError,
    );
  }

  RtcCallControllerSnapshot _emitSnapshot() {
    final snapshot = _createSnapshot();
    for (final handler in _snapshotHandlers.toList(growable: false)) {
      handler(snapshot);
    }
    _emitEvent(
      RtcCallControllerEvent(
        type: RtcCallControllerEventType.snapshot,
        snapshot: snapshot,
      ),
    );
    return snapshot;
  }

  void _emitSignal(RtcCallSignal signal) {
    _emitEvent(
      RtcCallControllerEvent(
        type: RtcCallControllerEventType.signal,
        signal: signal,
        snapshot: _createSnapshot(),
      ),
    );
  }

  void _emitEvent(RtcCallControllerEvent event) {
    for (final handler in _eventHandlers.toList(growable: false)) {
      try {
        handler(event);
      } catch (error) {
        _lastError = error;
      }
    }
  }

  Future<void> _publishConversationSignal({
    required String conversationId,
    required String signalType,
    required String schemaRef,
    required String text,
    required Map<String, Object?> payload,
  }) async {
    await _sdk.conversations.postMessage(
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

  Future<RtcCallSignal> _sendTypedSignal(
    String signalType,
    Object payload,
    String schemaRef,
  ) async {
    final sessionSnapshot = _callSession.getSnapshot();
    final rtcSessionId = sessionSnapshot.rtcSessionId;
    if (rtcSessionId == null || rtcSessionId.isEmpty) {
      throw RtcSdkException(
        code: 'call_state_invalid',
        message: 'RTC call controller has no active session for signaling.',
      );
    }

    final signal = await _signaling.sendSignal(
      rtcSessionId,
      signalType,
      payload,
      options: RtcCallSignalSendOptions(
        signalingStreamId: sessionSnapshot.signalingStreamId,
        schemaRef: schemaRef,
      ),
    );
    _lastSignal = signal;
    _emitSignal(signal);
    return signal;
  }
}

Future<StandardRtcCallController<TNativeClient>>
    createStandardRtcCallController<TNativeClient>(
  CreateStandardRtcCallControllerOptions<TNativeClient> options,
) async {
  final controller = StandardRtcCallController<TNativeClient>(options);
  await controller.replaceWatchedConversations(options.watchConversationIds);
  return controller;
}

RtcIncomingCallInvitation? _toIncomingCallInvitation(
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
