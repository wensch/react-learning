/**
 * Encaixa as trocas de cena nas pausas da fala. Uso: npm run align:audio -- <id-da-pergunta>
 * Precisa do ffmpeg. Lê public/audio/<id>.mp3, detecta as pausas, e grava `cuts` (fim de cada cena,
 * menos a última, em segundos) no public/audio/manifest.json.
 */
import { spawnSync } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LessonSchema, planTimeline, FPS } from "../shared/lesson";

const id = process.argv[2];
if (!id) throw new Error("Uso: npm run align:audio -- <id-da-pergunta>");

const dataDir = fileURLToPath(new URL("../data/lessons/", import.meta.url));
const audioDir = fileURLToPath(new URL("../public/audio/", import.meta.url));
const manifestPath = audioDir + "manifest.json";

let raw: unknown;
for (const f of (await readdir(dataDir)).filter((f) => f.endsWith(".json"))) {
  const data = JSON.parse(await readFile(dataDir + f, "utf8"));
  if (data[id]) raw = data[id];
}
const lesson = LessonSchema.parse(raw);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const seconds: number = manifest[id].seconds;

const run = spawnSync("ffmpeg", ["-hide_banner", "-i", `${audioDir}${id}.mp3`, "-af", "silencedetect=noise=-35dB:d=0.25", "-f", "null", "-"], { encoding: "utf8" });
const starts = [...run.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...run.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const pauses = starts.slice(0, ends.length).map((s, i) => (s + ends[i]) / 2);

// Fim previsto de cada cena (modelo proporcional), encaixado na pausa mais próxima (até 1,5 s de distância).
const { entries } = planTimeline(lesson, seconds);
const cuts = entries.slice(0, -1).map((e) => {
  const guess = (e.from + e.duration) / FPS;
  const near = pauses.reduce((best, p) => (Math.abs(p - guess) < Math.abs(best - guess) ? p : best), Infinity);
  return Math.abs(near - guess) <= 1.5 ? Number(near.toFixed(2)) : Number(guess.toFixed(2));
});

manifest[id].cuts = cuts;
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${id}: cortes em ${cuts.join(", ")} (de ${seconds}s, ${pauses.length} pausas detectadas)`);
