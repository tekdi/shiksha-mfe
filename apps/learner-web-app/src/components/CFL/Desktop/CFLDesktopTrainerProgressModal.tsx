'use client';

import React from 'react';
import { Box, Typography, Modal, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

interface CFLDesktopTrainerProgressModalProps {
  open: boolean;
  onClose: () => void;
  trainer: {
    name: string;
    avatarUrl?: string;
  } | null;
  courseName: string;
}

const mockData = [
  { subtopic: 'Subtopic 1', lesson: 'Lesson 1', m1: '100%', m2: '100%', m3: '0%', m4: '0%' },
  { subtopic: 'Subtopic 1', lesson: 'Lesson 2', m1: '100%', m2: '100%', m3: '0%', m4: '0%' },
  { subtopic: 'Subtopic 1', lesson: 'Lesson 3', m1: '100%', m2: '75%', m3: '0%', m4: '0%' },
  { subtopic: 'Subtopic 1', lesson: 'Lesson 4', m1: '100%', m2: '0%', m3: '0%', m4: '0%' },
];

const CFLDesktopTrainerProgressModal: React.FC<CFLDesktopTrainerProgressModalProps> = ({ open, onClose, trainer, courseName }) => {
  if (!trainer) return null;

  return (
    <Modal
      open={open}
      // Removing onClose here prevents closing by clicking outside or pressing Escape
      // if we only want it to close via the Close button, as requested.
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '700px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
        }}
      >
        {/* Modal Header */}
        <Box sx={{ bgcolor: DARK_NAV, px: 3, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography 
            onClick={onClose}
            sx={{ 
              color: '#fff', 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
          >
            Close
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {/* Trainer Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar 
              src={trainer.avatarUrl} 
              sx={{ width: 48, height: 48, bgcolor: PRIMARY, border: `2px solid ${PRIMARY}44` }}
            >
              {trainer.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                {trainer.name}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                {courseName} Progress
              </Typography>
            </Box>
          </Box>

          {/* Progress Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '8px' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F3F4F6' }}>
                  <TableCell sx={{ bgcolor: '#E0E0E0', fontWeight: 700, color: '#374151', fontSize: 13, py: 2 ,border:'1px solid #FFFFFF'}}>Subtopics</TableCell>
                  <TableCell sx={{ bgcolor: '#E0E0E0', fontWeight: 700, color: '#374151', fontSize: 13, py: 2,border:'1px solid #FFFFFF' }}>Lessons</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#374151', fontSize: 13, py: 2 }}>Module 1</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#374151', fontSize: 13, py: 2 }}>Module 2</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#374151', fontSize: 13, py: 2 }}>Module 3</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#374151', fontSize: 13, py: 2 }}>Module 4</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockData.map((row, idx) => (
                  <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ bgcolor: '#E0E0E0', color: '#4B5563', fontSize: 13, py: 1.5,border:'1px solid #FFFFFF' }}>{row.subtopic}</TableCell>
                    <TableCell sx={{ bgcolor: '#E0E0E0', color: '#4B5563', fontSize: 13, py: 1.5,border:'1px solid #FFFFFF' }}>{row.lesson}</TableCell>
                    <TableCell align="center" sx={{ color: '#111827', fontSize: 13, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>{row.m1}</TableCell>
                    <TableCell align="center" sx={{ color: '#111827', fontSize: 13, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>{row.m2}</TableCell>
                    <TableCell align="center" sx={{ color: '#111827', fontSize: 13, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>{row.m3}</TableCell>
                    <TableCell align="center" sx={{ color: '#111827', fontSize: 13, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>{row.m4}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Modal>
  );
};

export default CFLDesktopTrainerProgressModal;
