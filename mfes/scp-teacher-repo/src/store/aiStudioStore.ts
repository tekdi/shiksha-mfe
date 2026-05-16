import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIGenerationOutput, QuestionType, Difficulty } from '../utils/AIContentTypes';
import { 
  PipelineStage, 
  StageStatus, 
  PIPELINE_STAGES_ORDERED,
  PipelineStageEvent,
  PipelineProgressEvent,
  PipelineCompleteEvent,
  PipelineErrorEvent
} from '../types/sseTypes';

interface HistoryState {
  outputs: Record<string, AIGenerationOutput>;
}

export interface StageState {
  status: StageStatus;
  progress: number;
  message: string;
}

interface AIStudioStore {
  currentStep: number;
  selectedFile: File | null;
  selectedOutputTypes: string[];
  quizConfig: {
    questionType: QuestionType;
    count: number;
    difficulty: Difficulty;
  };
  generatedOutputs: Record<string, AIGenerationOutput>;
  originalOutputs: Record<string, AIGenerationOutput>;
  
  // Pipeline State
  pipelineJobId: string | null;
  pipelineStatus: 'idle' | 'running' | 'completed' | 'failed';
  pipelineStages: Record<PipelineStage, StageState>;
  pipelineError: { stage: PipelineStage; code: string; message: string } | null;
  pipelineStartedAt: number | null;
  sourceText: string;
  selectedLanguage: string;
  
  // History for Undo/Redo
  history: HistoryState[];
  historyIndex: number;

  // Actions
  setStep: (step: number) => void;
  setSelectedFile: (file: File | null) => void;
  toggleOutputType: (type: string) => void;
  setQuizConfig: (config: Partial<AIStudioStore['quizConfig']>) => void;
  setGeneratedOutputs: (outputs: Record<string, AIGenerationOutput>) => void;
  updateOutput: (type: string, output: AIGenerationOutput) => void;
  setLanguage: (language: string) => void;
  
  // Pipeline Actions
  startPipeline: (jobId: string) => void;
  handleStageEvent: (event: PipelineStageEvent) => void;
  handleProgressEvent: (event: PipelineProgressEvent) => void;
  handleCompleteEvent: (event: PipelineCompleteEvent) => void;
  handleErrorEvent: (event: PipelineErrorEvent) => void;
  resetPipeline: () => void;

  // Undo/Redo Actions
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  resetToOriginal: (type: string) => void;
}

function createInitialStages(): Record<PipelineStage, StageState> {
  const stages = {} as Record<PipelineStage, StageState>;
  for (const stage of PIPELINE_STAGES_ORDERED) {
    stages[stage] = {
      status: StageStatus.PENDING,
      progress: 0,
      message: '',
    };
  }
  return stages;
}

const useAIStudioStore = create<AIStudioStore>((set, get) => ({
  currentStep: 0,
  selectedFile: null,
  selectedOutputTypes: [],
  quizConfig: {
    questionType: 'mcq',
    count: 5,
    difficulty: 'medium',
  },
  generatedOutputs: {},
  originalOutputs: {},
  
  // Pipeline Initial State
  pipelineJobId: null,
  pipelineStatus: 'idle',
  pipelineStages: createInitialStages(),
  pipelineError: null,
  pipelineStartedAt: null,
  sourceText: '',
  selectedLanguage: 'auto',
  
  history: [],
  historyIndex: -1,

  setStep: (step) => set({ currentStep: step }),
  
  setSelectedFile: (file) => set({ selectedFile: file }),
  
  toggleOutputType: (type) => set((state) => ({
    selectedOutputTypes: state.selectedOutputTypes.includes(type)
      ? state.selectedOutputTypes.filter((t) => t !== type)
      : [...state.selectedOutputTypes, type]
  })),

  setQuizConfig: (config) => set((state) => ({
    quizConfig: { ...state.quizConfig, ...config }
  })),

  setGeneratedOutputs: (outputs) => set({ 
    generatedOutputs: outputs, 
    originalOutputs: JSON.parse(JSON.stringify(outputs)),
    history: [{ outputs: JSON.parse(JSON.stringify(outputs)) }],
    historyIndex: 0
  }),

  updateOutput: (type, output) => {
    const { generatedOutputs, saveToHistory } = get();
    const newOutputs = { ...generatedOutputs, [type]: output };
    set({ generatedOutputs: newOutputs });
    saveToHistory();
  },
  
  setLanguage: (language) => set({ selectedLanguage: language }),

  // Pipeline Actions
  startPipeline: (jobId: string) => set({
    pipelineJobId: jobId,
    pipelineStatus: 'running',
    pipelineStages: createInitialStages(),
    pipelineError: null,
    pipelineStartedAt: Date.now(),
  }),

  handleStageEvent: (event) => set((state) => {
    if (state.pipelineStages[event.stage].status === event.status) {
      return state;
    }
    const progress = event.status === StageStatus.COMPLETED ? 100 : state.pipelineStages[event.stage].progress;
    return {
      pipelineStages: {
        ...state.pipelineStages,
        [event.stage]: {
          ...state.pipelineStages[event.stage],
          status: event.status,
          message: event.message,
          progress,
        }
      }
    };
  }),

  handleProgressEvent: (event) => set((state) => ({
    pipelineStages: {
      ...state.pipelineStages,
      [event.stage]: {
        ...state.pipelineStages[event.stage],
        progress: event.percent,
        message: event.detail,
      }
    }
  })),

  handleCompleteEvent: (event) => {
    set({
      pipelineStatus: 'completed',
    });
  },

  handleErrorEvent: (event) => set((state) => ({
    pipelineStatus: 'failed',
    pipelineError: {
      stage: event.stage,
      code: event.code,
      message: event.message,
    },
    pipelineStages: {
      ...state.pipelineStages,
      [event.stage]: {
        ...state.pipelineStages[event.stage],
        status: StageStatus.FAILED,
        message: event.message,
      }
    }
  })),

  resetPipeline: () => set({
    pipelineJobId: null,
    pipelineStatus: 'idle',
    pipelineStages: createInitialStages(),
    pipelineError: null,
    pipelineStartedAt: null,
  }),

  saveToHistory: () => {
    const { generatedOutputs, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ outputs: JSON.parse(JSON.stringify(generatedOutputs)) });
    
    // Limit history to 30 states
    if (newHistory.length > 30) newHistory.shift();
    
    set({ 
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({ 
        historyIndex: prevIndex,
        generatedOutputs: JSON.parse(JSON.stringify(history[prevIndex].outputs))
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({ 
        historyIndex: nextIndex,
        generatedOutputs: JSON.parse(JSON.stringify(history[nextIndex].outputs))
      });
    }
  },

  resetToOriginal: (type) => {
    const { originalOutputs, generatedOutputs, saveToHistory } = get();
    if (originalOutputs[type]) {
      const newOutputs = { ...generatedOutputs, [type]: JSON.parse(JSON.stringify(originalOutputs[type])) };
      set({ generatedOutputs: newOutputs });
      saveToHistory();
    }
  }
}));

export default useAIStudioStore;
