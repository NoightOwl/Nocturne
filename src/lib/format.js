/** Display formatting helpers. */

const numberFormat = new Intl.NumberFormat("en-US");

export function formatOneIn(value) {
  const n = Math.max(1, Number(value) || 1);
  if (n < 1000) return `1 in ${numberFormat.format(Math.round(n))}`;
  if (n < 1_000_000) {
    const k = n / 1000;
    return `1 in ${k >= 100 ? Math.round(k) : k.toFixed(1)}k`;
  }
  if (n < 1_000_000_000) {
    const m = n / 1_000_000;
    return `1 in ${m >= 100 ? Math.round(m) : m.toFixed(1)}M`;
  }
  const b = n / 1_000_000_000;
  return `1 in ${b >= 100 ? Math.round(b) : b.toFixed(1)}B`;
}

export function formatBits(low, high) {
  const lo = Math.round(low * 10) / 10;
  const hi = Math.round(high * 10) / 10;
  const unit = (value) => `${value} ${value === 1 ? "bit" : "bits"}`;
  if (lo === hi) return unit(lo);
  return `${lo}–${hi} bits`;
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function formatCount(value) {
  return numberFormat.format(Number(value) || 0);
}

export function formatCategory(category) {
  return String(category || "Other");
}

export function verdictFor(bits) {
  if (bits < 12) {
    return {
      label: "Relatively common",
      tone: "good",
      sentence: "Your browser exposes fewer identifying bits than many setups.",
    };
  }
  if (bits < 17) {
    return {
      label: "Somewhat distinctive",
      tone: "caution",
      sentence: "Several signals combine to narrow you down more than average.",
    };
  }
  if (bits < 21) {
    return {
      label: "Distinctive",
      tone: "warn",
      sentence: "Your configuration is likely easy to separate from most other browsers.",
    };
  }
  return {
    label: "Highly distinctive",
    tone: "danger",
    sentence: "A tracker could probably recognise this browser from a small set of signals.",
  };
}

export function confidenceFor(coverage) {
  if (coverage >= 0.8) {
    return {
      label: "High confidence",
      tone: "good",
      detail: "Most signals were measured successfully.",
    };
  }
  if (coverage >= 0.5) {
    return {
      label: "Medium confidence",
      tone: "caution",
      detail: "Some signals were unavailable or blocked, so the range is wider.",
    };
  }
  return {
    label: "Low confidence",
    tone: "warn",
    detail: "Many signals were unavailable or blocked. Treat this as a partial reading.",
  };
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${formatCount(count)} ${Number(count) === 1 ? singular : plural}`;
}
