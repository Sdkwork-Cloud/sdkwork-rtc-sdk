import 'rtc_driver_manager.dart';
import 'rtc_provider_catalog.dart';
import 'rtc_provider_selection.dart';
import 'rtc_provider_support.dart';

final class RtcDataSourceOptions {
  const RtcDataSourceOptions({
    this.providerUrl,
    this.providerKey,
    this.tenantOverrideProviderKey,
    this.deploymentProfileProviderKey,
    this.defaultProviderKey = RtcProviderCatalog.DEFAULT_RTC_PROVIDER_KEY,
  });

  final String? providerUrl;
  final String? providerKey;
  final String? tenantOverrideProviderKey;
  final String? deploymentProfileProviderKey;
  final String defaultProviderKey;
}

RtcDataSourceOptions _mergeOptions(
  RtcDataSourceOptions base,
  RtcDataSourceOptions? overrides,
) {
  if (overrides == null) {
    return base;
  }

  return RtcDataSourceOptions(
    providerUrl: overrides.providerUrl ?? base.providerUrl,
    providerKey: overrides.providerKey ?? base.providerKey,
    tenantOverrideProviderKey:
        overrides.tenantOverrideProviderKey ?? base.tenantOverrideProviderKey,
    deploymentProfileProviderKey:
        overrides.deploymentProfileProviderKey ?? base.deploymentProfileProviderKey,
    defaultProviderKey: overrides.defaultProviderKey,
  );
}

final class RtcDataSource {
  const RtcDataSource({
    this.options = const RtcDataSourceOptions(),
    this.driverManager = const RtcDriverManager(),
  });

  final RtcDataSourceOptions options;
  final RtcDriverManager driverManager;

  RtcProviderSelection describeSelection([RtcDataSourceOptions? overrides]) {
    final merged = _mergeOptions(options, overrides);
    return driverManager.resolveSelection(
      RtcProviderSelectionRequest(
        providerUrl: merged.providerUrl,
        providerKey: merged.providerKey,
        tenantOverrideProviderKey: merged.tenantOverrideProviderKey,
        deploymentProfileProviderKey: merged.deploymentProfileProviderKey,
      ),
      defaultProviderKey: merged.defaultProviderKey,
    );
  }

  RtcProviderSupport describeProviderSupport([RtcDataSourceOptions? overrides]) {
    final selection = describeSelection(overrides);
    return driverManager.describeProviderSupport(selection.providerKey);
  }

  List<RtcProviderSupport> listProviderSupport() {
    return driverManager.listProviderSupport();
  }
}
