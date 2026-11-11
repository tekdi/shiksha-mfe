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
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { Trainer } from '../types';
import { useRouter } from 'next/navigation';
import { ArrowForward } from '@mui/icons-material';
import { useTranslation } from '@shared-lib';

interface ContentProgressViewProps {
  trainers: Trainer[];
}

const ContentAccordion: React.FC<{ level: any, trainers: Trainer[], router: any }> = ({ level, trainers, router }) => {
  const [expanded, setExpanded] = React.useState(level.status === 'in-progress');

  const { t } = useTranslation();

  const getBorderColor = (status: string) => {
    if (status === 'completed') return '#4CAF50';
    if (status === 'in-progress') return '#E6873C';
    return '#eee';
  };

  const borderColor = getBorderColor(level.status);

  return (
    <Accordion
      expanded={expanded}
      onChange={(event, isExpanded) => setExpanded(isExpanded)}
      elevation={0}
      sx={{
        mb: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary
        expandIcon={expanded ? <UnfoldLessRoundedIcon sx={{ color: borderColor }} /> : <UnfoldMoreRoundedIcon sx={{ color: borderColor }} />}
        sx={{
          alignItems: 'flex-start',
          '& .MuiAccordionSummary-content': {
            my: 1.5,
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            mt: 1.75,
          },
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'none',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#1A1A1A', fontSize: '12px', fontFamily: 'Inter' }}>
              {level.name}
            </Typography>
            <Typography sx={{ fontSize: '10px', color: '#999', mt: 0.5, fontWeight: 400, fontFamily: 'Inter' }}>
              {level.completed}/{level.total} {t("CFL_DASHBOARD.TRAINERS_COMPLETED")}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
        <List sx={{ p: 0 }}>
          {trainers.map((trainer) => {
            const courseStatus = trainer.courses.find(c => c.id === level.id);
            const status = courseStatus ? courseStatus.status : 'locked';
            const progress = status === 'completed' ? 100 : (status === 'in-progress' ? (courseStatus?.completionPercentage ?? 25) : 0);
            const itemBorderColor = status === 'completed' ? '#4CAF50' : (status === 'in-progress' ? '#E6873C' : '#999');

            return (
              <ListItem
                key={trainer.id}
                onClick={() => {
                  const encodedAvatar = encodeURIComponent(trainer.avatarUrl || '');
                  if (trainer.designation === 'CFL Incharge') {
                    router.push(`/cfl/incharge/${trainer.id}?name=${encodeURIComponent(trainer.name)}&avatarUrl=${encodedAvatar}`);
                  } else {
                    router.push(`/cfl/trainer/${trainer.id}?name=${encodeURIComponent(trainer.name)}&avatarUrl=${encodedAvatar}`);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  p: 0,
                  '&:hover': { bgcolor: '#fbfbfb' },
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2, ml: 1 }}>
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
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: `1px solid ${itemBorderColor}`,
                  borderRadius: '8px',
                  p: 1.5,
                }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1A1A1A', fontFamily: 'Inter' }}>{trainer.name}</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#999', fontFamily: 'Inter', fontWeight: 400 }}>{t("CFL_DASHBOARD.PROGRESS_PERCENT_COMPLETED").replace("{{percent}}", progress.toString())}</Typography>
                  </Box>
                  <ArrowForward sx={{ color: itemBorderColor }} />
                </Box>
              </ListItem>
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

const ContentProgressView: React.FC<ContentProgressViewProps> = ({ trainers }) => {
  const router = useRouter();

  // Derive levels (courses) dynamically from the first trainer
  const levels = trainers.length > 0 ? trainers[0].courses.map(course => {
    // Calculate total completed trainers for this course
    const completedTrainers = trainers.filter(t => 
      t.courses.find(c => c.id === course.id)?.status === 'completed'
    ).length;

    const inProgressTrainers = trainers.filter(t =>
      t.courses.find(c => c.id === course.id)?.status === 'in-progress'
    ).length;

    let overallStatus = 'locked';
    if (completedTrainers === trainers.length && trainers.length > 0) overallStatus = 'completed';
    else if (completedTrainers > 0 || inProgressTrainers > 0) overallStatus = 'in-progress';

    return {
      id: course.id,
      name: course.name,
      completed: completedTrainers,
      total: trainers.length,
      status: overallStatus
    };
  }) : [];

  return (
    <Box>
      {levels.map((level) => (
        <ContentAccordion key={level.id} level={level} trainers={trainers} router={router} />
      ))}
    </Box>
  );
};

export default ContentProgressView;
