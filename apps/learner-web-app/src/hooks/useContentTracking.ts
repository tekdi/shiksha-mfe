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

      console.log(`[TRACKING] Syncing to backend: ID=${contentId}, Status=${statusString}, Progress=${percentage}%`);

      // 1. Sync granular telemetry progress (Required for Sunbird progress aggregation)
      await syncContentProgressTelemetry({
        userId,
        courseId,
        contentId,
        unitId: subtopicId || moduleId || contentId,
        percentage,
        status: statusString,
      });

      // 2. Explicitly update content status (Ensures 'completed' state is captured)
      await updateContentStatus({
        userId,
        courseId: courseId,
        contentId: contentId,
        status: status,
        completionPercentage: percentage,
        moduleId: moduleId,
        score,
      });

      lastApiProgressRef.current = percentage;
      console.log(`[TRACKING] Sync Success: ID=${contentId}`);
    } catch (err) {
      console.warn('[TRACKING] Sync Failed:', err);
    }
  }, [contentId, courseId, moduleId, subtopicId]);

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
