'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { getAlerts, markAsRead, AlertCard } from '@learner/utils/alertsStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getUserDetails } from '@learner/utils/API/services/ProfileService';

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const feedbackId = params?.id as string;
  const [feedback, setFeedback] = useState<AlertCard | null>(null);

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/home');
    }
  }, []);

  useEffect(() => {
    if (!feedbackId) return;
    const alerts = getAlerts();
    const found = alerts.find(
      (a) =>
        (a.type === 'feedback' || a.type === 'completion' || a.type === 'badge') &&
        (a.id === feedbackId || a.metadata?.feedbackId === feedbackId)
    ) || alerts.find((a) => a.id === feedbackId);
    if (found) {
      setFeedback(found);
      markAsRead(found.id);
    }
  }, [feedbackId]);

  const meta = feedback?.metadata;
  const [senderAvatarUrl, setSenderAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (meta?.senderAvatar) {
      setSenderAvatarUrl(meta.senderAvatar);
    } else if (meta?.senderId) {
      getUserDetails(meta.senderId, true)
        .then(res => {
          const nameField = res?.result?.userData?.name;
          if (nameField && (nameField.startsWith('http') || nameField.startsWith('https'))) {
            setSenderAvatarUrl(nameField);
          }
        })
        .catch(err => console.error('Failed to fetch sender profile image:', err));
    }
  }, [meta]);

  const senderInitials = meta?.senderName
    ? meta.senderName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: '#F5F5F5', pb: '80px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: '#fff', px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100,
        }}
      >
        <IconButton onClick={() => router.back()} sx={{ p: 0.5 }}>
           <ArrowBackIcon sx={{ color: '#1A1A1A', fontSize: 20 }} />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#1F2937', fontFamily: 'Inter, sans-serif' }}>
          Feedback
        </Typography>
      </Box>

      <Box sx={{ px: 2, py: 2 }}>
        {!feedback ? (
          <Typography sx={{ color: '#6B7280', textAlign: 'center', py: 6, fontFamily: 'Inter, sans-serif' }}>
            Feedback not found.
          </Typography>
        ) : (
          <>
            {/* Sender / Context Card */}
            <Box
              sx={{
                bgcolor: '#1C2B4A', borderRadius: '16px', p: 2.5, mb: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0, pr: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#fff', fontFamily: 'Open Sans' }}>
                  {meta?.senderName 
                    ? `${meta?.senderDesignation === 'District Incharge' ? 'District Incharge' : (meta?.senderDesignation ? meta.senderDesignation + ' Incharge' : 'CFL Incharge')} : ${meta.senderName}` 
                    : feedback.title}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 400, fontFamily: 'Open Sans', mt: 0.25 }}>
                  {meta?.senderName 
                    ? (meta?.senderLocation || (meta?.senderDesignation === 'District Incharge' ? 'District Incharge: CFL Jharkhand - Torpa' : 'CFL: CFL Jharkhand - Torpa')) 
                    : (feedback.type === 'completion' ? 'Course Completion' : 'System Notification')}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  overflow: 'hidden'
                }}
              >
                {senderAvatarUrl ? (
                  <img src={senderAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/images/home_profile_default.png" alt="Default Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </Box>
            </Box>

            {/* Message Card */}
            <Box
              sx={{
                bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1 }}>
                <Typography sx={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 600, fontFamily: 'Open Sans' }}>
                  Message
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontSize: '12px', color: '#555555', fontWeight: 400, fontFamily: 'Inter', lineHeight: 1.7 }}>
                  {meta?.messageBody || feedback.message}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>

      <SwadhaarBottomNav />
    </Box>
  );
}
