import { result } from "./utils.js";

function cleanBrands(brands) {
  if (!Array.isArray(brands)) return null;
  return brands
    .filter((brand) => brand && brand.brand)
    .map((brand) => ({ brand: String(brand.brand), version: String(brand.version ?? "") }));
}

export default {
  id: "browser",
  label: "Browser and platform",
  category: "Browser",
  group: "visual",
  timeoutMs: 1500,
  collect() {
    const nav = navigator;
    const attributes = [];
    const userAgent = nav.userAgent || "";
    attributes.push(
      result("userAgent", "User agent", "Browser", userAgent, userAgent || "Unavailable", {
        note: "The full browser and OS version string normally travels with every request.",
      }),
    );

    const uaData = nav.userAgentData;
    const brands = cleanBrands(uaData?.brands) || cleanBrands(nav.userAgentData?.brands);
    const brandsValue = {
      brands,
      mobile: uaData?.mobile ?? null,
      platform: uaData?.platform ?? null,
      vendor: nav.vendor || null,
    };
    attributes.push(
      result(
        "uaBrands",
        "User-Agent Client Hints",
        "Browser",
        brandsValue,
        brands?.length
          ? `${brands.map((item) => `${item.brand} ${item.version}`.trim()).join(", ")}${uaData?.mobile ? " · mobile" : ""}`
          : "Not exposed",
        { status: brands ? "ok" : "unavailable", note: "Reduced brand hints replace some of the detail in the user agent." },
      ),
    );

    const platform = uaData?.platform || nav.platform || "unknown";
    attributes.push(
      result("platform", "Platform", "Browser", platform, platform, {
        note: "The declared platform narrows the likely OS family.",
      }),
    );

    const hardware = {
      cores: Number.isFinite(nav.hardwareConcurrency) ? nav.hardwareConcurrency : null,
      memoryGB: Number.isFinite(nav.deviceMemory) ? nav.deviceMemory : null,
    };
    attributes.push(
      result(
        "hardware",
        "Hardware profile",
        "Device",
        hardware,
        `${hardware.cores ?? "?"} CPU threads · ${hardware.memoryGB ? `${hardware.memoryGB} GB` : "memory not exposed"}`,
        {
          status: hardware.cores === null && hardware.memoryGB === null ? "unavailable" : "ok",
          note: "CPU and memory hints narrow the device class; both are coarse by design.",
        },
      ),
    );

    const pluginNames = nav.plugins ? Array.from(nav.plugins, (plugin) => plugin.name).filter(Boolean) : [];
    const plugins = {
      names: pluginNames,
      pdfViewerEnabled: nav.pdfViewerEnabled ?? null,
    };
    attributes.push(
      result(
        "plugins",
        "Plugins and PDF viewer",
        "Browser",
        plugins,
        pluginNames.length
          ? `${pluginNames.length} plugin${pluginNames.length === 1 ? "" : "s"} · PDF viewer ${plugins.pdfViewerEnabled === false ? "off" : "available"}`
          : `No plugin list · PDF viewer ${plugins.pdfViewerEnabled === false ? "off" : "available"}`,
        { note: "Legacy plugin lists are mostly empty now, but the PDF viewer state still adds a little signal." },
      ),
    );

    return attributes;
  },
};
