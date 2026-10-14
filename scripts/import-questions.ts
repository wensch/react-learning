/**
 * Importa a lista de perguntas do README de sudheerj/reactjs-interview-questions (licença MIT)
 * para data/questions.json. Só entram o título da pergunta e o link para a resposta original;
 * as respostas não são copiadas, o vídeo é gerado pela Claude.
 *
 * Uso: npm run import:questions            (baixa do GitHub)
 *      npm run import:questions -- ./README.md   (lê um arquivo local)
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { QuestionBank } from "../shared/questions";

const SOURCE = "sudheerj/reactjs-interview-questions";
const RAW_URL = `https://raw.githubusercontent.com/${SOURCE}/master/README.md`;
const OUT = fileURLToPath(new URL("../data/questions.json", import.meta.url));

function clean(text: string): string {
  return text
    .replace(/\\\|/g, "|")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseToc(markdown: string): QuestionBank["questions"] {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.includes("Table of Contents"));
  if (start < 0) throw new Error("Não achei o 'Table of Contents' no README.");
  const questions: QuestionBank["questions"] = [];
  let topic = "";
  const seen = new Set<string>();
  for (const line of lines.slice(start)) {
    // O sumário tem dois blocos recolhíveis (o segundo é o "Old Q&A"); termina no primeiro título de conteúdo.
    if (line.startsWith("## ")) break;
    const cat = line.match(/^\|\s*\|\s*\*\*(.+?)\*\*\s*\|/);
    if (cat) {
      topic = clean(cat[1]);
      continue;
    }
    const q = line.match(/^\|\s*\d+\s*\|\s*\[(.+?)\]\(#([^)]+)\)\s*\|/);
    if (!q || !topic) continue;
    const anchor = q[2];
    if (seen.has(anchor)) continue;
    seen.add(anchor);
    questions.push({
      id: `sj-${questions.length + 1}`,
      question: clean(q[1]),
      topic,
      url: `https://github.com/${SOURCE}#${anchor}`,
    });
  }
  return questions;
}

const arg = process.argv[2];
const markdown = arg ? await readFile(arg, "utf8") : await fetch(RAW_URL).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))));
const questions = parseToc(markdown);
if (questions.length < 100) throw new Error(`Só ${questions.length} perguntas: o formato do README mudou?`);
const bank: QuestionBank = { source: { repo: SOURCE, license: "MIT", url: `https://github.com/${SOURCE}` }, questions };
await writeFile(OUT, JSON.stringify(bank, null, 1) + "\n");
const byTopic = questions.reduce<Record<string, number>>((m, q) => ((m[q.topic] = (m[q.topic] ?? 0) + 1), m), {});
console.log(`${questions.length} perguntas →`, byTopic);
