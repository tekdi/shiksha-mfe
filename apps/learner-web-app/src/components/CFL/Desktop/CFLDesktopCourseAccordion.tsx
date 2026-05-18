'use client';

import React, { useState } from 'react';
import { Box, Typography, Collapse, Grid } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CFLDesktopTrainerCard from './CFLDesktopTrainerCard';
import CFLDesktopTrainerProgressModal from './CFLDesktopTrainerProgressModal';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';
const DARK_NAV = '#1C2B4A';

interface Course {
  id: string;
  name: string;
  completedCount: number;
  totalCount: number;
  status: 'completed' | 'in-progress' | 'locked';
}

interface CFLDesktopCourseAccordionProps {
  course: Course;
  trainers: any[];
}

const CFLDesktopCourseAccordion: React.FC<CFLDesktopCourseAccordionProps> = ({ course, trainers }) => {
  const [isExpanded, setIsExpanded] = useState(course.status === 'in-progress');
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const { t } = useTranslation();

  const isCompleted = course.status === 'completed';

  return (
    <Box
      sx={{
        mb: 3,
        borderRadius: '16px',
        border: `1.5px solid ${isExpanded ? PRIMARY : '#E5E7EB'}`,
        bgcolor: '#fff',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isExpanded ? '0 4px 16px rgba(230,135,60,0.10)' : 'none',
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          cursor: 'pointer',
          bgcolor: isExpanded ? 'rgba(230,135,60,0.04)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isCompleted ? (
            <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 24 }} />
          ) : (
            <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: course.status === 'in-progress' ? PRIMARY : 'transparent' }} />
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: DARK_NAV }}>
              {course.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
              {course.completedCount}/{course.totalCount} Trainers Completed
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 700, color: isCompleted ? SUCCESS : PRIMARY, fontSize: 14 }}>
            {Math.round((course.completedCount / course.totalCount) * 100)}%
          </Typography>
          {isExpanded ? <ExpandLessIcon sx={{ color: DARK_NAV }} /> : <ExpandMoreIcon sx={{ color: DARK_NAV }} />}
        </Box>
      </Box>

      {/* Trainers Grid */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 3, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <Grid container spacing={2}>
            {trainers.map((trainer) => (
              <Grid item xs={12} sm={6} md={4} key={trainer.id}>
                <CFLDesktopTrainerCard 
                  trainer={trainer} 
                  onClick={() => setSelectedTrainer(trainer)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      {/* Trainer Progress Modal */}
      <CFLDesktopTrainerProgressModal
        open={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        trainer={selectedTrainer}
        courseName={course.name}
      />
    </Box>
  );
};

export default CFLDesktopCourseAccordion;
