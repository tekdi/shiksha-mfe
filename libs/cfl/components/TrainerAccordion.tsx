import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Avatar,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Trainer } from '../types';
import LevelStatusBox from './LevelStatusBox';
import { useRouter } from 'next/navigation';

interface TrainerAccordionProps {
  trainer: Trainer;
}

const TrainerAccordion: React.FC<TrainerAccordionProps> = ({ trainer }) => {
  const router = useRouter();

  return (
    <Accordion
      elevation={0}
      sx={{
        mb: 1.5,
        border: '1px solid #eee',
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#999' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={trainer.avatarUrl} sx={{ mr: 2, width: 40, height: 40, bgcolor: '#eee' }}>
            {trainer.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#1C2B4A', fontSize: '14px' }}>
              {trainer.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#999', fontSize: '11px' }}>
              Current Level: {trainer.currentLevel}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
        <Box sx={{ mb: 1 }}>
          {trainer.courses.map((course) => (
            <LevelStatusBox 
              key={course.id}
              name={course.name}
              status={course.status}
              progressText={`Progress: ${course.status === 'completed' ? '100%' : course.status === 'in-progress' ? '25%' : '0%'} Completed`}
            />
          ))}
        </Box>
        <Button
          fullWidth
          variant="contained"
          onClick={() => router.push(`/cfl/trainer/${trainer.id}`)}
          sx={{
            bgcolor: '#E6873C',
            color: '#fff',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '14px',
            py: 1,
            '&:hover': { bgcolor: '#d67a32' },
          }}
        >
          View Detailed Progress
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

export default TrainerAccordion;
