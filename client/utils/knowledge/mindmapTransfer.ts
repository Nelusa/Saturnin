import { z } from "zod";
import type { MindMap } from "~/types/knowledge";
import { mindMapSchema } from "./mindmapStorage";

export const MAX_BACKUP_BYTES = 4 * 1024 * 1024;
const backupSchema = z.object({
  format: z.literal("saturnin-mindmap"),
  version: z.literal(1),
  map: mindMapSchema,
}).strict();

function validateMap(map: MindMap) {
  if (!map.title.trim() || map.title.length > 300 || map.nodes.length > 1000 || map.connections.length > 3000) {
    throw new Error("Mapa musí mít název do 300 znaků, nejvýše 1 000 uzlů a 3 000 spojení.");
  }
  const ids = new Set(map.nodes.map((n) => n.id));
  const edgeIds = new Set(map.connections.map((e) => e.id));
  if (
    ids.size !== map.nodes.length || edgeIds.size !== map.connections.length ||
    map.connections.some((e) => !ids.has(e.sourceId) || !ids.has(e.targetId))
  ) {
    throw new Error("Mapa obsahuje duplicitní identifikátory nebo spojení na neexistující uzly.");
  }
  if (map.nodes.some((n) => Math.abs(n.x) > 100000 || Math.abs(n.y) > 100000 || n.text.length > 2000)) {
    throw new Error("Souřadnice nebo text některého uzlu překračují podporovanou velikost.");
  }
}

/** Portable domain data, including metadata; never React Flow's transient selection state. */
export function serializeMindMap(map: MindMap): string {
  const normalized = mindMapSchema.parse({ ...map, nodeCount: map.nodes.length, isPublic: false });
  validateMap(normalized);
  const text = JSON.stringify({ format: "saturnin-mindmap", version: 1, map: normalized }, null, 2);
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error("Záloha je větší než 4 MB.");
  return text;
}

/** Import as a new private copy. A backup must never replace another browser-local map. */
export function parseMindMapBackup(text: string): MindMap {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error("Soubor je větší než 4 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Obsah není platný JSON. Vyberte úplnou zálohu mapy.");
  }
  const parsed = backupSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "Tento formát nepodporujeme. Použijte zálohu JSON ze Saturnina (verze 1). Starší export pouze uzlů a hran není úplná záloha.",
    );
  }
  validateMap(parsed.data.map);
  const now = new Date().toISOString();
  return {
    ...parsed.data.map,
    id: `mindmap-${crypto.randomUUID()}`,
    title: parsed.data.map.title.trim(),
    createdAt: now,
    updatedAt: now,
    nodeCount: parsed.data.map.nodes.length,
    isPublic: false,
  };
}

export function exportFilename(title: string, extension: string) {
  const safe = Array.from(title, (char) => char.charCodeAt(0) < 32 ? "-" : char).join("").replace(/[<>:"/\\|?*]/g, "-")
    .replace(/[. ]+$/g, "").trim().slice(0, 100);
  return `${safe || "saturnin-mapa"}.${extension}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously can race the browser's download navigation.
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
