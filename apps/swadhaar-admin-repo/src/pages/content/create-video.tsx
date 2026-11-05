import { resolveMediaUrl } from '@/utils/API/APIEndpoints';
import { isValidMinutes, sanitizeMinutes, MINUTES_ERROR, MINUTES_MAX_DIGITS } from '@/utils/minutesInput';
import { sanitizeRichHtml } from '@/components/content/RichTextField';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Radio,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { inferCourseUsage } from '@/services/ContentLibraryService';
import {
  detectLanguage,
  createVideoLesson,
  uploadLessonMedia,
  getLmsLessonById,
  updateLmsLesson,
} from '@/services/CourseService';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';
import useUsedInQuery from '@/hooks/useUsedInQuery';
import { ContentFormHeader, FormAlerts, FormCardHeader, DescriptionField, LanguageSelect, UsedInCard, CARD_SX, LabeledTextField } from '@/components/content/ContentFormParts';

interface SourceOptionProps {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
}

const SourceOption: React.FC<SourceOptionProps> = ({ selected, onSelect, title, subtitle }) => (
  <Paper
    onClick={onSelect}
    elevation={0}
    sx={{
      p: 2,
      cursor: 'pointer',
      border: selected ? '2px solid #1F1E1C' : '1px solid #BDB9B1',
      backgroundColor: selected ? '#FAF9F6' : '#FFFFFF',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.2,
      transition: 'all 0.2s',
    }}
  >
    <Radio checked={selected} sx={{ p: 0, '&.Mui-checked': { color: '#1F1E1C' } }} />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>{title}</Typography>
      <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>{subtitle}</Typography>
    </Box>
  </Paper>
);

const toLanguageOption = (language: string): 'Hindi' | 'English' => (language === 'Hindi' ? 'Hindi' : 'English');

/** "45 min" -> 45, "1:43" -> 2 (rounded up); undefined when the text has no number */
const parseIdealMinutes = (value: string): number | undefined => {
  const text = value.trim();
  const clock = /^(\d+):(\d{1,2})$/.exec(text);
  if (clock) return Number(clock[1]) + (Number(clock[2]) > 0 ? 1 : 0);
  const minutes = /^(\d+)/.exec(text);
  return minutes ? Number(minutes[1]) : undefined;
};

// The description editor produces HTML; a plain-text value is wrapped in a paragraph
const toDescriptionHtml = (html: string): string => {
  const value = html.trim();
  if (!value) return '';
  return value.startsWith('<') ? value : `<p>${value}</p>`;
};

const parseHttpUrl = (value: string): URL | null => {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

const isYoutubeHost = (hostname: string): boolean => /(^|\.)(youtube\.com|youtu\.be)$/i.test(hostname);

const isYoutubeUrl = (value: string): boolean => {
  const url = parseHttpUrl(value);
  return Boolean(url && isYoutubeHost(url.hostname));
};

/** Id of the video in a YouTube link: watch?v=, youtu.be/, /embed/, /shorts/ or /live/ */
const getYoutubeVideoId = (value: string): string => {
  const url = parseHttpUrl(value);
  if (!url || !isYoutubeHost(url.hostname)) return '';
  if (/(^|\.)youtu\.be$/i.test(url.hostname)) return url.pathname.split('/')[1] || '';
  const fromPath = /^\/(embed|shorts|live)\/([\w-]+)/.exec(url.pathname);
  return fromPath ? fromPath[2] : url.searchParams.get('v') || '';
};

/** Message for a Video URL that cannot be used, or '' when it is empty or fine */
const getVideoUrlError = (value: string): string => {
  const v = value.trim();
  if (!v) return '';
  if (/\s/.test(v)) return 'The link cannot contain spaces.';
  const url = parseHttpUrl(v);
  if (!url?.hostname.includes('.')) {
    return 'Enter a valid link starting with http:// or https://, for example https://www.youtube.com/watch?v=…';
  }
  if (isYoutubeHost(url.hostname) && !getYoutubeVideoId(v)) {
    return 'This YouTube link does not point to a video. Use a link like https://www.youtube.com/watch?v=…';
  }
  return '';
};

/** Optional courseId / moduleId from the route query, only when they are non-empty strings */
const getCourseTarget = (query: Record<string, unknown>) => {
  const { courseId, moduleId } = query;
  return {
    ...(typeof courseId === 'string' && courseId ? { courseId } : {}),
    ...(typeof moduleId === 'string' && moduleId ? { moduleId } : {}),
  };
};

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|mkv|avi|ogv)$/i;

/** Only video files can be uploaded: by MIME type (or extension when the browser gives none), up to 500MB */
const getVideoFileError = (file: File): string | null => {
  const isVideo = file.type ? file.type.startsWith('video/') : VIDEO_EXTENSIONS.test(file.name);
  if (!isVideo) return 'Only video files can be uploaded (MP4, WebM, MOV…). Please choose a video file.';
  if (file.size > MAX_VIDEO_BYTES) return 'The video is larger than 500MB. Please choose a smaller file.';
  return null;
};

const getValidationError = (
  title: string,
  sourceType: 'link' | 'upload',
  videoUrl: string,
  videoFile: File | null
): string | null => {
  if (!title.trim()) return 'Video title is required.';
  if (sourceType === 'link' && !videoUrl.trim()) return 'Video URL is required.';
  if (sourceType === 'link' && getVideoUrlError(videoUrl)) return getVideoUrlError(videoUrl);
  if (sourceType === 'upload' && !videoFile && !videoUrl.trim()) return 'Please choose a video file to upload.';
  return null;
};

const detectSourceType = (url: string): 'link' | 'upload' =>
  url.includes('youtube') || url.includes('youtu.be') || url.startsWith('http') ? 'link' : 'upload';

export default function CreateVideoPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [language, setLanguage] = useState('');
  const [sourceType, setSourceType] = useState<'link' | 'upload'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [usedIn, setUsedIn] = useState<string>((router.query.usedIn as string) || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    duration: string;
    language: string;
    videoUrl: string;
    sourceType: string;
  } | null>(null);

  // Navigation guard against unsaved changes
  const isDirty = Boolean(
    !successMsg &&
    !loading &&
    (isEditing && initialData
      ? title !== initialData.title ||
      description !== initialData.description ||
      duration !== initialData.duration ||
      language !== initialData.language ||
      videoUrl !== initialData.videoUrl ||
      sourceType !== initialData.sourceType
      : title.trim() || videoUrl.trim())
  );
  useUnsavedChangesGuard(
    isDirty,
    'You have unsaved changes to this video. Are you sure you want to leave this page?'
  );

  useUsedInQuery(setUsedIn);

  // Load existing video details if editing
  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      getLmsLessonById(id)
        .then((lesson: any) => {
          if (lesson) {
            const loadedTitle = lesson.title || '';
            const loadedDesc = sanitizeRichHtml(lesson.description || '');
            const loadedUrl = lesson.media?.source || lesson.media?.path || '';
            const loadedDur = lesson.idealTime ? String(lesson.idealTime) : '';
            const loadedLang = detectLanguage(loadedTitle, lesson.language ?? lesson.params?.language);
            const loadedSrc = detectSourceType(loadedUrl);
            const courseUsage =
              (router.query.usedIn as string) || inferCourseUsage({ usedIn: lesson.courseTitle });

            setTitle(loadedTitle);
            setDescription(loadedDesc);
            setVideoUrl(loadedUrl);
            setDuration(loadedDur);
            setLanguage(toLanguageOption(loadedLang));
            setSourceType(loadedSrc);
            setUsedIn(courseUsage);

            setInitialData({
              title: loadedTitle,
              description: loadedDesc,
              duration: loadedDur,
              language: toLanguageOption(loadedLang),
              videoUrl: loadedUrl,
              sourceType: loadedSrc,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load video details:', err);
          setError('Failed to load video details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, router.query.usedIn]);

  const updateExistingVideo = async (lessonId: string, isDraft: boolean, mediaContentSubFormat: string, source: string) => {
    await updateLmsLesson(lessonId, {
      title: title.trim(),
      description: toDescriptionHtml(description),
      status: isDraft ? 'unpublished' : 'published',
      mediaContentSource: source,
      mediaContentSubFormat,
      idealTime: parseIdealMinutes(duration),
    });
    setSuccessMsg('Video updated successfully.');
  };

  const createNewVideo = async (isDraft: boolean, mediaContentSubFormat: string, source: string) => {
    await createVideoLesson({
      title: title.trim(),
      description: toDescriptionHtml(description) || undefined,
      status: isDraft ? 'unpublished' : 'published',
      mediaContentSource: source,
      mediaContentSubFormat,
      idealTime: parseIdealMinutes(duration),
      ...getCourseTarget(router.query),
    });
    setSuccessMsg(isDraft ? `Video saved as draft.` : `Video created successfully.`);
  };

  // Title, language and a video source (link or chosen file) are mandatory
  let previewKind: 'youtube' | 'file' | 'none' = 'none';
  if (isYoutubeUrl(videoUrl) && getYoutubeVideoId(videoUrl)) previewKind = 'youtube';
  else if (videoUrl.trim() && !getVideoUrlError(videoUrl)) previewKind = 'file';
  const videoUrlError = sourceType === 'link' ? getVideoUrlError(videoUrl) : '';
  const durationError = isValidMinutes(duration) ? '' : MINUTES_ERROR;
  const canSave =
    !durationError &&
    !videoUrlError &&
    Boolean(title.trim()) &&
    Boolean(language) &&
    (sourceType === 'link' ? Boolean(videoUrl.trim()) : Boolean(videoFile || videoUrl.trim()));

  const handleSave = async (isDraft = false) => {
    if (!language) {
      setError('Language is required.');
      return;
    }
    const validationError = getValidationError(title, sourceType, videoUrl, videoFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // A chosen file is uploaded first and the lesson then points at the stored file
      let source = videoUrl.trim();
      if (sourceType === 'upload' && videoFile) {
        const { path } = await uploadLessonMedia(videoFile, 'video');
        source = resolveMediaUrl(path) || path;
      }
      const mediaContentSubFormat = isYoutubeUrl(source) ? 'youtube.url' : 'video.url';

      if (isEditing && typeof id === 'string') {
        await updateExistingVideo(id, isDraft, mediaContentSubFormat, source);
      } else {
        await createNewVideo(isDraft, mediaContentSubFormat, source);
      }
      setTimeout(() => {
        router.push('/content?tab=videos');
      }, 900);
    } catch (err: any) {
      console.error('Failed to save video:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save video.');
    } finally {
      setLoading(false);
    }
  };

  // YouTube links play through the embed player
  const getEmbedUrl = (url: string) => {
    const videoId = getYoutubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <Box sx={{ py: 1, maxWidth: 1400, mx: 'auto' }}>
      <ContentFormHeader
        sectionLabel="Videos"
        sectionHref="/content?tab=videos"
        title={isEditing ? 'Edit video' : 'Create video'}
        saveLabel="Save video"
        onCancel={() => router.push('/content?tab=videos')}
        onSaveDraft={() => handleSave(true)}
        onSave={() => handleSave(false)}
        saveDisabled={!canSave}
      />

      <FormAlerts
        error={error}
        successMsg={successMsg}
        onCloseError={() => setError(null)}
        onCloseSuccess={() => setSuccessMsg(null)}
      />

      {/* Main 2-Column Grid matching Prototype */}
      <Grid container spacing={3}>
        {/* Left Column (8 cols): Video Details + Video Source */}
        <Grid item xs={12} lg={8}>
          {/* Card 1: Video details */}
          <Paper elevation={0} sx={{ ...CARD_SX, mb: 3 }}>
            <FormCardHeader title="Video details" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Title */}
              <LabeledTextField label="Title *" value={title} onChange={setTitle} placeholder="e.g. Life Cycle Needs | Episode 3 | Budgeting" />

              <DescriptionField value={description} onChange={setDescription} placeholder="Provide an overview of the video content..." />

              {/* Duration and Language */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LabeledTextField label="Duration (min)" value={duration} onChange={(v) => setDuration(sanitizeMinutes(v))} numeric={{ maxLength: MINUTES_MAX_DIGITS }} error={durationError} placeholder="e.g. 10" hint="Shown to learners, in minutes" />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LanguageSelect value={language} onChange={setLanguage} />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Card 2: Video source */}
          <Paper elevation={0} sx={CARD_SX}>
            <FormCardHeader title="Video source *" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <SourceOption
                    selected={sourceType === 'link'}
                    onSelect={() => setSourceType('link')}
                    title="Video link"
                    subtitle="YouTube (as in the course document)"
                  />
                </Grid>

                {/* <Grid item xs={12} sm={6}>
                  <SourceOption
                    selected={sourceType === 'upload'}
                    onSelect={() => setSourceType('upload')}
                    title="Upload file"
                    subtitle="MP4, WebM formats"
                  />
                </Grid> */}
              </Grid>

              {sourceType === 'link' ? (
                <LabeledTextField label="Video URL *" value={videoUrl} onChange={(v) => setVideoUrl(v.trimStart())} error={videoUrlError} placeholder="https://www.youtube.com/watch?v=..." hint="Paste a YouTube link or a direct link to a video file" />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* <Box
                    component="label"
                    sx={{
                      border: '2px dashed #BDB9B1',
                      borderRadius: '10px',
                      backgroundColor: '#FAF9F6',
                      py: 4,
                      px: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: '#F5F4F0',
                        borderColor: '#E6873C',
                      },
                    }}
                  >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: '#3D3B37' }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
                      Drop a video here or browse
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                      MP4, WebM up to 500MB
                    </Typography>
                    <input
                      type="file"
                      accept="video/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        const fileError = getVideoFileError(file);
                        if (fileError) {
                          setVideoFile(null);
                          setFileName(null);
                          setError(fileError);
                          return;
                        }
                        setError(null);
                        setVideoFile(file);
                        setFileName(file.name);
                      }}
                    />
                  </Box>
                  {fileName && (
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C', fontWeight: 500 }}>
                      Selected file: <strong>{fileName}</strong>
                    </Typography>
                  )} */}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column (4 cols): Preview + Used in */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Card 3: Preview */}
            <Paper elevation={0} sx={CARD_SX}>
              <FormCardHeader title="Preview" />

              <Box sx={{ p: 2 }}>
                {previewKind === 'youtube' && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 Aspect Ratio
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#1F1E1C',
                    }}
                  >
                    <iframe
                      src={getEmbedUrl(videoUrl)}
                      title="YouTube video player"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                )}
                {previewKind === 'file' && (
                  <Box
                    component="video"
                    controls
                    src={resolveMediaUrl(videoUrl.trim()) || videoUrl.trim()}
                    sx={{ width: '100%', aspectRatio: '16/9', borderRadius: '6px', backgroundColor: '#1F1E1C' }}
                  />
                )}
                {previewKind === 'none' && (
                  <Box
                    sx={{
                      aspectRatio: '16/9',
                      borderRadius: '6px',
                      backgroundColor: '#E2DFD8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: '#6B6862',
                      fontSize: '13px',
                    }}
                  >
                    <PlayCircleOutlineIcon sx={{ fontSize: 40, color: '#8A867F' }} />
                    <span>Video preview</span>
                  </Box>
                )}
              </Box>
            </Paper>

            <UsedInCard
              usedIn={usedIn}
              linkedCaption="This video is linked and used in the course curriculum."
              addHint="Add it to a section from the section editor (+ Video)."
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
};
