import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import { LevelProgress, ModuleProgress, SubtopicProgress } from '../types';

import { CircularProgress } from '@mui/material';

interface CourseAccordionProps {
  levels: LevelProgress[];
}

const CourseAccordion: React.FC<CourseAccordionProps> = ({ levels }) => {
  return (
    <Box>
      {levels.map((level, idx) => (
        <Accordion
          key={idx}
          elevation={0}
          defaultExpanded={level.status === 'in-progress'}
          sx={{
            mb: 1.5,
            border: `1px solid ${level.status === 'in-progress' ? '#E6873C' : '#eee'}`,
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {level.status === 'completed' ? (
                  <CheckCircleIcon sx={{ color: '#4CAF50', mr: 1.5 }} />
                ) : level.status === 'in-progress' ? (
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1.5 }}>
                    <CircularProgress variant="determinate" value={75} size={24} sx={{ color: '#E6873C' }} />
                    <Typography sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 700 }}>75%</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #eee', mr: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>0%</Box>
                )}
                <Typography sx={{ fontWeight: 700, color: '#1C2B4A', fontSize: '14px' }}>
                  {level.name}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '11px', color: '#999' }}>
                {level.status === 'completed' ? `Completed ${level.modules?.length}/${level.modules?.length} modules` : `Completed 3/4 modules`}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 2 }}>
            {level.modules?.map((module) => (
              <ModuleItem key={module.id} module={module} />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

const ModuleItem = ({ module }: { module: ModuleProgress }) => {
  const [expanded, setExpanded] = React.useState(module.status === 'in-progress');
  const borderColor = module.status === 'completed' ? '#4CAF50' : module.status === 'in-progress' ? '#E6873C' : '#eee';

  return (
    <Box sx={{ mb: 1, border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 1.5, 
          cursor: 'pointer',
          bgcolor: expanded ? '#fff9f5' : '#fff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {module.status === 'completed' ? (
            <CheckCircleIcon sx={{ color: '#4CAF50', mr: 1.5, fontSize: '20px' }} />
          ) : (
             <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1.5 }}>
                <CircularProgress variant="determinate" value={module.status === 'in-progress' ? 75 : 0} size={20} sx={{ color: borderColor }} />
                <Typography sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5px', fontWeight: 700 }}>{module.status === 'in-progress' ? '75%' : '0%'}</Typography>
              </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1C2B4A' }}>{module.name}</Typography>
            <Typography sx={{ fontSize: '10px', color: '#999' }}>Completed {module.completionCount}/{module.totalCount} Subtopics</Typography>
          </Box>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon sx={{ color: borderColor }} />}
        </IconButton>
      </Box>
      {expanded && module.subtopics && module.subtopics.length > 0 && (
        <Box sx={{ p: 1.5, bgcolor: '#fff', borderTop: '1px solid #f0f0f0' }}>
          {module.subtopics.map(subtopic => (
            <SubtopicItem key={subtopic.id} subtopic={subtopic} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const SubtopicItem = ({ subtopic }: { subtopic: SubtopicProgress }) => {
  const [expanded, setExpanded] = React.useState(subtopic.status === 'in-progress');
  const color = subtopic.status === 'completed' ? '#4CAF50' : subtopic.status === 'in-progress' ? '#E6873C' : '#999';

  return (
    <Box sx={{ mb: 1 }}>
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          py: 0.5,
          cursor: 'pointer'
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '12px', color: '#444' }}>{subtopic.name}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '10px', color: subtopic.status === 'locked' ? '#999' : '#E6873C', mr: 1 }}>{subtopic.completionCount}/{subtopic.totalCount} Lessons</Typography>
          {expanded ? <ExpandMoreIcon fontSize="small" sx={{ color }} /> : <ChevronRightIcon fontSize="small" sx={{ color }} />}
        </Box>
      </Box>
      {expanded && (
        <Box sx={{ pl: 2, mt: 1 }}>
          {subtopic.lessons.map(lesson => (
            <Box key={lesson.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {lesson.status === 'completed' ? (
                <CheckCircleIcon sx={{ color: '#4CAF50', mr: 1, fontSize: '16px' }} />
              ) : lesson.status === 'in-progress' ? (
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #E6873C', mr: 1 }} />
              ) : (
                <LockIcon sx={{ color: '#ccc', mr: 1, fontSize: '14px' }} />
              )}
              <Typography sx={{ fontSize: '12px', color: lesson.status === 'locked' ? '#999' : '#444' }}>
                {lesson.name} {lesson.type === 'quiz' ? '(Quiz)' : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CourseAccordion;
