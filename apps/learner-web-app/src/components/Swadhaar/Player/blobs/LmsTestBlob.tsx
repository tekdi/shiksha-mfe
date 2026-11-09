'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Radio, Typography } from '@mui/material';
import {
  updateSwadhaarAttemptProgress,
  fetchSwadhaarAttemptAnswers,
  swadhaarErrorMessage,
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
      .map(
        (a) =>
          [
            a.questionId,
            a.answer?.selectedOptionIds ||
              a.selectedOptionIds ||
              (a.userAnswer?.selectedOptions || []).map((o: any) => o.optionId),
          ] as const
      )
      .filter(([id, ids]) => id && ids.length > 0)
  );
};

/** Total marks of a test (its questions' marks) and its passing mark, which is a percentage of the total. */
const testMeta = (result: any) => {
  const root = result?.test ?? result ?? {};
  const questions: any[] = (root.sections || []).flatMap((section: any) => section.questions || []);
  const sum = questions.reduce((total, q) => total + (Number(q.marks) || 0), 0);
  return { total: sum || Number(root.totalMarks) || 0, passingPercent: Number(root.passingMarks) || 0 };
};
type TestMeta = ReturnType<typeof testMeta>;

/** Passed when the score reaches the passing percentage of the total marks; null when that cannot be worked out. */
const passedByPercent = (score: unknown, meta: TestMeta): boolean | null => {
  const value = Number(score);
  if (!meta.total || !meta.passingPercent || score === undefined || score === null || Number.isNaN(value)) return null;
  return (value / meta.total) * 100 >= meta.passingPercent;
};

// The assessment service answers result "P" (pass) or "F" (fail)
const hasFailed = (result: any): boolean => {
  const code = String(result?.result ?? result?.resultStatus ?? '').trim().toUpperCase();
  return result?.passed === false || code === 'F' || /FAIL/.test(code) || /fail/i.test(String(result?.status ?? ''));
};

const errorMessage = swadhaarErrorMessage;

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
  // Bumped by "Try again" to start a fresh attempt after a failed one
  const [retryKey, setRetryKey] = useState(0);
  const forceStartRef = useRef(false);
  // The LMS tracking row of this lesson (started below), the one a completed update goes to
  const lessonAttemptRef = useRef<string | undefined>(undefined);
  const metaRef = useRef<TestMeta>({ total: 0, passingPercent: 0 });

  /**
   * The service answers F when it reads the pass mark as raw marks, so a score that passes by percentage is
   * reported to the LMS lesson here; the lesson tracking is not updated by the service in that case.
   */
  const reportPassToLms = async (rawScore?: unknown) => {
    const attemptId = lessonAttemptRef.current;
    if (!attemptId) {
      console.warn(`[TEST] No LMS attempt for lesson ${lessonId}; the pass was not saved`);
      return;
    }
    try {
      await updateSwadhaarAttemptProgress(attemptId, {
        status: 'completed',
        lessonId,
        totalContent: 100,
        currentPosition: 100,
        timeSpent: Math.round((Date.now() - openedAt.current) / 1000),
        completionPercentage: 100,
        ...(Number.isFinite(Number(rawScore)) && rawScore !== null && rawScore !== undefined ? { score: Number(rawScore) } : {}),
      });
    } catch (err) {
      console.warn(`[TEST] Could not save the pass for lesson ${lessonId}`, err);
    }
  };

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
    const testPromise = fetchSwadhaarTest(testId).then((result) => {
      metaRef.current = testMeta(result);
      return result;
    });
    const prepareAttempt = async () => {
      await testPromise;
      // The LMS needs its own tracking row first, or the score never reaches the lesson
      if (courseId && moduleId) {
        const lessonAttempt = await startSwadhaarLessonAttempt(lessonId, courseId, moduleId).catch((err) => {
          console.warn(`[TEST] Could not start the lesson attempt for ${lessonId}`, err);
          return undefined;
        });
        lessonAttemptRef.current = lessonAttempt?.lessonTrackId || lessonAttempt?.attemptId || lessonAttempt?.id;
      }
      // "Try again" goes straight to a new attempt; opening the lesson decides the screen from the status
      const forceStart = forceStartRef.current;
      forceStartRef.current = false;
      const status = forceStart ? null : await fetchSwadhaarTestStatus(testId);
      if (status) {
        const resumeId = status.lastAttempt?.attemptId;
        if (status.canResume && resumeId) {
          attemptIdRef.current = resumeId;
          const saved = await resumeSwadhaarTestAttempt(resumeId).catch(() => null);
          return readSavedAnswers(saved);
        }
        // Only canAttempt decides: after a fail the attempts made can pass the attempts allowed
        const last = status.gradedAttempt ?? status.lastAttempt;
        const score = last?.score ?? last?.obtainedMarks;
        const total = metaRef.current.total || last?.totalMarks || last?.maxScore;
        // The pass mark is a percentage of the total, so the score decides, not the service's P/F
        const passed = passedByPercent(score, metaRef.current) ?? String(last?.result ?? '').toUpperCase() === 'P';
        if (!passed && status.canAttempt === true && (status.attemptsMade ?? 0) > 0) {
          // Last attempt failed: show its score with a Retake button
          setSubmitted({ score, totalMarks: total, result: 'F', fromStatus: true });
          return {};
        }
        if (passed || status.canAttempt === false) {
          const underReview = !passed && (!last?.result || String(last?.reviewStatus ?? '').toUpperCase() === 'P');
          setAttemptNote(
            passed
              ? 'You have passed this assessment.'
              : underReview
                ? 'Your attempt is under review.'
                : 'You have no attempts left for this assessment.'
          );
          setReviewMode(true);
          if (score !== undefined && total !== undefined) setLastScore(`${score} / ${total}`);
          else if (score !== undefined) setLastScore(String(score));
          // The service may have recorded a fail for a score that passes by percentage: the lesson still completes
          if (passed && String(last?.result ?? '').toUpperCase() !== 'P') {
            await reportPassToLms(score);
            onComplete();
          }
          const given = last?.attemptId ? await fetchSwadhaarAttemptAnswers(last.attemptId).catch(() => null) : null;
          return readSavedAnswers(given);
        }
      }
      // start is called once here, never on Submit
      try {
        const attempt = await startSwadhaarTestAttempt(testId);
        attemptIdRef.current = attempt?.attemptId || attempt?.id;
      } catch (err: any) {
        const message = String(err?.response?.data?.params?.errmsg || err?.response?.data?.message || err?.message || '');
        if (!/maximum attempts|max attempts/i.test(message)) throw err;
        // The learner has already passed or has no attempts left: show that instead of a raw error
        setAttemptNote('You have no attempts left for this assessment.');
        setReviewMode(true);
      }
      return {};
    };
    Promise.all([testPromise, prepareAttempt()])
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
  }, [testId, lessonId, courseId, moduleId, retryKey]);

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
      const byPercent = passedByPercent(result?.score ?? result?.obtainedMarks, metaRef.current);
      const failed = byPercent === null ? hasFailed(result) : !byPercent;
      const underReview = String(result?.reviewStatus ?? '').toUpperCase() === 'P';
      if (!failed && !underReview) {
        // Passed: the submitted assessment stays on screen to review, with the answers as given
        const score = result?.score ?? result?.obtainedMarks;
        const total = metaRef.current.total || result?.totalMarks || result?.maxScore;
        setAttemptNote('You have passed this assessment.');
        setLastScore(score !== undefined ? (total !== undefined ? `${score} / ${total}` : String(score)) : null);
        setReviewMode(true);
      } else {
        setSubmitted(failed ? { ...result, result: 'F', totalMarks: metaRef.current.total || result?.totalMarks } : result);
      }
      // A failed attempt is recorded as submitted by the LMS, so only a pass unlocks the next lesson
      if (!failed && !underReview) {
        if (String(result?.result ?? '').toUpperCase() !== 'P') await reportPassToLms(result?.score ?? result?.obtainedMarks);
        onComplete();
      }
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
    const underReview = String(submitted.reviewStatus ?? '').toUpperCase() === 'P';
    return (
      <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', mb: 0.5 }}>
          {underReview
            ? 'Submitted for review'
            : hasFailed(submitted)
              ? `Not passed${score !== undefined ? ` – score ${score}` : ''}`
              : 'Passed'}
        </Typography>
        {score !== undefined && total !== undefined && !underReview && (
          <Typography sx={{ fontSize: 14, color: '#4B5563' }}>
            Your score: {score} / {total}
          </Typography>
        )}
        {hasFailed(submitted) && !underReview && (
          <Button
            variant="contained"
            onClick={() => {
              forceStartRef.current = true;
              setRetryKey((k) => k + 1);
            }}
            sx={{ mt: 2, bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            Retake
          </Button>
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
