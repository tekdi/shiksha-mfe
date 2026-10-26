import React, { useState, useEffect } from 'react';
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

const toLanguageOption = (language: string): 'Hindi' | 'English' => (language === 'Hindi' ? 'Hindi' : 'English');

export default function CreatePdfPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [readingTime, setReadingTime] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [fileName, setFileName] = useState<string | null>(null);
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

  useEffect(() => {
    if (router.query.usedIn && typeof router.query.usedIn === 'string') {
      setUsedIn(router.query.usedIn);
    }
  }, [router.query.usedIn]);

  // Load existing PDF details if editing
  useEffect(() => {
    if (id && typeof id === 'string') {
      setLoading(true);
      getContentRead(id)
        .then((res: any) => {
          const content = res?.content || res;
          if (content) {
            const loadedTitle = content.name || content.title || '';
            const loadedDesc = content.description || '';
            const loadedDur = resolveEditableDuration(content);
            const loadedLang = detectLanguage(loadedTitle, content.language || content.languageCode);
            const loadedFile =
              content.artifactUrl?.split('/').pop() ||
              content.downloadUrl?.split('/').pop() ||
              'document.pdf';
            const courseUsage = (router.query.usedIn as string) || inferCourseUsage(content);

            setTitle(loadedTitle);
            setDescription(loadedDesc);
            setReadingTime(loadedDur);
            setFileName(loadedFile);
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

  const handleSave = async (isDraft = false) => {
    if (!title.trim()) {
      setError('PDF title is required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isEditing && typeof id === 'string') {
        await updateContent(id, {
          name: title.trim(),
          description: description.trim(),
          duration: readingTime.trim() || undefined,
          language: [language],
          status: isDraft ? 'Draft' : 'Live',
        });
        setSuccessMsg('PDF updated successfully.');
      } else {
        await createContent({
          name: title.trim(),
          description: description.trim(),
          mimeType: 'application/pdf',
          primaryCategory: 'Learning Resource',
          duration: readingTime.trim() || undefined,
          language: [language],
          status: isDraft ? 'Draft' : 'Live',
        });
        setSuccessMsg(isDraft ? `PDF saved as draft.` : `PDF created successfully.`);
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
                  <LabeledTextField label="Reading time (min)" value={readingTime} onChange={setReadingTime} placeholder="e.g. 10" hint="Optional, like video durations" />
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
                    if (file) setFileName(file.name);
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
                        if (file) setFileName(file.name);
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
