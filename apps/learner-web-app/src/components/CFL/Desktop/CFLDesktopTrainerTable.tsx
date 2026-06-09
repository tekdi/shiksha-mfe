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
  dynamicCourses?: any[];
}

const CFLDesktopTrainerTable: React.FC<CFLDesktopTrainerTableProps> = ({ trainers, dynamicCourses = [] }) => {
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
            <TableCell align="left" sx={{ fontWeight: 800, color: '#374151', py: 2.5, pl: 4 }}>Trainers</TableCell>
            {dynamicCourses.map((course: any) => (
              <TableCell key={course.id} align="center" sx={{ fontWeight: 800, color: '#374151' }}>
                {course.name}
              </TableCell>
            ))}
            <TableCell align="center" sx={{ fontWeight: 800, color: '#374151' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trainers.map((trainer) => (
            <TableRow 
              key={trainer.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F9FAFB' } }}
            >
              <TableCell align="left" sx={{ pl: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
                  <Avatar 
                    src={trainer.avatarUrl || undefined}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: '#1C2B4A', 
                      color: '#fff',
                      border: `2px solid ${PRIMARY}`,
                      fontSize: 14,
                      fontWeight: 700
                    }}
                  >
                    {trainer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#4B5563' }}>
                      {trainer.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#6B7280', fontWeight: 500, mt: 0.5 }}>
                      Current Level: {trainer.currentLevel}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              {dynamicCourses.map((dynamicCourse: any) => {
                const courseData = trainer.courses?.find((c: any) => c.id === dynamicCourse.id);
                return (
                  <TableCell key={dynamicCourse.id} align="center">
                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111' }}>
                      {Math.round(courseData?.completionPercentage || 0)}%
                    </Typography>
                  </TableCell>
                );
              })}
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
