import { Easing, interpolate } from "remotion";

export const C = {
  bg: "#0a0f1f",
  panel: "#131b36",
  panelHi: "#1b2547",
  line: "#2a3766",
  text: "#e8edff",
  muted: "#93a1cc",
  accent: "#7c9cff",
  accent2: "#5eead4",
  warn: "#fbbf24",
  danger: "#fb7185",
  good: "#4ade80",
} as const;

export const FONT = `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
export const MONO = `ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`;

/** Área útil das cenas: o rodapé (legendas) fica livre. */
export const CONTENT_H = 570;
export const PAD_X = 72;

/** Progresso 0..1 de `frame` entre `start` e `end` (frações da cena), com easing suave. */
export function ease(p: number, start: number, end: number): number {
  return interpolate(p, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** Instante (0..1) em que o item `i` de `n` aparece, distribuído entre `from` e `to`. */
export function stagger(i: number, n: number, from = 0.08, to = 0.8): number {
  if (n <= 1) return from;
  return from + ((to - from) * i) / n;
}
