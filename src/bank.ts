import bankData from "../data/questions.json";
import type { QuestionBank } from "../shared/questions";

export const bank = bankData as QuestionBank;

export const normalizeQuestion = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

const byId = new Map(bank.questions.map((q) => [q.id, q]));
export const questionById = (id: string) => byId.get(id);
