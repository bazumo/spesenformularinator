import { ExpenseInfo } from "./App";

export const TEMPLATES: Record<string, Partial<ExpenseInfo>> = {
  "CTF-food": {
    formName: "CTF Food",
    committee: "x031 Online CTF",
    purpose: "Food for online ctf",
  },
  "CTF-organizers": {
    formName: "CTF Organizers",
    committee: "CTF organizers prize fond",
  },
  "Insomnihack Trasnport": {
    committee: "x032 Insomni Hack (Lausanne)",
    formName: "Insomnihack SBB reimbursement",
    purpose: "Transport",
  },
};
