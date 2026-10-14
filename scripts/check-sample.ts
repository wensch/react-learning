import { LessonSchema, countWords, estimatedSeconds, sanitizeLesson } from "../shared/lesson";
import { sampleLesson } from "../src/lessons/sample";

const lesson = LessonSchema.parse(sampleLesson);
const clean = sanitizeLesson(lesson);
const words = clean.scenes.reduce((n, s) => n + countWords(s.narration), 0);
const seconds = estimatedSeconds(clean);
const kinds = new Set(clean.scenes.map((s) => s.kind));
console.log(`cenas: ${clean.scenes.length} | palavras: ${words} | duração estimada: ${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, "0")}s | tipos: ${[...kinds].join(", ")}`);
if (seconds < 180 || seconds > 300) {
  console.error("A aula de exemplo deve ter entre 3 e 5 minutos.");
  process.exit(1);
}

// O schema enviado à Claude (saída estruturada) não pode usar restrições que a API recusa.
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { LessonSchema as Schema } from "../shared/lesson";

const json = JSON.stringify(zodOutputFormat(Schema).schema);
const risky = ["minItems", "maxItems", "minimum", "maximum", "minLength", "maxLength", "pattern", "oneOf"].filter((k) => json.includes(`"${k}"`));
console.log(`schema: ${json.length} bytes | restrições de risco: ${risky.length ? risky.join(", ") : "nenhuma"}`);
if (risky.length) process.exit(1);
