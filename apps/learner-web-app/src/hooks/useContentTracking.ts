'use client';

import { useEffect, useRef, useCallback } from 'react';
import { updateContentStatus, syncContentProgressTelemetry } from '@learner/utils/API/SwadhaarService';
import { telemetryFactory } from '@learner/utils/telemtery';

interface TrackingParams {
  contentId: string;
  courseId: string;
  moduleId: string;
  subtopicId?: string;
  lessonId?: string;
  onComplete?: () => void;
  setStatusData?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useContentTracking = ({
  contentId,
  courseId,
  moduleId,
  subtopicId,
  lessonId,
  onComplete,
  setStatusData,
}: TrackingParams) => {
  const lastProgressRef = useRef(0);
  const lastApiProgressRef = useRef(0);
  const completedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  /* ───────────────── INIT USER ───────────────── */
  useEffect(() => {
    userIdRef.current = localStorage.getItem('userId');
  }, []);

  /* ───────────────── API CALLER ───────────────── */
  const sendProgressToBackend = useCallback(async (percentage: number, isFinal: boolean = false, score?: number) => {
    const userId = userIdRef.current;
    if (!userId || !contentId) return;

    try {
      const status = isFinal ? 2 : 1;
      const statusString = isFinal ? 'completed' : 'in-progress';

      // 1. Sync granular telemetry progress (Working pattern for all 0-100% updates)
      await syncContentProgressTelemetry({
        userId,
        courseId,
        contentId,
        unitId: subtopicId || moduleId || contentId,
        percentage,
        status: statusString,
      });

      // 2. Update completion status (Working pattern for marking 'completed')
      if (isFinal) {
        await updateContentStatus({
          userId,
          courseId: courseId,
          contentId: contentId,
          status: status,
          completionPercentage: 100,
          moduleId: moduleId,
          score,
        });
      }

      lastApiProgressRef.current = percentage;
      console.log('[TRACKING SYNCED]', { contentId, percentage, isFinal, score });
    } catch (err) {
      console.warn('[TRACK ERROR]', err);
    }
  }, [contentId, courseId, moduleId, subtopicId]);

  /* ───────────────── COMPLETE HANDLER ───────────────── */
  const handleComplete = useCallback(async (score?: number) => {
    const userId = userIdRef.current;
    if (!userId || !contentId || completedRef.current) return;

    completedRef.current = true;
    lastProgressRef.current = 100;

    console.log('[TRACKING] handleComplete triggered for:', contentId, 'score:', score);

    // Sync UI instantly (only for the content being tracked)
    setStatusData?.((prev) => {
      const newData = [...prev];
      const existingIndex = newData.findIndex(d => d.contentId === contentId);
      const update = { contentId: contentId, status: 2, completionPercentage: 100, attempts: (newData[existingIndex]?.attempts || 0) + 1 };
      if (existingIndex >= 0) newData[existingIndex] = update;
      else newData.push(update);
      return newData;
    });

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

    // ✅ Final Completion API Call
    await sendProgressToBackend(100, true, score);
    onComplete?.();
  }, [contentId, subtopicId, moduleId, courseId, sendProgressToBackend, onComplete, setStatusData]);

  /* ───────────────── PROGRESS HANDLER ───────────────── */
  const handleProgress = useCallback((percentage: number) => {
    if (!contentId || completedRef.current) return;
    console.log('[TRACKING] handleProgress:', { contentId, percentage, current: lastProgressRef.current });

    if (percentage > lastProgressRef.current) {
      lastProgressRef.current = percentage;

      // ✅ Update UI immediately for real-time feedback (only for the content being tracked)
      setStatusData?.((prev) => {
        const newData = [...prev];
        const existingIndex = newData.findIndex(d => d.contentId === contentId);
        const update = { contentId: contentId, status: 1, completionPercentage: percentage };
        if (existingIndex >= 0) {
          newData[existingIndex] = update;
        } else {
          newData.push(update);
        }
        return newData;
      });
      
      // Throttle API calls to every 5% progress increment or final completion
      if (percentage - lastApiProgressRef.current >= 5 || percentage >= 95) {
        console.log('[TRACKING TRIGGER]', { percentage, last: lastApiProgressRef.current });
        sendProgressToBackend(percentage, false);
      }
      
      // Telemetry
      telemetryFactory.interact({
        eid: 'INTERACT',
        edata: {
          id: 'content-progress',
          type: 'workflow',
          pageid: 'lesson-player',
          uid: userIdRef.current,
          contentId,
          progress: percentage
        },
      });
    }

    // ✅ Auto-complete threshold
    if (percentage >= 95 && !completedRef.current) {
      handleComplete();
    }
  }, [contentId, subtopicId, moduleId, courseId, handleComplete, sendProgressToBackend, setStatusData]);

  /* ───────────────── SUNBIRD EVENT LISTENER ───────────────── */
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data =
          typeof event.data === 'string'
            ? JSON.parse(event.data)
            : event.data;

        const eid = data?.eid;
        const eventContentId = data?.object?.id || data?.edata?.id || data?.contentId || data?.identifier;

        // ✅ Only process events for the current content and ignore if ID is missing
        if (!eventContentId || eventContentId !== contentId) {
          if (eventContentId && eid === 'PROGRESS') {
            console.log('[TRACKING] Ignored progress event (ID mismatch):', { eventId: eventContentId, hookId: contentId });
          }
          return;
        }

        if (eid === 'PROGRESS') {
          const progress = data?.edata?.progress || 0;
          if (progress > 0) {
            handleProgress(Math.min(100, Math.round(progress)));
          }
        }

        // Only trust ASSESS for completion from Sunbird iframe players (quizzes)
        // END and SUMMARY are often fired prematurely or contain stale data
        if (eid === 'ASSESS') {
          handleComplete();
        }
      } catch (err) { }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleProgress, handleComplete]);

  // Reset tracking when contentId changes
  useEffect(() => {
    lastProgressRef.current = 0;
    lastApiProgressRef.current = 0;
    completedRef.current = false;
  }, [contentId]);

  return {
    handleProgress,
    handleComplete,
  };
};
