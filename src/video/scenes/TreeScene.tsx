import { spring, useVideoConfig } from "remotion";
import type { SceneOf } from "../../../shared/lesson";
import { C, MONO, stagger } from "../theme";
import { SceneFrame, card, useSceneProgress, type SceneProps } from "./common";

const BOX_W = 176;
const BOX_H = 58;
const AREA = { x: 72, y: 150, w: 1136, h: 320 };

type N = SceneOf<"tree">["nodes"][number];
type Placed = { node: N; x: number; y: number; depth: number };

/** Layout em árvore: folhas ocupam colunas, pais ficam centrados sobre os filhos. */
function placeTree(nodes: N[]): Placed[] {
  const children = new Map<string, N[]>();
  const roots: N[] = [];
  for (const nd of nodes) {
    if (!nd.parent) roots.push(nd);
    else children.set(nd.parent, [...(children.get(nd.parent) ?? []), nd]);
  }
  const placed = new Map<string, { x: number; depth: number }>();
  let leaf = 0;
  let maxDepth = 0;
  const walk = (nd: N, depth: number, seen: Set<string>): number => {
    if (seen.has(nd.id)) return leaf;
    seen.add(nd.id);
    maxDepth = Math.max(maxDepth, depth);
    const kids = children.get(nd.id) ?? [];
    let x: number;
    if (kids.length === 0) x = leaf++;
    else {
      const xs = kids.map((k) => walk(k, depth + 1, seen));
      x = (Math.min(...xs) + Math.max(...xs)) / 2;
    }
    placed.set(nd.id, { x, depth });
    return x;
  };
  const seen = new Set<string>();
  roots.forEach((r) => walk(r, 0, seen));
  const cols = Math.max(1, leaf);
  return nodes
    .filter((nd) => placed.has(nd.id))
    .map((nd) => {
      const pl = placed.get(nd.id)!;
      return {
        node: nd,
        depth: pl.depth,
        x: AREA.x + ((pl.x + 0.5) * AREA.w) / cols,
        y: AREA.y + 40 + (maxDepth === 0 ? 0 : (pl.depth * (AREA.h - 90)) / maxDepth),
      };
    });
}

export function TreeScene({ scene, duration }: SceneProps<SceneOf<"tree">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const placed = placeTree(scene.nodes);
  const byId = new Map(placed.map((pl) => [pl.node.id, pl]));
  const steps = scene.steps;
  const start = 0.22;
  const stepIdx = steps.length && p >= start ? Math.min(steps.length - 1, Math.floor(((p - start) / (0.97 - start)) * steps.length)) : -1;
  const hot = new Set(stepIdx >= 0 ? steps[stepIdx].highlight : []);
  const caption = stepIdx >= 0 ? steps[stepIdx].caption : "";

  return (
    <SceneFrame duration={duration} heading={scene.heading}>
      <svg width={1280} height={590} style={{ position: "absolute", left: -72, top: -44 }}>
        {placed.map((pl, i) => {
          const parent = pl.node.parent ? byId.get(pl.node.parent) : undefined;
          if (!parent) return null;
          const o = Math.min(1, Math.max(0, (p - stagger(i, placed.length, 0, 0.18)) * 12));
          const lit = hot.has(pl.node.id) && hot.has(parent.node.id);
          return <line key={pl.node.id} x1={parent.x} y1={parent.y + BOX_H / 2} x2={pl.x} y2={pl.y - BOX_H / 2} stroke={lit ? C.warn : C.line} strokeWidth={lit ? 4 : 3} opacity={o} />;
        })}
      </svg>
      {placed.map((pl, i) => {
        const s = spring({ frame: frame - stagger(i, placed.length, 0.02, 0.2) * duration, fps, config: { damping: 14, stiffness: 120 } });
        const on = hot.has(pl.node.id);
        const pulse = on ? 0.5 + 0.5 * Math.sin(frame / 6) : 0;
        return (
          <div key={pl.node.id} style={{ position: "absolute", left: pl.x - BOX_W / 2 - 72, top: pl.y - BOX_H / 2 - 44, width: BOX_W, textAlign: "center", transform: `scale(${s})`, opacity: Math.min(1, s * 2) }}>
            <div
              style={{
                ...card,
                height: BOX_H,
                boxSizing: "border-box",
                display: "grid",
                placeItems: "center",
                fontFamily: MONO,
                fontSize: 25,
                fontWeight: 700,
                color: on ? "#1a1200" : C.text,
                background: on ? C.warn : C.panel,
                borderColor: on ? C.warn : C.line,
                boxShadow: on ? `0 0 ${16 + pulse * 26}px ${C.warn}88` : card.boxShadow,
                transform: `scale(${1 + pulse * 0.04})`,
              }}
            >
              {`<${pl.node.label} />`}
            </div>
            {pl.node.badge ? (
              <div style={{ position: "absolute", top: -16, right: -22, fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#062a25", background: C.accent2, borderRadius: 999, padding: "3px 12px", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}>
                {pl.node.badge}
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 34, fontWeight: 650, color: C.warn, opacity: caption ? 1 : 0 }}>{caption}</div>
    </SceneFrame>
  );
}
