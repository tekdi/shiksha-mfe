export type QuestionType = 'mcq' | 'fill_in_the_blanks' | 'match_the_pair';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze';

export interface KeyTakeaway {
  id: string;
  title: string;
  summary: string;
  pageRef: string;
  confidence: number;
}

export interface KeyTakeawaysOutput {
  type: 'key_takeaways';
  sourceFile: string;
  generatedAt: string;
  takeaways: KeyTakeaway[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  context: string;
  relatedTerms: string[];
  latex: string | null;
}

export interface GlossaryOutput {
  type: 'glossary';
  sourceFile: string;
  generatedAt: string;
  terms: GlossaryTerm[];
}

export interface MCQAnswer {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  latex: string | null;
  answers: MCQAnswer[];
  explanation: string;
  difficulty: Difficulty;
  bloomsLevel: BloomsLevel;
  evidence?: {
    quote: string;
    pageRef?: string;
  };
}

export interface FITBBlank {
  answer: string;
  alternatives: string[];
  tip: string;
}

export interface FITBQuestion {
  id: string;
  sentence: string; // "The process is called *photosynthesis*."
  blanks: FITBBlank[];
  latex: string | null;
  difficulty: Difficulty;
  bloomsLevel: BloomsLevel;
  evidence?: {
    quote: string;
    pageRef?: string;
  };
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchQuestion {
  id: string;
  instruction: string;
  pairs: MatchPair[];
  distractors: string[];
  latex: string | null;
  difficulty: Difficulty;
  bloomsLevel: BloomsLevel;
  evidence?: {
    quote: string;
    pageRef?: string;
  };
}

export type QuizQuestion = MCQQuestion | FITBQuestion | MatchQuestion;

export interface QuizOutput {
  type: 'quiz';
  questionType: QuestionType;
  sourceFile: string;
  generatedAt: string;
  questions: QuizQuestion[];
}

export interface LessonSlide {
  id: string;
  title: string;
  body: string;
}

export interface LessonOutput {
  type: 'lesson';
  sourceFile: string;
  generatedAt: string;
  slides: LessonSlide[];
  htmlContent: string;
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export type AIGenerationOutput = KeyTakeawaysOutput | GlossaryOutput | QuizOutput | LessonOutput;


export interface AIStudioState {
  currentStep: number;
  selectedFile: File | null;
  selectedOutputTypes: string[];
  quizConfig: {
    questionType: QuestionType;
    count: number;
    difficulty: Difficulty;
  };
  generatedOutputs: Record<string, AIGenerationOutput>; // Key is output type
}
