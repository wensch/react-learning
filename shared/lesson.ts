import { z } from "zod";

/**
 * Contrato entre a Claude (que escreve o roteiro) e o player (que desenha as cenas).
 * Todos os campos são obrigatórios: a saída estruturada da API não aceita opcionais de
 * forma confiável, então "sem valor" é string vazia / lista vazia.
 */

const narration = z
  .string()
  .describe("Texto falado nesta cena, em português do Brasil, 25 a 50 palavras, sem markdown nem símbolos de código.");

const TitleScene = z.object({
  kind: z.literal("title"),
  narration,
  heading: z.string().describe("Título curto e forte (até 8 palavras)."),
  subtitle: z.string().describe("Subtítulo de uma linha."),
});

const BulletsScene = z.object({
  kind: z.literal("bullets"),
  narration,
  heading: z.string(),
  items: z.array(z.string()).describe("3 a 5 itens curtos (até 10 palavras cada), revelados um a um."),
});

const CodeScene = z.object({
  kind: z.literal("code"),
  narration,
  heading: z.string(),
  filename: z.string().describe("Ex.: Counter.jsx"),
  code: z.string().describe("Código de 4 a 14 linhas, com quebras de linha reais."),
  steps: z
    .array(
      z.object({
        lines: z.array(z.number().int()).describe("Números de linha (começando em 1) destacados neste passo."),
        caption: z.string().describe("Explicação curta (até 14 palavras) do que essas linhas fazem."),
      }),
    )
    .describe("2 a 4 passos que acompanham a narração, em ordem."),
});

const DiagramScene = z.object({
  kind: z.literal("diagram"),
  narration,
  heading: z.string(),
  layout: z.enum(["row", "cycle"]).describe("row = sequência/pipeline; cycle = ciclo que se repete."),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().describe("Até 5 palavras."),
        note: z.string().describe("Detalhe opcional, até 8 palavras, ou string vazia."),
      }),
    )
    .describe("3 a 6 nós, na ordem em que aparecem."),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().describe("Rótulo curto da seta ou string vazia."),
    }),
  ),
});

const TreeScene = z.object({
  kind: z.literal("tree"),
  narration,
  heading: z.string(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().describe("Nome do componente, ex.: Counter."),
        parent: z.string().describe("id do pai; string vazia para a raiz (exatamente uma raiz)."),
        badge: z.string().describe("Estado/props mostrados sob o nó, ex.: count = 1; ou string vazia."),
      }),
    )
    .describe("3 a 8 componentes."),
  steps: z
    .array(
      z.object({
        highlight: z.array(z.string()).describe("ids dos nós que se destacam neste passo."),
        caption: z.string().describe("O que está acontecendo neste passo (até 14 palavras)."),
      }),
    )
    .describe("2 a 4 passos em ordem."),
});

const Side = z.object({
  title: z.string(),
  points: z.array(z.string()).describe("2 a 3 pontos curtos."),
  code: z.string().describe("Trecho de código de até 6 linhas ou string vazia."),
});

const CompareScene = z.object({
  kind: z.literal("compare"),
  narration,
  heading: z.string(),
  left: Side.describe("Lado 'errado' / 'antes' / ideia ingênua."),
  right: Side.describe("Lado 'certo' / 'depois' / como funciona de verdade."),
});

const CalloutScene = z.object({
  kind: z.literal("callout"),
  narration,
  heading: z.string(),
  text: z.string().describe("A ideia central em 1 a 2 frases curtas."),
  tone: z.enum(["tip", "warning", "insight"]),
});

const SummaryScene = z.object({
  kind: z.literal("summary"),
  narration,
  heading: z.string(),
  takeaways: z.array(z.string()).describe("3 a 5 aprendizados, até 12 palavras cada."),
});

export const SceneSchema = z.discriminatedUnion("kind", [
  TitleScene,
  BulletsScene,
  CodeScene,
  DiagramScene,
  TreeScene,
  CompareScene,
  CalloutScene,
  SummaryScene,
]);

export const LessonSchema = z.object({
  title: z.string().describe("Título do vídeo."),
  scenes: z.array(SceneSchema).describe("14 a 22 cenas. A primeira é 'title' e a última é 'summary'."),
});

export type LessonLength = "short" | "long";

export type Scene = z.infer<typeof SceneSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type SceneOf<K extends Scene["kind"]> = Extract<Scene, { kind: K }>;

/* ------------------------------------------------------------------ */
/* Tempo                                                               */
/* ------------------------------------------------------------------ */

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;

/** Velocidade média de fala em pt-BR na velocidade 1x (palavras por segundo). */
const WORDS_PER_SECOND = 2.6;
const MIN_SCENE_SECONDS = 4;
const SCENE_PADDING_SECONDS = 1.2;

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function sceneSeconds(narrationText: string): number {
  return Math.max(MIN_SCENE_SECONDS, countWords(narrationText) / WORDS_PER_SECOND + SCENE_PADDING_SECONDS);
}

export type TimelineEntry = { from: number; duration: number };

/**
 * Sem áudio: a duração de cada cena é estimada pelo texto.
 * Com áudio (narração gravada de uma vez): a duração total é a do áudio, repartida entre as cenas
 * na proporção do tamanho da narração de cada uma (a fala tem ritmo quase constante).
 */
export function planTimeline(lesson: Lesson, audioSeconds?: number, cuts?: number[]): { entries: TimelineEntry[]; totalFrames: number } {
  if (audioSeconds && audioSeconds > 0) {
    const tail = Math.round(0.8 * FPS); // respiro final depois da última palavra
    const total = Math.round(audioSeconds * FPS) + tail;
    // Pontos de troca medidos no áudio (npm run align:audio): uma entrada a menos que o número de cenas.
    if (cuts && cuts.length === lesson.scenes.length - 1 && cuts.every((c, i) => c > (cuts[i - 1] ?? 0))) {
      const bounds = [0, ...cuts.map((c) => Math.round(c * FPS)), total];
      return { entries: bounds.slice(0, -1).map((from, i) => ({ from, duration: Math.max(1, bounds[i + 1] - from) })), totalFrames: total };
    }
    const weights = lesson.scenes.map((s) => Math.max(1, s.narration.length));
    const sum = weights.reduce((a, b) => a + b, 0);
    let from = 0;
    const entries = weights.map((w, i) => {
      const last = i === weights.length - 1;
      const duration = last ? total - from : Math.max(1, Math.round((w / sum) * (total - tail)));
      const entry = { from, duration };
      from += duration;
      return entry;
    });
    return { entries, totalFrames: Math.max(total, 1) };
  }
  let from = 0;
  const entries = lesson.scenes.map((s) => {
    const duration = Math.round(sceneSeconds(s.narration) * FPS);
    const entry = { from, duration };
    from += duration;
    return entry;
  });
  return { entries, totalFrames: Math.max(from, 1) };
}

export function estimatedSeconds(lesson: Lesson): number {
  return Math.round(planTimeline(lesson).totalFrames / FPS);
}

/* ------------------------------------------------------------------ */
/* Saneamento: a IA pode errar um id ou um número de linha.            */
/* ------------------------------------------------------------------ */

export function sanitizeLesson(lesson: Lesson): Lesson {
  const scenes = lesson.scenes.map((scene): Scene => {
    switch (scene.kind) {
      case "code": {
        const total = scene.code.split("\n").length;
        const steps = scene.steps
          .map((s) => ({ ...s, lines: s.lines.filter((n) => n >= 1 && n <= total) }))
          .filter((s) => s.lines.length > 0);
        return { ...scene, steps };
      }
      case "diagram": {
        const ids = new Set(scene.nodes.map((n) => n.id));
        const edges = scene.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
        // Sem setas válidas, liga os nós em sequência.
        const fallback = scene.nodes.slice(1).map((n, i) => ({ from: scene.nodes[i].id, to: n.id, label: "" }));
        return { ...scene, edges: edges.length ? edges : fallback };
      }
      case "tree": {
        const ids = new Set(scene.nodes.map((n) => n.id));
        const nodes = scene.nodes.map((n) => (n.parent && !ids.has(n.parent) ? { ...n, parent: "" } : n));
        const steps = scene.steps.map((s) => ({ ...s, highlight: s.highlight.filter((id) => ids.has(id)) }));
        return { ...scene, nodes, steps };
      }
      default:
        return scene;
    }
  });
  return { ...lesson, scenes };
}
