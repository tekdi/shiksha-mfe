'use client';

import { useEffect, useRef, useCallback } from 'react';
import { startSwadhaarLessonAttempt, updateSwadhaarAttemptProgress } from '@learner/utils/API/SwadhaarService';
import { telemetryFactory } from '@learner/utils/telemtery';

interface TrackingParams {
  contentId: string;
  courseId: string;
  moduleId: string;
  subtopicId?: string;
  lessonId?: string;
  /** LMS attempt the progress is saved to; lessons that have not been started have none */
  attemptId?: string;
  /** Lessons that cannot be played in the app (quizzes) should not start an attempt */
  trackable?: boolean;
  onComplete?: () => void;
  setStatusData?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useContentTracking = ({
  contentId,
  courseId,
  moduleId,
  subtopicId,
  lessonId,
  attemptId,
  trackable = true,
  onComplete,
  setStatusData,
}: TrackingParams) => {
  const lastProgressRef = useRef(0);
  const lastApiProgressRef = useRef(0);
  const completedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const openedAtRef = useRef(Date.now());
  // Resolves to the attempt progress is saved to: the lesson's existing attempt, or one started on open
  const attemptRef = useRef<Promise<string | undefined>>(Promise.resolve(undefined));

  useEffect(() => {
    if (!contentId || !trackable) return;
    attemptRef.current = attemptId
      ? Promise.resolve(attemptId)
      : startSwadhaarLessonAttempt(contentId, courseId, moduleId)
          .then((attempt) => attempt?.lessonTrackId as string)
          .catch((err) => {
            console.warn(`[TRACKING] Could not start an attempt for lesson ${contentId}`, err);
            return undefined;
          });
  }, [contentId, attemptId, trackable, courseId, moduleId]);

  /* ───────────────── INIT USER ───────────────── */
  useEffect(() => {
    userIdRef.current = localStorage.getItem('userId');
  }, []);

  /* ───────────────── API CALLER ───────────────── */
  const sendProgressToBackend = useCallback(async (percentage: number, isFinal: boolean = false, score?: number) => {
    if (!userIdRef.current || !contentId) return;
    const currentAttemptId = await attemptRef.current;
    if (!currentAttemptId) {
      console.warn(`[TRACKING] No LMS attempt for lesson ${contentId}; progress not saved`);
      return;
    }

    try {
      await updateSwadhaarAttemptProgress(currentAttemptId, {
        status: isFinal ? 'completed' : 'incomplete',
        lessonId: contentId,
        totalContent: 100,
        currentPosition: Math.round(percentage),
        timeSpent: Math.round((Date.now() - openedAtRef.current) / 1000),
      });
      lastApiProgressRef.current = percentage;
    } catch (err) {
      console.warn('[TRACKING] Sync Failed:', err);
    }
  }, [contentId]);

  /* ───────────────── COMPLETE HANDLER ───────────────── */
  const handleComplete = useCallback(async (score?: number) => {
    const userId = userIdRef.current;
    if (!userId || !contentId || completedRef.current) return;

    console.log(`[TRACKING] handleComplete triggered: ID=${contentId}, Score=${score}`);
    completedRef.current = true;
    lastProgressRef.current = 100;

    // 1. Update UI state instantly (Local cache update)
    setStatusData?.((prev) => {
      const newData = [...prev];
      const idx = newData.findIndex(d => d.contentId === contentId);
      const update = { 
        contentId: contentId, 
        status: 2, 
        completionPercentage: 100, 
        attempts: (newData[idx]?.attempts || 0) + 1 
      };
      if (idx >= 0) newData[idx] = update;
      else newData.push(update);
      return newData;
    });

    // 2. Component Callback (Trigger modal/next-steps early for snappier UI)
    if (onComplete) {
      console.log('[TRACKING] Calling onComplete callback early');
      onComplete();
    }

    // 3. Telemetry Event
    telemetryFactory.interact({
      eid: 'INTERACT',
      edata: {
        id: 'content-completed',
        type: 'workflow',
        pageid: 'lesson-player',
        uid: userId,
        contentId,
        score
      },
    });

    // 4. Final API Sync (Run in background)
    sendProgressToBackend(100, true, score);
  }, [contentId, sendProgressToBackend, onComplete, setStatusData]);

  /* ───────────────── PROGRESS HANDLER ───────────────── */
  const handleProgress = useCallback((percentage: number) => {
    if (!contentId || completedRef.current) return;
    
    const cappedPercent = Math.min(100, Math.max(0, percentage));

    if (cappedPercent > lastProgressRef.current) {
      lastProgressRef.current = cappedPercent;

      // Update UI state (Optimistic)
      setStatusData?.((prev) => {
        const newData = [...prev];
        const idx = newData.findIndex(d => d.contentId === contentId);
        if (idx >= 0) {
          newData[idx] = { ...newData[idx], completionPercentage: cappedPercent, status: 1 };
        } else {
          newData.push({ contentId, completionPercentage: cappedPercent, status: 1 });
        }
        return newData;
      });

      // Report to backend periodically or at major milestones
      if (cappedPercent >= 95 || cappedPercent > lastApiProgressRef.current + 2) {
        console.log(`[TRACKING] Reporting milestones to backend: ID=${contentId}, Percent=${cappedPercent}%`);
        sendProgressToBackend(cappedPercent, false);
      }
    }
  }, [contentId, sendProgressToBackend, setStatusData]);

  return {
    handleProgress,
    handleComplete,
  };
};
