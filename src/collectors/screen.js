import { mediaQuery, result } from "./utils.js";

export default {
  id: "screen",
  label: "Display, pointer and input",
  category: "Display",
  group: "visual",
  timeoutMs: 1000,
  collect() {
    const screenInfo = window.screen;
    const screenValue = {
      width: screenInfo?.width ?? null,
      height: screenInfo?.height ?? null,
      availWidth: screenInfo?.availWidth ?? null,
      availHeight: screenInfo?.availHeight ?? null,
      colorDepth: screenInfo?.colorDepth ?? null,
      pixelDepth: screenInfo?.pixelDepth ?? null,
      orientation: screenInfo?.orientation?.type ?? null,
      colorScheme: mediaQuery("(prefers-color-scheme: dark)") ? "dark" : mediaQuery("(prefers-color-scheme: light)") ? "light" : "unknown",
      reducedMotion: mediaQuery("(prefers-reduced-motion: reduce)"),
      displayMode: mediaQuery("(display-mode: standalone)") ? "standalone" : "browser",
    };

    const dpr = Number(window.devicePixelRatio) || 1;
    const viewport = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
    };

    const touch = {
      maxTouchPoints: Number(navigator.maxTouchPoints) || 0,
      coarsePointer: mediaQuery("(pointer: coarse)"),
      finePointer: mediaQuery("(pointer: fine)"),
      hover: mediaQuery("(hover: hover)"),
      anyCoarse: mediaQuery("(any-pointer: coarse)"),
    };

    return [
      result(
        "screen",
        "Screen and display",
        "Display",
        screenValue,
        `${screenValue.width}×${screenValue.height} · ${screenValue.colorDepth}-bit · ${screenValue.displayMode}${screenValue.colorScheme !== "unknown" ? ` · ${screenValue.colorScheme}` : ""}`,
        { note: "Resolution, available area, colour depth, and display mode form a device profile." },
      ),
      result("dpr", "Pixel ratio", "Display", dpr, `${dpr}×`, {
        note: "Device pixel ratio separates display classes and scaling setups.",
      }),
      result(
        "touch",
        "Input and pointer",
        "Device",
        touch,
        `${touch.maxTouchPoints} touch point${touch.maxTouchPoints === 1 ? "" : "s"} · ${touch.coarsePointer ? "coarse" : touch.finePointer ? "fine" : "unknown"} pointer`,
        { note: "Touch and pointer capabilities separate phones, tablets, laptops, and desktops." },
      ),
      result(
        "viewport",
        "Viewport",
        "Display",
        viewport,
        `${viewport.innerWidth}×${viewport.innerHeight} window`,
        {
          stability: "volatile",
          note: "Current window dimensions change constantly and are excluded from the stable signature.",
        },
      ),
    ];
  },
};
