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
