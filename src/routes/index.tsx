import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { DRADiagram } from "@/components/DRADiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RELATIONS, cellKey, newId, type DRAState, type Relation } from "@/lib/dra";
import { exportJPG, exportJSON, exportPDF, exportPNG, exportSVG, exportCSV, importJSON, importCSV } from "@/lib/dra-io";
import { Trash2, Plus, Upload, FileJson, FileImage, FileText, FileSpreadsheet, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DRA — Diagrama de Relaciones de Actividades" },
      { name: "description", content: "Crea, edita y exporta tu Diagrama de Relaciones de Actividades (DRA) con cualquier cantidad de ítems." },
    ],
  }),
});

function Index() {
  const [state, setState] = useState<DRAState>({ items: [], cells: {} });
  const [newName, setNewName] = useState("");
  const [size, setSize] = useState(80);
  const [selected, setSelected] = useState<string | null>(null);
  const fileRefJSON = useRef<HTMLInputElement>(null);
  const fileRefCSV = useRef<HTMLInputElement>(null);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    setState((s) => ({ ...s, items: [...s.items, { id: newId(), name }] }));
    setNewName("");
  };

  const removeItem = (idx: number) => {
    setState((s) => {
      const items = s.items.filter((_, i) => i !== idx);
      const cells: DRAState["cells"] = {};
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const oi = i >= idx ? i + 1 : i;
          const oj = j >= idx ? j + 1 : j;
          const old = s.cells[cellKey(oi, oj)];
          if (old) cells[cellKey(i, j)] = old;
        }
      }
      return { items, cells };
    });
    setSelected(null);
  };

  const renameItem = (idx: number, name: string) => {
    setState((s) => ({ ...s, items: s.items.map((it, i) => i === idx ? { ...it, name } : it) }));
  };

  const setCell = (key: string, rel: Relation | "", reason?: number) => {
    setState((s) => {
      const cells = { ...s.cells };
      if (!rel) delete cells[key];
      else cells[key] = { rel, reason };
      return { ...s, cells };
    });
  };

  const onCellClick = (i: number, j: number) => setSelected(cellKey(i, j));

  const selectedCell = selected ? state.cells[selected] : undefined;

  const handleImportJSON = async (file: File) => {
    try {
      const data = await importJSON(file);
      setState(data);
      toast.success(`Importado JSON: ${data.items.length} ítems`);
    } catch (e: any) {
      toast.error("Error al importar JSON: " + e.message);
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      const data = await importCSV(file);
      setState(data);
      toast.success(`Importado CSV: ${data.items.length} ítems`);
    } catch (e: any) {
      toast.error("Error al importar CSV: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Diagrama de Relaciones de Actividades</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea tu DRA con la cantidad de ítems que necesites. Exporta e importa fácilmente.
            </p>
          </div>
          <div className="w-64 flex-shrink-0">
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Tamaño de rombos</h3>
              <Slider value={[size]} min={40} max={140} step={4} onValueChange={(v) => setSize(v[0])} />
              <p className="mt-1 text-xs text-muted-foreground text-center">{size}px ancho · {size / 2}px alto (2:1)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_140px] gap-6">
          {/* Columna izquierda: Ítems + Tipos de Relación */}
          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Ítems</h2>
              <div className="mb-3 flex gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Nombre del ítem"
                />
                <Button onClick={addItem} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <ul className="space-y-2 max-h-80 overflow-auto">
                {state.items.map((it, i) => (
                  <li key={it.id} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-mono text-muted-foreground">{i + 1}</span>
                    <Input value={it.name} onChange={(e) => renameItem(i, e.target.value)} className="h-8" />
                    <Button onClick={() => removeItem(i)} variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
                {state.items.length === 0 && (
                  <li className="text-center text-xs text-muted-foreground py-4">Sin ítems. Agrega el primero.</li>
                )}
              </ul>
              {state.items.length > 0 && (
                <div className="mt-3 flex justify-end border-t border-border pt-3">
                  <Button
                    onClick={() => { setState({ items: [], cells: {} }); setSelected(null); }}
                    variant="outline"
                    size="sm"
                    className="hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <RotateCcw className="mr-1 h-4 w-4" /> Reiniciar
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Tipos de Relación</h3>
              <div className="space-y-2">
                {RELATIONS.map((r) => (
                  <div
                    key={r.code}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 transition-colors hover:bg-accent hover:border-foreground/30 cursor-default"
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded font-bold text-white text-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: r.colorVar }}
                    >
                      {r.code}
                    </span>
                    <span className="text-xs font-medium text-foreground">{r.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* Columna central: Diagrama */}
          <div className="min-w-0">
            <DRADiagram
              items={state.items}
              cells={state.cells}
              cellSize={size}
              onCellClick={onCellClick}
              selectedKey={selected}
            />
          </div>

          {/* Columna derecha: Importar y Exportar (ancho reducido) */}
          <aside className="space-y-6">
            {/* Importar JSON y CSV */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Importar</h3>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => fileRefJSON.current?.click()}
                  variant="secondary"
                  size="sm"
                  className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Upload className="mr-1 h-4 w-4" /> JSON
                </Button>
                <Button
                  onClick={() => fileRefCSV.current?.click()}
                  variant="secondary"
                  size="sm"
                  className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Upload className="mr-1 h-4 w-4" /> CSV
                </Button>
                <input
                  ref={fileRefJSON}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportJSON(f);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={fileRefCSV}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportCSV(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            {/* Exportar con CSV incluido */}
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Exportar</h3>
              <div className="flex flex-col gap-2">
                <Button onClick={exportPDF} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileText className="mr-1 h-4 w-4" /> PDF
                </Button>
                <Button onClick={exportPNG} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileImage className="mr-1 h-4 w-4" /> PNG
                </Button>
                <Button onClick={exportJPG} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileImage className="mr-1 h-4 w-4" /> JPG
                </Button>
                <Button onClick={exportSVG} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileImage className="mr-1 h-4 w-4" /> SVG
                </Button>
                <Button onClick={() => exportJSON(state)} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileJson className="mr-1 h-4 w-4" /> JSON
                </Button>
                <Button onClick={() => exportCSV(state)} variant="secondary" size="sm" className="w-full hover:bg-accent hover:text-accent-foreground transition-colors">
                  <FileSpreadsheet className="mr-1 h-4 w-4" /> CSV
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Relación</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const [a, b] = selected.split("-").map(Number);
            return (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {state.items[a]?.name} ↔ {state.items[b]?.name}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {RELATIONS.map((r) => {
                    const active = selectedCell?.rel === r.code;
                    return (
                      <button
                        key={r.code}
                        onClick={() => { setCell(selected, r.code); setSelected(null); }}
                        title={r.label}
                        className={`h-12 w-12 rounded-md font-bold text-white text-lg transition-transform hover:scale-110 ${active ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                        style={{ backgroundColor: r.colorVar }}
                      >
                        {r.code}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  className="w-full hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => { setCell(selected, ""); setSelected(null); }}
                >
                  Limpiar
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}