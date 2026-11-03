import { z } from "zod";
import type { MindMap } from "~/types/knowledge";

const node = z.object({
  id: z.string().min(1), text: z.string(), x: z.number().finite(), y: z.number().finite(),
  color: z.string().optional(), shape: z.enum(["rectangle", "ellipse", "diamond"]).optional(),
  fontSize: z.number().optional(), width: z.number().optional(), height: z.number().optional(),
}).passthrough();
const connection = z.object({
  id: z.string().min(1), sourceId: z.string(), targetId: z.string(), label: z.string().optional(),
  style: z.enum(["solid", "dashed", "dotted"]).optional(), color: z.string().optional(), thickness: z.number().optional(),
}).passthrough();
const schema = z.object({
  id: z.string().min(1), title: z.string(), description: z.string(), tags: z.array(z.string()),
  thumbnail: z.string(), createdAt: z.string(), updatedAt: z.string(), author: z.string(),
  nodeCount: z.number().finite(), nodes: z.array(node), connections: z.array(connection),
  color: z.string(), isPublic: z.boolean(), viewMode: z.enum(["tree", "network", "free"]),
}).passthrough();
export class MindMapConflictError extends Error {}
export const MAPS_KEY = "mindmaps";

/** Keep unrecognized records intact when changing a different map. */
function readRecords(): unknown[] {
  const value: unknown = JSON.parse(localStorage.getItem(MAPS_KEY) ?? "[]");
  if (!Array.isArray(value)) throw new Error("Uložené mapy mají neznámý formát. Původní data zůstala zachována.");
  return value;
}
function writeRecords(records: unknown[]) {
  const json = JSON.stringify(records);
  localStorage.setItem(MAPS_KEY, json);
  try { sessionStorage.setItem(MAPS_KEY, json); } catch { /* Optional mirror, never a source of truth. */ }
}
export function hasStoredMindMaps() { return localStorage.getItem(MAPS_KEY) !== null; }
export function initializeMindMaps(samples: MindMap[]) {
  if (!hasStoredMindMaps()) writeRecords(samples);
  return readMindMaps();
}
export function readMindMaps(): MindMap[] {
  return readRecords().flatMap(record => {
    const parsed = schema.safeParse(record);
    return parsed.success ? [{ ...parsed.data, nodeCount: parsed.data.nodes.length, isPublic: false }] : [];
  });
}
export function writeMindMap(map: MindMap, expectedUpdatedAt?: string) {
  const normalized = schema.parse({ ...map, title: map.title.trim(), nodeCount: map.nodes.length, isPublic: false });
  if (!normalized.title) throw new Error("Mapa musí mít název.");
  const records = readRecords();
  const index = records.findIndex(record => record !== null && typeof record === "object" && "id" in record && record.id === map.id);
  if (expectedUpdatedAt !== undefined) {
    const current = index < 0 ? null : schema.safeParse(records[index]);
    if ((index < 0 && hasStoredMindMaps()) || (current && (!current.success || current.data.updatedAt !== expectedUpdatedAt))) {
      throw new MindMapConflictError("Mapa se mezitím změnila nebo byla smazána v jiném okně. Nejprve si exportujte rozpracované změny.");
    }
  }
  if (index < 0) records.unshift(normalized); else records[index] = normalized;
  writeRecords(records);
}
export function removeMindMap(id: string) {
  const records = readRecords();
  const next = records.filter(record => !(record !== null && typeof record === "object" && "id" in record && record.id === id));
  if (next.length === records.length) return false;
  writeRecords(next);
  return true;
}
