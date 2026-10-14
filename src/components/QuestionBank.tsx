import { useMemo, useState } from "react";
import { topicLabel } from "../../shared/questions";
import { bank, normalizeQuestion as norm } from "../bank";

const PAGE = 30;

export function QuestionBank({
  done,
  ready,
  disabled,
  onPick,
  onWatch,
}: {
  done: Set<string>;
  ready: Set<string>;
  disabled: boolean;
  onPick: (question: string) => void;
  onWatch: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyReady, setOnlyReady] = useState(false);
  const [topic, setTopic] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of bank.questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    return [...counts.entries()];
  }, []);

  const filtered = useMemo(() => {
    const needle = norm(query);
    return bank.questions.filter((q) => (topic === "all" || q.topic === topic) && (!onlyReady || ready.has(q.id)) && (!needle || norm(q.question).includes(needle)));
  }, [query, topic, onlyReady, ready]);

  const pickRandom = () => {
    const pool = filtered.filter((q) => !done.has(norm(q.question)));
    const list = pool.length ? pool : filtered;
    if (list.length) onPick(list[Math.floor(Math.random() * list.length)].question);
  };

  return (
    <div className="bank">
      <div className="bank-filters">
        <input
          type="search"
          placeholder={`Buscar entre ${bank.questions.length} perguntas…`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          aria-label="Buscar perguntas"
        />
        <select
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setShown(PAGE);
          }}
          aria-label="Tema"
        >
          <option value="all">Todos os temas</option>
          {topics.map(([t, n]) => (
            <option key={t} value={t}>
              {topicLabel(t)} ({n})
            </option>
          ))}
        </select>
        <label className="toggle small-toggle">
          <input type="checkbox" checked={onlyReady} onChange={(e) => { setOnlyReady(e.target.checked); setShown(PAGE); }} />
          <span>Só com vídeo pronto ({ready.size})</span>
        </label>
        <button type="button" className="btn secondary small" onClick={pickRandom} disabled={disabled || filtered.length === 0}>
          🎲 Sortear uma que ainda não vi
        </button>
      </div>

      <ul className="bank-list">
        {filtered.slice(0, shown).map((q) => {
          const seen = done.has(norm(q.question));
          return (
            <li key={q.id}>
              <button type="button" className="bank-q" onClick={() => onPick(q.question)} disabled={disabled} title="Usar esta pergunta">
                <span className="bank-text">{q.question}</span>
                <span className="bank-meta">
                  {topicLabel(q.topic)}
                  {seen ? " · ✓ já gerado" : ""}
                </span>
              </button>
              {ready.has(q.id) ? (
                <button type="button" className="bank-watch" onClick={() => onWatch(q.id)} disabled={disabled} title="Assistir o vídeo pronto" aria-label="Assistir o vídeo pronto">
                  ▶
                </button>
              ) : null}
              <a className="bank-src" href={q.url} target="_blank" rel="noreferrer" title="Ver a resposta escrita na fonte" aria-label="Ver na fonte">
                ↗
              </a>
            </li>
          );
        })}
        {filtered.length === 0 ? <li className="bank-empty">Nenhuma pergunta encontrada.</li> : null}
      </ul>
      {filtered.length > shown ? (
        <button type="button" className="btn secondary small" onClick={() => setShown((n) => n + PAGE)}>
          Mostrar mais ({filtered.length - shown})
        </button>
      ) : null}
      <p className="bank-credit">
        Perguntas de <a href={bank.source.url} target="_blank" rel="noreferrer">{bank.source.repo}</a> (licença {bank.source.license}). Os vídeos são gerados pela Claude; a fonte só fornece as perguntas.
      </p>
    </div>
  );
}

