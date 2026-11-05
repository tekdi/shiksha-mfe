import { minutesFieldError } from '@/utils/minutesInput';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { resolveMediaUrl } from '@/utils/API/APIEndpoints';
import { inferCourseUsage } from '@/services/ContentLibraryService';
import {
  detectLanguage,
  createDocumentLesson,
  uploadLessonMedia,
  getLmsLessonById,
  updateLmsLesson,
  lessonDescriptionToText,
} from '@/services/CourseService';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';
import useUsedInQuery from '@/hooks/useUsedInQuery';
import { ContentFormHeader, FormAlerts, FormCardHeader, DescriptionField, LanguageSelect, UsedInCard, CARD_SX, LabeledTextField } from '@/components/content/ContentFormParts';

/** "20" or "20 min" -> 20 */
const parseIdealMinutes = (value: string): number | undefined => {
  const minutes = /^(\d+)/.exec(value.trim());
  return minutes ? Number(minutes[1]) : undefined;
};

const toLanguageOption = (language: string): 'Hindi' | 'English' => (language === 'Hindi' ? 'Hindi' : 'English');

const toDescriptionHtml = (text: string): string => (text.trim() ? `<p>${text.trim()}</p>` : '');

/** Optional courseId / moduleId from the route query, only when they are non-empty strings */
const getCourseTarget = (query: Record<string, unknown>) => {
  const { courseId, moduleId } = query;
  return {
    ...(typeof courseId === 'string' && courseId ? { courseId } : {}),
    ...(typeof moduleId === 'string' && moduleId ? { moduleId } : {}),
  };
};

const getValidationError = (title: string, isEditing: boolean, pdfFile: File | null): string | null => {
  if (!title.trim()) return 'PDF title is required.';
  if (!isEditing && !pdfFile) return 'Please choose a PDF file.';
  return null;
};

export default function CreatePdfPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [language, setLanguage] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savedPdfPath, setSavedPdfPath] = useState('');

  // A newly chosen file previews from the browser; a saved one from its stored path
  const pdfFileUrl = useMemo(() => (pdfFile ? URL.createObjectURL(pdfFile) : ''), [pdfFile]);
  useEffect(() => () => { if (pdfFileUrl) URL.revokeObjectURL(pdfFileUrl); }, [pdfFileUrl]);
  const previewUrl = pdfFileUrl || resolveMediaUrl(savedPdfPath);
  const [allowDownload, setAllowDownload] = useState(true);
  const [usedIn, setUsedIn] = useState<string>((router.query.usedIn as string) || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    readingTime: string;
    language: string;
    fileName: string | null;
  } | null>(null);

  // Navigation guard against unsaved changes
  const isDirty = Boolean(
    !successMsg &&
    !loading &&
    (isEditing && initialData
      ? title !== initialData.title ||
        description !== initialData.description ||
        readingTime !== initialData.readingTime ||
        language !== initialData.language ||
        fileName !== initialData.fileName
      : title.trim() || fileName)
  );
  useUnsavedChangesGuard(
    isDirty,
    'You have unsaved changes to this document. Are you sure you want to leave this page?'
  );

  useUsedInQuery(setUsedIn);

  // Load existing PDF details if editing
  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      getLmsLessonById(id)
        .then((lesson: any) => {
          if (lesson) {
            const loadedTitle = lesson.title || '';
            const loadedDesc = lessonDescriptionToText(lesson.description);
            const loadedDur = lesson.idealTime ? `${lesson.idealTime} min` : '';
            const loadedLang = detectLanguage(loadedTitle, lesson.language ?? lesson.params?.language);
            const loadedFile =
              (lesson.media?.path || lesson.media?.source || '').split('?')[0].split('/').pop() ||
              'document.pdf';
            const courseUsage =
              (router.query.usedIn as string) || inferCourseUsage({ usedIn: lesson.courseTitle });

            setTitle(loadedTitle);
            setDescription(loadedDesc);
            setReadingTime(loadedDur);
            setFileName(loadedFile);
            setSavedPdfPath(lesson.media?.path || lesson.media?.source || '');
            setLanguage(toLanguageOption(loadedLang));
            setUsedIn(courseUsage);

            setInitialData({
              title: loadedTitle,
              description: loadedDesc,
              readingTime: loadedDur,
              language: toLanguageOption(loadedLang),
              fileName: loadedFile,
            });
          }
        })
        .catch((err) => {
          console.error('Failed to load PDF details:', err);
          setError('Failed to load PDF details.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, router.query.usedIn]);

  const updateExistingPdf = async (lessonId: string, isDraft: boolean) => {
    // A newly chosen file replaces the stored one; otherwise the existing media is kept
    const newPath = pdfFile ? (await uploadLessonMedia(pdfFile, 'document')).path : undefined;
    await updateLmsLesson(lessonId, {
      title: title.trim(),
      description: toDescriptionHtml(description),
      status: isDraft ? 'unpublished' : 'published',
      idealTime: parseIdealMinutes(readingTime),
      ...(newPath ? { mediaContentPath: newPath } : {}),
    });
    setSuccessMsg('PDF updated successfully.');
  };

  const createNewPdf = async (isDraft: boolean) => {
    const { path } = await uploadLessonMedia(pdfFile as File, 'document');
    await createDocumentLesson({
      title: title.trim(),
      description: toDescriptionHtml(description) || undefined,
      status: isDraft ? 'unpublished' : 'published',
      mediaContentPath: path,
      idealTime: parseIdealMinutes(readingTime),
      ...getCourseTarget(router.query),
    });
    setSuccessMsg(isDraft ? `PDF saved as draft.` : `PDF created successfully.`);
  };

  // Title, language and a PDF file (already on the record when editing) are mandatory
  const readingTimeError = minutesFieldError(readingTime);
  const canSave = Boolean(title.trim()) && Boolean(language) && (isEditing || Boolean(pdfFile)) && !readingTimeError;

  const handleSave = async (isDraft = false) => {
    if (!language) {
      setError('Language is required.');
      return;
    }
    const validationError = getValidationError(title, isEditing, pdfFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isEditing && typeof id === 'string') {
        await updateExistingPdf(id, isDraft);
      } else {
        await createNewPdf(isDraft);
      }
      setTimeout(() => {
        router.push('/content?tab=pdfs');
      }, 900);
    } catch (err: any) {
      console.error('Failed to save PDF:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 1, maxWidth: 1400, mx: 'auto' }}>
      <ContentFormHeader
        sectionLabel="PDFs"
        sectionHref="/content?tab=pdfs"
        title={isEditing ? 'Edit PDF' : 'Create PDF'}
        saveLabel="Save PDF"
        onCancel={() => router.push('/content?tab=pdfs')}
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
        {/* Left Column (8 cols): PDF Details + File */}
        <Grid item xs={12} lg={8}>
          {/* Card 1: PDF details */}
          <Paper elevation={0} sx={{ ...CARD_SX, mb: 3 }}>
            <FormCardHeader title="PDF details" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Title */}
              <LabeledTextField label="Title *" value={title} onChange={setTitle} placeholder="e.g. Swadhaar FinAccess Training Manual" />

              <DescriptionField value={description} onChange={setDescription} placeholder="Provide an overview of the document..." />

              {/* Reading Time and Language */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LabeledTextField label="Reading time (min)" value={readingTime} onChange={setReadingTime} error={readingTimeError} placeholder="e.g. 10" hint="Optional, like video durations" />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LanguageSelect value={language} onChange={setLanguage} />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Card 2: File Upload */}
          <Paper elevation={0} sx={CARD_SX}>
            <FormCardHeader title="File *" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Drop a PDF here or browse
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                  PDF only, up to 25MB
                </Typography>
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileName(file.name);
                      setPdfFile(file);
                    }
                  }}
                />
              </Box>

              {fileName && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    border: '1px solid #ECEAE5',
                    borderRadius: '8px',
                    backgroundColor: '#FAF9F6',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 44,
                        borderRadius: '4px',
                        backgroundColor: '#F4F3EF',
                        border: '1px solid #D6D3CC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '11px',
                        color: '#3D3B37',
                      }}
                    >
                      PDF
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                      <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F1E1C' }}>
                        {fileName}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                        Ready to view · Document format
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    size="small"
                    component="label"
                    variant="outlined"
                    sx={{
                      borderColor: '#D6D3CC',
                      color: '#1F1E1C',
                      textTransform: 'none',
                      fontSize: '12px',
                      height: 30,
                    }}
                  >
                    {'Replace'}
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                      setFileName(file.name);
                      setPdfFile(file);
                    }
                      }}
                    />
                  </Button>
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                    Allow learners to download this PDF
                  </Typography>
                }
              />
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
                {previewUrl ? (
                  <Box>
                    <Box
                      component="iframe"
                      src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                      title="PDF preview"
                      sx={{ width: '100%', height: 360, border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#E2DFD8' }}
                    />
                    <Typography sx={{ fontSize: '12px', mt: 1 }}>
                      <a href={previewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      aspectRatio: '3/4',
                      maxHeight: 260,
                      margin: '0 auto',
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
                    <PictureAsPdfOutlinedIcon sx={{ fontSize: 40, color: '#8A867F' }} />
                    <span>{fileName || 'First page'}</span>
                  </Box>
                )}
              </Box>
            </Paper>

            <UsedInCard
              usedIn={usedIn}
              linkedCaption="This document is linked and used in the course curriculum."
              addHint="Add it to a section from the section editor (+ PDF)."
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
