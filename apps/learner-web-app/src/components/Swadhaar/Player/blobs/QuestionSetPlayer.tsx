'use client';

import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

/* ─── Types ─────────────────────────────────────────────── */
export interface QuestionOption {
  body: string;
  answer: boolean;
}

export interface Question {
  identifier?: string;
  body?: string;
  name?: string;
  qType?: string;         // 'MCQ' | 'SA' | ...
  options?: QuestionOption[];
  children?: Question[];
  media?: any[];
  editorState?: {
    options?: any[];
    question?: string;
    solutions?: string[];  // model answer HTML strings for SA
  };
  interactions?: any;
  answer?: string;         // model answer string for SA (alternate field)
}

interface QuestionSetPlayerProps {
  name: string;
  description?: string;
  questions: Question[];
  maxAttempts?: number;
  currentAttempts?: number;
  learnerName?: string;
  instructions?: string;  // HTML string from questionset API
  initiallyPassed?: boolean;  // True if backend shows >=70% completion already
  onStart?: () => void;
  onComplete: (score: number) => void;
  mode?: 'play' | 'review';
  questionsetDescription?: string;
  sectionName?: string;
  sectionDescription?: string;
}

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const SUCCESS_GREEN = '#4CAF50';
const ERROR_RED = '#EF4444';

/* ─── Helpers ───────────────────────────────────────────── */
function stripHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html.replace(/<[^>]+>/g, '');
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

/** Returns true if the question is a Sunbird Subjective / Short Answer type */
function isSubjective(q: Question): boolean {
  return (q.qType || '').toUpperCase() === 'SA';
}

function normalizeQuestions(raw: Question[]): Question[] {
  return raw.map((q) => {
    // ✅ Subjective (SA) questions have no options — skip all option-mapping
    if (isSubjective(q)) {
      return { ...q, options: [] };
    }

    let opts: QuestionOption[] = [];

    // ✅ Case 1: Standard Sunbird options field
    if (q.options && q.options.length > 0) {
      opts = q.options;
    }
    // ✅ Case 2: Hierarchy-nested options as children
    else if (q.children && q.children.length > 0) {
      opts = q.children.map((c) => ({
        body: c.body || c.name || '',
        answer: !!(c as any).answer || (c as any).isCorrect === true,
      }));
    }
    // ✅ Case 3: QUML 1.1 / editorState format (from question/v2/list)
    else if (q.editorState?.options) {
      opts = q.editorState.options.map((o) => ({
        body: o.value?.body || o.body || '',
        answer: !!o.answer,
      }));
    }
    // ✅ Case 4: interactions format (fallback)
    else if (q.interactions?.response1?.options) {
      opts = q.interactions.response1.options.map((o: any) => ({
        body: o.label || '',
        answer: false,
      }));
    }

    return { ...q, options: opts };
  });
}

/* ─── Phase 1: Start Screen ─────────────────────────────── */
const StartScreen: React.FC<{
  name: string;
  description?: string;
  questionCount: number;
  // maxAttempts: number;  // No longer used — unlimited attempts until passed
  // currentAttempts: number;  // No longer used
  passed?: boolean;  // Whether learner has already passed (>=70%)
  instructions?: string;
  isSubjectiveSet?: boolean;
  questionsetDescription?: string;
  sectionName?: string;
  sectionDescription?: string;
  onStart: (reviewMode?: boolean) => void;
}> = ({ name, description, questionCount, passed, instructions, isSubjectiveSet, questionsetDescription, sectionName, sectionDescription, onStart }) => {
  // const isExhausted = currentAttempts >= maxAttempts;  // Commented out — no attempt limit
  // const attemptsRemaining = Math.max(0, maxAttempts - currentAttempts);  // Commented out

  // Parse instructions from HTML if provided by the questionset
  const instructionLines: string[] = [];
  if (instructions) {
    const cleaned = stripHtml(instructions).trim();
    if (cleaned) {
      // Split by newline or sentence-ending punctuation to get bullet lines
      cleaned.split(/\n+/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed) instructionLines.push(trimmed);
      });
    }
  }
  // Default instructions shown when questionset doesn't provide any
  const defaultInstructions = [
    'Read each question carefully before selecting an answer.',
    'You can skip a question and return to it later.',
    'Score 70% or above to pass and unlock the next lesson.',
    `Total Questions: ${questionCount}`,
  ];
  const displayInstructions = instructionLines.length > 0 ? instructionLines : defaultInstructions;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Combined card: description (big) → name (small) → instructions */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Description shown prominently at top; name shown as orange label below */}
          {description ? (
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#1F2937', lineHeight: 1.4 }}>
                {name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#1F2937', fontWeight: 500, mt: 0.5 }}>
                {stripHtml(description)}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#1F2937' }}>{name}</Typography>
              {!isSubjectiveSet && (
                <Typography sx={{ fontSize: 12, color: PRIMARY, fontWeight: 700, mt: 0.5 }}>Quiz</Typography>
              )}
            </Box>
          )}

          {/* Section Description (renders right below main description) */}
          {(sectionName || sectionDescription) && (
            <Box sx={{ mt: 1, pt: 1.5, borderTop: '1px solid #F3F4F6' }}>
              {sectionName && (
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#1F2937', mb: 0.5 }}>
                  {sectionName}
                </Typography>
              )}
              {sectionDescription && (
                <Typography sx={{ fontSize: 12, color: '#4B5563', fontWeight: 500, lineHeight: 1.5 }}>
                  {stripHtml(sectionDescription)}
                </Typography>
              )}
            </Box>
          )}

          {/* Divider + instructions (Hidden for subjective/FAQ sets) */}
          {!isSubjectiveSet && (
            <Box sx={{ borderTop: '1px solid #F3F4F6', pt: 1.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#1F2937', mb: 1 }}>Before you begin</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {displayInstructions.map((line, i) => (
                  <Typography key={i} sx={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>• {line}</Typography>
                ))}
              </Box>
            </Box>
          )}

        </Box>
      </Box>

      {/* Attempts Card — DISABLED: No attempt limits; learner retries until they pass >=70% */}
      {/* {!isSubjectiveSet && (
        <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: `1px solid ${isExhausted ? ERROR_RED : '#E5E7EB'}`, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: isExhausted ? ERROR_RED : DARK_NAV, px: 2, py: 1 }}>
            <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {isExhausted ? 'No Attempts Remaining' : 'Attempts'}
            </Typography>
          </Box>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 28, color: isExhausted ? ERROR_RED : DARK_NAV, lineHeight: 1 }}>
                {Math.min(currentAttempts, maxAttempts)}<Typography component="span" sx={{ fontSize: 16, color: '#9CA3AF', fontWeight: 600 }}>/{maxAttempts}</Typography>
              </Typography>
              <Typography sx={{ fontSize: 11, color: isExhausted ? ERROR_RED : '#6B7280', fontWeight: 600, mt: 0.5 }}>
                {isExhausted ? 'All attempts used' : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {Array.from({ length: maxAttempts }, (_, i) => (
                <Box key={i} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i < currentAttempts ? (isExhausted ? ERROR_RED : PRIMARY) : '#E5E7EB', transition: 'background-color 0.3s' }} />
              ))}
            </Box>
          </Box>
        </Box>
      )} */}

      {/* Action Buttons */}
      {isSubjectiveSet ? (
        <Button
          fullWidth
          variant="contained"
          onClick={() => onStart(false)}
          sx={{
            mt: 1, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px',
            fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 16,
            boxShadow: '0 6px 16px rgba(230,135,60,0.35)',
            '&:hover': { bgcolor: '#D1752D' }
          }}
        >
          Go to FAQ
        </Button>
      ) : passed ? (
        // Already passed >=70%: only allow Review
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onStart(true)}
          startIcon={<VisibilityRoundedIcon />}
          sx={{
            mt: 1, borderColor: DARK_NAV, color: DARK_NAV, borderRadius: '12px',
            fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 15,
            '&:hover': { bgcolor: 'rgba(28,43,74,0.04)', borderColor: DARK_NAV }
          }}
        >
          Review Answers
        </Button>
      ) : (
        // Not yet passed: allow unlimited retries
        <Button
          fullWidth
          variant="contained"
          onClick={() => onStart(false)}
          // startIcon={currentAttempts > 0 ? <ReplayRoundedIcon /> : undefined}  // Commented out — attempts not tracked
          startIcon={<ReplayRoundedIcon />}
          sx={{
            mt: 1, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px',
            fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 16,
            boxShadow: '0 6px 16px rgba(230,135,60,0.35)',
            '&:hover': { bgcolor: '#D1752D' }
          }}
        >
          {/* {currentAttempts > 0 ? 'Replay Quiz' : 'Start Quiz'} */}
          Start Quiz
        </Button>
      )}
    </Box>
  );
};

/* ─── Phase 2: Question Screen ──────────────────────────── */
const QuestionScreen: React.FC<{
  question: Question;
  qIndex: number;
  total: number;
  answer: any;
  reviewMode?: boolean;
  onAnswer: (val: any) => void;
  onNext: () => void;
  isLast: boolean;
}> = ({ question, qIndex, total, answer, reviewMode, onAnswer, onNext, isLast }) => {
  const opts = question.options || [];
  const questionText = question.editorState?.question || question.body || question.name || `Question ${qIndex + 1}`;
  const subjective = isSubjective(question);
  // Model answer for SA: prefer editorState.solutions array, fallback to question.answer
  const modelAnswer = question.editorState?.solutions?.[0] || (question as any).answer || '';

  // Next-button disabled rules:
  // MCQ: must select an option
  // SA (FAQ-style): always enabled — learner just reads the answer
  const fixRichText = (html: string) => {
    if (!html) return '';
    let processed = html;

    if (question.media && Array.isArray(question.media)) {
      question.media.forEach((m) => {
        if (m.src && m.baseUrl) {
          const srcPattern = new RegExp(`src="(${m.src})"`, 'g');
          processed = processed.replace(srcPattern, `src="${m.baseUrl}$1"`);
        }
      });
    }

    const fallbackBaseUrl = process.env.NEXT_PUBLIC_BASE_URL_READ || 'https://interface.tekdinext.com';
    processed = processed.replace(/src="\/assets\//g, `src="${fallbackBaseUrl}/assets/`);
    processed = processed.replace(/src="\/content\/assets\//g, `src="${fallbackBaseUrl}/content/assets/`);

    return processed;
  };

  const isNextDisabled = !reviewMode && (
    subjective ? false : answer === undefined
  );

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        {/* Progress bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={((qIndex + 1) / total) * 100}
            sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: reviewMode ? DARK_NAV : PRIMARY }, mr: 2 }}
          />
          <Typography sx={{ color: '#9CA3AF', fontSize: 11, fontWeight: 700 }}>{qIndex + 1}/{total}</Typography>
        </Box>

        {!subjective && (
          <Typography sx={{ fontSize: 11, color: PRIMARY, fontWeight: 700, mb: 0.5 }}>Quiz</Typography>
        )}
        <Box
          sx={{ fontWeight: 800, fontSize: 15, color: '#1F2937', mb: 3, lineHeight: 1.4, '& img': { maxWidth: '100%', height: 'auto', mt: 1, borderRadius: '8px' } }}
          dangerouslySetInnerHTML={{ __html: fixRichText(questionText) }}
        />

        {subjective ? (
          /* ── SA: Read-only FAQ card — question + pre-filled answer ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Answer box — always shown, not editable */}
            <Box sx={{
              p: 2, borderRadius: '12px',
              // border: `1.5px solid ${SUCCESS_GREEN}`,
              // bgcolor: 'rgba(76,175,80,0.04)',
            }}>
              <Box
                sx={{
                  fontSize: 14,
                  color: '#1F2937',
                  lineHeight: 1.7,
                  '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                  '& ol, & ul': { m: 0, pl: 2, mb: 1 },
                  '& li': { mb: 0.5 },
                  '& img': { maxWidth: '100%', height: 'auto', mt: 1, borderRadius: '8px' },
                  '& span': { backgroundColor: 'transparent !important' }
                }}
              >
                {modelAnswer ? (
                  <div dangerouslySetInnerHTML={{ __html: fixRichText(modelAnswer) }} />
                ) : (
                  <em style={{ color: '#9CA3AF' }}>No answer provided.</em>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          /* ── MCQ: Option boxes ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {opts.map((opt, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isSelected = answer === idx;
              const isCorrect = opt.answer;

              let borderColor = isSelected ? PRIMARY : '#aaa8a8ff';
              let bgColor = isSelected ? 'rgba(230,135,60,0.05)' : '#fff';

              if (reviewMode) {
                if (isCorrect) {
                  borderColor = SUCCESS_GREEN;
                  bgColor = 'rgba(76, 175, 80, 0.05)';
                } else if (isSelected && !isCorrect) {
                  borderColor = ERROR_RED;
                  bgColor = 'rgba(239, 68, 68, 0.05)';
                }
              }

              return (
                <Box
                  key={idx}
                  onClick={() => !reviewMode && onAnswer(idx)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                    border: `2px solid ${borderColor}`,
                    borderRadius: '12px', cursor: reviewMode ? 'default' : 'pointer',
                    bgcolor: bgColor,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '8px',
                    bgcolor: reviewMode ? (isCorrect ? SUCCESS_GREEN : (isSelected ? ERROR_RED : '#aaa8a8ff')) : (isSelected ? PRIMARY : '#E0E0E0'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: (isSelected || (reviewMode && isCorrect)) ? '#fff' : '#6B7280' }}>{label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, color: '#374151', fontWeight: (isSelected || (reviewMode && isCorrect)) ? 700 : 500, flex: 1 }}>{stripHtml(opt.body)}</Typography>
                  {!reviewMode && isSelected && <RadioButtonCheckedIcon sx={{ color: PRIMARY, fontSize: 24 }} />}
                  {!reviewMode && !isSelected && <RadioButtonUncheckedIcon sx={{ color: '#aaa8a8ff', fontSize: 24 }} />}
                  {reviewMode && isCorrect && <CheckCircleRoundedIcon sx={{ color: SUCCESS_GREEN, fontSize: 24 }} />}
                  {reviewMode && isSelected && !isCorrect && <CancelRoundedIcon sx={{ color: ERROR_RED, fontSize: 24 }} />}
                </Box>
              );
            })}
          </Box>
        )}

        {!(isLast && subjective) && (
          <Button
            fullWidth
            variant="contained"
            onClick={onNext}
            disabled={isNextDisabled}
            sx={{
              mt: 4, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px',
              fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 15,
              boxShadow: '0 4px 12px rgba(230,135,60,0.25)',
              '&:hover': { bgcolor: '#D1752D' },
              '&.Mui-disabled': { bgcolor: '#F3F4F6', color: '#9CA3AF' },
            }}
          >
            {isLast ? (reviewMode ? 'Close Review' : 'Submit') : 'Next Question'}
          </Button>
        )}
      </Box>
    </Box>
  );
};

/* ─── Phase 3: Result Screen ────────────────────────────── */
const ResultScreen: React.FC<{
  score: number;
  total: number;
  // currentAttempts: number;  // Commented out — no attempt limit
  // maxAttempts: number;  // Commented out — no attempt limit
  results: { q: Question; isCorrect: boolean }[];
  onReplay: () => void;
  onReview: () => void;
}> = ({ score, total, /* currentAttempts, maxAttempts, */ results, onReplay, onReview }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 70;
  // const canReplay = currentAttempts < maxAttempts;  // Commented out — no attempt limit; replay allowed if not passed

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Score Circle */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#F9FAFB' }}>
          <Box sx={{
            width: 120, height: 120, borderRadius: '50%',
            bgcolor: passed ? '#6DBB6D' : ERROR_RED,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 3,
            boxShadow: `0 4px 20px ${passed ? 'rgba(76,175,80,0.3)' : 'rgba(239,68,68,0.3)'}`
          }}>
            <Box sx={{
              width: 86, height: 86, borderRadius: '50%',
              bgcolor: passed ? '#388E3C' : '#DC2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {passed ? (
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <Typography sx={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{percentage}%</Typography>
              )}
            </Box>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 24, color: passed ? '#388E3C' : ERROR_RED, mb: 0.5 }}>
            {passed ? 'Quiz Passed!' : 'Quiz Completed'}
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            {passed ? 'Great job!' : 'Keep practicing to improve your score'}
          </Typography>
        </Box>
      </Box>

      {/* Score Details — attempts tracking commented out; only shows correct answers */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }}>
          <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Results</Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: DARK_NAV }}>
              {score}<Typography component="span" sx={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>/{total}</Typography>
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Correct Answers</Typography>
          </Box>
          {/* Attempts counter — commented out (no attempt limits applied)
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: DARK_NAV }}>
              {Math.min(currentAttempts, maxAttempts)}<Typography component="span" sx={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>/{maxAttempts}</Typography>
            </Typography>
            <Typography sx={{ fontSize: 11, color: canReplay ? '#6B7280' : ERROR_RED, fontWeight: 600 }}>
              {canReplay ? 'Attempts Used' : 'No Attempts Left'}
            </Typography>
          </Box>
          */}
        </Box>
      </Box>

      {/* Question Results */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {results.map(({ q, isCorrect, isSubjectiveQ, submittedText }: any, i: number) => (
          <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1F2937' }}>Q{i + 1}: {stripHtml(q.editorState?.question || q.body || q.name || '')}</Typography>
              {isSubjectiveQ ? (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 11, color: '#3B82F6', fontWeight: 700, mb: 0.5 }}>Answered (Subjective)</Typography>
                  {submittedText && (
                    <Typography sx={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>"{submittedText}"</Typography>
                  )}
                </Box>
              ) : (
                <Typography sx={{ fontSize: 11, color: isCorrect ? SUCCESS_GREEN : ERROR_RED, fontWeight: 700, mt: 0.5 }}>{isCorrect ? 'Correct' : 'Incorrect'}</Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onReview}
          startIcon={<VisibilityRoundedIcon />}
          sx={{
            borderColor: DARK_NAV, color: DARK_NAV, borderRadius: '12px',
            fontWeight: 700, textTransform: 'none', py: 1.5, fontSize: 14,
            '&:hover': { bgcolor: 'rgba(28,43,74,0.04)', borderColor: DARK_NAV }
          }}
        >
          Review
        </Button>
        {!passed ? (
          // Not passed yet — allow retry (unlimited)
          <Button
            fullWidth
            variant="contained"
            onClick={onReplay}
            startIcon={<ReplayRoundedIcon />}
            sx={{
              bgcolor: PRIMARY, color: '#fff', borderRadius: '12px',
              fontWeight: 700, textTransform: 'none', py: 1.5, fontSize: 14,
              boxShadow: '0 4px 12px rgba(230,135,60,0.25)',
              '&:hover': { bgcolor: '#D1752D' }
            }}
          >
            Try Again
          </Button>
        ) : (
          // Passed >=70% — no more replays, review only
          <Button
            fullWidth
            variant="contained"
            disabled
            sx={{
              bgcolor: '#E5E7EB', color: '#9CA3AF', borderRadius: '12px',
              fontWeight: 700, textTransform: 'none', py: 1.5, fontSize: 14,
              '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' }
            }}
          >
            Quiz Passed ✓
          </Button>
        )}
      </Box>
    </Box>
  );
};

/* ─── Main QuestionSetPlayer ────────────────────────────── */
export const QuestionSetPlayer: React.FC<QuestionSetPlayerProps> = ({
  name,
  description,
  questions: rawQuestions,
  maxAttempts = 5,
  currentAttempts = 0,
  onStart,
  onComplete,
  mode,
  instructions,
  questionsetDescription,
  sectionName,
  sectionDescription,
  initiallyPassed = false,
}) => {
  const questions = useMemo(() => normalizeQuestions(rawQuestions || []), [rawQuestions]);
  const isSubjectiveSet = useMemo(() => questions.length > 0 && questions.every(isSubjective), [questions]);
  const [phase, setPhase] = useState<'start' | 'quiz' | 'result'>(isSubjectiveSet ? 'quiz' : 'start');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any[]>(isSubjectiveSet ? new Array(questions.length).fill(undefined) : []);
  const [isReview, setIsReview] = useState(mode === 'review');

  // Auto-trigger onStart for subjective sets that bypass the start screen
  React.useEffect(() => {
    if (isSubjectiveSet && !isReview && onStart) {
      onStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Seed lastScore from initiallyPassed so the start screen correctly shows 'Review Answers'
  // when the user has already passed this quiz (based on backend data), even after a page remount.
  const [lastScore, setLastScore] = useState<number | null>(
    initiallyPassed ? 1 : null  // any non-null value >=1 with questions.length > 0 will mark as passed below
  );

  // Sync with external mode prop
  React.useEffect(() => {
    if (mode === 'review') setIsReview(true);
  }, [mode]);

  // Auto-complete FAQ when reaching the final question
  React.useEffect(() => {
    if (isSubjectiveSet && phase === 'quiz' && currentQ === questions.length - 1 && !isReview) {
      onComplete(questions.length);
    }
  }, [isSubjectiveSet, phase, currentQ, questions.length, onComplete, isReview]);
  const handleStart = (reviewMode = false) => {
    setAnswers(new Array(questions.length).fill(undefined));
    setCurrentQ(0);
    setIsReview(reviewMode);
    setPhase('quiz');
    if (!reviewMode && onStart) onStart();
  };

  const handleAnswer = (val: any) => {
    if (isReview) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = val;
      return next;
    });
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      if (isReview) {
        setPhase('start');
      } else {
        // Calculate score exactly once on submission
        // SA (subjective) questions: count as correct if learner submitted any text
        const currentResults = questions.map((q, i) => {
          const userAnswer = answers[i];
          if (isSubjective(q)) {
            // SA (FAQ read-only): viewing the answer = full credit, always true
            return true;
          }
          const correctIdx = q.options?.findIndex(o => o.answer);
          return userAnswer === correctIdx;
        });
        const finalScore = currentResults.filter(r => r).length;

        setLastScore(finalScore);  // track last score to determine if passed
        setPhase('result');
        onComplete(finalScore);
      }
    }
  };

  // Replay: go back to quiz phase (not start), onStart callback fires again
  const handleReplay = () => {
    setAnswers(new Array(questions.length).fill(undefined));
    setCurrentQ(0);
    setIsReview(false);
    setPhase('quiz');
    if (onStart) onStart();
  };

  // Review from results: go to quiz in review mode
  const handleReviewFromResults = () => {
    setCurrentQ(0);
    setIsReview(true);
    setPhase('quiz');
  };

  const results = useMemo(() => {
    return questions.map((q, i) => {
      const userAnswer = answers[i];
      if (isSubjective(q)) {
        // SA (FAQ read-only): always passes — viewing = completed
        return { q, isCorrect: true, isSubjectiveQ: true, submittedText: '' };
      }
      const correctIdx = q.options?.findIndex(o => o.answer);
      return { q, isCorrect: userAnswer === correctIdx, isSubjectiveQ: false, submittedText: '' };
    });
  }, [questions, answers]);

  const score = results.filter(r => r.isCorrect).length;

  if (questions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: '16px', border: '1px dashed #E5E7EB' }}>
        <HelpOutlineRoundedIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
        <Typography sx={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>No questions available in this quiz.</Typography>
      </Box>
    );
  }

  // Derive whether the learner has already passed:
  // - Based on last completed score in this session, OR
  // - Based on initiallyPassed prop (from backend initialProgress >= 70%) — persists across remounts
  const alreadyPassed = initiallyPassed || (lastScore !== null && questions.length > 0 && (lastScore / questions.length) * 100 >= 70);

  if (phase === 'start') {
    return <StartScreen name={name} description={description} questionsetDescription={questionsetDescription} sectionName={sectionName} sectionDescription={sectionDescription} questionCount={questions.length} passed={alreadyPassed} instructions={instructions} isSubjectiveSet={isSubjectiveSet} onStart={handleStart} />;
  }

  if (phase === 'quiz') {
    return (
      <QuestionScreen
        question={questions[currentQ]} qIndex={currentQ} total={questions.length}
        answer={answers[currentQ]} reviewMode={isReview} onAnswer={handleAnswer} onNext={handleNext} isLast={currentQ === questions.length - 1}
      />
    );
  }

  return (
    <ResultScreen
      score={score}
      total={questions.length}
      results={results}
      onReplay={handleReplay}
      onReview={handleReviewFromResults}
    />
  );
};

export default QuestionSetPlayer;
