'use client';

import React from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Avatar 
} from '@mui/material';
import CFLDesktopSendAlertDialog from './CFLDesktopSendAlertDialog';

const PRIMARY = '#E6873C';

interface Trainer {
  id: string;
  name: string;
  progress: number;
  currentLevel?: string;
  avatarUrl?: string;
  beginnerProgress?: number;
  intermediateProgress?: number;
  advanceProgress?: number;
  newContentProgress?: number;
}

interface CFLDesktopTrainerTableProps {
  trainers: Trainer[];
}

const CFLDesktopTrainerTable: React.FC<CFLDesktopTrainerTableProps> = ({ trainers }) => {
  const [selectedTrainerAlert, setSelectedTrainerAlert] = React.useState<Trainer | null>(null);

  return (
    <>
      <TableContainer 
      component={Paper} 
      elevation={0} 
      sx={{ 
        border: '1px solid #E5E7EB', 
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <Table sx={{ minWidth: 800 }} aria-label="trainer progress table">
        <TableHead>
          <TableRow sx={{ bgcolor: '#fff' }}>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151', py: 2.5 }}>Trainers</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Current Level</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>New Content %</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Beginner Progress</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Intermediate Progress</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Advance Progress</TableCell>
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trainers.map((trainer) => (
            <TableRow 
              key={trainer.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F9FAFB' } }}
            >
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                  <Avatar 
                    src={trainer.avatarUrl || undefined}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: '#1C2B4A', 
                      color: '#fff',
                      border: `2px solid ${PRIMARY}`,
                      fontSize: 14
                    }}
                  >
                    {trainer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#4B5563' }}>
                    {trainer.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
                  {trainer.currentLevel}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                  {Math.round(trainer.newContentProgress || 100)}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                  {Math.round(trainer.beginnerProgress || 0)}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                  {Math.round(trainer.intermediateProgress || 0)}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                  {Math.round(trainer.advanceProgress || 0)}%
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setSelectedTrainerAlert(trainer)}
                  sx={{
                    bgcolor: PRIMARY,
                    color: '#fff',
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    px: 2,
                    '&:hover': { bgcolor: '#d67a32' }
                  }}
                >
                  Send Alert
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <CFLDesktopSendAlertDialog 
      open={!!selectedTrainerAlert}
      onClose={() => setSelectedTrainerAlert(null)}
      trainer={selectedTrainerAlert}
    />
    </>
  );
};

export default CFLDesktopTrainerTable;
