'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, CircularProgress, Badge, Collapse, Button, useMediaQuery, useTheme,
} from '@mui/material';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import { SwadhaarDesktopHome } from '@learner/components/Swadhaar/Desktop';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import { useTenant } from '@learner/context/TenantContext';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import AlertsCarousel from '@learner/components/AlertsCarousel/AlertsCarousel';
import SwadhaarLevelAccordion from '@learner/components/Swadhaar/SwadhaarLevelAccordion';
import ProfileAvatar from '@learner/components/Profile/ProfileAvatar';
import {
  fetchSwadhaarLevelCourses,
  getContentCourseStatus,
  trackCourseClick,
} from '@learner/utils/API/SwadhaarService';
import {
  getAlerts,
  getUnreadCount,
  addAlert,
  updateAlertLockStates,
  detectNewContent,
  fetchAndSyncAlerts,
  markAsRead,
  AlertCard,
} from '@learner/utils/alertsStore';
import { sendCourseCompleteNotification, markNotificationsRead } from '@learner/utils/API/NotificationService';
import { useTranslation } from '@shared-lib';
import { telemetryFactory } from '@learner/utils/telemtery';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

/**
 * Recursive lesson count calculation: returns total lessons and completed lessons count.
 */
const calculateNodeLessons = (node: any, statusList: any[]): { total: number; completed: number } => {
  const id = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusList.find((d: any) => d.contentId === id);
    const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
    return { total: 1, completed: perc / 100 };
  }
  let total = 0;
  let completed = 0;
  node.children.forEach((child: any) => {
    const res = calculateNodeLessons(child, statusList);
    total += res.total;
    completed += res.completed;
  });
  return { total, completed };
};

/**
 * Recursive progress calculation: aggregates completion from leaf nodes up to the current node.
 * Now uses lesson-based calculation for more accurate "actual" progress.
 */
const calculateNodeCompletion = (node: any, statusList: any[]): number => {
  const { total, completed } = calculateNodeLessons(node, statusList);
  return total > 0 ? (completed / total) * 100 : 0;
};

export default function SwadhaarHomePage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unreadAlerts = getAlerts().filter(a => !a.isRead);
      setAlerts(unreadAlerts.slice(0, 3));
      setUnreadCount(unreadAlerts.length);
    }
  }, []);
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('');
  const [viewMore, setViewMore] = useState(false);
  const [expandedActive, setExpandedActive] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      if (!checkAuth()) {
        window.location.replace('/swadhaar-login');
      } else {
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        if (role === 'CFL' ) {
          router.push('/cfl/home');
        }
      }
    }
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId') || '';
      const storedName = localStorage.getItem('firstName') || localStorage.getItem('name') || 'Trainer';
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';
      setUserName(storedName);
      const role = localStorage.getItem('userRole') || 'Trainer';

      setDesignation(role.toLowerCase() === 'learner' ? 'Trainer' : role);
      setProfileImageUrl(localStorage.getItem('profilePicture'));

      const levelCourses = await fetchSwadhaarLevelCourses();
      if (!levelCourses || levelCourses.length === 0) {
        setError(t('LEARNER_APP.HOME.LOAD_ERROR'));
        setIsLoading(false);
        return;
      }

      // Collect all IDs from the hierarchy for status fetching
      const allHierarchyIds: string[] = [];
      levelCourses.forEach((level: any) => {
        allHierarchyIds.push(level.identifier);
        (level.children || []).forEach((mod: any) => {
          allHierarchyIds.push(mod.identifier);
          (mod.children || []).forEach((sub: any) => {
            allHierarchyIds.push(sub.identifier);
            (sub.children || []).forEach((lesson: any) => {
              allHierarchyIds.push(lesson.identifier);
            });
          });
        });
      });

      let status: any[] = [];
      if (userId && allHierarchyIds.length && tenantId) {
        // Fetch status in chunks if there are too many IDs (batch size 100)
        const batchSize = 100;
        for (let i = 0; i < allHierarchyIds.length; i += batchSize) {
          const batch = allHierarchyIds.slice(i, i + batchSize);
          const batchStatus = await getContentCourseStatus([userId], batch, tenantId).catch(() => []);
          status = [...status, ...batchStatus];
        }
      }

      // Apply sessionStorage progress guard so that lessons the backend auto-completed
      // prematurely still show their locally-tracked in-progress percentage here.
      try {
        const raw = sessionStorage.getItem('swadhaar_progress_guard');
        const guard: Record<string, { percentage: number; status: number }> = raw ? JSON.parse(raw) : {};
        status = status.map(item => {
          const sessionEntry = guard[item.contentId];
          if (sessionEntry && sessionEntry.status === 1 && item.status === 2) {
            return { ...item, status: 1, completionPercentage: sessionEntry.percentage };
          }
          return item;
        });
      } catch { /* sessionStorage unavailable (SSR) */ }

      setStatusData(status);

      // Recursive filter: removes nodes (Levels, Modules, Subtopics) that do not contain any lessons
      const filterHierarchy = (items: any[]): any[] => {
        return items
          .map((item) => {
            if (item.children && item.children.length > 0) {
              const filteredChildren = filterHierarchy(item.children);
              return { ...item, children: filteredChildren };
            }
            return item;
          })
          .filter((item) => {
            const isContainer = item.mimeType === 'application/vnd.ekstep.content-collection' || 
                               item.contentType === 'CourseUnit' || 
                               item.contentType === 'TextBookUnit';
            if (item.children) {
              return item.children.length > 0;
            }
            return !isContainer;
          });
      };

      const filteredLevelCourses = filterHierarchy(levelCourses);


      // Map dynamic levels from search API results based on filtered hierarchy
      const levelDataList = filteredLevelCourses.map((course: any, idx: number, filteredLevels: any[]) => {
        const children = course?.children || [];
        
        const moduleDetails = children.map((m: any) => {
          const modulePerc = calculateNodeCompletion(m, status);
          return { isModuleComplete: modulePerc >= 100, modulePerc };
        });
        
        const levelStats = calculateNodeLessons(course, status);
        const levelPerc = levelStats.total > 0 ? (levelStats.completed / levelStats.total) * 100 : 0;

        // Store calculated completion for next level's check
        (course as any).calculatedCompletion = levelPerc;

        // Fixed unlock logic: a course is unlocked if:
        // 1. It's the first course, OR
        // 2. The previous course is 100% complete, OR
        // 3. It already has progress > 0% (in-progress or completed)
        const previousCompleted = idx === 0 || Math.round((filteredLevels[idx - 1] as any)?.calculatedCompletion || 0) >= 100;
        const isUnlocked = previousCompleted;

        const completedModulesCount = isUnlocked ? moduleDetails.filter((md: any) => md.isModuleComplete).length : 0;
        const displayPerc = isUnlocked ? Math.round(levelPerc) : 0;

        return {
          id: course.identifier,
          name: course.name,
          completedModules: completedModulesCount,
          totalModules: children.length,
          completionPercentage: displayPerc,
          isUnlocked,
          rawChildren: children
        };
      });

      const sortedLevels = levelDataList;

      setLevels(sortedLevels);
      
      // Prioritize in-progress courses (progress > 0 and < 100) over not-started ones
      const active =
        levelDataList.find((l) => l.isUnlocked && l.completionPercentage > 0 && l.completionPercentage < 100)
        || levelDataList.find((l) => l.isUnlocked && l.completionPercentage < 100)
        || levelDataList[0];
      setActiveLevel(active);

      // ── Component 4: ID-based new content detection ──
      // const newContentItems = detectNewContent(
      //   filteredLevelCourses.map((c: any) => ({ id: c.identifier, name: c.name, children: c.children || [] }))
      // );
      // Seed alerts for newly detected content
      // newContentItems.forEach((item) => {
        // const isCourseLocked = !levelDataList.find((l: any) => l.id === item.courseId)?.isUnlocked;
        // addAlert({
        //   id: `new-${item.type}-${item.contentId}`,
        //   type: item.type === 'quiz' ? 'quiz' : 'content',
        //   title: item.type === 'quiz' ? 'New Quiz Available' : 'New Content Reminder',
        //   message: `New ${item.type} added in ${item.name}`,
        //   timestamp: new Date().toISOString(),
        //   isRead: false,
        //   actionUrl: `/learn/${item.courseId}`,
        //   locked: isCourseLocked,
        //   lockedMessage: isCourseLocked ? 'Complete previous course to unlock.' : undefined,
        //   metadata: { courseId: item.courseId },
        // });
      // });

      // ── Component 6: Quiz reminder trigger ──
      // const findQuizNodes = (children: any[]): any[] => {
      //   const quizzes: any[] = [];
      //   for (const child of children || []) {
      //     if (child.mimeType?.includes('questionset') || child.primaryCategory === 'Practice Question Set') {
      //       quizzes.push(child);
      //     }
      //     if (child.children) quizzes.push(...findQuizNodes(child.children));
      //   }
      //   return quizzes;
      // };

      // levelDataList.forEach((level: any) => {
      //   if (!level.isUnlocked) return;
      //   const quizNodes = findQuizNodes(level.rawChildren);
      //   quizNodes.forEach((quiz: any) => {
      //     const quizStatus = status.find((s: any) => s.contentId === quiz.identifier);
      //     if (!quizStatus || quizStatus.status !== 2) {
      //       addAlert({
      //         id: `quiz-reminder-${quiz.identifier}`,
      //         type: 'quiz',
      //         title: 'Quiz Reminder',
      //         message: `You have a pending quiz in ${level.name}`,
      //         timestamp: new Date().toISOString(),
      //         isRead: false,
      //         actionUrl: `/learn/${level.id}`,
      //         locked: false,
      //         metadata: { courseId: level.id },
      //       });
      //     }
      //   });
      // });

      // ── Component 7: Course completion reminder ──
      // levelDataList.forEach((level: any) => {
      //   if (level.completionPercentage >= 100) {
      //     addAlert({
      //       id: `completion-${level.id}`,
      //       type: 'completion',
      //       title: `${level.name} Completed`,
      //       message: 'Congratulations! Download your certificate.',
      //       timestamp: new Date().toISOString(),
      //       isRead: false,
      //       actionUrl: '/profile',
      //       locked: false,
      //       metadata: { courseId: level.id },
      //     });
      //     // Fire server-side notification (fire-and-forget)
      //     sendCourseCompleteNotification(userId, level.name, storedName).catch(() => {});
      //   }
      // });

      // ── Component 3: Sync alert lock states based on course unlock status ──
      // const updatedAlerts = updateAlertLockStates(levelDataList);
    } catch (err) {
      setError(t('LEARNER_APP.HOME.LOAD_ERROR'));
    } finally {
      setIsLoading(false);
    }
  }, [tenant, t]);

  const handleAlertClick = async (alert: AlertCard) => {
    // Mark locally
    markAsRead(alert.id);
    
    // Update local state immediately
    const updatedAlerts = getAlerts().filter(a => !a.isRead);
    setAlerts(updatedAlerts.slice(0, 3));
    setUnreadCount(updatedAlerts.length);

    // Mark on server
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    if (userId) {
      markNotificationsRead(userId, [alert.id]).catch(() => {});
    }

    // Navigate to actionUrl or detail page
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    } else {
      router.push(`/alerts/${alert.id}`);
    }
  };

  useEffect(() => { 
    loadData(); 
    
    // Sync alerts from API on mount
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchAndSyncAlerts(userId).then(() => {
        const unread = getUnreadCount();
        setUnreadCount(unread);
        setAlerts(getAlerts().filter(a => !a.isRead).slice(0, 3));
      }).catch(() => {});
    }

    telemetryFactory.impression({
      edata: {
        type: 'workflow',
        subtype: '',
        pageid: 'home',
        uri: '/swadhaar-home'
      }
    });
  }, [loadData]);

  if (isLoading) {
    return <Box sx={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', bgcolor: '#F9FAFB' }}><CircularProgress sx={{ color: PRIMARY }} /></Box>;
  }

  // ── Desktop branch ────────────────────────────────────────
  if (isDesktop) {
    return (
      <SwadhaarDesktopHome
        levels={levels}
        activeLevel={activeLevel}
        statusData={statusData}
        alerts={alerts}
        unreadCount={unreadCount}
        userName={userName}
        designation={designation}
        profileImageUrl={profileImageUrl}
        isLoading={false}
        error={error}
        onAlertClick={handleAlertClick}
        onReload={loadData}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#F9FAFB', pb: 10, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #F3F4F6' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', fontFamily: 'Inter, sans-serif' }}>{t('LEARNER_APP.HOME.TITLE')}</Typography>
        <Box onClick={() => router.push('/alerts')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <Badge
            badgeContent={unreadCount > 0 ? unreadCount : null}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 9,
                height: 16,
                minWidth: 16,
                backgroundColor: '#FFFFFF',
                color: '#E6873C',
                border: '1px solid #E6873C',
                top: 2,
                right: 2
              }
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'rgba(230,135,60,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: '#E6873C' }} />
            </Box>
          </Badge>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: PRIMARY, mt: 0.5 }}>{t('LEARNER_APP.ALERTS.TITLE')}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, pt: 2, flex: 1 }}>
        {/* Profile Card & Expandable Progress */}
        <Box sx={{ position: 'relative', mb: 3 }}>
          <Box sx={{ bgcolor: 'info.primary', borderRadius: '16px', p: 2, pb: viewMore ? 2 : 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box>
                <Typography sx={{fontFamily:"Inter, sans-serif", color: 'common.white', fontWeight: 700 }}>
                  {t('LEARNER_APP.HOME.GREETING', { name: userName })}
                </Typography>
                <Typography sx={{ fontFamily:"Inter, sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: 12, mt: 0.5 }}>
                   {t('LEARNER_APP.PROFILE.FIELD_DESIGNATION')}: {designation}
                </Typography>
              </Box>

              <Box
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
                onClick={() => router.push('/swadhar-profile')}
              >
                <ProfileAvatar 
                  initials={getInitials(userName)}
                  imageUrl={profileImageUrl}
                  size={52}
                  primaryColor={PRIMARY}
                />
              </Box>
            </Box>

            {/* Active Level */}
            {activeLevel && (
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: `1px solid ${PRIMARY}`,
                  borderRadius: '12px',
                  p: 1.75,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary',fontFamily:"Inter, sans-serif" ,fontSize:'12px'}}>
                    {activeLevel.name}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mt: 0.5,fontSize:'10px',fontFamily:"Inter, sans-serif" }}>
                    {t('LEARNER_APP.HOME.PROGRESS_TEXT', { percent: activeLevel.completionPercentage })}
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <WorkspacePremiumOutlinedIcon 
                     sx={{ 
                       fontSize: 32, 
                       color: activeLevel.completionPercentage >= 100 ? '#EDB712' : '#C0C4CC',
                       bgcolor: activeLevel.completionPercentage >= 100 ? 'rgba(237, 183, 18, 0.1)' : 'transparent',
                       borderRadius: '50%',
                       p: 0.5
                     }} 
                   />
                </Box>
              </Box>
            )}

            {/* Expanded Levels INSIDE same navy box */}
            <Collapse in={viewMore}>
              <Box sx={{ mt: 1 }}>
                {levels
                  .filter((l) => String(l.id) !== String(activeLevel?.id))
                  .map((l) => (
                    <Box
                      key={l.id}
                      sx={{
                        bgcolor: 'background.paper',
                        border: `1px solid ${PRIMARY}`,
                        borderRadius: '10px',
                        px: 2,
                        py: 1.5,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        // opacity: l.isUnlocked ? 1 : 0.6
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 12, color: 'text.primary', fontFamily: 'Inter, sans-serif' }}>
                          {l.name}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 10, mt: 0.3, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                          {t('LEARNER_APP.HOME.PROGRESS_TEXT', { percent: l.completionPercentage })}
                        </Typography>
                      </Box>
                      {l.isUnlocked ? (
                         <WorkspacePremiumOutlinedIcon 
                           sx={{ 
                             fontSize: 32, 
                             color: l.completionPercentage >= 100 ? '#EDB712' : '#C0C4CC',
                             bgcolor: l.completionPercentage >= 100 ? 'rgba(237, 183, 18, 0.1)' : 'transparent',
                             borderRadius: '50%',
                             p: 0.5
                           }} 
                         />
                      ) : (
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                      )}
                    </Box>
                  ))}
              </Box>
            </Collapse>
          </Box>

          {/* View More Button (only when there are multiple levels) */}
          {levels.length > 1 && (
            <Box
              onClick={() => {
                telemetryFactory.interact({
                  eid: 'INTERACT',
                  edata: {
                    id: 'view-more-click',
                    type: 'CLICK',
                    pageid: 'home',
                    uid: localStorage.getItem('userId') || '',
                  },
                });
                setViewMore(!viewMore);
              }}
              sx={{
                position: 'absolute',
                bottom: -14,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'background.paper',
                border: (theme) => `0.5px solid #1C2B4A`,
                borderRadius: '4px',
                px: 1.5,
                py: 0.6,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                zIndex: 5,
              }}
            >
              <Typography sx={{ fontSize: 11, color: 'info.primary', fontWeight: 500,fontFamily:"Inter, sans-serif" }}>
                {viewMore ? t('LEARNER_APP.HOME.VIEW_LESS') : t('LEARNER_APP.HOME.VIEW_MORE')}
              </Typography>
            </Box>
          )}
        </Box>

        {unreadCount > 0 && (
          <>
            <Typography  sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif', fontSize:'18px', mb: 2, color: 'text.primary' }}>{t('LEARNER_APP.HOME.ALERTS_TITLE')}</Typography>
            <Box sx={{ mb: 4 }}>
              <AlertsCarousel alerts={alerts} onAlertClick={handleAlertClick} />
            </Box>
          </>
        )}

        <Typography sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif', fontSize:'18px', mb: 1.5, color: 'text.primary' }}>{t('LEARNER_APP.HOME.START_LEARNING')}</Typography>

        {/* ── SCREEN 5.3: Level Complete Celebration ── */}
        {(() => {
          const completedLevelIdx = levels.findIndex((l, idx) =>
            l.completionPercentage >= 100 && levels[idx + 1] && levels[idx + 1].completionPercentage === 0
          );
          if (completedLevelIdx < 0) return null;
          const completedLevel = levels[completedLevelIdx];
          const nextLevel = levels[completedLevelIdx + 1];
          return (
            <Box sx={{ mb: 3 }}>
              {/* Trophy + Congratulations card */}
              <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB', p: 3, mb: 2.5, textAlign: 'center' }}>
                <Box sx={{
                  width: 96, height: 96, borderRadius: '50%', bgcolor: '#F59E0B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 2, boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
                }}>
                  <StarRoundedIcon sx={{ fontSize: 52, color: '#fff' }} />
                </Box>
                <Typography sx={{fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 14, color: '#F59E0B', mb: 0.5 }}>Congratulations!</Typography>
                <Typography sx={{fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#6B7280' }}>
                  You have finished {completedLevel.name}!
                </Typography>
              </Box>

              {/* Next Level Unlocked */}
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary', mb: 1.5 }}>
                {nextLevel.name} Unlocked
              </Typography>
              <Box sx={{ border: '1.5px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', bgcolor: '#fff', mb: 2 }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#1C2B4A' }}>{nextLevel.name}</Typography>
                    <Typography sx={{ fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#9CA3AF', mt: 0.25 }}>
                      Completed 0/{nextLevel.totalModules} modules
                    </Typography>
                  </Box>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF">
                    <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                  </svg>
                </Box>
                {(nextLevel.rawChildren || []).slice(0, 4).map((m: any, idx: number) => {
                  const mPerc = calculateNodeCompletion(m, statusData);
                  return (
                    <Box key={m.identifier} sx={{
                      px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5,
                      borderBottom: idx < Math.min(3, (nextLevel.rawChildren || []).length - 1) ? '1px solid #F9FAFB' : 'none',
                    }}>
                      <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                        {mPerc >= 100 ? (
                          <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 24 }} />
                        ) : (
                          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress variant="determinate" value={100} size={24} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                            <CircularProgress variant="determinate" value={mPerc} size={24} thickness={4} sx={{ color: mPerc > 0 ? PRIMARY : 'transparent' }} />
                            <Typography sx={{ position: 'absolute', fontSize: 7, fontWeight: 700, color: mPerc > 0 ? PRIMARY : '#9CA3AF' }}>{Math.round(mPerc)}%</Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1F2937', flex: 1 }}>{m.name}</Typography>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#D1D5DB">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                      </svg>
                    </Box>
                  );
                })}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  sx={{ fontFamily: 'Inter, sans-serif',flex: 1, borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.25 }}
                  onClick={() => router.push('/profile')}
                >
                  Download Certificate
                </Button>
                <Button
                  variant="contained"
                  sx={{ fontFamily: 'Inter, sans-serif', flex: 1, bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.25, '&:hover': { bgcolor: '#D1752D' } }}
                  onClick={() => {
                    trackCourseClick(nextLevel.id);
                    const firstModule = nextLevel.rawChildren?.[0];
                    if (firstModule) {
                      router.push(`/learn/${nextLevel.id}/${firstModule.identifier}`);
                    } else {
                      router.push(`/learn/${nextLevel.id}`);
                    }
                  }}
                >
                  Start Next Level
                </Button>
              </Box>
            </Box>
          );
        })()}

        {activeLevel && (
           <SwadhaarLevelAccordion
              levelId={activeLevel.id}
              levelName={activeLevel.name}
              completedModules={activeLevel.completedModules}
              totalModules={activeLevel.totalModules}
              completionPercentage={activeLevel.completionPercentage}
              isUnlocked={activeLevel.isUnlocked}
              isExpanded={expandedActive}
              onToggle={() => setExpandedActive(!expandedActive)}
              statusData={statusData}
              onModuleClick={(mid) => {
                  trackCourseClick(mid);
                  // Always go to the module details page so the subtopic accordion is shown
                    router.push(`/learn/${activeLevel.id}/${mid}`);
               }}
              modules={activeLevel.rawChildren}
           />
        )}
      </Box>

      <SwadhaarBottomNav />
    </Box>
  );
}
