'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Radio, Typography } from '@mui/material';
import {
  fetchSwadhaarAttemptAnswers,
  fetchSwadhaarTest,
  fetchSwadhaarTestStatus,
  resumeSwadhaarTestAttempt,
  startSwadhaarLessonAttempt,
  saveSwadhaarTestAnswers,
  startSwadhaarTestAttempt,
  submitSwadhaarTestAttempt,
} from '@learner/utils/API/SwadhaarService';

const PRIMARY = '#E6873C';

interface TestOption {
  id: string;
  text: string;
}

interface TestQuestion {
  id: string;
  text: string;
  multiple: boolean;
  options: TestOption[];
}

export interface LmsTestBlobProps {
  testId: string;
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  onComplete: () => void;
}

/** Questions of GET assessment/v1/tests/:id/hierarchy, flattened across sections. */
const readQuestions = (result: any): TestQuestion[] => {
  const root = result?.test ?? result ?? {};
  const raw: any[] = [
    ...(root.sections || []).flatMap((section: any) => (section.questions || []).map((item: any) => item.question ?? item)),
    ...(root.questions || []),
  ];
  return raw.map((q, qIdx) => ({
    id: q.questionId || q.id || `q-${qIdx}`,
    text: q.text || '',
    multiple: Boolean(q.allowPartialScoring) || String(q.type || '').includes('multi'),
    options: [...(q.options || [])]
      .sort((a: any, b: any) => (a.position ?? a.ordering ?? 0) - (b.position ?? b.ordering ?? 0))
      .map((opt: any, oIdx: number) => ({
        id: opt.questionOptionId || opt.optionId || opt.id || `o-${qIdx}-${oIdx}`,
        text: opt.text || '',
      })),
  }));
};

/** Saved answers of GET attempts/:id/resume/:userId as { questionId: optionIds[] } */
const readSavedAnswers = (saved: any): Record<string, string[]> => {
  const list: any[] = Array.isArray(saved) ? saved : saved?.answers || saved?.attempt?.answers || [];
  return Object.fromEntries(
    list
      .map((a) => [a.questionId, a.answer?.selectedOptionIds || a.selectedOptionIds || []] as const)
      .filter(([id, ids]) => id && ids.length > 0)
  );
};

const hasFailed = (result: any): boolean =>
  result?.passed === false || /fail/i.test(String(result?.result ?? result?.resultStatus ?? result?.status ?? ''));

const errorMessage = (err: any): string =>
  err?.response?.data?.params?.errmsg || err?.message || 'Something went wrong. Please try again.';

/** Lets the learner take an assessment lesson: read the questions, answer, and submit the attempt. */
export const LmsTestBlob: React.FC<LmsTestBlobProps> = ({ testId, lessonId, courseId, moduleId, onComplete }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const openedAt = useRef(Date.now());
  // Attempt the answers are saved to: the learner's in-progress one, or one started once when the lesson opens
  const attemptIdRef = useRef<string | undefined>(undefined);
  const [attemptNote, setAttemptNote] = useState<string | null>(null);
  // No attempts left: the questions are shown read-only with the learner's last answers
  const [reviewMode, setReviewMode] = useState(false);
  const [lastScore, setLastScore] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    setAnswers({});
    setSubmitted(null);
    setLoadError(null);
    attemptIdRef.current = undefined;
    setAttemptNote(null);
    setReviewMode(false);
    setLastScore(null);
    const prepareAttempt = async () => {
      // The LMS needs its own tracking row first, or the score never reaches the lesson
      if (courseId && moduleId) {
        await startSwadhaarLessonAttempt(lessonId, courseId, moduleId).catch((err) =>
          console.warn(`[TEST] Could not start the lesson attempt for ${lessonId}`, err)
        );
      }
      const status = await fetchSwadhaarTestStatus(testId);
      const resumeId = status?.lastAttempt?.attemptId;
      if (status?.canResume && resumeId) {
        attemptIdRef.current = resumeId;
        const saved = await resumeSwadhaarTestAttempt(resumeId).catch(() => null);
        return readSavedAnswers(saved);
      }
      if (status?.canAttempt === false) {
        setAttemptNote('You have no attempts left for this assessment.');
        setReviewMode(true);
        const last = status?.lastAttempt;
        const score = last?.score ?? last?.obtainedMarks;
        const total = last?.totalMarks ?? last?.maxScore;
        if (score !== undefined && total !== undefined) setLastScore(`${score} / ${total}`);
        const given = last?.attemptId ? await fetchSwadhaarAttemptAnswers(last.attemptId).catch(() => null) : null;
        return readSavedAnswers(given);
      }
      // start is called once here, never on Submit
      const attempt = await startSwadhaarTestAttempt(testId);
      attemptIdRef.current = attempt?.attemptId || attempt?.id;
      return {};
    };
    Promise.all([fetchSwadhaarTest(testId), prepareAttempt()])
      .then(([result, savedAnswers]) => {
        if (cancelled) return;
        setTitle(result?.test?.title || result?.title || '');
        setQuestions(readQuestions(result));
        setAnswers(savedAnswers);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [testId, lessonId, courseId, moduleId]);

  const allAnswered = useMemo(
    () => Boolean(questions?.length) && questions!.every((q) => (answers[q.id] || []).length > 0),
    [questions, answers]
  );

  const choose = (question: TestQuestion, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[question.id] || [];
      if (!question.multiple) return { ...prev, [question.id]: [optionId] };
      return {
        ...prev,
        [question.id]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!questions) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const attemptId = attemptIdRef.current;
      if (!attemptId) throw new Error(attemptNote || 'There is no active attempt to submit.');
      await saveSwadhaarTestAnswers(
        attemptId,
        questions.map((q) => ({ questionId: q.id, answer: { selectedOptionIds: answers[q.id] || [] } })),
        Math.round((Date.now() - openedAt.current) / 1000)
      );
      const result = await submitSwadhaarTestAttempt(attemptId);
      setSubmitted(result);
      // A failed attempt is recorded as submitted by the LMS, so only a pass unlocks the next lesson
      if (!hasFailed(result)) onComplete();
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 14, color: '#B91C1C' }}>{loadError}</Typography>
      </Box>
    );
  }
  if (!questions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160 }}>
        <CircularProgress size={32} sx={{ color: PRIMARY }} />
      </Box>
    );
  }
  if (attemptNote && !attemptIdRef.current && !reviewMode) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 14, color: '#4B5563' }}>{attemptNote}</Typography>
      </Box>
    );
  }
  if (questions.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 14, color: '#4B5563' }}>This assessment has no questions yet.</Typography>
      </Box>
    );
  }
  if (submitted) {
    const score = submitted.score ?? submitted.obtainedMarks;
    const total = submitted.totalMarks ?? submitted.maxScore;
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', mb: 0.5 }}>
          {hasFailed(submitted) ? 'Assessment submitted. You did not reach the pass mark.' : 'Assessment submitted'}
        </Typography>
        {score !== undefined && total !== undefined && (
          <Typography sx={{ fontSize: 14, color: '#4B5563' }}>
            Your score: {score} / {total}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fff', p: 2 }}>
      {title && <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', mb: 2 }}>{title}</Typography>}
      {reviewMode && (
        <Typography sx={{ fontSize: 13, color: '#4B5563', mb: 2 }}>
          {attemptNote} Here are your answers.{lastScore ? ` Your score: ${lastScore}.` : ''}
        </Typography>
      )}
      {questions.map((q, qIdx) => (
        <Box key={q.id} sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', mb: 1 }}>
            {qIdx + 1}. {q.text}
          </Typography>
          {q.options.map((opt) => {
            const selected = (answers[q.id] || []).includes(opt.id);
            const Control = q.multiple ? Checkbox : Radio;
            return (
              <Box
                key={opt.id}
                onClick={() => !reviewMode && choose(q, opt.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1,
                  py: 0.5,
                  mb: 0.75,
                  cursor: reviewMode ? 'default' : 'pointer',
                  borderRadius: '8px',
                  border: `1px solid ${selected ? PRIMARY : '#E5E7EB'}`,
                  bgcolor: selected ? '#FFF7F0' : '#fff',
                }}
              >
                <Control checked={selected} disabled={reviewMode} sx={{ color: '#9CA3AF', '&.Mui-checked': { color: PRIMARY } }} />
                <Typography sx={{ fontSize: 13, color: '#1F2937' }}>{opt.text}</Typography>
              </Box>
            );
          })}
        </Box>
      ))}
      {!reviewMode && submitError && <Typography sx={{ fontSize: 13, color: '#B91C1C', mb: 1 }}>{submitError}</Typography>}
      {!reviewMode && (
      <Button
        variant="contained"
        disabled={!allAnswered || submitting}
        onClick={handleSubmit}
        sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </Button>
      )}
    </Box>
  );
};
