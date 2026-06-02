import { useState, useEffect, useCallback } from 'react';
import { Trainer, CourseProgress } from '../types';
import { getTrainerList, getTrainerProgress,cfllearnerlist } from '../services/cflService';

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
      // const data = await getTrainerList(tenantIdcheck);
      const data = await cfllearnerlist();

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
