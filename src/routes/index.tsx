import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { DRADiagram, DRALegend, DRAInfoModal } from "@/components/DRADiagram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RELATIONS, REASONS, cellKey, newId, type DRAState, type Relation, addCustomRelation, addCustomReason, resetToDefaultConfig } from "@/lib/dra";
import { exportJPG, exportJSON, exportPDF, exportPNG, exportSVG, exportCSV, importJSON, importCSV } from "@/lib/dra-io";
import { Trash2, Plus, Upload, FileJson, FileImage, FileText, FileSpreadsheet, RotateCcw, Info, Settings } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [showReasonNumbers, setShowReasonNumbers] = useState(true);
  const [newRelationCode, setNewRelationCode] = useState("");
  const [newRelationLabel, setNewRelationLabel] = useState("");
  const [newReasonCode, setNewReasonCode] = useState("");
  const [newReasonLabel, setNewReasonLabel] = useState("");
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

  // Cargar configuración personalizada al montar el componente
  useEffect(() => {
    // Si el estado tiene configuración personalizada, aplicarla
    if (state.customConfig) {
      if (state.customConfig.relations) {
        state.customConfig.relations.forEach(r => addCustomRelation(r.code, r.label, r.colorVar, r.softVar));
      }
      if (state.customConfig.reasons) {
        state.customConfig.reasons.forEach(r => addCustomReason(r.code, r.label));
      }
    }
  }, []);

  const handleAddCustomRelation = () => {
    const code = newRelationCode.trim().toUpperCase();
    const label = newRelationLabel.trim();
    if (!code || !label) {
      toast.error("Debes ingresar código y descripción");
      return;
    }
    if (RELATIONS.some(r => r.code === code)) {
      toast.error(`El código "${code}" ya existe`);
      return;
    }
    addCustomRelation(code, label);
    setNewRelationCode("");
    setNewRelationLabel("");
    toast.success(`Tipo de relación "${code}" agregado`);
  };

  const handleAddCustomReason = () => {
    const codeStr = newReasonCode.trim();
    const label = newReasonLabel.trim();
    if (!codeStr || !label) {
      toast.error("Debes ingresar código y descripción");
      return;
    }
    const code = parseInt(codeStr, 10);
    if (isNaN(code)) {
      toast.error("El código debe ser un número");
      return;
    }
    if (REASONS.some(r => r.code === code)) {
      toast.error(`El código "${code}" ya existe`);
      return;
    }
    addCustomReason(code, label);
    setNewReasonCode("");
    setNewReasonLabel("");
    toast.success(`Motivo "${code}" agregado`);
  };

  const handleResetConfig = () => {
    resetToDefaultConfig();
    setState(s => ({ ...s, customConfig: undefined }));
    toast.success("Configuración reiniciada a valores por defecto");
  };

  const onCellClick = (i: number, j: number) => setSelected(cellKey(i, j));

  const selectedCell = selected ? state.cells[selected] : undefined;

  const handleSetCellWithReason = (key: string, rel: Relation, reason?: number) => {
    setCell(key, rel, reason);
    setSelected(null);
  };

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
          {/* Columna izquierda: Ítems + Tipos de Relación + Configuración */}
          <aside className="space-y-6">
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold">Ítems</h2>
                <Button
                  onClick={() => setShowInfoModal(true)}
                  variant="ghost"
                  size="icon"
                  title="Acerca del DRA"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
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
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground">Tipos de Relación</h3>
                <Button
                  onClick={() => setShowCustomConfig(!showCustomConfig)}
                  variant="ghost"
                  size="icon"
                  title="Configurar tipos y motivos"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
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

            {/* Configuración personalizada */}
            {showCustomConfig && (
              <section className="rounded-lg border border-border bg-card p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">Configuración Personalizada</h3>
                  <Button
                    onClick={handleResetConfig}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agregar Tipo de Relación</h4>
                    <div className="flex gap-2">
                      <Input
                        value={newRelationCode}
                        onChange={(e) => setNewRelationCode(e.target.value)}
                        placeholder="Código (ej: XX)"
                        className="h-8"
                        maxLength={2}
                      />
                      <Input
                        value={newRelationLabel}
                        onChange={(e) => setNewRelationLabel(e.target.value)}
                        placeholder="Descripción"
                        className="h-8 flex-1"
                      />
                      <Button
                        onClick={handleAddCustomRelation}
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ejemplo: XX para "Extremadamente no recomendado"
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agregar Motivo</h4>
                    <div className="flex gap-2">
                      <Input
                        value={newReasonCode}
                        onChange={(e) => setNewReasonCode(e.target.value)}
                        placeholder="Código (número)"
                        className="h-8"
                        type="number"
                      />
                      <Input
                        value={newReasonLabel}
                        onChange={(e) => setNewReasonLabel(e.target.value)}
                        placeholder="Descripción"
                        className="h-8 flex-1"
                      />
                      <Button
                        onClick={handleAddCustomReason}
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ejemplo: 14 para "Control de temperatura"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-reason-numbers"
                      checked={showReasonNumbers}
                      onCheckedChange={setShowReasonNumbers}
                    />
                    <Label htmlFor="show-reason-numbers" className="text-xs cursor-pointer">
                      Mostrar números de motivo en diagrama
                    </Label>
                  </div>
                </div>
              </section>
            )}

            <DRALegend />
          </aside>

          {/* Columna central: Diagrama */}
          <div className="min-w-0">
            <DRADiagram
              items={state.items}
              cells={state.cells}
              cellSize={size}
              onCellClick={onCellClick}
              selectedKey={selected}
              showReasonNumbers={showReasonNumbers}
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

      {/* Modal de información DRA */}
      <DRAInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

      {/* Modal para seleccionar relación y motivo */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Relación</DialogTitle>
            <DialogDescription>
              {selected && (() => {
                const [a, b] = selected.split("-").map(Number);
                return <span>{state.items[a]?.name} ↔ {state.items[b]?.name}</span>;
              })()}
            </DialogDescription>
          </DialogHeader>
          {selected && (() => {
            const [, ] = selected.split("-").map(Number);
            const [selectedRel, setSelectedRel] = useState<Relation | "">(selectedCell?.rel || "");
            const [selectedReason, setSelectedReason] = useState<number | undefined>(selectedCell?.reason);

            return (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {RELATIONS.map((r) => {
                    const active = selectedRel === r.code;
                    return (
                      <button
                        key={r.code}
                        onClick={() => {
                          setSelectedRel(selectedRel === r.code ? "" : r.code);
                          if (selectedRel === r.code) setSelectedReason(undefined);
                        }}
                        title={r.label}
                        className={`h-12 w-12 rounded-md font-bold text-white text-lg transition-transform hover:scale-110 ${active ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                        style={{ backgroundColor: r.colorVar }}
                      >
                        {r.code}
                      </button>
                    );
                  })}
                </div>

                {selectedRel && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Motivo (opcional)</h4>
                    <div className="flex flex-wrap gap-1">
                      {REASONS.map((r) => (
                        <button
                          key={r.code}
                          onClick={() => setSelectedReason(selectedReason === r.code ? undefined : r.code)}
                          className={`px-3 py-1 rounded-md text-sm font-mono transition-colors ${
                            selectedReason === r.code
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-accent text-foreground"
                          }`}
                        >
                          {r.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => { setCell(selected, ""); setSelected(null); }}
                  >
                    Limpiar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleSetCellWithReason(selected, selectedRel, selectedReason);
                    }}
                    disabled={!selectedRel}
                  >
                    Aplicar
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}