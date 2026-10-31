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
  parseCourseName,
  getLmsLessons,
  LessonItem,
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

// Curated fallback video lessons matching the Aspire LMS API & prototype
const FALLBACK_VIDEOS: ContentMediaItem[] = [
  {
    id: '2e4bff91-8351-4a6f-b78d-cc25f6103377',
    title: 'video',
    duration: '10 min · Video link',
    url: 'https://youtu.be/nlhO51MZtuk',
    source: 'youtube.url',
  },
  {
    id: 'vid-proto-1',
    title: 'Life Cycle Needs | Episode 3 | Budgeting – Anita Ki Diary Ka Raaz',
    duration: '1:43',
    url: 'https://www.youtube.com/watch?v=EUPk_ThuWXI',
    source: 'YouTube',
  },
  {
    id: 'vid-proto-2',
    title: 'Understanding money in daily life',
    duration: '[—]',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    source: 'Library',
  },
  {
    id: 'vid-proto-3',
    title: 'Lifecycle Needs',
    duration: '6:50',
    url: 'https://www.youtube.com/watch?v=EUPk_ThuWXI',
    source: 'Library',
  },
  {
    id: 'vid-proto-4',
    title: 'Swadhaar FinAccess Product Camp',
    duration: '1:07',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    source: 'Library',
  },
  {
    id: 'vid-proto-5',
    title: '1.1 Introduction to Financial Planning & Family Needs',
    duration: '3:45',
    url: 'https://www.youtube.com/watch?v=EUPk_ThuWXI',
    source: 'YouTube',
  },
  {
    id: 'vid-proto-6',
    title: 'Emergency Savings Fund & Daily Banking',
    duration: '4:20',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    source: 'Library',
  },
];

// Curated fallback PDF guides matching the Aspire LMS API & prototype
const FALLBACK_PDFS: ContentMediaItem[] = [
  {
    id: '080e3855-65f4-41ab-8b6e-cdd69f1b0bb1',
    title: 'PDF Testing 19th Jan',
    duration: 'PDF Guide',
    url: 'https://aspire-leaders-assets-qa.s3.us-east-1.amazonaws.com/lms/lessons/file_1768806247619_5ccd8c.pdf',
    source: 'pdf',
  },
  {
    id: 'pdf-proto-1',
    title: 'Swadhaar Household Budgeting Workbook',
    duration: '6 pages',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    source: 'PDF Guide',
  },
  {
    id: 'pdf-proto-2',
    title: 'Financial Goals & Life Cycle Roadmap Worksheet',
    duration: '4 pages',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    source: 'PDF Worksheet',
  },
  {
    id: 'pdf-proto-3',
    title: 'Learner Handbook: Savings, Accounts & Security',
    duration: '12 pages',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    source: 'PDF Handbook',
  },
  {
    id: 'pdf-proto-4',
    title: 'Daily Expense Tracker & Savings Log',
    duration: '2 pages',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    source: 'PDF Log',
  },
];

// Helper to determine if an LMS lesson is a video
const isVideoLesson = (l: any): boolean => {
  const format = String(l.format || '').toLowerCase();
  const subFormat = String(l.subFormat || '').toLowerCase();
  const mediaFormat = String(l.media?.format || '').toLowerCase();
  const mediaSubFormat = String(l.media?.subFormat || '').toLowerCase();
  const source = String(l.media?.source || l.media?.path || '').toLowerCase();

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
  const format = String(l.format || '').toLowerCase();
  const subFormat = String(l.subFormat || '').toLowerCase();
  const mediaFormat = String(l.media?.format || '').toLowerCase();
  const mediaSubFormat = String(l.media?.subFormat || '').toLowerCase();
  const source = String(l.media?.source || l.media?.path || '').toLowerCase();

  return (
    format === 'document' ||
    format === 'pdf' ||
    subFormat === 'pdf' ||
    mediaFormat === 'document' ||
    mediaFormat === 'pdf' ||
    mediaSubFormat === 'pdf' ||
    source.endsWith('.pdf') ||
    source.includes('.pdf?') ||
    (l.title && l.title.toLowerCase().includes('.pdf'))
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
      text: 'Now that you understand how financial planning helps households prepare for different needs and goals, the next step is to understand how families can manage their available income and expenses.',
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
      .then((data) => {
        setCourse(data);
        const rawModules = data.modules || [];

        // If hierarchy modules is empty (e.g. modules: []), show ONLY ONE block default
        if (!rawModules || rawModules.length === 0) {
          setBlocks([
            {
              id: 'blk-intro',
              type: 'INTRO',
              text: 'Now that you understand how financial planning helps households prepare for different needs and goals, the next step is to understand how families can manage their available income and expenses.',
            },
          ]);
          setSectionPrefix('1.1');
          setTitle('');
          setDuration('');
        } else {
          // If hierarchy has data, show blocks as per their type
          const targetModule = router.query.moduleId
            ? rawModules.find((m: any) => m.moduleId === router.query.moduleId || m.id === router.query.moduleId)
            : null;

          if (router.query.moduleId && targetModule) {
            setTitle(targetModule.title || '');
            setDuration(targetModule.duration ? String(targetModule.duration) : '');
            setSectionPrefix(`1.${targetModule.ordering || 1}`);

            const lessons = targetModule.lessons || [];
            attachedLessonIds.current = new Set(lessons.map((l: any) => l.lessonId).filter(Boolean));
            if (lessons.length > 0) {
              const mappedBlocks: SectionBlock[] = lessons.map((l: any, lIdx: number) => {
                const fmt = (l.format || l.primaryCategory || '').toLowerCase();
                if (fmt.includes('video')) {
                  return {
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
                  };
                }
                if (fmt.includes('pdf')) {
                  return {
                    id: l.lessonId || `blk-pdf-${lIdx}-${Date.now()}`,
                    lessonId: l.lessonId,
                    type: 'PDF',
                    mediaName: l.title || 'PDF Document',
                    mediaUrl: resolveMediaUrl(l.media?.path || l.media?.source || l.media?.url || l.mediaUrl || l.downloadUrl || ''),
                    text: l.description || '',
                  };
                }
                if (fmt.includes('image')) {
                  return {
                    id: l.lessonId || `blk-img-${lIdx}-${Date.now()}`,
                    type: 'IMAGE',
                    mediaName: l.title || 'Image Illustration',
                    mediaUrl: l.media?.url || l.mediaUrl || l.downloadUrl || '',
                    text: l.description || '',
                  };
                }
                if (fmt.includes('hook')) {
                  return {
                    id: l.lessonId || `blk-hook-${lIdx}-${Date.now()}`,
                    type: 'HOOK',
                    text: l.description || l.title || '',
                  };
                }
                if (fmt.includes('concept')) {
                  return {
                    id: l.lessonId || `blk-concept-${lIdx}-${Date.now()}`,
                    type: 'CONCEPT',
                    text: l.description || l.title || '',
                  };
                }
                if (fmt.includes('analysis')) {
                  return {
                    id: l.lessonId || `blk-analysis-${lIdx}-${Date.now()}`,
                    type: 'ANALYSIS',
                    text: l.description || l.title || '',
                  };
                }
                if (fmt.includes('intro')) {
                  return {
                    id: l.lessonId || `blk-intro-${lIdx}-${Date.now()}`,
                    type: 'INTRO',
                    text: l.description || l.title || '',
                  };
                }
                return {
                  id: l.lessonId || `blk-txt-${lIdx}-${Date.now()}`,
                  type: 'TEXT',
                  text: l.description || l.title || '',
                };
              });
              setBlocks(mappedBlocks);
            }
          } else {
            // New Section under existing course: compute next section index
            setSectionPrefix(`1.${rawModules.length + 1}`);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
      });
  }, [courseId, router.query.moduleId]);

  // Load Video and PDF lessons from the Aspire LMS Lessons API
  // curl 'https://middleware-qa.aspireleaders.org/lms-service/v1/lessons?status=published&offset=0&limit=20'
  const fetchLessonsFromApi = useCallback(async () => {
    try {
      setMediaLoading(true);
      const res = await getLmsLessons({ status: 'published', offset: 0, limit: 100 });
      const lessons = res.lessons || [];

      if (lessons.length > 0) {
        // Filter videos from API
        const apiVideos: ContentMediaItem[] = lessons
          .filter((l) => isVideoLesson(l))
          .map((l) => {
            const rawDuration = l.idealTime ? `${l.idealTime} min` : (l.duration ? String(l.duration) : '[—]');
            const videoUrl = l.media?.source || l.media?.path || 'https://www.youtube.com/watch?v=EUPk_ThuWXI';
            return {
              id: l.lessonId,
              title: l.title || 'Video Lesson',
              duration: rawDuration,
              url: videoUrl,
              source: l.subFormat || 'LMS Video',
            };
          });

        // Filter PDFs from API
        const apiPdfs: ContentMediaItem[] = lessons
          .filter((l) => isPdfLesson(l))
          .map((l) => {
            const pdfUrl = l.media?.source || l.media?.path || '';
            const rawDuration = l.idealTime ? `${l.idealTime} min read` : 'PDF Guide';
            return {
              id: l.lessonId,
              title: l.title || 'PDF Document',
              duration: rawDuration,
              url: pdfUrl,
              source: l.subFormat || 'PDF',
            };
          });

        if (apiVideos.length > 0) {
          const combinedVideos = [
            ...apiVideos,
            ...FALLBACK_VIDEOS.filter((fb) => !apiVideos.some((v) => v.id === fb.id || v.title === fb.title)),
          ];
          setLibraryVideos(combinedVideos);
        }

        if (apiPdfs.length > 0) {
          const combinedPdfs = [
            ...apiPdfs,
            ...FALLBACK_PDFS.filter((fb) => !apiPdfs.some((p) => p.id === fb.id || p.title === fb.title)),
          ];
          setLibraryPdfs(combinedPdfs);
        }
      }
    } catch (err) {
      console.error('Failed to load lessons from API:', err);
    } finally {
      setMediaLoading(false);
    }
  }, []);

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
    let list: ContentMediaItem[] = [];
    if (mediaActiveTab === 'videos') {
      list = libraryVideos;
    } else if (mediaActiveTab === 'pdfs') {
      list = libraryPdfs;
    } else {
      list = libraryImages;
    }

    if (!mediaSearchQuery.trim()) return list;
    const q = mediaSearchQuery.toLowerCase();
    return list.filter((item) => item.title.toLowerCase().includes(q));
  }, [mediaActiveTab, libraryVideos, libraryPdfs, libraryImages, mediaSearchQuery]);

  const handleAddSelectedMedia = () => {
    if (selectedMediaIds.length === 0) return;

    if (mediaActiveTab === 'videos') {
      const selectedVideos = libraryVideos.filter((v) => selectedMediaIds.includes(v.id));
      const newVideoItems: VideoItem[] = selectedVideos.map((v) => ({
        id: `vid-${Date.now()}-${v.id}`,
        lessonId: v.id,
        title: v.title,
        duration: v.duration.includes('link') ? v.duration : `${v.duration} · Video link`,
        sourceUrl: v.url,
      }));

      if (targetBlockIdForMedia) {
        // Append to the specific VIDEO WATCH block
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === targetBlockIdForMedia
              ? { ...b, videos: [...(b.videos || []), ...newVideoItems] }
              : b
          )
        );
      } else {
        // Insert a new VIDEO WATCH block
        const newBlock: SectionBlock = {
          id: `blk-${Date.now()}`,
          type: 'VIDEO WATCH',
          videos: newVideoItems,
        };
        setBlocks((prev) => [...prev, newBlock]);
      }
    } else if (mediaActiveTab === 'pdfs') {
      const selectedPdfs = libraryPdfs.filter((p) => selectedMediaIds.includes(p.id));

      if (targetBlockIdForMedia) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === targetBlockIdForMedia
              ? {
                  ...b,
                  mediaName: selectedPdfs[0]?.title || b.mediaName,
                  mediaUrl: selectedPdfs[0]?.url || b.mediaUrl,
                }
              : b
          )
        );
      } else {
        const newPdfBlocks: SectionBlock[] = selectedPdfs.map((p, idx) => ({
          id: `blk-pdf-${Date.now()}-${idx}`,
          lessonId: p.id,
          type: 'PDF',
          mediaName: p.title,
          mediaUrl: p.url,
          text: '',
        }));
        setBlocks((prev) => [...prev, ...newPdfBlocks]);
      }
    } else {
      // Images
      const selectedImages = libraryImages.filter((img) => selectedMediaIds.includes(img.id));
      if (targetBlockIdForMedia) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === targetBlockIdForMedia
              ? {
                  ...b,
                  mediaName: selectedImages[0]?.title || b.mediaName,
                  mediaUrl: selectedImages[0]?.url || b.mediaUrl,
                }
              : b
          )
        );
      } else {
        const newImgBlocks: SectionBlock[] = selectedImages.map((img, idx) => ({
          id: `blk-img-${Date.now()}-${idx}`,
          type: 'IMAGE',
          mediaName: img.title,
          mediaUrl: img.url,
          text: '',
        }));
        setBlocks((prev) => [...prev, ...newImgBlocks]);
      }
    }

    setMediaDialogOpen(false);
    setTargetBlockIdForMedia(null);
    setSelectedMediaIds([]);
    setMediaSearchQuery('');
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
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
    if (type === 'VIDEO WATCH') {
      handleOpenMediaDialog('videos');
      return;
    }
    if (type === 'PDF') {
      handleOpenMediaDialog('pdfs');
      return;
    }
    if (type === 'IMAGE') {
      handleOpenMediaDialog('images');
      return;
    }

    const newBlock: SectionBlock = {
      id: `blk-${Date.now()}`,
      type,
      text: '',
    };
    setBlocks([...blocks, newBlock]);
  };

  // API Integration: Save section / module via POST /lms-service/v1/modules
  const handleSave = async (status: 'draft' | 'published') => {
    const effectiveTitle = title.trim() || `${sectionPrefix} Section`;

    if (!courseId) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Course ID is missing. Cannot save section.');
      return;
    }

    setSaveLoading(true);
    setSavingType(status);
    try {
      // Generate clean alias matching title (preserving user-specified slugs or suffixing if generic)
      const cleanSlug = effectiveTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'module';
      const alias = /\d+$/.test(cleanSlug) ? cleanSlug : `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}`;

      // Description from first block text or title
      const firstBlockText = blocks[0]?.text?.trim();
      const descHtml = firstBlockText ? `<p>${firstBlockText}</p>` : `<p>${effectiveTitle}</p>`;

      // Compute numeric ordering from section prefix (e.g. "1.2" -> 2)
      const prefixParts = sectionPrefix.split('.');
      const parsedOrder = prefixParts.length > 1 ? parseInt(prefixParts[1], 10) : parseInt(sectionPrefix, 10);
      const ordering = !isNaN(parsedOrder) && parsedOrder > 0
        ? parsedOrder
        : ((course?.modules?.length || 0) + 1);

      // Dates formatted as YYYY-MM-DDT00:00:00Z matching Aspire LMS standard
      const now = new Date();
      const startDatetime = `${now.toISOString().split('T')[0]}T00:00:00Z`;
      const endDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
      const endDatetime = `${endDate.toISOString().split('T')[0]}T00:00:00Z`;

      const payload: CreateModulePayload = {
        title: effectiveTitle,
        alias,
        courseId,
        description: descHtml,
        image: '/uploads/module/default.png',
        ordering,
        status, // 'draft' when user clicks Save, 'published' when user clicks Publish changes
        startDatetime,
        endDatetime,
      };

      // Editing updates the module (PATCH); a new section creates it (POST). Draft and publish use the same call.
      let moduleId: string;
      if (editingModuleId) {
        await updateModule(editingModuleId, {
          title: effectiveTitle,
          description: descHtml,
          ordering,
          status,
        });
        moduleId = editingModuleId;
      } else {
        const res = await createModule(payload);
        moduleId = res?.result?.moduleId || `mod-${Date.now()}`;
      }

      // Put the picked videos and PDFs into the module: PATCH /lms-service/v1/lessons/:id { courseId, moduleId }
      const lessonIds = blocks
        .flatMap((b) => (b.type === 'VIDEO WATCH' ? (b.videos || []).map((v) => v.lessonId) : [b.lessonId]))
        .filter((lessonId): lessonId is string => Boolean(lessonId) && !attachedLessonIds.current.has(lessonId as string));
      const attachResults = await Promise.allSettled(
        lessonIds.map((lessonId, idx) => updateLmsLesson(lessonId, { courseId, moduleId, ordering: idx + 1 }))
      );
      const failedAttach = attachResults.filter((r) => r.status === 'rejected').length;

      // Persist module to localStorage so it is immediately visible in Course Details page
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `swadhaar_custom_modules_${courseId}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const newModule = {
            moduleId,
            identifier: moduleId,
            name: effectiveTitle,
            title: effectiveTitle,
            description: descHtml,
            ordering,
            status,
            children: blocks.flatMap((b) => {
              if (b.type === 'VIDEO WATCH' && b.videos?.length) {
                return b.videos.map((v, i) => ({
                  identifier: v.id || `vid-${i}`,
                  lessonId: v.id || `vid-${i}`,
                  name: v.title || 'Video Lesson',
                  primaryCategory: 'Course Unit',
                  format: 'video',
                  status,
                  idealTime: parseInt(v.duration) || 5,
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
            }),
          };
          localStorage.setItem(storageKey, JSON.stringify([...existing, newModule]));
        } catch {
          // ignore localStorage error
        }
      }

      setSnackbarSeverity(failedAttach > 0 ? 'error' : 'success');
      setSnackbarMessage(
        failedAttach > 0
          ? `Section "${effectiveTitle}" saved, but ${failedAttach} lesson(s) could not be added to it.`
          : status === 'draft'
            ? `Section "${effectiveTitle}" saved as draft successfully!`
            : `Section "${effectiveTitle}" published successfully!`
      );
      setTimeout(() => {
        router.push(`${basePath}/${courseId}`);
      }, 1200);
    } catch (err: any) {
      console.error('Error in handleSave:', err);

      // Graceful offline/token-fallback: preserve section in local state so changes reflect immediately
      if (typeof window !== 'undefined') {
        try {
          const storageKey = `swadhaar_custom_modules_${courseId}`;
          const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const newModule = {
            moduleId: `mod-${Date.now()}`,
            identifier: `mod-${Date.now()}`,
            name: effectiveTitle,
            title: effectiveTitle,
            description: `<p>${effectiveTitle}</p>`,
            ordering: ((course?.modules?.length || 0) + 1),
            status,
            children: [],
          };
          localStorage.setItem(storageKey, JSON.stringify([...existing, newModule]));
        } catch {
          // ignore
        }
      }

      const errorMsg =
        err?.response?.data?.params?.errmsg ||
        err?.response?.data?.params?.err ||
        err?.message ||
        'Failed to save section.';
      setSnackbarSeverity(err?.response?.status === 401 ? 'info' : 'error');
      setSnackbarMessage(
        err?.response?.status === 401
          ? `Section saved locally as ${status} (API token expired on QA server).`
          : errorMsg
      );
      setTimeout(() => {
        router.push(`${basePath}/${courseId}`);
      }, 1500);
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

  const getBadgeStyle = (type: SectionBlock['type']) => {
    switch (type) {
      case 'INTRO':
        return { backgroundColor: '#EEEDE9', color: '#3D3B37' };
      case 'HOOK':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'CONCEPT':
        return { backgroundColor: '#E0E7FF', color: '#3730A3' };
      case 'ANALYSIS':
        return { backgroundColor: '#F3E8FF', color: '#6B21A8' };
      case 'VIDEO WATCH':
        return { backgroundColor: '#FCE7F3', color: '#9D174D' };
      case 'PDF':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'IMAGE':
        return { backgroundColor: '#E0F2FE', color: '#075985' };
      case 'TEXT':
      default:
        return { backgroundColor: '#F4F4F5', color: '#27272A' };
    }
  };

  const getPlaceholder = (type: SectionBlock['type']) => {
    switch (type) {
      case 'INTRO':
        return 'Enter section introduction and overview for learners...';
      case 'HOOK':
        return 'Hook: Pose an intriguing question, real-life problem, or engaging scenario...';
      case 'CONCEPT':
        return 'Concept: Clearly explain the core financial principle or concept...';
      case 'ANALYSIS':
        return 'Analysis: Provide breakdown of numbers, comparisons, or practical case study...';
      case 'TEXT':
      default:
        return 'Enter text content here...';
    }
  };

  const selectedCount = selectedMediaIds.length;

  return (
    <Box sx={{ py: 1, backgroundColor: '#F4F3EF', minHeight: 'calc(100vh - 120px)', m: -2, p: 3 }}>
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

      {/* 2-Column Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Learning Content (2/3 width) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C', mb: 0.5 }}>
              Learning content
            </Typography>

            {/* Blocks List */}
            {blocks.map((block, index) => {
              const isFirst = index === 0;
              const isLast = index === blocks.length - 1;
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
                    {block.type === 'VIDEO WATCH' ? (
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
                    ) : block.type === 'PDF' ? (
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

                        <TextField
                          multiline
                          rows={2}
                          fullWidth
                          placeholder="Optional notes, instructions, or reading tasks for this PDF..."
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
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
                      </Box>
                    ) : block.type === 'IMAGE' ? (
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

                        <TextField
                          multiline
                          rows={2}
                          fullWidth
                          placeholder="Optional caption, image explanation, or key takeaway..."
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
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
                      </Box>
                    ) : (
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

                        <TextField
                          multiline
                          rows={2}
                          fullWidth
                          placeholder={getPlaceholder(block.type)}
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlockText(block.id, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '0 0 6px 6px',
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
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}

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
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('TEXT')}
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
                  Text
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('HOOK')}
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
                  Hook
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('CONCEPT')}
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
                  Concept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddBlockType('ANALYSIS')}
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
                  Analysis
                </Button>

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
                    Title *
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
                    type="number"
                    placeholder="e.g. 21"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': { borderColor: '#BDB9B1' },
                        '&:hover fieldset': { borderColor: '#1F1E1C' },
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
                    Estimated completion duration
                  </Typography>
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
                    value={course?.title ? `${course.title}${course.alias ? ` (${course.alias})` : ''}` : 'Loading course...'}
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
                      {course.description.replace(/<[^>]*>/g, '').trim()}
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
      </Grid>

      {/* Prototype-Accurate Media Picker Dialog (L4b - Add from content library) */}
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
              Add {mediaActiveTab === 'videos' ? 'Videos' : mediaActiveTab === 'pdfs' ? 'PDFs' : 'Media'} to {sectionPrefix} {title || 'Section'}
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
            <Button
              component={Link}
              href="/content/create-video"
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
              + Create new video
            </Button>
            <Button
              component={Link}
              href="/content/create-pdf"
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
              + Create new PDF
            </Button>
          </Box>
        </Box>

        {/* Content Body: Search input + Checkbox List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, padding: '16px 24px' }}>
          <TextField
            id="scr-pickmedia-pm-q"
            fullWidth
            size="small"
            placeholder={
              mediaActiveTab === 'videos'
                ? 'Search published video lessons...'
                : mediaActiveTab === 'pdfs'
                ? 'Search published PDF documents...'
                : 'Search the content library...'
            }
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
              displayedItems.map((item, idx) => {
                const isChecked = selectedMediaIds.includes(item.id);
                const isLast = idx === displayedItems.length - 1;

                return (
                  <Box
                    key={item.id}
                    component="label"
                    onClick={() => handleToggleMediaSelect(item.id)}
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
              })
            )}
          </Box>

          {/* Hint Line */}
          <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
            Selected: {selectedCount} · added to the {mediaActiveTab === 'videos' ? 'Video Watch' : mediaActiveTab === 'pdfs' ? 'PDF' : 'Image'} block in this order
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
            {mediaActiveTab === 'videos'
              ? selectedCount === 0
                ? 'Add videos'
                : `Add ${selectedCount} ${selectedCount === 1 ? 'video' : 'videos'}`
              : mediaActiveTab === 'pdfs'
              ? selectedCount === 0
                ? 'Add PDFs'
                : `Add ${selectedCount} ${selectedCount === 1 ? 'PDF' : 'PDFs'}`
              : selectedCount === 0
              ? 'Add images'
              : `Add ${selectedCount} ${selectedCount === 1 ? 'image' : 'images'}`}
          </Button>
        </Box>
      </Dialog>

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
