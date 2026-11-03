import { API_ENDPOINTS } from '@/utils/API/APIEndpoints';
import { get, post, patch, put, deleteApi } from './RestClient';
import { getServiceHeaders } from '@/utils/API/serviceHeaders';

/* =========================================================================
 * TypeScript Interfaces for Assessment Service
 * ========================================================================= */

export interface TestItem {
  id?: string;
  testId?: string;
  type?: 'plain' | (string & {});
  title: string;
  description?: string;
  showTime?: boolean;
  timeDuration?: number;
  showTimeFinished?: boolean;
  timeFinishedDuration?: number;
  totalMarks?: number;
  passingMarks?: number;
  attempts?: number;
  image?: string;
  startDate?: string;
  endDate?: string;
  answerSheet?: boolean;
  showCorrectAnswer?: boolean;
  printAnswersheet?: boolean;
  questionsShuffle?: boolean;
  answersShuffle?: boolean;
  gradingType?: 'quiz' | 'exercise' | (string & {});
  isObjective?: boolean;
  showThankyouPage?: boolean;
  showAllQuestions?: boolean;
  paginationLimit?: number;
  showQuestionsOverview?: boolean;
  status?: 'draft' | 'published' | 'unpublished' | (string & {});
  sections?: SectionItem[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateTestPayload {
  type?: 'plain' | (string & {});
  title: string;
  description?: string;
  showTime?: boolean;
  timeDuration?: number;
  showTimeFinished?: boolean;
  timeFinishedDuration?: number;
  totalMarks?: number;
  passingMarks?: number;
  attempts?: number;
  image?: string;
  startDate?: string;
  endDate?: string;
  answerSheet?: boolean;
  showCorrectAnswer?: boolean;
  printAnswersheet?: boolean;
  questionsShuffle?: boolean;
  answersShuffle?: boolean;
  gradingType?: string;
  isObjective?: boolean;
  showThankyouPage?: boolean;
  showAllQuestions?: boolean;
  paginationLimit?: number;
  showQuestionsOverview?: boolean;
  status?: 'draft' | 'published' | 'unpublished' | (string & {});
  [key: string]: any;
}

export interface TestSearchParams {
  search?: string;
  type?: string;
  status?: string;
  minMarks?: number;
  maxMarks?: number;
  offset?: number;
  limit?: number;
}

export interface SectionItem {
  id?: string;
  sectionId?: string;
  title: string;
  description?: string;
  testId: string;
  ordering?: number;
  status?: string;
  minQuestions?: number;
  maxQuestions?: number;
  questions?: any[];
  [key: string]: any;
}

export interface CreateSectionPayload {
  title: string;
  description?: string;
  testId: string;
  ordering?: number;
  status?: string;
  minQuestions?: number;
  maxQuestions?: number;
}

export interface QuestionOption {
  id?: string;
  optionId?: string;
  text: string;
  isCorrect?: boolean;
  marks?: number;
  position?: number;
  matchWith?: string;
  blankIndex?: number;
  caseSensitive?: boolean;
  [key: string]: any;
}

export interface QuestionItem {
  id?: string;
  questionId?: string;
  text: string;
  alias?: string;
  description?: string;
  type: 'mcq' | 'multiple_answer' | 'true_false' | 'fill_blank' | 'match' | 'subjective' | 'objective' | 'essay' | (string & {});
  level?: 'easy' | 'medium' | 'hard' | (string & {});
  marks?: number;
  status?: string;
  idealTime?: number;
  gradingType?: string;
  allowPartialScoring?: boolean;
  testId?: string;
  sectionId?: string;
  options?: QuestionOption[];
  params?: Record<string, any>;
  media?: Record<string, any>;
  [key: string]: any;
}

export interface QuestionSearchParams {
  search?: string;
  status?: string;
  type?: string;
  level?: string;
  categoryId?: string;
  categories?: string;
  difficultyLevels?: string;
  questionTypes?: string;
  tags?: string;
  marks?: string;
  minMarks?: number;
  maxMarks?: number;
  excludeQuestionIds?: string;
  includeQuestionIds?: string;
  timeRangeFrom?: string;
  timeRangeTo?: string;
  rulePreview?: boolean;
  offset?: number;
  limit?: number;
}

export interface UserAttemptAnswer {
  questionId: string;
  answer: {
    selectedOptionIds?: string[];
    text?: string;
    [key: string]: any;
  };
  timeSpent?: number;
}

export interface AttemptReviewPayload {
  answers: Array<{
    questionId: string;
    score: number;
  }>;
}

export interface RuleCriteria {
  categories?: string[];
  difficultyLevels?: string[];
  questionTypes?: string[];
  tags?: string[];
  marks?: number[];
  [key: string]: any;
}

export interface CreateRulePayload {
  name: string;
  description?: string;
  ruleType?: string;
  numberOfQuestions?: number;
  poolSize?: number;
  minMarks?: number;
  maxMarks?: number;
  selectionStrategy?: 'random' | (string & {});
  criteria?: RuleCriteria;
  status?: string;
  priority?: number;
  selectionMode?: 'DYNAMIC' | (string & {});
  [key: string]: any;
}

/* =========================================================================
 * Assessment Service Implementation
 * ========================================================================= */

export const AssessmentService = {
  /* --- Health Check --- */
  checkHealth: async (customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentHealth;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  /* --- Tests Module --- */
  createTest: async (payload: CreateTestPayload, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTests;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getAllTests: async (params?: TestSearchParams, customHeaders?: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams();
    if (params) {
      (['search', 'type', 'status'] as const).forEach((key) => {
        if (params[key]) query.set(key, params[key] as string);
      });
      (['minMarks', 'maxMarks', 'offset', 'limit'] as const).forEach((key) => {
        if (params[key] !== undefined) query.set(key, String(params[key]));
      });
    }
    const queryString = query.toString();
    const url = queryString ? `${API_ENDPOINTS.assessmentTests}?${queryString}` : API_ENDPOINTS.assessmentTests;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getTestById: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  updateTest: async (id: string, payload: Partial<CreateTestPayload>, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await patch(url, payload, headers);
    return response?.data;
  },

  deleteTest: async (id: string, hard = true, customHeaders?: Record<string, string>): Promise<any> => {
    const url = `${API_ENDPOINTS.assessmentTestById(id)}?hard=${hard}`;
    const headers = getServiceHeaders(customHeaders);
    const response = await deleteApi(url, undefined, headers);
    return response?.data;
  },

  addQuestionToSection: async (
    testId: string,
    payload: { questionId: string; sectionId: string; isCompulsory?: boolean },
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestQuestions(testId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  addBulkQuestionsToSection: async (
    testId: string,
    payload: { sectionId: string; questions: Array<{ questionId: string; ordering?: number; isCompulsory?: boolean }> },
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestQuestionsBulk(testId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getTestHierarchy: async (
    testId: string,
    includeChildQuestions = true,
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    const query = includeChildQuestions ? '?includeChildQuestions=true' : '';
    const url = `${API_ENDPOINTS.assessmentTestHierarchy(testId)}${query}`;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getTestHierarchySimple: async (testId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestHierarchySimple(testId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  updateTestStructure: async (
    testId: string,
    payload: {
      sections: Array<{
        sectionId: string;
        order: number;
        questions?: Array<{ questionId: string; order: number }>;
      }>;
    },
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestStructure(testId);
    const headers = getServiceHeaders(customHeaders);
    const response = await put(url, payload, headers);
    return response?.data;
  },

  cloneTest: async (id: string, userId?: string, customHeaders?: Record<string, string>): Promise<any> => {
    const query = userId ? `?userId=${userId}` : '';
    const url = `${API_ENDPOINTS.assessmentTestClone(id)}${query}`;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, {}, headers);
    return response?.data;
  },

  /* --- Sections Module --- */
  createSection: async (payload: CreateSectionPayload, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentSections;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getAllSections: async (customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentSections;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getSectionsByTestId: async (testId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentSectionsByTestId(testId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getSectionById: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentSectionById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  updateSection: async (id: string, payload: Partial<CreateSectionPayload>, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentSectionById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await patch(url, payload, headers);
    return response?.data;
  },

  deleteSection: async (id: string, hard = true, customHeaders?: Record<string, string>): Promise<any> => {
    const url = `${API_ENDPOINTS.assessmentSectionById(id)}?hard=${hard}`;
    const headers = getServiceHeaders(customHeaders);
    const response = await deleteApi(url, undefined, headers);
    return response?.data;
  },

  /* --- Questions Module --- */
  createQuestion: async (payload: QuestionItem, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentQuestions;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getAllQuestions: async (params?: QuestionSearchParams, customHeaders?: Record<string, string>): Promise<any> => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          query.set(key, String(val));
        }
      });
    }
    const queryString = query.toString();
    const url = queryString ? `${API_ENDPOINTS.assessmentQuestions}?${queryString}` : API_ENDPOINTS.assessmentQuestions;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getQuestionById: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentQuestionById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  updateQuestion: async (id: string, payload: Partial<QuestionItem>, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentQuestionById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await patch(url, payload, headers);
    return response?.data;
  },

  deleteQuestion: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentQuestionById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await deleteApi(url, undefined, headers);
    return response?.data;
  },

  associateOption: async (payload: { questionId: string; optionId: string }, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentQuestionAssociateOption;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getChildQuestions: async (
    id: string,
    params?: { includeOptions?: boolean; includeAssociatedOptions?: boolean },
    customHeaders?: Record<string, string>
  ): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.includeOptions !== undefined) query.set('includeOptions', String(params.includeOptions));
    if (params?.includeAssociatedOptions !== undefined) query.set('includeAssociatedOptions', String(params.includeAssociatedOptions));
    const queryString = query.toString();
    const url = queryString ? `${API_ENDPOINTS.assessmentQuestionChildQuestions(id)}?${queryString}` : API_ENDPOINTS.assessmentQuestionChildQuestions(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  /* --- Attempts Module --- */
  getTestUserStatus: async (testId: string, userId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestUserStatus(testId, userId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  startAttempt: async (testId: string, userId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptStart(testId, userId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, {}, headers);
    return response?.data;
  },

  resumeAttempt: async (attemptId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptResume(attemptId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  submitAnswers: async (attemptId: string, answers: UserAttemptAnswer[], customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptAnswers(attemptId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, answers, headers);
    return response?.data;
  },

  submitAttempt: async (attemptId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptSubmit(attemptId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, {}, headers);
    return response?.data;
  },

  getAnswersheet: async (attemptId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptAnswersheet(attemptId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getTestResult: async (testId: string, userId: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentTestUserResult(testId, userId);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  reviewAttempt: async (attemptId: string, payload: AttemptReviewPayload, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptReview(attemptId);
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  checkResultImported: async (payload: { userId: string; testId: string }, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentAttemptCheckResultImported;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  /* --- Rules Module --- */
  createRule: async (payload: CreateRulePayload, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentRules;
    const headers = getServiceHeaders(customHeaders);
    const response = await post(url, payload, headers);
    return response?.data;
  },

  getAllRules: async (customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentRules;
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  getRuleById: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentRuleById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await get(url, headers);
    return response?.data;
  },

  updateRule: async (id: string, payload: Partial<CreateRulePayload>, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentRuleById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await patch(url, payload, headers);
    return response?.data;
  },

  deleteRule: async (id: string, customHeaders?: Record<string, string>): Promise<any> => {
    const url = API_ENDPOINTS.assessmentRuleById(id);
    const headers = getServiceHeaders(customHeaders);
    const response = await deleteApi(url, undefined, headers);
    return response?.data;
  },
};

export default AssessmentService;
