import React from 'react';
import { Box, Card, CardContent, TextField, IconButton, Typography, Stack, Grid, Button, Skeleton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { MatchQuestion, MatchPair } from '../../../utils/AIContentTypes';
import SourceEvidenceChip from './SourceEvidenceChip';

interface MatchPairCardProps {
  question: MatchQuestion;
  onUpdate: (q: MatchQuestion) => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const MatchPairCard: React.FC<MatchPairCardProps> = ({ 
  question, 
  onUpdate, 
  onDelete,
  onRegenerate,
  isRegenerating 
}) => {
  const handleUpdatePair = (index: number, field: keyof MatchPair, val: string) => {
    const newPairs = question.pairs.map((p, i) => 
      i === index ? { ...p, [field]: val } : p
    );
    onUpdate({ ...question, pairs: newPairs });
  };

  const handleAddPair = () => {
    onUpdate({ ...question, pairs: [...question.pairs, { left: '', right: '' }] });
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: '#fff', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
      {isRegenerating && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', p: 4, gap: 2 }}>
          <Skeleton variant="text" width="40%" height={40} animation="wave" />
          <Skeleton variant="rectangular" width="100%" height={80} animation="wave" sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="100%" height={150} animation="wave" sx={{ borderRadius: '8px' }} />
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h3" sx={{ m: 0 }}>Match the Pair</Typography>
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

        <TextField
          fullWidth
          label="Instructions"
          value={question.instruction}
          onChange={(e) => onUpdate({ ...question, instruction: e.target.value })}
          sx={{ mb: 4 }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={5}><Typography variant="subtitle2">Left Item</Typography></Grid>
          <Grid item xs={5}><Typography variant="subtitle2">Right (Matching) Item</Typography></Grid>
          <Grid item xs={2}></Grid>
        </Grid>

        <Stack spacing={1}>
          {question.pairs.map((pair, index) => (
            <Grid container spacing={2} key={index} alignItems="center">
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  value={pair.left}
                  onChange={(e) => handleUpdatePair(index, 'left', e.target.value)}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  size="small"
                  value={pair.right}
                  onChange={(e) => handleUpdatePair(index, 'right', e.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton 
                  size="small" 
                  onClick={() => {
                    const newPairs = question.pairs.filter((_, i) => i !== index);
                    onUpdate({ ...question, pairs: newPairs });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </Stack>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddPair}
          sx={{ mt: 2 }}
        >
          Add Pair
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h4" gutterBottom>Distractors (Optional)</Typography>
        <TextField
          fullWidth
          size="small"
          label="Distractor Items (comma separated)"
          value={question.distractors.join(', ')}
          onChange={(e) => onUpdate({ ...question, distractors: e.target.value.split(',').map(s => s.trim()) })}
        />

        <Box sx={{ mt: 3 }}>
          <SourceEvidenceChip evidence={question.evidence} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MatchPairCard;
