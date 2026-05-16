import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  Typography, 
  Radio, 
  FormControlLabel, 
  Button, 
  TextField, 
  Stack,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface H5PPreviewProps {
  contentJson: any; // Simplified H5P-like object
  open: boolean;
  onClose: () => void;
}

const H5PPreview: React.FC<H5PPreviewProps> = ({ contentJson, open, onClose }) => {
  const renderMCQ = (question: any) => (
    <Box sx={{ mb: 4, p: 3, border: '1px solid #eee', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>{question.question}</Typography>
      <Stack spacing={1}>
        {question.answers.map((ans: any, idx: number) => (
          <FormControlLabel
            key={idx}
            control={<Radio />}
            label={ans.text}
          />
        ))}
      </Stack>
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Check</Button>
    </Box>
  );

  const renderFITB = (question: any) => {
    // Basic parser for "The *answer* is here."
    const parts = question.sentence.split(/(\*[^*]+\*)/);
    return (
      <Box sx={{ mb: 4, p: 3, border: '1px solid #eee', borderRadius: '8px' }}>
        <Typography variant="body1" sx={{ lineHeight: 2.5 }}>
          {parts.map((part: string, i: number) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <TextField 
                  key={i} 
                  size="small" 
                  variant="standard" 
                  sx={{ width: 100, mx: 1, '& input': { textAlign: 'center' } }} 
                  placeholder="..." 
                />
              );
            }
            return part;
          })}
        </Typography>
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>Check</Button>
      </Box>
    );
  };

  const renderMatch = (question: any) => (
    <Box sx={{ mb: 4, p: 3, border: '1px solid #eee', borderRadius: '8px' }}>
      <Typography variant="h6" gutterBottom>{question.instruction}</Typography>
      <Box sx={{ display: 'flex', gap: 4 }}>
        <Stack spacing={2} sx={{ flex: 1 }}>
          {question.pairs.map((p: any, i: number) => (
            <Paper key={i} sx={{ p: 2, bgcolor: '#f5f5f5', textAlign: 'center' }}>{p.left}</Paper>
          ))}
        </Stack>
        <Stack spacing={2} sx={{ flex: 1 }}>
          {question.pairs.map((p: any, i: number) => (
            <Paper key={i} sx={{ p: 2, border: '2px dashed #ccc', textAlign: 'center', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Drop here
            </Paper>
          ))}
        </Stack>
      </Box>
      <Button variant="contained" color="primary" sx={{ mt: 2 }}>Check</Button>
    </Box>
  );

  const renderContent = () => {
    if (!contentJson || !contentJson.questions) return null;

    return contentJson.questions.map((q: any, index: number) => {
      if (q.answers) return renderMCQ(q);
      if (q.blanks) return renderFITB(q);
      if (q.pairs) return renderMatch(q);
      return null;
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: { borderRadius: '16px', overflow: 'hidden' }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>H5P Interactive Preview</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, bgcolor: '#fff' }}>
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '12px', minHeight: 400, bgcolor: '#fafafa' }}>
          {renderContent()}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          This is a simulated preview of the interactive H5P content.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default H5PPreview;
