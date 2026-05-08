import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import SwadhaarService from '../utils/API/SwadhaarService';
import { collectAllNodeIds } from '../utils/progressCalculator';

export const useLearningPath = (courseId: string) => {
  const queryClient = useQueryClient();
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

  // 1. Fetch Hierarchy
  const { data: hierarchy, isLoading: isHierarchyLoading, error: hierarchyError } = useQuery({
    queryKey: ['courseHierarchy', courseId],
    queryFn: () => SwadhaarService.getCourseHierarchy(courseId),
    enabled: !!courseId,
  });

  // 2. Fetch Status for all nodes in the hierarchy
  const allNodeIds = hierarchy ? collectAllNodeIds(hierarchy) : [];

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['contentStatus', courseId, userId, tenantId],
    queryFn: () => SwadhaarService.getContentCourseStatus([userId!], allNodeIds, tenantId!),
    enabled: !!hierarchy && !!userId && !!tenantId && allNodeIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Global listener for player events to trigger refetch
  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // Listen for Sunbird player completion events
        if (data?.eid === 'END' || data?.eid === 'SUMMARY') {
          console.log('[useLearningPath] Player completion event received, refetching status...');
          queryClient.invalidateQueries({ queryKey: ['contentStatus', courseId] });
        }
      } catch (e) {
        // Not a JSON message or unrelated
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [courseId, queryClient]);

  return {
    hierarchy,
    statusData: statusData || [],
    isLoading: isHierarchyLoading || isStatusLoading,
    error: hierarchyError,
    refetchStatus,
  };
};
