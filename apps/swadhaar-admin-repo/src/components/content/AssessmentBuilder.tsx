import { isValidMinutes, sanitizeMinutes, MINUTES_ERROR, MINUTES_MAX_DIGITS } from '@/utils/minutesInput';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  // FormControlLabel,
  Checkbox,
  Radio,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { createModule, createTestLesson, getCourseHierarchy, getCourseList, getModuleList } from '@/services/CourseService';
import AssessmentService from '@/services/AssessmentService';
// import ChooseGroupsUsersDialog, { AssignTarget } from '@/components/common/ChooseGroupsUsersDialog';
import { BankQuestion, fetchQuestionBank, mapBankQuestion } from '@/services/ContentLibraryService';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';
import {
  ContentFormHeader,
  FormAlerts,
  FormCardHeader,
  CARD_SX,
  OUTLINED_FIELD_SX,
  LabeledTextField,
} from '@/components/content/ContentFormParts';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  questionNumber: number;
  type: string;
  tags: string;
  prompt: string;
  options: QuestionOption[];
  fromBank?: boolean;
  /** Set for questions loaded from the assessment service; absent for ones written in this form */
  questionId?: string;
}

export const QUESTION_TYPES = [
  'Multiple choice – single answer',
  'Multiple choice – multi answer',
  'True / False',
  'Short answer',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

const getQuestionTypeChip = (type?: string): string => {
  switch (type) {
    case 'Multiple choice – single answer':
      return 'MCQ single';
    case 'Multiple choice – multi answer':
      return 'MCQ multi';
    case 'True / False':
      return 'True / False';
    case 'Short answer':
      return 'Short answer';
    default:
      return 'MCQ single';
  }
};

const BRD_TAG_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  font: "500 11px/1 'IBM Plex Mono', monospace",
  color: '#1E3A8A',
  backgroundColor: '#E0E7FF',
  borderRadius: '4px',
  px: '6px',
  py: '3px',
  whiteSpace: 'nowrap' as const,
};

const SECONDARY_ACTION_BTN_SX = {
  borderColor: '#BDB9B1',
  color: '#1F1E1C',
  fontSize: '13px',
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: '6px',
  height: 32,
  px: 1.5,
  backgroundColor: '#FFFFFF',
  '&:hover': {
    borderColor: '#1F1E1C',
    backgroundColor: '#F9F9F8',
    color: '#1F1E1C',
  },
};

const EDIT_LINKED_OPTIONS = [
  'Course 1 · Introduction to Saving',
  'Course 0 · Introduction to Swadhaar FinAccess',
  'None',
];

/**
 * 10 sample questions for Course 1 Assessment, matching Prototype L10 & course document.
 */
export const SAMPLE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q-1',
    questionNumber: 1,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Saving · Difficulty: [—] · Module: Course 1',
    prompt: 'What should a Field Trainer do before recommending a financial product to a household?',
    fromBank: true,
    options: [
      { id: 'opt-1-1', text: 'Recommend the product offering the highest interest rate', isCorrect: false },
      { id: 'opt-1-2', text: 'Understand the household’s financial needs, goals, and timeline', isCorrect: true },
      { id: 'opt-1-3', text: 'Ask the household to take a loan', isCorrect: false },
      { id: 'opt-1-4', text: 'Recommend the same product to every household', isCorrect: false },
    ],
  },
  {
    id: 'q-2',
    questionNumber: 2,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Saving · Difficulty: [—] · Module: Course 1',
    prompt: 'Why is financial planning important for rural households?',
    fromBank: true,
    options: [
      { id: 'opt-2-1', text: 'It helps households manage irregular incomes and achieve future goals', isCorrect: true },
      { id: 'opt-2-2', text: 'It guarantees immediate wealth without work', isCorrect: false },
      { id: 'opt-2-3', text: 'It replaces the need to earn an income', isCorrect: false },
      { id: 'opt-2-4', text: 'It eliminates all future expenses', isCorrect: false },
    ],
  },
  {
    id: 'q-3',
    questionNumber: 3,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Goals · Difficulty: [—] · Module: Course 1',
    prompt: 'Which of the following is an example of a long-term financial goal?',
    fromBank: true,
    options: [
      { id: 'opt-3-1', text: 'Buying groceries for the week', isCorrect: false },
      { id: 'opt-3-2', text: 'Saving for a child’s higher education or buying land', isCorrect: true },
      { id: 'opt-3-3', text: 'Paying this month’s electricity bill', isCorrect: false },
      { id: 'opt-3-4', text: 'Recharging a mobile phone', isCorrect: false },
    ],
  },
  {
    id: 'q-4',
    questionNumber: 4,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Emergency Fund · Difficulty: Easy · Module: Course 1',
    prompt: 'How many months of basic living expenses should ideally be kept in an emergency saving fund?',
    fromBank: true,
    options: [
      { id: 'opt-4-1', text: 'At least 3 to 6 months of basic household expenses', isCorrect: true },
      { id: 'opt-4-2', text: 'Only 1 or 2 days of expenses', isCorrect: false },
      { id: 'opt-4-3', text: '5 to 10 years of total salary', isCorrect: false },
      { id: 'opt-4-4', text: 'No emergency fund is needed if credit is available', isCorrect: false },
    ],
  },
  {
    id: 'q-5',
    questionNumber: 5,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Formal vs Informal · Difficulty: Easy · Module: Course 1',
    prompt: 'What is a major advantage of formal savings in a bank over informal saving at home?',
    fromBank: true,
    options: [
      { id: 'opt-5-1', text: 'Safety of funds, deposit insurance, and earned interest', isCorrect: true },
      { id: 'opt-5-2', text: 'No KYC or identification is ever required', isCorrect: false },
      { id: 'opt-5-3', text: 'Guaranteed 100% returns within one week', isCorrect: false },
      { id: 'opt-5-4', text: 'Cash can be lost or stolen without any legal recourse', isCorrect: false },
    ],
  },
  {
    id: 'q-6',
    questionNumber: 6,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Budgeting · Difficulty: Medium · Module: Course 1',
    prompt: 'When creating a household budget, which expense category should always be prioritized first?',
    fromBank: true,
    options: [
      { id: 'opt-6-1', text: 'Essential needs (food, shelter, basic healthcare, education)', isCorrect: true },
      { id: 'opt-6-2', text: 'Luxury purchases and entertainment', isCorrect: false },
      { id: 'opt-6-3', text: 'Speculative investments and lotteries', isCorrect: false },
      { id: 'opt-6-4', text: 'Borrowing from informal moneylenders', isCorrect: false },
    ],
  },
  {
    id: 'q-7',
    questionNumber: 7,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Banking Services · Difficulty: Medium · Module: Course 1',
    prompt: 'Which document is commonly acceptable as officially valid proof of identity for opening a basic savings account?',
    fromBank: true,
    options: [
      { id: 'opt-7-1', text: 'Officially valid KYC document (e.g. Aadhaar card / Voter ID)', isCorrect: true },
      { id: 'opt-7-2', text: 'Local private shop receipt', isCorrect: false },
      { id: 'opt-7-3', text: 'Handwritten note from a neighbor', isCorrect: false },
      { id: 'opt-7-4', text: 'Movie theater membership card', isCorrect: false },
    ],
  },
  {
    id: 'q-8',
    questionNumber: 8,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Digital Payments · Difficulty: Easy · Module: Course 1',
    prompt: 'What confidential information should a user NEVER share with anyone regarding their bank or UPI account?',
    fromBank: true,
    options: [
      { id: 'opt-8-1', text: 'UPI PIN, OTP, and debit card CVV', isCorrect: true },
      { id: 'opt-8-2', text: 'Bank branch customer care toll-free number', isCorrect: false },
      { id: 'opt-8-3', text: 'Their own account holder name', isCorrect: false },
      { id: 'opt-8-4', text: 'The city where their bank branch is located', isCorrect: false },
    ],
  },
  {
    id: 'q-9',
    questionNumber: 9,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Debt Management · Difficulty: Medium · Module: Course 1',
    prompt: 'What is a significant risk of taking loans from informal moneylenders rather than regulated microfinance institutions?',
    fromBank: true,
    options: [
      { id: 'opt-9-1', text: 'Exorbitant compound interest rates and lack of regulatory protection', isCorrect: true },
      { id: 'opt-9-2', text: 'Lower interest rates than public sector banks', isCorrect: false },
      { id: 'opt-9-3', text: 'Automatic insurance coverage on loan default', isCorrect: false },
      { id: 'opt-9-4', text: 'Standardized and transparent monthly statements', isCorrect: false },
    ],
  },
  {
    id: 'q-10',
    questionNumber: 10,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Insurance · Difficulty: Medium · Module: Course 1',
    prompt: 'What is the primary role of micro-insurance for rural and low-income families?',
    fromBank: true,
    options: [
      { id: 'opt-10-1', text: 'Protecting the household from severe financial shock due to illness or accidental loss', isCorrect: true },
      { id: 'opt-10-2', text: 'Doubling cash savings within one month', isCorrect: false },
      { id: 'opt-10-3', text: 'Avoiding opening a formal bank account', isCorrect: false },
      { id: 'opt-10-4', text: 'Replacing the need for active daily employment', isCorrect: false },
    ],
  },
];

const createBlankQuestion = (questionNumber: number): AssessmentQuestion => ({
  id: `q-${Date.now()}-${questionNumber}`,
  questionNumber,
  type: 'Multiple choice – single answer',
  tags: '',
  prompt: '',
  fromBank: false,
  options: [
    { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
    { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
    { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
    { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
  ],
});


const toServiceType = (type: string): string => {
  if (type === 'True / False') return 'true_false';
  if (type === 'Short answer') return 'ftb';
  return 'mcq';
};

const toBuilderType = (type?: string, allowPartialScoring?: boolean): string => {
  if (type === 'true_false') return 'True / False';
  if (type === 'ftb') return 'Short answer';
  return allowPartialScoring ? 'Multiple choice – multi answer' : 'Multiple choice – single answer';
};

const bankToBuilderQuestion = (q: BankQuestion, questionNumber: number): AssessmentQuestion => ({
  id: `q-bank-${q.questionId}`,
  questionId: q.questionId,
  questionNumber,
  type: toBuilderType(q.type, q.allowPartialScoring),
  tags: q.description || '',
  prompt: q.text,
  fromBank: true,
  options: q.options.map((opt, idx) => ({ id: `opt-${q.questionId}-${idx}`, text: opt.text, isCorrect: opt.isCorrect })),
});

const toServiceOptions = (q: AssessmentQuestion) =>
  q.options
    .filter((opt) => opt.text.trim())
    .map((opt, idx) => ({ text: opt.text.trim(), isCorrect: opt.isCorrect, position: idx + 1 }));

/** Edit-relevant fields of a question, used to detect which loaded questions changed */
const questionSnapshot = (q: AssessmentQuestion): string =>
  JSON.stringify([q.type, q.tags, q.prompt.trim(), toServiceOptions(q)]);

// Runs async tasks one after another (order matters for question numbering) without awaiting inside a loop
const runSequentially = (tasks: Array<() => Promise<unknown>>): Promise<unknown> =>
  tasks.reduce<Promise<unknown>>((chain, task) => chain.then(task), Promise.resolve());

// The service rejects duplicate option texts; returns an error message for the first offending question
const findDuplicateOptionError = (items: AssessmentQuestion[]): string | null => {
  for (const q of items.filter((item) => !item.fromBank && item.prompt.trim())) {
    const texts = q.options.map((opt) => opt.text.trim()).filter(Boolean);
    const duplicate = texts.find((text, idx) => texts.indexOf(text) !== idx);
    if (duplicate) {
      return `Question ${q.questionNumber} has the option "${duplicate}" more than once. Options must be unique.`;
    }
  }
  return null;
};

const buildTestSettings = (f: {
  name: string;
  description: string;
  timeLimit: string;
  passMark: string;
  attempts: string;
  shuffle: boolean;
  showExplanations: boolean;
}) => ({
  title: f.name.trim(),
  description: f.description.trim(),
  timeDuration: f.timeLimit ? Number(f.timeLimit) : 15,
  passingMarks: Number.parseInt(f.passMark, 10) || 70,
  attempts: f.attempts === 'Unlimited' ? 0 : Number.parseInt(f.attempts, 10) || 1,
  questionsShuffle: f.shuffle,
  showCorrectAnswer: f.showExplanations,
});

const buildQuestionPayload = (q: AssessmentQuestion, testId: string, sectionId: string) => ({
  text: q.prompt.trim(),
  level: 'easy',
  marks: 1,
  status: 'published',
  idealTime: 60,
  gradingType: 'quiz',
  testId,
  sectionId,
  isCompulsory: true,
  description: q.tags || '',
  type: toServiceType(q.type),
  allowPartialScoring: q.type === 'Multiple choice – multi answer',
  options: toServiceOptions(q),
});

// The service requires a sectionId whenever a testId is sent, and the builder has no sections,
// so every assessment gets one default section.
const createDefaultSection = async (testId: string): Promise<string> => {
  const sectionRes = await AssessmentService.createSection({
    title: 'Section 1',
    description: 'Core Assessment Section',
    testId,
    ordering: 1,
    status: 'published',
  });
  const sectionId = sectionRes?.result?.sectionId || sectionRes?.result?.id;
  if (!sectionId) throw new Error('Section was created without an id.');
  return sectionId;
};

/** Questions of GET /tests/:id/test-hierarchy, flattened across sections */
export const readHierarchyQuestions = (res: any): { questions: AssessmentQuestion[]; sectionId?: string } => {
  const root = res?.result?.test ?? res?.result ?? res;
  const sections: any[] = root?.sections || [];
  const raw: any[] = [
    ...sections.flatMap((sec) =>
      (sec.questions || []).map((item: any) => ({ ...(item.question ?? item), sectionId: sec.sectionId || sec.id }))
    ),
    ...(root?.questions || []),
  ];
  const questions = raw.map((q, idx): AssessmentQuestion => {
    const options = [...(q.options || [])].sort(
      (a: any, b: any) => (a.position ?? a.ordering ?? 0) - (b.position ?? b.ordering ?? 0)
    );
    return {
      id: q.questionId || q.id || `q-loaded-${idx}`,
      questionId: q.questionId || q.id,
      questionNumber: idx + 1,
      type: toBuilderType(q.type, q.allowPartialScoring),
      tags: q.description || '',
      prompt: q.text || '',
      fromBank: false,
      options: options.map((opt: any, optIdx: number) => ({
        id: opt.questionOptionId || opt.optionId || opt.id || `opt-${idx}-${optIdx}`,
        text: opt.text || '',
        isCorrect: Boolean(opt.isCorrect),
      })),
    };
  });
  return { questions, sectionId: sections[0]?.sectionId || sections[0]?.id };
};

/** Maps a loaded assessment name to the linked-course option shown in edit mode. */
const FINAL_ASSESSMENT_MODULE = 'Final Assessment';
const MAX_MODULE_TITLE_ATTEMPTS = 5;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const linkedContentFromName = (assessmentName?: string): string | null => {
  if (assessmentName?.includes('Course 0')) return 'Course 0 · Introduction to Swadhaar FinAccess';
  if (assessmentName?.includes('Course 1')) return 'Course 1 · Introduction to Saving';
  return null;
};

export interface AssessmentBuilderProps {
  /** Omit for the create page; pass the route id ('new' or an existing id) for the builder route. */
  assessmentId?: string;
}

export function AssessmentBuilder({ assessmentId }: Readonly<AssessmentBuilderProps>) {
  const router = useRouter();
  const isCreatePage = assessmentId === undefined;
  const isNew = isCreatePage || assessmentId === 'new';

  // Details
  const [name, setName] = useState('');
  const [linkedContent, setLinkedContent] = useState('Course 1 · Introduction to Saving');
  const [linkedOptions, setLinkedOptions] = useState<string[]>(EDIT_LINKED_OPTIONS);
  const [timeLimit, setTimeLimit] = useState('');
  const [description, setDescription] = useState(
    'Let us now test your understanding of the concepts covered in this course.'
  );

  // Questions state. Both the create and edit pages open on a single blank question.
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(() => [createBlankQuestion(1)]);
  // Section new questions are added to when editing, and the loaded state used to find changed questions
  const sectionIdRef = useRef<string | undefined>(undefined);
  const loadedSnapshots = useRef<Record<string, string>>({});
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);

  // Settings / Rules
  const [passMark, setPassMark] = useState('70');
  const [attempts, setAttempts] = useState('[N]');
  const [shuffle, setShuffle] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  // Assign to & Notifications
  // const [assignedGroups, setAssignedGroups] = useState<AssignTarget[]>([]);
  // const [assignedUsers, setAssignedUsers] = useState<AssignTarget[]>([]);
  const [notifyCompletion, setNotifyCompletion] = useState<boolean>(true);
  const [notifyFailure, setNotifyFailure] = useState<boolean>(true);

  // Dialog states
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Question bank search / selection
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);

  // Auto-generate by tags state
  const [genTag, setGenTag] = useState('Topic: Saving');
  const [genCount, setGenCount] = useState('3');
  const [genDifficulty, setGenDifficulty] = useState('Medium');

  // Loading & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Navigation guard against unsaved changes
  const isDirty = isCreatePage && Boolean(name.trim() && !successMsg && !loading);
  useUnsavedChangesGuard(
    isDirty,
    'You have unsaved changes to this assessment. Are you sure you want to leave this page?'
  );

  // Load existing assessment (settings + questions) when editing an existing id
  useEffect(() => {
    if (isNew || !assessmentId) return;
    Promise.all([AssessmentService.getTestById(assessmentId), AssessmentService.getTestHierarchy(assessmentId)])
      .then(([testRes, hierarchyRes]) => {
        const test = testRes?.result?.test ?? testRes?.result ?? {};
        const title = test.title || test.name;
        if (title) setName(title);
        setDescription(test.description || '');
        if (test.timeDuration) setTimeLimit(String(test.timeDuration));
        if (test.passingMarks !== undefined && test.passingMarks !== null) setPassMark(String(test.passingMarks));
        if (test.attempts !== undefined && test.attempts !== null) {
          setAttempts(Number(test.attempts) === 0 ? 'Unlimited' : String(test.attempts));
        }
        if (test.questionsShuffle !== undefined) setShuffle(Boolean(test.questionsShuffle));
        if (test.showCorrectAnswer !== undefined) setShowExplanations(Boolean(test.showCorrectAnswer));
        const linked = linkedContentFromName(title);
        if (linked) setLinkedContent(linked);

        const { questions: loaded, sectionId } = readHierarchyQuestions(hierarchyRes);
        sectionIdRef.current = sectionId;
        loadedSnapshots.current = Object.fromEntries(
          loaded.map((q) => [q.questionId as string, questionSnapshot(q)])
        );
        setQuestions(loaded.length > 0 ? loaded : [createBlankQuestion(1)]);
        setExpandedIndex(0);
      })
      .catch((err) => {
        console.error('Failed to load assessment details:', err);
        setError('Failed to load assessment details.');
      });
  }, [assessmentId, isNew]);

  // Course the page was opened from (course page → "Open in Assessments"); it is the linked content
  const targetCourseId = typeof router.query.courseId === 'string' ? router.query.courseId : '';

  // Load actual courses for linkedContent dropdown
  useEffect(() => {
    if (!router.isReady) return;
    Promise.all([
      getCourseList({ limit: 50 }),
      targetCourseId ? getCourseHierarchy(targetCourseId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([res, targetCourse]) => {
        const targetName = targetCourse?.name || targetCourse?.title;
        if (res?.content?.length > 0 || targetName) {
          const names = (res?.content || []).map((c) => c.name).filter(Boolean);
          const combined = Array.from(
            new Set(['Course 1 · Introduction to Saving', ...(targetName ? [targetName] : []), ...names, 'None'])
          );
          setLinkedOptions(combined);
        }
        if (targetName) setLinkedContent(targetName);
      })
      .catch((err) => {
        console.error('Failed to load courses for assessment:', err);
      });
  }, [router.isReady, targetCourseId]);

  // Question actions
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });
    setQuestions(updated);
    setExpandedIndex(targetIndex);
  };

  const handleAddQuestion = () => {
    const newQ = createBlankQuestion(questions.length + 1);
    setQuestions((prev) => [...prev, newQ]);
    setExpandedIndex(questions.length);
    setShowAllQuestions(true);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      // Keep at least one question, blanked if removed
      const blank = createBlankQuestion(1);
      setQuestions([blank]);
      setExpandedIndex(0);
      return;
    }
    const updated = questions.filter((_, idx) => idx !== index);
    updated.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });
    setQuestions(updated);
    if (expandedIndex >= updated.length) {
      setExpandedIndex(updated.length - 1);
    }
  };

  const handleUpdateType = (index: number, newType: string) => {
    const updated = [...questions];
    const curr = updated[index];
    curr.type = newType;

    if (newType === 'True / False') {
      curr.options = [
        { id: `opt-${curr.id}-1`, text: 'True', isCorrect: true },
        { id: `opt-${curr.id}-2`, text: 'False', isCorrect: false },
      ];
    } else if (newType === 'Short answer') {
      curr.options = [
        { id: `opt-${curr.id}-1`, text: '', isCorrect: true },
      ];
    } else if (curr.options.length < 2) {
      curr.options = [
        { id: `opt-${curr.id}-1`, text: '', isCorrect: true },
        { id: `opt-${curr.id}-2`, text: '', isCorrect: false },
        { id: `opt-${curr.id}-3`, text: '', isCorrect: false },
        { id: `opt-${curr.id}-4`, text: '', isCorrect: false },
      ];
    }
    setQuestions(updated);
  };

  const handleUpdateTags = (index: number, tags: string) => {
    const updated = [...questions];
    updated[index].tags = tags;
    setQuestions(updated);
  };

  const handleUpdatePrompt = (index: number, prompt: string) => {
    const updated = [...questions];
    updated[index].prompt = prompt;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    if (updated[qIndex]?.options[optIndex]) {
      updated[qIndex].options[optIndex].text = text;
      setQuestions(updated);
    }
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIndex;
    });
    setQuestions(updated);
  };

  const handleToggleCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const opt = updated[qIndex].options[optIndex];
    if (opt) {
      opt.isCorrect = !opt.isCorrect;
      setQuestions(updated);
    }
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({
      id: `opt-${Date.now()}-${updated[qIndex].options.length + 1}`,
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex].options = updated[qIndex].options.filter((_, idx) => idx !== optIndex);
    // If the removed option was the only correct one, set the first option as correct
    if (!updated[qIndex].options.some((o) => o.isCorrect) && updated[qIndex].options.length > 0) {
      updated[qIndex].options[0].isCorrect = true;
    }
    setQuestions(updated);
  };

  const availableBankQuestions = bankQuestions.filter(
    (bq) => !questions.some((q) => q.questionId === bq.questionId)
  );

  // Question bank dialog: published questions from the assessment service, searched on the server
  useEffect(() => {
    if (!bankDialogOpen) return;
    const timer = setTimeout(() => {
      setBankLoading(true);
      fetchQuestionBank({ search: bankSearch, limit: 50, offset: 0 })
        .then(({ questions: found }) => setBankQuestions(found))
        .catch((err) => {
          console.error('Failed to load question bank:', err);
          setBankQuestions([]);
        })
        .finally(() => setBankLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [bankDialogOpen, bankSearch]);

  // Add from question bank dialog handler
  const handleConfirmAddFromBank = async () => {
    const picked = bankQuestions.filter((bq) => selectedBankQuestionIds.includes(bq.questionId));
    if (picked.length > 0) {
      // The list may omit options; read those questions individually
      const full = await Promise.all(
        picked.map(async (bq) => {
          if (bq.options.length > 0) return bq;
          try {
            const res = await AssessmentService.getQuestionById(bq.questionId);
            return mapBankQuestion(res?.result?.question ?? res?.result ?? bq);
          } catch {
            return bq;
          }
        })
      );
      const startNumber = questions.length;
      setQuestions((prev) => [...prev, ...full.map((bq, idx) => bankToBuilderQuestion(bq, startNumber + idx + 1))]);
      setExpandedIndex(startNumber);
      setShowAllQuestions(true);
    }
    setBankDialogOpen(false);
    setSelectedBankQuestionIds([]);
  };

  // Auto-generate by tags dialog handler
  const handleConfirmAutoGenerate = () => {
    const count = Math.min(Math.max(Number.parseInt(genCount, 10) || 1, 1), 5);
    const generated: AssessmentQuestion[] = Array.from({ length: count }, (_, idx) => ({
      id: `q-gen-${Date.now()}-${idx}`,
      questionNumber: questions.length + idx + 1,
      type: 'Multiple choice – single answer',
      tags: `${genTag} · Difficulty: ${genDifficulty} · Auto-generated`,
      prompt: `Sample generated question on ${genTag} (${idx + 1}): Which strategy is most effective?`,
      fromBank: true,
      options: [
        { id: `opt-g-${idx}-1`, text: 'Accurately identifying household financial priorities', isCorrect: true },
        { id: `opt-g-${idx}-2`, text: 'Focusing exclusively on short-term discretionary spending', isCorrect: false },
        { id: `opt-g-${idx}-3`, text: 'Relying solely on informal credit lines', isCorrect: false },
        { id: `opt-g-${idx}-4`, text: 'Ignoring repayment timelines and interest rates', isCorrect: false },
      ],
    }));

    setQuestions((prev) => [...prev, ...generated]);
    setExpandedIndex(questions.length);
    setShowAllQuestions(true);
    setTagsDialogOpen(false);
  };

  // Save assessment handler
  // Only questions written in this form are saved; the pre-listed ones (fromBank) already exist
  const newQuestions = questions.filter((item) => !item.fromBank && item.prompt.trim());

  // Questions picked from the question bank already exist; they are linked to the test instead of re-created
  const attachBankQuestions = async (testId: string, sectionId: string) => {
    const picked = questions.filter((q) => q.fromBank && q.questionId);
    if (picked.length === 0) return;
    await AssessmentService.addBulkQuestionsToSection(testId, {
      sectionId,
      questions: picked.map((q, idx) => ({ questionId: q.questionId as string, ordering: idx + 1, isCompulsory: true })),
    });
  };

  const getOrCreateSectionId = async (testId: string): Promise<string> => {
    sectionIdRef.current ??= await createDefaultSection(testId);
    return sectionIdRef.current;
  };

  // Module titles are unique per course, and a deleted module keeps its title. Reuse a module that
  // already has the title, and when the title is still taken, create the module under a numbered title.
  const createFinalAssessmentModule = async (courseId: string, ordering: number): Promise<string | undefined> => {
    for (let attempt = 1; attempt <= MAX_MODULE_TITLE_ATTEMPTS; attempt++) {
      const title = attempt === 1 ? FINAL_ASSESSMENT_MODULE : `${FINAL_ASSESSMENT_MODULE} ${attempt}`;
      try {
        const created = await createModule({
          title,
          alias: title.toLowerCase().replace(/\s+/g, '-'),
          courseId,
          description: '<p>End-of-course knowledge check</p>',
          image: '/uploads/module/default.png',
          ordering,
          status: 'published',
        });
        return created?.result?.moduleId;
      } catch (err: any) {
        if (err?.response?.status !== 409) throw err;
      }
    }
    return undefined;
  };

  // The course hierarchy only lists lessons module by module, so the test goes into a "Final Assessment" module
  const addTestToCourse = async (courseId: string, testId: string) => {
    const hierarchy = await getCourseHierarchy(courseId);
    const modules = hierarchy?.children || [];
    const isFinal = (title?: string) => title?.trim().toLowerCase() === FINAL_ASSESSMENT_MODULE.toLowerCase();
    const existing = modules.find((m) => isFinal(m.name));
    let moduleId: string | undefined = existing?.identifier;
    if (!moduleId || !UUID_REGEX.test(moduleId)) {
      const found = (await getModuleList(courseId, { query: FINAL_ASSESSMENT_MODULE, limit: 50 })).modules.find((m) =>
        isFinal(m.title)
      );
      moduleId = found?.moduleId || (await createFinalAssessmentModule(courseId, modules.length + 1));
    }
    if (!moduleId) throw new Error('The Final Assessment module could not be created.');

    await createTestLesson({
      title: name.trim(),
      description: description || undefined,
      courseId,
      moduleId,
      mediaContentSource: testId,
      ordering: (existing?.children?.length || 0) + 1,
    });
  };

  const saveNewAssessment = async () => {
    const testRes = await AssessmentService.createTest({
      ...buildTestSettings({ name, description, timeLimit, passMark, attempts, shuffle, showExplanations }),
      status: 'draft',
      gradingType: 'quiz',
      type: 'plain',
    });
    const testId = testRes?.result?.testId || testRes?.result?.id;
    if (!testId) throw new Error('Assessment was created without an id.');

    const sectionId = await createDefaultSection(testId);

    await runSequentially(
      newQuestions.map((q) => () => AssessmentService.createQuestion(buildQuestionPayload(q, testId, sectionId)))
    );

    await attachBankQuestions(testId, sectionId);

    await AssessmentService.updateTest(testId, { status: 'published' });

    if (targetCourseId) {
      try {
        await addTestToCourse(targetCourseId, testId);
      } catch (err: any) {
        const reason = err?.response?.data?.params?.errmsg || err?.message || 'unknown error';
        throw new Error(`The assessment was saved, but adding it to the course failed: ${reason}`);
      }
    }
  };

  // Loaded questions are patched only when edited; questions written here are created
  const syncEditedQuestion = async (q: AssessmentQuestion, testId: string) => {
    if (q.fromBank) return;
    if (q.questionId) {
      if (loadedSnapshots.current[q.questionId] === questionSnapshot(q)) return;
      await AssessmentService.updateQuestion(q.questionId, {
        text: q.prompt.trim(),
        description: q.tags || '',
        type: toServiceType(q.type),
        allowPartialScoring: q.type === 'Multiple choice – multi answer',
        options: toServiceOptions(q),
      });
      return;
    }
    const sectionId = await getOrCreateSectionId(testId);
    await AssessmentService.createQuestion(buildQuestionPayload(q, testId, sectionId));
  };

  const saveExistingAssessment = async (testId: string) => {
    await AssessmentService.updateTest(testId, {
      ...buildTestSettings({ name, description, timeLimit, passMark, attempts, shuffle, showExplanations }),
      status: 'published',
    });

    await runSequentially(
      questions.filter((item) => item.prompt.trim()).map((q) => () => syncEditedQuestion(q, testId))
    );

    if (questions.some((q) => q.fromBank && q.questionId)) {
      await attachBankQuestions(testId, await getOrCreateSectionId(testId));
    }
  };

  // The name and at least one question with text are mandatory
  const canSave = Boolean(name.trim()) && questions.some((q) => q.prompt.trim()) && isValidMinutes(timeLimit);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Assessment name is required.');
      return;
    }
    // The service rejects duplicate option texts; catch it before anything is saved
    const duplicateError = findDuplicateOptionError(questions);
    if (duplicateError) {
      setError(duplicateError);
      return;
    }
    setError(null);

    setLoading(true);
    try {
      if (isCreatePage) {
        await saveNewAssessment();
      } else if (assessmentId && !isNew) {
        await saveExistingAssessment(assessmentId);
      }

      setSuccessMsg(`Assessment "${name}" saved successfully.`);
      setTimeout(() => {
        router.push(
          isCreatePage && targetCourseId ? `/content/courses/${targetCourseId}` : '/content?tab=assessments'
        );
      }, 900);
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save assessment.');
    } finally {
      setLoading(false);
    }
  };

  const currentExpandedQuestion = questions[expandedIndex] || questions[0];
  let optionsHeading = 'Options · select the correct answer';
  if (currentExpandedQuestion.type === 'Multiple choice – multi answer') {
    optionsHeading = 'Options · select all correct answers';
  } else if (currentExpandedQuestion.type === 'Short answer') {
    optionsHeading = 'Expected answer';
  }

  return (
    <Box sx={{ py: 1, maxWidth: 1400, mx: 'auto' }}>
      <ContentFormHeader
        sectionLabel="Assessments"
        sectionHref="/content?tab=assessments"
        title={isNew ? (name || 'Create assessment') : name}
        saveLabel="Save and assign"
        onCancel={() => router.push('/content?tab=assessments')}
        onSaveDraft={handleSave}
        saveDraftLabel="Save"
        onSave={handleSave}
        saveDisabled={!canSave}
      />

      <FormAlerts
        error={error}
        successMsg={successMsg}
        onCloseError={() => setError(null)}
        onCloseSuccess={() => setSuccessMsg(null)}
      />

      {/* Main 2-Column Grid matching Prototype L10 */}
      <Grid container spacing={3}>
        {/* Left Column (8 cols): Assessment Details + Questions List */}
        <Grid item xs={12} lg={8}>
          {/* Card 1: Details */}
          <Paper elevation={0} sx={{ ...CARD_SX, mb: 3 }}>
            <FormCardHeader title="Details" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Name */}
              <LabeledTextField
                label="Name *"
                value={name}
                onChange={setName}
                placeholder="e.g. Course 1 Assessment – Introduction to Saving"
              />

              {/* Linked Content & Time limit */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                      Linked content
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={linkedContent}
                        onChange={(e) => setLinkedContent(e.target.value)}
                        sx={{
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          fontSize: '14px',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1F1E1C' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                        }}
                      >
                        {linkedOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt === 'None' ? 'None (Standalone assessment)' : opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LabeledTextField
                    label="Time limit (min)"
                    value={timeLimit}
                    onChange={(v) => setTimeLimit(sanitizeMinutes(v))}
                    numeric={{ maxLength: MINUTES_MAX_DIGITS }}
                    error={isValidMinutes(timeLimit) ? undefined : MINUTES_ERROR}
                    placeholder="e.g. 15"
                  />
                </Grid>
              </Grid>

              {/* Description */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions shown to learners before starting..."
                  sx={OUTLINED_FIELD_SX}
                />
              </Box>
            </Box>
          </Paper>

          {/* Questions Section Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C' }}>
              Questions ({questions.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setBankDialogOpen(true)}
                sx={SECONDARY_ACTION_BTN_SX}
              >
                Add from question bank
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => setTagsDialogOpen(true)}
                sx={SECONDARY_ACTION_BTN_SX}
              >
                Auto-generate by tags
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={handleAddQuestion}
                sx={SECONDARY_ACTION_BTN_SX}
              >
                + New question
              </Button>
            </Box>
          </Box>

          {/* Expanded Question Card with Arrow Controls on the Left */}
          {currentExpandedQuestion && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              {/* Up/Down Arrow Stack on the Left */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', pt: 0.5 }}>
                <Tooltip title="Move question up">
                  <span>
                    <IconButton
                      size="small"
                      disabled={expandedIndex === 0}
                      onClick={() => handleMoveQuestion(expandedIndex, 'up')}
                      sx={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        border: '1px solid #BDB9B1',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: '#3D3B37',
                        '&:hover': { backgroundColor: '#F3F4F6' },
                        '&.Mui-disabled': { opacity: 0.35 },
                      }}
                    >
                      <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move question down">
                  <span>
                    <IconButton
                      size="small"
                      disabled={expandedIndex === questions.length - 1}
                      onClick={() => handleMoveQuestion(expandedIndex, 'down')}
                      sx={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        border: '1px solid #BDB9B1',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: '#3D3B37',
                        '&:hover': { backgroundColor: '#F3F4F6' },
                        '&.Mui-disabled': { opacity: 0.35 },
                      }}
                    >
                      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Question Card Block */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  border: '1px solid #D6D3CC',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                }}
              >
                {/* Question Card Top Bar */}
                <Box
                  sx={{
                    px: 2.2,
                    py: 1.5,
                    borderBottom: '1px solid #ECEAE5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FAF9F6',
                  }}
                >
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
                    Question {currentExpandedQuestion.questionNumber}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {currentExpandedQuestion.fromBank && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 22,
                          px: 1,
                          borderRadius: '11px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: '#EEEDE9',
                          color: '#3D3B37',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        From question bank
                      </Box>
                    )}

                    <Tooltip title="Remove question">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveQuestion(expandedIndex)}
                        sx={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          border: '1px solid #D6D3CC',
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          color: '#3D3B37',
                          '&:hover': {
                            backgroundColor: '#FEE2E2',
                            borderColor: '#FCA5A5',
                            color: '#DC2626',
                          },
                        }}
                      >
                        <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ p: 2.2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Row 1: Question Type and Tags (2 Columns) */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                          Question type
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={currentExpandedQuestion.type || 'Multiple choice – single answer'}
                            onChange={(e) => handleUpdateType(expandedIndex, e.target.value)}
                            sx={{
                              borderRadius: '6px',
                              backgroundColor: '#FFFFFF',
                              fontSize: '13px',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1F1E1C' },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                            }}
                          >
                            {QUESTION_TYPES.map((t) => (
                              <MenuItem key={t} value={t} sx={{ fontSize: '13px' }}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                        <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                          Tags
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={currentExpandedQuestion.tags || ''}
                          onChange={(e) => handleUpdateTags(expandedIndex, e.target.value)}
                          placeholder="e.g. Topic: Saving · Difficulty: [—] · Module: Course 1"
                          sx={OUTLINED_FIELD_SX}
                        />
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Row 2: Question * */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                      Question<span style={{ color: "#D92D20" }}> *</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={currentExpandedQuestion.prompt || ''}
                      onChange={(e) => handleUpdatePrompt(expandedIndex, e.target.value)}
                      placeholder="Type the question text here..."
                      sx={OUTLINED_FIELD_SX}
                    />
                  </Box>

                  {/* Row 3: Options (select the correct answer) */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                      {optionsHeading}
                    </Typography>

                    {currentExpandedQuestion.type === 'Short answer' ? (
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        value={currentExpandedQuestion.options[0]?.text || ''}
                        onChange={(e) => handleUpdateOption(expandedIndex, 0, e.target.value)}
                        placeholder="Type expected short answer or sample response..."
                        sx={OUTLINED_FIELD_SX}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {currentExpandedQuestion.options.map((opt, optIndex) => (
                          <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            {currentExpandedQuestion.type === 'Multiple choice – multi answer' ? (
                              <Tooltip title={opt.isCorrect ? 'Correct answer' : 'Mark as correct'}>
                                <Checkbox
                                  checked={opt.isCorrect}
                                  onChange={() => handleToggleCorrectOption(expandedIndex, optIndex)}
                                  sx={{
                                    p: 0.5,
                                    color: '#BDB9B1',
                                    '&.Mui-checked': { color: '#16A34A' },
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title={opt.isCorrect ? 'Correct answer' : 'Mark as correct'}>
                                <Radio
                                  checked={opt.isCorrect}
                                  onChange={() => handleSetCorrectOption(expandedIndex, optIndex)}
                                  sx={{
                                    p: 0.5,
                                    color: '#BDB9B1',
                                    '&.Mui-checked': { color: '#16A34A' },
                                  }}
                                />
                              </Tooltip>
                            )}

                            <TextField
                              fullWidth
                              size="small"
                              value={opt.text}
                              disabled={currentExpandedQuestion.type === 'True / False'}
                              onChange={(e) => handleUpdateOption(expandedIndex, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCodePoint(97 + optIndex)}`}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '6px',
                                  backgroundColor: opt.isCorrect ? '#F0FDF4' : '#FFFFFF',
                                  fontSize: '13px',
                                  '& fieldset': { borderColor: opt.isCorrect ? '#86EFAC' : '#D6D3CC' },
                                  '&:hover fieldset': { borderColor: '#1F1E1C' },
                                  '&.Mui-focused fieldset': { borderColor: '#E6873C' },
                                },
                              }}
                            />

                            {currentExpandedQuestion.options.length > 2 && currentExpandedQuestion.type !== 'True / False' && (
                              <Tooltip title="Remove option">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveOption(expandedIndex, optIndex)}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    padding: 0,
                                    border: '1px solid #D6D3CC',
                                    borderRadius: '6px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#8A867F',
                                    flexShrink: 0,
                                    '&:hover': {
                                      backgroundColor: '#FEF2F2',
                                      borderColor: '#FCA5A5',
                                      color: '#DC2626',
                                    },
                                  }}
                                >
                                  <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        ))}

                        {currentExpandedQuestion.type !== 'True / False' && (
                          <Box sx={{ mt: 0.5 }}>
                            <Button
                              size="small"
                              onClick={() => handleAddOption(expandedIndex)}
                              sx={{
                                color: '#E6873C',
                                textTransform: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                p: 0,
                                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                              }}
                            >
                              + Add option
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Collapsed Questions List matching Prototype Image 2 & 3 */}
          {questions.length > 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: '40px', mt: 1.5 }}>
              {questions.map((item, idx) => {
                if (idx === expandedIndex) return null;
                if (!showAllQuestions && idx > 2) return null;

                return (
                  <Box
                    key={item.id}
                    onClick={() => setExpandedIndex(idx)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6D3CC',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        borderColor: '#E6873C',
                        backgroundColor: '#FDFBF9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                      <Box component="strong" sx={{ fontWeight: 600 }}>
                        Question {item.questionNumber}
                      </Box>{' '}
                      · {item.prompt || '(Blank question - click to edit)'}
                    </Typography>

                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: 22,
                        px: 1,
                        borderRadius: '11px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#EEEDE9',
                        color: '#3D3B37',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        ml: 1.5,
                      }}
                    >
                      {getQuestionTypeChip(item.type)}
                    </Box>
                  </Box>
                );
              })}

              {!showAllQuestions && questions.length > 3 && (
                <Button
                  size="small"
                  onClick={() => setShowAllQuestions(true)}
                  sx={{
                    alignSelf: 'flex-start',
                    color: '#6B6862',
                    textTransform: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    p: 0,
                    '&:hover': { backgroundColor: 'transparent', color: '#E6873C', textDecoration: 'underline' },
                  }}
                >
                  + {questions.length - 3} more
                </Button>
              )}
            </Box>
          )}
        </Grid>

        {/* Right Column (4 cols): Rules, Assign to, Notifications */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Card 1: Rules (BRD §8.2) */}
            <Paper elevation={0} sx={CARD_SX}>


              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Pass mark (%)
                  </Typography>
                  <TextField
                    size="small"
                    value={passMark}
                    onChange={(e) => setPassMark(e.target.value)}
                    sx={OUTLINED_FIELD_SX}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Allowed attempts
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={attempts}
                      onChange={(e) => setAttempts(e.target.value)}
                      sx={{
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        fontSize: '13px',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1F1E1C' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                      }}
                    >
                      <MenuItem value="[N]">[N]</MenuItem>
                      <MenuItem value="Unlimited">Unlimited</MenuItem>
                      <MenuItem value="3">3 attempts</MenuItem>
                      <MenuItem value="2">2 attempts</MenuItem>
                      <MenuItem value="1">1 attempt</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* <FormControlLabel
                  control={
                    <Checkbox
                      checked={shuffle}
                      onChange={(e) => setShuffle(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                      Shuffle questions for learners
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showExplanations}
                      onChange={(e) => setShowExplanations(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                      Show correct answers after submission
                    </Typography>
                  }
                /> */}
              </Box>
            </Paper>

            {/* Card 2: Assign to (BRD §8.2) */}
            {/* <Paper elevation={0} sx={CARD_SX}>


              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2, fontSize: '14px' }}>
                {assignedGroups.length === 0 && assignedUsers.length === 0 && (
                  <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>No groups or users chosen yet.</Typography>
                )}
                {assignedGroups.map((grp) => (
                  <Typography key={grp.id} sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                    {grp.name}
                  </Typography>
                ))}
                {assignedUsers.length > 0 && (
                  <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                    {assignedUsers.length} individual {assignedUsers.length === 1 ? 'user' : 'users'}
                  </Typography>
                )}

                <Box sx={{ pt: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setAssignDialogOpen(true)}
                    sx={SECONDARY_ACTION_BTN_SX}
                  >
                    Choose groups or users
                  </Button>
                </Box>
              </Box>
            </Paper> */}

            {/* Card 3: Notifications (BRD §8.3) */}
            {/* <Paper elevation={0} sx={CARD_SX}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.8,
                  borderBottom: '1px solid #ECEAE5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>Notifications</Typography>
                <Box component="span" sx={BRD_TAG_SX}>
                  BRD §8.3
                </Box>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notifyCompletion}
                      onChange={(e) => setNotifyCompletion(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                      Notify on completion
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notifyFailure}
                      onChange={(e) => setNotifyFailure(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                      Notify on failure
                    </Typography>
                  }
                />
              </Box>
            </Paper> */}
          </Box>
        </Grid>
      </Grid>

      {/* Dialog 1: Add from Question Bank */}
      <Dialog
        open={bankDialogOpen}
        onClose={() => setBankDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C' }}>
            Question Bank
          </Typography>
          <IconButton size="small" onClick={() => setBankDialogOpen(false)}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search questions by keyword or topic..."
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#8A867F', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ ...OUTLINED_FIELD_SX, mb: 2 }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, maxHeight: 380, overflowY: 'auto' }}>
            {bankLoading && (
              <Typography sx={{ fontSize: '13px', color: '#6B6862' }}>Loading questions…</Typography>
            )}
            {!bankLoading && availableBankQuestions.length === 0 && (
              <Typography sx={{ fontSize: '13px', color: '#6B6862' }}>No questions found.</Typography>
            )}
            {availableBankQuestions.map((sq) => {
              const isSelected = selectedBankQuestionIds.includes(sq.questionId);
              return (
                <Box
                  key={sq.questionId}
                  onClick={() => {
                    setSelectedBankQuestionIds((prev) =>
                      isSelected ? prev.filter((id) => id !== sq.questionId) : [...prev, sq.questionId]
                    );
                  }}
                  sx={{
                    p: 1.8,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isSelected ? '#E6873C' : '#D6D3CC',
                    backgroundColor: isSelected ? '#FDFBF9' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    sx={{ p: 0, mt: 0.3, '&.Mui-checked': { color: '#E6873C' } }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C', mb: 0.5 }}>
                      {sq.text}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        label={getQuestionTypeChip(toBuilderType(sq.type, sq.allowPartialScoring))}
                        size="small"
                        sx={{ height: 20, fontSize: '11px', backgroundColor: '#EEEDE9' }}
                      />
                      <Typography variant="caption" sx={{ color: '#6B6862' }}>{sq.description}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setBankDialogOpen(false)}
            sx={{ ...SECONDARY_ACTION_BTN_SX, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={selectedBankQuestionIds.length === 0}
            onClick={handleConfirmAddFromBank}
            sx={{
              backgroundColor: '#E6873C',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '6px',
              height: 36,
              px: 2,
              '&:hover': { backgroundColor: '#C66C23' },
            }}
          >
            Add selected ({selectedBankQuestionIds.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 2: Auto-generate by Tags */}
      <Dialog
        open={tagsDialogOpen}
        onClose={() => setTagsDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '10px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F1E1C' }}>
            Auto-generate by tags
          </Typography>
          <IconButton size="small" onClick={() => setTagsDialogOpen(false)}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Tag / Topic
            </Typography>
            <TextField
              size="small"
              value={genTag}
              onChange={(e) => setGenTag(e.target.value)}
              placeholder="e.g. Topic: Saving"
              sx={OUTLINED_FIELD_SX}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Number of questions
            </Typography>
            <TextField
              size="small"
              type="number"
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              sx={OUTLINED_FIELD_SX}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Difficulty
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value)}
                sx={{ borderRadius: '6px', fontSize: '13px' }}
              >
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setTagsDialogOpen(false)}
            sx={{ ...SECONDARY_ACTION_BTN_SX, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAutoGenerate}
            sx={{
              backgroundColor: '#E6873C',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '6px',
              height: 36,
              px: 2,
              '&:hover': { backgroundColor: '#C66C23' },
            }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 3: Choose Groups or Users */}
      {/* <ChooseGroupsUsersDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        groups={assignedGroups}
        users={assignedUsers}
        onApply={(groups, users) => {
          setAssignedGroups(groups);
          setAssignedUsers(users);
          setAssignDialogOpen(false);
        }}
      /> */}
    </Box>
  );
}

export default AssessmentBuilder;

