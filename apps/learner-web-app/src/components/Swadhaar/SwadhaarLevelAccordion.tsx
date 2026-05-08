'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Collapse, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from '@shared-lib';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

/* ─── Types ─────────────────────────────────────────────── */
interface SwadhaarLevelAccordionProps {
  levelId: string;
  levelName: string;
  completedModules: number;
  totalModules: number;
  completionPercentage: number;
  isUnlocked: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  statusData: any[];
  onModuleClick: (moduleId: string, subtopicId?: string, lessonId?: string) => void;
  modules: any[];
}

/* ─── Helper: Completion Calculation ─────────────────────── */
const calculateNodeCompletion = (node: any, statusList: any[]): number => {
  const identifier = node.identifier || node.id;
  if (!node.children || node.children.length === 0) {
    const s = statusList.find((d: any) => d.contentId === identifier);
    const res = s?.completionPercentage ?? (s?.status === 2 ? 100 : 0);
    console.log(`[ACCORDION_DEBUG] Leaf: ${node.name} (${identifier}) -> ${res}%`);
    return res;
  }
  const childPercs = node.children.map((child: any) => calculateNodeCompletion(child, statusList));
  const avg = childPercs.length > 0 ? childPercs.reduce((a: number, b: number) => a + b, 0) / childPercs.length : 0;
  console.log(`[ACCORDION_DEBUG] Branch: ${node.name} (${identifier}) -> ${avg}%`);
  return avg;
};

/* ─── Component: LessonNode (Leaf) ──────────────────────── */
const LessonNode: React.FC<{
  lesson: any;
  statusData: any[];
  onClick: () => void;
  isLocked?: boolean;
}> = ({ lesson, statusData, onClick, isLocked }) => {
  const perc = isLocked ? 0 : calculateNodeCompletion(lesson, statusData);
  const isCompleted = perc >= 100;

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
            <CircularProgress variant="determinate" value={perc} size={24} thickness={4} sx={{ color: perc > 0 ? PRIMARY : 'transparent' }} />
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 11, color: '#4B5563' }}>{lesson.name}</Typography>
        <Typography sx={{ fontSize: 9, fontFamily: 'Inter, sans-serif', color: '#9CA3AF' }}>{isCompleted ? 'Completed' : `${Math.round(perc)}% Complete`}</Typography>
      </Box>
      <ChevronRightIcon sx={{ fontSize: 18, color: '#D1D5DB' }} />
    </Box>
  );
};

/* ─── Component: ModuleNode (Hierarchy Item) ────────────── */
const ModuleNode: React.FC<{
  node: any;
  levelId: string;
  parentId: string;
  statusData: any[];
  onNavigate: (moduleId: string, subtopicId?: string, lessonId?: string) => void;
  isLocked?: boolean;
}> = ({ node, levelId, parentId, statusData, onNavigate, isLocked }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const perc = isLocked ? 0 : calculateNodeCompletion(node, statusData);
  const isCompleted = perc >= 100;
  if (node.name.includes('Module 2')) {
    console.log('[ACCORDION_DEBUG] Module 2 Check:', { perc, isCompleted, childrenCount: node.children?.length });
  }
  const isInProgress = perc > 0 && perc < 100;
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isLeaf = !hasChildren;

  const borderColor = isLocked ? '#F3F4F6' : (isCompleted ? SUCCESS : (isInProgress ? PRIMARY : '#E5E7EB'));

  if (isLeaf) {
    return <LessonNode lesson={node} statusData={statusData} onClick={() => onNavigate(parentId, parentId, node.identifier)} isLocked={isLocked} />;
  }

  const handleModuleClick = () => {
    if (isLocked) return;
    onNavigate(node.identifier);
  };

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
              <CircularProgress variant="determinate" value={perc} size={40} thickness={3.5} sx={{ color: perc > 0 ? PRIMARY : 'transparent' }} />
              <Typography sx={{ position: 'absolute', fontSize: 10, fontWeight: 800, color: '#1F2937' }}>{Math.round(perc)}%</Typography>
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
              <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: isLocked ? '#9CA3AF' : '#1F2937' }}>{node.name.toLowerCase().includes('module') ? node.name : `Module: ${node.name}`}</Typography>
              <Typography sx={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: '#9CA3AF', mt: 0.3 }}>
                {t('LEARNER_APP.LEARN.COMPLETED_SUBTOPICS', { completed: children.filter((c: any) => calculateNodeCompletion(c, statusData) >= 100).length, total: children.length }) !== 'LEARNER_APP.LEARN.COMPLETED_SUBTOPICS' 
                  ? t('LEARNER_APP.LEARN.COMPLETED_SUBTOPICS', { completed: children.filter((c: any) => calculateNodeCompletion(c, statusData) >= 100).length, total: children.length }) 
                  : `Completed ${children.filter((c: any) => calculateNodeCompletion(c, statusData) >= 100).length}/${children.length} Subtopics`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {!isLocked ? (
                <ChevronRightIcon sx={{ color: isCompleted ? SUCCESS : PRIMARY, fontSize: 24 }} />
              ) : (
                <LockIcon sx={{ color: '#9CA3AF', fontSize: 18 }} />
              )}
            </Box>
          </Box>
      </Box>
    </Box>
  );
};

/* ─── Main Component: SwadhaarLevelAccordion ───────────── */
const SwadhaarLevelAccordion: React.FC<SwadhaarLevelAccordionProps> = ({
  levelId, levelName, completedModules, totalModules, completionPercentage,
  isUnlocked, isExpanded, onToggle, statusData, onModuleClick, modules: rawModules
}) => {
  const { t } = useTranslation();
  console.log('[ACCORDION_DEBUG] Level:', levelName, 'Modules:', rawModules.length, 'StatusData:', statusData);
  const isLocked = !isUnlocked;
  const isCompletedLevel = completionPercentage >= 100;

  return (
    <Box 
      sx={{ 
        mb: 2, borderRadius: '16px', overflow: 'hidden', 
        border: (theme) => `1px solid ${isExpanded ? PRIMARY : '#E5E7EB'}`,
        bgcolor: 'background.paper', opacity: isLocked ? 0.7 : 1,
        boxShadow: isExpanded ? '0 4px 12px rgba(230,135,60,0.12)' : 'none',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box
        onClick={() => !isLocked && onToggle()}
        sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 2, cursor: isLocked ? 'not-allowed' : 'pointer' }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, color: isLocked ? '#9CA3AF' : '#1F2937' }}>{levelName}</Typography>
          <Typography sx={{ fontSize: 10, fontFamily: 'Inter, sans-serif', color: '#9CA3AF', mt: 0.5 }}>
            {isCompletedLevel ? t('LEARNER_APP.HOME.COMPLETED') : t('LEARNER_APP.LEARN.COMPLETED_MODULES', { completed: completedModules, total: totalModules })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           {!isLocked && (
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
               {isExpanded ? (
                 <KeyboardArrowUpIcon sx={{ color: PRIMARY, fontSize: 24 }} />
               ) : (
                 <KeyboardArrowDownIcon sx={{ color: PRIMARY, fontSize: 24 }} />
               )}
             </Box>
           )}
           {isLocked && (
              <LockIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
           )}
        </Box>
      </Box>

      <Collapse in={isExpanded && !isLocked}>
        <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column' }}>
          {rawModules.map((mod, idx) => {
             const allPreviousCompleted = rawModules.slice(0, idx).every(m => calculateNodeCompletion(m, statusData) >= 100);
             return (
              <ModuleNode
                key={mod.identifier}
                node={mod}
                levelId={levelId}
                parentId={mod.identifier}
                statusData={statusData}
                onNavigate={(mId, sId, lId) => onModuleClick(mId, sId, lId)}
                isLocked={!allPreviousCompleted}
              />
             );
          })}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SwadhaarLevelAccordion;
