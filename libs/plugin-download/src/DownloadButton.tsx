import React from 'react';
import { Button, CircularProgress, ButtonProps, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import { useDownload } from './useDownload';

export interface DownloadButtonProps extends ButtonProps {
  contentId: string;
  url?: string;
  fileName?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  contentId, 
  url,
  fileName,
  onClick,
  ...props 
}) => {
  const { downloading, progress, completed, startDownload } = useDownload({ contentId, url, fileName });

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    startDownload();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleDownload}
      disabled={downloading}
      startIcon={
        completed ? <CheckIcon /> : downloading ? <CircularProgress size={20} variant="determinate" value={progress} color="inherit" /> : <DownloadIcon />
      }
      sx={{ 
        ...props.sx,
        minWidth: { xs: 'auto', sm: '64px' },
        px: { xs: 1, sm: 2 },
        '& .MuiButton-startIcon': {
          mr: { xs: 0, sm: 1 }
        }
      }}
      {...props}
    >
      <Typography
        component="span"
        variant="inherit"
        sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}
      >
        {completed ? 'Downloaded' : downloading ? `Downloading ${progress}%` : 'Download'}
      </Typography>
    </Button>
  );
};
