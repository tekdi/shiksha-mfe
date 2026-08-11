'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Avatar } from '@mui/material';
import CFLHeader from '../../../../../../../libs/cfl/components/CFLHeader';
import { getAlerts, AlertNotification } from '../../../../../../../libs/cfl/services/cflService';
import { getUserDetails } from '../../../../utils/API/services/ProfileService';

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [senderAvatarUrl, setSenderAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlert = async () => {
      let userId = '';
      let tenantId = '';
      let token = '';

      if (typeof window !== 'undefined' && window.localStorage) {
        userId = localStorage.getItem('userId') || '';
        tenantId = localStorage.getItem('tenantId') || '';
        token = localStorage.getItem('token') || '';
      }

      if (userId && tenantId && token) {
        const notifications = await getAlerts(userId, tenantId, token);
        const matchedAlert = notifications.find(n => n.id === params.id);
        if (matchedAlert) {
          setAlert(matchedAlert);
        }
      }
      setLoading(false);
    };

    fetchAlert();
  }, [params.id]);

  const meta = alert?.metadata || alert?.actionData?.actionData?.metadata || alert?.actionData?.metadata || alert?.actionData;

  useEffect(() => {
    if (meta?.senderAvatar) {
      setSenderAvatarUrl(meta.senderAvatar);
    } else if (meta?.senderId) {
      getUserDetails(meta.senderId, true)
        .then((res: any) => {
          const nameField = res?.result?.userData?.name;
          if (nameField && (nameField.startsWith('http') || nameField.startsWith('https'))) {
            setSenderAvatarUrl(nameField);
          }
        })
        .catch((err: any) => console.error('Failed to fetch sender profile image:', err));
    }
  }, [meta]);

  const isDI = typeof window !== 'undefined' ? (localStorage.getItem('userRole') === 'DI' || localStorage.getItem('userRole') === 'DISTRICT INCHARGE' || localStorage.getItem('userRole') === 'ARM') : false;
  const isAlertFromCFL = meta?.senderDesignation === 'CFL' || meta?.senderDesignation === 'District Incharge' || alert?.title?.includes('Alert from CFL') || alert?.title?.includes('Alert from District Incharge');
  const headerTitle = alert ? (isDI && isAlertFromCFL ? 'Raise to ARM Alert' : alert.title) : 'Alert Details';

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title={headerTitle} showBack />
      
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !alert ? (
          <Typography sx={{ color: '#666', textAlign: 'center', mt: 4 }}>
            Alert not found.
          </Typography>
        ) : (
          <Box>
            <Box sx={{ 
              bgcolor: '#1C2B4A', 
              borderRadius: '16px', 
              p: 2.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              color: '#fff'
            }}>
              <Box sx={{ flex: 1, minWidth: 0, pr: 1.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#fff', fontFamily: 'Open Sans' }}>
                  {meta?.senderName 
                    ? `${meta?.senderDesignation === 'District Incharge' ? 'District Incharge' : (meta?.senderDesignation ? meta.senderDesignation + ' Incharge' : 'CFL Incharge')} : ${meta.senderName}` 
                    : alert.title}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 400, fontFamily: 'Open Sans', mt: 0.25 }}>
                  {meta?.senderName 
                    ? (meta?.senderLocation || (meta?.senderDesignation === 'District Incharge' ? 'District Incharge: CFL Jharkhand - Torpa' : 'CFL: CFL Jharkhand - Torpa')) 
                    : new Date(alert.createdAt).toLocaleString()}
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

            <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#1C2B4A', px: 2, py: 1.5 }}>
                <Typography sx={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                  Message
                </Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Typography sx={{ color: '#333', fontSize: '14px', lineHeight: 1.6 }}>
                  {alert.message}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
