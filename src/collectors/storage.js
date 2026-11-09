import { result } from "./utils.js";

function testCookie() {
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    const name = "__nocturne_probe";
    document.cookie = `${name}=1; path=/; SameSite=Lax${secure}`;
    const ok = document.cookie.split(";").some((item) => item.trim().startsWith(`${name}=`));
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
    return ok;
  } catch {
    return false;
  }
}

function testStorage(kind) {
  try {
    const storage = window[kind];
    const key = "__nocturne_probe";
    storage.setItem(key, "1");
    const ok = storage.getItem(key) === "1";
    storage.removeItem(key);
    return ok;
  } catch {
    return false;
  }
}

export default {
  id: "storage",
  label: "Cookies and local storage",
  category: "Privacy",
  group: "async",
  timeoutMs: 1200,
  collect() {
    const storage = {
      cookies: testCookie(),
      localStorage: testStorage("localStorage"),
      sessionStorage: testStorage("sessionStorage"),
      indexedDB: typeof indexedDB !== "undefined",
    };

    return [
      result(
        "storage",
        "Storage availability",
        "Privacy",
        storage,
        `${storage.cookies ? "cookies" : "no cookies"} · ${storage.localStorage ? "local storage" : "no local storage"} · IndexedDB ${storage.indexedDB ? "present" : "absent"}`,
        {
          note: "Only availability was tested. The temporary cookie and storage key were deleted immediately; no identifier was stored.",
        },
      ),
    ];
  },
};
