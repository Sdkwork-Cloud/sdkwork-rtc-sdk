package rtcstandard

type RtcCapabilityCatalogEntry struct {
    CapabilityKey string
    Category      string
    Surface       string
}

type RtcCapabilityCatalog struct{}

var RTC_CAPABILITY_CATALOG = []RtcCapabilityCatalogEntry{
    {CapabilityKey: "session", Category: "required-baseline", Surface: "cross-surface"},
    {CapabilityKey: "join", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "publish", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "subscribe", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "mute", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "basic-events", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "health", Category: "required-baseline", Surface: "control-plane"},
    {CapabilityKey: "unwrap", Category: "required-baseline", Surface: "runtime-bridge"},
    {CapabilityKey: "screen-share", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "recording", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "cloud-mix", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "cdn-relay", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "data-channel", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "transcription", Category: "optional-advanced", Surface: "control-plane"},
    {CapabilityKey: "beauty", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "spatial-audio", Category: "optional-advanced", Surface: "runtime-bridge"},
    {CapabilityKey: "e2ee", Category: "optional-advanced", Surface: "runtime-bridge"},
}

func GetRtcCapabilityCatalog() []RtcCapabilityCatalogEntry {
    return append([]RtcCapabilityCatalogEntry(nil), RTC_CAPABILITY_CATALOG...)
}

func GetRtcCapabilityDescriptor(capabilityKey string) *RtcCapabilityCatalogEntry {
    for index := range RTC_CAPABILITY_CATALOG {
        if RTC_CAPABILITY_CATALOG[index].CapabilityKey == capabilityKey {
            return &RTC_CAPABILITY_CATALOG[index]
        }
    }

    return nil
}
