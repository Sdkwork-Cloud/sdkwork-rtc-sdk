package com.sdkwork.rtc.metadata;

import java.util.List;
import java.util.Optional;

public final class RtcCapabilityCatalog {

  public static final List<Entry> ENTRIES = List.of(
      new Entry("session", "required-baseline", "cross-surface"),
      new Entry("join", "required-baseline", "runtime-bridge"),
      new Entry("publish", "required-baseline", "runtime-bridge"),
      new Entry("subscribe", "required-baseline", "runtime-bridge"),
      new Entry("mute", "required-baseline", "runtime-bridge"),
      new Entry("basic-events", "required-baseline", "runtime-bridge"),
      new Entry("health", "required-baseline", "control-plane"),
      new Entry("unwrap", "required-baseline", "runtime-bridge"),
      new Entry("screen-share", "optional-advanced", "runtime-bridge"),
      new Entry("recording", "optional-advanced", "control-plane"),
      new Entry("cloud-mix", "optional-advanced", "control-plane"),
      new Entry("cdn-relay", "optional-advanced", "control-plane"),
      new Entry("data-channel", "optional-advanced", "runtime-bridge"),
      new Entry("transcription", "optional-advanced", "control-plane"),
      new Entry("beauty", "optional-advanced", "runtime-bridge"),
      new Entry("spatial-audio", "optional-advanced", "runtime-bridge"),
      new Entry("e2ee", "optional-advanced", "runtime-bridge")
  );

public static List<Entry> getRtcCapabilityCatalog() {
    return ENTRIES;
  }

  public static Optional<Entry> getRtcCapabilityDescriptor(String capabilityKey) {
    for (var entry : ENTRIES) {
      if (entry.capabilityKey().equals(capabilityKey)) {
        return Optional.of(entry);
      }
    }

    return Optional.empty();
  }


  private RtcCapabilityCatalog() {
  }

  public record Entry(String capabilityKey, String category, String surface) {
  }
}
