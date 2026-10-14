import { spring, useVideoConfig } from "remotion";
import type { SceneOf } from "../../../shared/lesson";
import { C, CONTENT_H, ease, stagger } from "../theme";
import { SceneFrame, card, useSceneProgress, type SceneProps } from "./common";
import { Code } from "./Code";

export function TitleScene({ scene, duration }: SceneProps<SceneOf<"title">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 90 } });
  const sub = ease(p, 0.08, 0.2);
  const line = ease(p, 0.05, 0.25);
  return (
    <SceneFrame duration={duration}>
      <div style={{ height: CONTENT_H - 44, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ width: 140 * line, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})` }} />
        <h1
          style={{
            margin: 0,
            fontSize: 84,
            lineHeight: 1.04,
            fontWeight: 800,
            letterSpacing: -2,
            maxWidth: 1000,
            transform: `scale(${0.92 + 0.08 * pop}) translateY(${(1 - pop) * 24}px)`,
            transformOrigin: "left center",
            opacity: Math.min(1, pop * 1.4),
          }}
        >
          {scene.heading}
        </h1>
        <div style={{ fontSize: 34, color: C.muted, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>{scene.subtitle}</div>
      </div>
    </SceneFrame>
  );
}

export function BulletsScene({ scene, duration }: SceneProps<SceneOf<"bullets">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const n = scene.items.length;
  return (
    <SceneFrame duration={duration} heading={scene.heading}>
      <div style={{ display: "flex", flexDirection: "column", gap: n >= 5 ? 12 : 20 }}>
        {scene.items.map((item, i) => {
          const at = stagger(i, n) * duration;
          const s = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 110 } });
          const active = p >= stagger(i, n) && (i === n - 1 || p < stagger(i + 1, n));
          return (
            <div
              key={i}
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: n >= 5 ? "11px 26px" : "20px 28px",
                opacity: Math.min(1, s * 1.5),
                transform: `translateX(${(1 - s) * -60}px)`,
                borderColor: active ? C.accent : C.line,
                background: active ? C.panelHi : C.panel,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: C.accent, color: "#0a0f1f", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24, flex: "none" }}>
                {i + 1}
              </div>
              <div style={{ fontSize: n >= 5 ? 31 : 34, fontWeight: 600, lineHeight: 1.2 }}>{item}</div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
}

const TONES = {
  tip: { color: C.accent2, icon: "💡", label: "Dica" },
  warning: { color: C.warn, icon: "⚠️", label: "Atenção" },
  insight: { color: C.accent, icon: "✨", label: "Ideia central" },
} as const;

export function CalloutScene({ scene, duration }: SceneProps<SceneOf<"callout">>) {
  const { frame, p } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const tone = TONES[scene.tone];
  const s = spring({ frame: frame - 6, fps, config: { damping: 15, stiffness: 80 } });
  const glow = 0.5 + 0.5 * Math.sin(frame / 14);
  const text = ease(p, 0.1, 0.3);
  return (
    <SceneFrame duration={duration} heading={scene.heading} accent={tone.color}>
      <div
        style={{
          ...card,
          borderColor: tone.color,
          padding: "46px 52px",
          marginTop: 12,
          transform: `scale(${0.94 + 0.06 * s})`,
          opacity: Math.min(1, s * 1.5),
          boxShadow: `0 0 ${30 + glow * 30}px ${tone.color}33, 0 14px 40px rgba(0,0,0,.35)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: tone.color, fontSize: 28, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>
          <span style={{ fontSize: 36 }}>{tone.icon}</span>
          {tone.label}
        </div>
        <div style={{ marginTop: 22, fontSize: 46, lineHeight: 1.25, fontWeight: 650, opacity: text, transform: `translateY(${(1 - text) * 16}px)` }}>
          {scene.text}
        </div>
      </div>
    </SceneFrame>
  );
}

export function SummaryScene({ scene, duration }: SceneProps<SceneOf<"summary">>) {
  const { frame } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const n = scene.takeaways.length;
  return (
    <SceneFrame duration={duration} heading={scene.heading} accent={C.good}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {scene.takeaways.map((t, i) => {
          const at = stagger(i, n, 0.08, 0.75) * duration;
          const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 120 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 22}px)` }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: C.good, color: "#052e16", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, transform: `scale(${s})`, flex: "none" }}>
                ✓
              </div>
              <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}>{t}</div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
}

function Side({ side, tint, delay, duration }: { side: SceneOf<"compare">["left"]; tint: string; delay: number; duration: number }) {
  const { frame } = useSceneProgress(duration);
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 17, stiffness: 90 } });
  const codeLines = side.code ? side.code.split("\n") : [];
  const maxLen = Math.max(0, ...codeLines.map((l) => l.length));
  // Cada coluna tem ~500px úteis para o código (monoespaçada: ~0.6em por caractere).
  const codeSize = Math.max(14, Math.min(codeLines.length > 3 ? 21 : 24, Math.floor(500 / (0.6 * Math.max(maxLen, 1)))));
  return (
    <div style={{ ...card, flex: 1, padding: "26px 30px", borderColor: tint, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 40}px)`, minWidth: 0 }}>
      <div style={{ color: tint, fontSize: 26, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>{side.title}</div>
      <ul style={{ margin: 0, paddingLeft: 26, display: "grid", gap: 10, fontSize: 28, lineHeight: 1.25 }}>
        {side.points.map((pt, i) => (
          <li key={i}>{pt}</li>
        ))}
      </ul>
      {side.code ? (
        <div style={{ marginTop: 20, background: "#0a1024", borderRadius: 14, padding: "16px 20px", border: `1px solid ${C.line}` }}>
          <Code code={side.code} fontSize={codeSize} />
        </div>
      ) : null}
    </div>
  );
}

export function CompareScene({ scene, duration }: SceneProps<SceneOf<"compare">>) {
  return (
    <SceneFrame duration={duration} heading={scene.heading}>
      <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
        <Side side={scene.left} tint={C.danger} delay={6} duration={duration} />
        <Side side={scene.right} tint={C.good} delay={Math.round(duration * 0.28)} duration={duration} />
      </div>
    </SceneFrame>
  );
}
