import { result } from "./utils.js";

export default {
  id: "locale",
  label: "Locale and time zone",
  category: "Locale",
  group: "visual",
  timeoutMs: 1000,
  collect() {
    const languages = Array.isArray(navigator.languages) && navigator.languages.length
      ? [...navigator.languages]
      : [navigator.language || "unknown"];

    let resolved = {};
    try {
      resolved = Intl.DateTimeFormat().resolvedOptions();
    } catch {
      resolved = {};
    }

    const timezone = {
      zone: resolved.timeZone || "unknown",
      offsetMinutes: new Date().getTimezoneOffset(),
      locale: resolved.locale || languages[0] || "unknown",
      calendar: resolved.calendar || null,
      numberingSystem: resolved.numberingSystem || null,
    };

    return [
      result(
        "languages",
        "Languages",
        "Locale",
        languages,
        languages.join(", "),
        { note: "Language preferences often correlate with region, community, and device setup." },
      ),
      result(
        "timezone",
        "Time zone",
        "Locale",
        timezone,
        `${timezone.zone} · UTC${timezone.offsetMinutes <= 0 ? "+" : "−"}${Math.abs(timezone.offsetMinutes / 60).toFixed(1)}`,
        { note: "A time zone narrows the likely region, especially when combined with languages." },
      ),
    ];
  },
};
