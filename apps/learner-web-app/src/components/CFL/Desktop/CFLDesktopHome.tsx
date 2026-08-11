'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Divider } from '@mui/material';
import CFLDesktopHeader from './CFLDesktopHeader';
import CFLDesktopProfileBanner from './CFLDesktopProfileBanner';
import CFLDesktopTrainerTable from './CFLDesktopTrainerTable';
import { useRouter } from 'next/navigation';
import SwadhaarDesktopAlertsPanel from '../../Swadhaar/Desktop/SwadhaarDesktopAlertsPanel';
import SwadhaarDesktopEditProfileModal from '../../Swadhaar/Desktop/SwadhaarDesktopEditProfileModal';
import SwadhaarDesktopLevelAccordion from '../../Swadhaar/Desktop/SwadhaarDesktopLevelAccordion';
import ConfirmationModal from '../../../components/ConfirmationModal/ConfirmationModal';
import { getAlerts, getUnreadCount, fetchAndSyncAlerts } from '@learner/utils/alertsStore';
import { getUserDetails } from '@learner/utils/API/services/ProfileService';
import { useTranslation } from '@shared-lib';
import {
  fetchSwadhaarLevelCourses,
  getContentCourseStatus,
  trackCourseClick,
} from '@learner/utils/API/SwadhaarService';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

// ── Helper: recursively build completion cache (same as SwadhaarDesktopLevelAccordion) ──
const buildStatusMap = (statusList: any[]): Map<string, any> => {
  const map = new Map<string, any>();
  for (const item of statusList) if (item.contentId) map.set(item.contentId, item);
  return map;
};

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

const calculateNodeCompletion = (node: any, statusList: any[]): number => {
  const { total, completed } = calculateNodeLessons(node, statusList);
  return total > 0 ? (completed / total) * 100 : 0;
};

interface Trainer {
  id: string;
  name: string;
  progress: number;
  currentLevel?: string;
  beginnerProgress?: number;
  intermediateProgress?: number;
  advanceProgress?: number;
  newContentProgress?: number;
  courses?: any[];
  designation?: string;
}

interface CFLDesktopHomeProps {
  trainers: Trainer[];
  loading: boolean;
  error: string | null;
  username: string;
  location: string;
  userRole?: string;
  onReload?: () => void;
  externalEditProfileOpen?: boolean;
  onExternalEditProfileClose?: () => void;
}

const CFLDesktopHome: React.FC<CFLDesktopHomeProps> = ({ trainers, loading, error, username, location, userRole, onReload, externalEditProfileOpen = false, onExternalEditProfileClose }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [internalEditProfileOpen, setInternalEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const editProfileOpen = internalEditProfileOpen || externalEditProfileOpen;
  const handleEditProfileClose = () => {
    setInternalEditProfileOpen(false);
    onExternalEditProfileClose?.();
  };

  // ── CFL own learning progress state (mirrors swadhaar-home loadData) ──
  const [cflLevels, setCflLevels] = useState<any[]>([]);
  const [cflStatusData, setCflStatusData] = useState<any[]>([]);
  const [cflLevelsLoading, setCflLevelsLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  const handleLogoutConfirm = () => {
    localStorage.clear();
    router.push('/swadhaar-login');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unreadAlerts = getAlerts().filter(a => !a.isRead);
      setUnreadCount(unreadAlerts.length);

      const uid = localStorage.getItem('userId');
      if (uid) {
        fetchAndSyncAlerts(uid).then(() => {
          setUnreadCount(getUnreadCount());
        }).catch(() => {});

        getUserDetails(uid, true).then(profileResponse => {
          const profileData = profileResponse?.result?.userData;
          if (profileData?.name) {
            setProfileImageUrl(profileData.name);
          }
        }).catch(err => console.error('Error fetching profile image:', err));
      }
    }
  }, []);

  // ── Load CFL own learning progress (same logic as swadhaar-home/page.tsx) ──
  const loadCFLLearningProgress = useCallback(async () => {
    try {
      setCflLevelsLoading(true);
      const uid = localStorage.getItem('userId') || '';
      const tenantId = localStorage.getItem('tenantId') || '';

      const levelCourses = await fetchSwadhaarLevelCourses();
      if (!levelCourses || levelCourses.length === 0) {
        setCflLevelsLoading(false);
        return;
      }

      // Collect all hierarchy IDs for status fetch
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
      if (uid && allHierarchyIds.length && tenantId) {
        const batchSize = 100;
        for (let i = 0; i < allHierarchyIds.length; i += batchSize) {
          const batch = allHierarchyIds.slice(i, i + batchSize);
          const batchStatus = await getContentCourseStatus([uid], batch, tenantId).catch(() => []);
          status = [...status, ...batchStatus];
        }
      }

      // Apply sessionStorage progress guard (same guard as learner home)
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
      } catch { /* sessionStorage unavailable */ }

      setCflStatusData(status);

      // Filter empty nodes
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
            const isContainer =
              item.mimeType === 'application/vnd.ekstep.content-collection' ||
              item.contentType === 'CourseUnit' ||
              item.contentType === 'TextBookUnit';
            if (item.children) return item.children.length > 0;
            return !isContainer;
          });
      };

      const filteredLevelCourses = filterHierarchy(levelCourses);

      const levelDataList = filteredLevelCourses.map((course: any, idx: number, filteredLevels: any[]) => {
        const children = course?.children || [];
        const moduleDetails = children.map((m: any) => {
          const modulePerc = calculateNodeCompletion(m, status);
          return { isModuleComplete: Math.round(modulePerc) >= 70, modulePerc };
        });

        const levelStats = calculateNodeLessons(course, status);
        const levelPerc = levelStats.total > 0 ? (levelStats.completed / levelStats.total) * 100 : 0;
        (course as any).calculatedCompletion = levelPerc;

        const previousCompleted = idx === 0 || Math.round((filteredLevels[idx - 1] as any)?.calculatedCompletion || 0) >= 70;
        const isUnlocked = previousCompleted;
        const completedModulesCount = isUnlocked ? moduleDetails.filter((md: any) => md.isModuleComplete).length : 0;
        const displayPerc = isUnlocked ? Math.round(levelPerc) : 0;

        return {
          id: course.identifier,
          name: course.name,
          description: course.description,
          completedModules: completedModulesCount,
          totalModules: children.length,
          completionPercentage: displayPerc,
          isUnlocked,
          rawChildren: children,
        };
      });

      setCflLevels(levelDataList);

      // Initialize expanded state — expand the active (in-progress) level
      const initExpanded: Record<string, boolean> = {};
      levelDataList.forEach((l) => {
        initExpanded[l.id] = l.isUnlocked && l.completionPercentage < 70;
      });
      setExpandedLevels(initExpanded);
    } catch (err) {
      console.error('[CFL] Error loading own learning progress:', err);
    } finally {
      setCflLevelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCFLLearningProgress();
  }, [loadCFLLearningProgress]);

  const handleCloseAlertsPanel = () => {
    setAlertsPanelOpen(false);
    setUnreadCount(getUnreadCount());
  };

  // Fix 1: count trainers who completed ALL courses at >= 70% threshold
  // (mirrors the learner view's 70% "done" threshold)
  const completedCount = trainers.filter(t => {
    if (!t.courses || t.courses.length === 0) return false;
    return t.courses.every((c: any) => (c.completionPercentage ?? 0) >= 70);
  }).length;

  const detailedTrainers = trainers.map(t => {
    const inProgressCourse = t.courses?.find((c: any) => c.status === 'in-progress');
    const lockedCourse = t.courses?.find((c: any) => c.status === 'locked');
    let dynamicCurrentLevel = 'Completed All';
    if (inProgressCourse) {
      dynamicCurrentLevel = inProgressCourse.name;
    } else if (lockedCourse) {
      dynamicCurrentLevel = lockedCourse.name;
    }
    return { ...t, currentLevel: dynamicCurrentLevel };
  });

  // Derive dynamic courses from trainer data (for Trainer Progress table)
  const dynamicCourses: any[] = trainers.length > 0 ? trainers[0].courses!.map((course: any) => {
    const completedTrainers = trainers.filter(t =>
      (t as any).courses?.find((c: any) => c.id === course.id)?.status === 'completed'
    ).length;

    const inProgressTrainers = trainers.filter(t =>
      (t as any).courses?.find((c: any) => c.id === course.id)?.status === 'in-progress'
    ).length;

    let overallStatus = 'locked';
    if (completedTrainers === trainers.length && trainers.length > 0) overallStatus = 'completed';
    else if (completedTrainers > 0 || inProgressTrainers > 0) overallStatus = 'in-progress';

    return {
      id: course.id,
      name: course.name,
      completedCount: completedTrainers,
      totalCount: trainers.length,
      status: overallStatus,
    };
  }) : [];

  // ── Module click handler (same logic as SwadhaarDesktopHome.handleModuleClick) ──
  const handleModuleClick = useCallback((levelId: string, moduleId: string) => {
    trackCourseClick(moduleId).catch(() => {});

    const targetLevel = cflLevels.find((l) => l.id === levelId);
    const module = targetLevel?.rawChildren?.find((m: any) => m.identifier === moduleId);

    if (module) {
      const statusMap = new Map<string, any>();
      for (const s of cflStatusData) if (s.contentId) statusMap.set(s.contentId, s);

      let firstLesson: { subId: string; lessonId: string } | null = null;

      for (const child of module.children || []) {
        if (!child.children || child.children.length === 0) {
          const s = statusMap.get(child.identifier);
          const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
          if (perc < 70) {
            firstLesson = { subId: moduleId, lessonId: child.identifier };
            break;
          }
        } else {
          for (const lesson of child.children || []) {
            const s = statusMap.get(lesson.identifier);
            const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
            if (perc < 70) {
              firstLesson = { subId: child.identifier, lessonId: lesson.identifier };
              break;
            }
          }
        }
        if (firstLesson) break;
      }

      // If all completed, navigate to first lesson anyway
      if (!firstLesson) {
        const firstChild = module.children?.[0];
        if (firstChild) {
          if (!firstChild.children || firstChild.children.length === 0) {
            firstLesson = { subId: moduleId, lessonId: firstChild.identifier };
          } else if (firstChild.children[0]) {
            firstLesson = { subId: firstChild.identifier, lessonId: firstChild.children[0].identifier };
          }
        }
      }

      if (firstLesson) {
        router.push(`/learn/${levelId}/${moduleId}/${firstLesson.subId}/${firstLesson.lessonId}`);
      } else {
        router.push(`/learn/${levelId}/${moduleId}`);
      }
    } else {
      router.push(`/learn/${levelId}/${moduleId}`);
    }
  }, [cflLevels, cflStatusData, router]);

  const toggleLevel = useCallback((id: string) => {
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
      <CFLDesktopHeader
        unreadCount={unreadCount}
        alertsPanelOpen={alertsPanelOpen}
        onAlertsClick={() => {
          if (alertsPanelOpen) {
            handleCloseAlertsPanel();
          } else {
            setAlertsPanelOpen(true);
          }
        }}
        onEditProfile={() => setInternalEditProfileOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', transition: 'all 0.3s ease' }}>
        {/* Main Content Column */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pt: 3, pb: 4, transition: 'all 0.3s ease' }}>
          <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
            <CFLDesktopProfileBanner
              userName={username.replace('!', '')}
              location={location}
              totalTrainers={trainers.length}
              completedTrainers={completedCount}
              userRole={userRole}
              trainers={trainers}
              profileImageUrl={profileImageUrl}
            />

            {/* Section 1: Trainer Progress Table */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#1A1A1A' }}>
                {(userRole === 'DI' || userRole === 'DISTRICT INCHARGE' || userRole === 'ARM') ? t("CFL_DASHBOARD.CFL_INCHARGE_PROGRESS") : t("CFL_DASHBOARD.TRAINER_PROGRESS")}
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: PRIMARY }} />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <CFLDesktopTrainerTable trainers={detailedTrainers} dynamicCourses={dynamicCourses} userRole={userRole} />
              )}
            </Box>

            <Divider sx={{ mb: 1, borderColor: '#E5E7EB' }} />

            {/* Section 2: Learning Progress — CFL's own learning (same as learner desktop) */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontWeight: 700, color: '#1A1A1A', mb: 3, fontSize: 20, fontFamily: 'Open Sans' }}>
                {t('LEARNER_APP.HOME.LEARNING_PROGRESS')}
              </Typography>

              {cflLevelsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress sx={{ color: PRIMARY }} />
                </Box>
              ) : cflLevels.length === 0 ? (
                <Typography sx={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', py: 4 }}>
                  No courses available.
                </Typography>
              ) : (
                <Box>
                  {cflLevels.map((level) => (
                    <SwadhaarDesktopLevelAccordion
                      key={level.id}
                      levelId={level.id}
                      levelName={level.name}
                      levelDescription={level.description}
                      completedModules={level.completedModules}
                      totalModules={level.totalModules}
                      completionPercentage={level.completionPercentage}
                      isUnlocked={level.isUnlocked}
                      isExpanded={!!expandedLevels[level.id]}
                      onToggle={() => toggleLevel(level.id)}
                      statusData={cflStatusData}
                      modules={level.rawChildren}
                      onModuleClick={(mid) => handleModuleClick(level.id, mid)}
                      showDescriptions={true}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Alerts Sidebar */}
        {alertsPanelOpen && (
          <Box
            sx={{
              width: 380,
              flexShrink: 0,
              borderLeft: '1.5px solid #E5E7EB',
              bgcolor: '#F4F6FA',
              overflowY: 'auto',
              transition: 'width 0.3s ease',
            }}
          >
            <SwadhaarDesktopAlertsPanel
              userId={userId}
              onClose={handleCloseAlertsPanel}
              onUnreadCountChange={(count) => setUnreadCount(count)}
            />
          </Box>
        )}
      </Box>

      {/* Edit Profile Modal */}
      <SwadhaarDesktopEditProfileModal
        open={editProfileOpen}
        onClose={handleEditProfileClose}
        onProfileUpdated={onReload}
      />

      {/* Logout Confirmation */}
      <ConfirmationModal
        modalOpen={logoutConfirmOpen}
        message={t('COMMON.SURE_LOGOUT')}
        handleAction={handleLogoutConfirm}
        handleCloseModal={() => setLogoutConfirmOpen(false)}
        buttonNames={{ primary: t('COMMON.LOGOUT'), secondary: t('COMMON.CANCEL') }}
      />
    </Box>
  );
};

export default CFLDesktopHome;
