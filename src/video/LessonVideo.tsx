import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import type { Lesson, Scene, TimelineEntry } from "../../shared/lesson";
import { C, FONT } from "./theme";
import { BulletsScene, CalloutScene, CompareScene, SummaryScene, TitleScene } from "./scenes/TextScenes";
import { CodeScene } from "./scenes/CodeScene";
import { DiagramScene } from "./scenes/DiagramScene";
import { TreeScene } from "./scenes/TreeScene";

export type LessonVideoProps = { lesson: Lesson; timeline: TimelineEntry[] };

function Background() {
  const frame = useCurrentFrame();
  const orbs = [
    { x: 180, y: 140, r: 420, color: C.accent, speed: 0.011, phase: 0 },
    { x: 1080, y: 520, r: 460, color: C.accent2, speed: 0.008, phase: 2 },
    { x: 700, y: -40, r: 320, color: "#a78bfa", speed: 0.013, phase: 4 },
  ];
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {orbs.map((o, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: o.x + Math.sin(frame * o.speed + o.phase) * 70 - o.r / 2,
            top: o.y + Math.cos(frame * o.speed * 0.9 + o.phase) * 50 - o.r / 2,
            width: o.r,
            height: o.r,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${o.color}33 0%, transparent 68%)`,
          }}
        />
      ))}
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
    </AbsoluteFill>
  );
}

/** Divide a narração em frases e mostra a que está sendo dita agora. */
function Caption({ text, duration }: { text: string; duration: number }) {
  const frame = useCurrentFrame();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const total = sentences.reduce((a, s) => a + s.length, 0) || 1;
  const progress = Math.min(0.999, frame / Math.max(1, duration - 12));
  let acc = 0;
  let idx = sentences.length - 1;
  let local = 1;
  for (let i = 0; i < sentences.length; i++) {
    const share = sentences[i].length / total;
    if (progress < acc + share) {
      idx = i;
      local = (progress - acc) / share;
      break;
    }
    acc += share;
  }
  const opacity = interpolate(local, [0, 0.06, 0.94, 1], [0, 1, 1, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, display: "flex", justifyContent: "center", padding: "0 80px" }}>
      <div
        style={{
          maxWidth: 1120,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 26,
          lineHeight: 1.3,
          fontWeight: 500,
          color: C.text,
          background: "rgba(8,12,28,.78)",
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: "12px 24px",
          opacity,
          backdropFilter: "blur(6px)",
        }}
      >
        {sentences[idx]}
      </div>
    </div>
  );
}

function renderScene(scene: Scene, duration: number) {
  switch (scene.kind) {
    case "title":
      return <TitleScene scene={scene} duration={duration} />;
    case "bullets":
      return <BulletsScene scene={scene} duration={duration} />;
    case "code":
      return <CodeScene scene={scene} duration={duration} />;
    case "diagram":
      return <DiagramScene scene={scene} duration={duration} />;
    case "tree":
      return <TreeScene scene={scene} duration={duration} />;
    case "compare":
      return <CompareScene scene={scene} duration={duration} />;
    case "callout":
      return <CalloutScene scene={scene} duration={duration} />;
    case "summary":
      return <SummaryScene scene={scene} duration={duration} />;
  }
}

export function LessonVideo({ lesson, timeline }: LessonVideoProps) {
  return (
    <AbsoluteFill>
      <Background />
      {lesson.scenes.map((scene, i) => (
        <Sequence key={i} from={timeline[i].from} durationInFrames={timeline[i].duration} name={`${i + 1}. ${scene.kind}`}>
          {renderScene(scene, timeline[i].duration)}
          <Caption text={scene.narration} duration={timeline[i].duration} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
