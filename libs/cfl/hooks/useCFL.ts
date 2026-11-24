import { useState, useEffect, useCallback } from 'react';
import { Trainer, CourseProgress } from '../types';
import { getTrainerList, getTrainerProgress,cfllearnerlist, getDICohorts, reviewerLearnerList, getMyReviewerScope } from '../services/cflService';
import { isReviewerSession, REVIEWER_FLAG_KEY } from '@learner/utils/swadhaarReviewer';

export const useCFLTrainers = (tenantId: string) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainers = useCallback(async () => {
    // if (!tenantId) return; // Removed for testing
    console.log("Fetching trainers for tenantId:", tenantId);
    const tenantIdcheck = localStorage.getItem("tenantId") || tenantId || '';
    setLoading(true);
    try {
      const role = localStorage.getItem('userRole');
      // Task 76: ask the server who this user reviews every time, rather than trusting the flag
      // saved at login (it can be stale, and the old CFL path then lists the wrong group).
      // null = the scope could not be loaded; then the saved flag decides.
      const scope = await getMyReviewerScope().catch((e) => {
        console.warn('Could not load reviewer scope', e);
        return null;
      });
      const reviewsGroups = scope ? scope.groups.length > 0 : isReviewerSession();
      if (scope) localStorage.setItem(REVIEWER_FLAG_KEY, String(reviewsGroups));
      let data;
      if (reviewsGroups) {
        // A Reviewer's team = the Learners of the groups they review (server scope)
        data = await reviewerLearnerList(scope || undefined);
      } else if (role === 'ARM') {
        data = await getDICohorts();
      } else {
        data = await cfllearnerlist(undefined, undefined, undefined, undefined, true);
      }

      setTrainers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch trainers');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  return { trainers, loading, error, refresh: fetchTrainers };
};

export const useTrainerProgress = (trainerId: string, tenantId: string) => {
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trainerId && tenantId) {
      setLoading(true);
      getTrainerProgress(trainerId, tenantId).then((data) => {
        setProgress(data);
        setLoading(false);
      });
    }
  }, [trainerId, tenantId]);

  return { progress, loading };
};
