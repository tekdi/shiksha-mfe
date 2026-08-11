'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared-lib';
import { trackCourseClick } from '@learner/utils/API/SwadhaarService';
import { AlertCard } from '@learner/utils/alertsStore';
import ConfirmationModal from '@learner/components/ConfirmationModal/ConfirmationModal';

import SwadhaarDesktopHeader from './SwadhaarDesktopHeader';
import SwadhaarDesktopProfileBanner from './SwadhaarDesktopProfileBanner';
import SwadhaarDesktopCurrentLesson from './SwadhaarDesktopCurrentLesson';
import SwadhaarDesktopLevelAccordion from './SwadhaarDesktopLevelAccordion';
import SwadhaarDesktopAlertsPanel from './SwadhaarDesktopAlertsPanel';
import SwadhaarDesktopEditProfileModal from './SwadhaarDesktopEditProfileModal';
import AlertsCarousel from '@learner/components/AlertsCarousel/AlertsCarousel';

const PRIMARY = '#E6873C';

/* ─── Types ─────────────────────────────────────────────── */
interface LevelData {
  id: string;
  name: string;
  description?: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  isUnlocked: boolean;
  rawChildren: any[];
}

interface SwadhaarDesktopHomeProps {
  levels: LevelData[];
  activeLevel: LevelData | null;
  statusData: any[];
  alerts: AlertCard[];
  unreadCount: number;
  userName: string;
  designation: string;
  profileImageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onAlertClick: (alert: AlertCard) => void;
  onReload: (silent?: boolean) => void;
  externalEditProfileOpen?: boolean;
  onExternalEditProfileClose?: () => void;
  /** Optional intercept: parent wraps navigation (e.g. language modal) */
  onBeforeNavigate?: (navigate: () => void) => void;
  selectedLanguage?: string;
  onLanguageClick?: () => void;
}

/* ─── Helper: find current lesson ──────────────────────── */
function findCurrentLesson(level: LevelData | null, statusData: any[]) {
  if (!level) return null;
  const statusMap = new Map<string, any>();
  for (const s of statusData) if (s.contentId) statusMap.set(s.contentId, s);

  for (const mod of level.rawChildren || []) {
    for (const sub of mod.children || []) {
      const lessons = sub.children || [];
      for (let li = 0; li < lessons.length; li++) {
        const lesson = lessons[li];
        const s = statusMap.get(lesson.identifier);
        const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
        if (perc < 70) { // lesson counts as done at 70%
          return {
            subtopicName: sub.name,
            lessonName: lesson.name,
            lessonNumber: li + 1,
            hasProgress: perc > 0,
            moduleId: mod.identifier,
            subtopicId: sub.identifier,
            lessonId: lesson.identifier,
          };
        }
      }
    }
  }
  return null;
}

/* ─── Component ─────────────────────────────────────────── */
const SwadhaarDesktopHome: React.FC<SwadhaarDesktopHomeProps> = ({
  levels, activeLevel, statusData, alerts, unreadCount,
  userName, designation, profileImageUrl,
  isLoading, error, onAlertClick, onReload,
  externalEditProfileOpen = false, onExternalEditProfileClose,
  onBeforeNavigate, selectedLanguage, onLanguageClick,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Accordion expand state
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    levels.forEach((l) => { init[l.id] = l.isUnlocked && l.completionPercentage < 70; });
    return init;
  });

  // Inline alerts sidebar (pushes content)
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  // Local unread count: starts from prop but can be updated by the alerts panel
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);

  // Keep in sync when the parent re-fetches (e.g. on page reload)
  useEffect(() => { setLocalUnreadCount(unreadCount); }, [unreadCount]);

  // Profile modal & logout confirmation
  const [internalEditProfileOpen, setInternalEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const editProfileOpen = internalEditProfileOpen || externalEditProfileOpen;
  const handleEditProfileClose = () => {
    setInternalEditProfileOpen(false);
    onExternalEditProfileClose?.();
  };

  const toggleLevel = useCallback((id: string) => {
    setExpandedLevels((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const currentLesson = findCurrentLesson(activeLevel, statusData);

  const handleStartContinue = () => {
    if (!activeLevel) return;
    if (currentLesson) {
      trackCourseClick(activeLevel.id, currentLesson.moduleId).catch(() => {});
      router.push(
        `/learn/${activeLevel.id}/${currentLesson.moduleId}/${currentLesson.subtopicId}/${currentLesson.lessonId}`
      );
    } else {
      router.push(`/learn/${activeLevel.id}`);
    }
  };

  const handleModuleClick = (levelId: string, moduleId: string) => {
    trackCourseClick(moduleId).catch(() => {});
    
    // Find the level first
    const targetLevel = levels.find((l) => l.id === levelId);
    // Find the module within that level
    const module = targetLevel?.rawChildren?.find((m: any) => m.identifier === moduleId);

    if (module) {
      const statusMap = new Map<string, any>();
      for (const s of statusData) if (s.contentId) statusMap.set(s.contentId, s);

      let firstLesson = null;
      // Search for first uncompleted lesson
      for (const child of module.children || []) {
        if (!child.children || child.children.length === 0) {
          // Direct lesson child: subtopicId = moduleId
          const s = statusMap.get(child.identifier);
          const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
          if (perc < 70) { // 70% threshold = done
            firstLesson = { subId: moduleId, lessonId: child.identifier };
            break;
          }
        } else {
          // Subtopic container: traverse lessons
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

      // If all completed, find the very first lesson using the same hierarchy logic
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

      const doNavigate = () => {
        if (firstLesson) {
          router.push(`/learn/${levelId}/${moduleId}/${firstLesson.subId}/${firstLesson.lessonId}`);
        } else {
          // Fallback to module page if no lessons found
          router.push(`/learn/${levelId}/${moduleId}`);
        }
      };

      if (onBeforeNavigate) {
        onBeforeNavigate(doNavigate);
      } else {
        doNavigate();
      }
    } else {
      const doNavigate = () => router.push(`/learn/${levelId}/${moduleId}`);
      if (onBeforeNavigate) {
        onBeforeNavigate(doNavigate);
      } else {
        doNavigate();
      }
    }
  };
  const handleLogoutConfirm = () => {
    localStorage.clear();
    router.push('/swadhaar-login');
  };

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', bgcolor: '#F4F6FA' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Box
      id="swadhaar-desktop-home"
      sx={{ minHeight: '100dvh', bgcolor: '#F4F6FA', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Header ── */}
      <SwadhaarDesktopHeader
        unreadCount={localUnreadCount}
        alertsPanelOpen={alertsPanelOpen}
        onAlertsClick={() => setAlertsPanelOpen((prev) => !prev)}
        onEditProfile={() => setInternalEditProfileOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)}
        profileImageUrl={profileImageUrl}
        userName={userName}
      />

      {/* ── Body: flex row — main content + optional alerts sidebar ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* ── Main content column ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 4,
            pt: 3,
            pb: 4,
            transition: 'all 0.3s ease',
          }}
        >
          <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
            {/* Profile banner */}
            <SwadhaarDesktopProfileBanner
              userName={userName}
              designation={designation}
              profileImageUrl={profileImageUrl}
              levels={levels.map((l) => ({
                id: l.id,
                name: l.name,
                completionPercentage: l.completionPercentage,
                isUnlocked: l.isUnlocked,
              }))}
              onProfileClick={() => setEditProfileOpen(true)}
            />

            {/* Current Lesson card */}
            {/* {currentLesson && (
              <SwadhaarDesktopCurrentLesson
                currentLesson={currentLesson}
                onStartContinue={handleStartContinue}
              />
            )} */}

            {/* Error state */}
            {error && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: '#EF4444', fontFamily: 'Inter, sans-serif', mb: 1 }}>{error}</Typography>
                <Typography
                  onClick={onReload}
                  sx={{ color: PRIMARY, fontFamily: 'Inter, sans-serif', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  Retry
                </Typography>
              </Box>
            )}

            {/* Alerts Carousel */}
            {unreadCount > 0 && !error && !alertsPanelOpen && (
              <>
                <Typography sx={{ fontWeight: 800, fontFamily: 'Inter, sans-serif', fontSize: '18px', mb: 2, color: 'text.primary', mt: 3 }}>
                  {t('LEARNER_APP.HOME.ALERTS_TITLE')}
                </Typography>
                <Box sx={{ mb: 4 }}>
                  <AlertsCarousel alerts={alerts} onAlertClick={() => setAlertsPanelOpen(true)} />
                </Box>
              </>
            )}

            {/* Learning Progress */}
            {!error && (
              <>
                <Typography
                  sx={{
                    fontFamily: 'Open sans',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#1A1A1A',
                    mb: 2,
                  }}
                >
                  {t('LEARNER_APP.HOME.LEARNING_PROGRESS')}
                </Typography>

                {/* ── Congratulations banners for completed courses (>= 70%) ── */}
                {levels.filter(l => l.completionPercentage >= 70).map(level => (
                  <Box key={`congrats-${level.id}`} sx={{
                    mb: 2.5, borderRadius: '16px', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1C2B4A 0%, #2D4270 60%, #1C2B4A 100%)',
                    boxShadow: '0 6px 24px rgba(28,43,74,0.35)',
                    position: 'relative',
                  }}>
                    <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(230,135,60,0.12)', filter: 'blur(30px)' }} />
                    <Box sx={{ position: 'absolute', bottom: -15, left: 80, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(76,175,80,0.18)', filter: 'blur(20px)' }} />

                    {/* <Box sx={{ p: 3, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2.5 }}> */}
                      {/* Trophy */}
                      {/* <Box sx={{
                        width: 72, height: 72, borderRadius: '18px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #F2BC33, #E6873C)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(242,188,51,0.45)', fontSize: 36,
                      }}>🏆</Box> */}

                      {/* <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 12, color: '#F2BC33', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.5 }}>
                          Congratulations!
                        </Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#fff', mb: 0.5 }}>
                          {level.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                          <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${level.completionPercentage}%`, bgcolor: '#4CAF50', borderRadius: 3, transition: 'width 1.2s ease' }} />
                          </Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#4CAF50', minWidth: 40 }}>{level.completionPercentage}%</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                          You've successfully completed this course! 🎉
                        </Typography>
                      </Box> */}

                      {/* PASSED pill */}
                      {/* <Box sx={{
                        bgcolor: 'rgba(76,175,80,0.2)', border: '1.5px solid rgba(76,175,80,0.5)',
                        borderRadius: '14px', px: 2, py: 1, textAlign: 'center', flexShrink: 0,
                      }}>
                        <Typography sx={{ fontSize: 28 }}>✅</Typography>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#4CAF50', mt: 0.5 }}>PASSED</Typography>
                      </Box> */}
                    {/* </Box> */}
                  </Box>
                ))}

                {levels.map((level) => (
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
                    selectedLanguage={selectedLanguage}
                    onChangeLanguage={onLanguageClick}
                    onToggle={() => toggleLevel(level.id)}
                    statusData={statusData}
                    modules={level.rawChildren}
                    onModuleClick={(mid) => handleModuleClick(level.id, mid)}
                    showDescriptions={true}
                  />
                ))}
              </>
            )}
          </Box>
        </Box>

        {/* ── Inline Alerts Sidebar (pushes content) ── */}
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
              onClose={() => setAlertsPanelOpen(false)}
              onUnreadCountChange={(count) => setLocalUnreadCount(count)}
            />
          </Box>
        )}
      </Box>

      {/* ── Edit Profile Modal ── */}
      <SwadhaarDesktopEditProfileModal
        open={editProfileOpen}
        onClose={handleEditProfileClose}
        onProfileUpdated={() => onReload(true)}
      />

      {/* ── Logout Confirmation ── */}
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

export default SwadhaarDesktopHome;
