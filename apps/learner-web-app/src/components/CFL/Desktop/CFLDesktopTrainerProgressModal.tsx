'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Modal, Avatar, CircularProgress, Collapse } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockIcon from '@mui/icons-material/Lock';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  fetchSwadhaarLevelCourses,
  getContentCourseStatus,
} from '@learner/utils/API/SwadhaarService';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';
const DARK_NAV = '#1C2B4A';

interface CFLDesktopTrainerProgressModalProps {
  open: boolean;
  onClose: () => void;
  trainer: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  courseName: string;
}

/**
 * Recursive lesson count calculation (same as swadhaar-home).
 */
const calculateNodeLessons = (node: any, statusList: any[]): { total: number; completed: number } => {
  const id = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusList.find((d: any) => d.contentId === id);
    const perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
    return { total: 1, completed: perc / 100 };
  }
  let total = 0;
  let completed = 0;
  node.children.forEach((child: any) => {
    const res = calculateNodeLessons(child, statusList);
    total += res.total;
    completed += res.completed;
  });
  return { total, completed };
};

/* ─── Helper: Build a lookup map from statusData for O(1) access ── */
const buildStatusMap = (statusList: any[]): Map<string, any> => {
  const map = new Map<string, any>();
  for (const item of statusList) {
    if (item.contentId) {
      map.set(item.contentId, item);
    }
  }
  return map;
};

/* ─── Build a completion cache for all nodes ── */
const buildCompletionCache = (modules: any[], statusMap: Map<string, any>): Map<string, number> => {
  const cache = new Map<string, number>();

  const walk = (node: any): number => {
    const id = node.identifier || node.id;
    if (cache.has(id)) return cache.get(id)!;

    let perc: number;
    if (!node.children || node.children.length === 0) {
      const s = statusMap.get(id);
      perc = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
    } else {
      const childPercs = node.children.map((child: any) => walk(child));
      perc = childPercs.length > 0 ? childPercs.reduce((a: number, b: number) => a + b, 0) / childPercs.length : 0;
    }
    cache.set(id, perc);
    return perc;
  };

  modules.forEach(walk);
  return cache;
};

/* ─── Module Node (renders module with children) ── */
const ModuleNode: React.FC<{
  node: any;
  completionCache: Map<string, number>;
  isLocked?: boolean;
  depth?: number;
}> = React.memo(({ node, completionCache, isLocked, depth = 0 }) => {
  const nodeId = node.identifier || node.id;
  const perc = isLocked ? 0 : (completionCache.get(nodeId) ?? 0);
  const isCompleted = perc >= 100;
  const isInProgress = perc > 0 && perc < 100;
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(isInProgress);

  const borderColor = isLocked ? '#F3F4F6' : (isCompleted ? SUCCESS : (isInProgress ? PRIMARY : '#E5E7EB'));

  const completedChildCount = useMemo(() => {
    return children.filter((c: any) => (completionCache.get(c.identifier || c.id) ?? 0) >= 100).length;
  }, [children, completionCache]);

  if (!hasChildren) {
    // Leaf node (lesson)
    return (
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, pl: 2 + depth * 2, pr: 2, py: 1,
          borderLeft: '2px solid #F3F4F6',
          opacity: isLocked ? 0.6 : 1
        }}
      >
        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLocked ? (
            <LockIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
          ) : isCompleted ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 20, color: SUCCESS }} />
          ) : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={20} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={perc} size={20} thickness={4} sx={{ color: perc > 0 ? PRIMARY : 'transparent' }} />
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12, color: '#4B5563' }}>{node.name}</Typography>
          <Typography sx={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: '#9CA3AF' }}>
            {isCompleted ? 'Completed' : `${Math.round(perc)}% Complete`}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
          borderRadius: '12px', bgcolor: '#fff',
          border: `1.5px solid ${borderColor}`,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#F9FAFB' },
          opacity: isLocked ? 0.7 : 1,
          ml: depth * 2
        }}
      >
        <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isLocked ? (
            <LockIcon sx={{ fontSize: 22, color: '#9CA3AF' }} />
          ) : isCompleted ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 32, color: SUCCESS }} />
          ) : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={32} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={perc} size={32} thickness={3.5} sx={{ color: perc > 0 ? PRIMARY : 'transparent' }} />
              <Typography sx={{ position: 'absolute', fontSize: 9, fontWeight: 800, color: '#1F2937' }}>{Math.round(perc)}%</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13, color: isLocked ? '#9CA3AF' : '#1F2937' }}>
            {node.name}
          </Typography>
          <Typography sx={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: '#9CA3AF', mt: 0.3 }}>
            {completedChildCount}/{children.length} Subtopics Completed
          </Typography>
        </Box>
        <Box>
          {expanded ? <KeyboardArrowUpIcon sx={{ color: PRIMARY, fontSize: 22 }} /> : <KeyboardArrowDownIcon sx={{ color: PRIMARY, fontSize: 22 }} />}
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ pl: 1, pt: 1 }}>
          {children.map((child: any, idx: number) => (
            <ModuleNode
              key={child.identifier || idx}
              node={child}
              completionCache={completionCache}
              isLocked={isLocked}
              depth={depth + 1}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});

ModuleNode.displayName = 'ModuleNode';

/* ─── Level Accordion (per-course) ── */
const LevelAccordion: React.FC<{
  level: any;
  statusData: any[];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ level, statusData, isExpanded, onToggle }) => {
  const isLocked = !level.isUnlocked;
  const isCompleted = level.completionPercentage >= 100;

  const statusMap = useMemo(() => buildStatusMap(statusData), [statusData]);
  const completionCache = useMemo(
    () => buildCompletionCache(level.rawChildren || [], statusMap),
    [level.rawChildren, statusMap]
  );

  return (
    <Box
      sx={{
        mb: 2, borderRadius: '16px', overflow: 'hidden',
        border: `1.5px solid ${isExpanded ? PRIMARY : '#E5E7EB'}`,
        bgcolor: '#fff', opacity: isLocked ? 0.7 : 1,
        boxShadow: isExpanded ? '0 4px 12px rgba(230,135,60,0.12)' : 'none',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box
        onClick={() => !isLocked && onToggle()}
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          bgcolor: isExpanded ? 'rgba(230,135,60,0.04)' : 'transparent',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15, color: isLocked ? '#9CA3AF' : '#1F2937' }}>
            {level.name}
          </Typography>
          <Typography sx={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#9CA3AF', mt: 0.5 }}>
            {isCompleted
              ? `Completed all ${level.totalModules} modules`
              : `Completed ${level.completedModules}/${level.totalModules} modules`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700, color: isCompleted ? SUCCESS : PRIMARY, fontSize: 14 }}>
            {level.completionPercentage}%
          </Typography>
          {!isLocked && (
            isExpanded ? <KeyboardArrowUpIcon sx={{ color: PRIMARY, fontSize: 24 }} /> : <KeyboardArrowDownIcon sx={{ color: PRIMARY, fontSize: 24 }} />
          )}
          {isLocked && <LockIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />}
        </Box>
      </Box>

      <Collapse in={isExpanded && !isLocked}>
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {(level.rawChildren || []).map((mod: any, idx: number) => (
            <ModuleNode
              key={mod.identifier || idx}
              node={mod}
              completionCache={completionCache}
              isLocked={false}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

/* ─── Main Modal Component ── */
const CFLDesktopTrainerProgressModal: React.FC<CFLDesktopTrainerProgressModalProps> = ({ open, onClose, trainer, courseName }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!trainer?.id) return;
    try {
      setIsLoading(true);
      const trainerId = trainer.id;
      const storedTenantId = localStorage.getItem('tenantId') || '';

      // 1. Fetch all courses
      const levelCourses = await fetchSwadhaarLevelCourses();
      if (!levelCourses || levelCourses.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Collect all hierarchy IDs
      const allHierarchyIds: string[] = [];
      levelCourses.forEach((level: any) => {
        allHierarchyIds.push(level.identifier);
        (level.children || []).forEach((mod: any) => {
          allHierarchyIds.push(mod.identifier);
          (mod.children || []).forEach((sub: any) => {
            allHierarchyIds.push(sub.identifier);
            (sub.children || []).forEach((lesson: any) => {
              allHierarchyIds.push(lesson.identifier);
            });
          });
        });
      });

      // 3. Fetch status for the trainer
      let status: any[] = [];
      if (trainerId && allHierarchyIds.length && storedTenantId) {
        const batchSize = 100;
        for (let i = 0; i < allHierarchyIds.length; i += batchSize) {
          const batch = allHierarchyIds.slice(i, i + batchSize);
          const batchStatus = await getContentCourseStatus([trainerId], batch, storedTenantId).catch(() => []);
          status = [...status, ...batchStatus];
        }
      }

      setStatusData(status);

      // 4. Filter hierarchy
      const filterHierarchy = (items: any[]): any[] => {
        return items
          .map((item) => {
            if (item.children && item.children.length > 0) {
              return { ...item, children: filterHierarchy(item.children) };
            }
            return item;
          })
          .filter((item) => {
            const isContainer = item.mimeType === 'application/vnd.ekstep.content-collection' ||
              item.contentType === 'CourseUnit' || item.contentType === 'TextBookUnit';
            if (item.children) return item.children.length > 0;
            return !isContainer;
          });
      };

      const filteredLevelCourses = filterHierarchy(levelCourses);

      // 5. Map to level data
      const levelDataList = filteredLevelCourses.map((course: any, idx: number, filteredLevels: any[]) => {
        const children = course?.children || [];
        const moduleDetails = children.map((m: any) => {
          const { total, completed } = calculateNodeLessons(m, status);
          const modulePerc = total > 0 ? (completed / total) * 100 : 0;
          return { isModuleComplete: modulePerc >= 100, modulePerc };
        });

        const levelStats = calculateNodeLessons(course, status);
        const levelPerc = levelStats.total > 0 ? (levelStats.completed / levelStats.total) * 100 : 0;
        (course as any).calculatedCompletion = levelPerc;

        const previousCompleted = idx === 0 || Math.round((filteredLevels[idx - 1] as any)?.calculatedCompletion || 0) >= 100;
        const isUnlocked = previousCompleted;
        const completedModulesCount = isUnlocked ? moduleDetails.filter((md: any) => md.isModuleComplete).length : 0;
        const displayPerc = isUnlocked ? Math.round(levelPerc) : 0;

        return {
          id: course.identifier,
          name: course.name,
          completedModules: completedModulesCount,
          totalModules: children.length,
          completionPercentage: displayPerc,
          isUnlocked,
          rawChildren: children
        };
      });

      setLevels(levelDataList);

      // Auto-expand first in-progress level
      const activeLevel =
        levelDataList.find((l) => l.isUnlocked && l.completionPercentage > 0 && l.completionPercentage < 100)
        || levelDataList.find((l) => l.isUnlocked && l.completionPercentage < 100)
        || levelDataList[0];
      if (activeLevel) setExpandedLevelId(activeLevel.id);
    } catch (err) {
      console.error('Error loading trainer hierarchy:', err);
    } finally {
      setIsLoading(false);
    }
  }, [trainer?.id]);

  useEffect(() => {
    if (open && trainer?.id) {
      loadData();
    }
  }, [open, trainer?.id, loadData]);

  if (!trainer) return null;

  return (
    <Modal
      open={open}
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
          maxWidth: '800px',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <Box sx={{ bgcolor: DARK_NAV, px: 3, py: 1.5, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
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

        <Box sx={{ p: 4, overflowY: 'auto', flex: 1 }}>
          {/* Trainer Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar 
              src={trainer?.avatarUrl || '/images/default.png'}
              sx={{ width: 44, height: 44, bgcolor: '#fff', border: `1px solid #ccc` }}
            />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                {trainer.name}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                Course Hierarchy Progress
              </Typography>
            </Box>
          </Box>

          {/* Course Hierarchy */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
          ) : levels.length > 0 ? (
            <Box>
              {levels.map((level) => (
                <LevelAccordion
                  key={level.id}
                  level={level}
                  statusData={statusData}
                  isExpanded={expandedLevelId === level.id}
                  onToggle={() => setExpandedLevelId(expandedLevelId === level.id ? null : level.id)}
                />
              ))}
            </Box>
          ) : (
            <Typography align="center" color="textSecondary" sx={{ py: 5 }}>
              No course data found for this trainer.
            </Typography>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default CFLDesktopTrainerProgressModal;
