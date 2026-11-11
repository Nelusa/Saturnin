import type { MindMap } from "~/types/knowledge";
import { nodeForeground } from "./nodeAppearance";

const xml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
const color = (value: string | undefined, fallback: string) => /^#[\da-f]{6}$/i.test(value ?? "") ? value! : fallback;

/** Standalone SVG with complete graph bounds, independent of editor zoom, theme or viewport. */
export function renderMindMapSvg(map: MindMap) {
  const boxes = map.nodes.map((node) => {
    const lines = node.text.match(/.{1,26}/gu) ?? [""];
    return {
      ...node,
      lines,
      width: Math.max(100, Math.min(240, Math.max(...lines.map((line) => Array.from(line).length)) * 8 + 32)),
      height: Math.max(64, lines.length * 20 + 28),
    };
  });
  const left = Math.min(0, ...boxes.map((n) => n.x)) - 48;
  const top = Math.min(0, ...boxes.map((n) => n.y)) - 48;
  const width = Math.max(640, ...boxes.map((n) => n.x + n.width - left + 48));
  const height = Math.max(320, ...boxes.map((n) => n.y + n.height - top + 48));
  const titleLines = map.title.match(new RegExp(`.{1,${Math.max(20, Math.floor((width - 64) / 13))}}`, "gu")) ?? [""];
  const headerHeight = 96 + (titleLines.length - 1) * 28;
  const byId = new Map(boxes.map((n) => [n.id, n]));
  const edges = map.connections.map((edge) => {
    const from = byId.get(edge.sourceId), to = byId.get(edge.targetId);
    if (!from || !to) return "";
    const x1 = from.x + from.width / 2, y1 = from.y + from.height / 2;
    const x2 = to.x + to.width / 2, y2 = to.y + to.height / 2;
    const dash = edge.style === "dashed" ? "8 5" : edge.style === "dotted" ? "2 5" : "none";
    const dx = x2 - x1, dy = y2 - y1;
    const boundary = (box: typeof from) => {
      const a = Math.abs(dx) / (box.width / 2), b = Math.abs(dy) / (box.height / 2);
      const divisor = box.shape === "ellipse"
        ? Math.sqrt(a * a + b * b)
        : box.shape === "diamond"
        ? a + b
        : Math.max(a, b);
      return divisor ? Math.min(0.49, 1 / divisor) : 0;
    };
    const start = boundary(from), end = boundary(to);
    const label = edge.label
      ? `<text x="${(x1 + x2) / 2}" y="${
        (y1 + y2) / 2 - 8
      }" text-anchor="middle" font-size="12" fill="#475569" paint-order="stroke" stroke="#fff" stroke-width="4">${
        xml(edge.label)
      }</text>`
      : "";
    return `<path d="M${x1 + dx * start},${y1 + dy * start} L${x2 - dx * end},${
      y2 - dy * end
    }" marker-end="url(#arrow)" fill="none" stroke="${color(edge.color, "#94a3b8")}" stroke-width="${
      Math.min(8, Math.max(1, edge.thickness ?? 1.5))
    }" stroke-dasharray="${dash}"/>${label}`;
  }).join("");
  const nodes = boxes.map((n) => {
    const fill = color(n.color, "#ede9fe");
    const shape = n.shape === "ellipse"
      ? `<ellipse cx="${n.width / 2}" cy="${n.height / 2}" rx="${n.width / 2}" ry="${n.height / 2}"/>`
      : n.shape === "diamond"
      ? `<path d="M${n.width / 2},0 L${n.width},${n.height / 2} L${n.width / 2},${n.height} L0,${n.height / 2} Z"/>`
      : `<rect width="${n.width}" height="${n.height}" rx="12"/>`;
    return `<g transform="translate(${n.x},${n.y})"><g fill="${fill}" stroke="#cbd5e1">${shape}</g><text text-anchor="middle" font-size="14" font-weight="500" fill="${
      nodeForeground(fill)
    }">${
      n.lines.map((line, i) =>
        `<tspan x="${n.width / 2}" y="${n.height / 2 + (i - (n.lines.length - 1) / 2) * 20 + 5}">${xml(line)}</tspan>`
      ).join("")
    }</text></g>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${
    height + headerHeight
  }" viewBox="0 0 ${width} ${height + headerHeight}" role="img" aria-labelledby="title"><title id="title">${
    xml(map.title)
  }</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#64748b"/></marker></defs><rect width="100%" height="100%" fill="#fff"/><g font-family="system-ui, sans-serif"><text x="32" y="38" font-size="22" font-weight="700" fill="#0f172a">${
    titleLines.map((line, i) => `<tspan x="32" y="${38 + i * 28}">${xml(line)}</tspan>`).join("")
  }</text><text x="32" y="${
    headerHeight - 31
  }" font-size="12" fill="#64748b">Saturnin · ${map.nodes.length} uzlů · ${map.connections.length} spojení</text><g transform="translate(${-left},${
    headerHeight - top
  })">${edges}${nodes}</g></g></svg>`;
  return { svg, width, height: height + headerHeight };
}

/** Bound raster memory to 16 MP; SVG retains the full vector resolution. */
export async function rasterizeMindMap(image: ReturnType<typeof renderMindMapSvg>): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([image.svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Obrázek se nepodařilo připravit. Zkuste export SVG."));
      img.src = source;
    });
    const scale = Math.min(
      2,
      4096 / Math.max(image.width, image.height),
      Math.sqrt(16000000 / (image.width * image.height)),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Prohlížeč nepodporuje export PNG. Zkuste SVG.");
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Export PNG selhal.")), "image/png")
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}
