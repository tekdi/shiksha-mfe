import React from 'react';
import { Box, Card, CardContent, TextField, IconButton, Typography, Radio, RadioGroup, FormControlLabel, Stack, Button, Divider, Skeleton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { MCQQuestion, MCQAnswer } from '../../../utils/AIContentTypes';
import SourceEvidenceChip from './SourceEvidenceChip';

interface MCQQuestionCardProps {
  question: MCQQuestion;
  onUpdate: (q: MCQQuestion) => void;
  onDelete: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const MCQQuestionCard: React.FC<MCQQuestionCardProps> = ({ 
  question, 
  onUpdate, 
  onDelete,
  onRegenerate,
  isRegenerating 
}) => {
  const handleQuestionChange = (val: string) => {
    onUpdate({ ...question, question: val });
  };

  const handleAnswerChange = (index: number, field: keyof MCQAnswer, val: any) => {
    const newAnswers = question.answers.map((a, i) => 
      i === index ? { ...a, [field]: val } : a
    );
    onUpdate({ ...question, answers: newAnswers });
  };

  const handleSetCorrect = (index: number) => {
    const newAnswers = question.answers.map((a, i) => ({
      ...a,
      correct: i === index
    }));
    onUpdate({ ...question, answers: newAnswers });
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: '#fff', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
      {isRegenerating && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, bgcolor: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', p: 4, gap: 2 }}>
          <Skeleton variant="text" width="60%" height={40} animation="wave" />
          <Skeleton variant="rectangular" width="100%" height={120} animation="wave" sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="100%" height={60} animation="wave" sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="100%" height={60} animation="wave" sx={{ borderRadius: '8px' }} />
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h3" sx={{ m: 0 }}>Multiple Choice Question</Typography>
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
          multiline
          label="Question Stem"
          value={question.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          sx={{ mb: 4 }}
        />

        <Stack spacing={2}>
          {question.answers.map((answer, index) => (
            <Box key={index} sx={{ p: 2, border: '1px solid #eee', borderRadius: '8px', bgcolor: answer.correct ? '#E8F5E9' : 'transparent' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Radio
                  checked={answer.correct}
                  onChange={() => handleSetCorrect(index)}
                  color="success"
                />
                <TextField
                  fullWidth
                  size="small"
                  label={`Option ${index + 1}`}
                  value={answer.text}
                  onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                />
              </Box>
              <TextField
                fullWidth
                size="small"
                variant="standard"
                label="Feedback for this option"
                value={answer.feedback}
                onChange={(e) => handleAnswerChange(index, 'feedback', e.target.value)}
                sx={{ ml: 6, width: 'calc(100% - 48px)' }}
              />
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />
        
        <TextField
          fullWidth
          label="Explanation (Optional)"
          value={question.explanation}
          onChange={(e) => onUpdate({ ...question, explanation: e.target.value })}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mt: 2 }}>
          <SourceEvidenceChip evidence={question.evidence} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MCQQuestionCard;
