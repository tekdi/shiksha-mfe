'use client';

import React from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent,
} from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface SwadhaarQuizFailModalProps {
  open: boolean;
  onOkay: () => void;
}

const SwadhaarQuizFailModal: React.FC<SwadhaarQuizFailModalProps> = ({ open, onOkay }) => {
  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      <DialogContent sx={{ p: 0, bgcolor: '#fff' }}>
        {/* Header Bar */}
        <Box sx={{ bgcolor: DARK_NAV, px: 2, py: 1.5 }}>
          <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 0.3 }}>
            Quiz Result
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Icon + Message */}
          <Box sx={{
            bgcolor: '#FFF7ED', borderRadius: '16px', py: 4, px: 2,
            display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3,
          }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%', bgcolor: '#FED7AA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 2, boxShadow: '0 6px 20px rgba(230,135,60,0.25)',
            }}>
              <Box sx={{
                width: 60, height: 60, borderRadius: '50%', bgcolor: PRIMARY,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ErrorOutlineRoundedIcon sx={{ color: '#fff', fontSize: 34 }} />
              </Box>
            </Box>

            <Typography sx={{ fontSize: 22, fontWeight: 900, color: PRIMARY, mb: 1 }}>
              Good attempt! 🎯
            </Typography>
            <Typography sx={{
              fontSize: 14, color: '#4B5563', fontWeight: 500,
              textAlign: 'center', lineHeight: 1.6,
            }}>
              Your score is below <strong>70%</strong>, so you need to revise the course from the beginning.
            </Typography>
          </Box>

          {/* Tip Box */}
          <Box sx={{
            bgcolor: '#F0F4FF', borderRadius: '12px', px: 2, py: 1.5, mb: 3,
            border: '1px solid #C7D7FF',
          }}>
            <Typography sx={{ fontSize: 12, color: '#3B4FA0', fontWeight: 600, lineHeight: 1.5 }}>
              💡 <strong>Tip:</strong> Review all the lessons carefully before attempting the quiz again. You need at least 70% to pass.
            </Typography>
          </Box>

          {/* Okay Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={onOkay}
            sx={{
              bgcolor: PRIMARY, color: '#fff', borderRadius: '12px',
              fontWeight: 800, textTransform: 'none', py: 1.6, fontSize: 15,
              boxShadow: '0 4px 14px rgba(230,135,60,0.35)',
              '&:hover': { bgcolor: '#D1752D', boxShadow: 'none' },
            }}
          >
            Okay, Let me revise
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SwadhaarQuizFailModal;
