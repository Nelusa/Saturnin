// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { MindMapCreationSidebar } from "../MindMapCreationSidebar";
import { MindMapDeleteConfirmationDialog } from "../MindMapDeleteConfirmationDialog";

afterEach(cleanup);
describe("map form failure recovery", () => {
  it("keeps the entered title and dialog open when saving fails", async () => {
    const onClose = vi.fn(), onSave = vi.fn(async () => false);
    const router = createMemoryRouter([{ path: "/", element: <MindMapCreationSidebar isOpen onClose={onClose} onSave={onSave} /> }]);
    render(<RouterProvider router={router} />);
    fireEvent.change(screen.getByLabelText("Název myšlenkové mapy"), { target: { value: "  Moje souvislosti  " } });
    fireEvent.click(screen.getByRole("button", { name: "Vytvořit mapu" }));
    await screen.findByRole("alert");
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Moje souvislosti" }));
    expect(onClose).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Název myšlenkové mapy") as HTMLInputElement).value).toBe("  Moje souvislosti  ");
  });
  it("does not close or claim deletion when durable deletion fails", async () => {
    const onOpenChange = vi.fn();
    render(<MindMapDeleteConfirmationDialog open title="Moje mapa" onConfirm={async () => false} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Smazat" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("zůstala zachována"));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
