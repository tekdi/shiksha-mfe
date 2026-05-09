'use client';

import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

/* ─── Types ─────────────────────────────────────────────── */
export interface QuestionOption {
  body: string;
  answer: boolean;
}

export interface Question {
  identifier?: string;
  body?: string;          
  name?: string;
  qType?: string;         
  options?: QuestionOption[];
  children?: Question[];  
  editorState?: {
    options?: any[];
    question?: string;
  };
  interactions?: any;
}

interface QuestionSetPlayerProps {
  name: string;
  questions: Question[];
  maxAttempts?: number;
  currentAttempts?: number;
  learnerName?: string;
  onStart?: () => void;
  onComplete: (score: number) => void;
  mode?: 'play' | 'review';
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

function normalizeQuestions(raw: Question[]): Question[] {
  return raw.map((q) => {
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
  questionCount: number;
  maxAttempts: number;
  currentAttempts: number;
  onStart: (reviewMode?: boolean) => void;
}> = ({ name, questionCount, maxAttempts, currentAttempts, onStart }) => {
  // Sunbird-style: show currentAttempts/maxAttempts (e.g., "3/5")
  // Replay is disabled when currentAttempts >= maxAttempts
  const isExhausted = currentAttempts >= maxAttempts;
  const attemptsRemaining = Math.max(0, maxAttempts - currentAttempts);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Quiz Title Card */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }} />
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#1F2937' }}>{name}</Typography>
          <Typography sx={{ fontSize: 12, color: PRIMARY, fontWeight: 700, mt: 0.5 }}>Quiz</Typography>
        </Box>
      </Box>

      {/* Instructions Card */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }} />
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#1F2937', mb: 1 }}>Before you begin</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>• Read each question carefully before selecting an answer.</Typography>
            <Typography sx={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>• You can skip a question and return to it later.</Typography>
            <Typography sx={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>• Score 70% or above to pass and unlock the next lesson.</Typography>
            <Typography sx={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>• Total Questions: {questionCount}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Attempts Card — Sunbird-style: shows currentAttempts / maxAttempts */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: `1px solid ${isExhausted ? ERROR_RED : '#E5E7EB'}`, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: isExhausted ? ERROR_RED : DARK_NAV, px: 2, py: 1 }}>
          <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {isExhausted ? 'No Attempts Remaining' : 'Attempts'}
          </Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            {/* Sunbird format: "currentAttempts / maxAttempts" */}
            <Typography sx={{ fontWeight: 800, fontSize: 28, color: isExhausted ? ERROR_RED : DARK_NAV, lineHeight: 1 }}>
              {currentAttempts}<Typography component="span" sx={{ fontSize: 16, color: '#9CA3AF', fontWeight: 600 }}>/{maxAttempts}</Typography>
            </Typography>
            <Typography sx={{ fontSize: 11, color: isExhausted ? ERROR_RED : '#6B7280', fontWeight: 600, mt: 0.5 }}>
              {isExhausted ? 'All attempts used' : `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`}
            </Typography>
          </Box>
          {/* Progress dots */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {Array.from({ length: maxAttempts }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  bgcolor: i < currentAttempts ? (isExhausted ? ERROR_RED : PRIMARY) : '#E5E7EB',
                  transition: 'background-color 0.3s'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      {isExhausted ? (
        // When all attempts used: only allow Review (no replay)
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
        // When attempts available: show Start/Replay Quiz
        <Button
          fullWidth
          variant="contained"
          onClick={() => onStart(false)}
          startIcon={currentAttempts > 0 ? <ReplayRoundedIcon /> : undefined}
          sx={{ 
            mt: 1, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', 
            fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 16, 
            boxShadow: '0 6px 16px rgba(230,135,60,0.35)', 
            '&:hover': { bgcolor: '#D1752D' } 
          }}
        >
          {currentAttempts > 0 ? 'Replay Quiz' : 'Start Quiz'}
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

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{reviewMode ? 'Review Mode' : 'Multiple Choice Question'}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>{qIndex + 1}/{total}</Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        {/* Progress bar */}
        <LinearProgress 
          variant="determinate" 
          value={((qIndex + 1) / total) * 100} 
          sx={{ height: 4, borderRadius: 2, mb: 2, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: reviewMode ? DARK_NAV : PRIMARY } }} 
        />
        
        <Typography sx={{ fontSize: 11, color: PRIMARY, fontWeight: 700, mb: 0.5 }}>Quiz</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1F2937', mb: 3, lineHeight: 1.4 }}>{stripHtml(questionText)}</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {opts.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx);
            const isSelected = answer === idx;
            const isCorrect = opt.answer;
            
            let borderColor = isSelected ? PRIMARY : '#F3F4F6';
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
                  overflow: 'hidden'
                }}
              >
                {(isSelected || (reviewMode && isCorrect)) && <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, bgcolor: reviewMode ? (isCorrect ? SUCCESS_GREEN : ERROR_RED) : PRIMARY }} />}
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px', bgcolor: reviewMode ? (isCorrect ? SUCCESS_GREEN : (isSelected ? ERROR_RED : '#F3F4F6')) : (isSelected ? PRIMARY : '#F3F4F6'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: (isSelected || (reviewMode && isCorrect)) ? '#fff' : '#6B7280' }}>{label}</Typography>
                </Box>
                <Typography sx={{ fontSize: 14, color: '#374151', fontWeight: (isSelected || (reviewMode && isCorrect)) ? 700 : 500, flex: 1 }}>{stripHtml(opt.body)}</Typography>
                {reviewMode && isCorrect && <CheckCircleRoundedIcon sx={{ color: SUCCESS_GREEN, fontSize: 20 }} />}
                {reviewMode && isSelected && !isCorrect && <CancelRoundedIcon sx={{ color: ERROR_RED, fontSize: 20 }} />}
              </Box>
            );
          })}
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={onNext}
          disabled={!reviewMode && answer === undefined}
          sx={{ 
            mt: 4, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', 
            fontWeight: 800, textTransform: 'none', py: 1.8, fontSize: 15,
            boxShadow: '0 4px 12px rgba(230,135,60,0.25)', 
            '&:hover': { bgcolor: '#D1752D' }, 
            '&.Mui-disabled': { bgcolor: '#F3F4F6', color: '#9CA3AF' } 
          }}
        >
          {isLast ? (reviewMode ? 'Close Review' : 'Submit') : 'Next Question'}
        </Button>
      </Box>
    </Box>
  );
};

/* ─── Phase 3: Result Screen ────────────────────────────── */
const ResultScreen: React.FC<{
  score: number;
  total: number;
  currentAttempts: number;
  maxAttempts: number;
  results: { q: Question; isCorrect: boolean }[];
  onReplay: () => void;
  onReview: () => void;
}> = ({ score, total, currentAttempts, maxAttempts, results, onReplay, onReview }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 70;
  const canReplay = currentAttempts < maxAttempts;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Score Circle */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }} />
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
                  <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* Score Details */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }}>
          <Typography sx={{ color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Results</Typography>
        </Box>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: DARK_NAV }}>
              {score}<Typography component="span" sx={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>/{total}</Typography>
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Correct Answers</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: DARK_NAV }}>
              {currentAttempts}<Typography component="span" sx={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>/{maxAttempts}</Typography>
            </Typography>
            <Typography sx={{ fontSize: 11, color: canReplay ? '#6B7280' : ERROR_RED, fontWeight: 600 }}>
              {canReplay ? 'Attempts Used' : 'No Attempts Left'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Question Results */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {results.map(({ q, isCorrect }, i) => (
          <Box key={i} sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }} />
            <Box sx={{ p: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#1F2937' }}>Q{i+1}: {stripHtml(q.editorState?.question || q.body || q.name || '')}</Typography>
              <Typography sx={{ fontSize: 11, color: isCorrect ? SUCCESS_GREEN : ERROR_RED, fontWeight: 700, mt: 0.5 }}>{isCorrect ? 'Correct' : 'Incorrect'}</Typography>
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
        {canReplay ? (
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
            Replay ({maxAttempts - currentAttempts} left)
          </Button>
        ) : (
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
            No Attempts Left
          </Button>
        )}
      </Box>
    </Box>
  );
};

/* ─── Main QuestionSetPlayer ────────────────────────────── */
export const QuestionSetPlayer: React.FC<QuestionSetPlayerProps> = ({
  name,
  questions: rawQuestions,
  maxAttempts = 5,
  currentAttempts = 0,
  onStart,
  onComplete,
  mode,
}) => {
  const questions = useMemo(() => normalizeQuestions(rawQuestions || []), [rawQuestions]);
  const [phase, setPhase] = useState<'start' | 'quiz' | 'result'>('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isReview, setIsReview] = useState(mode === 'review');

  // Sync with external mode prop
  React.useEffect(() => {
    if (mode === 'review') setIsReview(true);
  }, [mode]);

  // ✅ Auto-complete when reaching results
  React.useEffect(() => {
    if (phase === 'result' && !isReview) {
      const results = questions.map((q, i) => {
        const userAnswer = answers[i];
        const correctIdx = q.options?.findIndex(o => o.answer);
        return userAnswer === correctIdx;
      });
      const score = results.filter(r => r).length;
      onComplete(score);
    }
  }, [phase, questions, answers, onComplete, isReview]);

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
        setPhase('result');
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
      const correctIdx = q.options?.findIndex(o => o.answer);
      return { q, isCorrect: userAnswer === correctIdx };
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

  if (phase === 'start') {
    return <StartScreen name={name} questionCount={questions.length} maxAttempts={maxAttempts} currentAttempts={currentAttempts} onStart={handleStart} />;
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
      currentAttempts={currentAttempts}
      maxAttempts={maxAttempts}
      results={results} 
      onReplay={handleReplay}
      onReview={handleReviewFromResults}
    />
  );
};

export default QuestionSetPlayer;
