import { AIGenerationOutput } from '../utils/AIContentTypes';

export const MOCK_KEY_TAKEAWAYS: AIGenerationOutput = {
  type: 'key_takeaways',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  takeaways: [
    {
      id: 'kt-1',
      title: 'Light-Dependent Reactions',
      summary: 'Occur in the thylakoid membranes where light energy is converted into chemical energy (ATP and NADPH).',
      pageRef: 'p.14',
      confidence: 0.98,
    },
    {
      id: 'kt-2',
      title: 'The Calvin Cycle',
      summary: 'A set of light-independent chemical reactions that convert carbon dioxide and other compounds into glucose.',
      pageRef: 'p.16',
      confidence: 0.95,
    },
    {
      id: 'kt-3',
      title: 'Role of Chlorophyll',
      summary: 'Primary pigment that absorbs light energy, primarily in the blue and red portions of the electromagnetic spectrum.',
      pageRef: 'p.12',
      confidence: 0.92,
    },
  ],
};

export const MOCK_GLOSSARY: AIGenerationOutput = {
  type: 'glossary',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  terms: [
    {
      id: 'gl-1',
      term: 'Chloroplast',
      definition: 'An organelle found in plant and algae cells where photosynthesis occurs.',
      context: 'The mesophyll cells of the leaf contain numerous chloroplasts.',
      relatedTerms: ['thylakoid', 'stroma'],
      latex: null,
    },
    {
      id: 'gl-2',
      term: 'Photosynthesis Equation',
      definition: 'The overall chemical reaction representing the conversion of light energy to chemical energy.',
      context: 'Understanding the stoichiometry of the process is essential.',
      relatedTerms: ['glucose', 'carbon dioxide'],
      latex: '6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2',
    },
    {
      id: 'gl-3',
      term: 'Stroma',
      definition: 'The colorless fluid surrounding the grana within the chloroplast.',
      context: 'The Calvin cycle takes place in the stroma.',
      relatedTerms: ['Calvin cycle', 'chloroplast'],
      latex: null,
    },
  ],
};

export const MOCK_QUIZ_MCQ: AIGenerationOutput = {
  type: 'quiz',
  questionType: 'mcq',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'q-1',
      question: 'Which of the following is produced during the light-dependent reactions?',
      latex: null,
      answers: [
        { text: 'ATP and NADPH', correct: true, feedback: 'Correct! These are the primary energy carriers produced.' },
        { text: 'Glucose', correct: false, feedback: 'Incorrect. Glucose is produced in the Calvin cycle.' },
        { text: 'Carbon Dioxide', correct: false, feedback: 'Incorrect. Carbon dioxide is a reactant, not a product.' },
        { text: 'Water', correct: false, feedback: 'Incorrect. Water is split at the beginning of the process.' },
      ],
      explanation: 'Light-dependent reactions utilize solar energy to charge ATP and NADPH for the next stage.',
      difficulty: 'medium',
      bloomsLevel: 'remember',
      evidence: { quote: 'Light-dependent reactions utilize solar energy...', pageRef: 'p.14' }
    },
  ],
};

export const MOCK_QUIZ_FITB: AIGenerationOutput = {
  type: 'quiz',
  questionType: 'fill_in_the_blanks',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'fb-1',
      sentence: 'The primary pigment involved in photosynthesis is *chlorophyll*.',
      blanks: [
        { answer: 'chlorophyll', alternatives: ['chlorophyl'], tip: 'Gives plants their green color' },
      ],
      latex: null,
      difficulty: 'easy',
      bloomsLevel: 'remember',
      evidence: { quote: 'The main pigment for photosynthesis is chlorophyll...', pageRef: 'p.12' }
    },
  ],
};

export const MOCK_QUIZ_MATCH: AIGenerationOutput = {
  type: 'quiz',
  questionType: 'match_the_pair',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'mp-1',
      instruction: 'Match the site with the reaction that occurs there.',
      pairs: [
        { left: 'Thylakoid', right: 'Light Reactions' },
        { left: 'Stroma', right: 'Calvin Cycle' },
      ],
      distractors: ['Mitochondria', 'Cytoplasm'],
      latex: null,
      difficulty: 'medium',
      bloomsLevel: 'understand',
      evidence: { quote: 'Thylakoids are the site of light reactions while stroma hosts the Calvin cycle.', pageRef: 'p.15' }
    },
  ],
};

export const MOCK_LESSON: AIGenerationOutput = {
  type: 'lesson',
  sourceFile: 'Biology_Ch3_Photosynthesis.pdf',
  generatedAt: new Date().toISOString(),
  slides: [
    { id: 's1', title: 'What is Photosynthesis?', body: 'Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose.' },
    { id: 's2', title: 'The Light Reactions', body: 'Light-dependent reactions occur in the thylakoid membranes, where water is split and ATP/NADPH are produced.' },
    { id: 's3', title: 'The Calvin Cycle', body: 'In the stroma, CO₂ is fixed into glucose using the ATP and NADPH from the light reactions.' },
  ],
  htmlContent: '<!DOCTYPE html><html><body><h1>Mock Lesson</h1></body></html>',
  branding: { primaryColor: '#123B5D', secondaryColor: '#F5A623', fontFamily: 'Inter, sans-serif' },
};

