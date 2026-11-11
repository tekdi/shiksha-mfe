'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Modal } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import ProfileCard from '../../../../../../libs/cfl/components/ProfileCard';
import StatsCard from '../../../../../../libs/cfl/components/StatsCard';
import TrainerAccordion from '../../../../../../libs/cfl/components/TrainerAccordion';
import ContentProgressView from '../../../../../../libs/cfl/components/ContentProgressView';
import { useCFLTrainers } from '../../../../../../libs/cfl/hooks/useCFL';
import { useMediaQuery, useTheme } from '@mui/material';
import CFLDesktopHome from '../../../components/CFL/Desktop/CFLDesktopHome';
import { useRouter } from 'next/navigation';
import SwadhaarBottomNav from '../../../components/Swadhaar/SwadhaarBottomNav';
import SimpleModal from '@learner/components/SimpleModal/SimpleModal';
import { cohortList } from "@learner/utils/API/services/CohortServices";
import { getUserDetails } from '@learner/utils/API/services/ProfileService';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';

export default function CFLHomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'trainer' | 'content'>('trainer');
  const [tenantId, setTenantId] = useState('');
  const [username, setUsername] = useState('Priya!'); // Matched Figma "Priya!"
  const [location, setLocation] = useState('CFL Jharkhand - Torpa');
  const [showUpdateProfilePrompt, setShowUpdateProfilePrompt] = useState(false);
  const [desktopEditProfileOpen, setDesktopEditProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState('CFL');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const { trainers, loading, error, refresh } = useCFLTrainers(tenantId);

  const refreshProfileData = useCallback(() => {
    setTenantId(localStorage.getItem('tenantId') || '');
    const firstName = localStorage.getItem('firstName');
    if (firstName) {
      setUsername(firstName + '!');
      const mobile = localStorage.getItem('mobileNumber') || '';
      if (mobile && firstName === mobile) {
        setShowUpdateProfilePrompt(true);
      }
    }
    const role = localStorage.getItem('userRole')?.trim().toUpperCase() || '';
    const prefix = (role === 'ARM') ? 'ARM' : t('CFL_DASHBOARD.DISTRICT_INCHARGE');
    setLocation(`${prefix}: ${localStorage.getItem('stateName') || 'Jharkhand'} - ${localStorage.getItem('districtName') || 'Torpa'}`);

    const uid = localStorage.getItem('userId');
    if (uid) {
      getUserDetails(uid, true).then(profileResponse => {
        const profileData = profileResponse?.result?.userData;
        if (profileData?.name) {
          setProfileImageUrl(profileData.name);
        }
      }).catch(err => console.error('Error fetching profile image:', err));
    }
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawRole = localStorage.getItem('userRole') || 'CFL';
      const role = rawRole.trim().toUpperCase();
      setUserRole(role);
      const userId = localStorage.getItem('userId');
      if (role !== 'CFL' && role !== 'DI' && role !== 'DISTRICT INCHARGE' && role !== 'ARM' && userId !== '7f60190c-16eb-4583-bbef-c5fc7bc484e7') {
        window.location.href = '/swadhaar-home';
        return;
      }
      if (role === "DI" || role === "CFL" || role === "DISTRICT INCHARGE" || role === "ARM") {
        const fetchCohortData = async () => {
          try {
            const userId = localStorage.getItem("userId");
            const tenantId = localStorage.getItem('tenantId');

            // For ARM: search without type filter so the SCHOOL type cohort is included
            // For DI / CFL / District Incharge: search for COHORT type
            const filters: any = { tenantId };
            if (role === 'CFL' || role === 'DISTRICT INCHARGE' || role === 'DI') {
              filters.type = 'COHORT';
              filters.status = ['active'];
            }

            const cohortResult = await cohortList({
              limit: 0,
              offset: 0,
              filters,
            });

            let cohortItems: any[] = [];
            if (Array.isArray(cohortResult)) {
              cohortItems = cohortResult;
            } else if (cohortResult && typeof cohortResult === "object") {
              cohortItems =
                cohortResult.results?.cohortDetails ||
                cohortResult.cohortDetails ||
                cohortResult.data ||
                [];
            }

            console.log(`[${role} Home] userId:`, userId, "cohortItems:", cohortItems.length);

            // For DI: match where parentId === userId (DI cohort has parentId = DI userId)
            // For CFL: match where parentId === userId (CFL cohort has parentId = CFL userId)
            const matchedCohort = cohortItems.find(
              (cohort: any) => cohort.parentId === userId
            );
            console.log("matchedCohort====", matchedCohort);
            if (matchedCohort) {
              const storedCohortId = matchedCohort.cohortId || matchedCohort.id;
              localStorage.setItem("cohortId", storedCohortId);
              console.log(`[${role} Home] cohortId saved:`, storedCohortId);
              refresh();
            } else {
              console.warn("No cohort matched userId:", userId, "cohorts returned:", cohortItems.length);
            }
          } catch (error) {
            console.error("Error fetching cohort after CFL login:", error);
          }
        };
        fetchCohortData();
      }

      refreshProfileData();
    }
  }, []);

  // A trainer is "completed" when every assigned course reaches the 70% threshold
  // (mirrors the learner view's 70% done gate)
  const completedCount = trainers.filter(t => {
    if (!t.courses || t.courses.length === 0) return false;
    return t.courses.every((c: any) => (c.completionPercentage ?? 0) >= 70);
  }).length;

  if (isDesktop) {
    return (
      <>
        <CFLDesktopHome
          trainers={trainers}
          loading={loading}
          error={error}
          username={username}
          location={location}
          userRole={userRole}
          onReload={refreshProfileData}
          externalEditProfileOpen={desktopEditProfileOpen}
          onExternalEditProfileClose={() => setDesktopEditProfileOpen(false)}
        />
        <Modal open={showUpdateProfilePrompt} onClose={() => setShowUpdateProfilePrompt(false)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', boxShadow: 24, outline: 'none' }}>
            {/* Header */}
            <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography onClick={() => setShowUpdateProfilePrompt(false)} sx={{ color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Close
              </Typography>
            </Box>
            {/* Body */}
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, fontStyle: "bold", fontSize: '16px', color: '#1F2937', mb: 1, fontFamily: 'Open Sans', textAlign: 'center' }}>Update Name</Typography>
              <Typography sx={{ color: '#1A1A1A', mb: 4, fontSize: 12, fontFamily: 'Open Sans' }}>Please update your profile name on the edit profile page.</Typography>
              <Button fullWidth variant="outlined" onClick={() => { setShowUpdateProfilePrompt(false); setDesktopEditProfileOpen(true); }} sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.5, fontSize: 15, fontFamily: 'Inter, sans-serif', '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(230,135,60,0.04)' } }}>Go to Edit Profile</Button>
            </Box>
          </Box>
        </Modal>
      </>
    );
  }

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title={(userRole === 'ARM') ? 'ARM' : t('CFL_DASHBOARD.DISTRICT_INCHARGE')} />

      <Box sx={{ p: 2 }}>
        <ProfileCard username={username} location={location} avatarUrl={profileImageUrl || undefined} />
        <StatsCard
          totalTrainers={loading ? 0 : trainers.length}
          completedTrainers={loading ? 0 : completedCount}
          userRole={userRole}
          trainers={trainers}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            fullWidth
            variant={viewMode === 'trainer' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('trainer')}
            sx={{
              borderRadius: '20px',
              fontFamily: 'Open sans',
              fontSize: "10px",
              textTransform: 'none',
              bgcolor: viewMode === 'trainer' ? PRIMARY : 'transparent',
              borderColor: PRIMARY,
              color: viewMode === 'trainer' ? '#fff' : PRIMARY,
              fontWeight: 600,
              '&:hover': { bgcolor: viewMode === 'trainer' ? '#d67a32' : 'rgba(230,135,60,0.05)' }
            }}
          >
            {(userRole === 'DI' || userRole === 'DISTRICT INCHARGE' || userRole === 'ARM') ? t("CFL_DASHBOARD.CFL_INCHARGE_PROGRESS") : t("CFL_DASHBOARD.TRAINER_PROGRESS")}
          </Button>
          <Button
            fullWidth
            variant={viewMode === 'content' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('content')}
            sx={{
              borderRadius: '20px',
              fontFamily: 'Open sans',
              fontSize: "10px",
              textTransform: 'none',
              bgcolor: viewMode === 'content' ? PRIMARY : 'transparent',
              borderColor: PRIMARY,
              color: viewMode === 'content' ? '#fff' : PRIMARY,
              fontWeight: 600,
              '&:hover': { bgcolor: viewMode === 'content' ? '#d67a32' : 'rgba(230,135,60,0.05)' }
            }}
          >
            {t("CFL_DASHBOARD.CONTENT_PROGRESS")}
          </Button>
        </Box>

        <Typography sx={{ fontFamily: 'Open Sans', fontWeight: 600, fontSize: '18px', color: '#1A1A1A', p: 2 }}>
          {viewMode === 'trainer' ? ((userRole === 'DI' || userRole === 'DISTRICT INCHARGE' || userRole === 'ARM') ? t("CFL_DASHBOARD.CFL_INCHARGE_LIST") : t("CFL_DASHBOARD.TRAINER_LIST")) : t("CFL_DASHBOARD.CONTENT_PROGRESS")}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: PRIMARY }} />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <Box>
            {viewMode === 'trainer' ? (
              trainers.map((trainer) => (
                <TrainerAccordion key={trainer.id} trainer={trainer} />
              ))
            ) : (
              <ContentProgressView trainers={trainers} />
            )}
          </Box>
        )}
      </Box>

      <SwadhaarBottomNav />
      <Modal open={showUpdateProfilePrompt} onClose={() => setShowUpdateProfilePrompt(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 340, bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', boxShadow: 24, outline: 'none' }}>
          {/* Header */}
          <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography onClick={() => setShowUpdateProfilePrompt(false)} sx={{ color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Close
            </Typography>
          </Box>
          {/* Body */}
          <Box sx={{ p: 3, textAlign: 'left' }}>
            <Typography sx={{ fontWeight: 700, fontStyle: "bold", fontSize: '16px', color: '#1F2937', mb: 1, fontFamily: 'Open Sans', textAlign: 'left' }}>Update Name</Typography>
            <Typography sx={{ color: '#4B5563', mb: 4, fontSize: 12, fontFamily: 'Open Sans' }}>Please update your profile name on the edit profile page.</Typography>
            <Button fullWidth variant="outlined" onClick={() => { setShowUpdateProfilePrompt(false); router.push('/edit-profile?updateName=true'); }} sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 700, textTransform: 'none', py: 1.5, fontSize: 15, fontFamily: 'Inter, sans-serif', '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(230,135,60,0.04)' } }}>Go to Edit Profile</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

