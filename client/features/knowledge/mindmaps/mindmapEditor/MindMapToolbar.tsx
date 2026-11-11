import { KeyboardEvent, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Download, Link2, Plus, Save, Share2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface MindMapToolbarProps {
  isCreatingNode: boolean;
  nodeName: string;
  onNodeNameChange: (v: string) => void;
  onAddNode: () => void;
  onCancelCreate: () => void;
  isConnecting: boolean;
  canConnect: boolean;
  onToggleConnect: () => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onExport?: (format: "png" | "json" | "svg") => void;
  onShare?: () => void;
  isPublic?: boolean;
  isExporting?: boolean;
}

export function MindMapToolbar({
  isCreatingNode,
  nodeName,
  onNodeNameChange,
  onAddNode,
  onCancelCreate,
  isConnecting,
  canConnect,
  onToggleConnect,
  hasUnsavedChanges,
  onSave,
  onExport,
  onShare,
  isPublic,
  isExporting,
}: MindMapToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingNode) inputRef.current?.focus();
  }, [isCreatingNode]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAddNode();
    } else if (e.key === "Escape") {
      onCancelCreate();
    }
  };

  return (
    <div className="p-2 border-b flex flex-wrap items-center gap-2">
      {isCreatingNode
        ? (
          <>
            <Input
              ref={inputRef}
              value={nodeName}
              onChange={(e) => onNodeNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Název nového uzlu"
              placeholder="Název uzlu..."
              className="w-48"
            />
            <Button size="sm" onClick={onAddNode} disabled={!nodeName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Přidat
            </Button>
            <Button aria-label="Zrušit vytvoření uzlu" size="sm" variant="ghost" onClick={onCancelCreate}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )
        : (
          <Button
            size="sm"
            onClick={() => {
              onCancelCreate();
              inputRef.current?.focus();
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nový uzel
          </Button>
        )}

      <div className="h-6 w-px bg-border mx-1" />

      <Button
        size="sm"
        variant={isConnecting ? "secondary" : "outline"}
        onClick={onToggleConnect}
        disabled={!canConnect}
        aria-pressed={isConnecting}
      >
        <Link2 className="h-4 w-4 mr-1" />
        Propojit
      </Button>

      <div className="h-6 w-px bg-border mx-1" />

      <Button size="sm" variant="outline" onClick={onSave} disabled={!hasUnsavedChanges}>
        <Save className="h-4 w-4 mr-1" />
        Uložit
      </Button>

      <span role="status" className="text-xs text-muted-foreground">
        {hasUnsavedChanges ? "Neuložené změny" : "Bez neuložených změn"}
      </span>

      {onExport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={isExporting}>
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? "Připravuji export…" : "Exportovat"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport("png")}>
              Exportovat jako PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("svg")}>
              Exportovat jako SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("json")}>
              Exportovat jako JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onShare && (
        <Button
          size="sm"
          variant="outline"
          onClick={onShare}
          className="ml-auto"
        >
          <Share2 className="h-4 w-4 mr-1" />
          {isPublic ? "Sdíleno" : "Sdílet"}
        </Button>
      )}
    </div>
  );
}
