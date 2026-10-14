import { useEffect, useMemo, useRef, useState } from "react";
import { fmtDuration, loadSaved, persist, requestLesson, SAMPLE, type SavedLesson } from "./lib";
import { LessonPlayer } from "./components/LessonPlayer";
import { QuestionBank } from "./components/QuestionBank";
import { normalizeQuestion, questionById } from "./bank";
import { loadAudioManifest, loadPrebuilt, type AudioInfo } from "./prebuilt";
import type { Lesson, LessonLength } from "../shared/lesson";

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
  const [tab, setTab] = useState<"videos" | "bank">("videos");
  const [length, setLength] = useState<LessonLength>("long");
  const [prebuilt, setPrebuilt] = useState<Map<string, Lesson>>(new Map());
  const [audios, setAudios] = useState<Map<string, AudioInfo>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ready = useMemo(() => new Set(prebuilt.keys()), [prebuilt]);
  const all = [SAMPLE, ...saved];
  const done = new Set(saved.map((l) => normalizeQuestion(l.question)));
  const preId = currentId.startsWith("pre:") ? currentId.slice(4) : "";
  const preLesson = preId ? prebuilt.get(preId) : undefined;
  const current: SavedLesson =
    preLesson && questionById(preId)
      ? { id: currentId, question: questionById(preId)!.question, lesson: preLesson, seconds: 0, createdAt: 0 }
      : (all.find((l) => l.id === currentId) ?? SAMPLE);

  useEffect(() => {
    void loadPrebuilt().then(setPrebuilt).catch(() => {});
    void loadAudioManifest().then(setAudios);
  }, []);

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
      const { lesson, seconds } = await requestLesson(text, length, ctl.signal);
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
              ref={textareaRef}
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
            <fieldset className="length" disabled={loading}>
              <legend>Duração do vídeo</legend>
              <label>
                <input type="radio" name="length" checked={length === "short"} onChange={() => setLength("short")} /> Curto (~1 min)
              </label>
              <label>
                <input type="radio" name="length" checked={length === "long"} onChange={() => setLength("long")} /> Completo (3 a 5 min)
              </label>
            </fieldset>
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
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "videos"} className={tab === "videos" ? "tab active" : "tab"} onClick={() => setTab("videos")}>
                Seus vídeos
              </button>
              <button role="tab" aria-selected={tab === "bank"} className={tab === "bank" ? "tab active" : "tab"} onClick={() => setTab("bank")}>
                Banco de perguntas
              </button>
            </div>
            {tab === "bank" ? (
              <QuestionBank
                done={done}
                ready={ready}
                onWatch={(id) => setCurrentId(`pre:${id}`)}
                disabled={loading}
                onPick={(q) => {
                  setQuestion(q);
                  textareaRef.current?.focus();
                  textareaRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
                }}
              />
            ) : (
            <ul className="lib-list">
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
            )}
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
              <p>{length === "short" ? "Um vídeo curto leva cerca de 30 segundos a 1 minuto." : "Um vídeo de 3 a 5 minutos leva cerca de 1 a 2 minutos."} {elapsed}s</p>
            </div>
          ) : (
            <LessonPlayer key={current.id} lesson={current.lesson} audio={preId ? audios.get(preId) : undefined} />
          )}
        </div>
      </main>
    </div>
  );
}
