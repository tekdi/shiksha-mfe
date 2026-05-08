import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Trainer } from '../types';
import { useRouter } from 'next/navigation';

interface ContentProgressViewProps {
  trainers: Trainer[];
}

const ContentProgressView: React.FC<ContentProgressViewProps> = ({ trainers }) => {
  const router = useRouter();

  const mockLevels = [
    { id: 'l1', name: 'RBI New Content', completed: 4, total: 4, status: 'completed' },
    { id: 'l2', name: 'Beginner Level', completed: 4, total: 4, status: 'completed' },
    { id: 'l3', name: 'Intermediate Level', completed: 2, total: 4, status: 'in-progress' },
  ];

  return (
    <Box>
      {mockLevels.map((level) => (
        <Accordion
          key={level.id}
          elevation={0}
          defaultExpanded={level.status === 'in-progress'}
          sx={{
            mb: 2,
            border: `1px solid ${level.status === 'in-progress' ? '#E6873C' : '#eee'}`,
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
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `1px solid #E6873C`, mr: 1.5 }} />
                )}
                <Typography sx={{ fontWeight: 700, color: '#1C2B4A', fontSize: '14px' }}>{level.name}</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2 }}>
            <Typography sx={{ fontSize: '11px', color: '#999', mb: 2 }}>
                {level.completed}/{level.total} Trainers Completed
            </Typography>
            <List sx={{ p: 0 }}>
              {trainers.map((trainer, idx) => {
                const progress = idx === 0 ? 100 : idx === 1 ? 100 : idx === 2 ? 75 : 0;
                const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'locked';
                const borderColor = status === 'completed' ? '#4CAF50' : status === 'in-progress' ? '#E6873C' : '#eee';

                return (
                  <ListItem
                    key={trainer.id}
                    onClick={() => router.push(`/cfl/trainer/${trainer.id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      mb: 1.5,
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      '&:hover': { bgcolor: '#fbfbfb' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                        {progress === 100 ? (
                           <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                        ) : (
                          <>
                            <CircularProgress
                              variant="determinate"
                              value={progress}
                              size={24}
                              thickness={4}
                              sx={{ color: progress > 0 ? '#E6873C' : '#eee' }}
                            />
                            <Typography
                              variant="caption"
                              component="div"
                              color="text.secondary"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '6px',
                                fontWeight: 700
                              }}
                            >
                              {progress}%
                            </Typography>
                          </>
                        )}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1C2B4A' }}>{trainer.name}</Typography>
                        <Typography sx={{ fontSize: '10px', color: '#999' }}>Progress: {progress}% Completed</Typography>
                      </Box>
                    </Box>
                    <ChevronRightIcon sx={{ color: borderColor }} />
                  </ListItem>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ContentProgressView;
