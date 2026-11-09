export function result(id, label, category, value, displayValue, options = {}) {
  return {
    id,
    label,
    category,
    status: options.status ?? "ok",
    value,
    displayValue: displayValue ?? String(value ?? ""),
    stability: options.stability ?? "stable",
    note: options.note ?? "",
  };
}

export function unavailable(id, label, category, reason, status = "unavailable") {
  return {
    id,
    label,
    category,
    status,
    value: null,
    displayValue: reason,
    stability: "unknown",
    note: reason,
  };
}

export function safeString(value, fallback = "unspecified") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function mediaQuery(query) {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return null;
  }
}

export function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
