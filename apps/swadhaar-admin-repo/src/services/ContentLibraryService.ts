import { API_ENDPOINTS, resolveMediaUrl } from '@/utils/API/APIEndpoints';
import { post, get, patch, deleteApi } from './RestClient';
import { SWADHAAR_CHANNEL_ID } from '@/utils/app.constant';
import { detectLanguage, getLmsLessons, LessonItem } from './CourseService';
import AssessmentService from './AssessmentService';

export type ContentTabType = 'videos' | 'pdfs' | 'assessments';

export interface ContentItem {
  identifier: string;
  name: string;
  status: string;
  channel?: string;
  primaryCategory?: string;
  mimeType?: string;
  duration?: string | number | null;
  language?: string[];
  lastUpdatedOn?: string;
  createdOn?: string;
  description?: string;
  artifactUrl?: string;
  downloadUrl?: string;
  streamingUrl?: string;
  posterImage?: string;
  appIcon?: string;
  source?: string;
  usedIn?: string;
  detectedLanguage?: string;
  formattedDuration?: string;
  // Assessment specific fields
  questionsCount?: number;
  passMark?: string | number;
  attempts?: string | number;
  timeLimit?: string;
  assignedTo?: string;
  linkedTo?: string;
  [key: string]: any;
}

export interface ContentSearchParams {
  tab: ContentTabType;
  query?: string;
  courseFilter?: string;
  languageFilter?: string;
  limit?: number;
  offset?: number;
  status?: string[];
}

export interface ContentTabCounts {
  videos: number;
  pdfs: number;
  assessments: number;
}

/**
 * Maps tab to appropriate mimeType and primaryCategory filters for Sunbird composite search
 */
export const getFiltersForTab = (tab: ContentTabType, status?: string[]): Record<string, any> => {
  const baseFilter: Record<string, any> = {
    status: status || ['Live', 'live'],
    channel: SWADHAAR_CHANNEL_ID,
  };

  switch (tab) {
    case 'videos':
      return {
        ...baseFilter,
        primaryCategory: ['Learning Resource'],
        mimeType: ['video/x-youtube', 'video/mp4', 'video/webm', 'video/quicktime'],
      };
    case 'pdfs':
      return {
        ...baseFilter,
        primaryCategory: ['Learning Resource'],
        mimeType: ['application/pdf'],
      };
    case 'assessments':
      return {
        ...baseFilter,
        primaryCategory: ['Practice Question Set'],
      };
    default:
      return baseFilter;
  }
};

/**
 * Format duration string for videos or reading time for PDFs
 */
export const formatDurationString = (item: any): string => {
  if (item.duration) {
    const totalSecs = Number.parseInt(String(item.duration), 10);
    if (!Number.isNaN(totalSecs) && totalSecs > 0) {
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return String(item.duration);
  }
  if (item.description) {
    const match = item.description.match(/(\d{1,4}:\d{1,2}|\d{1,4} {0,3}min)/i);
    if (match) return match[1];
  }
  return '—';
};

/**
 * Duration value to prefill in edit forms: keeps human-readable values ("1:43", "5 min"),
 * otherwise formats seconds, falling back to the raw value (or '' when there is none).
 */
export const resolveEditableDuration = (item: any): string => {
  const formatted = formatDurationString(item);
  const hasFormatted = formatted !== '—';
  if (!item.duration) return hasFormatted ? formatted : '';
  const raw = String(item.duration);
  if (raw.includes(':') || raw.includes('min')) return raw;
  return hasFormatted ? formatted : raw;
};

/**
 * Parse source (YouTube vs Google Drive vs Upload)
 */
export const detectContentSource = (item: any): string => {
  const mime = (item.mimeType || '').toLowerCase();
  const artifact = (item.artifactUrl || item.streamingUrl || item.downloadUrl || '').toLowerCase();

  if (mime.includes('youtube') || artifact.includes('youtube') || artifact.includes('youtu.be')) {
    return 'YouTube';
  }
  if (artifact.includes('drive.google.com')) {
    return 'Google Drive';
  }
  if (mime === 'application/pdf') {
    return 'PDF Upload';
  }
  if (item.primaryCategory === 'Practice Question Set') {
    return 'Question Bank';
  }
  return 'Upload';
};

/**
 * Infer course usage from content title or description
 */
export const inferCourseUsage = (item: any): string => {
  if (item.usedIn && item.usedIn !== 'Not used in any course yet') {
    return item.usedIn;
  }
  if (item.collections && Array.isArray(item.collections) && item.collections.length > 0) {
    const col = item.collections[0];
    return col.name || col.title || 'Course';
  }
  const text = `${item.name || ''} ${item.description || ''}`;
  if (/course\s*0/i.test(text) || /स्वाधार\s*फिनएक्सेस/i.test(text)) {
    return 'Course 0 · 0.1';
  }
  if (/course\s*1\s*[.·-]\s*1\.?2/i.test(text) || /budget/i.test(text) || /बजट/i.test(text)) {
    return 'Course 1 · 1.2';
  }
  if (/course\s*1\s*[.·-]\s*1\.?3/i.test(text) || /chhoti\s*bachat/i.test(text)) {
    return 'Course 1 · 1.3';
  }
  if (
    /course\s*1/i.test(text) ||
    /बचत/i.test(text) ||
    /saving/i.test(text) ||
    /goal\s*setting/i.test(text) ||
    /life\s*cycle/i.test(text)
  ) {
    return 'Course 1 · 1.1';
  }
  return 'Not used in any course yet';
};

/** GET /assessment/v1/tests: the list sits under `result`; its key and the total's key vary, so fall back to the first array */
export const readTestList = (res: any): { tests: any[]; count: number } => {
  const result = res?.result ?? res?.data ?? res;
  const tests: any[] = Array.isArray(result)
    ? result
    : result?.tests ||
      result?.data ||
      result?.items ||
      result?.rows ||
      (Object.values(result || {}).find(Array.isArray) as any[] | undefined) ||
      [];
  const count = result?.totalElements ?? result?.totalCount ?? result?.count ?? result?.total ?? tests.length;
  return { tests, count: Number(count) || tests.length };
};

const getCourseLabel = (title: string, fallback: string): string => {
  if (title.includes('Course 0')) return 'Course 0';
  if (title.includes('Course 1')) return 'Course 1';
  return fallback;
};

const mapTestToAssessmentItem = (t: any): ContentItem => {
  const title = t.title || t.name || 'Untitled Assessment';
  const minutes = t.timeDuration;
  return {
    identifier: t.testId || t.id,
    name: title,
    title,
    description: t.description || '',
    mimeType: 'application/vnd.sunbird.questionset',
    primaryCategory: 'Practice Question Set',
    status: t.status,
    detectedLanguage: detectLanguage(title),
    formattedDuration: minutes ? `${minutes} min` : '—',
    source: 'In-house Assessment',
    usedIn: getCourseLabel(title, 'Not used in any course yet'),
    questionsCount: t.totalQuestions ?? t.questionsCount ?? t.questionCount ?? 0,
    passMark: t.passingMarks ? `${t.passingMarks}%` : '—',
    attempts: t.attempts ? String(t.attempts) : 'Unlimited',
    timeLimit: minutes ? `${minutes} min` : '—',
    linkedTo: getCourseLabel(title, 'None'),
    createdOn: t.createdAt,
    lastUpdatedOn: t.updatedAt,
  } as ContentItem;
};

/** LMS lesson `format` values that back the Videos and Documents (PDF) tabs */
const LESSON_FORMAT_BY_TAB: Record<'videos' | 'pdfs', string> = {
  videos: 'video',
  pdfs: 'document',
};

const mapLessonToContentItem = (lesson: LessonItem): ContentItem => {
  const mediaPath = lesson.media?.path || lesson.media?.source || '';
  const isPdf = lesson.format === 'document' || /\.pdf($|\?)/i.test(String(mediaPath));
  const rawLanguage = lesson.language ?? lesson.params?.language;
  const language = rawLanguage ? [String(rawLanguage)] : undefined;
  const base: ContentItem = {
    identifier: lesson.lessonId,
    name: lesson.title,
    status: lesson.status,
    description: lesson.description,
    mimeType: isPdf ? 'application/pdf' : 'video/mp4',
    primaryCategory: 'Learning Resource',
    artifactUrl: resolveMediaUrl(mediaPath) || undefined,
    posterImage: lesson.image || undefined,
    duration: lesson.duration ?? undefined,
    language,
    createdOn: lesson.createdAt,
    lastUpdatedOn: lesson.updatedAt,
    lessonId: lesson.lessonId,
    format: lesson.format,
    subFormat: lesson.subFormat,
  };
  const subFormat = (lesson.subFormat || '').toLowerCase();
  const source = subFormat.includes('youtube') ? 'YouTube' : detectContentSource(base);
  return {
    ...base,
    detectedLanguage: detectLanguage(lesson.title || '', language),
    formattedDuration: formatDurationString(base),
    source,
    usedIn: inferCourseUsage({ ...base, usedIn: lesson.courseTitle }),
  };
};

/**
 * Search content based on tab, query, and filters
 */
export const searchContentLibrary = async (
  params: ContentSearchParams
): Promise<{ count: number; content: ContentItem[] }> => {
  try {
    if (params.tab === 'assessments') {
      // Assessments are tests in the assessment service, not LMS lessons
      const res = await AssessmentService.getAllTests({
        status: 'published',
        search: params.query || undefined,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      });
      const { tests, count } = readTestList(res);
      return { count, content: tests.map(mapTestToAssessmentItem) };
    }

    if (params.tab === 'videos' || params.tab === 'pdfs') {
      const { count, lessons } = await getLmsLessons({
        status: 'published',
        format: LESSON_FORMAT_BY_TAB[params.tab],
        query: params.query,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      });
      let items = lessons.map(mapLessonToContentItem);
      if (params.languageFilter && params.languageFilter !== 'all') {
        items = items.filter(
          (c) => c.detectedLanguage?.toLowerCase() === params.languageFilter?.toLowerCase()
        );
      }
      if (params.courseFilter && params.courseFilter !== 'all') {
        items = items.filter((c) =>
          c.usedIn?.toLowerCase().includes(params.courseFilter?.toLowerCase() || '')
        );
      }
      return { count, content: items };
    }

    const apiUrl = API_ENDPOINTS.compositeSearch;
    const tabFilters = getFiltersForTab(params.tab, params.status);

    const payload = {
      request: {
        filters: tabFilters,
        query: params.query || '',
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    };

    const response = await post<any>(apiUrl, payload);
    const result = response?.data?.result || {};
    const rawList: any[] = result.content || result.QuestionSet || [];

    const enrichedList: ContentItem[] = rawList.map((item) => {
      const detectedLang = detectLanguage(item.name || '', item.language);
      const formattedDur = formatDurationString(item);
      const src = detectContentSource(item);
      const used = inferCourseUsage(item);

      // Assessment specific mappings
      const leafCount =
        item.childNodes?.length ||
        item.leafNodesCount ||
        (item.name?.includes('Course 0') ? 4 : 10);
      const attemptsCount = item.maxAttempts ? String(item.maxAttempts) : 'Unlimited';

      return {
        ...item,
        detectedLanguage: detectedLang,
        formattedDuration: formattedDur,
        source: src,
        usedIn: used,
        questionsCount: leafCount,
        passMark: '70%',
        attempts: attemptsCount,
        timeLimit: item.name?.includes('Course 0') ? '15 min' : '—',
        assignedTo: '[N] groups',
        linkedTo: item.name?.includes('Course 0') ? 'Course 0' : 'Course 1',
      };
    });

    // Client-side filtering if language or course selected
    let filteredList = enrichedList;
    if (params.languageFilter && params.languageFilter !== 'all') {
      filteredList = filteredList.filter(
        (c) => c.detectedLanguage?.toLowerCase() === params.languageFilter?.toLowerCase()
      );
    }
    if (params.courseFilter && params.courseFilter !== 'all') {
      filteredList = filteredList.filter((c) =>
        c.usedIn?.toLowerCase().includes(params.courseFilter?.toLowerCase() || '')
      );
    }

    const calculatedCount = result.count ?? result.QuestionSet?.length ?? filteredList.length;

    return {
      count: calculatedCount,
      content: filteredList,
    };
  } catch (error) {
    console.error(`Error searching content library for tab ${params.tab}:`, error);
    throw error;
  }
};

/**
 * Fetch counts for all 3 tabs to populate tab header badges
 */
export const fetchContentTabCounts = async (): Promise<ContentTabCounts> => {
  const [vid, pdf, assess] = await Promise.allSettled([
    getLmsLessons({ format: LESSON_FORMAT_BY_TAB.videos, limit: 1 }),
    getLmsLessons({ format: LESSON_FORMAT_BY_TAB.pdfs, limit: 1 }),
    AssessmentService.getAllTests({ status: 'published', limit: 1, offset: 0 }),
  ]);

  return {
    videos: vid.status === 'fulfilled' ? vid.value.count : 0,
    pdfs: pdf.status === 'fulfilled' ? pdf.value.count : 0,
    assessments: assess.status === 'fulfilled' ? readTestList(assess.value).count : 0,
  };
};

/**
 * Read content details by doId
 */
export const getContentRead = async (doId: string): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.contentRead(doId);
    const response = await get(apiUrl);
    return response?.data?.result || {};
  } catch (error) {
    console.error(`Error reading content for ${doId}:`, error);
    throw error;
  }
};

/**
 * Create a new Sunbird / Tekdi content item (Video, PDF, etc.)
 */
export const createContent = async (contentData: {
  name: string;
  description?: string;
  mimeType: string;
  primaryCategory: string;
  artifactUrl?: string;
  duration?: string | number;
  language?: string[];
  [key: string]: any;
}): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.contentCreate;
    const code = `org.swadhaar.content.${Date.now()}`;
    const payload = {
      request: {
        content: {
          code,
          name: contentData.name,
          description: contentData.description || '',
          mimeType: contentData.mimeType,
          primaryCategory: contentData.primaryCategory,
          channel: SWADHAAR_CHANNEL_ID,
          framework: 'swadhaar-framework',
          createdBy: 'admin',
          artifactUrl: contentData.artifactUrl,
          duration: contentData.duration,
          language: contentData.language || ['Hindi'],
          ...contentData,
        },
      },
    };
    const response = await post(apiUrl, payload);
    return response?.data?.result;
  } catch (error) {
    console.error('Error in createContent:', error);
    throw error;
  }
};

/**
 * Update an existing content item
 */
export const updateContent = async (
  doId: string,
  contentData: Record<string, any>
): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.contentUpdate(doId);
    const payload = {
      request: {
        content: {
          ...contentData,
        },
      },
    };
    const response = await patch(apiUrl, payload);
    return response?.data?.result;
  } catch (error) {
    console.error(`Error in updateContent for ${doId}:`, error);
    throw error;
  }
};

/**
 * Retire / archive an existing content item
 */
export const retireContent = async (doId: string): Promise<any> => {
  try {
    const apiUrl = API_ENDPOINTS.contentRetire(doId);
    const response = await deleteApi(apiUrl);
    return response?.data?.result;
  } catch (error) {
    console.error(`Error in retireContent for ${doId}:`, error);
    throw error;
  }
};


/* =========================================================================
 * Question bank (GET /assessment/v1/questions)
 * ========================================================================= */

export interface BankQuestion {
  questionId: string;
  text: string;
  type: string;
  level?: string;
  marks?: number;
  description?: string;
  allowPartialScoring?: boolean;
  status?: string;
  options: Array<{ text: string; isCorrect: boolean; position?: number }>;
}

export const mapBankQuestion = (q: any): BankQuestion => ({
  questionId: q.questionId || q.id,
  text: q.text || '',
  type: q.type || 'mcq',
  level: q.level,
  marks: q.marks,
  description: q.description || '',
  allowPartialScoring: q.allowPartialScoring,
  status: q.status,
  options: [...(q.options || [])]
    .sort((a: any, b: any) => (a.position ?? a.ordering ?? 0) - (b.position ?? b.ordering ?? 0))
    .map((opt: any) => ({ text: opt.text || '', isCorrect: Boolean(opt.isCorrect), position: opt.position })),
});

/** Published questions across all tests; the list sits under `result`, under a key that varies by deployment */
export const fetchQuestionBank = async (params: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ questions: BankQuestion[]; count: number }> => {
  const res = await AssessmentService.getAllQuestions({
    status: 'published',
    search: params.search?.trim() || undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
  const result = res?.result ?? res?.data ?? res;
  const list: any[] = Array.isArray(result)
    ? result
    : result?.questions || result?.data || result?.items || result?.rows ||
      (Object.values(result || {}).find(Array.isArray) as any[] | undefined) || [];
  const count = Number(result?.totalElements ?? result?.totalCount ?? result?.count ?? result?.total ?? list.length) || list.length;
  return { questions: list.map(mapBankQuestion), count };
};
