package com.sdkwork.rtc.metadata

data class RtcCapabilityCatalogEntry(
    val capabilityKey: String,
    val category: String,
    val surface: String,
)

object RtcCapabilityCatalog {
    val entries: List<RtcCapabilityCatalogEntry> = listOf(
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
    )

fun getRtcCapabilityCatalog(): List<RtcCapabilityCatalogEntry> = entries

    fun getRtcCapabilityDescriptor(capabilityKey: String): RtcCapabilityCatalogEntry? =
        entries.firstOrNull { it.capabilityKey == capabilityKey }

}
