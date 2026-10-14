import { LessonSchema, sanitizeLesson, type Lesson } from "../shared/lesson";
import { SAMPLE_QUESTION, sampleLesson } from "./lessons/sample";

export type SavedLesson = {
  id: string;
  question: string;
  lesson: Lesson;
  seconds: number;
  createdAt: number;
};

export const SAMPLE: SavedLesson = {
  id: "sample",
  question: SAMPLE_QUESTION,
  lesson: sampleLesson,
  seconds: 0,
  createdAt: 0,
};

const KEY = "react-learning:lessons:v1";
const MAX_SAVED = 20;

export function loadSaved(): SavedLesson[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item): SavedLesson[] => {
      const parsed = LessonSchema.safeParse(item?.lesson);
      if (!parsed.success || typeof item.question !== "string") return [];
      return [{ id: String(item.id), question: item.question, lesson: sanitizeLesson(parsed.data), seconds: Number(item.seconds) || 0, createdAt: Number(item.createdAt) || 0 }];
    });
  } catch {
    return [];
  }
}

export function persist(list: SavedLesson[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    // armazenamento cheio ou bloqueado: o app continua funcionando sem histórico
  }
}

export async function requestLesson(question: string, signal: AbortSignal): Promise<{ lesson: Lesson; seconds: number }> {
  let res: Response;
  try {
    res = await fetch("/api/lesson", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Não consegui falar com o servidor. Ele está rodando? (npm run dev)");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Erro ${res.status} ao gerar o roteiro.`);
  const parsed = LessonSchema.safeParse(data?.lesson);
  if (!parsed.success) throw new Error("O servidor devolveu um roteiro inválido.");
  return { lesson: sanitizeLesson(parsed.data), seconds: Number(data.seconds) || 0 };
}

export const fmtDuration = (seconds: number) => {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
