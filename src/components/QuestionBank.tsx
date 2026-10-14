import { useMemo, useState } from "react";
import bankData from "../../data/questions.json";
import { topicLabel, type QuestionBank as Bank } from "../../shared/questions";

const bank = bankData as Bank;
const PAGE = 30;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export function QuestionBank({ done, disabled, onPick }: { done: Set<string>; disabled: boolean; onPick: (question: string) => void }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of bank.questions) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1);
    return [...counts.entries()];
  }, []);

  const filtered = useMemo(() => {
    const needle = norm(query);
    return bank.questions.filter((q) => (topic === "all" || q.topic === topic) && (!needle || norm(q.question).includes(needle)));
  }, [query, topic]);

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

export { norm as normalizeQuestion };
