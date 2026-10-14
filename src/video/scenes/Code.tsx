import { C, MONO } from "../theme";

const KEYWORDS = new Set([
  "function", "const", "let", "var", "return", "import", "from", "export", "default", "if", "else",
  "new", "async", "await", "type", "interface", "for", "of", "in", "while", "class", "extends",
]);
const LITERALS = new Set(["true", "false", "null", "undefined", "this"]);

const TOKEN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;

type Tok = { text: string; color: string; italic?: boolean };

export function tokenizeLine(line: string): Tok[] {
  const out: Tok[] = [];
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, str, tag, num, ident] = m;
    if (comment) out.push({ text, color: "#6b7bad", italic: true });
    else if (str) out.push({ text, color: "#a5e8a0" });
    else if (tag) out.push({ text, color: "#ff9ec4" });
    else if (num) out.push({ text, color: "#ffc27a" });
    else if (ident) {
      const rest = line.slice((m.index ?? 0) + text.length);
      if (KEYWORDS.has(text)) out.push({ text, color: "#c4a2ff" });
      else if (LITERALS.has(text)) out.push({ text, color: "#ffc27a" });
      else if (/^use[A-Z]/.test(text)) out.push({ text, color: C.accent2 });
      else if (/^\s*\(/.test(rest)) out.push({ text, color: "#8fb4ff" });
      else out.push({ text, color: C.text });
    } else out.push({ text, color: C.muted });
  }
  return out;
}

/** Código estático com realce de sintaxe. */
export function Code({ code, fontSize = 26 }: { code: string; fontSize?: number }) {
  return (
    <pre style={{ margin: 0, fontFamily: MONO, fontSize, lineHeight: 1.5, whiteSpace: "pre", overflow: "hidden" }}>
      {code.split("\n").map((line, i) => (
        <div key={i}>
          {line === "" ? " " : tokenizeLine(line).map((t, j) => (
            <span key={j} style={{ color: t.color, fontStyle: t.italic ? "italic" : "normal" }}>
              {t.text}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}
