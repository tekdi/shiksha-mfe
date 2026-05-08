'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { getAlerts, markAsRead, AlertCard } from '@learner/utils/alertsStore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
           <ArrowBackIcon sx={{ color: '#E6873C', fontSize: 20 }} />
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
                <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
                  {meta?.senderRole
                    ? `${meta.senderRole}: ${meta.senderName}`
                    : meta?.senderName || feedback.title}
                </Typography>
                {(meta?.senderDesignation || meta?.senderLocation) && (
                  <Typography sx={{ fontSize: 12, color: '#E6873C', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>
                    {[meta?.senderDesignation, meta?.senderLocation].filter(Boolean).join(' — ')}
                  </Typography>
                )}
                {!meta?.senderName && (
                  <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', mt: 0.25 }}>
                    {feedback.type === 'completion' ? 'Course Completion' : 'System Notification'}
                  </Typography>
                )}
              </Box>
              {/* Avatar / Icon */}
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: '50%', bgcolor: '#E6873C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {meta?.senderName ? (
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{senderInitials}</Typography>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                )}
              </Box>
            </Box>

            {/* Message Card */}
            <Typography
              sx={{ fontSize: 12, color: '#E6873C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1, fontFamily: 'Inter, sans-serif' }}
            >
              Message
            </Typography>
            <Box
              sx={{
                bgcolor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px',
                p: 2, lineHeight: 1.7,
              }}
            >
              <Typography sx={{ fontSize: 14, color: '#1F2937', fontFamily: 'Inter, sans-serif', lineHeight: 1.7 }}>
                {meta?.messageBody || feedback.message}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      <SwadhaarBottomNav />
    </Box>
  );
}
