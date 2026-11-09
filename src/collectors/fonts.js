import { FONT_LIST } from "../data/fonts.js";
import { result } from "./utils.js";

const GENERIC_FAMILIES = ["monospace", "serif", "sans-serif"];
const SAMPLE_TEXT = "mmmmmmmmmmlliWQ@#0123456789{}[]";

function measureWidth(container, family) {
  const span = document.createElement("span");
  span.textContent = SAMPLE_TEXT;
  span.style.fontFamily = family;
  container.append(span);
  const width = span.getBoundingClientRect().width;
  span.remove();
  return width;
}

export default {
  id: "fonts",
  label: "Installed fonts",
  category: "Rendering",
  group: "visual",
  timeoutMs: 2200,
  collect() {
    const container = document.createElement("div");
    container.className = "font-probe";
    document.body.append(container);

    try {
      const baselines = new Map();
      for (const generic of GENERIC_FAMILIES) {
        baselines.set(generic, measureWidth(container, generic));
      }

      const detected = [];
      for (const font of FONT_LIST) {
        for (const generic of GENERIC_FAMILIES) {
          const width = measureWidth(container, `"${font}", ${generic}`);
          if (Math.abs(width - baselines.get(generic)) > 0.2) {
            detected.push(font);
            break;
          }
        }
      }

      detected.sort((a, b) => a.localeCompare(b));
      return [
        result(
          "fonts",
          "Installed fonts",
          "Rendering",
          { count: detected.length, fonts: detected },
          `${detected.length} font${detected.length === 1 ? "" : "s"} detected`,
          {
            note: "Fonts were detected locally with width measurements. No fonts or font data were downloaded or transmitted.",
          },
        ),
      ];
    } catch {
      return [
        result("fonts", "Installed fonts", "Rendering", { count: 0, fonts: [] }, "Font detection blocked", {
          status: "blocked",
          stability: "unknown",
          note: "The browser blocked local font measurement.",
        }),
      ];
    } finally {
      container.remove();
    }
  },
};
