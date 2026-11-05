import { isValidMinutes, sanitizeMinutes, MINUTES_ERROR, MINUTES_MAX_DIGITS } from '@/utils/minutesInput';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ImageIcon from '@mui/icons-material/Image';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { resolveMediaUrl } from '@/utils/API/APIEndpoints';
import nextI18NextConfig from '../../../../../../next-i18next.config.js';
import {
  getCourseHierarchy,
  createModule,
  updateModule,
  updateLmsLesson,
  CreateModulePayload,
  CourseHierarchy,
  getLmsLessons,
} from '@/services/CourseService';

export interface VideoItem {
  id: string;
  /** LMS lesson this video is, when it was picked from the library */
  lessonId?: string;
  title: string;
  duration?: string;
  sourceUrl?: string;
}

export interface SectionBlock {
  id: string;
  /** LMS lesson this block is, for PDFs picked from the library or lessons already in the module */
  lessonId?: string;
  type: 'INTRO' | 'HOOK' | 'VIDEO WATCH' | 'CONCEPT' | 'ANALYSIS' | 'TEXT' | 'IMAGE' | 'PDF';
  text?: string;
  videos?: VideoItem[];
  mediaUrl?: string;
  mediaName?: string;
}

export interface ContentMediaItem {
  id: string;
  title: string;
  duration: string;
  url: string;
  source?: string;
}

type MediaRow = [id: string, title: string, duration: string, url: string, source: string];

const toMediaItems = (rows: MediaRow[]): ContentMediaItem[] =>
  rows.map(([id, title, duration, url, source]) => ({ id, title, duration, url, source }));

// Curated fallback video lessons matching the Aspire LMS API & prototype
const FALLBACK_VIDEOS: ContentMediaItem[] = toMediaItems([
  ['2e4bff91-8351-4a6f-b78d-cc25f6103377', 'video', '10 min · Video link', 'https://youtu.be/nlhO51MZtuk', 'youtube.url'],
  ['vid-proto-1', 'Life Cycle Needs | Episode 3 | Budgeting – Anita Ki Diary Ka Raaz', '1:43', 'https://www.youtube.com/watch?v=EUPk_ThuWXI', 'YouTube'],
  ['vid-proto-2', 'Understanding money in daily life', '[—]', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Library'],
  ['vid-proto-3', 'Lifecycle Needs', '6:50', 'https://www.youtube.com/watch?v=EUPk_ThuWXI', 'Library'],
  ['vid-proto-4', 'Swadhaar FinAccess Product Camp', '1:07', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Library'],
  ['vid-proto-5', '1.1 Introduction to Financial Planning & Family Needs', '3:45', 'https://www.youtube.com/watch?v=EUPk_ThuWXI', 'YouTube'],
  ['vid-proto-6', 'Emergency Savings Fund & Daily Banking', '4:20', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Library'],
]);

// Curated fallback PDF guides matching the Aspire LMS API & prototype
const FALLBACK_PDFS: ContentMediaItem[] = toMediaItems([
  ['080e3855-65f4-41ab-8b6e-cdd69f1b0bb1', 'PDF Testing 19th Jan', 'PDF Guide', 'https://aspire-leaders-assets-qa.s3.us-east-1.amazonaws.com/lms/lessons/file_1768806247619_5ccd8c.pdf', 'pdf'],
  ['pdf-proto-1', 'Swadhaar Household Budgeting Workbook', '6 pages', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF Guide'],
  ['pdf-proto-2', 'Financial Goals & Life Cycle Roadmap Worksheet', '4 pages', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF Worksheet'],
  ['pdf-proto-3', 'Learner Handbook: Savings, Accounts & Security', '12 pages', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF Handbook'],
  ['pdf-proto-4', 'Daily Expense Tracker & Savings Log', '2 pages', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'PDF Log'],
]);

// Lower-cased format hints of an LMS lesson and its media, used to tell videos from PDFs
const getLessonMediaFacts = (l: any) => ({
  format: String(l.format || '').toLowerCase(),
  subFormat: String(l.subFormat || '').toLowerCase(),
  mediaFormat: String(l.media?.format || '').toLowerCase(),
  mediaSubFormat: String(l.media?.subFormat || '').toLowerCase(),
  source: String(l.media?.source || l.media?.path || '').toLowerCase(),
});

// Helper to determine if an LMS lesson is a video
const isVideoLesson = (l: any): boolean => {
  const { format, subFormat, mediaFormat, mediaSubFormat, source } = getLessonMediaFacts(l);

  return (
    format === 'video' ||
    mediaFormat === 'video' ||
    subFormat.includes('video') ||
    subFormat.includes('youtube') ||
    mediaSubFormat.includes('video') ||
    mediaSubFormat.includes('youtube') ||
    source.includes('youtube.com') ||
    source.includes('youtu.be') ||
    source.endsWith('.mp4') ||
    source.endsWith('.webm')
  );
};

// Helper to determine if an LMS lesson is a PDF / document
const isPdfLesson = (l: any): boolean => {
  const { format, subFormat, mediaFormat, mediaSubFormat, source } = getLessonMediaFacts(l);

  return (
    format === 'document' ||
    format === 'pdf' ||
    subFormat === 'pdf' ||
    mediaFormat === 'document' ||
    mediaFormat === 'pdf' ||
    mediaSubFormat === 'pdf' ||
    source.endsWith('.pdf') ||
    source.includes('.pdf?') ||
    l.title?.toLowerCase().includes('.pdf')
  );
};

// Curated prototype Image illustrations
const PROTOTYPE_IMAGES: ContentMediaItem[] = [
  {
    id: 'img-proto-1',
    title: 'Financial Planning Cycle & Milestone Roadmap',
    duration: 'Infographic',
    url: 'https://aspire-leaders-assets-qa.s3.us-east-1.amazonaws.com/lms/modules/file_1793263413927_c5ac1a.png',
    source: 'Asset Library',
  },
  {
    id: 'img-proto-2',
    title: 'Household Income vs Expense Distribution Chart',
    duration: 'Diagram',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    source: 'Chart Asset',
  },
  {
    id: 'img-proto-3',
    title: '50-30-20 Smart Budget Allocation Wheel',
    duration: 'Graphic',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80',
    source: 'Graphic Asset',
  },
];

const DEFAULT_INTRO_TEXT =
  'Now that you understand how financial planning helps households prepare for different needs and goals, the next step is to understand how families can manage their available income and expenses.';

// An LMS PDF lesson has format "document" and subFormat "pdf", so both are matched
const getLessonFormat = (l: any): string =>
  `${l.format || l.primaryCategory || ''} ${l.subFormat || ''}`.trim().toLowerCase();

const buildVideoBlock = (l: any, lIdx: number): SectionBlock => ({
  id: l.lessonId || `blk-vid-${lIdx}-${Date.now()}`,
  type: 'VIDEO WATCH',
  videos: [
    {
      id: `vid-${lIdx}`,
      lessonId: l.lessonId,
      title: l.title || 'Video Lesson',
      duration: l.idealTime ? `${l.idealTime} min` : l.duration || 'Video link',
      sourceUrl: resolveMediaUrl(l.media?.source || l.media?.path || l.media?.url || l.mediaUrl || ''),
    },
  ],
});

const buildPdfBlock = (l: any, lIdx: number): SectionBlock => ({
  id: l.lessonId || `blk-pdf-${lIdx}-${Date.now()}`,
  lessonId: l.lessonId,
  type: 'PDF',
  mediaName: l.title || 'PDF Document',
  mediaUrl: resolveMediaUrl(l.media?.path || l.media?.source || l.media?.url || l.mediaUrl || l.downloadUrl || ''),
  text: l.description || '',
});

const buildImageBlock = (l: any, lIdx: number): SectionBlock => ({
  id: l.lessonId || `blk-img-${lIdx}-${Date.now()}`,
  type: 'IMAGE',
  mediaName: l.title || 'Image Illustration',
  mediaUrl: l.media?.url || l.mediaUrl || l.downloadUrl || '',
  text: l.description || '',
});

// [format keyword, block type, block id prefix] for text-only lesson formats, in match order
const TEXT_LESSON_BLOCKS: Array<[string, SectionBlock['type'], string]> = [
  ['hook', 'HOOK', 'hook'],
  ['concept', 'CONCEPT', 'concept'],
  ['analysis', 'ANALYSIS', 'analysis'],
  ['intro', 'INTRO', 'intro'],
];

const buildTextBlock = (l: any, lIdx: number, fmt: string): SectionBlock => {
  const match = TEXT_LESSON_BLOCKS.find(([keyword]) => fmt.includes(keyword));
  const type = match ? match[1] : 'TEXT';
  const prefix = match ? match[2] : 'txt';
  return {
    id: l.lessonId || `blk-${prefix}-${lIdx}-${Date.now()}`,
    type,
    text: l.description || l.title || '',
  };
};

// Map an LMS lesson of a module to an editor block based on its format
const mapLessonToBlock = (l: any, lIdx: number): SectionBlock => {
  const fmt = getLessonFormat(l);
  if (fmt.includes('video')) return buildVideoBlock(l, lIdx);
  if (fmt.includes('pdf')) return buildPdfBlock(l, lIdx);
  if (fmt.includes('image')) return buildImageBlock(l, lIdx);
  return buildTextBlock(l, lIdx, fmt);
};

const getVideoDuration = (l: any): string => {
  if (l.idealTime) return `${l.idealTime} min`;
  return l.duration ? String(l.duration) : '[—]';
};

const toVideoMediaItem = (l: any): ContentMediaItem => ({
  id: l.lessonId,
  title: l.title || 'Video Lesson',
  duration: getVideoDuration(l),
  url: l.media?.source || l.media?.path || 'https://www.youtube.com/watch?v=EUPk_ThuWXI',
  source: l.subFormat || 'LMS Video',
});

const toPdfMediaItem = (l: any): ContentMediaItem => ({
  id: l.lessonId,
  title: l.title || 'PDF Document',
  duration: l.idealTime ? `${l.idealTime} min read` : 'PDF Guide',
  url: l.media?.source || l.media?.path || '',
  source: l.subFormat || 'PDF',
});

// API items first, followed by the fallback items that the API did not already return
const mergeWithFallback = (apiItems: ContentMediaItem[], fallback: ContentMediaItem[]): ContentMediaItem[] => [
  ...apiItems,
  ...fallback.filter((fb) => !apiItems.some((a) => a.id === fb.id || a.title === fb.title)),
];

// State derived from an existing module that is opened for editing
const getEditModuleState = (targetModule: any) => {
  const lessons: any[] = targetModule.lessons || [];
  return {
    title: targetModule.title || '',
    duration: targetModule.duration ? String(targetModule.duration) : '',
    sectionPrefix: `1.${targetModule.ordering || 1}`,
    lessonIds: new Set<string>(lessons.map((l: any) => l.lessonId).filter(Boolean)),
    blocks: lessons.map((lesson, lessonIdx) => mapLessonToBlock(lesson, lessonIdx)),
  };
};

const findTargetModule = (rawModules: any[], moduleId: unknown): any =>
  moduleId ? rawModules.find((m: any) => m.moduleId === moduleId || m.id === moduleId) : null;

const createVideoItems = (selected: ContentMediaItem[], stamp: number): VideoItem[] =>
  selected.map((v) => ({
    id: `vid-${stamp}-${v.id}`,
    lessonId: v.id,
    title: v.title,
    duration: v.duration.includes('link') ? v.duration : `${v.duration} · Video link`,
    sourceUrl: v.url,
  }));

// Point an existing PDF / image block at the first selected library item
const replaceBlockMedia = (
  prev: SectionBlock[],
  targetBlockId: string,
  first: ContentMediaItem | undefined
): SectionBlock[] =>
  prev.map((b) =>
    b.id === targetBlockId
      ? { ...b, mediaName: first?.title || b.mediaName, mediaUrl: first?.url || b.mediaUrl }
      : b
  );

const addVideosToBlocks = (
  prev: SectionBlock[],
  selected: ContentMediaItem[],
  targetBlockId: string | null,
  stamp: number
): SectionBlock[] => {
  const newVideoItems = createVideoItems(selected, stamp);
  if (targetBlockId) {
    // Append to the specific VIDEO WATCH block
    return prev.map((b) =>
      b.id === targetBlockId ? { ...b, videos: [...(b.videos || []), ...newVideoItems] } : b
    );
  }
  // Insert a new VIDEO WATCH block
  return [...prev, { id: `blk-${stamp}`, type: 'VIDEO WATCH', videos: newVideoItems }];
};

const addPdfsToBlocks = (
  prev: SectionBlock[],
  selected: ContentMediaItem[],
  targetBlockId: string | null,
  stamp: number
): SectionBlock[] => {
  if (targetBlockId) return replaceBlockMedia(prev, targetBlockId, selected[0]);
  const newPdfBlocks: SectionBlock[] = selected.map((p, idx) => ({
    id: `blk-pdf-${stamp}-${idx}`,
    lessonId: p.id,
    type: 'PDF',
    mediaName: p.title,
    mediaUrl: p.url,
    text: '',
  }));
  return [...prev, ...newPdfBlocks];
};

const addImagesToBlocks = (
  prev: SectionBlock[],
  selected: ContentMediaItem[],
  targetBlockId: string | null,
  stamp: number
): SectionBlock[] => {
  if (targetBlockId) return replaceBlockMedia(prev, targetBlockId, selected[0]);
  const newImgBlocks: SectionBlock[] = selected.map((img, idx) => ({
    id: `blk-img-${stamp}-${idx}`,
    type: 'IMAGE',
    mediaName: img.title,
    mediaUrl: img.url,
    text: '',
  }));
  return [...prev, ...newImgBlocks];
};

const slugify = (text: string): string => {
  let out = '';
  for (const ch of text.toLowerCase()) {
    const isAlnum = (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9');
    if (isAlnum) {
      out += ch;
    } else if (!out.endsWith('-')) {
      out += '-';
    }
  }
  if (out.startsWith('-')) out = out.slice(1);
  if (out.endsWith('-')) out = out.slice(0, -1);
  return out;
};

// Alias matching the title (kept as is when it ends with a number, otherwise suffixed with a random number)
const buildAlias = (effectiveTitle: string): string => {
  const cleanSlug = slugify(effectiveTitle) || 'module';
  return /\d$/.test(cleanSlug) ? cleanSlug : `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;
};

// Numeric ordering from the section prefix (e.g. "1.2" -> 2), falling back to the next free position
const computeOrdering = (sectionPrefix: string, moduleCount: number): number => {
  const prefixParts = sectionPrefix.split('.');
  const parsedOrder = prefixParts.length > 1 ? Number.parseInt(prefixParts[1], 10) : Number.parseInt(sectionPrefix, 10);
  return !Number.isNaN(parsedOrder) && parsedOrder > 0 ? parsedOrder : moduleCount + 1;
};

const buildLocalChildren = (blocks: SectionBlock[], status: string) =>
  blocks.flatMap((b) => {
    if (b.type === 'VIDEO WATCH' && b.videos?.length) {
      return b.videos.map((v, i) => ({
        identifier: v.id || `vid-${i}`,
        lessonId: v.id || `vid-${i}`,
        name: v.title || 'Video Lesson',
        primaryCategory: 'Course Unit',
        format: 'video',
        status,
        idealTime: Number.parseInt(v.duration ?? '', 10) || 5,
      }));
    }
    if (b.type === 'PDF') {
      return [{
        identifier: b.id,
        lessonId: b.id,
        name: b.mediaName || 'PDF Document',
        primaryCategory: 'Course Unit',
        format: 'pdf',
        status,
        idealTime: 10,
      }];
    }
    return [];
  });

// Persist a module to localStorage so it is immediately visible in the Course Details page
const saveModuleLocally = (courseId: string, newModule: Record<string, unknown>, onError: () => void) => {
  if (typeof window === 'undefined') return;
  try {
    const storageKey = `swadhaar_custom_modules_${courseId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    localStorage.setItem(storageKey, JSON.stringify([...existing, newModule]));
  } catch {
    onError();
  }
};

const getSaveSuccessMessage = (title: string, status: string, failedAttach: number): string => {
  if (failedAttach > 0) {
    return `Section "${title}" saved, but ${failedAttach} lesson(s) could not be added to it.`;
  }
  return status === 'draft'
    ? `Section "${title}" saved as draft successfully!`
    : `Section "${title}" published successfully!`;
};

const getSaveErrorMessage = (err: any, status: string): string => {
  if (err?.response?.status === 401) {
    return `Section saved locally as ${status} (API token expired on QA server).`;
  }
  return (
    err?.response?.data?.params?.errmsg ||
    err?.response?.data?.params?.err ||
    err?.message ||
    'Failed to save section.'
  );
};

// Lessons picked in the blocks that are not attached to the module yet
const collectNewLessonIds = (blocks: SectionBlock[], attached: Set<string>): string[] =>
  blocks
    .flatMap((b) => (b.type === 'VIDEO WATCH' ? (b.videos || []).map((v) => v.lessonId) : [b.lessonId]))
    .filter((lessonId): lessonId is string => Boolean(lessonId) && !attached.has(lessonId as string));

// Dates formatted as YYYY-MM-DDT00:00:00Z matching Aspire LMS standard
const getModuleDates = () => {
  const now = new Date();
  const startDatetime = `${now.toISOString().split('T')[0]}T00:00:00Z`;
  const endDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
  const endDatetime = `${endDate.toISOString().split('T')[0]}T00:00:00Z`;
  return { startDatetime, endDatetime };
};

const stripHtmlTags = (html: string): string => {
  let out = '';
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf('<', i);
    if (start === -1) break;
    const end = html.indexOf('>', start + 1);
    if (end === -1) break;
    out += html.slice(i, start);
    i = end + 1;
  }
  return out + html.slice(i);
};

const MEDIA_BLOCK_TYPES = new Set<SectionBlock['type']>(['VIDEO WATCH', 'PDF', 'IMAGE']);

type MediaTab = 'videos' | 'pdfs' | 'images';

const MEDIA_TAB_TITLES: Record<MediaTab, string> = { videos: 'Videos', pdfs: 'PDFs', images: 'Media' };

const MEDIA_SEARCH_PLACEHOLDERS: Record<MediaTab, string> = {
  videos: 'Search published video lessons...',
  pdfs: 'Search published PDF documents...',
  images: 'Search the content library...',
};

const MEDIA_TAB_BLOCK_NAMES: Record<MediaTab, string> = { videos: 'Video Watch', pdfs: 'PDF', images: 'Image' };

// [empty label, singular, plural] of the "Add" button per media tab
const MEDIA_ADD_LABELS: Record<MediaTab, [string, string, string]> = {
  videos: ['Add videos', 'video', 'videos'],
  pdfs: ['Add PDFs', 'PDF', 'PDFs'],
  images: ['Add images', 'image', 'images'],
};

const getAddMediaLabel = (tab: MediaTab, selectedCount: number): string => {
  const [emptyLabel, singular, plural] = MEDIA_ADD_LABELS[tab];
  if (selectedCount === 0) return emptyLabel;
  return `Add ${selectedCount} ${selectedCount === 1 ? singular : plural}`;
};

const getCourseLabel = (course: CourseHierarchy | null): string => {
  if (!course?.title) return 'Loading course...';
  const aliasSuffix = course.alias ? ` (${course.alias})` : '';
  return `${course.title}${aliasSuffix}`;
};

const DEFAULT_BADGE_STYLE = { backgroundColor: '#F4F4F5', color: '#27272A' };

const BADGE_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  INTRO: { backgroundColor: '#EEEDE9', color: '#3D3B37' },
  HOOK: { backgroundColor: '#FEF3C7', color: '#92400E' },
  CONCEPT: { backgroundColor: '#E0E7FF', color: '#3730A3' },
  ANALYSIS: { backgroundColor: '#F3E8FF', color: '#6B21A8' },
  'VIDEO WATCH': { backgroundColor: '#FCE7F3', color: '#9D174D' },
  PDF: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  IMAGE: { backgroundColor: '#E0F2FE', color: '#075985' },
};

const getBadgeStyle = (type: SectionBlock['type']) => BADGE_STYLES[type] ?? DEFAULT_BADGE_STYLE;

const DEFAULT_PLACEHOLDER = 'Enter text content here...';

const BLOCK_PLACEHOLDERS: Record<string, string> = {
  INTRO: 'Enter section introduction and overview for learners...',
  HOOK: 'Hook: Pose an intriguing question, real-life problem, or engaging scenario...',
  CONCEPT: 'Concept: Clearly explain the core financial principle or concept...',
  ANALYSIS: 'Analysis: Provide breakdown of numbers, comparisons, or practical case study...',
};

const getPlaceholder = (type: SectionBlock['type']) => BLOCK_PLACEHOLDERS[type] ?? DEFAULT_PLACEHOLDER;

const renameVideoInBlocks = (
  blocks: SectionBlock[],
  blockId: string,
  videoId: string,
  title: string
): SectionBlock[] =>
  blocks.map((b) => {
    if (b.id !== blockId) return b;
    return { ...b, videos: (b.videos || []).map((v) => (v.id === videoId ? { ...v, title } : v)) };
  });

interface HierarchySetters {
  setCourse: (course: CourseHierarchy) => void;
  setBlocks: (blocks: SectionBlock[]) => void;
  setSectionPrefix: (prefix: string) => void;
  setTitle: (title: string) => void;
  setDuration: (duration: string) => void;
  attachedLessonIds: { current: Set<string> };
}

// Fill the form state from the loaded course hierarchy (new section, or the module being edited)
const applyCourseHierarchy = (data: CourseHierarchy, moduleId: unknown, setters: HierarchySetters) => {
  setters.setCourse(data);
  const rawModules = data.modules || [];

  // If hierarchy modules is empty (e.g. modules: []), show ONLY ONE block default
  if (rawModules.length === 0) {
    setters.setBlocks([{ id: 'blk-intro', type: 'INTRO', text: DEFAULT_INTRO_TEXT }]);
    setters.setSectionPrefix('1.1');
    setters.setTitle('');
    setters.setDuration('');
    return;
  }

  // If hierarchy has data, show blocks as per their type
  const targetModule = findTargetModule(rawModules, moduleId);
  if (!targetModule) {
    // New Section under existing course: compute next section index
    setters.setSectionPrefix(`1.${rawModules.length + 1}`);
    return;
  }
  const editState = getEditModuleState(targetModule);
  setters.setTitle(editState.title);
  setters.setDuration(editState.duration);
  setters.setSectionPrefix(editState.sectionPrefix);
  setters.attachedLessonIds.current = editState.lessonIds;
  if (editState.blocks.length > 0) {
    setters.setBlocks(editState.blocks);
  }
};

interface LibrarySetters {
  setMediaLoading: (loading: boolean) => void;
  setLibraryVideos: (items: ContentMediaItem[]) => void;
  setLibraryPdfs: (items: ContentMediaItem[]) => void;
}

// Load Video and PDF lessons from the Aspire LMS Lessons API
// curl 'https://middleware-qa.aspireleaders.org/lms-service/v1/lessons?status=published&offset=0&limit=20'
const loadLibraryLessons = async (setters: LibrarySetters) => {
  try {
    setters.setMediaLoading(true);
    const res = await getLmsLessons({ status: 'published', offset: 0, limit: 100 });
    const lessons = res.lessons || [];
    if (lessons.length === 0) return;

    // Filter videos and PDFs from API
    const apiVideos: ContentMediaItem[] = lessons.filter((l) => isVideoLesson(l)).map(toVideoMediaItem);
    const apiPdfs: ContentMediaItem[] = lessons.filter((l) => isPdfLesson(l)).map(toPdfMediaItem);

    if (apiVideos.length > 0) {
      setters.setLibraryVideos(mergeWithFallback(apiVideos, FALLBACK_VIDEOS));
    }

    if (apiPdfs.length > 0) {
      setters.setLibraryPdfs(mergeWithFallback(apiPdfs, FALLBACK_PDFS));
    }
  } catch (err) {
    console.error('Failed to load lessons from API:', err);
  } finally {
    setters.setMediaLoading(false);
  }
};

const filterMediaItems = (list: ContentMediaItem[], query: string): ContentMediaItem[] => {
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter((item) => item.title.toLowerCase().includes(q));
};

const ADD_MEDIA_TO_BLOCKS: Record<
  MediaTab,
  (prev: SectionBlock[], selected: ContentMediaItem[], targetBlockId: string | null, stamp: number) => SectionBlock[]
> = {
  videos: addVideosToBlocks,
  pdfs: addPdfsToBlocks,
  images: addImagesToBlocks,
};

// Block types that open the media picker instead of adding a text block
const MEDIA_TAB_FOR_BLOCK_TYPE: Partial<Record<SectionBlock['type'], MediaTab>> = {
  'VIDEO WATCH': 'videos',
  PDF: 'pdfs',
  IMAGE: 'images',
};

// Swap a block with its neighbour; null when the move is out of range
const moveBlock = (blocks: SectionBlock[], index: number, direction: 'up' | 'down'): SectionBlock[] | null => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= blocks.length) return null;
  const newBlocks = [...blocks];
  const temp = newBlocks[index];
  newBlocks[index] = newBlocks[targetIndex];
  newBlocks[targetIndex] = temp;
  return newBlocks;
};

interface SaveContext {
  courseId: string;
  title: string;
  sectionPrefix: string;
  blocks: SectionBlock[];
  course: CourseHierarchy | null;
  editingModuleId: string;
  attachedLessonIds: Set<string>;
  notify: (severity: 'success' | 'error' | 'info', message: string) => void;
  redirect: (delayMs: number) => void;
}

// Editing updates the module (PATCH); a new section creates it (POST). Draft and publish use the same call.
const createOrUpdateModule = async (
  ctx: SaveContext,
  status: 'draft' | 'published',
  effectiveTitle: string,
  descHtml: string,
  ordering: number
): Promise<string> => {
  // The LMS has no "draft" status for modules; unsaved-for-learners modules are "unpublished"
  const apiStatus = status === 'draft' ? 'unpublished' : status;
  if (ctx.editingModuleId) {
    await updateModule(ctx.editingModuleId, {
      title: effectiveTitle,
      description: descHtml,
      ordering,
      status: apiStatus,
    });
    return ctx.editingModuleId;
  }

  // Generate clean alias matching title (preserving user-specified slugs or suffixing if generic)
  const payload: CreateModulePayload = {
    title: effectiveTitle,
    alias: buildAlias(effectiveTitle),
    courseId: ctx.courseId,
    description: descHtml,
    image: '/uploads/module/default.png',
    ordering,
    status: apiStatus, // 'unpublished' when user clicks Save, 'published' when user clicks Publish changes
    ...getModuleDates(),
  };
  const res = await createModule(payload);
  return res?.result?.moduleId || `mod-${Date.now()}`;
};

// Put the picked videos and PDFs into the module: PATCH /lms-service/v1/lessons/:id { courseId, moduleId }
const attachLessonsToModule = async (ctx: SaveContext, moduleId: string): Promise<number> => {
  const lessonIds = collectNewLessonIds(ctx.blocks, ctx.attachedLessonIds);
  const attachResults = await Promise.allSettled(
    lessonIds.map((lessonId, idx) => updateLmsLesson(lessonId, { courseId: ctx.courseId, moduleId, ordering: idx + 1 }))
  );
  return attachResults.filter((r) => r.status === 'rejected').length;
};

// API Integration: Save section / module via POST /lms-service/v1/modules
const saveSection = async (ctx: SaveContext, status: 'draft' | 'published') => {
  const { courseId, blocks, course } = ctx;
  const effectiveTitle = ctx.title.trim() || `${ctx.sectionPrefix} Section`;
  try {
    // Description from first block text or title
    const firstBlockText = blocks[0]?.text?.trim();
    const descHtml = firstBlockText ? `<p>${firstBlockText}</p>` : `<p>${effectiveTitle}</p>`;

    // Compute numeric ordering from section prefix (e.g. "1.2" -> 2)
    const ordering = computeOrdering(ctx.sectionPrefix, course?.modules?.length || 0);

    const moduleId = await createOrUpdateModule(ctx, status, effectiveTitle, descHtml, ordering);
    const failedAttach = await attachLessonsToModule(ctx, moduleId);

    // Persist module to localStorage so it is immediately visible in Course Details page
    saveModuleLocally(
      courseId,
      {
        moduleId,
        identifier: moduleId,
        name: effectiveTitle,
        title: effectiveTitle,
        description: descHtml,
        ordering,
        status,
        children: buildLocalChildren(blocks, status),
      },
      () => {
        // ignore localStorage error
      }
    );

    ctx.notify(failedAttach > 0 ? 'error' : 'success', getSaveSuccessMessage(effectiveTitle, status, failedAttach));
    ctx.redirect(1200);
  } catch (err: any) {
    console.error('Error in handleSave:', err);

    // Graceful offline/token-fallback for a new section only; an edit must not spawn a blank module
    if (!ctx.editingModuleId) saveModuleLocally(
      courseId,
      {
        moduleId: `mod-${Date.now()}`,
        identifier: `mod-${Date.now()}`,
        name: effectiveTitle,
        title: effectiveTitle,
        description: `<p>${effectiveTitle}</p>`,
        ordering: (course?.modules?.length || 0) + 1,
        status,
        children: [],
      },
      () => {
        // ignore
      }
    );

    ctx.notify(err?.response?.status === 401 ? 'info' : 'error', getSaveErrorMessage(err, status));
    ctx.redirect(1500);
  }
};

type OpenMediaDialog = (tab: MediaTab, blockId?: string) => void;

interface MediaListItemProps {
  item: ContentMediaItem;
  isChecked: boolean;
  isLast: boolean;
  onToggle: (id: string) => void;
}

const MediaListItem = ({ item, isChecked, isLast, onToggle }: MediaListItemProps) => (
<Box
  key={item.id}
  component="label"
  onClick={() => onToggle(item.id)}
  sx={{
    display: 'flex',
    gap: 1.5,
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: isLast ? 'none' : '1px solid #ECEAE5',
    fontSize: '14px',
    backgroundColor: isChecked ? '#FAF9F6' : '#FFFFFF',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: isChecked ? '#F5F4EE' : '#F9F9F8',
    },
  }}
>
  <Checkbox
    checked={isChecked}
    size="small"
    sx={{
      p: 0,
      color: '#BDB9B1',
      '&.Mui-checked': {
        color: '#4F46E5', // Distinct purple/blue as in the prototype screenshot
      },
    }}
  />
  <Typography
    component="span"
    sx={{
      flexGrow: 1,
      fontSize: '14px',
      color: '#1F1E1C',
      fontWeight: isChecked ? 500 : 400,
    }}
  >
    {item.title}
  </Typography>
  <Typography
    component="span"
    sx={{
      fontSize: '12px',
      color: '#6B6862',
      whiteSpace: 'nowrap',
    }}
  >
    {item.duration || '[—]'}
  </Typography>
</Box>
);

interface MediaPickerDialogProps {
  title: string;
  sectionPrefix: string;
  mediaDialogOpen: boolean;
  setMediaDialogOpen: (open: boolean) => void;
  mediaActiveTab: MediaTab;
  setMediaActiveTab: (tab: MediaTab) => void;
  mediaSearchQuery: string;
  setMediaSearchQuery: (query: string) => void;
  selectedMediaIds: string[];
  setSelectedMediaIds: (ids: string[]) => void;
  libraryVideos: ContentMediaItem[];
  libraryPdfs: ContentMediaItem[];
  mediaLoading: boolean;
  handleToggleMediaSelect: (id: string) => void;
  displayedItems: ContentMediaItem[];
  handleAddSelectedMedia: () => void;
  selectedCount: number;
}

const MediaPickerDialog = ({
  title,
  sectionPrefix,
  mediaDialogOpen,
  setMediaDialogOpen,
  mediaActiveTab,
  setMediaActiveTab,
  mediaSearchQuery,
  setMediaSearchQuery,
  selectedMediaIds,
  setSelectedMediaIds,
  libraryVideos,
  libraryPdfs,
  mediaLoading,
  handleToggleMediaSelect,
  displayedItems,
  handleAddSelectedMedia,
  selectedCount,
}: MediaPickerDialogProps) => (
  <Dialog
    open={mediaDialogOpen}
    onClose={() => setMediaDialogOpen(false)}
    maxWidth={false}
    PaperProps={{
      sx: {
        width: 720,
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: '10px',
        boxShadow: '0 20px 48px rgba(31,30,28,0.25)',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        m: 2,
      },
    }}
    slotProps={{
      backdrop: {
        sx: { backgroundColor: 'rgba(31,30,28,0.45)' },
      },
    }}
  >
    {/* Dialog Header */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '22px 24px 0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Typography
          component="h2"
          sx={{ margin: 0, fontSize: '19px', fontWeight: 600, color: '#1F1E1C' }}
        >
          Add {MEDIA_TAB_TITLES[mediaActiveTab]} to {sectionPrefix} {title || 'Section'}
        </Typography>
        {mediaLoading && (
          <CircularProgress size={16} sx={{ color: '#1F1E1C', ml: 0.5 }} />
        )}
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            font: "500 11px/1 'IBM Plex Mono', monospace",
            color: '#4B4843',
            backgroundColor: '#FFFFFF',
            border: '1px dashed #8A867F',
            borderRadius: '4px',
            padding: '3px 6px',
            whiteSpace: 'nowrap',
          }}
        >
          LMS LESSONS
        </Box>
      </Box>

      <IconButton
        aria-label="Close"
        onClick={() => setMediaDialogOpen(false)}
        sx={{
          width: 32,
          height: 32,
          color: '#3D3B37',
          p: 0,
          '&:hover': { backgroundColor: '#F3F4F6' },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>

    {/* Tab List & Action Buttons Row */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '12px 24px 0',
        borderBottom: '1px solid #ECEAE5',
      }}
    >
      {/* Tabs */}
      <Box role="tablist" aria-label="Content type" sx={{ display: 'flex', gap: 0.5 }}>
        <Button
          role="tab"
          aria-selected={mediaActiveTab === 'videos'}
          onClick={() => {
            setMediaActiveTab('videos');
            setSelectedMediaIds([]);
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 40,
            padding: '0 14px',
            border: 'none',
            borderBottom: mediaActiveTab === 'videos' ? '2px solid #1F1E1C' : '2px solid transparent',
            borderRadius: 0,
            backgroundColor: 'transparent',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: mediaActiveTab === 'videos' ? '#1F1E1C' : '#6B6862',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#1F1E1C',
            },
          }}
        >
          Videos ({libraryVideos.length})
        </Button>
        <Button
          role="tab"
          aria-selected={mediaActiveTab === 'pdfs'}
          onClick={() => {
            setMediaActiveTab('pdfs');
            setSelectedMediaIds([]);
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 40,
            padding: '0 14px',
            border: 'none',
            borderBottom: mediaActiveTab === 'pdfs' ? '2px solid #1F1E1C' : '2px solid transparent',
            borderRadius: 0,
            backgroundColor: 'transparent',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: mediaActiveTab === 'pdfs' ? '#1F1E1C' : '#6B6862',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#1F1E1C',
            },
          }}
        >
          PDFs ({libraryPdfs.length})
        </Button>
        {mediaActiveTab === 'images' && (
          <Button
            role="tab"
            aria-selected={true}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 40,
              padding: '0 14px',
              border: 'none',
              borderBottom: '2px solid #1F1E1C',
              borderRadius: 0,
              backgroundColor: 'transparent',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#1F1E1C',
              textTransform: 'none',
            }}
          >
            Images
          </Button>
        )}
      </Box>

      {/* Quick Create Buttons on Right */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <QuickCreateButton href="/content/create-video" label="+ Create new video" />
        <QuickCreateButton href="/content/create-pdf" label="+ Create new PDF" />
      </Box>
    </Box>

    {/* Content Body: Search input + Checkbox List */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, padding: '16px 24px' }}>
      <TextField
        id="scr-pickmedia-pm-q"
        fullWidth
        size="small"
        placeholder={MEDIA_SEARCH_PLACEHOLDERS[mediaActiveTab]}
        value={mediaSearchQuery}
        onChange={(e) => setMediaSearchQuery(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: 40,
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            fontSize: '14px',
            color: '#1F1E1C',
            '& fieldset': { borderColor: '#BDB9B1' },
            '&:hover fieldset': { borderColor: '#1F1E1C' },
            '&.Mui-focused fieldset': { borderColor: '#1F1E1C' },
          },
        }}
      />

      {/* List Box Container */}
      <Box
        sx={{
          border: '1px solid #D6D3CC',
          borderRadius: '8px',
          overflow: 'hidden',
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {displayedItems.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '14px' }}>
              No matching {mediaActiveTab} found in the content library.
            </Typography>
          </Box>
        ) : (
          displayedItems.map((item, idx) => (
            <MediaListItem
              key={item.id}
              item={item}
              isChecked={selectedMediaIds.includes(item.id)}
              isLast={idx === displayedItems.length - 1}
              onToggle={handleToggleMediaSelect}
            />
          ))
        )}
      </Box>

      {/* Hint Line */}
      <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
        Selected: {selectedCount} · added to the {MEDIA_TAB_BLOCK_NAMES[mediaActiveTab]} block in this order
      </Typography>
    </Box>

    {/* Dialog Footer Actions */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1.2,
        padding: '16px 24px',
        borderTop: '1px solid #ECEAE5',
      }}
    >
      <Button
        variant="outlined"
        onClick={() => setMediaDialogOpen(false)}
        sx={{
          height: 38,
          padding: '0 16px',
          borderRadius: '6px',
          borderColor: '#BDB9B1',
          color: '#1F1E1C',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'none',
          backgroundColor: '#FFFFFF',
          '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
        }}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        disabled={selectedCount === 0}
        onClick={handleAddSelectedMedia}
        sx={{
          height: 38,
          padding: '0 18px',
          borderRadius: '6px',
          backgroundColor: '#1F1E1C',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { backgroundColor: '#000000', boxShadow: 'none' },
          '&.Mui-disabled': {
            backgroundColor: '#D6D3CC',
            color: '#8A867F',
          },
        }}
      >
        {getAddMediaLabel(mediaActiveTab, selectedCount)}
      </Button>
    </Box>
  </Dialog>
);

interface SectionSidebarProps {
  course: CourseHierarchy | null;
  courseId: string;
  title: string;
  setTitle: (value: string) => void;
  duration: string;
  setDuration: (value: string) => void;
  sectionPrefix: string;
  courseDisplayName: string;
  language: string;
}

const SectionSidebar = ({
  course,
  courseId,
  title,
  setTitle,
  duration,
  setDuration,
  sectionPrefix,
  courseDisplayName,
  language,
}: SectionSidebarProps) => (
  <Grid item xs={12} md={4}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Card 1: Section Details */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6D3CC',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: '14px 20px', borderBottom: '1px solid #ECEAE5' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
            Section details
          </Typography>
        </Box>

        <Box sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Title<span style={{ color: "#D92D20" }}> *</span>
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. Budgeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  backgroundColor: '#FFFFFF',
                  '& fieldset': { borderColor: '#BDB9B1' },
                  '&:hover fieldset': { borderColor: '#1F1E1C' },
                },
              }}
            />
          </Box>

          {/* Duration */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Duration (min)
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. 21"
              value={duration}
              onChange={(e) => setDuration(sanitizeMinutes(e.target.value))}
              inputProps={{ inputMode: 'numeric', maxLength: MINUTES_MAX_DIGITS }}
              error={!isValidMinutes(duration)}
              helperText={isValidMinutes(duration) ? undefined : MINUTES_ERROR}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  backgroundColor: '#FFFFFF',
                  '& fieldset': { borderColor: '#BDB9B1' },
                  '&:hover fieldset': { borderColor: '#1F1E1C' },
                },
              }}
            />
            {isValidMinutes(duration) && (
              <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
                Estimated completion duration
              </Typography>
            )}
          </Box>

          {/* Course Name */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
              Course
            </Typography>
            <TextField
              size="small"
              fullWidth
              disabled
              value={getCourseLabel(course)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: 40,
                  backgroundColor: '#F9F9F8',
                  color: '#1F1E1C',
                  fontWeight: 500,
                  '& fieldset': { borderColor: '#D6D3CC' },
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
              Position set to {sectionPrefix} · Ordering {sectionPrefix.split('.')[1] || '1'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Card 2: Real Details of Selected Course */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6D3CC',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: '14px 20px',
            borderBottom: '1px solid #ECEAE5',
          }}
        >
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
            Course details
          </Typography>
          <Chip
            label={course?.status || 'unpublished'}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              fontSize: '11px',
              height: 20,
              backgroundColor: course?.status === 'published' ? '#DCFCE7' : '#FEF3C7',
              color: course?.status === 'published' ? '#14532D' : '#92400E',
              borderRadius: '4px',
              textTransform: 'capitalize',
            }}
          />
        </Box>

        <Box sx={{ p: '14px 20px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Course Title:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontWeight: 600, fontSize: '13px' }}>
              {courseDisplayName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Alias / Code:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontFamily: 'monospace', fontSize: '12px' }}>
              {course?.alias || course?.courseCode || '—'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Language:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontWeight: 500, fontSize: '13px' }}>
              {language}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Existing Modules:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontWeight: 600, fontSize: '13px' }}>
              {course?.modules?.length ?? 0}
            </Typography>
          </Box>

          {course?.description && (
            <Box sx={{ pt: 1, borderTop: '1px solid #ECEAE5' }}>
              <Typography sx={{ color: '#6B6862', fontSize: '12px', mb: 0.3 }}>Description:</Typography>
              <Typography sx={{ color: '#1F1E1C', fontSize: '13px', lineHeight: 1.4 }}>
                {stripHtmlTags(course.description).trim()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Card 3: Cohort & Settings */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6D3CC',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: '14px 20px', borderBottom: '1px solid #ECEAE5' }}>
          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
            Cohort & Settings
          </Typography>
        </Box>

        <Box sx={{ p: '14px 20px', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Cohort:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontFamily: 'monospace', fontSize: '12px' }}>
              {course?.params?.cohortId ? `${course.params.cohortId.slice(0, 13)}...` : 'All Learners'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Course ID:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontFamily: 'monospace', fontSize: '12px' }}>
              {courseId ? `${courseId.slice(0, 13)}...` : '—'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#6B6862', fontSize: '13px' }}>Created On:</Typography>
            <Typography sx={{ color: '#1F1E1C', fontSize: '12px' }}>
              {course?.createdAt ? new Date(course.createdAt).toLocaleDateString('en-GB') : '—'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  </Grid>
);

interface VideoBlockBodyProps {
  block: SectionBlock;
  handleOpenMediaDialog: OpenMediaDialog;
  handleEditVideoTitle: (blockId: string, video: VideoItem) => void;
  handleRemoveVideo: (blockId: string, videoId: string) => void;
}

const VideoBlockBody = ({ block, handleOpenMediaDialog, handleEditVideoTitle, handleRemoveVideo }: VideoBlockBodyProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
    {(block.videos || []).map((video) => (
      <Box
        key={video.id}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          p: '10px 14px',
          border: '1px solid #ECEAE5',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box
            sx={{
              width: 72,
              height: 42,
              borderRadius: '4px',
              backgroundColor: '#E2DFD8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B6862',
              letterSpacing: '0.05em',
              gap: 0.5,
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 14 }} />
            VIDEO
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F1E1C' }}>
              {video.title}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
              {video.duration || 'YouTube link'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip title="Edit video title">
            <IconButton
              size="small"
              onClick={() => handleEditVideoTitle(block.id, video)}
              sx={{ color: '#6B6862', '&:hover': { color: '#1F1E1C' } }}
            >
              <EditOutlinedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove video">
            <IconButton
              size="small"
              onClick={() => handleRemoveVideo(block.id, video.id)}
              sx={{ color: '#9F1239', '&:hover': { backgroundColor: '#FEE2E2' } }}
            >
              <RemoveCircleOutlineIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    ))}

    <Button
      variant="outlined"
      size="small"
      onClick={() => handleOpenMediaDialog('videos', block.id)}
      sx={{
        alignSelf: 'flex-start',
        borderColor: '#BDB9B1',
        color: '#1F1E1C',
        backgroundColor: '#FFFFFF',
        textTransform: 'none',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '6px',
        py: 0.5,
        px: 1.5,
        mt: 0.5,
        '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
      }}
    >
      + Add video
    </Button>
  </Box>
);

interface PdfBlockBodyProps {
  block: SectionBlock;
  handleOpenMediaDialog: OpenMediaDialog;
  handleUpdateBlockText: (blockId: string, newText: string) => void;
}

const PdfBlockBody = ({ block, handleOpenMediaDialog, handleUpdateBlockText }: PdfBlockBodyProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        p: '12px 14px',
        border: '1px solid #ECEAE5',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Box
          sx={{
            width: 50,
            height: 44,
            borderRadius: '4px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PictureAsPdfOutlinedIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
            {block.mediaName || 'PDF Document Guide'}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
            {block.mediaUrl ? (
              <a
                href={block.mediaUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#E6873C', textDecoration: 'none', fontWeight: 500 }}
              >
                View attached PDF
              </a>
            ) : (
              'PDF attached to lesson'
            )}
          </Typography>
        </Box>
      </Box>

      <Button
        variant="outlined"
        size="small"
        onClick={() => handleOpenMediaDialog('pdfs', block.id)}
        sx={{
          borderColor: '#BDB9B1',
          color: '#1F1E1C',
          fontSize: '12px',
          textTransform: 'none',
          borderRadius: '6px',
          '&:hover': { borderColor: '#1F1E1C' },
        }}
      >
        Change PDF
      </Button>
    </Box>

    <BlockNoteField
      placeholder="Optional notes, instructions, or reading tasks for this PDF..."
      value={block.text || ''}
      onChange={(text) => handleUpdateBlockText(block.id, text)}
    />
  </Box>
);

interface ImageBlockBodyProps {
  block: SectionBlock;
  handleOpenMediaDialog: OpenMediaDialog;
  handleUpdateBlockText: (blockId: string, newText: string) => void;
}

const ImageBlockBody = ({ block, handleOpenMediaDialog, handleUpdateBlockText }: ImageBlockBodyProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        p: '12px 14px',
        border: '1px solid #ECEAE5',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {block.mediaUrl ? (
          <Box
            component="img"
            src={block.mediaUrl}
            alt={block.mediaName || 'Image'}
            sx={{
              width: 58,
              height: 44,
              borderRadius: '4px',
              objectFit: 'cover',
              border: '1px solid #ECEAE5',
            }}
          />
        ) : (
          <Box
            sx={{
              width: 58,
              height: 44,
              borderRadius: '4px',
              backgroundColor: '#E0F2FE',
              color: '#075985',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon sx={{ fontSize: 24 }} />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
            {block.mediaName || 'Image Illustration'}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
            Image asset attached to section
          </Typography>
        </Box>
      </Box>

      <Button
        variant="outlined"
        size="small"
        onClick={() => handleOpenMediaDialog('images', block.id)}
        sx={{
          borderColor: '#BDB9B1',
          color: '#1F1E1C',
          fontSize: '12px',
          textTransform: 'none',
          borderRadius: '6px',
          '&:hover': { borderColor: '#1F1E1C' },
        }}
      >
        Change Image
      </Button>
    </Box>

    <BlockNoteField
      placeholder="Optional caption, image explanation, or key takeaway..."
      value={block.text || ''}
      onChange={(text) => handleUpdateBlockText(block.id, text)}
    />
  </Box>
);

interface TextBlockBodyProps {
  block: SectionBlock;
  handleUpdateBlockText: (blockId: string, newText: string) => void;
}

const TextBlockBody = ({ block, handleUpdateBlockText }: TextBlockBodyProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
    {/* Formatting Toolbar */}
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        fontSize: '12px',
        fontWeight: 600,
        color: '#6B6862',
        py: 0.8,
        px: 1.5,
        border: '1px solid #ECEAE5',
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        backgroundColor: '#FAF9F6',
        userSelect: 'none',
      }}
    >
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
      >
        B
      </Typography>
      <Typography
        component="span"
        sx={{ fontStyle: 'italic', fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
      >
        I
      </Typography>
      <Typography
        component="span"
        sx={{ textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
      >
        U
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
      >
        • List
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: '13px', cursor: 'pointer', '&:hover': { color: '#1F1E1C' } }}
      >
        Link
      </Typography>
    </Box>

    <BlockNoteField
      placeholder={getPlaceholder(block.type)}
      value={block.text || ''}
      onChange={(text) => handleUpdateBlockText(block.id, text)}
      borderRadius="0 0 6px 6px"
    />
  </Box>
);

const BLOCK_TYPE_BUTTONS: Array<[type: SectionBlock['type'], label: string]> = [
  ['TEXT', 'Text'],
  ['HOOK', 'Hook'],
  ['CONCEPT', 'Concept'],
  ['ANALYSIS', 'Analysis'],
];

const BlockTypeButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button
    size="small"
    variant="outlined"
    onClick={onClick}
    sx={{
      height: 28,
      fontSize: '12px',
      borderColor: '#BDB9B1',
      color: '#1F1E1C',
      backgroundColor: '#FFFFFF',
      textTransform: 'none',
      py: 0,
      px: 1.2,
      whiteSpace: 'nowrap',
      minWidth: 'max-content',
      '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#FAF9F6' },
    }}
  >
    {label}
  </Button>
);

const QuickCreateButton = ({ href, label }: { href: string; label: string }) => (
  <Button
    component={Link}
    href={href}
    variant="outlined"
    size="small"
    sx={{
      height: 30,
      fontSize: '13px',
      fontWeight: 500,
      textTransform: 'none',
      padding: '0 10px',
      borderColor: '#BDB9B1',
      color: '#1F1E1C',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      whiteSpace: 'nowrap',
      '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
    }}
  >
    {label}
  </Button>
);

interface BlockNoteFieldProps {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  borderRadius?: string;
}

// Multi-line note under a block (PDF, image, text and link blocks)
const BlockNoteField = ({ placeholder, value, onChange, borderRadius = '6px' }: BlockNoteFieldProps) => (
  <TextField
    multiline
    rows={2}
    fullWidth
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius,
        backgroundColor: '#FFFFFF',
        fontFamily: 'inherit',
        fontSize: '14px',
        lineHeight: 1.5,
        color: '#1F1E1C',
        '& fieldset': { borderColor: '#BDB9B1' },
        '&:hover fieldset': { borderColor: '#1F1E1C' },
        '&.Mui-focused fieldset': { borderColor: '#1F1E1C' },
      },
    }}
  />
);

interface BlockCardProps {
  block: SectionBlock;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  handleOpenMediaDialog: OpenMediaDialog;
  handleMoveBlock: (index: number, direction: 'up' | 'down') => void;
  handleRemoveBlock: (blockId: string) => void;
  handleUpdateBlockText: (blockId: string, newText: string) => void;
  handleEditVideoTitle: (blockId: string, video: VideoItem) => void;
  handleRemoveVideo: (blockId: string, videoId: string) => void;
}

const BlockCard = ({
  block,
  index,
  isFirst,
  isLast,
  handleOpenMediaDialog,
  handleMoveBlock,
  handleRemoveBlock,
  handleUpdateBlockText,
  handleEditVideoTitle,
  handleRemoveVideo,
}: BlockCardProps) => {
  const badgeStyle = getBadgeStyle(block.type);

  return (
    <Box key={block.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      {/* Up / Down Reorder Arrows on left */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
        <IconButton
          size="small"
          disabled={isFirst}
          onClick={() => handleMoveBlock(index, 'up')}
          aria-label={`Move ${block.type} block up`}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            border: '1px solid #BDB9B1',
            backgroundColor: '#FFFFFF',
            color: '#3D3B37',
            p: 0,
            '&:hover': { backgroundColor: '#F3F4F6' },
            '&.Mui-disabled': { opacity: 0.3 },
          }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          disabled={isLast}
          onClick={() => handleMoveBlock(index, 'down')}
          aria-label={`Move ${block.type} block down`}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            border: '1px solid #BDB9B1',
            backgroundColor: '#FFFFFF',
            color: '#3D3B37',
            p: 0,
            '&:hover': { backgroundColor: '#F3F4F6' },
            '&.Mui-disabled': { opacity: 0.3 },
          }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Block Card Container */}
      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6D3CC',
          borderRadius: '10px',
          p: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Block Header: Type Badge + Remove Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            component="span"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 600,
              fontSize: '11px',
              letterSpacing: '0.06em',
              borderRadius: '4px',
              py: 0.5,
              px: 1,
              ...badgeStyle,
            }}
          >
            {block.type}
          </Typography>

          <IconButton
            size="small"
            onClick={() => handleRemoveBlock(block.id)}
            sx={{
              color: '#9F1239',
              width: 28,
              height: 28,
              '&:hover': { backgroundColor: '#FEE2E2' },
            }}
            title="Remove block"
          >
            <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Block Content Renderers by Type */}
        {block.type === 'VIDEO WATCH' && (
          <VideoBlockBody
            block={block}
            handleOpenMediaDialog={handleOpenMediaDialog}
            handleEditVideoTitle={handleEditVideoTitle}
            handleRemoveVideo={handleRemoveVideo}
          />
        )}
        {block.type === 'PDF' && (
          <PdfBlockBody
            block={block}
            handleOpenMediaDialog={handleOpenMediaDialog}
            handleUpdateBlockText={handleUpdateBlockText}
          />
        )}
        {block.type === 'IMAGE' && (
          <ImageBlockBody
            block={block}
            handleOpenMediaDialog={handleOpenMediaDialog}
            handleUpdateBlockText={handleUpdateBlockText}
          />
        )}
        {!MEDIA_BLOCK_TYPES.has(block.type) && (
          <TextBlockBody
            block={block}
            handleUpdateBlockText={handleUpdateBlockText}
          />
        )}
      </Paper>
    </Box>
  );
};

interface SectionHeaderProps {
  basePath: string;
  courseId: string;
  course: CourseHierarchy | null;
  courseDisplayName: string;
  sectionPrefix: string;
  title: string;
  saveLoading: boolean;
  savingType: 'draft' | 'published' | null;
  handleSave: (status: 'draft' | 'published') => void;
  handleCancel: () => void;
}

const SectionHeader = ({
  basePath,
  courseId,
  course,
  courseDisplayName,
  sectionPrefix,
  title,
  saveLoading,
  savingType,
  handleSave,
  handleCancel,
}: SectionHeaderProps) => (
  <>
  {/* Top Breadcrumb Navigation */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
    <Link href={basePath} style={{ textDecoration: 'none' }}>
      <Typography
        variant="body2"
        sx={{
          color: '#6B6862',
          fontSize: '13px',
          fontWeight: 500,
          '&:hover': { color: '#E6873C' },
        }}
      >
        Learning
      </Typography>
    </Link>
    <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
      /
    </Typography>
    <Link href={basePath} style={{ textDecoration: 'none' }}>
      <Typography
        variant="body2"
        sx={{
          color: '#6B6862',
          fontSize: '13px',
          fontWeight: 500,
          '&:hover': { color: '#E6873C' },
        }}
      >
        Courses
      </Typography>
    </Link>
    <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
      /
    </Typography>
    <Link href={`${basePath}/${courseId}`} style={{ textDecoration: 'none' }}>
      <Typography
        variant="body2"
        sx={{
          color: '#6B6862',
          fontSize: '13px',
          fontWeight: 500,
          '&:hover': { color: '#E6873C' },
        }}
      >
        {courseDisplayName}
      </Typography>
    </Link>
    <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
      /
    </Typography>
    <Typography variant="body2" sx={{ color: '#1F1E1C', fontSize: '13px', fontWeight: 600 }}>
      {sectionPrefix} {title || 'New Section'}
    </Typography>
  </Box>

  {/* Main Header Row */}
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      mb: 3,
      flexWrap: 'wrap',
      gap: 2,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F1E1C', fontSize: '26px' }}>
        {sectionPrefix} · {title || 'New Section'}
      </Typography>
      <Chip
        label={course?.status || 'Draft'}
        size="small"
        sx={{
          textTransform: 'capitalize',
          backgroundColor: course?.status === 'published' ? '#DCFCE7' : '#FEF3C7',
          color: course?.status === 'published' ? '#14532D' : '#92400E',
          fontWeight: 600,
          fontSize: '11px',
          height: 24,
          borderRadius: '4px',
        }}
      />
      {course?.alias && (
        <Chip
          label={`Alias: ${course.alias}`}
          size="small"
          sx={{
            backgroundColor: '#EEEDE9',
            color: '#3D3B37',
            fontWeight: 500,
            fontSize: '11px',
            fontFamily: 'monospace',
            height: 24,
            borderRadius: '4px',
          }}
        />
      )}
    </Box>

    {/* Action Buttons: Cancel, Save (draft), Publish changes (published) */}
    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
      <Button
        variant="outlined"
        onClick={handleCancel}
        disabled={saveLoading}
        sx={{
          borderColor: '#BDB9B1',
          color: '#1F1E1C',
          backgroundColor: '#FFFFFF',
          fontWeight: 500,
          fontSize: '14px',
          textTransform: 'none',
          borderRadius: '6px',
          height: 38,
          px: 2,
          '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
        }}
      >
        Cancel
      </Button>

      <Button
        variant="outlined"
        onClick={() => handleSave('draft')}
        disabled={saveLoading}
        sx={{
          borderColor: '#BDB9B1',
          color: '#1F1E1C',
          backgroundColor: '#FFFFFF',
          fontWeight: 500,
          fontSize: '14px',
          textTransform: 'none',
          borderRadius: '6px',
          height: 38,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
        }}
      >
        {saveLoading && savingType === 'draft' && (
          <CircularProgress size={16} sx={{ color: '#1F1E1C' }} />
        )}
        Save
      </Button>

      <Button
        variant="contained"
        onClick={() => handleSave('published')}
        disabled={saveLoading}
        sx={{
          backgroundColor: '#1F1E1C',
          color: '#FFFFFF',
          fontWeight: 500,
          fontSize: '14px',
          textTransform: 'none',
          borderRadius: '6px',
          height: 38,
          px: 2.5,
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': { backgroundColor: '#000000', boxShadow: 'none' },
          '&.Mui-disabled': {
            backgroundColor: '#D6D3CC',
            color: '#8A867F',
          },
        }}
      >
        {saveLoading && savingType === 'published' && (
          <CircularProgress size={16} sx={{ color: '#FFFFFF' }} />
        )}
        Publish changes
      </Button>
    </Box>
  </Box>
  </>
);

export default function CreateSectionPage() {
  const router = useRouter();
  const { id } = router.query;
  const courseId = typeof id === 'string' ? id : '';
  // Lessons already attached to the module being edited; only newly picked ones are attached on save
  const attachedLessonIds = useRef<Set<string>>(new Set());
  const editingModuleId = typeof router.query.moduleId === 'string' ? router.query.moduleId : '';
  const basePath = router.asPath.startsWith('/courses') ? '/courses' : '/content/courses';

  const [course, setCourse] = useState<CourseHierarchy | null>(null);

  // Section Details Form
  const [title, setTitle] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [sectionPrefix, setSectionPrefix] = useState<string>('1.1');

  // Blocks in Section (Default: single intro block)
  const [blocks, setBlocks] = useState<SectionBlock[]>([
    {
      id: 'blk-intro',
      type: 'INTRO',
      text: DEFAULT_INTRO_TEXT,
    },
  ]);

  // Saving state & Notifications
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [savingType, setSavingType] = useState<'draft' | 'published' | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

  // Media Picker Dialog State (matching prototype L4b)
  const [mediaDialogOpen, setMediaDialogOpen] = useState<boolean>(false);
  const [mediaActiveTab, setMediaActiveTab] = useState<'videos' | 'pdfs' | 'images'>('videos');
  const [mediaSearchQuery, setMediaSearchQuery] = useState<string>('');
  const [targetBlockIdForMedia, setTargetBlockIdForMedia] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Content items state
  const [libraryVideos, setLibraryVideos] = useState<ContentMediaItem[]>(FALLBACK_VIDEOS);
  const [libraryPdfs, setLibraryPdfs] = useState<ContentMediaItem[]>(FALLBACK_PDFS);
  const [libraryImages] = useState<ContentMediaItem[]>(PROTOTYPE_IMAGES);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  // Load Course Hierarchy & Details
  useEffect(() => {
    if (!courseId) return;
    getCourseHierarchy(courseId)
      .then((data) =>
        applyCourseHierarchy(data, router.query.moduleId, {
          setCourse,
          setBlocks,
          setSectionPrefix,
          setTitle,
          setDuration,
          attachedLessonIds,
        })
      )
      .catch((err) => {
        console.error('Failed to load course details:', err);
      });
  }, [courseId, router.query.moduleId]);

  const fetchLessonsFromApi = useCallback(
    () => loadLibraryLessons({ setMediaLoading, setLibraryVideos, setLibraryPdfs }),
    []
  );

  useEffect(() => {
    fetchLessonsFromApi();
  }, [fetchLessonsFromApi]);

  const handleOpenMediaDialog = (tab: 'videos' | 'pdfs' | 'images', blockId?: string) => {
    setMediaActiveTab(tab);
    setTargetBlockIdForMedia(blockId || null);
    setSelectedMediaIds([]);
    setMediaSearchQuery('');
    setMediaDialogOpen(true);
    fetchLessonsFromApi();
  };

  const handleToggleMediaSelect = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const displayedItems = useMemo(() => {
    const libraries: Record<MediaTab, ContentMediaItem[]> = {
      videos: libraryVideos,
      pdfs: libraryPdfs,
      images: libraryImages,
    };
    return filterMediaItems(libraries[mediaActiveTab], mediaSearchQuery);
  }, [mediaActiveTab, libraryVideos, libraryPdfs, libraryImages, mediaSearchQuery]);

  const handleAddSelectedMedia = () => {
    if (selectedMediaIds.length === 0) return;

    const libraries: Record<MediaTab, ContentMediaItem[]> = {
      videos: libraryVideos,
      pdfs: libraryPdfs,
      images: libraryImages,
    };
    const selected = libraries[mediaActiveTab].filter((item) => selectedMediaIds.includes(item.id));
    const addToBlocks = ADD_MEDIA_TO_BLOCKS[mediaActiveTab];
    const stamp = Date.now();
    setBlocks((prev) => addToBlocks(prev, selected, targetBlockIdForMedia, stamp));

    setMediaDialogOpen(false);
    setTargetBlockIdForMedia(null);
    setSelectedMediaIds([]);
    setMediaSearchQuery('');
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = moveBlock(blocks, index, direction);
    if (newBlocks) setBlocks(newBlocks);
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleUpdateBlockText = (blockId: string, newText: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text: newText } : b)));
  };

  const handleEditVideoTitle = (blockId: string, video: VideoItem) => {
    const newTitle = prompt('Edit video title:', video.title);
    if (newTitle) {
      setBlocks(renameVideoInBlocks(blocks, blockId, video.id, newTitle));
    }
  };

  const handleRemoveVideo = (blockId: string, videoId: string) => {
    setBlocks(
      blocks.map((b) =>
        b.id === blockId ? { ...b, videos: (b.videos || []).filter((v) => v.id !== videoId) } : b
      )
    );
  };

  // Add Block functions
  const handleAddBlock = () => {
    const newBlock: SectionBlock = {
      id: `blk-${Date.now()}`,
      type: 'TEXT',
      text: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleAddBlockType = (type: SectionBlock['type']) => {
    const mediaTab = MEDIA_TAB_FOR_BLOCK_TYPE[type];
    if (mediaTab) {
      handleOpenMediaDialog(mediaTab);
      return;
    }

    const newBlock: SectionBlock = {
      id: `blk-${Date.now()}`,
      type,
      text: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!courseId) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Course ID is missing. Cannot save section.');
      return;
    }

    setSaveLoading(true);
    setSavingType(status);
    try {
      await saveSection(
        {
          courseId,
          title,
          sectionPrefix,
          blocks,
          course,
          editingModuleId,
          attachedLessonIds: attachedLessonIds.current,
          notify: (severity, message) => {
            setSnackbarSeverity(severity);
            setSnackbarMessage(message);
          },
          redirect: (delayMs) => {
            setTimeout(() => {
              router.push(`${basePath}/${courseId}`);
            }, delayMs);
          },
        },
        status
      );
    } finally {
      setSaveLoading(false);
      setSavingType(null);
    }
  };

  const handleCancel = () => {
    router.push(`${basePath}/${courseId}`);
  };

  const courseDisplayName = course?.title || course?.name || 'Selected Course';
  const language = course?.detectedLanguage || 'English';

  const selectedCount = selectedMediaIds.length;

  return (
    <Box sx={{ py: 1, backgroundColor: '#F4F3EF', minHeight: 'calc(100vh - 120px)', m: -2, p: 3 }}>
      <SectionHeader
        basePath={basePath}
        courseId={courseId}
        course={course}
        courseDisplayName={courseDisplayName}
        sectionPrefix={sectionPrefix}
        title={title}
        saveLoading={saveLoading}
        savingType={savingType}
        handleSave={handleSave}
        handleCancel={handleCancel}
      />

      {/* 2-Column Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Learning Content (2/3 width) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C', mb: 0.5 }}>
              Learning content
            </Typography>

            {/* Blocks List */}
            {blocks.map((block, index) => (
              <BlockCard
                key={block.id}
                block={block}
                index={index}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                handleOpenMediaDialog={handleOpenMediaDialog}
                handleMoveBlock={handleMoveBlock}
                handleRemoveBlock={handleRemoveBlock}
                handleUpdateBlockText={handleUpdateBlockText}
                handleEditVideoTitle={handleEditVideoTitle}
                handleRemoveVideo={handleRemoveVideo}
              />
            ))}

            {/* Bottom + Add Block Bar with Menu (Toolbar formatted as per user's edit) */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                pl: { xs: 0, sm: 5 },
                mt: 1,
                flexWrap: 'wrap',
              }}
            >
              {/* Inline Block Type Selection Toolbar */}
              <Paper
                elevation={1}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  p: '5px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #BDB9B1',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(31,30,28,0.08)',
                  whiteSpace: 'nowrap',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleAddBlock}
                  sx={{
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 500,
                    fontSize: '13px',
                    textTransform: 'none',
                    borderRadius: '6px',
                    height: 34,
                    px: 1.8,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: 'max-content',
                    '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#F9F9F8' },
                  }}
                >
                  + Add block
                </Button>
                {BLOCK_TYPE_BUTTONS.map(([type, label]) => (
                  <BlockTypeButton key={type} label={label} onClick={() => handleAddBlockType(type)} />
                ))}

                {/* Optional Divider */}
                {/* <Box sx={{ width: 1, height: 18, backgroundColor: '#D6D3CC', mx: 0.5, flexShrink: 0 }} /> */}

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenMediaDialog('videos')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1.2,
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content',
                    flexShrink: 0,
                    '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#FAF9F6' },
                  }}
                >
                  + Video
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenMediaDialog('pdfs')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1.2,
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content',
                    flexShrink: 0,
                    '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#FAF9F6' },
                  }}
                >
                  + PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenMediaDialog('images')}
                  sx={{
                    height: 28,
                    fontSize: '12px',
                    borderColor: '#BDB9B1',
                    color: '#1F1E1C',
                    backgroundColor: '#FFFFFF',
                    textTransform: 'none',
                    py: 0,
                    px: 1.2,
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content',
                    flexShrink: 0,
                    '&:hover': { borderColor: '#1F1E1C', backgroundColor: '#FAF9F6' },
                  }}
                >
                  + Image
                </Button>
              </Paper>
            </Box>
          </Box>
        </Grid>

        {/* Right Column: Section details & Real Selected Course Details (1/3 width) */}
        <SectionSidebar
          course={course}
          courseId={courseId}
          title={title}
          setTitle={setTitle}
          duration={duration}
          setDuration={setDuration}
          sectionPrefix={sectionPrefix}
          courseDisplayName={courseDisplayName}
          language={language}
        />
      </Grid>

      {/* Prototype-Accurate Media Picker Dialog (L4b - Add from content library) */}
      <MediaPickerDialog
        title={title}
        sectionPrefix={sectionPrefix}
        mediaDialogOpen={mediaDialogOpen}
        setMediaDialogOpen={setMediaDialogOpen}
        mediaActiveTab={mediaActiveTab}
        setMediaActiveTab={setMediaActiveTab}
        mediaSearchQuery={mediaSearchQuery}
        setMediaSearchQuery={setMediaSearchQuery}
        selectedMediaIds={selectedMediaIds}
        setSelectedMediaIds={setSelectedMediaIds}
        libraryVideos={libraryVideos}
        libraryPdfs={libraryPdfs}
        mediaLoading={mediaLoading}
        handleToggleMediaSelect={handleToggleMediaSelect}
        displayedItems={displayedItems}
        handleAddSelectedMedia={handleAddSelectedMedia}
        selectedCount={selectedCount}
      />

      {/* Snackbar notification */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: '100%', boxShadow: 3 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any, ['en', 'mr', 'hi'])),
    },
  };
};

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
