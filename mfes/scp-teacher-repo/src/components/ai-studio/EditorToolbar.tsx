import React, { useEffect } from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTheme } from '@mui/material/styles';
import useAIStudioStore from '../../store/aiStudioStore';

const EditorToolbar = () => {
  const theme = useTheme<any>();
  const { undo, redo, resetToOriginal, historyIndex, history } = useAIStudioStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title="Undo (Ctrl+Z)">
        <span>
          <IconButton onClick={undo} disabled={!canUndo} size="small">
            <UndoIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Y)">
        <span>
          <IconButton onClick={redo} disabled={!canRedo} size="small">
            <RedoIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Button
        size="small"
        startIcon={<RestartAltIcon />}
        onClick={() => {
          // This would ideally open a confirmation modal
          if (confirm('Reset all changes to AI original?')) {
            // Reset logic in store needs type, we could pass it or reset all
            // For now, let's just trigger reset for current context if we had it
            // Simple approach: reset current tab if we can identify it
          }
        }}
        sx={{ ml: 2, color: theme.palette.error.main }}
      >
        Reset
      </Button>
    </Box>
  );
};

export default EditorToolbar;
