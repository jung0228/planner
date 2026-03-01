export interface MultiQuestion {
  num: number;
  question: string;
  options: string[];
  optionTexts: string[];
  correctAnswer: string;
  script: string;
}

export interface RawSingleProblem {
  id: number;
  audio: string;
  question: string;
  options: string[];
  optionTexts: string[];
  correctAnswer: string;
  script: string;
}

export interface RawMultiProblem {
  id: number;
  audio: string;
  script?: string;
  questions: MultiQuestion[];
}

export type RawProblem = RawSingleProblem | RawMultiProblem;

export interface NormalizedProblem {
  id: number;
  audio: string;
  script: string;
  questions: MultiQuestion[];
}

export type Mode = "review" | "test";

export type ScriptGradeStatus = "perfect" | "fair" | "poor";

export interface ScriptGradeResult {
  status: ScriptGradeStatus;
  similarity: number;
  message: string;
}
