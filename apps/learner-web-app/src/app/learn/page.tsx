'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Badge, Chip } from '@mui/material';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import SwadhaarLevelAccordion from '@learner/components/Swadhaar/SwadhaarLevelAccordion';
import {
  fetchSwadhaarLevelCourses,
  getContentCourseStatus,
  trackCourseClick,
} from '@learner/utils/API/SwadhaarService';
import { useTenant } from '@learner/context/TenantContext';
import { useTranslation } from '@shared-lib';
import { telemetryFactory } from '@learner/utils/telemtery';
import {
  WatchLater as WatchLaterIcon,
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
  Person as PersonIcon,
  EmojiEvents as EmojiEventsIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  BookmarkRounded as BookmarkRoundedIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';

import { getAlerts, getUnreadCount } from '@learner/utils/alertsStore';
import LanguagePreferenceModal, { SupportedLanguage } from '@learner/components/LanguagePreferenceModal/LanguagePreferenceModal';
const PRIMARY = '#E6873C';

/**
 * Recursive progress calculation: aggregates completion from leaf nodes up to the current node.
 * Moved to module scope for consistency and safety.
 */
const calculateNodeCompletion = (node: any, statusList: any[]): number => {
  const id = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusList.find((d: any) => d.contentId === id);
    return s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
  }
  const childPercs = node.children.map((child: any) => calculateNodeCompletion(child, statusList));
  return childPercs.length > 0 ? childPercs.reduce((a: number, b: number) => a + b, 0) / childPercs.length : 0;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  quiz: <WatchLaterIcon fontSize="large" sx={{ color: '#F8AC4F' }} />,
  content: <DescriptionIcon fontSize="small" />,
  lesson: <MenuBookIcon fontSize="small" />,
  feedback: <PersonIcon fontSize="small" />,
  badge: <EmojiEventsIcon fontSize="small" />,
  system: <InfoIcon fontSize="small" />,
};

export default function LearnPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [levels, setLevels] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnreadAlert, setLatestUnreadAlert] = useState<any>(null);

  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const pendingNavigationRef = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawSavedLang = localStorage.getItem('swadhaarLanguage') || localStorage.getItem('contentLanguage');
      if (rawSavedLang) {
        let normLang: SupportedLanguage = 'English';
        const norm = rawSavedLang.toLowerCase();
        if (['marathi', 'mr'].includes(norm)) normLang = 'Marathi';
        else if (['hindi', 'hi'].includes(norm)) normLang = 'Hindi';
        else if (['english', 'en'].includes(norm)) normLang = 'English';
        setSelectedLanguage(normLang);
      }
    }
  }, []);

  const handleCourseCardClick = useCallback((navigate: () => void) => {
    const rawSavedLang = typeof window !== 'undefined'
      ? (localStorage.getItem('swadhaarLanguage') || localStorage.getItem('contentLanguage'))
      : null;
    if (!selectedLanguage && !rawSavedLang) {
      pendingNavigationRef.current = navigate;
      setLanguageModalOpen(true);
    } else {
      navigate();
    }
  }, [selectedLanguage]);

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/swadhaar-login');
    }
  }, []);

  const loadLevels = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId') || '';
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';

      if (userId) {
        try {
          const { getUserDetails } = await import('@learner/utils/API/services/ProfileService');
          const { setLocalStorageFromCustomFields } = await import('@learner/utils/API/userService');
          const userRes = await getUserDetails(userId, true);
          const fields = userRes?.result?.userData?.customFields;
          if (fields) {
            setLocalStorageFromCustomFields(fields);
          }
        } catch (e) {
          console.warn('Could not sync user custom fields on learn page', e);
        }
      }

      const savedLang = typeof window !== 'undefined'
        ? (localStorage.getItem('swadhaarLanguage') || localStorage.getItem('contentLanguage') || undefined)
        : undefined;
      const levelCourses = await fetchSwadhaarLevelCourses(savedLang);

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
        status = await getContentCourseStatus([userId], allHierarchyIds, tenantId).catch(() => []);
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

      const filterHierarchy = (items: any[], isTopLevel = true): any[] => {
        return items
          .map((item) => {
            if (item.children && item.children.length > 0) {
              const filteredChildren = filterHierarchy(item.children, false);
              return { ...item, children: filteredChildren };
            }
            return item;
          })
          .filter((item) => {
            const isContainer = item.mimeType === 'application/vnd.ekstep.content-collection' ||
              item.contentType === 'CourseUnit' ||
              item.contentType === 'TextBookUnit';
            if (item.children && item.children.length > 0) {
              return true;
            }
            if (isTopLevel) {
              return true;
            }
            return !isContainer;
          });
      };

      const filteredLevelCourses = filterHierarchy(levelCourses);


      const levelList = filteredLevelCourses.map((course: any) => {
        const children = course?.children || [];
        const moduleDetails = children.map((m: any) => {
          const modulePerc = calculateNodeCompletion(m, status);
          return { isModuleComplete: modulePerc >= 70, modulePerc }; // 70% threshold
        });
        const completedModulesCount = moduleDetails.filter((md: any) => md.isModuleComplete).length;
        const levelPerc = children.length > 0 ? (moduleDetails.reduce((acc: number, curr: any) => acc + curr.modulePerc, 0) / children.length) : 0;
        return {
          id: course.identifier,
          name: course.name,
          description: course.description,
          completedModules: completedModulesCount,
          totalModules: children.length,
          completionPercentage: Math.round(levelPerc),
          rawModules: children
        };
      });

      const finalLevels = levelList.map((level, idx) => {
        const previousCompleted = idx === 0 || levelList[idx - 1].completionPercentage >= 70; // Unlock next level at 70%
        const isUnlocked = previousCompleted;
        return { ...level, isUnlocked };
      });

      const sortedLevels = finalLevels;
      setLevels(sortedLevels);
      const savedCourseId = typeof window !== 'undefined' ? sessionStorage.getItem('lastViewedCourseId') : null;
      const savedLevel = savedCourseId ? sortedLevels.find((l) => l.id === savedCourseId) : null;
      const inProgressLevel = sortedLevels.find((l) => l.isUnlocked && l.completionPercentage < 70);
      const active = savedLevel || inProgressLevel || sortedLevels[0];
      if (active) setExpandedLevelId(active.id);
    } catch (err) {
      console.error('Error loading learn page:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenant]);

  const handleLanguageSelect = useCallback(async (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swadhaarLanguage', lang);
      localStorage.setItem('contentLanguage', lang);
    }
    setLanguageModalOpen(false);

    try {
      const { updateContentLanguageInProfile } = await import('@learner/utils/API/userService');
      await updateContentLanguageInProfile(lang);
    } catch (error) {
      console.error('Failed to update content language in profile', error);
    }

    loadLevels();

    if (pendingNavigationRef.current) {
      // pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, [loadLevels]);

  useEffect(() => { loadLevels(); }, [loadLevels]);

  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.eid === 'END' || data?.eid === 'SUMMARY') {
          loadLevels();
        }
      } catch (e) { }
    };
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [loadLevels]);

  useEffect(() => {
    const syncAlerts = () => {
      setUnreadCount(getUnreadCount());
      setLatestUnreadAlert(getAlerts().find((a) => !a.isRead) || null);
    };
    syncAlerts();
    window.addEventListener('focus', syncAlerts);
    window.addEventListener('storage', syncAlerts);
    return () => {
      window.removeEventListener('focus', syncAlerts);
      window.removeEventListener('storage', syncAlerts);
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden', width: '100%' }}>
      <Box sx={{ bgcolor: 'background.paper', px: 2, py: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'text.primary', fontFamily: 'Intern sans-serif' }}>{t('LEARNER_APP.LEARN.PAGE_TITLE')}</Typography>
        <Box onClick={() => router.push('/alerts')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16, backgroundColor: '#FFFFFF', color: '#E6873C', border: '1px solid #E6873C', top: 2, right: 2 } }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(230,135,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: '#E6873C' }} />
            </Box>
          </Badge>
          <Typography sx={{ fontFamily: 'Open Sans', fontSize: 10, fontWeight: 700, color: PRIMARY, mt: 0.5 }}>{t('LEARNER_APP.ALERTS.TITLE')}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2 }}>
        {/* {unreadCount > 0 && (
          <Box onClick={() => router.push('/alerts')} sx={{ bgcolor: '#1C2B4A', borderRadius: '12px', p: 1.5, mb: 1.5, cursor: 'pointer', border: '1px solid rgba(230,135,60,0.35)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily:"Intern sans-serif" }}>{t('LEARNER_APP.LEARN.NEW_CONTENT_AVAILABLE')}</Typography>
              <Box sx={{ width: 24, height: 24, borderRadius: '8px', bgcolor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookmarkRoundedIcon sx={{ fontSize: 16, color: '#1C2B4A' }} /></Box>
            </Box>
            <Box sx={{ bgcolor: '#fff', borderRadius: '10px', p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{TYPE_ICONS[latestUnreadAlert?.type || 'content']}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{fontFamily:"Intern sans-serif", fontSize: 13, fontWeight: 700, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestUnreadAlert?.title || 'New reminder'}</Typography>
                <Typography sx={{fontFamily:"Intern sans-serif", fontSize: 12, fontWeight: 500, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestUnreadAlert?.message || 'Tap to view latest content alerts'}</Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: PRIMARY, fontSize: 18, fontWeight: 800 }} />
            </Box>
          </Box>
        )} */}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: '#1A1A1A', fontFamily: "Open Sans", fontSize: 14 }}>{t('LEARNER_APP.LEARN.LEVEL_PROGRESS')}</Typography>
          {/* {selectedLanguage && (
            <Chip
              // icon={<TranslateIcon sx={{ fontSize: 14, color: `${PRIMARY} !important` }} />}
              label={selectedLanguage}
              onClick={() => setLanguageModalOpen(true)}
              size="small"
              sx={{
                bgcolor: 'rgba(230,135,60,0.1)',
                color: PRIMARY,
                fontWeight: 700,
                fontSize: 11,
                fontFamily: 'Open Sans',
                borderRadius: '12px',
                border: `1px solid ${PRIMARY}`,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(230,135,60,0.2)' }
              }}
            />
          )} */}
        </Box>

        {levels.map((level) => (
          <SwadhaarLevelAccordion
            key={level.id}
            levelId={level.id}
            levelName={level.name}
            levelDescription={level.description}
            completedModules={level.completedModules}
            totalModules={level.totalModules}
            completionPercentage={level.completionPercentage}
            isUnlocked={level.isUnlocked}
            isExpanded={expandedLevelId === level.id}
            showDescriptions={true}
            selectedLanguage={selectedLanguage || undefined}
            onChangeLanguage={() => setLanguageModalOpen(true)}
            onToggle={() => {
              telemetryFactory.interact({ eid: 'INTERACT', edata: { id: `level-accordion-${level.id}`, type: 'CLICK', pageid: 'learn', uid: localStorage.getItem('userId') || '' } });
              setExpandedLevelId((prev) => {
                const next = prev === level.id ? null : level.id;
                if (next && typeof window !== 'undefined') {
                  sessionStorage.setItem('lastViewedCourseId', next);
                }
                return next;
              });
            }}
            statusData={statusData}
            onModuleClick={(moduleId, subtopicId, lessonId) => {
              handleCourseCardClick(() => {
                telemetryFactory.interact({ eid: 'INTERACT', edata: { id: `module-click-${moduleId}`, type: 'CLICK', pageid: 'learn', uid: localStorage.getItem('userId') || '' } });
                trackCourseClick(moduleId);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('lastViewedCourseId', level.id);
                }
                if (subtopicId && lessonId) {
                  router.push(`/learn/${level.id}/${moduleId}/${subtopicId}/${lessonId}`);
                } else if (subtopicId) {
                  router.push(`/learn/${level.id}/${moduleId}/${subtopicId}`);
                } else {
                  router.push(`/learn/${level.id}/${moduleId}`);
                }
              });
            }}
            modules={level.rawModules}
          />
        ))}
        <Box sx={{ height: 20 }} />
      </Box>
      <Box sx={{ height: 80, flexShrink: 0 }} />
      <SwadhaarBottomNav />
      <LanguagePreferenceModal
        open={languageModalOpen}
        onClose={() => {
          setLanguageModalOpen(false);
          pendingNavigationRef.current = null;
        }}
        onSelect={handleLanguageSelect}
        selectedLanguage={selectedLanguage}
      />
    </Box>
  );
}
