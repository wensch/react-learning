import { spring, useVideoConfig } from "remotion";
import type { SceneOf } from "../../../shared/lesson";
import { C, MONO, stagger } from "../theme";
import { SceneFrame, card, useSceneProgress, type SceneProps } from "./common";
import { tokenizeLine } from "./Code";

/** O código acende linha a linha acompanhando os passos da narração. */
export function CodeScene({ scene, duration }: SceneProps<SceneOf<"code">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const lines = scene.code.split("\n");
  // Cabe na altura útil e na largura do painel (monoespaçada: ~0.6em por caractere).
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const byHeight = lines.length > 12 ? 18 : lines.length > 9 ? 22 : lines.length > 7 ? 26 : 29;
  const byWidth = Math.floor(740 / (0.6 * maxLen));
  const fontSize = Math.max(15, Math.min(byHeight, byWidth));
  const lineH = fontSize * 1.5;

  const steps = scene.steps;
  const start = 0.14;
  const end = 0.96;
  const stepIdx = steps.length && p >= start ? Math.min(steps.length - 1, Math.floor(((p - start) / (end - start)) * steps.length)) : -1;
  const active = stepIdx >= 0 ? new Set(steps[stepIdx].lines) : null;
  const caption = stepIdx >= 0 ? steps[stepIdx].caption : "";
  const stepStart = stepIdx >= 0 ? (start + ((end - start) * stepIdx) / steps.length) * duration : 0;
  const capIn = stepIdx >= 0 ? Math.min(1, (frame - stepStart) / 9) : 0;

  return (
    <SceneFrame duration={duration} heading={scene.heading}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ ...card, flex: "1 1 0", minWidth: 0, background: "#0c1226", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderBottom: `1px solid ${C.line}`, color: C.muted, fontFamily: MONO, fontSize: 18 }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#fb7185" }} />
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#fbbf24" }} />
            <span style={{ width: 12, height: 12, borderRadius: 6, background: "#4ade80" }} />
            <span style={{ marginLeft: 10 }}>{scene.filename}</span>
          </div>
          <div style={{ padding: "12px 0", position: "relative" }}>
            {lines.map((line, i) => {
              const ln = i + 1;
              const appear = spring({ frame: frame - stagger(i, lines.length, 0.02, 0.12) * duration, fps, config: { damping: 20, stiffness: 140 } });
              const on = active ? active.has(ln) : true;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    height: lineH,
                    alignItems: "center",
                    fontFamily: MONO,
                    fontSize,
                    opacity: Math.min(1, appear * 1.6) * (on ? 1 : 0.4),
                    transform: `translateX(${(1 - appear) * -18}px)`,
                    background: active && on ? "rgba(124,156,255,.16)" : "transparent",
                    borderLeft: `5px solid ${active && on ? C.accent : "transparent"}`,
                  }}
                >
                  <span style={{ width: 54, textAlign: "right", paddingRight: 20, color: "#4a5a8f", flex: "none" }}>{ln}</span>
                  <span style={{ whiteSpace: "pre" }}>
                    {line === "" ? " " : tokenizeLine(line).map((t, j) => (
                      <span key={j} style={{ color: t.color, fontStyle: t.italic ? "italic" : "normal" }}>
                        {t.text}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ width: 290, flex: "none", paddingTop: 6 }}>
          {steps.length > 0 ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ height: 8, flex: 1, borderRadius: 4, background: i <= stepIdx ? C.accent : C.line }} />
                ))}
              </div>
              <div style={{ fontSize: 32, fontWeight: 650, lineHeight: 1.25, opacity: capIn * (p < start ? 0 : 1), transform: `translateY(${(1 - capIn) * 12}px)` }}>
                {caption}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </SceneFrame>
  );
}
