'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Modal, IconButton, Avatar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  fetchSwadhaarUserCourseDetail,
  type SwadhaarModuleProgress,
} from '@learner/utils/API/SwadhaarService';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const DONE_GREEN = '#16A34A';
const MUTED = '#9CA3AF';

interface Trainer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  courses?: any[];
}

interface TrainerProgressDetailModalProps {
  open: boolean;
  onClose: () => void;
  trainer: Trainer | null;
  course: any | null; // the course column clicked ({ id, name })
}

/** Readable label for an LMS lesson format (video, document, test, …). */
const formatLabel = (format?: string) => {
  if (!format) return '';
  const f = format.toLowerCase();
  if (f === 'test' || f === 'assessment' || f === 'quiz') return 'Quiz';
  return f.charAt(0).toUpperCase() + f.slice(1);
};

const percentColor = (perc: number) => (perc >= 100 ? DONE_GREEN : perc > 0 ? PRIMARY : MUTED);

const headCellSx = {
  fontWeight: 800, fontSize: 13, color: DARK_NAV,
  fontFamily: 'Inter, sans-serif',
  bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
  height: 50, py: '15px', px: '10px',
};

const greyCellSx = {
  bgcolor: '#F3F4F6', border: '1px solid #E0E0E0',
  fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#374151',
  py: '12px', px: '10px', verticalAlign: 'top',
};

const valueCellSx = {
  bgcolor: '#FFFFFF', border: '1px solid #E0E0E0',
  fontFamily: 'Inter, sans-serif', fontSize: 13,
  py: '12px', px: '10px',
};

/**
 * One trainer's progress in one course, module by module and lesson by lesson, from the Swadhaar LMS
 * (GET lms-service/v1/courses/:courseId/hierarchy/tracking/:trainerId?includeModules=true&includeLessons=true).
 */
const TrainerProgressDetailModal: React.FC<TrainerProgressDetailModalProps> = ({
  open, onClose, trainer, course
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [modules, setModules] = useState<SwadhaarModuleProgress[]>([]);

  useEffect(() => {
    if (!open || !trainer || !course) return;
    let cancelled = false;

    setLoading(true);
    setError(false);
    setModules([]);
    fetchSwadhaarUserCourseDetail(course.id, trainer.id)
      .then((data) => {
        if (!cancelled) setModules(data);
      })
      .catch((err) => {
        console.error('Error fetching trainer course progress:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, trainer, course]);

  if (!trainer || !course) return null;

  const coursePercent = Math.round(
    trainer.courses?.find((c: any) => c.id === course.id)?.completionPercentage ?? 0
  );

  return (
    <Modal open={open} onClose={onClose} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box
        sx={{
          width: '90%',
          maxWidth: 800,
          maxHeight: '85vh',
          bgcolor: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <Box sx={{ bgcolor: DARK_NAV, px: 3, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton onClick={onClose} sx={{ color: '#fff', p: 0.5, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
            {t('COMMON.CLOSE')}
          </IconButton>
        </Box>

        {/* Trainer and course */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #F0F0F0' }}>
          <Avatar
            src={trainer.avatarUrl || '/images/default.png'}
            sx={{ width: 48, height: 48, bgcolor: '#fff', border: '1px solid #ccc' }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: DARK_NAV, fontFamily: 'Inter, sans-serif' }}>
              {trainer.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
              {course.name} — Progress Detail
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: percentColor(coursePercent), fontFamily: 'Inter, sans-serif' }}>
            {coursePercent}%
          </Typography>
        </Box>

        {/* Modules → lessons */}
        <Box sx={{ overflowY: 'auto', flex: 1, p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : error || modules.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: MUTED, py: 6, fontFamily: 'Inter, sans-serif' }}>
              {error ? 'Could not load progress. Please try again.' : 'No progress data available.'}
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headCellSx}>Module</TableCell>
                    <TableCell sx={headCellSx}>Lesson / Content</TableCell>
                    <TableCell align="center" sx={{ ...headCellSx, width: 110 }}>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((module) => {
                    const rowCount = Math.max(module.lessons.length, 1);
                    const moduleCell = (
                      <TableCell rowSpan={rowCount} sx={greyCellSx}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: DARK_NAV, fontFamily: 'Inter, sans-serif' }}>
                          {module.name}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 12, mt: 0.5, color: percentColor(module.progress), fontFamily: 'Inter, sans-serif' }}>
                          {module.progress}% completed
                        </Typography>
                      </TableCell>
                    );

                    if (module.lessons.length === 0) {
                      return (
                        <TableRow key={module.moduleId}>
                          {moduleCell}
                          <TableCell sx={{ ...valueCellSx, color: MUTED }}>No lessons</TableCell>
                          <TableCell align="center" sx={valueCellSx}>—</TableCell>
                        </TableRow>
                      );
                    }

                    return module.lessons.map((lesson, idx) => (
                      <TableRow key={`${module.moduleId}-${lesson.lessonId}`}>
                        {idx === 0 && moduleCell}
                        <TableCell sx={valueCellSx}>
                          <Typography sx={{ fontSize: 13, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                            {lesson.name}
                          </Typography>
                          {lesson.format && (
                            <Typography sx={{ fontSize: 11, color: MUTED, fontFamily: 'Inter, sans-serif' }}>
                              {formatLabel(lesson.format)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={valueCellSx}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13, color: percentColor(lesson.progress) }}>
                            {lesson.progress}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default TrainerProgressDetailModal;
