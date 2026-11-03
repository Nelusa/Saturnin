import { readMindMaps, writeMindMap, removeMindMap, hasStoredMindMaps, MindMapConflictError } from "./mindmapStorage";
import { MindMap, NewMindMap } from "~/types/knowledge";
import {NODE_COLORS} from "~/lib/constants";
import {MOCK_MINDMAPS} from "~/lib/data";

/**
 * Creates a new mind map with the provided data
 * @param data - New mind map data
 * @returns Promise with created MindMap object or null if creation failed
 */
export async function createMindMap(data: NewMindMap): Promise<MindMap | null> {
  // TODO (NL): Implementovat skutečné API volání
  try {
    if (!data.title.trim()) return null;

    const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];

    const newMindMap: MindMap = {
      id: `mindmap-${crypto.randomUUID()}`,
      title: data.title.trim(),
      description: data.description,
      tags: data.tags,
      author: data.author,
      color,
      thumbnail: color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: 1,
      isPublic: false,
      viewMode: "network",
      nodes: [
        {
          id: `node-${crypto.randomUUID()}`,
          text: data.title.trim(),
          x: 250,
          y: 200,
          color
        }
      ],
      connections: []
    };

    saveMindMapToLocalStorage(newMindMap);

    return newMindMap;
  } catch (error) {
    console.error("Chyba při vytváření myšlenkové mapy:", error);
    return null;
  }
}

/**
 * Updates an existing mind map
 * @param id - ID of the mind map to update
 * @param data - Updated mind map data
 * @returns Promise with boolean indicating success
 */
export async function updateMindMap(id: string, data: Partial<MindMap>): Promise<boolean> {
  try {
    let map = getMindMapFromLocalStorage(id);

    if (!map) {
      if (hasStoredMindMaps()) return false;
      const mockMap = MOCK_MINDMAPS.find(m => m.id === id);
      if (!mockMap) {
        console.error(`Mapa s ID ${id} nebyla nalezena`);
        return false;
      }
      map = { ...mockMap };
    }

    const updatedMap = {
      ...map,
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (data.updatedAt !== undefined && data.updatedAt !== map.updatedAt) return false;
    saveMindMapToLocalStorage(updatedMap, map.updatedAt);

    return true;
  } catch (error) {
    console.error(`Chyba při aktualizaci myšlenkové mapy ${id}:`, error);
    return false;
  }
}

/**
 * Deletes a mind map by ID
 * @param id - ID of the mind map to delete
 * @returns Promise with boolean indicating success
 */
export async function deleteMindMap(id: string): Promise<boolean> {
  try {
    return removeMindMapFromLocalStorage(id);

  } catch (error) {
    console.error(`Chyba při mazání myšlenkové mapy ${id}:`, error);
    return false;
  }
}

/**
 * Duplicates an existing mind map
 * @param id - ID of the mind map to duplicate
 * @returns Promise with the new ID or null if failed
 */
export async function duplicateMindMap(id: string): Promise<MindMap | null> {
  try {
    let originalMap = getMindMapFromLocalStorage(id);

    if (!originalMap) {
      originalMap = MOCK_MINDMAPS.find(m => m.id === id) ?? null;
    }

    if (!originalMap) {
      console.error(`Mapa s ID ${id} nebyla nalezena pro duplikaci`);
      return null;
    }

    const clonedMap = JSON.parse(JSON.stringify(originalMap));
    const newId = `mindmap-${crypto.randomUUID()}`;

    const duplicatedMap: MindMap = {
      ...clonedMap,
      id: newId,
      title: `${clonedMap.title} (kopie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
    };
    saveMindMapToLocalStorage(duplicatedMap);



    return duplicatedMap;
  } catch (error) {
    console.error(`Chyba při duplikování myšlenkové mapy ${id}:`, error);
    return null;
  }
}

/**
 * Generates a thumbnail for a mind map
 * @param mindmap - Mind map data
 * @returns A color value or thumbnail URL
 */
export function generateMindMapThumbnail(mindmap: Partial<MindMap>): string {
  // TODO (NL): Implementovat skutečné generování náhledů

  if (mindmap.color) {
    return mindmap.color;
  }

  const colorOptions = NODE_COLORS;
  const title = mindmap.title || "Untitled";

  let hashValue = 0;
  for (let i = 0; i < title.length; i++) {
    hashValue = (hashValue + title.charCodeAt(i)) % colorOptions.length;
  }

  return colorOptions[hashValue];
}

/**
 * Shares or unshares a mind map
 * @param id - ID of the mind map
 * @param isPublic - Whether the mind map should be public
 * @returns Promise with boolean indicating success
 */
export async function shareMindMap(id: string, isPublic: boolean): Promise<boolean> {
  void id; void isPublic;
  return false; // Public sharing requires authenticated server storage.

}

/**
 * Saves a mind map to local storage
 * @param mindmap - Mind map to save
 */
export function saveMindMapToLocalStorage(mindmap: MindMap, expectedUpdatedAt?: string): void {
  try { writeMindMap(mindmap, expectedUpdatedAt); }
  catch (cause) { if (cause instanceof MindMapConflictError) throw cause; throw new Error('Mapu se nepodařilo uložit. Změny ponechte otevřené; původní data zůstávají v úložišti.', { cause }); }
}
export function getMindMapsFromLocalStorage(): MindMap[] {
  try { return readMindMaps(); } catch { return []; }
}
export function getMindMapFromLocalStorage(id: string): MindMap | null {
  return getMindMapsFromLocalStorage().find(map => map.id === id) ?? null;
}
export function removeMindMapFromLocalStorage(id: string): boolean {
  try { return removeMindMap(id); } catch { return false; }
}
