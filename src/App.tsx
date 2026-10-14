import { useEffect, useRef, useState } from "react";
import { fmtDuration, loadSaved, persist, requestLesson, SAMPLE, type SavedLesson } from "./lib";
import { LessonPlayer } from "./components/LessonPlayer";

const EXAMPLES = [
  "Por que o useEffect roda duas vezes em desenvolvimento?",
  "Qual a diferença entre useMemo e useCallback?",
  "Como funciona a renderização condicional e as keys em listas?",
  "O que é o Virtual DOM e por que o React precisa dele?",
];

export function App() {
  const [saved, setSaved] = useState<SavedLesson[]>(() => loadSaved());
  const [currentId, setCurrentId] = useState<string>("sample");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const all = [SAMPLE, ...saved];
  const current = all.find((l) => l.id === currentId) ?? SAMPLE;

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 5 || loading) return;
    setError(null);
    setLoading(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const { lesson, seconds } = await requestLesson(text, ctl.signal);
      const item: SavedLesson = { id: crypto.randomUUID(), question: text, lesson, seconds, createdAt: Date.now() };
      const next = [item, ...saved];
      setSaved(next);
      persist(next);
      setCurrentId(item.id);
      setQuestion("");
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function remove(id: string) {
    const next = saved.filter((l) => l.id !== id);
    setSaved(next);
    persist(next);
    if (currentId === id) setCurrentId("sample");
  }

  const phase = elapsed < 8 ? "Lendo sua pergunta" : elapsed < 35 ? "Planejando as cenas" : "Escrevendo narração e animações";

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">⚛</span>
          <div>
            <h1>React Learning</h1>
            <p>Pergunte e receba a resposta em vídeo, com narração e animações.</p>
          </div>
        </div>
      </header>

      <main className="layout">
        <aside className="side">
          <form
            className="ask"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <label htmlFor="q">Sua pergunta</label>
            <textarea
              id="q"
              rows={4}
              maxLength={600}
              placeholder="Ex.: Por que meu componente renderiza duas vezes?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void ask(question);
              }}
              disabled={loading}
            />
            <div className="examples">
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="chip" onClick={() => setQuestion(ex)} disabled={loading}>
                  {ex}
                </button>
              ))}
            </div>
            {loading ? (
              <button type="button" className="btn secondary" onClick={() => abortRef.current?.abort()}>
                Cancelar
              </button>
            ) : (
              <button type="submit" className="btn" disabled={question.trim().length < 5}>
                Gerar vídeo
              </button>
            )}
            {error ? <p className="error" role="alert">{error}</p> : null}
          </form>

          <div className="library">
            <h2>Seus vídeos</h2>
            <ul>
              {all.map((l) => (
                <li key={l.id} className={l.id === currentId ? "lib-item active" : "lib-item"}>
                  <button onClick={() => setCurrentId(l.id)} disabled={loading}>
                    <span className="lib-q">{l.question}</span>
                    <span className="lib-meta">
                      {l.id === "sample" ? "Exemplo" : `${l.lesson.scenes.length} cenas${l.seconds ? ` · ${fmtDuration(l.seconds)}` : ""}`}
                    </span>
                  </button>
                  {l.id !== "sample" ? (
                    <button className="del" aria-label="Apagar vídeo" title="Apagar" onClick={() => remove(l.id)}>
                      ×
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="stage">
          <div className="stage-head">
            <h2>{current.question}</h2>
          </div>
          {loading ? (
            <div className="loading" role="status" aria-live="polite">
              <div className="spinner" />
              <h3>{phase}…</h3>
              <p>Gerar um vídeo de 3 a 5 minutos leva em torno de 1 a 2 minutos. {elapsed}s</p>
            </div>
          ) : (
            <LessonPlayer key={current.id} lesson={current.lesson} />
          )}
        </div>
      </main>
    </div>
  );
}
