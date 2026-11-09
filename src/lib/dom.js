/** Small DOM helpers. Dynamic values must always go through textContent. */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") {
      node.className = value;
    } else if (key === "text") {
      node.textContent = String(value);
    } else if (key === "dataset") {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        if (dataValue !== null && dataValue !== undefined) node.dataset[dataKey] = String(dataValue);
      }
    } else if (key === "on" && typeof value === "object") {
      for (const [event, handler] of Object.entries(value)) {
        if (typeof handler === "function") node.addEventListener(event, handler);
      }
    } else if (key === "html") {
      // Only static, trusted markup should use this escape hatch.
      node.innerHTML = value;
    } else if (key in node && key !== "list" && key !== "form") {
      node[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }
  append(node, children);
  return node;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function text(value) {
  return document.createTextNode(value === null || value === undefined ? "" : String(value));
}

export function setText(node, value) {
  node.textContent = value === null || value === undefined ? "" : String(value);
}

export function isActivationKey(event) {
  return event.key === "Enter" || event.key === " " || event.key === "Spacebar";
}

export async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy selection fallback.
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.className = "clipboard-fallback";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function downloadText(filename, value, type = "application/json") {
  const blob = new Blob([value], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}
