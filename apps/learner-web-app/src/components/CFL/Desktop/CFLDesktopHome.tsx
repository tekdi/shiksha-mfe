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
import LanguagePreferenceModal from '../../LanguagePreferenceModal/LanguagePreferenceModal';
import ConfirmationModal from '../../../components/ConfirmationModal/ConfirmationModal';
import { getAlerts, getUnreadCount, fetchAndSyncAlerts } from '@learner/utils/alertsStore';
import { getUserDetails } from '@learner/utils/API/services/ProfileService';
import { useTranslation } from '@shared-lib';
import {
  buildSwadhaarLevels,
  fetchSwadhaarLevelCourses,
  getSavedCourseLanguage,
  fetchSwadhaarModuleLessons,
  SWADHAAR_DONE_PERCENT,
  trackCourseClick,
} from '@learner/utils/API/SwadhaarService';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

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
  // The language the CFL's own courses are shown in (same preference as the learner home)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
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

      // The District Incharge's own enrolled courses, with module progress, from the Swadhaar LMS
      const levelCourses = await fetchSwadhaarLevelCourses(getSavedCourseLanguage());
      if (!levelCourses || levelCourses.length === 0) {
        setCflLevelsLoading(false);
        return;
      }

      let status: any[] = levelCourses.flatMap((level: any) => level.trackingStatus || []);

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

      const levelDataList = buildSwadhaarLevels(levelCourses, status);

      setCflLevels(levelDataList);

      // Initialize expanded state — expand the active (in-progress) level
      const initExpanded: Record<string, boolean> = {};
      levelDataList.forEach((l) => {
        initExpanded[l.id] = l.isUnlocked && l.completionPercentage < SWADHAAR_DONE_PERCENT;
      });
      setExpandedLevels(initExpanded);
    } catch (err) {
      console.error('[CFL] Error loading own learning progress:', err);
    } finally {
      setCflLevelsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedLanguage(getSavedCourseLanguage());
    loadCFLLearningProgress();
  }, [loadCFLLearningProgress]);

  const handleLanguageSelect = async (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('swadhaarLanguage', lang);
    localStorage.setItem('contentLanguage', lang);
    setLanguageModalOpen(false);
    try {
      const { updateContentLanguageInProfile } = await import('@learner/utils/API/userService');
      await updateContentLanguageInProfile(lang);
    } catch (error) {
      console.error('Failed to update content language in profile', error);
    }
    // The own courses and the trainer progress list follow the new language
    await loadCFLLearningProgress();
    onReload?.();
  };

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
    let dynamicCurrentLevel = t.courses && t.courses.length > 0 ? 'Completed All' : '-';
    if (inProgressCourse) {
      dynamicCurrentLevel = inProgressCourse.name;
    } else if (lockedCourse) {
      dynamicCurrentLevel = lockedCourse.name;
    }
    return { ...t, currentLevel: dynamicCurrentLevel };
  });

  // Table columns: every course any trainer is enrolled in (Swadhaar LMS), in course order.
  // Trainers can be in different learning paths, so the first trainer's courses are not enough.
  const courseColumns: any[] = [];
  const seenCourseIds = new Set<string>();
  trainers.forEach((tr) =>
    (tr.courses || []).forEach((course: any) => {
      if (!seenCourseIds.has(course.id)) {
        seenCourseIds.add(course.id);
        courseColumns.push(course);
      }
    })
  );
  courseColumns.sort((a, b) => (a.ordering ?? Number.MAX_SAFE_INTEGER) - (b.ordering ?? Number.MAX_SAFE_INTEGER));

  const dynamicCourses: any[] = courseColumns.map((course: any) => {
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
  });

  // ── Module click handler (same logic as SwadhaarDesktopHome.handleModuleClick) ──
  const handleModuleClick = useCallback((levelId: string, moduleId: string) => {
    trackCourseClick(moduleId).catch(() => {});

    const targetLevel = cflLevels.find((l) => l.id === levelId);
    const module = targetLevel?.rawChildren?.find((m: any) => m.identifier === moduleId);

    // Swadhaar modules are listed without lessons: load them and open the first one still to do in the player
    if (module && !(module.children || []).length) {
      (async () => {
        try {
          const detail = await fetchSwadhaarModuleLessons(levelId, moduleId);
          const lessons = detail.children || [];
          const done = new Set(
            (detail.trackingStatus || []).filter((s: any) => s.status === 2).map((s: any) => s.contentId)
          );
          const next = lessons.find((l: any) => !done.has(l.identifier)) || lessons[0];
          router.push(
            next
              ? `/learn/${levelId}/${moduleId}/${moduleId}/${next.identifier}`
              : `/learn/${levelId}/${moduleId}`
          );
        } catch {
          router.push(`/learn/${levelId}/${moduleId}`);
        }
      })();
      return;
    }

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
                      selectedLanguage={selectedLanguage}
                      onChangeLanguage={() => setLanguageModalOpen(true)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <LanguagePreferenceModal
          open={languageModalOpen}
          onClose={() => setLanguageModalOpen(false)}
          onSelect={handleLanguageSelect}
          selectedLanguage={selectedLanguage}
        />

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
