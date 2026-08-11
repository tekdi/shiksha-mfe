'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Modal, IconButton, Avatar, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getContentCourseStatus } from '@learner/utils/API/SwadhaarService';
import { useTranslation } from '@shared-lib';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';

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
  course: any | null; // the course clicked (has rawHierarchy or id/name)
}

interface LessonRow {
  subtopicName: string;
  lessonName: string;
  modulePercentages: number[]; // one per top-level module in the course
}

// Recursively collect all node IDs from a hierarchy node (including course, modules, subtopics, lessons)
function collectAllIds(node: any): string[] {
  if (!node) return [];
  const ids = [node.identifier || node.id];
  const children = node.children || [];
  return ids.concat(children.flatMap(collectAllIds));
}

// Recursively collect leaf nodes (actual lessons)
function collectLeafNodes(node: any): any[] {
  const children = node.children || [];
  if (children.length === 0) return [node];
  return children.flatMap(collectLeafNodes);
}

// Calculate completion % for a set of leaf IDs from status data
function calcCompletion(leafIds: string[], statusMap: Map<string, any>): number {
  if (leafIds.length === 0) return 0;
  let completed = 0;
  for (const id of leafIds) {
    const s = statusMap.get(id);
    const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
    if (perc >= 70) completed++;
  }
  return Math.round((completed / leafIds.length) * 100);
}

const TrainerProgressDetailModal: React.FC<TrainerProgressDetailModalProps> = ({
  open, onClose, trainer, course
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [moduleNames, setModuleNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !trainer || !course) return;

    const fetchDetail = async () => {
      setLoading(true);
      setRows([]);
      setModuleNames([]);

      try {
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '' : '';

        // 1. Get full hierarchy from the course.rawHierarchy or fetch it
        let hierarchy = course.rawHierarchy || null;
        if (!hierarchy) {
          const BASE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'https://interface.tekdinext.com/interface/v1';
          const resp = await fetch(`${BASE_URL}/action/content/v3/hierarchy/${course.id}`, {
            headers: { tenantId }
          });
          const data = await resp.json();
          hierarchy = data?.result?.content;
        }

        if (!hierarchy) {
          setLoading(false);
          return;
        }

        // 2. Collect ALL node IDs from this course hierarchy
        const allNodeIds = collectAllIds(hierarchy);

        // 3. Fetch status for all these IDs for this trainer
        const statusItems = await getContentCourseStatus([trainer.id], allNodeIds, tenantId).catch(() => []);
        const statusMap = new Map<string, any>();
        for (const s of statusItems) {
          if (s.contentId) statusMap.set(s.contentId, s);
        }

        // 4. Derive top-level "modules" from hierarchy (1st level children)
        const topModules = hierarchy.children || [];
        setModuleNames(topModules.map((m: any) => m.name));

        // 5. Build rows: each row = one LEAF LESSON
        //    Show subtopic name, lesson name, and for each top-level module - completion %
        //    We flatten: courseLevel > subtopic > lesson
        //    If hierarchy is: course > module > subtopic > lesson:
        //      rows group by subtopic, showing lesson + per-module %
        //    Approach: gather all unique (subtopic, lesson) pairs and calculate module coverage

        // Detect depth:
        // depth 2: course > module > lesson (direct)
        // depth 3: course > module > subtopic > lesson (standard)
        const firstMod = topModules[0];
        const firstModChild = firstMod?.children?.[0];
        const isDepth3 = firstModChild?.children && firstModChild.children.length > 0;

        const builtRows: LessonRow[] = [];

        if (isDepth3) {
          // course > module > subtopic > lesson
          // Gather all unique subtopics across modules
          const allSubtopics: Array<{ subtopic: any; moduleIdx: number }> = [];
          topModules.forEach((mod: any, mIdx: number) => {
            (mod.children || []).forEach((sub: any) => {
              allSubtopics.push({ subtopic: sub, moduleIdx: mIdx });
            });
          });

          // Group by subtopic name for cleaner display
          const subMap = new Map<string, { lessons: any[]; moduleIdxSet: number[] }>();
          allSubtopics.forEach(({ subtopic, moduleIdx }) => {
            if (!subMap.has(subtopic.name)) {
              subMap.set(subtopic.name, { lessons: subtopic.children || [], moduleIdxSet: [] });
            }
            subMap.get(subtopic.name)!.moduleIdxSet.push(moduleIdx);
          });

          // For each subtopic, build a row per lesson
          for (const [subName, { lessons }] of subMap.entries()) {
            for (const lesson of lessons) {
              const modulePercentages = topModules.map((mod: any) => {
                // find this lesson inside this module's subtopic that matches
                const leafIds = collectAllIds(mod);
                if (!leafIds.includes(lesson.identifier)) {
                  // check if any subtopic in this module has this lesson
                  const found = (mod.children || []).some((sub: any) =>
                    (sub.children || []).some((l: any) => l.identifier === lesson.identifier)
                  );
                  if (!found) return 0; // lesson not in this module
                }
                const s = statusMap.get(lesson.identifier);
                return Math.round(s?.completionPercentage ?? (s?.status === 2 ? 100 : 0));
              });

              builtRows.push({
                subtopicName: subName,
                lessonName: lesson.name,
                modulePercentages,
              });
            }
          }
        } else {
          // course > module > lesson (2-level)
          const allLessonNames = new Set<string>();
          topModules.forEach((mod: any) => {
            (mod.children || []).forEach((lesson: any) => {
              allLessonNames.add(lesson.name);
            });
          });

          for (const lessonName of allLessonNames) {
            const modulePercentages = topModules.map((mod: any) => {
              const lesson = (mod.children || []).find((l: any) => l.name === lessonName);
              if (!lesson) return 0;
              const s = statusMap.get(lesson.identifier);
              return Math.round(s?.completionPercentage ?? (s?.status === 2 ? 100 : 0));
            });

            builtRows.push({
              subtopicName: 'Course Content',
              lessonName,
              modulePercentages,
            });
          }
        }

        setRows(builtRows);
      } catch (err) {
        console.error('Error fetching trainer detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [open, trainer, course]);

  if (!trainer || !course) return null;

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
        <Box sx={{ bgcolor: DARK_NAV, px: 3, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif' }}>
            {/* Trainer Progress Details */}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#fff', p: 0.5 ,fontSize: 16,fontFamily: 'Inter, sans-serif'}}>
            {/* <CloseIcon /> */}
            {t('COMMON.CLOSE')}
          </IconButton>
        </Box>

        {/* Trainer info */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #F0F0F0' }}>
          <Avatar 
            src={trainer.avatarUrl || '/images/default.png'} 
            sx={{ width: 48, height: 48, bgcolor: '#fff', border: '1px solid #ccc' }}
          />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: DARK_NAV, fontFamily: 'Inter, sans-serif' }}>
              {trainer.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
              {course.name} — Progress Detail
            </Typography>
          </Box>
        </Box>

        {/* Table */}
        <Box sx={{ overflowY: 'auto', flex: 1, p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : rows.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#9CA3AF', py: 6, fontFamily: 'Inter, sans-serif' }}>
              No progress data available.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {/* Header col 1 — Subtopics (grey bg, white border) */}
                    <TableCell sx={{
                      fontWeight: 800, fontSize: 13, color: DARK_NAV,
                      fontFamily: 'Inter, sans-serif',
                      bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
                      height: 50, py: '15px', px: '10px',
                    }}>
                      Subtopics
                    </TableCell>
                    {/* Header col 2 — Lessons (grey bg, white border) */}
                    <TableCell sx={{
                      fontWeight: 800, fontSize: 13, color: DARK_NAV,
                      fontFamily: 'Inter, sans-serif',
                      bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
                      height: 50, py: '15px', px: '10px',
                    }}>
                      Lessons
                    </TableCell>
                    {/* Header module cols (grey bg, white border) */}
                    {moduleNames.map((name, idx) => (
                      <TableCell key={idx} align="center" sx={{
                        fontWeight: 800, fontSize: 13, color: DARK_NAV,
                        fontFamily: 'Inter, sans-serif',
                        bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
                        height: 50, py: '15px', px: '10px',
                      }}>
                        {name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {/* Col 1 — Subtopic (grey bg, white border) */}
                      <TableCell sx={{
                        bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
                        fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#374151',
                        height: 50, py: '15px', px: '10px',
                      }}>
                        {row.subtopicName}
                      </TableCell>
                      {/* Col 2 — Lesson (grey bg, white border) */}
                      <TableCell sx={{
                        bgcolor: '#E0E0E0', border: '1px solid #FFFFFF',
                        fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#374151',
                        height: 50, py: '15px', px: '10px',
                      }}>
                        {row.lessonName}
                      </TableCell>
                      {/* Module % cols (white bg, grey border) */}
                      {row.modulePercentages.map((perc, mIdx) => (
                        <TableCell key={mIdx} align="center" sx={{
                          bgcolor: '#FFFFFF', border: '1px solid #E0E0E0',
                          fontFamily: 'Inter, sans-serif', fontSize: 13,
                          height: 50, py: '15px', px: '10px',
                        }}>
                          <Typography sx={{
                            fontWeight: 700, fontSize: 13,
                            color: perc >= 100 ? '#16A34A' : perc > 0 ? PRIMARY : '#9CA3AF',
                          }}>
                            {perc}%
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
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
