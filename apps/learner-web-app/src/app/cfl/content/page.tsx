'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CFLHeader from '../../../../../../libs/cfl/components/CFLHeader';
import { useCFLTrainers } from '../../../../../../libs/cfl/hooks/useCFL';
import { useRouter } from 'next/navigation';

const PRIMARY = '#E6873C';

export default function ContentProgressPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState('');
  const { trainers, loading } = useCFLTrainers(tenantId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || '');
    }
  }, []);

  // Mocking course-wise aggregation based on Figma 8.1 bottom left
  const mockLevels = [
    { id: 'l1', name: 'REI New Content', completed: 4, total: 4, status: 'completed' },
    { id: 'l2', name: 'Beginner Level', completed: 4, total: 4, status: 'completed' },
    { id: 'l3', name: 'Intermediate Level', completed: 2, total: 4, status: 'in-progress' },
  ];

  return (
    <Box sx={{ pb: 10, bgcolor: '#fbfbfb', minHeight: '100vh' }}>
      <CFLHeader title="CFL Incharge" showBack />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#1C2B4A', fontSize: '16px' }}>
          New Content Progress
        </Typography>

        {mockLevels.map((level) => (
          <Accordion
            key={level.id}
            elevation={0}
            defaultExpanded={level.status === 'in-progress'}
            sx={{
              mb: 2,
              border: `1px solid ${level.status === 'in-progress' ? PRIMARY : '#eee'}`,
              borderRadius: '12px !important',
              '&:before': { display: 'none' },
              overflow: 'hidden'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {level.status === 'completed' ? (
                    <CheckCircleIcon sx={{ color: '#4CAF50', mr: 1.5 }} />
                  ) : (
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${PRIMARY}`, mr: 1.5 }} />
                  )}
                  <Typography sx={{ fontWeight: 700, color: '#1C2B4A', fontSize: '14px' }}>{level.name}</Typography>
                </Box>
                <Typography sx={{ color: PRIMARY, fontWeight: 700, fontSize: '12px' }}>
                  {level.completed}/{level.total} Trainers Completed
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, px: 1 }}>
              <List>
                {trainers.map((trainer) => (
                  <ListItem
                    key={trainer.id}
                    onClick={() => router.push(`/cfl/trainer/${trainer.id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      mb: 1,
                      border: '1px solid #f9f9f9',
                      '&:hover': { bgcolor: '#f5f5f5' },
                    }}
                    secondaryAction={
                      <IconButton edge="end">
                        <ChevronRightIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={trainer.avatarUrl} sx={{ bgcolor: '#eee' }}>
                        {trainer.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={trainer.name}
                      secondary={`Progress: ${Math.floor(Math.random() * 100)}% Completed`}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '14px', color: '#1C2B4A' }}
                      secondaryTypographyProps={{ fontSize: '11px', color: '#999' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: PRIMARY }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
