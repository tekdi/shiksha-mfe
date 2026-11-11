import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { useTranslation } from '@shared-lib';

import { Trainer } from '../types';

interface StatsCardProps {
  totalTrainers: number;
  completedTrainers: number;
  userRole?: string;
  trainers?: Trainer[];
}

const StatsCard: React.FC<StatsCardProps> = ({ totalTrainers, completedTrainers, userRole, trainers = [] }) => {
  const { t } = useTranslation();

  if (userRole === 'DI' || userRole === 'DISTRICT INCHARGE' || userRole === 'ARM') {
    // Since getDICohorts now returns only CFL entries, all items in trainers are CFL Incharges
    const cflCount = trainers.length;
    const completedCFLCount = trainers.filter(t => (t.progress ?? 0) >= 70).length;
    
    return (
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <Card sx={{ flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 700,fontFamily:'Inter', color: '#1A1A1A' }}>
              {cflCount}
            </Typography>
            <Typography sx={{ fontSize: '9px',fontWeight:400,fontFamily:'Inter', color: '#999', textTransform: 'uppercase' }}>
              {t("CFL_DASHBOARD.CFL_INCHARGES")}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1.5, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
          <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 800, color: '#1C2B4A' }}>
              {completedCFLCount}/{cflCount}
            </Typography>
            <Typography sx={{ fontSize: '9px', color: '#999', textTransform: 'uppercase' }}>
              {t("CFL_DASHBOARD.CFL_INCHARGES_COMPLETED_NEW_CONTENT")}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Card sx={{ flex: 1, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: '1px !important', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 700,fontFamily:'Inter', color: '#1A1A1A' }}>
            {totalTrainers}
          </Typography>
          <Typography sx={{ fontSize: '9px',fontWeight:400,fontFamily:'Inter', color: '#999' }}>
            {t("CFL_DASHBOARD.TRAINERS")}
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1.5, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <CardContent sx={{ p: '1px !important', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 700,fontFamily:'Inter', color: '#1A1A1A' }}>
            {completedTrainers}/{totalTrainers}
          </Typography>
          <Typography sx={{ fontSize: '9px',fontWeight:400,fontFamily:'Inter', color: '#999' }}>
            {t("CFL_DASHBOARD.TRAINERS_COMPLETED_NEW_CONTENT")}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatsCard;
