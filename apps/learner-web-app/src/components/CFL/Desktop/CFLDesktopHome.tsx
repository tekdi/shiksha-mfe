'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, Alert, Divider } from '@mui/material';
import CFLDesktopHeader from './CFLDesktopHeader';
import CFLDesktopProfileBanner from './CFLDesktopProfileBanner';
import CFLDesktopTrainerTable from './CFLDesktopTrainerTable';
import CFLDesktopCourseAccordion from './CFLDesktopCourseAccordion';
import { useRouter } from 'next/navigation';
import SwadhaarDesktopAlertsPanel from '../../Swadhaar/Desktop/SwadhaarDesktopAlertsPanel';
import SwadhaarDesktopEditProfileModal from '../../Swadhaar/Desktop/SwadhaarDesktopEditProfileModal';
import ConfirmationModal from '../../../components/ConfirmationModal/ConfirmationModal';
import { getAlerts, getUnreadCount, fetchAndSyncAlerts } from '@learner/utils/alertsStore';
import { useTranslation } from '@shared-lib';

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
  avatarUrl?: string;
}

interface CFLDesktopHomeProps {
  trainers: Trainer[];
  loading: boolean;
  error: string | null;
  username: string;
  location: string;
}

const CFLDesktopHome: React.FC<CFLDesktopHomeProps> = ({ trainers, loading, error, username, location }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  const handleLogoutConfirm = () => {
    localStorage.clear();
    router.push('/swadhaar-login');
  };

  const handleReload = () => {
    window.location.reload();
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
      }
    }
  }, []);

  const handleCloseAlertsPanel = () => {
    setAlertsPanelOpen(false);
    setUnreadCount(getUnreadCount());
  };

  const completedCount = trainers.filter(t => t.progress >= 100).length;

  // Mocking detailed progress for the table if not present
  const detailedTrainers = trainers.map(t => ({
    ...t,
    currentLevel: t.currentLevel || (t.progress >= 100 ? 'Advance' : t.progress > 50 ? 'Intermediate' : 'Beginner'),
    beginnerProgress: t.beginnerProgress ?? (t.progress > 33 ? 100 : t.progress * 3),
    intermediateProgress: t.intermediateProgress ?? (t.progress > 66 ? 100 : t.progress > 33 ? (t.progress - 33) * 3 : 0),
    advanceProgress: t.advanceProgress ?? (t.progress >= 100 ? 100 : t.progress > 66 ? (t.progress - 66) * 3 : 0),
    newContentProgress: t.newContentProgress ?? 100
  }));

  const mockCourses: any[] = [
    { id: 'c1', name: 'RBI New Content', completedCount: 4, totalCount: 4, status: 'completed' },
    { id: 'c2', name: 'Beginner Level', completedCount: 4, totalCount: 4, status: 'completed' },
    { id: 'c3', name: 'Intermediate Level', completedCount: 2, totalCount: 4, status: 'in-progress' },
    { id: 'c4', name: 'Advance Level', completedCount: 0, totalCount: 4, status: 'locked' },
  ];

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
        onEditProfile={() => setEditProfileOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)} 
      />
      
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', transition: 'all 0.3s ease' }}>
        {/* Main Content Column */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pt: 3, pb: 4, transition: 'all 0.3s ease' }}>
          <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
            {/* Profile Banner */}
            <CFLDesktopProfileBanner 
              userName={username.replace('!', '')} 
              location={location} 
              totalTrainers={trainers.length}
              completedTrainers={completedCount}
            />

        {/* Section 1: Trainer Progress (Table) */}
        <Box sx={{ mb: 6 }}>
          <Typography sx={{ fontWeight: 800, color: '#1C2B4A', mb: 3, fontSize: 20, fontFamily: 'Inter, sans-serif' }}>
            Trainer Progress
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <CFLDesktopTrainerTable trainers={detailedTrainers} />
          )}
        </Box>

        <Divider sx={{ mb: 6, borderColor: '#E5E7EB' }} />

        {/* Section 2: Learning Progress (Accordions - Like Swadhaar) */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 800, color: '#1C2B4A', mb: 3, fontSize: 20, fontFamily: 'Inter, sans-serif' }}>
            {t('LEARNER_APP.HOME.LEARNING_PROGRESS')}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : (
            <Box>
              {mockCourses.map((course) => (
                <CFLDesktopCourseAccordion 
                  key={course.id} 
                  course={course} 
                  trainers={detailedTrainers} 
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
            />
          </Box>
        )}
      </Box>

      {/* Edit Profile Modal */}
      <SwadhaarDesktopEditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onProfileUpdated={handleReload}
      />

      {/* Logout Confirmation */}
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

export default CFLDesktopHome;
