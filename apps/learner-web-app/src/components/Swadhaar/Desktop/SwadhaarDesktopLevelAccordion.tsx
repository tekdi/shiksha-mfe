'use client';

import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress, Collapse } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TranslateIcon from '@mui/icons-material/Translate';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import { useTranslation } from '@shared-lib';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

/* ─── Shared status map builder ──────────────────────────── */
const buildStatusMap = (statusList: any[]): Map<string, any> => {
  const map = new Map<string, any>();
  for (const item of statusList) {
    if (item.contentId) map.set(item.contentId, item);
  }
  return map;
};

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

/* ─── Module Card (desktop 3-col grid item) ─────────────── */
const DesktopModuleCard: React.FC<{
  module: any;
  completionCache: Map<string, number>;
  isLocked: boolean;
  onClick: () => void;
  showDescriptions?: boolean;
}> = React.memo(({ module, completionCache, isLocked, onClick, showDescriptions = false }) => {
  const { t } = useTranslation();
  const nodeId = module.identifier || module.id;
  const perc = isLocked ? 0 : Math.round(completionCache.get(nodeId) ?? 0);
  const isCompleted = perc >= 70; // 70% threshold for done state
  const children = module.children || [];
  const subtopicCount = children.length;

  const borderColor = isLocked
    ? '#E5E7EB'
    : isCompleted
      ? SUCCESS
      : PRIMARY;

  return (
    <Box
      id={`swadhaar-module-card-${nodeId}`}
      onClick={() => !isLocked && onClick()}
      sx={{
        bgcolor: '#fff',
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px',
        p: 1.75,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.6 : 1,
        transition: 'all 0.15s ease',
        '&:hover': {
          boxShadow: isLocked ? 'none' : '0 4px 12px rgba(230,135,60,0.15)',
          transform: isLocked ? 'none' : 'translateY(-1px)',
        },
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MenuBookRoundedIcon sx={{ fontSize: 12, color: '#9E9E9E' }} />
          <Typography
            sx={{
              fontFamily: 'Open sans',
              fontWeight: 700,
              fontSize: 10,
              color: '#9E9E9E',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {module.name?.toLowerCase().includes('module') ? module.name : t('LEARNER_APP.HOME.MODULE')}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: 'Open sans',
            fontSize: 9,
            color: '#9E9E9E',
          }}
        >
          {subtopicCount} {t('LEARNER_APP.LEARN.LESSONS_TITLE')}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontFamily: 'Open sans',
          fontWeight: 700,
          fontSize: 15,
          color: isLocked ? '#9CA3AF' : '#1A1A1A',
          lineHeight: 1.3,
          mb: 0.5,
        }}
      >
        {module.name}
      </Typography>
      {/* {showDescriptions && module.description && (
        <Typography
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            color: '#6B7280',
            lineHeight: 1.2,
          }}
        >
          {module.description}
        </Typography>
      )} */}

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={perc}
        sx={{
          height: 5,
          borderRadius: 3,
          bgcolor: '#F3F4F6',
          '& .MuiLinearProgress-bar': {
            bgcolor: isCompleted ? SUCCESS : PRIMARY,
            borderRadius: 3,
          },
        }}
      />

      {/* Progress label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {isCompleted ? (
          <CheckCircleRoundedIcon sx={{ fontSize: 16, color: SUCCESS }} />
        ) : isLocked ? (
          <LockRoundedIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
        ) : (
          <PlayCircleFilledWhiteRoundedIcon sx={{ fontSize: 16, color: PRIMARY }} />
        )}
        <Typography
          sx={{
            fontFamily: 'Open Sans',
            fontSize: 11,
            fontWeight: 700,
            color: isCompleted ? SUCCESS : isLocked ? '#9E9E9E' : PRIMARY,
          }}
        >
          {isCompleted
            ? `${perc}% ${t('LEARNER_APP.HOME.COMPLETED')}`
            : isLocked
              ? t('LEARNER_APP.HOME.LOCKED')
              : `${perc}% ${t('LEARNER_APP.HOME.COMPLETED')}`}
        </Typography>
      </Box>
    </Box>
  );
});
DesktopModuleCard.displayName = 'DesktopModuleCard';

/* ─── Props ──────────────────────────────────────────────── */
interface SwadhaarDesktopLevelAccordionProps {
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
  modules: any[];
  onModuleClick: (moduleId: string) => void;
  showDescriptions?: boolean;
  selectedLanguage?: string;
  onChangeLanguage?: () => void;
}

/* ─── Main Component ─────────────────────────────────────── */
const SwadhaarDesktopLevelAccordion: React.FC<SwadhaarDesktopLevelAccordionProps> = ({
  levelId,
  levelName,
  levelDescription,
  completedModules,
  totalModules,
  completionPercentage,
  isUnlocked,
  isExpanded,
  onToggle,
  statusData,
  modules: rawModules,
  onModuleClick,
  showDescriptions = false,
  selectedLanguage,
  onChangeLanguage,
}) => {
  const { t } = useTranslation();
  const isLocked = !isUnlocked;
  const isCompletedLevel = completionPercentage >= 70; // 70% = level done

  const statusMap = useMemo(() => buildStatusMap(statusData), [statusData]);
  const completionCache = useMemo(
    () => buildCompletionCache(rawModules, statusMap),
    [rawModules, statusMap]
  );

  // Sequential module unlock: module N is unlocked if all previous are >= 70%
  const moduleLockState = useMemo(() => {
    return rawModules.map((_, idx) =>
      rawModules.slice(0, idx).every((m) => (completionCache.get(m.identifier || m.id) ?? 0) >= 70)
    );
  }, [rawModules, completionCache]);

  const headerBorderColor = isLocked ? '#E5E7EB' : isCompletedLevel ? SUCCESS : isExpanded ? PRIMARY : '#E5E7EB';

  return (
    <Box
      id={`swadhaar-desktop-level-accordion-${levelId}`}
      sx={{
        mb: 3,           // extra space so the bottom pill doesn't overlap next card
        position: 'relative',
        borderRadius: '16px',
        overflow: 'visible',  // let the pill overflow the border
        border: `1.5px solid ${headerBorderColor}`,
        bgcolor: '#fff',
        opacity: isLocked ? 0.65 : 1,
        boxShadow: isExpanded && !isLocked ? '0 4px 16px rgba(230,135,60,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Accordion header */}
      <Box
        onClick={() => !isLocked && onToggle()}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          cursor: isLocked ? 'not-allowed' : 'pointer',
          bgcolor: isExpanded && !isLocked ? 'rgba(230,135,60,0.04)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0, pr: 2 }}>
          {isLocked && (
            <LockRoundedIcon sx={{ color: '#9CA3AF', fontSize: 22, mt: 0.2 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pr: 1 }}>
              <Typography
                sx={{
                  fontFamily: 'Open Sans',
                  fontWeight: 700,
                  fontSize: 16,
                  color: isLocked ? '#9CA3AF' : '#1A1A1A',
                }}
              >
                {levelName}
              </Typography>
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
                    px: 1.25,
                    py: 0.35,
                    borderRadius: '12px',
                    bgcolor: isCompletedLevel ? 'rgba(76,175,80,0.1)' : 'rgba(230,135,60,0.1)',
                    border: `1px solid ${isCompletedLevel ? SUCCESS : PRIMARY}`,
                    color: isCompletedLevel ? SUCCESS : PRIMARY,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: isCompletedLevel ? 'rgba(76,175,80,0.2)' : 'rgba(230,135,60,0.2)' }
                  }}
                >
                  {/* <TranslateIcon sx={{ fontSize: 13, color: isCompletedLevel ? SUCCESS : PRIMARY }} /> */}
                  <span>{selectedLanguage}</span>
                </Box>
              )}
            </Box>
            <Typography
              sx={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: isCompletedLevel ? SUCCESS : '#757575',
                mt: 0.25,
                fontWeight: isCompletedLevel ? 700 : 400,
              }}
            >
              {isCompletedLevel
                ? t('LEARNER_APP.HOME.COMPLETED')
                : isLocked
                  ? t('LEARNER_APP.HOME.LOCKED')
                  : t('LEARNER_APP.LEARN.COMPLETED_MODULES', { completed: completedModules, total: totalModules })}
            </Typography>
            {showDescriptions && levelDescription && (
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: 10,
                  fontWeight: 400,
                  color: '#999999',
                  mt: 0.8,
                }}
              >
                {levelDescription}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pt: 0.2, flexShrink: 0 }}>
          {isCompletedLevel && (
            <Typography
              sx={{
                fontFamily: 'Open Sans',
                fontSize: 12,
                fontWeight: 600,
                color: SUCCESS,
                whiteSpace: 'nowrap',
              }}
            >
              {completedModules}/{totalModules} {t('LEARNER_APP.HOME.MODULES_COMPLETED')}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Modules grid */}
      <Collapse in={isExpanded && !isLocked}>
        <Box
          sx={{
            px: 2.5,
            pt: 0,
            pb: 4,  // extra bottom padding so cards sit above the border pill
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.75,
            borderRadius: '0 0 16px 16px',
            overflow: 'hidden',
          }}
        >
          {rawModules.map((mod, idx) => (
            <DesktopModuleCard
              key={mod.identifier}
              module={mod}
              completionCache={completionCache}
              isLocked={!moduleLockState[idx]}
              onClick={() => onModuleClick(mod.identifier)}
              showDescriptions={showDescriptions}
            />
          ))}
        </Box>
      </Collapse>

      {/* View Less pill — sits centred on the bottom border of the card */}
      {!isLocked && (
        <Box
          onClick={() => !isLocked && onToggle()}
          sx={{
            position: 'absolute',
            bottom: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#fff',
            border: '1.5px solid #1C2B4A',
            borderRadius: '6px',
            px: 2,
            py: 0.5,
            cursor: 'pointer',
            zIndex: 5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
            '&:hover': { bgcolor: '#F0F4FA' },
          }}
        >
          <Typography sx={{ fontFamily: 'Inter', fontSize: 6, color: '#1C2B4A', fontWeight: 600 }}>
            {isExpanded ? t('LEARNER_APP.HOME.VIEW_LESS') : t('LEARNER_APP.HOME.VIEW_MORE')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SwadhaarDesktopLevelAccordion;
