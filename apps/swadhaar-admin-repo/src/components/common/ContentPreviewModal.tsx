import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Radio,
  Paper,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'next-i18next';
import CommonButton from './CommonButton';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

export interface PreviewContentData {
  identifier?: string;
  name?: string;
  title?: string;
  type?: string; // 'video' | 'pdf' | 'assessment' | 'document' | 'test'
  mimeType?: string;
  artifactUrl?: string;
  streamingUrl?: string;
  downloadUrl?: string;
  duration?: string | number | null;
  language?: string[];
  description?: string;
  // Assessment fields
  questionsCount?: number;
  passMark?: string | number;
  timeLimit?: string;
  totalMarks?: number | null;
  passingMarks?: number | null;
  questions?: Array<{
    id: string;
    questionNumber: number;
    prompt: string;
    type?: string;
    tags?: string;
    explanation?: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface ContentPreviewModalProps {
  open: boolean;
  onClose: () => void;
  content: PreviewContentData | null;
}

type AssessmentMode = 'review' | 'interactive';

const PASS_PERCENTAGE = 70;
const DEFAULT_YOUTUBE_EMBED = 'https://www.youtube.com/embed/EUPk_ThuWXI?autoplay=1&rel=0';
const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

const absoluteFillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 0,
};

const headerIconSx = { color: 'primary.main', fontSize: 24 };

// Helper to extract YouTube embed URL
function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = regExp.exec(url);
    if (match?.[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
    }
  } catch (e) {
    console.error('Error parsing YouTube URL:', e);
  }
  return null;
}

/** Border/background colours for an assessment option, by evaluation state. */
function getOptionColors(showCorrect: boolean, showIncorrect: boolean, isSelected: boolean) {
  if (showCorrect) return { borderColor: '#16A34A', backgroundColor: '#F0FDF4' };
  if (showIncorrect) return { borderColor: '#DC2626', backgroundColor: '#FEF2F2' };
  if (isSelected) return { borderColor: BRAND.primary, backgroundColor: BRAND.primarySoft };
  return { borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' };
}

function getSubtitleKey(isVideo: boolean, isPdf: boolean): string {
  if (isVideo) return 'CONTENT.PREVIEW.SUBTITLE_VIDEO';
  if (isPdf) return 'CONTENT.PREVIEW.SUBTITLE_PDF';
  return 'CONTENT.PREVIEW.SUBTITLE_ASSESSMENT';
}

// Fallback questions for Swadhaar assessments if not provided (sample content data)
const DEFAULT_ASSESSMENT_QUESTIONS = [
  {
    id: 'q-1',
    questionNumber: 1,
    prompt: 'What is the primary reason to maintain an emergency saving fund?',
    type: 'Multiple choice – single answer',
    tags: 'Topic: Saving · Module: Course 1',
    explanation: 'An emergency fund prevents families from falling into high-interest debt during sudden crises or income disruptions.',
    options: [
      { id: 'opt-1-1', text: 'To fund unexpected medical or household crises without borrowing', isCorrect: true },
      { id: 'opt-1-2', text: 'To invest in high-risk speculative schemes', isCorrect: false },
      { id: 'opt-1-3', text: 'To avoid maintaining a bank savings account', isCorrect: false },
    ],
  },
  {
    id: 'q-2',
    questionNumber: 2,
    prompt: 'Which of the following is a key feature of formal savings in a regulated bank?',
    type: 'Multiple choice – single answer',
    tags: 'Topic: Banking · Module: Course 1',
    explanation: 'Formal bank deposits are insured and regulated by statutory authorities, offering safety and periodic interest.',
    options: [
      { id: 'opt-2-1', text: 'Safe deposit with regulated interest and government insurance', isCorrect: true },
      { id: 'opt-2-2', text: 'High risk of complete capital loss', isCorrect: false },
      { id: 'opt-2-3', text: 'No record or passbook of deposited funds', isCorrect: false },
    ],
  },
  {
    id: 'q-3',
    questionNumber: 3,
    prompt: 'What should be prioritized first when creating a monthly household budget?',
    type: 'Multiple choice – single answer',
    tags: 'Topic: Budgeting · Module: Course 1',
    explanation: 'Separating non-negotiable household needs from discretionary wants is the fundamental cornerstone of disciplined budgeting.',
    options: [
      { id: 'opt-3-1', text: 'Essential living expenses (food, rent, healthcare, utility bills)', isCorrect: true },
      { id: 'opt-3-2', text: 'Entertainment and luxury expenditures', isCorrect: false },
      { id: 'opt-3-3', text: 'Immediate borrowing from informal money lenders', isCorrect: false },
    ],
  },
];

const detectPreviewKind = (content: PreviewContentData) => {
  const rawType = (content.type || '').toLowerCase();
  const mime = (content.mimeType || '').toLowerCase();
  const artifactUrl = content.artifactUrl || '';
  const isVideo =
    rawType === 'video' ||
    mime.includes('video') ||
    mime.includes('youtube') ||
    artifactUrl.includes('youtube') ||
    artifactUrl.includes('youtu.be') ||
    artifactUrl.endsWith('.mp4');

  const isPdf =
    rawType === 'pdf' ||
    rawType === 'document' ||
    mime === 'application/pdf' ||
    artifactUrl.toLowerCase().endsWith('.pdf');

  const isAssessment =
    rawType === 'assessment' ||
    rawType === 'test' ||
    rawType.includes('quiz') ||
    mime.includes('questionset') ||
    (!isVideo && !isPdf);

  return { isVideo, isPdf, isAssessment };
};

export const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({ open, onClose, content }) => {
  const { t } = useTranslation();
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('review');
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!content) return null;

  const { isVideo, isPdf, isAssessment } = detectPreviewKind(content);

  const displayTitle = content.name || content.title || t('CONTENT.PREVIEW.DEFAULT_TITLE');
  const rawUrl = content.artifactUrl || content.streamingUrl || content.downloadUrl || '';
  const youtubeEmbedUrl = getYouTubeEmbedUrl(rawUrl);
  const isInteractive = assessmentMode === 'interactive';

  const questionsList =
    content.questions && content.questions.length > 0 ? content.questions : DEFAULT_ASSESSMENT_QUESTIONS;

  const handleOptionSelect = (qId: string, optId: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const handleResetAssessment = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questionsList.forEach((q) => {
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (correctOpt && userAnswers[q.id] === correctOpt.id) {
        correct++;
      }
    });
    return {
      score: correct,
      total: questionsList.length,
      percentage: Math.round((correct / questionsList.length) * 100),
    };
  };

  const renderVideoPlayer = () => {
    if (youtubeEmbedUrl) {
      return (
        <iframe
          src={youtubeEmbedUrl}
          title={displayTitle}
          style={absoluteFillStyle}
          allow={IFRAME_ALLOW}
          allowFullScreen
        />
      );
    }
    if (rawUrl) {
      return (
        <video
          controls
          autoPlay
          src={rawUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          <track kind="captions" />
        </video>
      );
    }
    return <iframe src={DEFAULT_YOUTUBE_EMBED} title={displayTitle} style={absoluteFillStyle} allowFullScreen />;
  };

  const scoreResult = isInteractive && submitted ? calculateScore() : null;
  const hasPassed = scoreResult ? scoreResult.percentage >= PASS_PERCENTAGE : false;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={!isVideo && isPdf ? 'lg' : 'md'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: 'secondary.main',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {isVideo && <PlayCircleOutlineIcon sx={headerIconSx} />}
          {isPdf && <PictureAsPdfOutlinedIcon sx={headerIconSx} />}
          {isAssessment && <QuizOutlinedIcon sx={headerIconSx} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayTitle}
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#B0B8C4' }}>
              {t(getSubtitleKey(isVideo, isPdf))}
              {content.duration ? ` · ${content.duration}` : ''}
              {content.timeLimit ? ` · ${t('CONTENT.PREVIEW.TIME', { value: content.timeLimit })}` : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={t('COMMON.CLOSE')}
          sx={{ color: '#FFFFFF', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content Body */}
      <DialogContent sx={{ p: 0, backgroundColor: NEUTRAL.canvas }}>
        {/* 1. Video Player */}
        {isVideo && (
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#000000',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {renderVideoPlayer()}
            </Box>

            {content.description && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: '8px',
                  border: `1px solid ${NEUTRAL.divider}`,
                }}
              >
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: NEUTRAL.ink, mb: 0.5 }}>
                  {t('COMMON.DESCRIPTION')}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted, lineHeight: 1.5 }}>
                  {content.description}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* 2. PDF Viewer */}
        {isPdf && (
          <Box sx={{ p: 2.5 }}>
            {rawUrl ? (
              <Box
                sx={{
                  width: '100%',
                  height: '620px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${NEUTRAL.border}`,
                  backgroundColor: '#525659',
                }}
              >
                <iframe
                  src={`${rawUrl}#toolbar=1&navpanes=0`}
                  title={displayTitle}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: 'background.paper',
                  border: `1px dashed ${NEUTRAL.border}`,
                  borderRadius: '8px',
                }}
              >
                <PictureAsPdfOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600, color: NEUTRAL.ink, mb: 1 }}>
                  {displayTitle}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted, maxWidth: 500, mx: 'auto', mb: 3 }}>
                  {t('CONTENT.PREVIEW.PDF_REGISTERED')}
                </Typography>
                <CommonButton
                  variant="primary"
                  startIcon={<OpenInNewIcon />}
                  onClick={() => window.open(rawUrl || '/sample.pdf', '_blank')}
                >
                  {t('CONTENT.PREVIEW.OPEN_NEW_TAB')}
                </CommonButton>
              </Paper>
            )}
          </Box>
        )}

        {/* 3. Assessment Viewer / Evaluator */}
        {isAssessment && (
          <Box sx={{ p: 3 }}>
            {/* Top Stats Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: 'background.paper',
                border: `1px solid ${NEUTRAL.border}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={t('CONTENT.PREVIEW.QUESTIONS_COUNT', { n: questionsList.length })}
                  size="small"
                  sx={{ backgroundColor: '#F3F4F6', fontWeight: 600, color: 'secondary.main' }}
                />
                <Chip
                  label={t('CONTENT.PREVIEW.PASSING_MARK', { value: content.passMark || '70%' })}
                  size="small"
                  sx={{ backgroundColor: BRAND.primarySoft, fontWeight: 600, color: 'primary.main' }}
                />
                <Chip
                  label={t('CONTENT.PREVIEW.TIME_LIMIT', {
                    value: content.timeLimit || t('CONTENT.PREVIEW.DEFAULT_TIME_LIMIT'),
                  })}
                  size="small"
                  sx={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}
                />
              </Box>

              {/* Mode Toggle */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <CommonButton
                  size="small"
                  variant={assessmentMode === 'review' ? 'dark' : 'outlined'}
                  sx={{ fontSize: '12px' }}
                  onClick={() => setAssessmentMode('review')}
                >
                  {t('CONTENT.PREVIEW.ANSWER_KEY_MODE')}
                </CommonButton>
                <CommonButton
                  size="small"
                  variant={isInteractive ? 'primary' : 'secondary'}
                  sx={{ fontSize: '12px' }}
                  onClick={() => setAssessmentMode('interactive')}
                >
                  {t('CONTENT.PREVIEW.INTERACTIVE_MODE')}
                </CommonButton>
              </Box>
            </Paper>

            {/* Interactive Mode Score Banner */}
            {scoreResult && (
              <Alert
                severity={hasPassed ? 'success' : 'warning'}
                sx={{ mb: 3, borderRadius: '8px' }}
                action={
                  <Button color="inherit" size="small" onClick={handleResetAssessment}>
                    {t('CONTENT.PREVIEW.TRY_AGAIN')}
                  </Button>
                }
              >
                <strong>{t('CONTENT.PREVIEW.SCORE', scoreResult)}</strong>
                {' — '}
                {hasPassed ? t('CONTENT.PREVIEW.PASSED') : t('CONTENT.PREVIEW.BELOW_PASS')}
              </Alert>
            )}

            {/* Questions List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {questionsList.map((q, idx) => {
                const selectedOptId = userAnswers[q.id];

                return (
                  <Paper
                    key={q.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: 'background.paper',
                      border: `1px solid ${NEUTRAL.divider}`,
                      borderRadius: '8px',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: NEUTRAL.ink }}>
                        {t('CONTENT.PREVIEW.QUESTION_N', { n: idx + 1 })}
                      </Typography>
                      {q.tags && <Typography sx={{ fontSize: '11px', color: NEUTRAL.subtle }}>{q.tags}</Typography>}
                    </Box>

                    <Typography sx={{ fontSize: '14px', color: NEUTRAL.ink, mb: 2, fontWeight: 500 }}>
                      {q.prompt}
                    </Typography>

                    {/* Options */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {q.options.map((opt) => {
                        const isSelected = selectedOptId === opt.id;
                        const isAnswerKey = assessmentMode === 'review';
                        const showCorrect = isAnswerKey || (submitted && opt.isCorrect);
                        const showIncorrect = submitted && isSelected && !opt.isCorrect;

                        return (
                          <Box
                            key={opt.id}
                            onClick={() => {
                              if (isInteractive) {
                                handleOptionSelect(q.id, opt.id);
                              }
                            }}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              px: 2,
                              borderRadius: '6px',
                              border: '1px solid',
                              ...getOptionColors(showCorrect, showIncorrect, isSelected),
                              cursor: isInteractive && !submitted ? 'pointer' : 'default',
                              transition: 'all 0.15s ease-in-out',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Radio
                                checked={isSelected || (isAnswerKey && opt.isCorrect)}
                                disabled={isAnswerKey || submitted}
                                size="small"
                                sx={{
                                  p: 0,
                                  color: showCorrect ? '#16A34A' : NEUTRAL.border,
                                  '&.Mui-checked': {
                                    color: showCorrect ? '#16A34A' : 'primary.main',
                                  },
                                }}
                              />
                              <Typography sx={{ fontSize: '13px', color: NEUTRAL.ink }}>{opt.text}</Typography>
                            </Box>

                            {showCorrect && (
                              <Chip
                                label={t('CONTENT.PREVIEW.CORRECT_ANSWER')}
                                size="small"
                                sx={{
                                  backgroundColor: '#DCFCE7',
                                  color: '#166534',
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  height: 22,
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Explanation */}
                    {q.explanation && (assessmentMode === 'review' || (submitted && isInteractive)) && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 1.5,
                          backgroundColor: '#F8FAFC',
                          borderRadius: '6px',
                          borderLeft: '3px solid',
                          borderLeftColor: 'secondary.main',
                        }}
                      >
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'secondary.main', mb: 0.3 }}>
                          {t('CONTENT.PREVIEW.EXPLANATION')}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#4B5563' }}>{q.explanation}</Typography>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>

            {isInteractive && !submitted && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <CommonButton
                  variant="primary"
                  sx={{ px: 3 }}
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(userAnswers).length === 0}
                >
                  {t('CONTENT.PREVIEW.SUBMIT_ASSESSMENT')}
                </CommonButton>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${NEUTRAL.divider}`,
          backgroundColor: 'background.paper',
          justifyContent: 'space-between',
        }}
      >
        <Typography sx={{ fontSize: '12px', color: NEUTRAL.muted }}>{t('CONTENT.PREVIEW.FOOTER_NOTE')}</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isPdf && rawUrl && (
            <CommonButton
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon fontSize="small" />}
              onClick={() => window.open(rawUrl, '_blank')}
            >
              {t('CONTENT.PREVIEW.OPEN_NEW_WINDOW')}
            </CommonButton>
          )}
          <CommonButton variant="dark" size="small" sx={{ px: 2.5 }} onClick={onClose}>
            {t('COMMON.CLOSE')}
          </CommonButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ContentPreviewModal;
