import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { FPS, HEIGHT, WIDTH, planTimeline, type Lesson } from "../../shared/lesson";
import { LessonVideo } from "../video/LessonVideo";
import { useNarration } from "../hooks/useNarration";
import { fmtDuration } from "../lib";

const KIND_LABEL: Record<string, string> = {
  title: "Abertura",
  bullets: "Tópicos",
  code: "Código",
  diagram: "Diagrama",
  tree: "Árvore",
  compare: "Comparação",
  callout: "Destaque",
  summary: "Resumo",
};

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const playerRef = useRef<PlayerRef>(null);
  const { entries, totalFrames } = useMemo(() => planTimeline(lesson), [lesson]);
  const [narrate, setNarrate] = useState(true);
  const [rate, setRate] = useState(1);
  const [chapter, setChapter] = useState(0);
  const { supported, voiceName, failed } = useNarration({ playerRef, lesson, timeline: entries, enabled: narrate, rate });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      let idx = 0;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (e.detail.frame >= entries[i].from) {
          idx = i;
          break;
        }
      }
      setChapter((c) => (c === idx ? c : idx));
    };
    player.addEventListener("frameupdate", onFrame);
    return () => player.removeEventListener("frameupdate", onFrame);
  }, [entries]);

  const seekTo = (i: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(entries[i].from);
    player.play();
  };

  return (
    <section className="player-section">
      <div className="player-frame">
        <Player
          ref={playerRef}
          component={LessonVideo}
          inputProps={{ lesson, timeline: entries }}
          durationInFrames={totalFrames}
          fps={FPS}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          controls
          showPosterWhenUnplayed
          renderPoster={() => (
            <div className="poster">
              <span className="poster-kicker">{fmtDuration(totalFrames / FPS)} · {lesson.scenes.length} cenas</span>
              <strong>{lesson.title}</strong>
              <span className="poster-play">▶ Clique para assistir</span>
            </div>
          )}
          clickToPlay
          spaceKeyToPlayOrPause
          playbackRate={rate}
          style={{ width: "100%", aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        />
      </div>

      <div className="player-bar">
        <label className="toggle">
          <input type="checkbox" checked={narrate} onChange={(e) => setNarrate(e.target.checked)} disabled={!supported} />
          <span>Narração em voz alta</span>
        </label>
        <label className="speed">
          Velocidade
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        </label>
        <span className="hint">
          {!supported
            ? "Seu navegador não tem síntese de voz: use as legendas."
            : failed
              ? "Não consegui falar neste navegador (sem voz instalada). Seguindo só com legendas."
              : narrate
              ? voiceName
                ? `Voz: ${voiceName}`
                : "Nenhuma voz em português encontrada: vai usar a padrão do sistema."
              : "Só legendas."}
        </span>
      </div>

      <h3 className="chapters-title">Capítulos</h3>
      <ol className="chapters">
        {lesson.scenes.map((scene, i) => (
          <li key={i}>
            <button className={i === chapter ? "chapter active" : "chapter"} onClick={() => seekTo(i)}>
              <span className="chapter-time">{fmtDuration(entries[i].from / FPS)}</span>
              <span className="chapter-kind">{KIND_LABEL[scene.kind]}</span>
              <span className="chapter-title">{"heading" in scene ? scene.heading : lesson.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
