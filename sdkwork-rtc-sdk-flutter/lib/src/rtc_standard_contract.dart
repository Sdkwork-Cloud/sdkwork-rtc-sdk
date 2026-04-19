abstract interface class RtcProviderDriver<TNativeClient> {
  String get providerKey;
  Future<RtcClient<TNativeClient>> createClient();
}

abstract interface class RtcDriverManager<TNativeClient> {
  RtcProviderDriver<TNativeClient> resolveDriver(String providerKey);
}

abstract interface class RtcDataSource<TNativeClient> {
  Future<RtcClient<TNativeClient>> createClient();
}

abstract interface class RtcClient<TNativeClient> {
  Future<void> join();
  Future<void> leave();
  Future<void> publish(String trackId);
  Future<void> unpublish(String trackId);
  Future<void> muteAudio(bool muted);
  Future<void> muteVideo(bool muted);
  TNativeClient? unwrap();
}

abstract interface class RtcRuntimeController<TNativeClient> {
  Future<void> join();
  Future<void> leave();
  Future<void> publish(String trackId);
  Future<void> unpublish(String trackId);
  Future<void> muteAudio(bool muted);
  Future<void> muteVideo(bool muted);
}

final class RtcStandardContract {
  static const String symbol = 'RtcStandardContract';

  const RtcStandardContract._();
}
