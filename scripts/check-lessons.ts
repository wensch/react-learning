/** Valida os vídeos prontos em data/lessons/*.json. Uso: npm run check:lessons */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { LessonSchema, countWords, estimatedSeconds, sanitizeLesson } from "../shared/lesson";
import bank from "../data/questions.json" with { type: "json" };

const dir = fileURLToPath(new URL("../data/lessons/", import.meta.url));
const ids = new Set(bank.questions.map((q) => q.id));
const seen = new Map<string, string>();
const errors: string[] = [];
const warns: string[] = [];
let total = 0;
let totalSeconds = 0;

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json")).sort()) {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(await readFile(dir + file, "utf8"));
  } catch (e) {
    errors.push(`${file}: JSON inválido (${(e as Error).message})`);
    continue;
  }
  for (const [id, raw] of Object.entries(data)) {
    const at = `${file} › ${id}`;
    total++;
    if (!ids.has(id)) errors.push(`${at}: id não existe em data/questions.json`);
    if (seen.has(id)) errors.push(`${at}: repetido (também em ${seen.get(id)})`);
    seen.set(id, file);
    const parsed = LessonSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(`${at}: schema → ${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}`);
      continue;
    }
    const lesson = parsed.data;
    const clean = sanitizeLesson(lesson);
    if (JSON.stringify(clean) !== JSON.stringify(lesson)) errors.push(`${at}: linhas/ids inválidos em code, diagram ou tree`);
    const n = lesson.scenes.length;
    if (n < 5 || n > 9) errors.push(`${at}: ${n} cenas (esperado 5 a 9)`);
    if (lesson.scenes[0].kind !== "title") errors.push(`${at}: a primeira cena deve ser title`);
    if (lesson.scenes[n - 1].kind !== "summary") errors.push(`${at}: a última cena deve ser summary`);
    const secs = estimatedSeconds(lesson);
    totalSeconds += secs;
    if (secs < 40 || secs > 110) errors.push(`${at}: duração estimada ${secs}s (esperado 40 a 110s)`);
    if (new Set(lesson.scenes.map((s) => s.kind)).size < 3) warns.push(`${at}: pouca variedade visual`);
    lesson.scenes.forEach((s, i) => {
      const where = `${at} cena ${i + 1} (${s.kind})`;
      const w = countWords(s.narration);
      if (w < 10 || w > 48) errors.push(`${where}: narração com ${w} palavras`);
      if (/[`{}<>]|=>|\(\)|\/\//.test(s.narration)) warns.push(`${where}: símbolos de código na narração`);
      if (s.kind === "code") {
        const lines = s.code.split("\n");
        if (lines.length > 12) errors.push(`${where}: ${lines.length} linhas de código (máx. 12)`);
        if (Math.max(...lines.map((l) => l.length)) > 60) errors.push(`${where}: linha de código com mais de 60 caracteres`);
        if (s.steps.length < 2) errors.push(`${where}: precisa de 2+ passos`);
      }
      if (s.kind === "diagram" && (s.nodes.length < 3 || s.nodes.length > 6)) errors.push(`${where}: ${s.nodes.length} nós (3 a 6)`);
      if (s.kind === "bullets" && (s.items.length < 3 || s.items.length > 5)) errors.push(`${where}: ${s.items.length} itens (3 a 5)`);
      if (s.kind === "tree") {
        if (s.nodes.filter((nd) => !nd.parent).length !== 1) errors.push(`${where}: a árvore precisa de exatamente 1 raiz`);
        if (s.steps.some((st) => st.highlight.length === 0)) errors.push(`${where}: passo da árvore sem destaque`);
      }
      if (s.kind === "compare")
        for (const side of [s.left, s.right]) {
          const cl = side.code.split("\n");
          if (cl.length > 6) errors.push(`${where}: código com mais de 6 linhas`);
          if (Math.max(...cl.map((l) => l.length)) > 44) warns.push(`${where}: linha longa no comparativo (>44), a fonte fica pequena`);
        }
    });
  }
}

const avg = total ? Math.round(totalSeconds / total) : 0;
console.log(`${total} vídeos em ${new Set(seen.values()).size} arquivos | média ${avg}s | ${bank.questions.length - seen.size} perguntas ainda sem vídeo`);
if (warns.length) console.log(`\n${warns.length} avisos:\n` + warns.slice(0, 15).map((w) => "  ~ " + w).join("\n"));
if (errors.length) {
  console.error(`\n${errors.length} ERROS:\n` + errors.slice(0, 40).map((e) => "  ✗ " + e).join("\n"));
  process.exit(1);
}
console.log("tudo certo ✓");
