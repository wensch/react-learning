import { LessonSchema, sanitizeLesson, type Lesson } from "../shared/lesson";

/**
 * Vídeos já prontos (data/lessons/*.json): cada arquivo é um objeto { [id da pergunta]: roteiro }.
 * São carregados sob demanda e validados; um roteiro inválido é ignorado, não derruba o app.
 */
const files = import.meta.glob<Record<string, unknown>>("../data/lessons/*.json", { import: "default" });

let cache: Promise<Map<string, Lesson>> | undefined;

export function loadPrebuilt(): Promise<Map<string, Lesson>> {
  cache ??= Promise.all(Object.values(files).map((load) => load())).then((all) => {
    const map = new Map<string, Lesson>();
    for (const file of all) {
      for (const [id, raw] of Object.entries(file)) {
        const parsed = LessonSchema.safeParse(raw);
        if (parsed.success) map.set(id, sanitizeLesson(parsed.data));
      }
    }
    return map;
  });
  return cache;
}

export type AudioInfo = { src: string; seconds: number; voice: string; cuts?: number[] };

let audioCache: Promise<Map<string, AudioInfo>> | undefined;

/** Narrações gravadas (public/audio): id da pergunta → arquivo e duração. Opcional; sem manifest, só a voz do navegador. */
export function loadAudioManifest(): Promise<Map<string, AudioInfo>> {
  audioCache ??= fetch("/audio/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((raw: Record<string, { seconds?: number; voice?: string; cuts?: number[] }>) => {
      const map = new Map<string, AudioInfo>();
      for (const [id, v] of Object.entries(raw ?? {})) {
        if (typeof v?.seconds === "number" && v.seconds > 0) map.set(id, { src: `/audio/${id}.mp3`, seconds: v.seconds, voice: v.voice ?? "voz gravada", cuts: Array.isArray(v.cuts) ? v.cuts : undefined });
      }
      return map;
    });
  return audioCache;
}
