import { RELATIONS, REASONS, type Cell, type Item, type Relation, cellKey } from "@/lib/dra";

interface Props {
  items: Item[];
  cells: Record<string, Cell>;
  cellSize?: number; // diamond width
  onCellClick?: (i: number, j: number) => void;
  selectedKey?: string | null;
}

export function DRADiagram({ items, cells, cellSize = 64, onCellClick, selectedKey }: Props) {
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

  const relColor = (r: Relation) => RELATIONS.find((x) => x.code === r)?.colorVar ?? "currentColor";
  const relSoft = (r: Relation) => RELATIONS.find((x) => x.code === r)?.softVar ?? "var(--background)";

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
                {cell?.reason !== undefined && (
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
