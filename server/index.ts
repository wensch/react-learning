import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { LessonError, generateLesson } from "./generate";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) }));

app.post("/api/lesson", async (c) => {
  const body = await c.req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question.length < 5 || question.length > 600) {
    return c.json({ error: "Escreva uma pergunta entre 5 e 600 caracteres." }, 400);
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return c.json({ error: "Falta a chave da API. Copie .env.example para .env e preencha ANTHROPIC_API_KEY." }, 503);
  }
  try {
    const started = Date.now();
    const result = await generateLesson(question);
    console.log(`[lesson] "${question.slice(0, 60)}" → ${result.lesson.scenes.length} cenas, ~${result.seconds}s, gerado em ${Math.round((Date.now() - started) / 1000)}s`);
    return c.json(result);
  } catch (err) {
    if (err instanceof LessonError) return c.json({ error: err.message }, err.status);
    console.error(err);
    return c.json({ error: "Erro inesperado ao gerar o roteiro." }, 500);
  }
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`API de roteiros em http://localhost:${port}`));
