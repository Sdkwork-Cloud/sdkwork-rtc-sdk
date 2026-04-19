#[derive(Clone, Copy)]
#[allow(non_snake_case)]
pub struct RtcCapabilityCatalogEntry {
    pub capabilityKey: &'static str,
    pub category: &'static str,
    pub surface: &'static str,
}

pub struct RtcCapabilityCatalog;

pub const RTC_CAPABILITY_CATALOG: [RtcCapabilityCatalogEntry; 17] = [
    RtcCapabilityCatalogEntry { capabilityKey: "session", category: "required-baseline", surface: "cross-surface" },
    RtcCapabilityCatalogEntry { capabilityKey: "join", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "publish", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "subscribe", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "mute", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "basic-events", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "health", category: "required-baseline", surface: "control-plane" },
    RtcCapabilityCatalogEntry { capabilityKey: "unwrap", category: "required-baseline", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "screen-share", category: "optional-advanced", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "recording", category: "optional-advanced", surface: "control-plane" },
    RtcCapabilityCatalogEntry { capabilityKey: "cloud-mix", category: "optional-advanced", surface: "control-plane" },
    RtcCapabilityCatalogEntry { capabilityKey: "cdn-relay", category: "optional-advanced", surface: "control-plane" },
    RtcCapabilityCatalogEntry { capabilityKey: "data-channel", category: "optional-advanced", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "transcription", category: "optional-advanced", surface: "control-plane" },
    RtcCapabilityCatalogEntry { capabilityKey: "beauty", category: "optional-advanced", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "spatial-audio", category: "optional-advanced", surface: "runtime-bridge" },
    RtcCapabilityCatalogEntry { capabilityKey: "e2ee", category: "optional-advanced", surface: "runtime-bridge" },
];

pub fn get_rtc_capability_catalog() -> &'static [RtcCapabilityCatalogEntry] {
    &RTC_CAPABILITY_CATALOG
}

pub fn get_rtc_capability_descriptor(
    capability_key: &str,
) -> Option<&'static RtcCapabilityCatalogEntry> {
    RTC_CAPABILITY_CATALOG
        .iter()
        .find(|entry| entry.capabilityKey == capability_key)
}
