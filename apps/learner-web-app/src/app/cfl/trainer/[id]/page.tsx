'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CFLHeader from '../../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../../libs/cfl/components/ProfileCard';
import FABButton from '../../../../../../../libs/cfl/components/FABButton';
import SwadhaarLevelAccordion from '../../../../components/Swadhaar/SwadhaarLevelAccordion';
import {
  fetchSwadhaarLevelCourses,
  getContentCourseStatus,
} from '@learner/utils/API/SwadhaarService';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';

/**
 * Recursive lesson count calculation (same as swadhaar-home).
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

export default function TrainerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [tenantId, setTenantId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [trainerName, setTrainerName] = useState('Trainer/CFL Incharge');
  const [trainerAvatar, setTrainerAvatar] = useState<string | undefined>(undefined);
  const [cflName, setCflName] = useState('District Incharge');
  const [isLoading, setIsLoading] = useState(true);
  const [levels, setLevels] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || '');
      setUserRole(localStorage.getItem('userRole')?.trim().toUpperCase() || '');
      // Try to get trainer name from query or localStorage
      const searchParams = new URLSearchParams(window.location.search);
      const nameParam = searchParams.get('name');
      const avatarParam = searchParams.get('avatarUrl');
      if (nameParam) setTrainerName(nameParam);
      if (avatarParam) setTrainerAvatar(avatarParam);
      setCflName(`District Incharge: ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const trainerId = id as string;
      const storedTenantId = localStorage.getItem('tenantId') || '';

      // 1. Fetch all courses (same as Swadhaar home)
      const levelCourses = await fetchSwadhaarLevelCourses();
      if (!levelCourses || levelCourses.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Collect all hierarchy IDs for status fetching
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

      // 3. Fetch status for the TRAINER (not logged-in user) 
      let status: any[] = [];
      if (trainerId && allHierarchyIds.length && storedTenantId) {
        const batchSize = 100;
        for (let i = 0; i < allHierarchyIds.length; i += batchSize) {
          const batch = allHierarchyIds.slice(i, i + batchSize);
          const batchStatus = await getContentCourseStatus([trainerId], batch, storedTenantId).catch(() => []);
          status = [...status, ...batchStatus];
        }
      }

      setStatusData(status);

      // 4. Filter hierarchy (remove empty containers)
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

      // 5. Map to level data (same as Swadhaar home)
      const levelDataList = filteredLevelCourses.map((course: any, idx: number, filteredLevels: any[]) => {
        const children = course?.children || [];

        const moduleDetails = children.map((m: any) => {
          const { total, completed } = calculateNodeLessons(m, status);
          const modulePerc = total > 0 ? (completed / total) * 100 : 0;
          return { isModuleComplete: modulePerc >= 100, modulePerc };
        });

        const levelStats = calculateNodeLessons(course, status);
        const levelPerc = levelStats.total > 0 ? (levelStats.completed / levelStats.total) * 100 : 0;

        (course as any).calculatedCompletion = levelPerc;

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

      setLevels(levelDataList);

      // Auto-expand the first in-progress level
      const activeLevel =
        levelDataList.find((l) => l.isUnlocked && l.completionPercentage > 0 && l.completionPercentage < 100)
        || levelDataList.find((l) => l.isUnlocked && l.completionPercentage < 100)
        || levelDataList[0];
      if (activeLevel) setExpandedLevelId(activeLevel.id);
    } catch (err) {
      console.error('Error loading trainer detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', bgcolor: '#F9FAFB' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  const isDI = userRole === 'District Incharge';

  return (
    <Box sx={{ pb: 10, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <CFLHeader title={isDI ? t('CFL_DASHBOARD.DISTRICT_INCHARGE') : t('CFL_DASHBOARD.TRAINER')} showBack />

      <Box sx={{ p: 2, maxWidth: isDesktop ? 900 : '100%', mx: 'auto' }}>
        <ProfileCard username={trainerName} location={cflName} avatarUrl={trainerAvatar} hideGreeting />

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, mt: 3, color: '#1C2B4A', fontSize: '16px', fontFamily: 'Inter, sans-serif' }}>
          {t("CFL_DASHBOARD.CONTENT_PROGRESS")}
        </Typography>

        {levels.length > 0 ? (
          <Box>
            {levels.map((level) => (
              <SwadhaarLevelAccordion
                key={level.id}
                levelId={level.id}
                levelName={level.name}
                completedModules={level.completedModules}
                totalModules={level.totalModules}
                completionPercentage={level.completionPercentage}
                isUnlocked={level.isUnlocked}
                isExpanded={expandedLevelId === level.id}
                onToggle={() => setExpandedLevelId(expandedLevelId === level.id ? null : level.id)}
                statusData={statusData}
                onModuleClick={(mid) => {
                  router.push(`/learn/${level.id}/${mid}?trainerId=${id}&isCFL=true&name=${encodeURIComponent(trainerName)}&avatarUrl=${encodeURIComponent(trainerAvatar || '')}`);
                }}
                modules={level.rawChildren}
              />
            ))}
          </Box>
        ) : (
          <Typography align="center" color="textSecondary" sx={{ py: 5 }}>
            {t("CFL_DASHBOARD.NO_COURSE_DATA_FOUND_FOR_THIS_TRAINER")}
          </Typography>
        )}
      </Box>

      <FABButton trainerId={id as string} trainerName={trainerName} avatarUrl={trainerAvatar} />
    </Box>
  );
}
