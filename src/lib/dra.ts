export type Relation = "A" | "E" | "I" | "O" | "U" | "X";

export const RELATIONS: { code: Relation; label: string; colorVar: string; softVar: string }[] = [
  { code: "A", label: "Absolutamente necesario", colorVar: "var(--rel-a)", softVar: "var(--rel-a-soft)" },
  { code: "E", label: "Esencial", colorVar: "var(--rel-e)", softVar: "var(--rel-e-soft)" },
  { code: "I", label: "Importante", colorVar: "var(--rel-i)", softVar: "var(--rel-i-soft)" },
  { code: "O", label: "Ordinario", colorVar: "var(--rel-o)", softVar: "var(--rel-o-soft)" },
  { code: "U", label: "Sin importancia", colorVar: "var(--rel-u)", softVar: "var(--rel-u-soft)" },
  { code: "X", label: "No recomendado", colorVar: "var(--rel-x)", softVar: "var(--rel-x-soft)" },
];

export const REASONS: { code: number; label: string }[] = [
  { code: 1, label: "Flujo de materiales" },
  { code: 2, label: "Comparten personal" },
  { code: 3, label: "Comparten equipo" },
  { code: 4, label: "Conveniencia / supervisión" },
  { code: 5, label: "Ruido / vibraciones" },
  { code: 6, label: "Higiene / contaminación" },
  { code: 7, label: "Seguridad" },
  { code: 8, label: "Comunicación" },
];

export interface Item { id: string; name: string }
export interface Cell { rel: Relation; reason?: number }
export interface DRAState {
  items: Item[];
  cells: Record<string, Cell>; // key "i-j" with i<j (indices)
}

export const cellKey = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);

export const newId = () => Math.random().toString(36).slice(2, 9);
