export type BankQuestion = { id: string; question: string; topic: string; url: string };

export type QuestionBank = {
  source: { repo: string; license: "MIT"; url: string };
  questions: BankQuestion[];
};

/** Nome dos temas em português (o repositório de origem usa inglês). */
export const TOPIC_LABEL: Record<string, string> = {
  "Core React": "React básico",
  Hooks: "Hooks",
  "Modern React Features (React 18/19)": "React 18 e 19",
  "React Router": "Rotas",
  "React Redux": "Redux",
  "React Testing": "Testes",
  "React Internationalization": "Internacionalização",
  "React Native": "React Native",
  "React Supported Libraries and Integration": "Bibliotecas",
  Miscellaneous: "Diversos",
  "Old Q&A": "Antigas",
};

export const topicLabel = (topic: string) => TOPIC_LABEL[topic] ?? topic;
