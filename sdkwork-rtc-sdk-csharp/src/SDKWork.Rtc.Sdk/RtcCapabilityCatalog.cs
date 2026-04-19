namespace Sdkwork.Rtc.Sdk;

using System.Collections.Generic;
using System.Linq;

public sealed record RtcCapabilityCatalogEntry(
    string capabilityKey,
    string category,
    string surface
);

public static class RtcCapabilityCatalog
{
    public static readonly IReadOnlyList<RtcCapabilityCatalogEntry> Entries =
    [
        new("session", "required-baseline", "cross-surface"),
        new("join", "required-baseline", "runtime-bridge"),
        new("publish", "required-baseline", "runtime-bridge"),
        new("subscribe", "required-baseline", "runtime-bridge"),
        new("mute", "required-baseline", "runtime-bridge"),
        new("basic-events", "required-baseline", "runtime-bridge"),
        new("health", "required-baseline", "control-plane"),
        new("unwrap", "required-baseline", "runtime-bridge"),
        new("screen-share", "optional-advanced", "runtime-bridge"),
        new("recording", "optional-advanced", "control-plane"),
        new("cloud-mix", "optional-advanced", "control-plane"),
        new("cdn-relay", "optional-advanced", "control-plane"),
        new("data-channel", "optional-advanced", "runtime-bridge"),
        new("transcription", "optional-advanced", "control-plane"),
        new("beauty", "optional-advanced", "runtime-bridge"),
        new("spatial-audio", "optional-advanced", "runtime-bridge"),
        new("e2ee", "optional-advanced", "runtime-bridge"),
    ];

public static IReadOnlyList<RtcCapabilityCatalogEntry> GetRtcCapabilityCatalog() =>
        Entries;

    public static RtcCapabilityCatalogEntry? GetRtcCapabilityDescriptor(string capabilityKey) =>
        Entries.FirstOrDefault(entry => entry.capabilityKey == capabilityKey);

}
