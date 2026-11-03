// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MOCK_MINDMAPS } from "~/lib/data";
import { serializeMindMap } from "~/utils/knowledge/mindmapTransfer";
import { MindMapImportDialog } from "../MindMapImportDialog";

afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

describe("import recovery", () => {
  it("keeps malformed input open with an actionable error and preserves existing records", () => {
    localStorage.setItem("mindmaps", '[{"unknown":"keep"}]');
    const imported = vi.fn(), close = vi.fn();
    render(<MindMapImportDialog open onOpenChange={close} onImported={imported} />);
    fireEvent.change(screen.getByLabelText("Obsah zálohy JSON"), { target: { value: "{broken" } });
    fireEvent.click(screen.getByRole("button", { name: "Importovat jako novou mapu" }));
    expect(screen.getByRole("alert").textContent).toContain("platný JSON");
    expect((screen.getByLabelText("Obsah zálohy JSON") as HTMLTextAreaElement).value).toBe("{broken");
    expect(close).not.toHaveBeenCalled(); expect(imported).not.toHaveBeenCalled();
    expect(localStorage.getItem("mindmaps")).toBe('[{"unknown":"keep"}]');
  });
  it("does not close or report success when persistence fails", () => {
    const imported = vi.fn(), close = vi.fn();
    render(<MindMapImportDialog open onOpenChange={close} onImported={imported} />);
    fireEvent.change(screen.getByLabelText("Obsah zálohy JSON"), { target: { value: serializeMindMap(MOCK_MINDMAPS[0]) } });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Úložiště je plné."); });
    fireEvent.click(screen.getByRole("button", { name: "Importovat jako novou mapu" }));
    expect(screen.getByRole("alert").textContent).toContain("Úložiště je plné");
    expect(close).not.toHaveBeenCalled(); expect(imported).not.toHaveBeenCalled();
  });
  it("persists a new identity before reporting a successful import", () => {
    const original = MOCK_MINDMAPS[0];
    localStorage.setItem("mindmaps", JSON.stringify([original]));
    const imported = vi.fn(), close = vi.fn();
    render(<MindMapImportDialog open onOpenChange={close} onImported={imported} />);
    fireEvent.change(screen.getByLabelText("Obsah zálohy JSON"), { target: { value: serializeMindMap(original) } });
    fireEvent.click(screen.getByRole("button", { name: "Importovat jako novou mapu" }));
    const saved = JSON.parse(localStorage.getItem("mindmaps")!);
    expect(saved).toHaveLength(2); expect(saved[1]).toEqual(original);
    expect(saved[0].id).not.toBe(original.id); expect(imported).toHaveBeenCalledWith(saved[0]);
    expect(close).toHaveBeenCalledWith(false);
  });
});
