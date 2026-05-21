'use client';

import React, { useState, useCallback } from 'react';
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

const PRIMARY = '#E6873C';

/* ─── Types ─────────────────────────────────────────────── */
interface LevelData {
  id: string;
  name: string;
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
  onReload: () => void;
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
        if (perc < 100) {
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
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Accordion expand state
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    levels.forEach((l) => { init[l.id] = l.isUnlocked && l.completionPercentage < 100; });
    return init;
  });

  // Inline alerts sidebar (pushes content)
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);

  // Profile modal & logout confirmation
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
          if (perc < 100) {
            firstLesson = { subId: moduleId, lessonId: child.identifier };
            break;
          }
        } else {
          // Subtopic container: traverse lessons
          for (const lesson of child.children || []) {
            const s = statusMap.get(lesson.identifier);
            const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
            if (perc < 100) {
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

      if (firstLesson) {
        router.push(`/learn/${levelId}/${moduleId}/${firstLesson.subId}/${firstLesson.lessonId}`);
      } else {
        // Fallback to module page if no lessons found
        router.push(`/learn/${levelId}/${moduleId}`);
      }
    } else {
      router.push(`/learn/${levelId}/${moduleId}`);
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
        unreadCount={unreadCount}
        alertsPanelOpen={alertsPanelOpen}
        onAlertsClick={() => setAlertsPanelOpen((prev) => !prev)}
        onEditProfile={() => setEditProfileOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)}
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
            {currentLesson && (
              <SwadhaarDesktopCurrentLesson
                currentLesson={currentLesson}
                onStartContinue={handleStartContinue}
              />
            )}

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

            {/* Learning Progress */}
            {!error && (
              <>
                <Typography
                  sx={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: 18,
                    color: '#1F2937',
                    mb: 2,
                  }}
                >
                  {t('LEARNER_APP.HOME.LEARNING_PROGRESS')}
                </Typography>

                {levels.map((level) => (
                  <SwadhaarDesktopLevelAccordion
                    key={level.id}
                    levelId={level.id}
                    levelName={level.name}
                    completedModules={level.completedModules}
                    totalModules={level.totalModules}
                    completionPercentage={level.completionPercentage}
                    isUnlocked={level.isUnlocked}
                    isExpanded={!!expandedLevels[level.id]}
                    onToggle={() => toggleLevel(level.id)}
                    statusData={statusData}
                    modules={level.rawChildren}
                    onModuleClick={(mid) => handleModuleClick(level.id, mid)}
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
            />
          </Box>
        )}
      </Box>

      {/* ── Edit Profile Modal ── */}
      <SwadhaarDesktopEditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onProfileUpdated={onReload}
      />

      {/* ── Logout Confirmation ── */}
      <ConfirmationModal
        modalOpen={logoutConfirmOpen}
        message="Are you sure you want to log out?"
        handleAction={handleLogoutConfirm}
        handleCloseModal={() => setLogoutConfirmOpen(false)}
        buttonNames={{ primary: 'Logout', secondary: 'Cancel' }}
      />
    </Box>
  );
};

export default SwadhaarDesktopHome;
