'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Snackbar } from '@mui/material';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import { getAlerts, fetchAndSyncAlerts, markAsRead, AlertCard } from '@learner/utils/alertsStore';
import { markNotificationsRead } from '@learner/utils/API/NotificationService';
import { AlertDateGroup } from '@learner/components/Alerts/AlertListRow';
import { useRouter } from 'next/navigation';
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

export default function AlertsListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
    if (alert.locked) {
      setToastMessage(alert.lockedMessage || 'Complete previous course to unlock.');
      setToastOpen(true);
      return;
    }

    markAsRead(alert.id);
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));

    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    if (userId) {
      markNotificationsRead(userId, [alert.id]).catch(() => {});
    }

    if (alert.actionUrl) {
      router.push(alert.actionUrl);
    } else {
      router.push(`/cfl/alerts/${alert.id}`);
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.isRead);
  const groups = groupByDate(unreadAlerts);

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title={t('LEARNER_APP.ALERTS.TITLE')} showBack />
      
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: '#E6873C' }} size={24} />
          </Box>
        ) : unreadAlerts.length === 0 ? (
          <Typography sx={{ color: '#666', textAlign: 'center', mt: 4, fontFamily: 'Inter, sans-serif' }}>
            {t('LEARNER_APP.ALERTS.NO_NEW_ALERTS')}
          </Typography>
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
    </Box>
  );
}
