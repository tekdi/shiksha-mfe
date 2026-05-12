'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, IconButton, Button, LinearProgress, Badge, useMediaQuery } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { SwadhaarContentPlayer } from '@learner/components/Swadhaar/Player/SwadhaarContentPlayer';

import CheckIcon from '@mui/icons-material/Check';

import {
  getCourseHierarchy,
  getContentCourseStatus,
  updateContentStatus,
  trackCourseClick,
} from '@learner/utils/API/SwadhaarService';
import { useTenant } from '@learner/context/TenantContext';
import { useTranslation } from '@shared-lib';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import { getUnreadCount } from '@learner/utils/alertsStore';
import { telemetryFactory } from '@learner/utils/telemtery';
import { useContentTracking } from '@learner/hooks/useContentTracking';

const SwadhaarDesktopLessonPlayer = dynamic(
  () => import('@learner/components/Swadhaar/Desktop/SwadhaarDesktopLessonPlayer'),
  { ssr: false }
);

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const SUCCESS_GREEN = '#4CAF50';
const DefaultPlayer = dynamic(() => import('@learner/components/Content/Player'), { ssr: false });

export default function LessonViewerPage() {
  const router = useRouter();
  const { courseId, moduleId, subtopicId, lessonId } = useParams() as { courseId: string; moduleId: string; subtopicId: string; lessonId: string };
  const { tenant } = useTenant();
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width:960px)');

  const isSwadhaarTenant = useMemo(() => {
    const tenantName = (tenant?.name || '').toLowerCase();
    if (tenantName.includes('swadhaar')) return true;
    if (typeof window !== 'undefined') {
      const stored = (localStorage.getItem('tenantName') || localStorage.getItem('tenant') || '').toLowerCase();
      if (stored.includes('swadhaar')) return true;
      const referer = document.referrer || '';
      if (referer.includes('swadhaar')) return true;
    }
    return false;
  }, [tenant?.name]);

  const [isLoading, setIsLoading] = useState(true);
  const [subtopicName, setSubtopicName] = useState('');
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Session-wide progress guard backed by sessionStorage so it persists across navigation.
  // Prevents the backend's completed_list from overriding a locally-tracked in-progress value.
  const SESSION_KEY = 'swadhaar_progress_guard';

  const getSessionGuard = (): Record<string, { percentage: number; status: number }> => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };

  const setSessionGuard = (guard: Record<string, { percentage: number; status: number }>) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(guard)); } catch {}
  };

  const updateSessionGuard = (contentId: string, entry: { percentage: number; status: number }) => {
    const guard = getSessionGuard();
    const prev = guard[contentId];
    if (!prev || entry.percentage > prev.percentage) {
      guard[contentId] = entry;
      setSessionGuard(guard);
    }
  };

  const clearSessionGuard = (contentId: string) => {
    const guard = getSessionGuard();
    delete guard[contentId];
    setSessionGuard(guard);
  };

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/swadhaar-login');
    }
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      const userId = localStorage.getItem('userId') || '';
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';

      let status: any[] = [];
      if (userId && tenantId) {
        let currentFlatLessons = allLessons;

        if (!isSilent || allLessons.length === 0) {
          const courseHierarchy = await getCourseHierarchy(courseId);
          const flatLessons: any[] = [];

          const flattenLessons = (node: any, parentModuleId: string, parentSubId: string) => {
            const isCollection = node.mimeType === 'application/vnd.ekstep.content-collection' || 
                               node.contentType === 'CourseUnit' || 
                               node.contentType === 'TextBookUnit';
            
            if (node.children && node.children.length > 0) {
              node.children.forEach((child: any) => {
                // Identify module context: if node is course, its children are modules
                const nextModuleId = node.identifier === courseId ? child.identifier : parentModuleId;
                flattenLessons(child, nextModuleId, node.identifier);
              });
            } else if (!isCollection && node.identifier !== courseId) {
              flatLessons.push({ ...node, parentModuleId, parentSubtopicId: parentSubId });
            }
          };

          flattenLessons(courseHierarchy, courseId, courseId);
          currentFlatLessons = flatLessons;
          
          const moduleHierarchy = await getCourseHierarchy(moduleId);
          const subtopics = moduleHierarchy?.children || [];
          const currentSubtopic = subtopics.find((s: any) => s.identifier === subtopicId) || await getCourseHierarchy(subtopicId);
          setSubtopicName(prev => prev === currentSubtopic?.name ? prev : (currentSubtopic?.name || 'Lesson Detail'));
          
          setAllLessons(flatLessons);
          const activeLesson = flatLessons.find((l: any) => l.identifier === lessonId) 
            || (flatLessons.length > 0 ? flatLessons[0] : (currentSubtopic && !currentSubtopic.children ? currentSubtopic : null));
          
          setCurrentLesson((prev: any) => prev?.identifier === activeLesson?.identifier ? prev : activeLesson);
        }

        // Fetch status for the entire course to enable cross-module completion checks
        const allIds = [...new Set([courseId, ...currentFlatLessons.map(l => l.identifier)])];
        status = await getContentCourseStatus([userId], allIds, tenantId).catch(() => []);
      }
      
      const currentGuard = getSessionGuard();
      setStatusData(prev => {
        const merged = [...prev];
        status.forEach(newItem => {
          const idx = merged.findIndex(m => m.contentId === newItem.contentId);

          // SESSION GUARD: If sessionStorage has a local in-progress record for this lesson,
          // don't let the backend's completed_list override it with 100%.
          // This guard persists across back-navigation because it's stored in sessionStorage.
          const sessionEntry = currentGuard[newItem.contentId];
          if (sessionEntry && sessionEntry.status === 1 && newItem.status === 2) {
            // Backend says completed but we tracked it as in-progress this session
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                attempts: Math.max(merged[idx].attempts || 0, newItem.attempts || 0),
                status: 1,
                completionPercentage: sessionEntry.percentage,
              };
            } else {
              merged.push({ contentId: newItem.contentId, status: 1, completionPercentage: sessionEntry.percentage, attempts: newItem.attempts || 0 });
            }
            return;
          }

          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              attempts: Math.max(merged[idx].attempts || 0, newItem.attempts || 0),
              status: Math.max(merged[idx].status || 0, newItem.status || 0),
              completionPercentage: Math.max(merged[idx].completionPercentage || 0, newItem.completionPercentage || 0),
            };
          } else {
            merged.push(newItem);
          }
        });
        return merged;
      });
      setAllLessons(flatLessons);

      const activeLesson = flatLessons.find((l: any) => l.identifier === lessonId) 
        || (flatLessons.length > 0 ? flatLessons[0] : (currentSubtopic && !currentSubtopic.children ? currentSubtopic : null));
      
      setCurrentLesson((prev: any) => prev?.identifier === activeLesson?.identifier ? prev : activeLesson);
    } catch (err) {
      console.error('Error loading lesson viewer:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [subtopicId, moduleId, tenant, courseId, lessonId]);

  const handleTrackingComplete = useCallback((contentId?: string) => {
    // On true completion, clear from sessionStorage guard so backend value takes over
    const id = contentId || currentLesson?.identifier;
    if (id) clearSessionGuard(id);
    loadData(true);
  }, [loadData, currentLesson?.identifier]);

  const { handleProgress: handleProgressInner, handleComplete } = useContentTracking({
    contentId: currentLesson?.identifier || '',
    courseId,
    moduleId,
    subtopicId: subtopicId,
    lessonId: lessonId,
    setStatusData,
    onComplete: handleTrackingComplete,
  });

  // Wraps handleProgress to also record progress in the sessionStorage-backed guard.
  const handleProgress = useCallback((percentage: number) => {
    const id = currentLesson?.identifier;
    if (id && percentage < 100) {
      // Persist to sessionStorage so it survives back-navigation
      updateSessionGuard(id, { percentage: Math.round(percentage), status: 1 });
    }
    handleProgressInner(percentage);
  }, [currentLesson?.identifier, handleProgressInner]);

  // ✅ Periodically refresh status silently to avoid player reset
  useEffect(() => {
    if (isDesktop && isSwadhaarTenant) return; // Desktop player handles its own sync
    const interval = setInterval(() => {
      loadData(true); 
    }, 5000); 
    return () => clearInterval(interval);
  }, [loadData, isDesktop, isSwadhaarTenant]);

  useEffect(() => {
    loadData();
    setUnreadCount(getUnreadCount());
    telemetryFactory.impression({
      edata: { type: 'workflow', subtype: '', pageid: 'lesson-viewer', uri: `/learn/${courseId}/${moduleId}/${subtopicId}/${lessonId}` }
    });
  }, [loadData, courseId, moduleId, subtopicId, lessonId]);

  const currentCompletion = useMemo(() => {
    if (!currentLesson) return 0;
    const s = statusData.find((sd: any) => sd.contentId === currentLesson.identifier);
    return s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
  }, [currentLesson, statusData]);

  const isQuiz = useMemo(() => {
    if (!currentLesson) return false;
    const mt = (currentLesson.mimeType || '').toLowerCase();
    const ct = (currentLesson.contentType || '').toLowerCase();
    return mt === 'application/vnd.sunbird.questionset' || ct === 'questionset';
  }, [currentLesson]);

  useEffect(() => {
    if (currentLesson && !isLoading) {
      // Ensure all levels of hierarchy are initialized/tracked
      const trackAll = async () => {
        try {
          // Only track if not already completed to avoid resetting status
          if (Math.round(currentCompletion) < 100) {
            await trackCourseClick(courseId);
            await trackCourseClick(moduleId);
            await trackCourseClick(subtopicId);
            await trackCourseClick(lessonId);
          }
        } catch (e) {}
      };
      trackAll();
    }
  }, [currentLesson, isLoading, courseId, moduleId, subtopicId, lessonId, currentCompletion]);


  const { currentLessonIndex, prevLesson, nextLesson } = useMemo(() => {
    const index = allLessons.findIndex(l => l.identifier === (currentLesson?.identifier || lessonId));
    return {
      currentLessonIndex: index,
      prevLesson: index > 0 ? allLessons[index - 1] : null,
      nextLesson: index !== -1 && index < allLessons.length - 1 ? allLessons[index + 1] : null,
    };
  }, [allLessons, currentLesson, lessonId]);

  return (
    <>
      {(isDesktop && isSwadhaarTenant) ? (
        <SwadhaarDesktopLessonPlayer
          courseId={courseId}
          moduleId={moduleId}
          subtopicId={subtopicId}
          lessonId={lessonId}
        />
      ) : isLoading ? (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : (
        <Box sx={{ minHeight: '100dvh', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Box sx={{ bgcolor: '#fff', px: 1, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #F3F4F6' }}>
        <IconButton onClick={() => router.push(`/learn/${courseId}/${moduleId}`)}><ArrowBackIcon sx={{ color: '#E6873C', fontSize: 20 }} /></IconButton>
        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLesson?.name || subtopicName}</Typography>
        <Box onClick={() => router.push('/alerts')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', pr: 1 }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16, backgroundColor: '#FFFFFF', color: '#E6873C', border: '1px solid #E6873C', top: 2, right: 2 } }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(230,135,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: '#E6873C' }} /></Box>
          </Badge>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: PRIMARY, mt: 0.5 }}>{t('LEARNER_APP.ALERTS.TITLE')}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 2, flex: 1, pb: 22 }}>
        {!isQuiz && (
          <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', p: 2, mb: 3 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.5, color: '#1F2937' }}>{t('LEARNER_APP.LEARN.LESSON_PROGRESS')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LinearProgress variant="determinate" value={currentCompletion} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: SUCCESS_GREEN } }} />
              <Box sx={{ bgcolor: 'rgba(74, 222, 128, 0.15)', px: 1, py: 0.25, borderRadius: '10px' }}><Typography sx={{ fontSize: 11, fontWeight: 800, color: '#36B368' }}>{currentCompletion}%</Typography></Box>
            </Box>
          </Box>
        )}


        {currentLesson && (
          isSwadhaarTenant ? (
            <SwadhaarContentPlayer
              key={currentLesson.identifier} identifier={currentLesson.identifier} courseId={courseId} unitId={subtopicId} mimeType={currentLesson.mimeType} contentType={currentLesson.contentType}
              contentUrl={currentLesson.artifactUrl || currentLesson.downloadUrl} posterImage={currentLesson.posterImage || currentLesson.appIcon} name={currentLesson.name} description={currentLesson.description}
              attempts={statusData.find(s => s.contentId === currentLesson.identifier)?.attempts || 0}
              initialProgress={currentCompletion} isCompleted={currentCompletion >= 100}
              onProgress={handleProgress} onComplete={handleComplete}
            />
          ) : (
            <DefaultPlayer key={currentLesson.identifier} identifier={currentLesson.identifier} courseId={courseId} unitId={subtopicId} isEmbedded={true} />
          )
        )}
      </Box>

      <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <Button variant="outlined" onClick={() => prevLesson ? router.push(`/learn/${courseId}/${prevLesson.parentModuleId}/${prevLesson.parentSubtopicId}/${prevLesson.identifier}`) : router.push(`/learn/${courseId}/${moduleId}`)} sx={{ borderRadius: '10px', borderColor: PRIMARY, color: PRIMARY, fontWeight: 700, textTransform: 'none', px: 2, minWidth: '100px', flexShrink: 0 }}>{t('LEARNER_APP.LEARN.PREVIOUS')}</Button>
        <Typography sx={{ fontWeight: 700, fontSize: 12, color: DARK_NAV, textAlign: 'center', flex: 1, px: 1, fontFamily: 'Inter', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLesson?.name}</Typography>
        <Button variant="contained" disabled={currentCompletion < 100} onClick={() => nextLesson ? router.push(`/learn/${courseId}/${nextLesson.parentModuleId}/${nextLesson.parentSubtopicId}/${nextLesson.identifier}`) : router.push(`/learn/${courseId}/${moduleId}`)} sx={{ borderRadius: '10px', bgcolor: PRIMARY, color: '#fff', fontWeight: 700, textTransform: 'none', px: 2, minWidth: '100px', flexShrink: 0, boxShadow: 'none', '&:hover': { bgcolor: '#D1752D' }, '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' } }}>{t('LEARNER_APP.LEARN.NEXT')}</Button>
      </Box>
      <SwadhaarBottomNav />
    </Box>
    )}
    </>
  );
}
