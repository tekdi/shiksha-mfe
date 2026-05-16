import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { useTheme } from '@mui/material/styles';

const steps = ['Upload', 'Configure', 'Processing', 'Review', 'Export'];

interface AIStudioStepperProps {
  activeStep: number;
}

export default function AIStudioStepper({ activeStep }: AIStudioStepperProps) {
  const theme = useTheme<any>();

  const CustomStepIcon = (props: any) => {
    const { active, completed } = props;

    if (completed) {
      return <CheckCircleIcon sx={{ color: theme.palette.primary.main }} />;
    } else if (active) {
      return (
        <RadioButtonCheckedIcon sx={{ color: theme.palette.primary.main }} />
      );
    } else {
      return <RadioButtonUncheckedIcon />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<StepConnector />}
        sx={{
          justifyContent: 'space-between',
          '& .MuiStepLabel-alternativeLabel': {
            marginTop: '2px !important',
          },
          '& .MuiStep-root': {
            flex: '1',
            padding: 0,
          },
          '& .MuiStepConnector-root': {
            top: '16px',
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={index} completed={index < activeStep}>
            <StepLabel
              StepIconComponent={CustomStepIcon}
              sx={{
                '& .MuiStepLabel-label': {
                  marginBottom: '3px',
                  alignSelf: 'center',
                  fontSize: '11px',
                  fontWeight: index === activeStep ? 600 : 400,
                  color: index === activeStep ? theme.palette.primary.main : 'inherit',
                },
                '& .MuiStepLabel-iconContainer': {
                  alignItems: 'center',
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
