'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Collapse, CircularProgress, useTheme, useMediaQuery, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import TranslateIcon from '@mui/icons-material/Translate';
import { useTranslation } from '@shared-lib';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

/* ─── Types ─────────────────────────────────────────────── */
interface SwadhaarLevelAccordionProps {
  levelId: string;
  levelName: string;
  levelDescription?: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  isUnlocked: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  statusData: any[];
  onModuleClick: (moduleId: string, subtopicId?: string, lessonId?: string) => void;
  modules: any[];
  showDescriptions?: boolean;
  selectedLanguage?: string;
  onChangeLanguage?: () => void;
}

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

/* ─── Helper: Completion Calculation (memoizable, no console.log) ── */
const calculateNodeCompletion = (node: any, statusMap: Map<string, any>): number => {
  const identifier = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusMap.get(identifier);
    return s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
  }
  const childPercs = node.children.map((child: any) => calculateNodeCompletion(child, statusMap));
  return childPercs.length > 0 ? childPercs.reduce((a: number, b: number) => a + b, 0) / childPercs.length : 0;
};

/* ─── Build a completion cache for all nodes in a module list ── */
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

/* ─── Component: LessonNode (Leaf) ──────────────────────── */
const LessonNode: React.FC<{
  lesson: any;
  perc: number;
  onClick: () => void;
  isLocked?: boolean;
  showDescriptions?: boolean;
}> = React.memo(({ lesson, perc, onClick, isLocked, showDescriptions = false }) => {
  const effectivePerc = isLocked ? 0 : perc;
  const isCompleted = effectivePerc >= 70;

  return (
    <Box
      onClick={() => !isLocked && onClick()}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, pl: 6, pr: 2, py: 1.2,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        borderLeft: '2px solid #F3F4F6',
        '&:hover': { bgcolor: isLocked ? 'transparent' : '#F9FAFB' },
        opacity: isLocked ? 0.6 : 1
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
        {isLocked ? (
          <LockIcon sx={{ fontSize: 20, color: '#9CA3AF' }} />
        ) : isCompleted ? (
          <CheckCircleIcon sx={{ fontSize: 24, color: '#4CAF50' }} />
        ) : (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress variant="determinate" value={100} size={24} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
            <CircularProgress variant="determinate" value={effectivePerc} size={24} thickness={4} sx={{ color: effectivePerc >= 70 ? '#4CAF50' : (effectivePerc > 0 ? '#E6873C' : 'transparent') }} />
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 11, color: '#4B5563' }}>{lesson.name}</Typography>
        {showDescriptions && lesson.description && (
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7280', mt: 0.3, lineHeight: 1.3 }}>
            {lesson.description}
          </Typography>
        )}
        <Typography sx={{ fontSize: 9, fontFamily: 'Inter, sans-serif', color: '#9CA3AF' }}>{isCompleted ? 'Completed' : `${Math.round(effectivePerc)}% Complete`}</Typography>
      </Box>
      <ArrowForwardIcon sx={{ fontSize: 18, color: isLocked ? '#D1D5DB' : (isCompleted ? '#4CAF50' : '#E6873C') }} />
    </Box>
  );
});

LessonNode.displayName = 'LessonNode';

/* ─── Component: ModuleNode (Hierarchy Item) ────────────── */
const ModuleNode: React.FC<{
  node: any;
  levelId: string;
  parentId: string;
  completionCache: Map<string, number>;
  onNavigate: (moduleId: string, subtopicId?: string, lessonId?: string) => void;
  isLocked?: boolean;
  showDescriptions?: boolean;
}> = React.memo(({ node, levelId, parentId, completionCache, onNavigate, isLocked, showDescriptions = false }) => {
  const { t } = useTranslation();

  const nodeId = node.identifier || node.id;
  const perc = isLocked ? 0 : (completionCache.get(nodeId) ?? 0);
  const isCompleted = perc >= 70;
  const isInProgress = perc > 0 && perc < 70;
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isLeaf = !hasChildren;

  const borderColor = isLocked ? '#F3F4F6' : (isCompleted ? SUCCESS : PRIMARY);

  // Pre-compute completed children count from cache
  const completedChildCount = useMemo(() => {
    return children.filter((c: any) => (completionCache.get(c.identifier || c.id) ?? 0) >= 70).length;
  }, [children, completionCache]);

  if (isLeaf) {
    return <LessonNode lesson={node} perc={completionCache.get(nodeId) ?? 0} onClick={() => onNavigate(parentId, parentId, node.identifier)} isLocked={isLocked} showDescriptions={showDescriptions} />;
  }

  const handleModuleClick = () => {
    if (isLocked) return;
    if (isCompleted && children.length > 0) {
      // If module is completed, skip module list page and go straight to the subtopic completion page.
      onNavigate(node.identifier, children[0].identifier || children[0].id);
    } else {
      onNavigate(node.identifier);
    }
  };

  const subtopicLabel = t('LEARNER_APP.LEARN.COMPLETED_SUBTOPICS', { completed: completedChildCount, total: children.length });
  const subtopicText = subtopicLabel !== 'LEARNER_APP.LEARN.COMPLETED_SUBTOPICS'
    ? subtopicLabel
    : `Completed ${completedChildCount}/${children.length} Subtopics`;

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
          {isLocked ? (
            <LockIcon sx={{ fontSize: 24, color: '#9CA3AF' }} />
          ) : isCompleted ? (
            <CheckCircleIcon sx={{ fontSize: 40, color: '#4CAF50' }} />
          ) : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={40} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={perc} size={40} thickness={3.5} sx={{ color: perc >= 70 ? '#4CAF50' : (perc > 0 ? '#E6873C' : 'transparent') }} />
              <Typography sx={{ position: 'absolute', fontSize: 10, fontWeight: 800, color: perc >= 70 ? '#4CAF50' : '#1F2937' }}>{Math.round(perc)}%</Typography>
            </Box>
          )}
        </Box>
        <Box
          onClick={handleModuleClick}
          sx={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
            border: `1.5px solid ${borderColor}`, cursor: isLocked ? 'not-allowed' : 'pointer',
            '&:hover': { bgcolor: isLocked ? 'transparent' : '#F9FAFB' },
            opacity: isLocked ? 0.7 : 1
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: isLocked ? '#9CA3AF' : '#1A1A1A' }}>{node.name.toLowerCase().includes('module') ? node.name : `Module: ${node.name}`}</Typography>
            {showDescriptions && node.description && (
              <Typography sx={{ fontFamily: 'Inter', fontSize: 10, color: '#999999', mt: 0.5, lineHeight: 1.3, fontWeight: 400 }}>
                {node.description}
              </Typography>
            )}
            <Typography sx={{ fontSize: 10, fontFamily: 'Inter', color: '#999999', mt: 0.3, fontWeight: 400 }}>
              {subtopicText}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowForwardIcon sx={{ color: isLocked ? '#D1D5DB' : (isCompleted ? SUCCESS : PRIMARY), fontSize: 24 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

ModuleNode.displayName = 'ModuleNode';

/* ─── Main Component: SwadhaarLevelAccordion ───────────── */
const SwadhaarLevelAccordion: React.FC<SwadhaarLevelAccordionProps> = ({
  levelId, levelName, levelDescription, completedModules, totalModules, completionPercentage,
  isUnlocked, isExpanded, onToggle, statusData, onModuleClick, modules: rawModules, showDescriptions = false,
  selectedLanguage, onChangeLanguage
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLocked = !isUnlocked;
  const isCompletedLevel = completionPercentage >= 70;

  // Build status lookup map once per render (O(n) instead of O(n) per lookup)
  const statusMap = useMemo(() => buildStatusMap(statusData), [statusData]);

  // Build completion cache for all nodes in the hierarchy — computed once
  const completionCache = useMemo(
    () => buildCompletionCache(rawModules, statusMap),
    [rawModules, statusMap]
  );

  // Pre-compute lock state for each module (sequential unlock — 70% threshold)
  const moduleLockState = useMemo(() => {
    return rawModules.map((_, idx) => {
      return rawModules.slice(0, idx).every(m => {
        const id = m.identifier || m.id;
        return (completionCache.get(id) ?? 0) >= 70;
      });
    });
  }, [rawModules, completionCache]);

  return (
    <Box
      sx={{
        mb: 2, borderRadius: '16px', overflow: 'hidden',
        border: (theme) => `1px solid ${isLocked ? '#E5E7EB' : isCompletedLevel ? SUCCESS : isExpanded ? PRIMARY : '#E5E7EB'}`,
        bgcolor: 'background.paper', opacity: isLocked ? 0.7 : 1,
        boxShadow: isExpanded ? '0 4px 12px rgba(230,135,60,0.12)' : 'none',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box
        onClick={() => !isLocked && onToggle()}
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, px: 2, py: 2, cursor: isLocked ? 'not-allowed' : 'pointer' }}
      >
        {isLocked && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.2 }}>
            <LockIcon sx={{ color: '#9CA3AF', fontSize: 24 }} />
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pr: 0.5 }}>
            <Typography sx={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 12, color: isLocked ? '#9CA3AF' : '#1A1A1A' }}>{levelName}</Typography>
            {selectedLanguage && (
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeLanguage?.();
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: '12px',
                  bgcolor: isCompletedLevel ? 'rgba(76,175,80,0.1)' : 'rgba(230,135,60,0.1)',
                  border: `1px solid ${isCompletedLevel ? SUCCESS : PRIMARY}`,
                  color: isCompletedLevel ? SUCCESS : PRIMARY,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: isCompletedLevel ? 'rgba(76,175,80,0.2)' : 'rgba(230,135,60,0.2)' }
                }}
              >
                {/* <TranslateIcon sx={{ fontSize: 12, color: isCompletedLevel ? SUCCESS : PRIMARY }} /> */}
                <span>{selectedLanguage}</span>
              </Box>
            )}
          </Box>
          <Typography sx={{ fontWeight: 400, fontSize: 10, fontFamily: 'Inter', color: '#999999', mt: 0.5 }}>
            {t('LEARNER_APP.LEARN.COMPLETED_MODULES', { completed: completedModules, total: totalModules })}
          </Typography>
          {showDescriptions && levelDescription && isExpanded && (
            <Typography sx={{ fontFamily: 'Inter', fontSize: 10, color: '#999999', mt: 0.5, fontWeight: 400 }}>
              {levelDescription}
            </Typography>
          )}
        </Box>
        {!isDesktop && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isExpanded ? (
                <UnfoldLessRoundedIcon sx={{ color: isLocked ? '#D1D5DB' : (isCompletedLevel ? SUCCESS : PRIMARY), fontSize: 28 }} />
              ) : (
                <UnfoldMoreRoundedIcon sx={{ color: isLocked ? '#D1D5DB' : (isCompletedLevel ? SUCCESS : PRIMARY), fontSize: 28 }} />
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Collapse in={isExpanded && !isLocked}>
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column' }}>
          {rawModules.map((mod, idx) => (
            <ModuleNode
              key={mod.identifier}
              node={mod}
              levelId={levelId}
              parentId={mod.identifier}
              completionCache={completionCache}
              onNavigate={(mId, sId, lId) => onModuleClick(mId, sId, lId)}
              isLocked={!moduleLockState[idx]}
              showDescriptions={false}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SwadhaarLevelAccordion;
