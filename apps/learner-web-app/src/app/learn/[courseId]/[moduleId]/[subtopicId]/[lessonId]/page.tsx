'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, IconButton, Button, LinearProgress, Badge, useMediaQuery } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { SwadhaarContentPlayer } from '@learner/components/Swadhaar/Player/SwadhaarContentPlayer';
import SwadhaarQuizFailModal from '@learner/components/Swadhaar/Player/SwadhaarQuizFailModal';

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
  const [subtopicDescription, setSubtopicDescription] = useState('');
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Once true for the current lesson, NEVER resets to false — prevents flicker from polling
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [quizFailOpen, setQuizFailOpen] = useState(false);

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
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(guard)); } catch { }
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
          setSubtopicDescription(prev => prev === currentSubtopic?.description ? prev : (currentSubtopic?.description || ''));

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
          // EXCEPTION: if this item is already marked completed in our local state, trust the
          // backend — the guard was stale from a previous partial watch session.
          const sessionEntry = currentGuard[newItem.contentId];
          const alreadyCompletedLocally = idx >= 0 && merged[idx]?.status === 2;
          if (sessionEntry && sessionEntry.status === 1 && newItem.status === 2 && !alreadyCompletedLocally) {
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

    // Lock the UI permanently in green completed state — never revert until lesson changes
    setLessonCompleted(true);
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
      // Only write to session guard if the content is NOT already completed.
      // If we write status=1/94% for a completed item, the guard will block
      // the backend's completed status on every 5-second poll re-fetch.
      const alreadyCompleted = statusData.some(s => s.contentId === id && s.status === 2);
      if (!alreadyCompleted) {
        updateSessionGuard(id, { percentage: Math.round(percentage), status: 1 });
      }
    }
    handleProgressInner(percentage);
  }, [currentLesson?.identifier, handleProgressInner, statusData]);

  // ✅ Periodically refresh status silently to avoid player reset
  // Stop polling once the lesson is completed — prevents stale backend data from
  // causing post-completion flicker in the progress display.
  useEffect(() => {
    if (isDesktop && isSwadhaarTenant) return;
    if (lessonCompleted) return; // No need to poll once done
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData, isDesktop, isSwadhaarTenant, lessonCompleted]);

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

  // Display value: once the lesson is completed this session, always show 100%
  // This prevents flicker when polling returns stale backend data mid-update
  const displayCompletion = lessonCompleted ? 100 : currentCompletion;
  const showCompletedBanner = lessonCompleted || displayCompletion >= 70;
  // Effective completion for unlock gate — uses displayCompletion so video progress unlocks Next
  const effectiveCompletion = displayCompletion;

  // Reset lessonCompleted when the user navigates to a different lesson
  useEffect(() => {
    setLessonCompleted(false);
  }, [lessonId]);

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
        } catch (e) { }
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

  const currentTopicTitle = useMemo(() => {
    return subtopicName || currentLesson?.topic || '';
  }, [subtopicName, currentLesson]);

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
            <IconButton onClick={() => router.push(`/learn/${courseId}/${moduleId}`)}><ArrowBackIcon sx={{ color: '#1A1A1A', fontSize: 20 }} /></IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTopicTitle && currentTopicTitle !== currentLesson?.name ? `${currentTopicTitle} - ${currentLesson?.name}` : currentLesson?.name || subtopicName}
            </Typography>
          </Box>

          <Box sx={{ px: 2, pt: 2, flex: 1, pb: 22 }}>
            <Box sx={{
              bgcolor: '#fff', borderRadius: '16px',
              border: `1.5px solid ${showCompletedBanner ? '#4CAF50' : '#E5E7EB'}`,
              p: 2, mb: 3, transition: 'border-color 0.5s ease'
            }}>
              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.5, color: '#1F2937' }}>{t('LEARNER_APP.LEARN.LESSON_PROGRESS')}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress variant="determinate" value={displayCompletion} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: displayCompletion >= 70 ? '#4CAF50' : '#E6873C' } }} />
                <Box sx={{ bgcolor: 'rgba(74, 222, 128, 0.15)', px: 1, py: 0.25, borderRadius: '10px' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#36B368' }}>{Math.round(displayCompletion)}%</Typography>
                </Box>
              </Box>
            </Box>

            {currentLesson && (() => {
              const subtopicLessons = allLessons.filter(l => l.parentSubtopicId === subtopicId);
              const isFirstLesson = subtopicLessons[0]?.identifier === currentLesson.identifier;
              const rawDisplayDescription = isFirstLesson
                ? (subtopicDescription || currentLesson.description || '-')
                : (currentLesson.description || '-');
              const displayDescription = rawDisplayDescription === '-' ? 'No description available' : rawDisplayDescription;

              const subtopicName = currentTopicTitle || 'Description';

              return (
                <Box sx={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid #E5E7EB`,
                  mb: 3,
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1.5 }}>
                    <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'Inter', textTransform: 'uppercase' }}>
                      {subtopicName}
                    </Typography>
                  </Box>
                  {/* Body */}
                  <Box sx={{ bgcolor: '#fff', pt: 2, pb: 1, px: 2 }}>
                    <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 400, fontSize: '13px', color: '#1A1A1A', fontStyle: rawDisplayDescription === '-' ? 'italic' : 'normal', opacity: rawDisplayDescription === '-' ? 0.6 : 1 }}>
                      {displayDescription}
                    </Typography>
                    {currentLesson.body && (
                      <Typography sx={{ fontFamily: 'Open Sans', fontSize: '14px', color: '#1A1A1A', fontWeight: 400, lineHeight: 1.7, mt: 1.5 }}>
                        {currentLesson.body}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })()}


            {currentLesson && (
              isSwadhaarTenant ? (
                (() => {
                  // Now we can just use the pre-computed currentTopicTitle
                  const subtopicName = currentTopicTitle || 'Description';
                  const showPlayerHeader = subtopicName !== currentLesson.name;

                  return (
                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 1.5, border: '1px solid #E5E7EB', background: '#fff' }}>
                      {showPlayerHeader && (
                        <Typography sx={{ px: 2, py: 1, fontSize: 13, fontWeight: 700, color: '#fff', bgcolor: '#1C2B4A', fontFamily: 'Open Sans' }}>
                          {currentLesson.name}
                        </Typography>
                      )}
                      <SwadhaarContentPlayer
                        key={currentLesson.identifier} identifier={currentLesson.identifier} courseId={courseId} unitId={subtopicId} mimeType={currentLesson.mimeType} contentType={currentLesson.contentType}
                        contentUrl={currentLesson.artifactUrl || currentLesson.downloadUrl} posterImage={currentLesson.posterImage || currentLesson.appIcon} name={currentLesson.name} description={currentLesson.description}
                        attempts={statusData.find(s => s.contentId === currentLesson.identifier)?.attempts || 0}
                        topicTitle={currentTopicTitle}
                        initialProgress={displayCompletion}
                        isCompleted={lessonCompleted || currentCompletion >= 100}
                        onProgress={handleProgress} onComplete={handleComplete}
                        onQuizFail={() => setQuizFailOpen(true)}
                      />
                    </Box>
                  );
                })()
              ) : (
                <DefaultPlayer key={currentLesson.identifier} identifier={currentLesson.identifier} courseId={courseId} unitId={subtopicId} isEmbedded={true} />
              )
            )}
          </Box>

          <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <Button variant="outlined" onClick={() => prevLesson ? router.push(`/learn/${courseId}/${prevLesson.parentModuleId}/${prevLesson.parentSubtopicId}/${prevLesson.identifier}`) : router.push(`/learn/${courseId}/${moduleId}/${subtopicId}`)} sx={{ borderRadius: '10px', borderColor: PRIMARY, color: PRIMARY, fontWeight: 700, textTransform: 'none', px: 2, minWidth: '100px', flexShrink: 0 }}>{t('LEARNER_APP.LEARN.PREVIOUS')}</Button>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: DARK_NAV, textAlign: 'center', flex: 1, px: 1, fontFamily: 'Inter', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLesson?.name}</Typography>
            <Button variant="contained" disabled={effectiveCompletion < 70} onClick={() => nextLesson ? router.push(`/learn/${courseId}/${nextLesson.parentModuleId}/${nextLesson.parentSubtopicId}/${nextLesson.identifier}`) : router.push(`/learn/${courseId}/${moduleId}?view=module_completion`)} sx={{ borderRadius: '10px', bgcolor: PRIMARY, color: '#fff', fontWeight: 700, textTransform: 'none', px: 2, minWidth: '100px', flexShrink: 0, boxShadow: 'none', '&:hover': { bgcolor: '#D1752D' }, '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' } }}>{t('LEARNER_APP.LEARN.NEXT')}</Button>
          </Box>
          <SwadhaarBottomNav />

          {/* Quiz Fail Modal — shown when quiz score < 70% */}
          <SwadhaarQuizFailModal
            open={quizFailOpen}
            onOkay={() => {
              setQuizFailOpen(false);
              // Navigate to the very first lesson of the entire course
              const firstLesson = allLessons[0];
              if (firstLesson) {
                router.push(`/learn/${courseId}/${firstLesson.parentModuleId}/${firstLesson.parentSubtopicId}/${firstLesson.identifier}`);
              } else {
                router.push(`/learn/${courseId}/${moduleId}`);
              }
            }}
          />
        </Box>
      )}
    </>
  );
}
