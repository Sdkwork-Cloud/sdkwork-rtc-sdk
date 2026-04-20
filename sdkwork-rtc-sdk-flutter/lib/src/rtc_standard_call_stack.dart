import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_call_controller.dart';
import 'rtc_data_source.dart';
import 'rtc_driver_manager.dart';
import 'rtc_im_signaling.dart';
import 'rtc_standard_contract.dart';

final class StandardRtcCallStack<TNativeClient> implements RtcCloseable {
  const StandardRtcCallStack({
    required this.driverManager,
    required this.dataSource,
    required this.mediaClient,
    required this.signaling,
    required this.callSession,
    required this.realtimeDispatcher,
  });

  final RtcDriverManager driverManager;
  final RtcDataSource dataSource;
  final RtcClient<TNativeClient> mediaClient;
  final RtcCallSignalingAdapter signaling;
  final StandardRtcCallSession<TNativeClient> callSession;
  final RtcImRealtimeDispatcher realtimeDispatcher;

  @override
  Future<void> close() async {
    await callSession.close();
  }
}

final class CreateStandardRtcCallStackOptions {
  const CreateStandardRtcCallStackOptions({
    required this.sdk,
    required this.deviceId,
    this.pollingInterval = const Duration(seconds: 1),
    this.pullLimit = 50,
    this.dataSourceOptions = const RtcDataSourceOptions(),
    this.driverManager,
  });

  final ImSdkClient sdk;
  final String deviceId;
  final Duration pollingInterval;
  final int pullLimit;
  final RtcDataSourceOptions dataSourceOptions;
  final RtcDriverManager? driverManager;
}

final class StandardRtcCallControllerStack<TNativeClient>
    implements RtcCloseable {
  const StandardRtcCallControllerStack({
    required this.driverManager,
    required this.dataSource,
    required this.mediaClient,
    required this.signaling,
    required this.callSession,
    required this.realtimeDispatcher,
    required this.callController,
  });

  final RtcDriverManager driverManager;
  final RtcDataSource dataSource;
  final RtcClient<TNativeClient> mediaClient;
  final RtcCallSignalingAdapter signaling;
  final StandardRtcCallSession<TNativeClient> callSession;
  final RtcImRealtimeDispatcher realtimeDispatcher;
  final StandardRtcCallController<TNativeClient> callController;

  @override
  Future<void> close() async {
    await callController.close();
  }
}

final class CreateStandardRtcCallControllerStackOptions {
  const CreateStandardRtcCallControllerStackOptions({
    required this.sdk,
    required this.deviceId,
    this.pollingInterval = const Duration(seconds: 1),
    this.pullLimit = 50,
    this.watchConversationIds = const <String>[],
    this.dataSourceOptions = const RtcDataSourceOptions(),
    this.driverManager,
  });

  final ImSdkClient sdk;
  final String deviceId;
  final Duration pollingInterval;
  final int pullLimit;
  final List<String> watchConversationIds;
  final RtcDataSourceOptions dataSourceOptions;
  final RtcDriverManager? driverManager;
}

Future<StandardRtcCallStack<TNativeClient>>
createStandardRtcCallStack<TNativeClient>(
  CreateStandardRtcCallStackOptions options,
) async {
  final driverManager = options.driverManager ?? RtcDriverManager();
  final dataSource = RtcDataSource(
    options: options.dataSourceOptions,
    driverManager: driverManager,
  );
  final mediaClient = await dataSource.createClient<TNativeClient>();
  final realtimeDispatcher = RtcImRealtimeDispatcher(
    CreateImRtcSignalingAdapterOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      pollingInterval: options.pollingInterval,
      pullLimit: options.pullLimit,
    ),
  );
  final signaling = createImRtcSignalingAdapter(
    CreateImRtcSignalingAdapterOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      pollingInterval: options.pollingInterval,
      pullLimit: options.pullLimit,
      realtimeDispatcher: realtimeDispatcher,
    ),
  );
  final callSession = StandardRtcCallSession<TNativeClient>(
    mediaClient: mediaClient,
    signaling: signaling,
  );

  return StandardRtcCallStack<TNativeClient>(
    driverManager: driverManager,
    dataSource: dataSource,
    mediaClient: mediaClient,
    signaling: signaling,
    callSession: callSession,
    realtimeDispatcher: realtimeDispatcher,
  );
}

Future<StandardRtcCallControllerStack<TNativeClient>>
createStandardRtcCallControllerStack<TNativeClient>(
  CreateStandardRtcCallControllerStackOptions options,
) async {
  final rtcStack =
      await createStandardRtcCallStack<TNativeClient>(
    CreateStandardRtcCallStackOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      pollingInterval: options.pollingInterval,
      pullLimit: options.pullLimit,
      dataSourceOptions: options.dataSourceOptions,
      driverManager: options.driverManager,
    ),
  );

  final callController = await createStandardRtcCallController<TNativeClient>(
    CreateStandardRtcCallControllerOptions<TNativeClient>(
      sdk: options.sdk,
      callSession: rtcStack.callSession,
      deviceId: options.deviceId,
      pollingInterval: options.pollingInterval,
      pullLimit: options.pullLimit,
      watchConversationIds: options.watchConversationIds,
      signaling: rtcStack.signaling,
      realtimeDispatcher: rtcStack.realtimeDispatcher,
    ),
  );

  return StandardRtcCallControllerStack<TNativeClient>(
    driverManager: rtcStack.driverManager,
    dataSource: rtcStack.dataSource,
    mediaClient: rtcStack.mediaClient,
    signaling: rtcStack.signaling,
    callSession: rtcStack.callSession,
    realtimeDispatcher: rtcStack.realtimeDispatcher,
    callController: callController,
  );
}
