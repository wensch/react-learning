import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, CONTENT_H, FONT, PAD_X } from "../theme";

export type SceneProps<T> = { scene: T; duration: number };

/** Progresso 0..1 da cena atual (usa o frame local da <Sequence>). */
export function useSceneProgress(duration: number) {
  const frame = useCurrentFrame();
  return { frame, p: Math.min(1, Math.max(0, frame / Math.max(1, duration))) };
}

/** Entrada/saída suaves da cena inteira. */
export function SceneFrame({
  duration,
  heading,
  accent = C.accent,
  children,
}: {
  duration: number;
  heading?: string;
  accent?: string;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const fade = 9;
  const opacity = interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(frame, [0, fade * 1.6], [18, 0], { extrapolateRight: "clamp" });
  const headEnter = interpolate(frame, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity, fontFamily: FONT, color: C.text }}>
      <div style={{ position: "absolute", inset: 0, height: CONTENT_H, padding: `44px ${PAD_X}px 0`, transform: `translateY(${rise}px)` }}>
        {heading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: headEnter, marginBottom: 28 }}>
            <div style={{ width: 8, height: 46, borderRadius: 4, background: accent, transform: `scaleY(${headEnter})` }} />
            <h2 style={{ margin: 0, fontSize: 46, fontWeight: 750, letterSpacing: -0.5, lineHeight: 1.1 }}>{heading}</h2>
          </div>
        ) : null}
        {children}
      </div>
    </AbsoluteFill>
  );
}

export const card: CSSProperties = {
  background: C.panel,
  border: `1.5px solid ${C.line}`,
  borderRadius: 22,
  boxShadow: "0 14px 40px rgba(0,0,0,.35)",
};
