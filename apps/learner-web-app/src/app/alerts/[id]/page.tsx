'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Button,IconButton } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { AlertCard, getAlerts, markAsRead } from '@learner/utils/alertsStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
function formatDate(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function AlertDetailPage() {
  const router = useRouter();
  const params = useParams();
  const alertId = params?.id as string;

  const [alert, setAlert] = useState<AlertCard | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/home');
    }
  }, []);

  useEffect(() => {
    if (!alertId) return;
    const alerts = getAlerts();
    const found = alerts.find((a) => a.id === alertId) || null;
    setAlert(found);
    if (found) markAsRead(found.id);
  }, [alertId]);

  const actionLabel = useMemo(() => {
    if (!alert?.actionUrl) return '';
    if (alert.actionUrl.includes('/certificate')) return 'Download Certificate';
    if (alert.actionUrl.includes('/profile')) return 'View Certificates';
    if (alert.actionUrl.includes('/learn/')) return 'Open Content';
    return 'Open';
  }, [alert?.actionUrl]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#F5F5F5', pb: '80px', fontFamily: 'Inter, sans-serif' }}>
      <Box
        sx={{
          bgcolor: '#fff',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* <Button onClick={() => router.back()} sx={{ minWidth: 0, color: '#1F2937' }}>
          <Typography sx={{ fontSize: 18 }}>←</Typography>
        </Button> */}
          <IconButton onClick={() => router.back()}>
          <ArrowBackIcon sx={{ color: '#E6873C', fontSize: 20 }} />
        </IconButton>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#1F2937', flex: 1 }}>Alert</Typography>
      </Box>

      <Box sx={{ px: 2, py: 2 }}>
        {!alert ? (
          <Typography sx={{ color: '#6B7280', textAlign: 'center', py: 6 }}>
            Alert not found.
          </Typography>
        ) : (
          <>
            <Box
              sx={{
                bgcolor: '#1C2B4A',
                borderRadius: '16px',
                p: 2.5,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  mb: 0.75,
                  lineHeight: 1.4,
                }}
              >
                {alert.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {formatDate(alert.timestamp)}
              </Typography>
            </Box>

            <Box
              sx={{
                bgcolor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                p: 2,
              }}
            >
              <Typography sx={{ color: '#1F2937', fontSize: 14, fontWeight: 500, lineHeight: 1.7 }}>
                {alert.metadata?.messageBody || alert.message}
              </Typography>
            </Box>

            {alert.locked && (
              <Box
                sx={{
                  bgcolor: 'rgba(156,163,175,0.1)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  px: 2,
                  py: 1.5,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9CA3AF">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <Typography sx={{ color: '#6B7280', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                  {alert.lockedMessage || 'Complete previous course to unlock.'}
                </Typography>
              </Box>
            )}

            {alert.actionUrl && (
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!!alert.locked}
                  onClick={() => !alert.locked && router.push(alert.actionUrl!)}
                  sx={{
                    bgcolor: alert.locked ? '#D1D5DB' : '#E6873C',
                    '&:hover': { bgcolor: alert.locked ? '#D1D5DB' : '#D1752D' },
                    '&.Mui-disabled': { bgcolor: '#D1D5DB', color: '#9CA3AF' },
                  }}
                >
                  {alert.locked ? 'Locked' : (actionLabel || 'Open')}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      <SwadhaarBottomNav />
    </Box>
  );
}

