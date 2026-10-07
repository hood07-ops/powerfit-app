export type KnowledgeEntry = {
  id: string;
  surfaces: string[];
  keywords: string[];
  es: string;
  en: string;
};

export { KNOWLEDGE, findKnowledgeAnswer, SUGGESTIONS } from "./knowledge.js";
