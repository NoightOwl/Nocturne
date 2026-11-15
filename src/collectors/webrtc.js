import { result } from "./utils.js";

const GATHER_TIMEOUT = 1400;

function analyze(candidates) {
  const types = new Set();
  let mdns = false;
  let rawIp = false;

  for (const candidate of candidates) {
    const text = candidate.candidate || "";
    const type = / typ (\w+)/.exec(text)?.[1];
    if (type) types.add(type);

    const address = typeof candidate.address === "string" ? candidate.address : "";
    if (address.endsWith(".local") || text.includes(".local")) {
      mdns = true;
      continue;
    }
    if (
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(address) ||
      (address.includes(":") && !address.startsWith("0:")) ||
      /(?:^|\s)(?:\d{1,3}\.){3}\d{1,3}(?:\s|$)/.test(text)
    ) {
      rawIp = true;
    }
  }

  return { types: [...types].sort(), mdns, rawIp };
}

function gatherLocalCandidates() {
  return new Promise((resolve, reject) => {
    if (typeof RTCPeerConnection === "undefined") {
      reject(new Error("RTCPeerConnection unavailable"));
      return;
    }

    let pc;
    let timer;
    let settled = false;
    const candidates = [];

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        pc?.close();
      } catch {
        // Ignore close errors.
      }
      resolve(analyze(candidates));
    };

    try {
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        } else {
          finish();
        }
      };
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") finish();
      };
      pc.createDataChannel("nocturne-probe");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => finish());
      timer = setTimeout(finish, GATHER_TIMEOUT);
    } catch (error) {
      if (pc) {
        try {
          pc.close();
        } catch {
          // Ignore.
        }
      }
      reject(error);
    }
  });
}

export default {
  id: "webrtc",
  label: "WebRTC candidates",
  category: "Network",
  group: "async",
  timeoutMs: 2200,
  async collect() {
    try {
      const info = await gatherLocalCandidates();
      const display = info.rawIp
        ? "Raw IP address exposed in ICE candidates"
        : info.mdns
          ? "Candidates hidden behind mDNS"
          : "No local ICE candidates produced";

      return [
        result(
          "webrtc",
          "WebRTC candidates",
          "Network",
          info,
          display,
          {
            stability: "volatile",
            note: "The test used an empty STUN server list, so no external network request was made. Candidate details are not stored.",
          },
        ),
      ];
    } catch {
      return [
        result("webrtc", "WebRTC candidates", "Network", null, "WebRTC unavailable", {
          status: "unavailable",
          stability: "unknown",
          note: "This browser does not expose RTCPeerConnection or blocked local candidate gathering.",
        }),
      ];
    }
  },
};
