import { DEFAULT_RELATIONS, DEFAULT_REASONS, RELATIONS, REASONS, type Cell, type Item, cellKey } from "@/lib/dra";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface Props {
  items: Item[];
  cells: Record<string, Cell>;
  cellSize?: number; // diamond width
  onCellClick?: (i: number, j: number) => void;
  selectedKey?: string | null;
  showReasonNumbers?: boolean; // Mostrar números de motivo debajo del símbolo
}

export function DRADiagram({ items, cells, cellSize = 64, onCellClick, selectedKey, showReasonNumbers = true }: Props) {
  const W = cellSize;
  const H = cellSize / 2; // 2:1 ratio
  const N = items.length;
  const labelWidth = 320;
  const numWidth = 36;

  if (N === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
        Agrega ítems para comenzar tu Diagrama de Relaciones
      </div>
    );
  }

  const gridWidth = N * W / 2 + W / 2;
  const gridHeight = N * H;
  const totalWidth = numWidth + labelWidth + gridWidth + 20;
  const totalHeight = Math.max(gridHeight, N * H) + 20;

  const diamonds: Array<{ i: number; j: number; cx: number; cy: number; cell?: Cell }> = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const cx = (j - i) * W / 2;
      const cy = (i + j) * H / 2 + H / 2;
      diamonds.push({ i, j, cx, cy, cell: cells[cellKey(i, j)] });
    }
  }



  return (
    <div className="overflow-auto rounded-lg border border-border bg-card p-4">
      <svg
        id="dra-svg"
        xmlns="http://www.w3.org/2000/svg"
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{ background: "var(--card)" }}
      >
        {/* Items list */}
        {items.map((item, i) => {
          const y = i * H;
          return (
            <g key={item.id}>
              <rect x={0} y={y} width={numWidth} height={H} fill="var(--secondary)" stroke="var(--border)" />
              <text x={numWidth / 2} y={y + H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(H * 0.5, 14)} fill="var(--foreground)" fontWeight="600">
                {i + 1}
              </text>
              <rect x={numWidth} y={y} width={labelWidth} height={H} fill="var(--card)" stroke="var(--border)" />
              <text x={numWidth + 8} y={y + H / 2} dominantBaseline="middle" fontSize={Math.min(H * 0.45, 13)} fill="var(--foreground)">
                {item.name.length > 48 ? item.name.slice(0, 46) + "…" : item.name}
              </text>
            </g>
          );
        })}

        {/* Diamond grid */}
        <g transform={`translate(${numWidth + labelWidth}, 0)`}>
          {diamonds.map(({ i, j, cx, cy, cell }) => {
            const k = cellKey(i, j);
            const points = [
              `${cx},${cy - H / 2}`,
              `${cx + W / 2},${cy}`,
              `${cx},${cy + H / 2}`,
              `${cx - W / 2},${cy}`,
            ].join(" ");
            const isSelected = selectedKey === k;
            const relSoft = (r: string) => RELATIONS.find((x) => x.code === r)?.softVar ?? "var(--background)";
            const fill = cell ? relSoft(cell.rel) : "var(--background)";
            const stroke = isSelected ? "var(--primary)" : "var(--border)";
            return (
              <g
                key={k}
                style={{ cursor: onCellClick ? "pointer" : "default" }}
                onClick={() => onCellClick?.(i, j)}
              >
                <polygon points={points} fill={fill} stroke={stroke} strokeWidth={isSelected ? 2 : 1} />
                {cell && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(H * 0.5, 16)}
                    fontWeight="700"
                    fill="var(--foreground)"
                  >
                    {cell.rel}
                  </text>
                )}
                {cell?.reason !== undefined && showReasonNumbers && (
                  <text
                    x={cx}
                    y={cy + H * 0.28}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(H * 0.32, 10)}
                    fill="var(--muted-foreground)"
                  >
                    {cell.reason}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function DRALegend() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Códigos de relación</h3>
        <ul className="space-y-1 text-sm">
          {RELATIONS.map((r) => (
            <li key={r.code} className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded font-bold" style={{ color: r.colorVar, background: `color-mix(in oklab, ${r.colorVar} 15%, transparent)` }}>
                {r.code}
              </span>
              <span className="text-muted-foreground">{r.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Motivos</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {REASONS.map((r) => (
            <li key={r.code}><span className="font-mono font-semibold text-foreground">{r.code}</span> — {r.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DRAInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Diagrama de Relación de Actividades (DRA)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold mb-2">Concepto</h3>
            <p className="text-muted-foreground">
              El Diagrama de Relación de Actividades (DRA) es una herramienta gráfica utilizada en ingeniería industrial y diseño de layouts 
              para analizar y optimizar la disposición física de áreas, departamentos o equipos dentro de una instalación.
            </p>
            <p className="text-muted-foreground mt-2">
              Su objetivo principal es minimizar los costos de transporte y manejo de materiales, mejorando la eficiencia operativa 
              mediante la identificación de relaciones de cercanía entre actividades o áreas.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Finalidad</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Optimizar la distribución física de instalaciones</li>
              <li>Reducir distancias de transporte de materiales</li>
              <li>Minimizar costos operativos</li>
              <li>Mejorar la seguridad y el flujo de trabajo</li>
              <li>Facilitar la comunicación entre áreas relacionadas</li>
              <li>Identificar cuellos de botella en los procesos</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Tipos de Relación</h3>
            <p className="text-muted-foreground mb-3">
              Los códigos de relación indican el grado de importancia de la cercanía entre dos actividades:
            </p>
            <div className="space-y-2">
              {DEFAULT_RELATIONS.map((r) => (
                <div key={r.code} className="flex items-start gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded font-bold flex-shrink-0" 
                        style={{ color: r.colorVar, background: `color-mix(in oklab, ${r.colorVar} 15%, transparent)` }}>
                    {r.code}
                  </span>
                  <div>
                    <span className="font-medium">{r.code} - {r.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-3">
              Nota: Pueden agregarse tipos personalizados según las necesidades específicas del proyecto.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Motivos de Relación</h3>
            <p className="text-muted-foreground mb-3">
              Los motivos de relación (números) indican la razón específica por la cual dos actividades deben estar cerca o separadas.
              En manufactura, los más comunes son:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_REASONS.map((r) => (
                <div key={r.code} className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-foreground flex-shrink-0">{r.code}</span>
                  <span className="text-muted-foreground">{r.label}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs mt-3">
              Nota: Pueden agregarse motivos personalizados (hasta 13+ en manufactura estándar).
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Metodología</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Listar todas las actividades/áreas a distribuir</li>
              <li>Evaluar la relación entre cada par de actividades usando los códigos A, E, I, O, U, X</li>
              <li>Asignar el motivo específico (número) para cada relación</li>
              <li>Construir el diagrama triangular con los símbolos y números</li>
              <li>Analizar el diagrama para identificar agrupaciones lógicas</li>
              <li>Desarrollar el layout físico basado en las relaciones identificadas</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Interpretación del Diagrama</h3>
            <p className="text-muted-foreground">
              En el diagrama triangular:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
              <li>Cada celda representa la relación entre dos actividades</li>
              <li>La letra en la celda indica el <strong>tipo de relación</strong> (A, E, I, O, U, X)</li>
              <li>El número debajo de la letra indica el <strong>motivo de la relación</strong></li>
              <li>Las celdas vacías indican que no se ha definido una relación</li>
              <li>El color de fondo de cada celda corresponde al tipo de relación</li>
            </ul>
          </section>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
