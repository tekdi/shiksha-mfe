import React, { useState } from 'react';
import { Box, Chip, Collapse, Typography, Badge, Paper } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';

interface SourceEvidenceChipProps {
  evidence?: { quote: string; pageRef?: string };
}

const SourceEvidenceChip: React.FC<SourceEvidenceChipProps> = ({ evidence }) => {
  const [expanded, setExpanded] = useState(false);

  if (!evidence) {
    return (
      <Chip 
        icon={<ArticleIcon />} 
        label="No Source Evidence" 
        size="small" 
        variant="outlined" 
        sx={{ color: 'text.disabled', borderColor: 'divider' }} 
      />
    );
  }

  return (
    <Box>
      <Chip
        icon={<ArticleIcon />}
        label="📄 Source"
        onClick={() => setExpanded(!expanded)}
        size="small"
        variant="outlined"
        color={evidence.quote ? "success" : "default"}
        sx={{ 
          cursor: 'pointer',
          '&:hover': { bgcolor: 'success.light', color: 'success.contrastText' }
        }}
      />
      
      <Collapse in={expanded}>
        <Paper 
          elevation={0}
          sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: '#FFFDE7', // Light yellow background
            borderLeft: '4px solid #FBC02D',
            borderRadius: '4px',
            position: 'relative'
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', pr: 4 }}>
            "{evidence.quote}"
          </Typography>
          {evidence.pageRef && (
            <Badge 
              badgeContent={evidence.pageRef} 
              color="primary" 
              sx={{ 
                position: 'absolute', 
                top: 16, 
                right: 24,
                '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 }
              }} 
            />
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default SourceEvidenceChip;
