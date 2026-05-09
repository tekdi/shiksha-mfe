import { keyframes } from '@mui/system';
import { styled } from '@mui/material/styles';
import { Box, Button, Paper, CircularProgress } from '@mui/material';

// Premium animations
export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(13, 92, 166, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(13, 92, 166, 0.6);
  }
`;

export const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Styled Components
export const PremiumPaper = styled(Paper)(({ theme }) => ({
  animation: `${fadeInUp} 0.6s ease-out`,
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
  },
}));

export const GlowButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.2)',
    transition: 'left 0.5s ease',
  },
  '&:hover:before': {
    left: '100%',
  },
  '&:disabled': {
    opacity: 0.6,
  },
}));

export const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
  animation: `${pulseGlow} 2s ease-in-out infinite`,
}));

export const SkeletonLoader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 2s infinite`,
  borderRadius: '8px',
}));

export const AnimatedSuccess = styled(Box)(({ theme }) => ({
  animation: `${fadeInUp} 0.5s ease-out`,
}));

export const StaggerContainer = styled(Box)(({ theme }) => ({
  '& > *': {
    animation: `${fadeInUp} 0.6s ease-out`,
    '&:nth-of-type(1)': { animationDelay: '0ms' },
    '&:nth-of-type(2)': { animationDelay: '100ms' },
    '&:nth-of-type(3)': { animationDelay: '200ms' },
    '&:nth-of-type(4)': { animationDelay: '300ms' },
    '&:nth-of-type(5)': { animationDelay: '400ms' },
  },
}));
