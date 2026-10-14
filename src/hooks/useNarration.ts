import { useEffect, useRef, useState, type RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import { countWords as words, type Lesson, type TimelineEntry } from "../../shared/lesson";

/**
 * Narração por voz do navegador (Web Speech API) com a fala como "relógio mestre":
 *  - cada cena começa a ser falada quando o vídeo entra nela;
 *  - se a fala demora mais que a cena, o vídeo espera no último quadro;
 *  - se a fala termina antes, o vídeo avança para a próxima cena.
 */
export function useNarration(opts: {
  playerRef: RefObject<PlayerRef | null>;
  lesson: Lesson;
  timeline: TimelineEntry[];
  enabled: boolean;
  rate: number;
}) {
  const { playerRef, lesson, timeline, enabled, rate } = opts;
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((x) => x.lang === "pt-BR") ?? voices.find((x) => x.lang.toLowerCase().startsWith("pt"));
      setVoiceName(v?.name ?? null);
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, [supported]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const synth = supported ? window.speechSynthesis : null;
    if (!enabled || !synth) {
      synth?.cancel();
      return;
    }

    const lastScene = timeline.length - 1;
    const sceneEnd = (i: number) => timeline[i].from + timeline[i].duration;
    const sceneAt = (frame: number) => {
      for (let i = lastScene; i >= 0; i--) if (frame >= timeline[i].from) return i;
      return 0;
    };

    setFailed(false);
    let broken = false; // o navegador não consegue falar: segue só com legendas
    let current = -1; // cena cuja fala já foi iniciada
    let token = 0; // invalida callbacks de falas canceladas
    let speaking = false;
    let held = false; // nós pausamos o vídeo para esperar a fala terminar
    let jumpTimer: ReturnType<typeof setTimeout> | undefined;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    const clearTimers = () => {
      clearTimeout(jumpTimer);
      clearTimeout(startTimer);
      clearTimeout(maxTimer);
    };

    const advance = (i: number) => {
      held = false;
      const target = Math.min(sceneEnd(i), timeline[lastScene].from + timeline[lastScene].duration - 1);
      player.seekTo(target);
      if (!player.isPlaying()) player.play();
    };

    const speak = (i: number) => {
      const my = ++token; // invalida a fala anterior antes de cancelá-la
      clearTimers();
      synth.cancel();
      const u = new SpeechSynthesisUtterance(lesson.scenes[i].narration);
      u.lang = "pt-BR";
      u.rate = rateRef.current;
      const voice = synth.getVoices().find((v) => v.lang === "pt-BR") ?? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"));
      if (voice) u.voice = voice;
      const done = () => {
        if (my !== token) return;
        clearTimeout(startTimer);
        clearTimeout(maxTimer);
        speaking = false;
        if (held) advance(i);
        else
          jumpTimer = setTimeout(() => {
            if (my !== token || !player.isPlaying()) return;
            // Fala acabou antes da cena: não deixa o vídeo parado.
            if (sceneEnd(i) - player.getCurrentFrame() > 20) advance(i);
          }, 450);
      };
      const fail = () => {
        if (my !== token || broken) return;
        broken = true;
        speaking = false;
        clearTimers();
        synth.cancel();
        setFailed(true);
        // Não deixa o vídeo preso nem acelerado: volta a seguir o relógio normal.
        if (held) {
          held = false;
          player.play();
        }
      };
      u.onend = done;
      u.onerror = (ev) => {
        // Cancelamentos que nós mesmos pedimos não são falha.
        if (ev.error === "canceled" || ev.error === "interrupted") return;
        fail();
      };
      u.onstart = () => clearTimeout(startTimer);
      speaking = true;
      synth.speak(u);
      // Redes de segurança: se o navegador não fala (sem voz, bloqueado) ou trava, o vídeo não pode ficar preso.
      startTimer = setTimeout(fail, 4000);
      maxTimer = setTimeout(done, (words(lesson.scenes[i].narration) / 1.2 / rateRef.current + 4) * 1000);
    };

    const onFrame = (e: { detail: { frame: number } }) => {
      if (broken || !player.isPlaying()) return;
      const frame = e.detail.frame;
      const i = sceneAt(frame);
      if (i !== current) {
        current = i;
        speak(i);
      }
      if (speaking && frame >= sceneEnd(i) - 2) {
        held = true;
        player.pause();
      }
    };
    const onPause = () => {
      if (held) return; // pausa nossa: a fala continua
      if (synth.speaking) synth.pause();
    };
    const onPlay = () => {
      if (synth.paused) synth.resume();
    };
    const onSeeked = () => {
      // Pulo manual: recomeça a fala da cena onde caiu.
      clearTimers();
      token++;
      synth.cancel();
      speaking = false;
      held = false;
      current = -1;
    };
    const onEnded = () => {
      clearTimers();
      token++;
      synth.cancel();
      speaking = false;
      held = false;
      current = -1;
    };

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("pause", onPause);
    player.addEventListener("play", onPlay);
    player.addEventListener("seeked", onSeeked);
    player.addEventListener("ended", onEnded);
    return () => {
      clearTimers();
      token++;
      synth.cancel();
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("seeked", onSeeked);
      player.removeEventListener("ended", onEnded);
    };
  }, [playerRef, lesson, timeline, enabled, supported]);

  return { supported, voiceName, failed };
}
