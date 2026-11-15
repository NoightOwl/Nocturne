import { result } from "./utils.js";

function canPlay(type) {
  try {
    const media = document.createElement("video");
    return media.canPlayType(type) || "no";
  } catch {
    return "no";
  }
}

function recorderSupport(type) {
  try {
    return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type);
  } catch {
    return false;
  }
}

async function deviceCounts() {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const counts = { audioinput: 0, audiooutput: 0, videoinput: 0, total: devices.length, labelsVisible: false };
    for (const device of devices) {
      if (device.kind in counts) counts[device.kind] += 1;
      if (device.label) counts.labelsVisible = true;
    }
    return counts;
  } catch {
    return null;
  }
}

export default {
  id: "media",
  label: "Media and codecs",
  category: "Device",
  group: "async",
  timeoutMs: 1800,
  async collect() {
    const codecs = {
      h264: canPlay('video/mp4; codecs="avc1.42E01E"'),
      vp8: canPlay('video/webm; codecs="vp8"'),
      vp9: canPlay('video/webm; codecs="vp9"'),
      av1: canPlay('video/mp4; codecs="av01.0.05M.08"'),
      hevc: canPlay('video/mp4; codecs="hvc1.1.6.L93.B0"'),
      aac: canPlay('audio/mp4; codecs="mp4a.40.2"'),
      opus: canPlay('audio/webm; codecs="opus"'),
      vorbis: canPlay('audio/ogg; codecs="vorbis"'),
    };

    const recorders = {
      webmVp8: recorderSupport("video/webm;codecs=vp8"),
      webmVp9: recorderSupport("video/webm;codecs=vp9"),
      mp4: recorderSupport("video/mp4"),
      ogg: recorderSupport("audio/ogg"),
    };

    const devices = await deviceCounts();
    const supported = Object.entries(codecs)
      .filter(([, support]) => support === "probably" || support === "maybe")
      .map(([name]) => name);

    const value = { codecs, recorders, devices };
    return [
      result(
        "media",
        "Media and codecs",
        "Device",
        value,
        `${supported.length} codec${supported.length === 1 ? "" : "s"} · ${devices ? `${devices.total} media device${devices.total === 1 ? "" : "s"}` : "devices not exposed"}`,
        {
          note: "Codec and device support varies by OS, browser build, and hardware. No camera or microphone permission was requested.",
        },
      ),
    ];
  },
};
