import { spring, useVideoConfig } from "remotion";
import type { SceneOf } from "../../../shared/lesson";
import { C, ease, stagger } from "../theme";
import { SceneFrame, card, useSceneProgress, type SceneProps } from "./common";

const BOX_W_WIDE = 232;
const BOX_W_NARROW = 196;
const BOX_H = 84;
const AREA = { x: 72, y: 150, w: 1136, h: 420 };

type Pt = { x: number; y: number };

function layoutNodes(layout: "row" | "cycle", n: number): Pt[] {
  if (layout === "cycle") {
    const cx = AREA.x + AREA.w / 2;
    const cy = AREA.y + AREA.h / 2 - 6;
    const rx = 400;
    const ry = 150;
    return Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    });
  }
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // Linha de baixo em "cobrinha" para a seta nunca cruzar o desenho.
    const c = row % 2 === 0 ? col : perRow - 1 - col;
    return {
      x: AREA.x + ((c + 0.5) * AREA.w) / perRow,
      y: rows === 1 ? AREA.y + AREA.h / 2 - 20 : AREA.y + 90 + row * 200,
    };
  });
}

/** Ponto onde a reta que sai de `a` em direção a `b` cruza a borda do retângulo de `a`. */
function edgePoint(a: Pt, b: Pt, gap: number, BOX_W: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.min(dx !== 0 ? BOX_W / 2 / Math.abs(dx) : Infinity, dy !== 0 ? BOX_H / 2 / Math.abs(dy) : Infinity);
  const len = Math.hypot(dx, dy) || 1;
  return { x: a.x + dx * t + (dx / len) * gap, y: a.y + dy * t + (dy / len) * gap };
}

export function DiagramScene({ scene, duration }: SceneProps<SceneOf<"diagram">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const n = scene.nodes.length;
  const pos = layoutNodes(scene.layout, n);
  const BOX_W = n >= 4 && scene.layout === "row" ? BOX_W_NARROW : BOX_W_WIDE;
  const index = new Map(scene.nodes.map((nd, i) => [nd.id, i]));

  return (
    <SceneFrame duration={duration} heading={scene.heading}>
      <svg width={1280} height={590} style={{ position: "absolute", left: -72, top: -44, overflow: "visible" }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={C.accent2} />
          </marker>
        </defs>
        {scene.edges.map((e, k) => {
          const i = index.get(e.from);
          const j = index.get(e.to);
          if (i === undefined || j === undefined) return null;
          const a = edgePoint(pos[i], pos[j], 6, BOX_W);
          const b = edgePoint(pos[j], pos[i], 10, BOX_W);
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const t0 = Math.max(stagger(i, n), stagger(j, n)) + 0.015;
          const draw = ease(p, t0, t0 + 0.07);
          return (
            <g key={k}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.accent2} strokeWidth={4} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} markerEnd={draw > 0.97 ? "url(#arrow)" : undefined} opacity={0.9} />
            </g>
          );
        })}
      </svg>
      {scene.edges.map((e, k) => {
        const i = index.get(e.from);
        const j = index.get(e.to);
        if (i === undefined || j === undefined || !e.label) return null;
        const t0 = Math.max(stagger(i, n), stagger(j, n)) + 0.06;
        const o = ease(p, t0, t0 + 0.05);
        const sameRow = Math.abs(pos[i].y - pos[j].y) < 4;
        const mx = (pos[i].x + pos[j].x) / 2 - 72;
        // Em fila, o rótulo fica acima das caixas (a seta é curta); no ciclo, junto da seta.
        const my = sameRow ? pos[i].y - BOX_H / 2 - 44 - 30 : (pos[i].y + pos[j].y) / 2 - 44 - 40;
        return (
          <div key={k} style={{ position: "absolute", left: mx, top: my, transform: "translateX(-50%)", opacity: o, fontSize: 22, color: C.accent2, background: C.bg, padding: "2px 10px", borderRadius: 8, fontWeight: 600, whiteSpace: "nowrap" }}>
            {e.label}
          </div>
        );
      })}
      {scene.nodes.map((nd, i) => {
        const s = spring({ frame: frame - stagger(i, n) * duration, fps, config: { damping: 13, stiffness: 120 } });
        const current = p >= stagger(i, n) && (i === n - 1 || p < stagger(i + 1, n));
        const pulse = current ? 0.5 + 0.5 * Math.sin(frame / 7) : 0;
        return (
          <div
            key={nd.id}
            style={{
              ...card,
              position: "absolute",
              left: pos[i].x - BOX_W / 2 - 72,
              top: pos[i].y - BOX_H / 2 - 44,
              width: BOX_W,
              height: BOX_H,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 12px",
              transform: `scale(${s})`,
              opacity: Math.min(1, s * 2),
              borderColor: current ? C.accent : C.line,
              background: current ? C.panelHi : C.panel,
              boxShadow: current ? `0 0 ${18 + pulse * 22}px ${C.accent}55` : card.boxShadow,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{nd.label}</div>
            {nd.note ? <div style={{ fontSize: 17, color: C.muted, marginTop: 4, lineHeight: 1.1 }}>{nd.note}</div> : null}
          </div>
        );
      })}
    </SceneFrame>
  );
}
