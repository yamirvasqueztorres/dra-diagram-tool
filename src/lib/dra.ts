export type Relation = string;

export interface RelationType {
  code: string;
  label: string;
  colorVar: string;
  softVar: string;
}

export interface ReasonType {
  code: number;
  label: string;
}

// Tipos de relación estándar (DRA clásico)
export const DEFAULT_RELATIONS: RelationType[] = [
  { code: "A", label: "Absolutamente necesario", colorVar: "var(--rel-a)", softVar: "var(--rel-a-soft)" },
  { code: "E", label: "Esencial", colorVar: "var(--rel-e)", softVar: "var(--rel-e-soft)" },
  { code: "I", label: "Importante", colorVar: "var(--rel-i)", softVar: "var(--rel-i-soft)" },
  { code: "O", label: "Ordinario", colorVar: "var(--rel-o)", softVar: "var(--rel-o-soft)" },
  { code: "U", label: "Sin importancia", colorVar: "var(--rel-u)", softVar: "var(--rel-u-soft)" },
  { code: "X", label: "No recomendado", colorVar: "var(--rel-x)", softVar: "var(--rel-x-soft)" },
];

// Motivos estándar para manufactura (DRA clásico)
export const DEFAULT_REASONS: ReasonType[] = [
  { code: 1, label: "Flujo de materiales" },
  { code: 2, label: "Comparten personal" },
  { code: 3, label: "Comparten equipo" },
  { code: 4, label: "Conveniencia / supervisión" },
  { code: 5, label: "Ruido / vibraciones" },
  { code: 6, label: "Higiene / contaminación" },
  { code: 7, label: "Seguridad" },
  { code: 8, label: "Comunicación" },
  { code: 9, label: "Secuencia de operaciones" },
  { code: 10, label: "Requisitos de espacio" },
  { code: 11, label: "Control de calidad" },
  { code: 12, label: "Mantenimiento" },
  { code: 13, label: "Almacenamiento" },
];

// Estado para tipos y motivos personalizados
export interface CustomConfig {
  relations: RelationType[];
  reasons: ReasonType[];
}

export const DEFAULT_CONFIG: CustomConfig = {
  relations: [...DEFAULT_RELATIONS],
  reasons: [...DEFAULT_REASONS],
};

// Funciones para obtener configuración actual (puede ser extendida)
export let RELATIONS: RelationType[] = [...DEFAULT_RELATIONS];
export let REASONS: ReasonType[] = [...DEFAULT_REASONS];

// Función para inicializar/actualizar la configuración
export function setCustomConfig(config: Partial<CustomConfig>): void {
  if (config.relations) {
    RELATIONS = [...DEFAULT_RELATIONS, ...config.relations.filter(r => !DEFAULT_RELATIONS.some(dr => dr.code === r.code))];
  }
  if (config.reasons) {
    REASONS = [...DEFAULT_REASONS, ...config.reasons.filter(r => !DEFAULT_REASONS.some(dr => dr.code === r.code))];
  }
}

// Función para resetear a configuración por defecto
export function resetToDefaultConfig(): void {
  RELATIONS = [...DEFAULT_RELATIONS];
  REASONS = [...DEFAULT_REASONS];
}

// Función para agregar un tipo de relación personalizado
export function addCustomRelation(code: string, label: string, colorVar?: string, softVar?: string): void {
  if (RELATIONS.some(r => r.code === code)) return;
  
  // Generar colores por defecto para códigos personalizados
  const colors = [
    "oklch(0.65 0.15 240)", // Azul
    "oklch(0.65 0.18 145)", // Verde
    "oklch(0.75 0.17 75)",  // Amarillo
    "oklch(0.6 0.2 305)",   // Morado
    "oklch(0.65 0.02 240)", // Gris
    "oklch(0.62 0.22 27)",  // Rojo
    "oklch(0.7 0.15 330)",  // Rosa
    "oklch(0.6 0.18 210)",  // Cian
    "oklch(0.75 0.12 90)",  // Verde lima
    "oklch(0.65 0.1 270)",  // Lila
  ];
  
  const existingCodes = RELATIONS.map(r => r.code);
  const colorIndex = existingCodes.length % colors.length;
  
  RELATIONS.push({
    code,
    label,
    colorVar: colorVar || colors[colorIndex],
    softVar: softVar || colors[colorIndex].replace('0.', '0.9').replace('0.0', '0.05').replace('0.1', '0.1').replace('0.2', '0.1'),
  });
}

// Función para agregar un motivo personalizado
export function addCustomReason(code: number, label: string): void {
  if (REASONS.some(r => r.code === code)) return;
  REASONS.push({ code, label });
  // Ordenar por código
  REASONS.sort((a, b) => a.code - b.code);
}

// Función para obtener un tipo de relación por código
export function getRelationByCode(code: string): RelationType | undefined {
  return RELATIONS.find(r => r.code === code);
}

// Función para obtener un motivo por código
export function getReasonByCode(code: number): ReasonType | undefined {
  return REASONS.find(r => r.code === code);
}

export interface Item { id: string; name: string }
export interface Cell { rel: Relation; reason?: number }
export interface DRAState {
  items: Item[];
  cells: Record<string, Cell>; // key "i-j" with i<j (indices)
  customConfig?: CustomConfig; // Configuración personalizada opcional
}

export const cellKey = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);

export const newId = () => Math.random().toString(36).slice(2, 9);
