import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { MAX_BACKUP_BYTES, parseMindMapBackup } from "~/utils/knowledge/mindmapTransfer";
import { writeMindMap } from "~/utils/knowledge/mindmapStorage";
import type { MindMap } from "~/types/knowledge";

export function MindMapImportDialog({ open, onOpenChange, onImported }: {
  open: boolean; onOpenChange: (open: boolean) => void; onImported: (map: MindMap) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const importMap = () => {
    try {
      const map = parseMindMapBackup(text);
      writeMindMap(map);
      setText(""); setError(""); onOpenChange(false); onImported(map);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Import se nepodařil. Původní mapy zůstaly zachované."); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!reading) onOpenChange(value); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto" aria-describedby="map-import-description">
      <DialogHeader><DialogTitle>Importovat mapu</DialogTitle></DialogHeader>
      <p id="map-import-description" className="text-sm text-muted-foreground">Vyberte zálohu JSON ze Saturnina nebo vložte její obsah. Vznikne nová soukromá kopie; stávající mapy se nepřepíšou. Nejvýše 4 MB.</p>
      <input ref={input} type="file" accept=".json,application/json" className="sr-only" aria-label="Soubor se zálohou JSON" disabled={reading} onChange={async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError(""); setReading(true);
        try {
          if (file.size > MAX_BACKUP_BYTES) throw new Error("Soubor je větší než 4 MB.");
          setText(await file.text());
        } catch (cause) { setError(cause instanceof Error ? cause.message : "Soubor nelze přečíst."); }
        finally { setReading(false); if (input.current) input.current.value = ""; }
      }} />
      <Button variant="outline" disabled={reading} onClick={() => input.current?.click()}>{reading ? "Načítám…" : "Vybrat soubor JSON"}</Button>
      <label htmlFor="map-backup" className="text-sm font-medium">Obsah zálohy JSON</label>
      <Textarea id="map-backup" value={text} disabled={reading} onChange={event => { setText(event.target.value); setError(""); }} rows={7} className="font-mono text-xs" placeholder='{"format":"saturnin-mindmap","version":1,…}' />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={reading} onClick={() => onOpenChange(false)}>Zrušit</Button><Button disabled={!text.trim() || reading} onClick={importMap}>Importovat jako novou mapu</Button></div>
    </DialogContent>
  </Dialog>;
}
