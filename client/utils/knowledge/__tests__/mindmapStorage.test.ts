import { beforeEach, describe, expect, it, vi } from "vitest";
import { initializeMindMaps, readMindMaps, removeMindMap, writeMindMap } from "../mindmapStorage";
import type { MindMap } from "~/types/knowledge";
const sample: MindMap = { id: "sample", title: "Ideas", description: "", tags: [], thumbnail: "#ffffff", createdAt: "", updatedAt: "first", author: "Me", nodeCount: 99, nodes: [{ id: "a", text: "Idea", x: 0, y: 0 }], connections: [], color: "#ffffff", isPublic: false, viewMode: "network" };
const memory = () => { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } }; };
beforeEach(() => { vi.stubGlobal("localStorage", memory()); vi.stubGlobal("sessionStorage", memory()); });
describe("local map lifecycle", () => {
  it("creates, updates, reopens, deletes and never resurrects demo data", () => {
    initializeMindMaps([sample]);
    const changed = { ...sample, title: "Changed", updatedAt: "second" };
    writeMindMap(changed, "first");
    expect(readMindMaps()[0]).toMatchObject({ title: "Changed", nodeCount: 1 });
    expect(removeMindMap(sample.id)).toBe(true);
    expect(initializeMindMaps([sample])).toEqual([]);
  });
  it.each(["not-json", "null", "{}", '"future-format"'])("does not replace unknown persisted data: %s", raw => {
    localStorage.setItem("mindmaps", raw);
    expect(() => writeMindMap(sample)).toThrow();
    expect(() => removeMindMap(sample.id)).toThrow();
    expect(localStorage.getItem("mindmaps")).toBe(raw);
  });
  it("preserves unrecognized records when saving or deleting a valid map", () => {
    const future = { id: "future", format: 2 };
    localStorage.setItem("mindmaps", JSON.stringify([null, future]));
    writeMindMap(sample);
    removeMindMap(sample.id);
    expect(JSON.parse(localStorage.getItem("mindmaps")!)).toEqual([null, future]);
  });
  it("rejects a stale edit and preserves the newer version", () => {
    writeMindMap(sample);
    writeMindMap({ ...sample, title: "Other tab", updatedAt: "second" }, "first");
    expect(() => writeMindMap({ ...sample, title: "Old tab" }, "first")).toThrow();
    expect(readMindMaps()[0].title).toBe("Other tab");
  });
  it("does not resurrect a map deleted while the editor was open", () => {
    writeMindMap(sample); removeMindMap(sample.id);
    expect(() => writeMindMap(sample, "first")).toThrow();
    expect(readMindMaps()).toEqual([]);
  });
  it("commits all samples at once, or leaves storage untouched on quota failure", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    expect(() => initializeMindMaps([sample])).toThrow();
    expect(localStorage.getItem("mindmaps")).toBeNull();
  });
  it("does not fail deletion after the optional session mirror rejects a write", () => {
    writeMindMap(sample);
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(removeMindMap(sample.id)).toBe(true);
    expect(readMindMaps()).toEqual([]);
  });
});
