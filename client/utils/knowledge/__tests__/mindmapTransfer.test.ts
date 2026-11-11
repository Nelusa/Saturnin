import { describe, expect, it } from "vitest";
import { MOCK_MINDMAPS } from "~/lib/data";
import { exportFilename, parseMindMapBackup, serializeMindMap } from "../mindmapTransfer";
import { renderMindMapSvg } from "../mindmapImage";

const sample = () => structuredClone(MOCK_MINDMAPS[0]);

describe("portable mind-map backups", () => {
  it("round-trips graph and metadata as a new private copy without modifying the original", () => {
    const map = { ...sample(), isPublic: true, description: "Český popis 🧠", tags: ["vlastní tag"] };
    const original = structuredClone(map);
    const restored = parseMindMapBackup(serializeMindMap(map));
    expect(restored.id).not.toBe(map.id);
    expect(restored.isPublic).toBe(false);
    expect(restored).toMatchObject({
      title: map.title,
      description: map.description,
      tags: map.tags,
      nodes: map.nodes,
      connections: map.connections,
      nodeCount: map.nodes.length,
    });
    expect(map).toEqual(original);
    expect(parseMindMapBackup(serializeMindMap(map)).id).not.toBe(restored.id);
  });
  it("retains unfamiliar domain fields for forward-compatible backups", () => {
    const map = {
      ...sample(),
      futureSetting: { enabled: true },
      nodes: [{ ...sample().nodes[0], note: "keep me" }],
      connections: [],
    };
    expect(parseMindMapBackup(serializeMindMap(map))).toMatchObject({
      futureSetting: { enabled: true },
      nodes: [{ note: "keep me" }],
    });
  });
  it.each(["{", "null", '{"nodes":[],"edges":[]}', '{"format":"saturnin-mindmap","version":2,"map":{}}'])(
    "rejects malformed, legacy or unknown versions: %s",
    (value) => {
      expect(() => parseMindMapBackup(value)).toThrow();
    },
  );
  it("rejects duplicate node identifiers and dangling connections", () => {
    const map = sample();
    map.nodes.push({ ...map.nodes[0] });
    expect(() => serializeMindMap(map)).toThrow(/duplicitní/);
    const dangling = sample();
    dangling.connections[0].targetId = "not-here";
    expect(() => serializeMindMap(dangling)).toThrow(/neexistující/);
  });
  it("rejects oversized files and graph coordinates before rendering or saving", () => {
    expect(() => parseMindMapBackup(" ".repeat(4 * 1024 * 1024 + 1))).toThrow(/4 MB/);
    const map = sample();
    map.nodes[0].x = 100001;
    expect(() => serializeMindMap(map)).toThrow(/Souřadnice/);
  });
  it("uses safe portable filenames", () => {
    expect(exportFilename("Plán / test: 2026?", "json")).toBe("Plán - test- 2026-.json");
    expect(exportFilename("...", "svg")).toBe("saturnin-mapa.svg");
  });
});

describe("standalone image export", () => {
  it("includes distant and negative coordinates in the full graph bounds", () => {
    const map = sample();
    map.nodes[0].x = -2000;
    map.nodes[1].x = 5000;
    const image = renderMindMapSvg(map);
    expect(image.width).toBeGreaterThan(7000);
    expect(image.svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    for (const node of map.nodes) expect(image.svg).toContain(`translate(${node.x},${node.y})`);
  });
  it("escapes untrusted text and ignores CSS/URL colors", () => {
    const map = sample();
    map.title = '<script>alert("x")</script>';
    map.nodes[0].text = "<image href='https://example.com/private'>";
    map.nodes[0].color = "url(https://example.com/private)";
    const { svg } = renderMindMapSvg(map);
    expect(svg).not.toContain("<script>");
    expect(svg).not.toContain("<image");
    expect(svg).not.toContain("url(https:");
    expect(svg).toContain("&lt;script&gt;");
  });
  it("renders an empty map with a usable viewBox", () => {
    const { width, height, svg } = renderMindMapSvg({ ...sample(), nodes: [], connections: [] });
    expect(width).toBe(640);
    expect(height).toBe(416);
    expect(svg).toContain('viewBox="0 0 640 416"');
  });
});
