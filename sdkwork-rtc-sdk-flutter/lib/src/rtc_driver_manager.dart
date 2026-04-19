import 'rtc_provider_activation_catalog.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';

final class RtcDriverManager {
  const RtcDriverManager();

  RtcProviderSelection resolveSelection(
    RtcProviderSelectionRequest request, {
    String defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
  }) {
    return resolveRtcProviderSelection(
      request,
      defaultProviderKey: defaultProviderKey,
    );
  }

  RtcProviderSupport describeProviderSupport(String providerKey) {
    final official = getRtcProviderByProviderKey(providerKey) != null;
    final activation = getRtcProviderActivationByProviderKey(providerKey);

    return createRtcProviderSupportState(
      RtcProviderSupportStateRequest(
        providerKey: providerKey,
        builtin: activation?.builtin ?? false,
        official: official,
        registered: activation?.runtimeBridge ?? false,
      ),
    );
  }

  List<RtcProviderSupport> listProviderSupport() {
    return RtcProviderCatalog.entries
        .map((entry) => describeProviderSupport(entry.providerKey))
        .toList(growable: false);
  }
}
