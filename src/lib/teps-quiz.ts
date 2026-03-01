import { TEPS_VOCAB, type VocabWord } from "./teps-vocab";

export type QuizSession = {
  correctCount: number;
  answeredIds: number[];   // correctly answered word IDs
  wrongIds: number[];      // incorrectly answered word IDs (at least once)
};

export type QuizQuestion = {
  word: VocabWord;
  correctIndex: number;
  choices: string[];
};

const SESSION_KEY_PREFIX = "personal-site-teps-";

export function getQuizSession(date: string): QuizSession {
  if (typeof window === "undefined") return { correctCount: 0, answeredIds: [], wrongIds: [] };
  try {
    const data = localStorage.getItem(SESSION_KEY_PREFIX + date);
    if (!data) return { correctCount: 0, answeredIds: [], wrongIds: [] };
    const parsed = JSON.parse(data);
    // Backcompat: sessions saved before wrongIds was added
    return { wrongIds: [], ...parsed };
  } catch {
    return { correctCount: 0, answeredIds: [], wrongIds: [] };
  }
}

export function saveQuizSession(date: string, session: QuizSession) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY_PREFIX + date, JSON.stringify(session));
  } catch {}
}

export function generateQuestion(answeredIds: number[]): QuizQuestion | null {
  const remaining = TEPS_VOCAB.filter((w) => !answeredIds.includes(w.id));
  if (remaining.length === 0) return null;

  const word = remaining[Math.floor(Math.random() * remaining.length)];
  const others = TEPS_VOCAB.filter((w) => w.id !== word.id);

  // Pick 3 random wrong answers
  const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
  const wrongChoices = shuffled.map((w) => w.meaning);

  // Insert correct answer at random position
  const correctIndex = Math.floor(Math.random() * 4);
  const choices = [...wrongChoices];
  choices.splice(correctIndex, 0, word.meaning);

  return { word, correctIndex, choices };
}

// Returns true if 20 correct answers reached (quest completion trigger)
export function recordCorrect(date: string, wordId: number): boolean {
  const session = getQuizSession(date);
  if (!session.answeredIds.includes(wordId)) {
    session.answeredIds.push(wordId);
    session.correctCount += 1;
  }
  saveQuizSession(date, session);
  return session.correctCount >= 20;
}

// Record a wrong answer; idempotent (won't duplicate)
export function recordWrong(date: string, wordId: number) {
  const session = getQuizSession(date);
  if (!session.wrongIds.includes(wordId)) {
    session.wrongIds.push(wordId);
    saveQuizSession(date, session);
  }
}
