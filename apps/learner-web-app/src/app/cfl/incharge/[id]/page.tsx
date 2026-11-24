'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CFLHeader from '../../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../../libs/cfl/components/ProfileCard';
import FABButton from '../../../../../../../libs/cfl/components/FABButton';
import SwadhaarLevelAccordion from '../../../../components/Swadhaar/SwadhaarLevelAccordion';
import {
  buildSwadhaarLevels,
  fetchSwadhaarEnrolledCourses,
  getSavedCourseLanguage,
  SWADHAAR_DONE_PERCENT,
  type SwadhaarLevel,
} from '@learner/utils/API/SwadhaarService';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';

export default function TrainerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [tenantId, setTenantId] = useState('');
  const [trainerName, setTrainerName] = useState('Trainer');
  const [trainerAvatar, setTrainerAvatar] = useState<string | undefined>(undefined);
  const [cflName, setCflName] = useState('CFL');
  const [isLoading, setIsLoading] = useState(true);
  const [levels, setLevels] = useState<SwadhaarLevel[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || '');
      // Try to get trainer name from query or localStorage
      const searchParams = new URLSearchParams(window.location.search);
      const nameParam = searchParams.get('name');
      const avatarParam = searchParams.get('avatarUrl');
      if (nameParam) setTrainerName(nameParam);
      if (avatarParam) setTrainerAvatar(avatarParam);
      setCflName(`CFL: ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);
    }
  }, [id]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const trainerId = id as string;

      // The trainer's own enrolled courses and module progress, from the Swadhaar LMS
      // (enrollments/users-courses?userId= and courses/:id/hierarchy/tracking/:trainerId)
      const trainerCourses = await fetchSwadhaarEnrolledCourses(trainerId, getSavedCourseLanguage());
      const status = trainerCourses.flatMap((course: any) => course.trackingStatus || []);
      const levelDataList = buildSwadhaarLevels(trainerCourses, status);

      setStatusData(status);
      setLevels(levelDataList);

      // Auto-expand the course in progress, else the next one to start
      const activeLevel =
        levelDataList.find((l) => l.isUnlocked && l.completionPercentage > 0 && l.completionPercentage < SWADHAAR_DONE_PERCENT)
        || levelDataList.find((l) => l.isUnlocked && l.completionPercentage < SWADHAAR_DONE_PERCENT)
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

  return (
    <Box sx={{ pb: 10, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <CFLHeader title={t("CFL_DASHBOARD.CFL_INCHARGE_PROGRESS")} showBack />

      <Box sx={{ p: 2, maxWidth: isDesktop ? 900 : '100%', mx: 'auto' }}>
        <ProfileCard username={trainerName} location={cflName} avatarUrl={trainerAvatar} hideGreeting />

        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, mt: 3, color: '#1C2B4A', fontSize: '16px', fontFamily: 'Inter, sans-serif' }}>
          {t("CFL_DASHBOARD.COURSE_PROGRESS")}
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

      <FABButton trainerId={id as string} trainerName={trainerName} avatarUrl={trainerAvatar} targetRole="cfl_incharge" />
    </Box>
  );
}
