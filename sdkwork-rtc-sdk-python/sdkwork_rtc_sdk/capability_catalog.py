from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class RtcCapabilityCatalogEntry:
    capabilityKey: str
    category: str
    surface: str


class RtcCapabilityCatalog:
    entries = [
        RtcCapabilityCatalogEntry("session", "required-baseline", "cross-surface"),
        RtcCapabilityCatalogEntry("join", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("publish", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("subscribe", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("mute", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("basic-events", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("health", "required-baseline", "control-plane"),
        RtcCapabilityCatalogEntry("unwrap", "required-baseline", "runtime-bridge"),
        RtcCapabilityCatalogEntry("screen-share", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("recording", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("cloud-mix", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("cdn-relay", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("data-channel", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("transcription", "optional-advanced", "control-plane"),
        RtcCapabilityCatalogEntry("beauty", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("spatial-audio", "optional-advanced", "runtime-bridge"),
        RtcCapabilityCatalogEntry("e2ee", "optional-advanced", "runtime-bridge"),
    ]


def get_rtc_capability_catalog() -> list[RtcCapabilityCatalogEntry]:
    return RtcCapabilityCatalog.entries


def get_rtc_capability_descriptor(capability_key: str) -> Optional[RtcCapabilityCatalogEntry]:
    for entry in RtcCapabilityCatalog.entries:
        if entry.capabilityKey == capability_key:
            return entry

    return None
