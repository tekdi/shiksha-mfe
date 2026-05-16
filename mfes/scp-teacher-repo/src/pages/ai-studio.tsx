import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Header from '@/components/Header';
import AIStudioStepper from '@/components/ai-studio/AIStudioStepper';
import useAIStudioStore from '@/store/aiStudioStore';
import dynamic from 'next/dynamic';

// Dynamic imports for steps with SSR disabled to prevent hydration issues in MFE
const AssetUploadStep = dynamic(() => import('@/components/ai-studio/AssetUploadStep'), { ssr: false });
const QuizConfigPanel = dynamic(() => import('@/components/ai-studio/QuizConfigPanel'), { ssr: false });
const PipelineProgress = dynamic(() => import('@/components/ai-studio/PipelineProgress'), { ssr: false });
const ReviewEditor = dynamic(() => import('@/components/ai-studio/ReviewEditor'), { ssr: false });
const ExportPanel = dynamic(() => import('@/components/ai-studio/ExportPanel'), { ssr: false });

const AIStudioPage = () => {
  const theme = useTheme<any>();
  const { t } = useTranslation();
  const { currentStep, setStep } = useAIStudioStore();

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    } else {
      window.history.back();
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <AssetUploadStep />;
      case 1:
        return <QuizConfigPanel />;
      case 2:
        return <PipelineProgress />;
      case 3:
        return <ReviewEditor />;
      case 4:
        return <ExportPanel />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.warning['A400'] }}>
      <Header />
      
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h1" sx={{ m: 0 }}>
            AI Micro-Learning Studio
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <AIStudioStepper activeStep={currentStep} />
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, md: 4 }, 
            borderRadius: '16px', 
            border: `1px solid ${theme.palette.warning['900']}`,
            bgcolor: 'background.paper',
            minHeight: '400px'
          }}
        >
          {renderStepContent(currentStep)}
        </Paper>
      </Container>
    </Box>
  );
};

export async function getStaticProps({ locale }: any) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default AIStudioPage;
