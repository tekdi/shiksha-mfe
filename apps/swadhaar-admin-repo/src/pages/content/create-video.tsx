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
import {
  getContentRead,
  createContent,
  updateContent,
  inferCourseUsage,
  resolveEditableDuration,
} from '@/services/ContentLibraryService';
import { detectLanguage } from '@/services/CourseService';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';
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

const detectSourceType = (url: string): 'link' | 'upload' =>
  url.includes('youtube') || url.includes('youtu.be') || url.startsWith('http') ? 'link' : 'upload';

export default function CreateVideoPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [sourceType, setSourceType] = useState<'link' | 'upload'>('link');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
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

  useEffect(() => {
    if (router.query.usedIn && typeof router.query.usedIn === 'string') {
      setUsedIn(router.query.usedIn);
    }
  }, [router.query.usedIn]);

  // Load existing video details if editing
  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      getContentRead(id)
        .then((res: any) => {
          const content = res?.content || res;
          if (content) {
            const loadedTitle = content.name || content.title || '';
            const loadedDesc = content.description || '';
            const loadedUrl = content.artifactUrl || content.downloadUrl || content.previewUrl || '';
            const loadedDur = resolveEditableDuration(content);
            const loadedLang = detectLanguage(loadedTitle, content.language || content.languageCode);
            const loadedSrc = detectSourceType(loadedUrl);
            const courseUsage = (router.query.usedIn as string) || inferCourseUsage(content);

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

  const handleSave = async (isDraft = false) => {
    if (!title.trim()) {
      setError('Video title is required.');
      return;
    }
    if (sourceType === 'link' && !videoUrl.trim()) {
      setError('Video URL is required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const mimeType = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
        ? 'video/x-youtube'
        : 'video/mp4';

      if (isEditing && typeof id === 'string') {
        await updateContent(id, {
          name: title.trim(),
          description: description.trim(),
          artifactUrl: videoUrl.trim(),
          duration: duration.trim() || undefined,
          language: [language],
          status: isDraft ? 'Draft' : 'Live',
        });
        setSuccessMsg('Video updated successfully.');
      } else {
        await createContent({
          name: title.trim(),
          description: description.trim(),
          mimeType,
          primaryCategory: 'Learning Resource',
          artifactUrl: videoUrl.trim(),
          duration: duration.trim() || undefined,
          language: [language],
          status: isDraft ? 'Draft' : 'Live',
        });
        setSuccessMsg(isDraft ? `Video saved as draft.` : `Video created successfully.`);
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

  // Convert youtube watch url to embed if possible
  const getEmbedUrl = (url: string) => {
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
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
                  <LabeledTextField label="Duration" value={duration} onChange={setDuration} placeholder="e.g. 1:43 or 45 min" hint="Shown to learners, as in the course document" />
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

                <Grid item xs={12} sm={6}>
                  <SourceOption
                    selected={sourceType === 'upload'}
                    onSelect={() => setSourceType('upload')}
                    title="Upload file"
                    subtitle="MP4, WebM formats"
                  />
                </Grid>
              </Grid>

              {sourceType === 'link' ? (
                <LabeledTextField label="Video URL *" value={videoUrl} onChange={setVideoUrl} placeholder="https://www.youtube.com/watch?v=..." />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box
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
                        if (file) setFileName(file.name);
                      }}
                    />
                  </Box>
                  {fileName && (
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C', fontWeight: 500 }}>
                      Selected file: <strong>{fileName}</strong>
                    </Typography>
                  )}
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
                {sourceType === 'link' && videoUrl.includes('youtube') ? (
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
                ) : (
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
