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
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import { Trainer } from '../types';
import LevelStatusBox from './LevelStatusBox';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared-lib';

interface TrainerAccordionProps {
  trainer: Trainer;
}

const TrainerAccordion: React.FC<TrainerAccordionProps> = ({ trainer }) => {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const { t } = useTranslation();

  return (
    <Accordion
      expanded={expanded}
      onChange={(event, isExpanded) => setExpanded(isExpanded)}
      elevation={0}
      sx={{
        mb: 1.5,
        border: '1px solid #999999',
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        overflow: 'hidden'
      }}
    >
      <AccordionSummary 
        expandIcon={expanded ? <UnfoldLessRoundedIcon sx={{ color: '#999' }} /> : <UnfoldMoreRoundedIcon sx={{ color: '#999' }} />}
        sx={{
          alignItems: 'flex-start',
          '& .MuiAccordionSummary-content': {
            my: 1.5,
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            mt: 1.75, // Pushes the icon down slightly to align perfectly with the trainer name
          },
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'none',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={trainer.avatarUrl || '/assets/images/material-symbols_account-circle (2).png'} sx={{ mr: 2, width: 40, height: 40, bgcolor: 'transparent' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#1A1A1A', fontSize: '12px',fontFamily:'Inter' }}>
              {trainer.name}
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '11px',fontFamily:'Inter' }}>
              {t("CFL_DASHBOARD.CURRENT_LEVEL")} : {trainer.currentLevel}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
        {/* Indent the list to align with the trainer's name (avatar is 40px + 16px margin) */}
        <Box sx={{ ml: '56px' }}>
          <Box sx={{ mb: 1 }}>
            {trainer.courses.map((course) => {
              let progressStr = '0%';
              if (course.status === 'completed') progressStr = '100%';
              else if (course.status === 'in-progress') progressStr = `${course.completionPercentage ?? 25}%`;

              return (
                <LevelStatusBox 
                  key={course.id}
                  name={course.name}
                  status={course.status}
                  progressText={t("CFL_DASHBOARD.PROGRESS_PERCENT_COMPLETED").replace("{{percent}}", progressStr.replace("%", ""))}
                />
              );
            })}
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              const encodedAvatar = encodeURIComponent(trainer.avatarUrl || '');
              if (trainer.designation === 'CFL Incharge') {
                router.push(`/cfl/incharge/${trainer.id}?name=${encodeURIComponent(trainer.name)}&avatarUrl=${encodedAvatar}`);
              } else {
                router.push(`/cfl/trainer/${trainer.id}?name=${encodeURIComponent(trainer.name)}&avatarUrl=${encodedAvatar}`);
              }
            }}
            sx={{
              bgcolor: '#E6873C',
              color: '#fff',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '10px',
              fontFamily:'Open Sans',
              py: 1,
              '&:hover': { bgcolor: '#d67a32' },
            }}
          >
            {t("CFL_DASHBOARD.VIEW_DETAILED_PROGRESS")}
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default TrainerAccordion;
