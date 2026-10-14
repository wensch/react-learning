import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { LessonSchema, estimatedSeconds, sanitizeLesson, type Lesson } from "../shared/lesson";
import { SYSTEM_PROMPT, userPrompt } from "./prompt";

const MODEL = "claude-opus-5-5";

export class LessonError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 422 | 429 | 502 | 503,
  ) {
    super(message);
  }
}

let client: Anthropic | undefined;
const getClient = () => (client ??= new Anthropic());

export async function generateLesson(question: string): Promise<{ lesson: Lesson; seconds: number }> {
  try {
    // Beta só para o `fallbacks`: se o classificador de segurança recusar, a API tenta o modelo de reserva.
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt(question) }],
      output_config: { effort: "medium", format: zodOutputFormat(LessonSchema) },
    });

    if (response.stop_reason === "refusal") {
      throw new LessonError("A Claude recusou esta pergunta. Tente reformular o assunto.", 422);
    }
    if (response.stop_reason === "max_tokens") {
      throw new LessonError("O roteiro ficou longo demais e foi cortado. Tente uma pergunta mais específica.", 502);
    }
    if (!response.parsed_output) {
      throw new LessonError("A resposta da Claude não veio no formato esperado. Tente de novo.", 502);
    }

    const lesson = sanitizeLesson(response.parsed_output);
    if (lesson.scenes.length < 3) throw new LessonError("O roteiro veio curto demais. Tente de novo.", 502);
    return { lesson, seconds: estimatedSeconds(lesson) };
  } catch (err) {
    if (err instanceof LessonError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new LessonError("Chave da API inválida. Confira o ANTHROPIC_API_KEY no arquivo .env.", 401);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new LessonError("Limite de uso da API atingido. Aguarde um pouco e tente de novo.", 429);
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new LessonError("Não consegui falar com a API da Anthropic. Verifique a conexão.", 503);
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[claude]", err.status, err.message);
      throw new LessonError("A API devolveu um erro. Veja o terminal do servidor para detalhes.", 502);
    }
    throw err;
  }
}
