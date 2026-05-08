'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, IconButton, CircularProgress, Snackbar } from '@mui/material';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useRouter } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { AlertDateGroup } from '@learner/components/Alerts/AlertListRow';
import {
  getAlerts,
  markAsRead,
  markAllAsReadLocal,
  AlertCard,
  fetchAndSyncAlerts,
} from '@learner/utils/alertsStore';
import { markNotificationsRead } from '@learner/utils/API/NotificationService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useTranslation } from '@shared-lib';
function groupByDate(alerts: AlertCard[]): Array<{ label: string; items: AlertCard[] }> {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, AlertCard[]> = {};
  const orderedKeys: string[] = [];

  alerts.forEach((alert) => {
    const d = new Date(alert.timestamp);
    const dateStr = d.toDateString();
    let label: string;
    if (dateStr === today) label = 'Today';
    else if (dateStr === yesterday) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (!groups[label]) {
      groups[label] = [];
      orderedKeys.push(label);
    }
    groups[label].push(alert);
  });

  return orderedKeys.map((key) => ({ label: key, items: groups[key] }));
}

export default function AlertsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/home');
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      if (userId) {
        const synced = await fetchAndSyncAlerts(userId);
        setAlerts(synced);
      } else {
        setAlerts(getAlerts());
      }
    } catch {
      setAlerts(getAlerts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAlertClick = async (alert: AlertCard) => {
    // If locked, show toast and don't navigate
    if (alert.locked) {
      setToastMessage(alert.lockedMessage || t('LEARNER_APP.ALERTS.LOCKED_MESSAGE'));
      setToastOpen(true);
      return;
    }

    // Mark locally
    markAsRead(alert.id);
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));

    // Mark on server (fire-and-forget)
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    if (userId) {
      markNotificationsRead(userId, [alert.id]).catch(() => {});
    }

    // Route to actionUrl or alert detail page
    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    } else {
      router.push(`/alerts/${alert.id}`);
    }
  };

  const handleMarkAllRead = async () => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    if (!userId) return;

    try {
      setLoading(true);
      // Mark on server
      await markNotificationsRead(userId, [], true);
      // Mark locally
      markAllAsReadLocal();
      // Update UI
      setAlerts(getAlerts());
    } catch {
      // Local fallback
      markAllAsReadLocal();
      setAlerts(getAlerts());
    } finally {
      setLoading(false);
    }
  };

  const groups = groupByDate(alerts);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#F9FAFB', pb: '80px', fontFamily: 'Manrope, sans-serif' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#fff', px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100,
        }}
      >
        <IconButton onClick={() => router.back()} sx={{ p: 0.5 }}>
                    <ArrowBackIcon sx={{ color: '#E6873C', fontSize: 20 }} />

        </IconButton>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#1F2937', fontFamily: 'Manrope, sans-serif', flex: 1 }}>
          {t('LEARNER_APP.ALERTS.TITLE')}
        </Typography>
        <IconButton onClick={handleMarkAllRead} disabled={loading || alerts.filter(a => !a.isRead).length === 0} sx={{ p: 0.5 }}>
          <DoneAllIcon sx={{ color: '#E6873C', fontSize: 22 }} />
        </IconButton>
        <IconButton onClick={loadAlerts} disabled={loading} sx={{ p: 0.5 }}>
          <RefreshRoundedIcon sx={{ color: '#E6873C', fontSize: 22 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#E6873C' }} />
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            {/* Bell SVG */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  bgcolor: 'rgba(230,135,60,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#E6873C">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </Box>
            </Box>
            <Typography sx={{ color: '#6B7280', fontSize: 14, fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
              {t('LEARNER_APP.ALERTS.NO_NOTIFICATIONS')}
            </Typography>
          </Box>
        ) : (
          groups.map((group) => (
            <AlertDateGroup
              key={group.label}
              label={group.label}
              alerts={group.items}
              onAlertClick={handleAlertClick}
            />
          ))
        )}
      </Box>

      {/* Toast for locked alerts */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: '#1C2B4A',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            borderRadius: '12px',
          },
        }}
      />

      <SwadhaarBottomNav />
    </Box>
  );
}
