import React from 'react';
import { Box, Button, Typography, Checkbox, FormControlLabel, Grid, Card, CardActionArea, CardContent, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import QuizIcon from '@mui/icons-material/Quiz';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import useAIStudioStore from '../../store/aiStudioStore';

const AssetUploadStep = () => {
  const theme = useTheme<any>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const { selectedFile, setSelectedFile, selectedOutputTypes, toggleOutputType, setStep, selectedLanguage, setLanguage } = useAIStudioStore();

  const languageOptions = [
    { value: 'auto', label: 'Auto-detect', icon: '🌐' },
    { value: 'en', label: 'English', icon: '🇬🇧' },
    { value: 'hi', label: 'Hindi (Hinglish output)', icon: '🇮🇳' },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const outputOptions = [
    { type: 'key_takeaways', label: 'Key Takeaways', icon: <AssignmentIcon />, description: 'Summary of main concepts and learning points.' },
    { type: 'glossary', label: 'Glossary', icon: <MenuBookIcon />, description: 'Technical terms and definitions extracted from text.' },
    { type: 'quiz', label: 'Interactive Quiz', icon: <QuizIcon />, description: 'MCQs, Fill-in-the-blanks, and Match-the-pair.' },
    { type: 'lesson', label: 'Micro-Lesson', icon: <SlideshowIcon />, description: 'HTML5 slide deck with branding.' },
  ];

  const handleNext = () => {
    if (selectedFile && selectedOutputTypes.length > 0) {
      setStep(1);
    }
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom>
        1. Ingest Instructional Asset
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Upload a PDF or Video to begin the AI transformation pipeline.
      </Typography>

      <Box
        sx={{
          border: `2px dashed ${selectedFile ? theme.palette.primary.main : (isDragging ? theme.palette.primary.main : theme.palette.warning['900'])}`,
          borderRadius: '12px',
          p: 6,
          textAlign: 'center',
          mb: 4,
          bgcolor: (selectedFile || isDragging) ? theme.palette.primary.light + '20' : 'transparent',
          transition: 'all 0.2s',
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: theme.palette.primary.light + '10',
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          hidden
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()} // Prevent double trigger
          accept=".pdf,.mp4,.mov"
        />
        <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        {selectedFile ? (
          <Box>
            <Typography variant="h3">{selectedFile.name}</Typography>
            <Typography variant="body2">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h3">{isDragging ? 'Drop it here!' : 'Click to Upload or Drag & Drop'}</Typography>
            <Typography variant="body2">Supports PDF and MP4 (max 50MB)</Typography>
          </Box>
        )}
      </Box>

      {selectedFile && (selectedFile.type.includes('video') || selectedFile.name.endsWith('.mp4') || selectedFile.name.endsWith('.mov')) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            Transcription Language
          </Typography>
          <ToggleButtonGroup
            value={selectedLanguage}
            exclusive
            onChange={(_, value) => value && setLanguage(value)}
            aria-label="transcription language"
            sx={{ mb: 2 }}
          >
            {languageOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ px: 3 }}>
                <Box sx={{ mr: 1 }}>{option.icon}</Box>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedLanguage === 'hi' && (
              <Chip label="Powered by Whisper-Hindi2Hinglish-Swift" color="primary" size="small" />
            )}
            {selectedLanguage === 'en' && (
              <Chip label="Powered by OpenAI Whisper" variant="outlined" size="small" />
            )}
            {selectedLanguage === 'auto' && (
              <Chip label="Whisper Auto-detection active" variant="outlined" size="small" />
            )}
          </Box>
        </Box>
      )}

      <Typography variant="h2" sx={{ mb: 2 }}>
        2. Select Output Types
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 6 }}>
        {outputOptions.map((option) => (
          <Grid item xs={12} md={4} key={option.type}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%',
                borderColor: selectedOutputTypes.includes(option.type) ? theme.palette.primary.main : 'inherit',
                bgcolor: selectedOutputTypes.includes(option.type) ? theme.palette.primary.light + '08' : 'inherit',
                transition: 'all 0.2s'
              }}
            >
              <CardActionArea onClick={() => toggleOutputType(option.type)} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                    <Box sx={{ color: theme.palette.primary.main }}>{option.icon}</Box>
                    <Typography variant="h3" sx={{ m: 0 }}>{option.label}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {option.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          disabled={!selectedFile || selectedOutputTypes.length === 0}
          onClick={handleNext}
          sx={{ px: 6, borderRadius: '100px' }}
        >
          Proceed to Configuration
        </Button>
      </Box>
    </Box>
  );
};

export default AssetUploadStep;
