import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Badge } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import { useRouter, usePathname } from 'next/navigation';
import { fetchAndSyncAlerts, getUnreadCount } from '@learner/utils/alertsStore';
import { useTranslation } from '@shared-lib';

interface CFLHeaderProps {
  title: string;
  showBack?: boolean;
}

const CFLHeader: React.FC<CFLHeaderProps> = ({ title, showBack }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [alertsCount, setAlertsCount] = useState(0);
  
  const showAlerts = pathname === '/cfl/home' || pathname === '/cfl/profile';

  useEffect(() => {
    const fetchAlerts = async () => {
      let userId = '';
      if (typeof window !== 'undefined' && window.localStorage) {
        userId = localStorage.getItem('userId') || '';
      }

      if (userId) {
        await fetchAndSyncAlerts(userId);
        setAlertsCount(getUnreadCount());
      }
    };

    fetchAlerts();
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      p: 2, 
      bgcolor: '#fff',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <IconButton onClick={() => router.back()} sx={{ mr: 1, p: 0 }}>
            <ArrowBackIcon sx={{ color: '#1A1A1A' }} />
          </IconButton>
        )}
        <Typography  sx={{ fontWeight: 700, color: '#1A1A1A', fontSize: '17px',fontFamily:'Open Sans' }}>
          {title}
        </Typography>
      </Box>
      {showAlerts && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconButton onClick={() => router.push('/cfl/alerts')} sx={{ p: 0, mb: 0.5 }}>
            <Badge
              badgeContent={alertsCount > 0 ? alertsCount : null}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 9,
                  height: 16,
                  minWidth: 16,
                  backgroundColor: '#FFFFFF',
                  color: '#E6873C',
                  border: '1px solid #E6873C',
                  top: 2,
                  right: 2
                }
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(230,135,60,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CircleNotificationsRoundedIcon sx={{ fontSize: 28, color: '#E6873C' }} />
              </Box>
            </Badge>
          </IconButton>
          <Typography sx={{ 
            color: '#E6873C', 
            fontSize: '10px', 
            fontWeight: 700,
            fontFamily:'Open Sans',
            mt: 0.5
          }}>
            {t("CFL_DASHBOARD.ALERTS")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CFLHeader;
