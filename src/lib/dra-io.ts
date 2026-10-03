import { jsPDF } from "jspdf";
import type { DRAState } from "./dra";
import { cellKey, DEFAULT_RELATIONS, DEFAULT_REASONS, RELATIONS, REASONS, resetToDefaultConfig } from "./dra";

function getSvgString(): string | null {
  const svg = document.getElementById("dra-svg") as SVGSVGElement | null;
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Inline computed CSS variables to keep colors when exported
  const root = getComputedStyle(document.documentElement);
  const vars = ["--rel-a","--rel-e","--rel-i","--rel-o","--rel-u","--rel-x","--rel-a-soft","--rel-e-soft","--rel-i-soft","--rel-o-soft","--rel-u-soft","--rel-x-soft","--background","--foreground","--card","--border","--secondary","--muted-foreground","--primary"];
  let style = ":root{";
  vars.forEach(v => { style += `${v}:${root.getPropertyValue(v).trim()};`; });
  style += "}";
  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent = style;
  clone.insertBefore(styleEl, clone.firstChild);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportSVG() {
  const s = getSvgString(); if (!s) return;
  downloadBlob(new Blob([s], { type: "image/svg+xml" }), "dra.svg");
}

async function svgToCanvas(scale = 2): Promise<HTMLCanvasElement | null> {
  const svgStr = getSvgString(); if (!svgStr) return null;
  const svg = document.getElementById("dra-svg") as unknown as SVGSVGElement;
  const w = svg.viewBox.baseVal.width || svg.clientWidth;
  const h = svg.viewBox.baseVal.height || svg.clientHeight;
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
  const canvas = document.createElement("canvas");
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--card") || "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas;
}

export async function exportPNG() {
  const c = await svgToCanvas(2); if (!c) return;
  c.toBlob((b) => b && downloadBlob(b, "dra.png"), "image/png");
}

export async function exportJPG() {
  const c = await svgToCanvas(2); if (!c) return;
  c.toBlob((b) => b && downloadBlob(b, "dra.jpg"), "image/jpeg", 0.95);
}

export async function exportPDF() {
  const c = await svgToCanvas(2); if (!c) return;
  const dataUrl = c.toDataURL("image/png");
  const orientation = c.width >= c.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / c.width, pageH / c.height);
  const w = c.width * ratio;
  const h = c.height * ratio;
  pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save("dra.pdf");
}

export function exportJSON(state: DRAState) {
  // Incluir configuración personalizada si existe
  const exportData = {
    ...state,
    customConfig: state.customConfig || {
      relations: RELATIONS.filter(r => !DEFAULT_RELATIONS.some(dr => dr.code === r.code)),
      reasons: REASONS.filter(r => !DEFAULT_REASONS.some(dr => dr.code === r.code)),
    },
  };
  downloadBlob(new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" }), "dra.json");
}

export function exportCSV(state: DRAState) {
  const n = state.items.length;
  if (n === 0) {
    downloadBlob(new Blob([], { type: "text/csv" }), "dra.csv");
    return;
  }
  // Crear cabecera: primera celda vacía, luego nombres de ítems
  const headers = ['', ...state.items.map(item => item.name)];
  const rows = [headers];
  
  for (let i = 0; i < n; i++) {
    const row = [state.items[i].name];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        row.push('');
      } else if (i < j) {
        const key = cellKey(i, j);
        const cell = state.cells[key];
        // Incluir relación y motivo si existe: "A:1"
        row.push(cell ? (cell.reason !== undefined ? `${cell.rel}:${cell.reason}` : cell.rel) : '');
      } else {
        // Debajo de la diagonal, dejar vacío para evitar duplicados
        row.push('');
      }
    }
    rows.push(row);
  }
  
  const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'dra.csv');
}

export async function importJSON(file: File): Promise<DRAState> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data.items) || typeof data.cells !== "object") throw new Error("JSON inválido");
  
  // Si hay configuración personalizada, aplicarla
  if (data.customConfig) {
    resetToDefaultConfig();
    if (data.customConfig.relations && Array.isArray(data.customConfig.relations)) {
      data.customConfig.relations.forEach((r: { code: string; label: string; colorVar: string; softVar: string }) => {
        if (!RELATIONS.some(dr => dr.code === r.code)) {
          RELATIONS.push(r);
        }
      });
    }
    if (data.customConfig.reasons && Array.isArray(data.customConfig.reasons)) {
      data.customConfig.reasons.forEach((r: { code: number; label: string }) => {
        if (!REASONS.some(dr => dr.code === r.code)) {
          REASONS.push(r);
        }
      });
      REASONS.sort((a, b) => a.code - b.code);
    }
  }
  
  return data as DRAState;
}

export async function importCSV(file: File): Promise<DRAState> {
  // CSV format: first column = item name, list of items only (one per row).
  // OR matrix: first row headers, then NxN with relations (A,E,I,O,U,X,XX, etc.) — diagonal & lower ignored.
  // Also supports relations with reasons: "A:1", "E:2", etc.
  const text = (await file.text()).trim();
  const rows = text.split(/\r?\n/).map(r => r.split(",").map(c => c.trim().replace(/^"(.*)"$/, '$1')));
  if (rows.length === 0) throw new Error("CSV vacío");
  // Detect matrix: square (header row + N rows of N+1 cols)
  if (rows.length > 1 && rows[0].length === rows.length) {
    const items = rows[0].slice(1).map((name) => ({ id: Math.random().toString(36).slice(2,9), name }));
    const cells: DRAState["cells"] = {};
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const v = (rows[i + 1]?.[j + 1] ?? "").trim().toUpperCase();
        if (v) {
          // Parse relation and optional reason: "A:1" or "A"
          const match = v.match(/^([A-Z]+)(?::(\d+))?$/);
          if (match) {
            const rel = match[1];
            const reason = match[2] ? parseInt(match[2], 10) : undefined;
            // Validar que el tipo de relación existe (estándar o personalizado)
            const validRels = [...DEFAULT_RELATIONS.map((r: { code: string }) => r.code), ...RELATIONS.filter(r => !DEFAULT_RELATIONS.some((dr: { code: string }) => dr.code === r.code)).map((r: { code: string }) => r.code)];
            if (validRels.includes(rel)) {
              cells[`${i}-${j}`] = { rel, reason };
            }
          }
        }
      }
    }
    return { items, cells };
  }
  // Else: list of items (one column)
  const items = rows.map(r => r[0]).filter(Boolean).map(name => ({ id: Math.random().toString(36).slice(2,9), name }));
  return { items, cells: {} };
}