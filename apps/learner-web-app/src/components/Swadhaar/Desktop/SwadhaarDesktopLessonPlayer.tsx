'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Button, Collapse, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getCourseHierarchy, getContentCourseStatus } from '@learner/utils/API/SwadhaarService';
import { useContentTracking } from '@learner/hooks/useContentTracking';
import { SwadhaarContentPlayer } from '@learner/components/Swadhaar/Player/SwadhaarContentPlayer';
import SwadhaarDesktopHeader from './SwadhaarDesktopHeader';
import SwadhaarDesktopCompletionModal, { CompletionMode, CompletionModalProps } from './SwadhaarDesktopCompletionModal';
import SwadhaarDesktopAlertsPanel from './SwadhaarDesktopAlertsPanel';
import SwadhaarDesktopEditProfileModal from './SwadhaarDesktopEditProfileModal';
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
  const isDone = percentage >= 100;
  
  if (isLocked) return <LockRoundedIcon sx={{ fontSize: size - 4, color: '#9CA3AF', flexShrink: 0 }} />;
  if (isDone) return <CheckCircleRoundedIcon sx={{ fontSize: size, color: SUCCESS, flexShrink: 0 }} />;
  
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
            stroke={PRIMARY}
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
          <Typography sx={{ fontSize: size * 0.32, fontWeight: 800, color: PRIMARY, letterSpacing: -0.5 }}>
            {Math.round(percentage)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

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
    mode: CompletionMode; upNext?: CompletionModalProps['upNext']; levelName?: string;
  } | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(guard)); } catch {}
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
      const active = allLessons.find((l) => l.identifier === lessonId);
      if (active) {
        setCurrentLesson(active);
        // Ensure subtopic is expanded
        if (active.parentSubtopicId) {
          setExpandedSubtopics(prev => {
            if (prev.has(active.parentSubtopicId)) return prev;
            const next = new Set(prev);
            next.add(active.parentSubtopicId);
            return next;
          });
        }
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
        perc = childPercs.length > 0 ? childPercs.reduce((a, b) => a + b, 0) / childPercs.length : 0;
      }
      cache.set(id, perc);
      return perc;
    };
    if (courseHierarchy) walk(courseHierarchy);
    return cache;
  }, [courseHierarchy, statusData, buildStatusMap]);

  const getStatusInfo = (id: string) => {
    const perc = completionCache.get(id) ?? 0;
    return { state: perc >= 100 ? 'done' : perc > 0 ? 'progress' : 'todo', percentage: perc };
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

    const ch = hierarchyRef.current;
    const lesson = currentLessonRef.current;
    const activeModuleId = lesson.parentModuleId || moduleId;
    const currentMod = (ch.children || []).find((m: any) => (m.identifier || m.id) === activeModuleId);
    
    // 4. Position-based completion: avoid stale statusData from previous sessions
    clearSessionGuard(id);
    
    const hasMoreInCourse = nextLessonInCourseRef.current !== null;
    const smap = buildStatusMap(statusRef.current);
    const modPerc = currentMod ? calculateNodeCompletion(currentMod, smap) : 0;

    if (hasMoreInCourse && modPerc >= 99) {
      // More course content exists AND module is done → MODULE COMPLETE
      
      // Find the NEXT module to show in "Up Next"
      const modules = ch.children || [];
      const currentModIdx = modules.findIndex((m: any) => (m.identifier || m.id) === activeModuleId);
      const nextMod = currentModIdx !== -1 && currentModIdx < modules.length - 1 ? modules[currentModIdx + 1] : null;

      console.log('[COMPLETION] Triggering MODULE modal');
      setCompletionModal({
        mode: 'module',
        upNext: {
          groupName: nextMod?.name || 'Next Module',
          groupSubtitle: `Up Next in ${ch.name || 'Course'}`,
          items: (nextMod?.children || []).map((s: any) => {
            const lessons = s.children || [];
            const isLesson = !lessons.length;
            const perc = Math.round(completionCache.get(s.identifier || s.id) ?? 0);
            return {
              id: s.identifier || s.id,
              name: s.name,
              subtitle: isLesson ? 'Lesson' : `${lessons.length} Lessons`,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }),
        },
      });
    } else if (!hasMoreInCourse && modPerc >= 99) {
      // No more content AND module is done → COURSE COMPLETE
      const modules = ch.children || [];
      console.log('[COMPLETION] Triggering COURSE modal');
      setCompletionModal({
        mode: 'course',
        levelName: ch.name || '',
        upNext: {
          groupName: ch.name || 'Course Complete',
          groupSubtitle: `${modules.length} Modules Finished`,
          items: modules.map((m: any) => ({
            id: m.identifier || m.id,
            name: m.name,
            subtitle: `${m.children?.length || 0} Subtopics`,
            completionPercentage: 100,
            status: 2,
          })),
        },
      });
    }
  }, [syncStatus, moduleId, completionCache, buildStatusMap]);

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

  const goTo = (lesson: any) => {
    setCurrentLesson(lesson); // Immediate UI update
    const targetMod = lesson.parentModuleId || moduleId;
    const targetSub = lesson.parentSubtopicId || subtopicId;
    router.push(`/learn/${courseId}/${targetMod}/${targetSub}/${lesson.identifier}`, { scroll: false });
  };

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

  const handleNext = () => {
    if (!currentLesson) return;

    // Use actual parent IDs from the current lesson (not stale URL params)
    const activeModuleId = currentLesson.parentModuleId || moduleId;

    console.log('[DEBUG] handleNext', {
      lessonId: currentLesson.identifier,
      activeModuleId,
      nextLesson: nextLesson?.identifier,
      nextLessonInCourse: nextLessonInCourse?.identifier,
      allLessonsCount: allLessons.length,
      currentLessonIndex: allLessons.findIndex(l => l.identifier === currentLesson.identifier)
    });

    if (nextLesson) {
      // Navigate to next lesson within this module's sidebar list
      goTo(nextLesson);
    } else if (nextLessonInCourse) {
      // Last lesson in this module, but course has more content → MODULE COMPLETE
      
      // Find the NEXT module to show in "Up Next"
      const modules = courseHierarchy?.children || [];
      const currentModIdx = modules.findIndex((m: any) => (m.identifier || m.id) === activeModuleId);
      const nextMod = currentModIdx !== -1 && currentModIdx < modules.length - 1 ? modules[currentModIdx + 1] : null;

      // Only show modal if the current module is genuinely 100% complete
      const currentModObj = modules[currentModIdx];
      const smap = buildStatusMap(statusData);
      const modPerc = currentModObj ? calculateNodeCompletion(currentModObj, smap) : 0;

      if (modPerc < 99) {
          // If module incomplete, just stay here (Next button will remain disabled anyway)
          console.log('[DEBUG] handleNext: Module incomplete, not showing modal');
          return;
      }

      setCompletionModal({
        mode: 'module',
        upNext: {
          groupName: nextMod?.name || 'Next Module',
          groupSubtitle: `Up Next in ${courseHierarchy?.name || 'Course'}`,
          items: (nextMod?.children || []).map((s: any) => {
            const lessons = s.children || [];
            const isLesson = !lessons.length;
            const perc = Math.round(completionCache.get(s.identifier || s.id) ?? 0);
            return {
              id: s.identifier || s.id,
              name: s.name,
              subtitle: isLesson ? 'Lesson' : `${lessons.length} Lessons`,
              completionPercentage: perc,
              status: perc >= 100 ? 2 : perc > 0 ? 1 : 0,
            };
          }),
        },
      });
    } else {
      // Last lesson in the entire course → COURSE COMPLETE
      const modules = courseHierarchy?.children || [];
      setCompletionModal({
        mode: 'course',
        levelName: courseHierarchy?.name || '',
        upNext: {
          groupName: courseHierarchy?.name || 'Course Complete',
          groupSubtitle: `${modules.length} Modules Finished`,
          items: modules.map((m: any) => ({
            id: m.identifier || m.id,
            name: m.name,
            subtitle: `${m.children?.length || 0} Subtopics`,
            completionPercentage: 100,
            status: 2,
          })),
        },
      });
    }
  };

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
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>{t('LEARNER_APP.HOME.BACK_TO_HOME')}</Typography>
          </Box>

          {currentModule && (() => {
            const mId = currentModule.identifier || currentModule.id;
            const modPerc = Math.round(completionCache.get(mId) ?? 0);
            const modDone = modPerc >= 100;
            const allModLessons = (currentModule.children || []).flatMap((s: any) => s.children || []);
            const modStroke = 4;
            const modR = 22;
            const modCirc = 2 * Math.PI * modR;
            const modOffset = modCirc - (Math.min(modPerc, 100) / 100) * modCirc;

            return (
              <Box sx={{ px: 0, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box sx={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
                    <svg width={52} height={52} style={{ position: 'absolute', top: 0, left: 0 }}>
                      <circle stroke="#E0E0E0" strokeWidth={modStroke} fill="transparent" r={modR} cx={26} cy={26} />
                      {modPerc > 0 && (
                        <circle
                          stroke={modDone ? SUCCESS : PRIMARY}
                          strokeWidth={modStroke} fill="transparent" r={modR} cx={26} cy={26}
                          strokeDasharray={modCirc} strokeDashoffset={modOffset} strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                        />
                      )}
                    </svg>
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {modDone ? <CheckCircleRoundedIcon sx={{ fontSize: 22, color: SUCCESS }} /> : (
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: modPerc > 0 ? PRIMARY : '#9CA3AF' }}>{modPerc}%</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: DARK_NAV, lineHeight: 1.3 }}>{currentModule.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, mt: 0.25 }}>
                      {(currentModule.children || []).length} Subtopics · {allModLessons.length} Lessons
                    </Typography>
                  </Box>
                </Box>
                {/* Figma: #E0E0E0 divider below the module heading */}
                <Divider sx={{ border: "1.5px solid", borderColor: '#E0E0E0', mt: 1, mb: 2 }} />
              </Box>
            );
          })()}

          {(currentModule?.children || []).map((sub: any, sIdx: number) => {
            const sId = sub.identifier || sub.id;
            const isCurrentSub = sId === subtopicId;
            const subExpanded = expandedSubtopics.has(sId);
            const subPerc = Math.round(completionCache.get(sId) ?? 0);
            const subDone = subPerc >= 100;
            const subInProgress = subPerc > 0 && subPerc < 100;
            const subLessons = sub.children || [];
            const doneCount = subLessons.filter(l => (completionCache.get(l.identifier || l.id) ?? 0) >= 100).length;
            const isLocked = sIdx > 0 && (completionCache.get(currentModule.children[sIdx - 1].identifier || currentModule.children[sIdx - 1].id) ?? 0) < 100;
            const subStatusColor = isLocked ? '#E5E7EB' : (subDone ? SUCCESS : (subInProgress ? PRIMARY : '#DADADA'));

            return (
              <Box key={sId} sx={{ px: 1, mb: 1.2 }}>
                <Box sx={{ border: `1.5px solid ${subStatusColor}`, borderRadius: '14px', bgcolor: '#fff', opacity: isLocked ? 0.65 : 1, boxShadow: isCurrentSub ? '0 4px 12px rgba(230,135,60,0.1)' : 'none', overflow: 'hidden' }}>
                  <Box onClick={() => {
                    if (isLocked) return;
                    setExpandedSubtopics(prev => {
                      const next = new Set(prev);
                      if (!next.has(sId)) next.add(sId); // Ensure it expands when clicked to play
                      return next;
                    });
                    if (subLessons.length > 0) {
                      const firstLesson = subLessons[0];
                      if ((firstLesson.identifier || firstLesson.id) !== (currentLesson?.identifier || lessonId)) {
                        goTo({ ...firstLesson, parentModuleId: moduleId, parentSubtopicId: sId });
                      }
                    } else if (!isCollection(sub)) {
                      // If it's a leaf content (like a quiz or video directly under module)
                      if ((sub.identifier || sub.id) !== (currentLesson?.identifier || lessonId)) {
                        goTo({ ...sub, parentModuleId: moduleId, parentSubtopicId: moduleId });
                      }
                    }
                  }} sx={{ px: 1.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                    <Box sx={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isLocked ? <LockRoundedIcon sx={{ fontSize: 28, color: '#C7C7C7' }} /> : subDone ? <CheckCircleRoundedIcon sx={{ fontSize: 32, color: SUCCESS }} /> : <ProgressCircle percentage={subPerc} size={40} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: DARK_NAV, lineHeight: 1.2, mb: 0.3 }}>{sub.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>Completed {doneCount}/{subLessons.length} Lessons</Typography>
                    </Box>
                    <Box sx={{ color: subStatusColor, display: 'flex', alignItems: 'center' }}>
                      {subExpanded ? <KeyboardArrowUpIcon sx={{ fontSize: 22 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />}
                    </Box>
                  </Box>
                  <Collapse in={subExpanded && !isLocked}>
                    <Box sx={{ bgcolor: '#F9FAFB' }}>
                      {subLessons.map((lesson: any, lIdx: number) => {
                        const lId = lesson.identifier || lesson.id;
                        const isCurrent = lId === (currentLesson?.identifier || lessonId);
                        const lInfo = getStatusInfo(lId);
                        const lDone = lInfo.state === 'done';
                        return (
                          <Box key={lId}>
                            <Box onClick={() => goTo({ ...lesson, parentModuleId: moduleId, parentSubtopicId: sId })} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2, pr: 2, py: 1.5, cursor: 'pointer', bgcolor: isCurrent ? '#FFF7F0' : 'transparent', '&:hover': { bgcolor: isCurrent ? '#FFF7F0' : '#F3F4F6' } }}>
                              <Box sx={{ width: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                {lDone ? <CheckCircleRoundedIcon sx={{ fontSize: 22, color: SUCCESS }} /> : (lInfo.percentage > 0 || isCurrent) ? <ProgressCircle percentage={lInfo.percentage} isCurrent={isCurrent} size={24} /> : <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 22, color: '#D1D5DB' }} />}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? PRIMARY : '#4B5563', lineHeight: 1.3 }}>{lesson.name}</Typography>
                                <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 500, mt: 0.2 }}>{lDone ? 'Completed' : `${Math.round(lInfo.percentage)}% Complete`}</Typography>
                              </Box>
                              <ChevronRightRoundedIcon sx={{ fontSize: 18, color: lDone ? SUCCESS : '#D1D5DB' }} />
                            </Box>
                            {lIdx < subLessons.length - 1 && <Divider sx={{ mx: 2, borderColor: '#EEF0F2' }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              </Box>
            );
          })}
          <Box sx={{ height: 40 }} />
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
            {currentLesson && (
              <>
                <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 2.5, border: '1px solid #E5E7EB' }}>
                  <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 0.75 }} />
                  <Box sx={{ bgcolor: '#fff', p: 2.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#1F2937', mb: 0.5 }}>{currentLesson.name}</Typography>
                    {currentLesson.description && <Typography sx={{ fontSize: 13, color: PRIMARY, fontWeight: 600, mb: 1 }}>{currentLesson.description}</Typography>}
                    {currentLesson.body && <Typography sx={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{currentLesson.body}</Typography>}
                  </Box>
                </Box>
                <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 1.5, border: '1px solid #E5E7EB' }}>
                  <Box sx={{ bgcolor: PRIMARY, px: 2, py: 0.75 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Video</Typography>
                  </Box>
                  <Box sx={{ bgcolor: DARK_NAV }}>
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
                    />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF', mb: 3, px: 0.5 }}>{currentLesson.name} — {currentLesson.topic || currentLesson.contentType || 'topic'}</Typography>
              </>
            )}
          </Box>

          <Box sx={{ bgcolor: '#fff', borderTop: '1px solid #F3F4F6', px: 4, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
            <Button variant="outlined" onClick={() => prevLesson ? goTo(prevLesson) : router.push('/swadhaar-home')} sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: 13, px: 3, minWidth: 110 }}>{t('LEARNER_APP.LEARN.PREVIOUS')}</Button>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: DARK_NAV, px: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, textAlign: 'center' }}>{currentLesson?.name || ''}</Typography>
            <Button 
              variant="contained" 
              disabled={currentCompletion < 100} 
              onClick={handleNext}
              sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '10px', fontWeight: 700, textTransform: 'none', fontSize: 13, px: 3, minWidth: 110, boxShadow: 'none', '&:hover': { bgcolor: '#D4762B', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' } }}
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
          open={true}
          mode={completionModal.mode}
          levelName={completionModal.levelName}
          courseId={courseId}
          upNext={completionModal.upNext}
          onClose={() => setCompletionModal(null)}
          onContinue={() => {
            setCompletionModal(null);
            if (nextLessonInCourse) goTo(nextLessonInCourse);
            else router.push('/swadhaar-home');
          }}
          onStartNextLevel={() => router.push('/swadhaar-home')}
        />
      )}

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
        message="Are you sure you want to log out?"
        handleAction={handleLogoutConfirm}
        handleCloseModal={() => setLogoutConfirmOpen(false)}
        buttonNames={{ primary: 'Logout', secondary: 'Cancel' }}
      />
    </>
    )}
    </Box>
  );
};

export default SwadhaarDesktopLessonPlayer;
