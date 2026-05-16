import React, { useLayoutEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CodeIcon from '@mui/icons-material/Code';
import { typeset } from '../../../utils/mathjaxRenderer';

interface LatexRendererProps {
  latex: string;
  inline?: boolean;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ latex, inline = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);

  useLayoutEffect(() => {
    if (showPreview && containerRef.current && latex) {
      typeset(containerRef.current);
    }
  }, [latex, showPreview]);

  if (!latex) return null;

  return (
    <Box sx={{ position: 'relative', display: inline ? 'inline-block' : 'block' }}>
      <Box sx={{ position: 'absolute', right: 0, top: -20, zIndex: 10 }}>
        <Tooltip title={showPreview ? "Show Source" : "Show Preview"}>
          <IconButton size="small" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <CodeIcon fontSize="inherit" /> : <VisibilityIcon fontSize="inherit" />}
          </IconButton>
        </Tooltip>
      </Box>

      {showPreview ? (
        <Box 
          ref={containerRef} 
          sx={{ 
            p: 1, 
            bgcolor: '#fcfcfc', 
            borderRadius: '4px', 
            border: '1px solid #f0f0f0',
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: inline ? 'flex-start' : 'center'
          }}
        >
          {inline ? `$${latex}$` : `\\[ ${latex} \\]`}
        </Box>
      ) : (
        <Typography 
          variant="caption" 
          sx={{ 
            fontFamily: 'monospace', 
            bgcolor: '#eee', 
            px: 1, 
            borderRadius: '4px',
            display: 'block',
            whiteSpace: 'pre-wrap'
          }}
        >
          {latex}
        </Typography>
      )}
    </Box>
  );
};

export default LatexRenderer;
