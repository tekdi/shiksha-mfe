import React from 'react';
import { Box, Card, CardContent, TextField, IconButton, Typography, Stack, Divider, Chip, Skeleton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { FITBQuestion } from '../../../utils/AIContentTypes';
import SourceEvidenceChip from './SourceEvidenceChip';

interface FITBQuestionCardProps {
  question: FITBQuestion;
  onUpdate: (q: FITBQuestion) => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const FITBQuestionCard: React.FC<FITBQuestionCardProps> = ({ 
  question, 
  onUpdate, 
  onDelete,
  onRegenerate,
  isRegenerating 
}) => {
  const handleSentenceChange = (val: string) => {
    // In a real app, we'd parse the sentence to update the blanks array
    onUpdate({ ...question, sentence: val });
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: '#fff', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
      {isRegenerating && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', p: 4, gap: 2 }}>
          <Skeleton variant="text" width="50%" height={40} animation="wave" />
          <Skeleton variant="rectangular" width="100%" height={100} animation="wave" sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="100%" height={80} animation="wave" sx={{ borderRadius: '8px' }} />
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h3" sx={{ m: 0 }}>Fill in the Blanks</Typography>
          <Box>
            {onRegenerate && (
              <IconButton onClick={onRegenerate} color="primary" size="small" sx={{ mr: 1 }}>
                <AutorenewIcon />
              </IconButton>
            )}
            <IconButton onClick={onDelete} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enclose words in asterisks to create blanks (e.g., *chlorophyll*).
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Sentence with Blanks"
          value={question.sentence}
          onChange={(e) => handleSentenceChange(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Typography variant="h4" gutterBottom>Blank Configuration</Typography>
        <Stack spacing={2}>
          {question.blanks.map((blank, index) => (
            <Box key={index} sx={{ p: 2, border: '1px solid #eee', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Primary Answer"
                  value={blank.answer}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label="Tip (Optional)"
                  value={blank.tip}
                  onChange={(e) => {
                    const newBlanks = [...question.blanks];
                    newBlanks[index].tip = e.target.value;
                    onUpdate({ ...question, blanks: newBlanks });
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Alternatives (comma separated):
              </Typography>
              <TextField
                fullWidth
                size="small"
                variant="standard"
                value={blank.alternatives.join(', ')}
                onChange={(e) => {
                  const newBlanks = [...question.blanks];
                  newBlanks[index].alternatives = e.target.value.split(',').map(s => s.trim());
                  onUpdate({ ...question, blanks: newBlanks });
                }}
              />
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 3 }}>
          <SourceEvidenceChip evidence={question.evidence} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default FITBQuestionCard;
