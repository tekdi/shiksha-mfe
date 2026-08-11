'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Button, Collapse, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { getCourseHierarchy, getContentCourseStatus } from '@learner/utils/API/SwadhaarService';
import { useContentTracking } from '@learner/hooks/useContentTracking';
import { SwadhaarContentPlayer } from '@learner/components/Swadhaar/Player/SwadhaarContentPlayer';
import SwadhaarDesktopHeader from './SwadhaarDesktopHeader';
import SwadhaarDesktopCompletionModal, { CompletionMode, CompletionModalProps } from './SwadhaarDesktopCompletionModal';
import SwadhaarDesktopAlertsPanel from './SwadhaarDesktopAlertsPanel';
import SwadhaarDesktopEditProfileModal from './SwadhaarDesktopEditProfileModal';
import SwadhaarQuizFailModal from '@learner/components/Swadhaar/Player/SwadhaarQuizFailModal';
import ConfirmationModal from '@learner/components/ConfirmationModal/ConfirmationModal';
import { getUnreadCount } from '@learner/utils/alertsStore';
import { useTenant } from '@learner/context/TenantContext';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const SUCCESS = '#4CAF50';

const isCollection = (node: any) =>
  node.mimeType?.includes('collection') ||
  node.contentType === 'CourseUnit' ||
  node.contentType === 'TextBookUnit';

const calculateNodeCompletion = (node: any, statusMap: Map<string, any>): number => {
  const id = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusMap.get(id);
    return s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
  }
  const childPercs = node.children.map((c: any) => calculateNodeCompletion(c, statusMap));
  return childPercs.length > 0 ? childPercs.reduce((a, b) => a + b, 0) / childPercs.length : 0;
};

/* ─── Helpers ────────────────────────────────────────── */

const ProgressCircle: React.FC<{ percentage: number; isCurrent?: boolean; isLocked?: boolean; size?: number }> = ({
  percentage, isCurrent, isLocked, size = 24
}) => {
  const isFullyDone = percentage >= 100;
  const isPassing = percentage >= 70; // >= 70% = green arc
  const arcColor = isPassing ? SUCCESS : PRIMARY; // green at 70+, orange below

  if (isLocked) return <LockRoundedIcon sx={{ fontSize: size - 4, color: '#9CA3AF', flexShrink: 0 }} />;
  if (isFullyDone) return <CheckCircleRoundedIcon sx={{ fontSize: size, color: SUCCESS, flexShrink: 0 }} />;

  const strokeWidth = size > 30 ? 4 : size > 20 ? 3 : 2;
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const showProgress = percentage > 0 || isCurrent;
  const strokeDashoffset = circumference - (Math.max(0, percentage) / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0, width: size, height: size }}>
      <svg width={size} height={size}>
        <circle stroke="#E0E0E0" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        {showProgress && (
          <circle
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        )}
      </svg>
      {showProgress && (
        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: size * 0.32, fontWeight: 800, color: arcColor, letterSpacing: -0.5 }}>
            {Math.round(percentage)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export interface SwadhaarDesktopLessonPlayerProps {
  courseId: string;
  moduleId: string;
  subtopicId: string;
  lessonId: string;
}

/* ── Component ────────────────────────────────────── */
const SwadhaarDesktopLessonPlayer: React.FC<SwadhaarDesktopLessonPlayerProps> = ({
  courseId, moduleId, subtopicId, lessonId,
}) => {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [courseHierarchy, setCourseHierarchy] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set([subtopicId]));
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [completionModal, setCompletionModal] = useState<{
    mode: CompletionMode; upNext?: CompletionModalProps['upNext']; currentGroup?: CompletionModalProps['currentGroup']; levelName?: string; continueText?: string; onContinue?: () => void;
  } | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [quizFailOpen, setQuizFailOpen] = useState(false);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const fetchUserProfile = useCallback(async () => {
    if (userId) {
      try {
        const { getUserDetails } = await import('@learner/utils/API/services/ProfileService');
        const profileResponse = await getUserDetails(userId, true);
        const profileData = profileResponse?.result?.userData;
        setProfileImageUrl(profileData?.name || null);
        setUserName(profileData?.firstName || 'User');
      } catch (e) {
        console.error('Error fetching user profile in LessonPlayer:', e);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);


  // Session-wide progress guard (Sync with mobile PWA logic)
  const SESSION_KEY = 'swadhaar_progress_guard';
  const getSessionGuard = () => {
    try { const raw = sessionStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : {}; }
    catch { return {}; }
  };
  const setSessionGuard = (guard: any) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(guard)); } catch { }
  };
  const updateSessionGuard = (contentId: string, entry: any) => {
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

  const loadHierarchy = useCallback(async () => {
    try {
      setIsLoading(true);
      const hierarchy = await getCourseHierarchy(courseId);
      setCourseHierarchy(hierarchy);

      const flat: any[] = [];
      const flatten = (node: any, pMod: string, pSub: string) => {
        const isCol = node.mimeType?.includes('collection') || node.contentType === 'CourseUnit' || node.contentType === 'TextBookUnit';
        if (node.children?.length) {
          node.children.forEach((c: any) => {
            const nm = node.identifier === courseId ? c.identifier : pMod;
            flatten(c, nm, node.identifier);
          });
        } else if (!isCol && node.identifier !== courseId) {
          flat.push({ ...node, parentModuleId: pMod, parentSubtopicId: pSub });
        }
      };
      flatten(hierarchy, courseId, courseId);
      console.log('[DEBUG] allLessons flattened:', flat.length, flat.map(l => l.identifier));
      setAllLessons(flat);
    } catch (e) {
      console.error('LessonPlayer loadHierarchy error', e);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const syncStatus = useCallback(async () => {
    try {
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';
      if (userId && tenantId && allLessons.length > 0) {
        const ids = [courseId, ...allLessons.map((l) => l.identifier)];
        const apiStatus = await getContentCourseStatus([userId], [...new Set(ids)], tenantId).catch(() => []);

        const currentGuard = getSessionGuard();
        setStatusData((prev: any[]) => {
          const merged = [...prev];
          apiStatus.forEach((newItem: any) => {
            const idx = merged.findIndex((m) => m.contentId === newItem.contentId);
            const sessionEntry = currentGuard[newItem.contentId];
            if (sessionEntry && sessionEntry.status === 1 && newItem.status === 2) {
              const update = { contentId: newItem.contentId, status: 1, completionPercentage: sessionEntry.percentage, attempts: newItem.attempts || 0 };
              if (idx >= 0) merged[idx] = update; else merged.push(update);
              return;
            }
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                attempts: Math.max(merged[idx].attempts || 0, newItem.attempts || 0),
                status: Math.max(merged[idx].status || 0, newItem.status || 0),
                completionPercentage: Math.max(merged[idx].completionPercentage || 0, newItem.percentage || newItem.completionPercentage || 0)
              };
            } else {
              merged.push(newItem);
            }
          });
          statusRef.current = merged;
          return merged;
        });
      }
    } catch (e) {
      console.error('LessonPlayer syncStatus error', e);
    }
  }, [courseId, allLessons, userId, tenant]);

  // Initial load of hierarchy
  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  // Sync active lesson when lessonId or allLessons change
  useEffect(() => {
    if (allLessons.length > 0) {
      const active = allLessons.find((l) => l.identifier === lessonId) ||
        allLessons.find((l) => l.parentSubtopicId === lessonId) ||
        allLessons.find((l) => l.parentModuleId === lessonId) ||
        allLessons[0];
      if (active) {
        setCurrentLesson(active);
        // Ensure subtopic and parent containers are expanded
        setExpandedSubtopics(prev => {
          const next = new Set(prev);
          if (active.parentSubtopicId) next.add(active.parentSubtopicId);
          if (lessonId) next.add(lessonId);
          return next;
        });
      }
    }
  }, [lessonId, allLessons]);

  // Periodically sync status
  useEffect(() => {
    if (completionModal || alertsOpen || editProfileOpen || logoutConfirmOpen) return;
    syncStatus();
    const interval = setInterval(syncStatus, 8000);
    return () => clearInterval(interval);
  }, [syncStatus, completionModal, alertsOpen, editProfileOpen, logoutConfirmOpen]);

  const buildStatusMap = useCallback((statusList: any[]) => {
    const map = new Map<string, any>();
    statusList.forEach(item => { if (item.contentId) map.set(item.contentId, item); });
    return map;
  }, []);

  const completionCache = useMemo(() => {
    const map = buildStatusMap(statusData);
    const cache = new Map<string, number>();
    const walk = (node: any): number => {
      const id = node.identifier || node.id;
      if (cache.has(id)) return cache.get(id)!;
      let perc = 0;
      if (!node.children || node.children.length === 0) {
        const s = map.get(id);
        perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
      } else {
        const childPercs = node.children.map((c: any) => walk(c));
        perc = childPercs.length > 0 ? childPercs.reduce((a: any, b: any) => a + b, 0) / childPercs.length : 0;
      }
      cache.set(id, perc);
      return perc;
    };
    if (courseHierarchy) walk(courseHierarchy);
    return cache;
  }, [courseHierarchy, statusData, buildStatusMap]);

  const getStatusInfo = (id: string) => {
    const perc = completionCache.get(id) ?? 0;
    return { state: perc >= 70 ? 'done' : perc > 0 ? 'progress' : 'todo', percentage: perc };
  };

  const currentCompletion = useMemo(() => {
    if (!currentLesson) return 0;
    return getStatusInfo(currentLesson.identifier).percentage;
  }, [currentLesson, completionCache]);

  const hierarchyRef = React.useRef(courseHierarchy);
  hierarchyRef.current = courseHierarchy;
  const statusRef = React.useRef(statusData);
  statusRef.current = statusData;
  // Ref for position-based completion detection inside async callback
  const nextLessonInCourseRef = React.useRef<any>(null);
  const currentLessonRef = React.useRef<any>(currentLesson);
  currentLessonRef.current = currentLesson;

  // Scope navigation to lessons within the current module shown in the sidebar.
  // allLessons spans the entire course; we need module-scoped so Next/Prev stays
  // within the sidebar list, and nextLesson=null at the last lesson to trigger the modal.
  const currentActiveModuleId = currentLesson?.parentModuleId || moduleId;
  const moduleScopedLessons = useMemo(
    () => allLessons.filter((l) => l.parentModuleId === currentActiveModuleId),
    [allLessons, currentActiveModuleId]
  );

  const { prevLesson, nextLesson } = useMemo(() => {
    const list = moduleScopedLessons;
    const idx = list.findIndex((l) => l.identifier === (currentLesson?.identifier || lessonId));
    return {
      prevLesson: idx > 0 ? list[idx - 1] : null,
      nextLesson: idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null,
    };
  }, [moduleScopedLessons, currentLesson, lessonId]);

  const goTo = useCallback((lesson: any) => {
    setCurrentLesson(lesson); // Immediate UI update
    const targetMod = lesson.parentModuleId || moduleId;
    const targetSub = lesson.parentSubtopicId || subtopicId;
    router.push(`/learn/${courseId}/${targetMod}/${targetSub}/${lesson.identifier}`, { scroll: false });
  }, [courseId, moduleId, subtopicId, router]);

  const handleLogoutConfirm = () => {
    localStorage.clear();
    router.push('/swadhaar-login');
  };

  // Course-scoped next lesson — used by the completion modal's Continue button
  // (may cross module boundaries: subtopic → next subtopic → next module)
  const nextLessonInCourse = useMemo(() => {
    const idx = allLessons.findIndex((l) => l.identifier === (currentLesson?.identifier || lessonId));
    return idx !== -1 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  }, [allLessons, currentLesson, lessonId]);

  // Keep ref in sync so the async handleTrackingComplete always reads the latest value
  nextLessonInCourseRef.current = nextLessonInCourse;

  const evaluateCompletionBoundaries = useCallback((isAutoTrigger: boolean = false, forceMode?: 'module' | 'course') => {
    const ch = hierarchyRef.current;
    const lesson = currentLessonRef.current;
    if (!lesson || !ch) return;

    const activeModuleId = lesson.parentModuleId || moduleId;
    const activeSubtopicId = lesson.parentSubtopicId || subtopicId;

    const modules = ch.children || [];
    const currentModIdx = modules.findIndex((m: any) => (m.identifier || m.id) === activeModuleId);
    const currentMod = currentModIdx !== -1 ? modules[currentModIdx] : null;

    const subtopics = currentMod?.children || [];
    const currentSubIdx = subtopics.findIndex((s: any) => (s.identifier || s.id) === activeSubtopicId);
    const currentSub = currentSubIdx !== -1 ? subtopics[currentSubIdx] : null;

    const smap = buildStatusMap(statusRef.current);

    // Check if module is purely direct lessons (no subtopics)
    const isDirectLessons = currentMod && (!currentMod.children || currentMod.children.length === 0 || currentMod.children.every((c: any) => !c.children));

    const subPerc = currentSub ? calculateNodeCompletion(currentSub, smap) : 100;
    const modPerc = currentMod ? calculateNodeCompletion(currentMod, smap) : 0;

    const nextSub = currentSubIdx !== -1 && currentSubIdx < subtopics.length - 1 ? subtopics[currentSubIdx + 1] : null;
    const nextMod = currentModIdx !== -1 && currentModIdx < modules.length - 1 ? modules[currentModIdx + 1] : null;

    const hasMoreInCourse = nextLessonInCourseRef.current !== null;

    // If auto-triggering, we only want to show modals at boundaries (not navigate to next lesson automatically)
    if (isAutoTrigger && !forceMode && !(!nextLesson && (subPerc >= 70 || modPerc >= 70))) {
      return;
    }

    if (!isAutoTrigger && !forceMode && nextLesson) {
      // Manual click and next lesson exists -> just go to it
      goTo(nextLesson);
      return;
    }

    // --- Boundary Logic ---

    if (!forceMode && subPerc >= 70 && !isDirectLessons && !nextLesson) {
      console.log('[COMPLETION] Triggering SUBTOPIC modal');
      setCompletionModal({
        mode: 'subtopic',
        continueText: nextSub ? t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextSub.name }) : t('COMMON.CONTINUE'),
        onContinue: () => {
          if (nextSub) {
            const firstLesson = (nextSub.children || [])[0];
            if (firstLesson) goTo({ ...firstLesson, parentModuleId: activeModuleId, parentSubtopicId: nextSub.identifier });
          } else {
            // Chain to Module Modal
            evaluateCompletionBoundaries(true, 'module');
          }
        },
        upNext: nextSub ? {
          groupName: nextSub.name,
          groupSubtitle: `Completed ${(nextSub.children || []).filter((l: any) => (completionCache.get(l.identifier || l.id) ?? 0) >= 70).length}/${(nextSub.children || []).length} lessons`,
          items: (nextSub.children || []).map((lesson: any) => {
            const perc = Math.round(completionCache.get(lesson.identifier || lesson.id) ?? 0);
            return {
              id: lesson.identifier || lesson.id,
              name: lesson.name,
              subtitle: 'Lesson',
              isLesson: true,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }),
        } : undefined,
        currentGroup: {
          groupName: currentSub ? currentSub.name : 'Current Subtopic',
          groupSubtitle: currentSub ? `Completed ${(currentSub.children || []).filter((l: any) => (completionCache.get(l.identifier || l.id) ?? 0) >= 70).length}/${(currentSub.children || []).length} Lessons` : '',
          isCompleted: true,
          items: currentSub ? (currentSub.children || []).map((lesson: any) => {
            const perc = Math.round(completionCache.get(lesson.identifier || lesson.id) ?? 0);
            return {
              id: lesson.identifier || lesson.id,
              name: lesson.name,
              subtitle: 'Lesson',
              isLesson: true,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }) : [],
        },
      });
      return;
    }

    if (forceMode === 'module' || (modPerc >= 70 && hasMoreInCourse && (!nextLesson || isAutoTrigger))) {
      console.log('[COMPLETION] Triggering MODULE modal');
      setCompletionModal({
        mode: 'module',
        continueText: nextMod ? t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextMod.name }) : t('LEARNER_APP.LEARN.COURSE_COMPLETION'),
        onContinue: () => {
          if (nextMod) {
            const firstSub = (nextMod.children || [])[0];
            const firstLesson = firstSub?.children ? firstSub.children[0] : firstSub;
            if (firstLesson) goTo({ ...firstLesson, parentModuleId: nextMod.identifier, parentSubtopicId: firstSub?.identifier });
          } else {
            // Chain to Course Modal
            evaluateCompletionBoundaries(true, 'course');
          }
        },
        upNext: nextMod ? {
          groupName: nextMod.name,
          groupSubtitle: `Up Next in ${ch.name || 'Course'}`,
          items: (nextMod.children || []).map((s: any) => {
            const lessons = s.children || [];
            const isLesson = !lessons.length;
            const perc = Math.round(completionCache.get(s.identifier || s.id) ?? 0);
            return {
              id: s.identifier || s.id,
              name: s.name,
              subtitle: isLesson ? 'Lesson' : `${lessons.length} Lessons`,
              isLesson: isLesson,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }),
        } : undefined,
        currentGroup: {
          groupName: currentMod ? currentMod.name : 'Current Module',
          groupSubtitle: currentMod ? `Completed ${(currentMod.children || []).filter((s: any) => (completionCache.get(s.identifier || s.id) ?? 0) >= 70).length}/${(currentMod.children || []).length} Subtopics` : '',
          isCompleted: true,
          items: currentMod ? (currentMod.children || []).map((sub: any) => {
            const lessons = sub.children || [];
            const isLesson = !lessons.length;
            const perc = Math.round(completionCache.get(sub.identifier || sub.id) ?? 0);
            return {
              id: sub.identifier || sub.id,
              name: sub.name,
              subtitle: isLesson ? 'Lesson' : `${lessons.length} Lessons`,
              isLesson: isLesson,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }) : [],
        },
      });
      return;
    }

    if (forceMode === 'course' || (modPerc >= 70 && !hasMoreInCourse && (!nextLesson || isAutoTrigger))) {
      console.log('[COMPLETION] Triggering COURSE modal');
      setCompletionModal({
        mode: 'course',
        levelName: ch.name || '',
        currentGroup: {
          groupName: ch.name || 'Course Complete',
          groupSubtitle: `${modules.length} Modules Finished`,
          isCompleted: true,
          items: modules.map((m: any) => ({
            id: m.identifier || m.id,
            name: m.name,
            subtitle: `${m.children?.length || 0} Subtopics`,
            completionPercentage: 100,
            status: 2,
          })),
        },
      });
      return;
    }

    // Fallback if manual click but not enough progress for modal
    if (!isAutoTrigger && !forceMode && nextLessonInCourseRef.current) {
      goTo(nextLessonInCourseRef.current);
    }
  }, [moduleId, subtopicId, completionCache, goTo, nextLesson, buildStatusMap]);

  const handleTrackingComplete = useCallback(async () => {
    const id = currentLessonRef.current?.identifier;
    if (!id) return;

    console.log('[COMPLETION] Milestone reached for:', id);

    // 1. Wait a bit for useContentTracking's internal sync to fire
    await new Promise((r) => setTimeout(r, 600));

    // 2. Fetch fresh status from backend
    await syncStatus();

    // 3. Wait for React render cycle to propagate
    await new Promise((r) => setTimeout(r, 800));

    // 4. Position-based completion: avoid stale statusData from previous sessions
    clearSessionGuard(id);

    // Auto-trigger completion boundaries if needed
    evaluateCompletionBoundaries(true);
  }, [syncStatus, evaluateCompletionBoundaries]);

  const { handleProgress: handleProgressInner, handleComplete } = useContentTracking({
    contentId: currentLesson?.identifier || '',
    courseId, moduleId, subtopicId, lessonId,
    setStatusData,
    onComplete: handleTrackingComplete,
  });

  const handleProgress = useCallback((percentage: number) => {
    const id = currentLesson?.identifier;
    if (id && percentage < 100) {
      updateSessionGuard(id, { percentage: Math.round(percentage), status: 1 });
    }
    handleProgressInner(percentage);
  }, [currentLesson?.identifier, handleProgressInner]);

  const handleNext = () => evaluateCompletionBoundaries(false);

  const currentModule = (courseHierarchy?.children || []).find((m: any) => m.identifier === moduleId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', bgcolor: '#F4F6FA', overflow: 'hidden' }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      ) : (
        <>
          <SwadhaarDesktopHeader
            unreadCount={unreadCount}
            alertsPanelOpen={alertsOpen}
            onAlertsClick={() => setAlertsOpen((p) => !p)}
            onEditProfile={() => setEditProfileOpen(true)}
            onLogout={() => setLogoutConfirmOpen(true)}
            profileImageUrl={profileImageUrl}
            userName={userName}
          />

          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar */}
            <Box sx={{ width: { xs: '100%', sm: 320, md: 340 }, flexShrink: 0, bgcolor: '#F8F8F8', borderRight: '1px solid #E5E7EB', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Box onClick={() => router.push('/swadhaar-home')} sx={{ px: 2, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { bgcolor: '#FEF9F4' } }}>
                <ArrowBackRoundedIcon sx={{ fontSize: 16, color: PRIMARY }} />
                <Typography sx={{ fontFamily: 'Open sans', fontSize: '9px', fontWeight: 400, color: PRIMARY }}>{t('LEARNER_APP.HOME.BACK_TO_HOME')}</Typography>
              </Box>

              {currentModule && (() => {
                const mId = currentModule.identifier || currentModule.id;
                const modPerc = Math.round(completionCache.get(mId) ?? 0);
                const modDone = modPerc >= 70;
                const allModLessons = (currentModule.children || []).flatMap((s: any) => s.children || []);
                const modStroke = 4;
                const modR = 22;
                const modCirc = 2 * Math.PI * modR;
                const modOffset = modCirc - (Math.min(modPerc, 100) / 100) * modCirc;

                return (
                  <Box sx={{ px: 2, pb: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 0.5, textAlign: 'center' }}>
                      <Typography sx={{ fontFamily: 'Open Sans', fontSize: '13px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.3 }}>{currentModule.name}</Typography>
                      <Typography sx={{ fontFamily: 'Open Sans', fontSize: '10px', color: '#9E9E9E', fontWeight: 400, mt: 0.25 }}>
                        {(currentModule.children || []).length} Subtopics · {allModLessons.length} Lessons
                      </Typography>
                    </Box>
                    {/* Figma: #E0E0E0 divider below the module heading */}
                    <Divider sx={{ border: "1.5px solid", borderColor: '#E0E0E0', mt: 1, mb: 2 }} />
                  </Box>
                );
              })()}

              {(() => {
                const getLeafNodes = (n: any): any[] => {
                  if (!n) return [];
                  const isColNode = isCollection(n);
                  if (!isColNode && n.identifier !== courseId) return [n];
                  return (n.children || []).flatMap((c: any) => getLeafNodes(c));
                };

                const renderTreeNode = (node: any, pModId: string, pSubId: string, idx: number, siblings: any[], depth: number = 0): React.ReactNode => {
                  const nodeId = node.identifier || node.id;
                  const isColNode = isCollection(node);
                  const nodeChildren = node.children || [];

                  if (isColNode) {
                    const isCurrentSub = nodeId === subtopicId || expandedSubtopics.has(nodeId);
                    const subExpanded = expandedSubtopics.has(nodeId);
                    const subPerc = Math.round(completionCache.get(nodeId) ?? 0);
                    const subDone = subPerc >= 70;
                    const subInProgress = subPerc > 0 && subPerc < 70;
                    const hasSubtopicChildren = nodeChildren.some((c: any) => isCollection(c));
                    const displayChildren = hasSubtopicChildren ? nodeChildren : getLeafNodes(node);
                    const doneCount = displayChildren.filter((l: any) => (completionCache.get(l.identifier || l.id) ?? 0) >= 70).length;
                    const unitLabel = hasSubtopicChildren ? 'Subtopics' : 'Lessons';
                    const isLocked = idx > 0 && (completionCache.get(siblings[idx - 1].identifier || siblings[idx - 1].id) ?? 0) < 70;
                    const subStatusColor = isLocked ? '#E5E7EB' : (subDone ? SUCCESS : (subInProgress ? PRIMARY : '#DADADA'));

                    return (
                      <Box key={nodeId} sx={{ px: 1, mb: 1.2, ml: depth > 0 ? 0.5 : 0 }}>
                        <Box sx={{ border: `1.5px solid ${subStatusColor}`, borderRadius: '14px', bgcolor: '#fff', opacity: isLocked ? 0.65 : 1, boxShadow: isCurrentSub ? '0 4px 12px rgba(230,135,60,0.1)' : 'none', overflow: 'hidden' }}>
                          <Box
                            onClick={() => {
                              if (isLocked) return;
                              setExpandedSubtopics(prev => {
                                const next = new Set(prev);
                                if (next.has(nodeId)) {
                                  next.delete(nodeId);
                                } else {
                                  next.add(nodeId);
                                }
                                return next;
                              });
                            }}
                            sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', cursor: isLocked ? 'not-allowed' : 'pointer' }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                              {isLocked && (
                                <LockRoundedIcon sx={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0 }} />
                              )}
                              <Typography sx={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: isLocked ? '#9CA3AF' : '#1A1A1A', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                                {node.name}
                              </Typography>
                              <Box sx={{ color: subStatusColor, display: 'flex', alignItems: 'center', mt: -0.2, flexShrink: 0 }}>
                                {isLocked ? (
                                  <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: '#D1D5DB' }} />
                                ) : subExpanded ? (
                                  <UnfoldLessRoundedIcon sx={{ fontSize: 22 }} />
                                ) : (
                                  <UnfoldMoreRoundedIcon sx={{ fontSize: 22 }} />
                                )}
                              </Box>
                            </Box>
                            <Typography sx={{ fontFamily: 'Inter', fontSize: '10px', color: '#999999', fontWeight: 400, mb: (node.description && subExpanded) ? 0.3 : 0 }}>
                              Completed {doneCount}/{displayChildren.length} {unitLabel}
                            </Typography>
                            {(node.description && subExpanded) && (
                              <Typography sx={{ fontFamily: 'Inter', fontSize: '10px', fontWeight: 400, color: '#999999' }}>
                                {node.description}
                              </Typography>
                            )}
                          </Box>
                          <Collapse in={subExpanded && !isLocked}>
                            <Box sx={{ bgcolor: '#F9FAFB', pt: 1, pb: 1 }}>
                              {nodeChildren.map((childNode: any, cIdx: number) =>
                                renderTreeNode(childNode, pModId, nodeId, cIdx, nodeChildren, depth + 1)
                              )}
                            </Box>
                          </Collapse>
                        </Box>
                      </Box>
                    );
                  }

                  // Playable Leaf Lesson item
                  const isCurrent = nodeId === (currentLesson?.identifier || lessonId);
                  const lInfo = getStatusInfo(nodeId);
                  const lDone = lInfo.state === 'done';
                  const isStarted = lInfo.percentage > 0 || isCurrent;

                  const isLessonLocked = idx > 0 && (() => {
                    const prevLesson = siblings[idx - 1];
                    const prevId = prevLesson.identifier || prevLesson.id;
                    return (completionCache.get(prevId) ?? 0) < 70;
                  })();

                  let borderColor = '#E5E7EB';
                  if (isLessonLocked) borderColor = '#E5E7EB';
                  else if (lDone) borderColor = SUCCESS;
                  else if (isStarted) borderColor = PRIMARY;

                  return (
                    <Box key={nodeId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, mb: 1.5, ml: depth > 1 ? 0.5 : 0 }}>
                      <Box sx={{ width: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                        {isLessonLocked ? (
                          <LockRoundedIcon sx={{ fontSize: 20, color: '#9CA3AF', flexShrink: 0 }} />
                        ) : lDone ? (
                          <CheckCircleRoundedIcon sx={{ fontSize: 24, color: SUCCESS }} />
                        ) : isStarted ? (
                          <ProgressCircle percentage={lInfo.percentage} isCurrent={isCurrent} size={24} />
                        ) : (
                          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#6B7280', fontFamily: 'Inter' }}>0%</Typography>
                        )}
                      </Box>

                      <Box
                        onClick={() => {
                          if (!isLessonLocked) {
                            goTo({ ...node, parentModuleId: pModId, parentSubtopicId: pSubId });
                          }
                        }}
                        sx={{
                          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5,
                          px: 1.5, py: 1.25, bgcolor: isLessonLocked ? '#F9FAFB' : '#fff', borderRadius: '8px',
                          border: `1px solid ${borderColor}`,
                          cursor: isLessonLocked ? 'not-allowed' : 'pointer',
                          opacity: isLessonLocked ? 0.6 : 1,
                          transition: 'all 0.2s',
                          '&:hover': isLessonLocked ? {} : { bgcolor: '#F9FAFB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '12px', fontWeight: 700, color: isLessonLocked ? '#9CA3AF' : '#1A1A1A', lineHeight: 1.3 }}>
                            {node.name}
                          </Typography>
                          <Typography sx={{ fontFamily: 'Inter', fontSize: '10px', color: '#999999', fontWeight: 400, mt: 0.2 }}>
                            {node.topic || node.contentType || 'Topic'}
                          </Typography>
                        </Box>
                        <ArrowForwardRoundedIcon sx={{ fontSize: 16, color: lDone ? SUCCESS : (isStarted ? PRIMARY : '#D1D5DB') }} />
                      </Box>
                    </Box>
                  );
                };

                const rootChildren = currentModule?.children || [];
                return rootChildren.map((sub: any, sIdx: number) =>
                  renderTreeNode(sub, moduleId, sub.identifier || sub.id, sIdx, rootChildren, 0)
                );
              })()}
              <Box sx={{ height: 40 }} />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
                {currentLesson && (
                  <>
                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 2.5, border: '1px solid #E5E7EB' }}>
                      <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1 }}>
                        {/* <Typography sx={{ color: '#fff', fontSize: '12px', fontWeight: 700, fontFamily: 'Open Sans' }}>Text Card</Typography> */}
                      </Box>
                      <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                        <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 700, fontSize: '20px', color: '#1A1A1A', mb: 0.5 }}>{currentLesson.name}</Typography>
                        {currentLesson.subtitle && <Typography sx={{ fontFamily: 'Open Sans', fontSize: '14px', color: PRIMARY, fontWeight: 600, mb: 1.5 }}>{currentLesson.subtitle}</Typography>}
                        {(currentLesson.body || currentLesson.description || currentLesson.subtitle) && <Divider sx={{ borderColor: '#F3F4F6', mb: 1.5 }} />}
                        {currentLesson.description && <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 400, fontStyle: 'normal', fontSize: '13px', color: '#1A1A1A', mb: currentLesson.body ? 1.5 : 0 }}>{currentLesson.description}</Typography>}
                        {currentLesson.body && <Typography sx={{ fontFamily: 'Open Sans', fontSize: '14px', color: '#1A1A1A', fontWeight: 400, lineHeight: 1.7 }}>{currentLesson.body}</Typography>}
                      </Box>
                    </Box>
                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 1.5, border: '1px solid #E5E7EB', background: currentLesson.mimeType?.startsWith('video/') ? '#1C2B4A' : '#fff' }}>
                      {currentLesson.mimeType?.startsWith('video/') && (
                        <Typography sx={{ px: 2, py: 0.75, fontSize: 11, fontWeight: 700, color: '#fff', bgcolor: '#1C2B4A' }}>
                          Video
                        </Typography>
                      )}
                      <Box sx={{ bgcolor: currentLesson.mimeType?.startsWith('video/') ? DARK_NAV : 'transparent' }}>
                        <SwadhaarContentPlayer
                          key={currentLesson.identifier}
                          identifier={currentLesson.identifier}
                          courseId={courseId}
                          unitId={subtopicId}
                          mimeType={currentLesson.mimeType}
                          contentType={currentLesson.contentType}
                          contentUrl={currentLesson.artifactUrl || currentLesson.downloadUrl}
                          posterImage={currentLesson.posterImage || currentLesson.appIcon}
                          name={currentLesson.name}
                          description={currentLesson.description}
                          attempts={statusData.find((s) => s.contentId === currentLesson.identifier)?.attempts || 0}
                          initialProgress={currentCompletion}
                          isCompleted={currentCompletion >= 100}
                          onProgress={handleProgress}
                          onComplete={handleComplete}
                          onQuizFail={() => setQuizFailOpen(true)}
                        />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', mb: 3, px: 0.5 }}>{currentLesson.name} — {currentLesson.topic || currentLesson.contentType || 'topic'}</Typography>
                  </>
                )}
              </Box>

              <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #F3F4F6', px: 4, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                <Button variant="outlined" onClick={() => prevLesson ? goTo(prevLesson) : router.push('/swadhaar-home')} sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '10px', fontWeight: 600, textTransform: 'none', fontSize: 15, px: 3, minWidth: 110, fontFamily: 'Open sans' }}>{t('LEARNER_APP.LEARN.PREVIOUS')}</Button>
                <Typography sx={{ fontFamily: 'Open sans', fontWeight: 600, fontSize: 11, color: "#11A1A", px: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, textAlign: 'center' }}>{currentLesson?.name || ''}</Typography>
                <Button
                  variant="contained"
                  disabled={currentCompletion < 70}
                  onClick={handleNext}
                  sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '10px', fontWeight: 600, textTransform: 'none', fontSize: 15, fontFamily: 'Open sans', px: 3, minWidth: 110, boxShadow: 'none', '&:hover': { bgcolor: '#D4762B', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' } }}
                >
                  {t('LEARNER_APP.LEARN.NEXT')}
                </Button>
              </Box>
            </Box>

            {alertsOpen && (
              <Box sx={{ width: 360, flexShrink: 0, borderLeft: '1.5px solid #E5E7EB', bgcolor: '#F4F6FA', overflowY: 'auto' }}>
                <SwadhaarDesktopAlertsPanel userId={userId} onClose={() => setAlertsOpen(false)} />
              </Box>
            )}
          </Box>

          {completionModal && (
            <SwadhaarDesktopCompletionModal
              open={!!completionModal}
              mode={completionModal.mode}
              levelName={completionModal.levelName}
              courseId={courseId}
              upNext={completionModal.upNext}
              currentGroup={completionModal.currentGroup}
              continueText={completionModal.continueText}
              onClose={() => setCompletionModal(null)}
              onContinue={() => {
                setCompletionModal(null);
                if (completionModal.onContinue) {
                  completionModal.onContinue();
                } else {
                  if (nextLessonInCourse) goTo(nextLessonInCourse);
                  else router.push('/swadhaar-home');
                }
              }}
              onStartNextLevel={() => router.push('/swadhaar-home')}
            />
          )}

          {/* Quiz Fail Modal — shown when quiz score < 70% */}
          <SwadhaarQuizFailModal
            open={quizFailOpen}
            onOkay={() => {
              setQuizFailOpen(false);
              // Navigate to the very first lesson of the entire course
              const firstLesson = allLessons[0];
              if (firstLesson) {
                goTo(firstLesson);
              } else {
                router.push('/swadhaar-home');
              }
            }}
          />

          <SwadhaarDesktopEditProfileModal
            open={editProfileOpen}
            onClose={() => setEditProfileOpen(false)}
            onProfileUpdated={() => {
              loadHierarchy();
              syncStatus();
              fetchUserProfile();
            }}
          />

          <ConfirmationModal
            modalOpen={logoutConfirmOpen}
            message={t('COMMON.SURE_LOGOUT')}
            handleAction={handleLogoutConfirm}
            handleCloseModal={() => setLogoutConfirmOpen(false)}
            buttonNames={{ primary: t('COMMON.LOGOUT'), secondary: t('COMMON.CANCEL') }}
          />
        </>
      )}
    </Box>
  );
};

export default SwadhaarDesktopLessonPlayer;
