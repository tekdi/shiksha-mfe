'use client';

import React from 'react';
import { Box, Typography, LinearProgress, Collapse, IconButton, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';
const DARK_NAV = '#1C2B4A';

interface Trainer {
  id: string;
  name: string;
  progress: number;
}

interface CFLDesktopTrainerAccordionProps {
  trainer: Trainer;
  isExpanded: boolean;
  onToggle: () => void;
}

const CFLDesktopTrainerAccordion: React.FC<CFLDesktopTrainerAccordionProps> = ({ trainer, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  const isCompleted = trainer.progress >= 100;

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: `1.5px solid ${isExpanded ? PRIMARY : '#E5E7EB'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isExpanded ? '0 4px 20px rgba(230,135,60,0.12)' : 'none',
        '&:hover': {
          borderColor: PRIMARY,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          gap: 2
        }}
      >
        {/* Progress Indicator */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isCompleted ? (
            <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 32 }} />
          ) : (
            <Box sx={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LinearProgress 
                variant="determinate" 
                value={trainer.progress} 
                sx={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%',
                  bgcolor: '#F3F4F6',
                  '& .MuiLinearProgress-bar': { bgcolor: PRIMARY }
                }} 
              />
              {/* Circular workaround since MUI LinearProgress is linear. Using a basic SVG for circle if needed, but for now let's use a nice box. */}
              <Box sx={{ 
                width: 40, height: 40, borderRadius: '50%', border: `3px solid ${PRIMARY}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}>
                 <Typography sx={{ fontSize: 10, fontWeight: 800, color: PRIMARY }}>
                   {Math.round(trainer.progress)}%
                 </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, color: DARK_NAV, fontSize: 16 }}>
            {trainer.name}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>
            Trainer ID: {trainer.id.slice(0, 8)}... • {isCompleted ? 'Completed all courses' : 'Currently learning'}
          </Typography>
        </Box>

        <IconButton size="small">
          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid #F3F4F6' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: DARK_NAV, mb: 2 }}>
            Course Breakdown
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
             {/* Mocked course data for the trainer */}
             {[
               { name: 'Introduction to Pedagogy', progress: 100 },
               { name: 'Classroom Management', progress: trainer.progress > 50 ? 100 : 40 },
               { name: 'Assessment Strategies', progress: trainer.progress > 80 ? 100 : 0 },
               { name: 'Digital Literacy for Educators', progress: 0 }
             ].map((course, idx) => (
               <Box key={idx} sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                   <Typography sx={{ fontSize: 12, fontWeight: 700, color: DARK_NAV }}>{course.name}</Typography>
                   <Typography sx={{ fontSize: 11, fontWeight: 700, color: course.progress >= 100 ? SUCCESS : PRIMARY }}>
                     {course.progress}%
                   </Typography>
                 </Box>
                 <LinearProgress 
                   variant="determinate" 
                   value={course.progress} 
                   sx={{ 
                     height: 6, borderRadius: 3, bgcolor: '#E5E7EB',
                     '& .MuiLinearProgress-bar': { bgcolor: course.progress >= 100 ? SUCCESS : PRIMARY }
                   }} 
                 />
               </Box>
             ))}
          </Box>

          <Button 
            fullWidth 
            sx={{ mt: 3, textTransform: 'none', fontWeight: 700, color: PRIMARY }}
            onClick={() => {/* Navigate to detailed view */}}
          >
            View Full Detailed Report
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CFLDesktopTrainerAccordion;
