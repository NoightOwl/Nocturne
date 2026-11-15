import { result } from "./utils.js";

function normalizeDnt(value) {
  if (value === 1 || value === "1" || value === "yes") return "enabled";
  if (value === 0 || value === "0" || value === "no") return "disabled";
  return "unspecified";
}

export default {
  id: "privacy",
  label: "Privacy signals",
  category: "Privacy",
  group: "visual",
  timeoutMs: 1000,
  collect() {
    const gpc = typeof navigator.globalPrivacyControl === "boolean" ? navigator.globalPrivacyControl : null;
    const dnt = normalizeDnt(navigator.doNotTrack ?? window.doNotTrack ?? navigator.msDoNotTrack);
    const privacy = {
      gpc,
      dnt,
      cookieEnabled: Boolean(navigator.cookieEnabled),
    };

    return [
      result(
        "privacy",
        "Privacy signals",
        "Privacy",
        privacy,
        `GPC ${gpc === true ? "on" : gpc === false ? "off" : "unsupported"} · DNT ${dnt}`,
        {
          note: "GPC and DNT are requests, not guarantees. Most sites are not required to honour them.",
        },
      ),
    ];
  },
};
