import 'package:im_sdk/im_sdk.dart';

import 'rtc_call_session.dart';
import 'rtc_call_types.dart';
import 'rtc_data_source.dart';
import 'rtc_driver_manager.dart';
import 'rtc_im_signaling.dart';
import 'rtc_standard_contract.dart';

final class StandardRtcCallStack<TNativeClient> {
  const StandardRtcCallStack({
    required this.driverManager,
    required this.dataSource,
    required this.mediaClient,
    required this.signaling,
    required this.callSession,
  });

  final RtcDriverManager driverManager;
  final RtcDataSource dataSource;
  final RtcClient<TNativeClient> mediaClient;
  final RtcCallSignalingAdapter signaling;
  final StandardRtcCallSession<TNativeClient> callSession;
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
  final signaling = createImRtcSignalingAdapter(
    CreateImRtcSignalingAdapterOptions(
      sdk: options.sdk,
      deviceId: options.deviceId,
      pollingInterval: options.pollingInterval,
      pullLimit: options.pullLimit,
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
  );
}
