'use client';

import React from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar
} from '@mui/material';
import CFLDesktopSendAlertDialog from './CFLDesktopSendAlertDialog';
import { useTranslation } from '@shared-lib';

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
  designation?: string;
  courses?: any[];
}

interface CFLDesktopTrainerTableProps {
  trainers: Trainer[];
  dynamicCourses?: any[];
  userRole?: string;
}

// ── Clickable % chip that lazy-loads and opens TrainerProgressDetailModal ──
const ClickablePercent: React.FC<{ percent: number; trainer: any; course: any }> = ({ percent, trainer, course }) => {
  const [open, setOpen] = React.useState(false);
  const [ModalComp, setModalComp] = React.useState<React.ComponentType<any> | null>(null);

  const handleClick = async () => {
    if (!ModalComp) {
      const mod = await import('./TrainerProgressDetailModal');
      setModalComp(() => mod.default);
    }
    setOpen(true);
  };

  return (
    <>
      <Typography
        onClick={handleClick}
        sx={{
          fontWeight: 700,
          fontSize: 12,
          fontStyle: 'bold',
          // color: PRIMARY,
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationStyle: 'solid',
          textUnderlineOffset: '3px',
          display: 'inline-block',
          fontFamily: 'Open Sans'
          // '&:hover': { color: '#d67a32' },
        }}
      >
        {percent}%
      </Typography>
      {ModalComp && (
        <ModalComp
          open={open}
          onClose={() => setOpen(false)}
          trainer={trainer}
          course={course}
        />
      )}
    </>
  );
};

const CFLDesktopTrainerTable: React.FC<CFLDesktopTrainerTableProps> = ({ trainers, dynamicCourses = [], userRole }) => {
  const { t } = useTranslation();
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
              <TableCell align="left" sx={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', py: 2.5, pl: 4, border: '1px solid #E0E0E0', fontFamily: 'Open Sans', fontStyle: 'bold' }}>
                {(userRole === 'ARM') ? t("CFL_DASHBOARD.CFL_INCHARGES_COLUMN") : t("CFL_DASHBOARD.TRAINERS_TABLE_HEADER")}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', border: '1px solid #E0E0E0', fontFamily: 'Open Sans', fontStyle: 'bold' }}>
                {t("CFL_DASHBOARD.CURRENT_LEVEL")}
              </TableCell>
              {dynamicCourses.map((course: any) => (
                <TableCell key={course.id} align="center" sx={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', border: '1px solid #E0E0E0', fontFamily: 'Open Sans', fontStyle: 'bold' }}>
                  {course.name}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A', border: '1px solid #E0E0E0', fontFamily: 'Open Sans', fontStyle: 'bold' }}>{t("CFL_DASHBOARD.ACTIONS")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow
                key={trainer.id}
                sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}
              >
                <TableCell align="left" sx={{ pl: 4, border: '1px solid #E0E0E0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
                    <Avatar
                      src={trainer.avatarUrl || '/images/default.png'}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: '#fff',
                        border: `1px solid #ccc`,
                      }}
                    />
                    <Typography sx={{ fontWeight: 400, fontSize: 12, color: '#1A1A1A', fontFamily: 'Open Sans' }}>
                      {trainer.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ border: '1px solid #E0E0E0' }}>
                  <Typography sx={{ fontWeight: 400, fontSize: 12, color: '#1A1A1A', fontFamily: 'Open Sans' }}>
                    {trainer.currentLevel || '-'}
                  </Typography>
                </TableCell>
                {dynamicCourses.map((dynamicCourse: any) => {
                  const courseData = trainer.courses?.find((c: any) => c.id === dynamicCourse.id);
                  return (
                    <TableCell key={dynamicCourse.id} align="center" sx={{ border: '1px solid #E0E0E0' }}>
                      <ClickablePercent
                        percent={Math.round(courseData?.completionPercentage || 0)}
                        trainer={trainer}
                        course={dynamicCourse}
                      />
                    </TableCell>
                  );
                })}
                <TableCell align="center" sx={{ border: '1px solid #E0E0E0' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setSelectedTrainerAlert(trainer)}
                    sx={{
                      bgcolor: PRIMARY,
                      color: '#ffffff',
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontFamily: 'Open Sans',
                      fontSize: '10px',
                      px: 2,
                      '&:hover': { bgcolor: '#E6873C' }
                    }}
                  >
                    {t("CFL_DASHBOARD.SEND_ALERT")}
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
