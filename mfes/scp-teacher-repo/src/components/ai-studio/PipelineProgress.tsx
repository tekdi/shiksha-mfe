import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  LinearProgress, 
  CircularProgress, 
  Chip, 
  Stack, 
  Alert, 
  Button,
  useTheme
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import SummarizeIcon from '@mui/icons-material/Summarize';
import QuizIcon from '@mui/icons-material/Quiz';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { keyframes } from '@emotion/react';

import useAIStudioStore from '../../store/aiStudioStore';
import { useSSE } from '../../hooks/useSSE';
import { 
  PipelineStage, 
  StageStatus, 
  SSE_EVENTS, 
  STAGE_LABELS, 
  PIPELINE_STAGES_ORDERED, 
  STAGE_WEIGHTS 
} from '../../types/sseTypes';
import { AIGatewayService } from '../../services/AIGatewayService';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const getStageIcon = (stage: PipelineStage) => {
  switch (stage) {
    case PipelineStage.UPLOAD: return <CloudUploadIcon />;
    case PipelineStage.TRANSCRIBE: return <MicIcon />;
    case PipelineStage.SUMMARISE: return <SummarizeIcon />;
    case PipelineStage.GENERATE_QUESTIONS: return <QuizIcon />;
    case PipelineStage.PACKAGE_H5P: return <FolderZipIcon />;
    default: return <CloudUploadIcon />;
  }
};

interface StageCardProps {
  stage: PipelineStage;
  state: any;
  theme: any;
}

const StageCard: React.FC<StageCardProps> = ({ stage, state, theme }) => {
  const labels = STAGE_LABELS[stage];
  const isPending = state.status === StageStatus.PENDING;
  const isInProgress = state.status === StageStatus.IN_PROGRESS;
  const isCompleted = state.status === StageStatus.COMPLETED;
  const isFailed = state.status === StageStatus.FAILED;

  return (
    <Card 
      variant="outlined"
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderRadius: '12px',
        borderColor: isInProgress ? theme.palette.primary.main : (isFailed ? theme.palette.error.main : 'inherit'),
        bgcolor: isInProgress ? theme.palette.primary.light + '08' : 'inherit',
        animation: isInProgress ? `${pulse} 2s infinite` : 'none',
        transition: 'all 0.3s ease',
        opacity: isPending ? 0.6 : 1
      }}
    >
      <Box sx={{ 
        p: 1.5, 
        borderRadius: '8px', 
        bgcolor: isCompleted ? theme.palette.success.light + '20' : (isInProgress ? theme.palette.primary.light + '20' : (isFailed ? theme.palette.error.light + '20' : theme.palette.grey[100])),
        color: isCompleted ? theme.palette.success.main : (isInProgress ? theme.palette.primary.main : (isFailed ? theme.palette.error.main : theme.palette.grey[500])),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {getStageIcon(stage)}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="h4" sx={{ m: 0, fontSize: '1rem', fontWeight: 600 }}>
            {labels.label}
          </Typography>
          <Box>
            {isCompleted && <CheckCircleIcon color="success" fontSize="small" />}
            {isFailed && <ErrorIcon color="error" fontSize="small" />}
            {isInProgress && <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>{state.progress}%</Typography>}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          {state.message || labels.description}
        </Typography>
        {isInProgress && (
          <LinearProgress 
            variant="determinate" 
            value={state.progress} 
            sx={{ mt: 1, height: 4, borderRadius: 2 }}
          />
        )}
      </Box>
    </Card>
  );
};

const PipelineProgress: React.FC = () => {
  const theme = useTheme<any>();
  const {
    pipelineJobId,
    pipelineStatus,
    pipelineStages,
    pipelineError,
    pipelineStartedAt,
    handleStageEvent,
    handleProgressEvent,
    handleCompleteEvent,
    handleErrorEvent,
    setStep,
    resetPipeline
  } = useAIStudioStore();

  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pipelineStatus === 'running' && pipelineStartedAt) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - pipelineStartedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pipelineStatus, pipelineStartedAt]);

  const sseUrl = pipelineJobId ? AIGatewayService.getPipelineStreamUrl(pipelineJobId) : null;

  useSSE(sseUrl, {
    eventHandlers: {
      [SSE_EVENTS.STAGE]: handleStageEvent,
      [SSE_EVENTS.PROGRESS]: handleProgressEvent,
      [SSE_EVENTS.COMPLETE]: (data) => {
        handleCompleteEvent(data);
        setTimeout(() => setStep(3), 1500); // Advance to Review
      },
      [SSE_EVENTS.ERROR]: handleErrorEvent,
    },
  });

  const overallProgress = Math.round(
    PIPELINE_STAGES_ORDERED.reduce((acc, stage) => {
      return acc + (pipelineStages[stage].progress * STAGE_WEIGHTS[stage]);
    }, 0)
  );

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box sx={{ flex: 1, mr: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {pipelineStatus === 'completed' ? 'Processing Complete' : (pipelineStatus === 'failed' ? 'Processing Failed' : 'AI Content Pipeline')}
            {pipelineStatus === 'running' && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ height: 10, borderRadius: 5, bgcolor: theme.palette.grey[200] }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
          {overallProgress}% • {elapsedTime}s
        </Typography>
      </Box>

      {pipelineError && (
        <Alert 
          severity="error" 
          sx={{ mb: 4, borderRadius: '12px' }}
          action={
            <Button color="inherit" size="small" onClick={() => setStep(1)}>
              Retry
            </Button>
          }
        >
          <strong>Error in {STAGE_LABELS[pipelineError.stage].label}:</strong> {pipelineError.message}
        </Alert>
      )}

      <Stack spacing={2}>
        {PIPELINE_STAGES_ORDERED.map((stage) => (
          <StageCard 
            key={stage} 
            stage={stage} 
            state={pipelineStages[stage]} 
            theme={theme} 
          />
        ))}
      </Stack>
    </Box>
  );
};

export default PipelineProgress;
