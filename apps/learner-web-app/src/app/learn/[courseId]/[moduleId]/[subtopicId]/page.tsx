'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Button, Badge, Collapse } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import { getCourseHierarchy, getContentCourseStatus } from '@learner/utils/API/SwadhaarService';
import { useTenant } from '@learner/context/TenantContext';
import { useTranslation } from '@shared-lib';
import { getUnreadCount } from '@learner/utils/alertsStore';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

const getNodeCompletionPercent = (node: any, statusList: any[]): number => {
  if (!node) return 0;
  const children = node.children || [];
  if (children.length > 0) {
    const percs = children.map((c: any) => getNodeCompletionPercent(c, statusList));
    return percs.reduce((a: number, b: number) => a + b, 0) / percs.length;
  }
  const found = statusList.find((d: any) => d.contentId === (node.identifier || node.id));
  return found?.completionPercentage ?? (found?.status === 2 ? 100 : 0);
};
const isNodeDone = (node: any, s: any[]) => Math.round(getNodeCompletionPercent(node, s)) >= 70;

const ChevronRightIcon = ({ color = PRIMARY }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
);

/* ── Lesson node — status icon outside the card (same as ModuleNode in SwadhaarLevelAccordion) ── */
function LessonNode({ lesson, courseId, moduleId, subtopicId, statusData, isUnlocked, router, t }: any) {
  const perc = Math.round(getNodeCompletionPercent(lesson, statusData));
  const isCompleted = perc >= 70;
  const isCurrent = isUnlocked && !isCompleted;
  const hasChildren = lesson.children && lesson.children.length > 0;
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!isUnlocked) return;
    if (hasChildren) { setExpanded(v => !v); }
    else { router.push(`/learn/${courseId}/${moduleId}/${subtopicId}/${lesson.identifier || lesson.id}`); }
  };

  const borderColor = isCurrent ? PRIMARY : (!isUnlocked ? '#E5E7EB' : SUCCESS);

  return (
    <Box sx={{ mb: 1 }}>
      {/* Outer flex: icon LEFT of card */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Status icon — outside card */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
          {!isUnlocked ? (
            <LockIcon sx={{ color: '#9CA3AF', fontSize: 24 }} />
          ) : isCompleted ? (
            <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 40 }} />
          ) : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={40} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={perc} size={40} thickness={3.5} sx={{ color: perc > 0 ? PRIMARY : 'transparent' }} />
              <Typography sx={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: perc > 0 ? PRIMARY : '#9CA3AF' }}>{perc}%</Typography>
            </Box>
          )}
        </Box>

        {/* Card */}
        <Box
          onClick={handleClick}
          sx={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
            border: `1.5px solid ${borderColor}`,
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            opacity: isUnlocked ? 1 : 0.7,
            '&:hover': { bgcolor: isUnlocked ? '#FFF7F0' : '#fff' },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary', lineHeight: 1.3 }}>{lesson.name}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.3 }}>
              {hasChildren
                ? t('LEARNER_APP.LEARN.COMPLETED_LESSONS', { completed: (lesson.children || []).filter((c: any) => isNodeDone(c, statusData)).length, total: (lesson.children || []).length })
                : t('LEARNER_APP.LEARN.LESSON')}
            </Typography>
            {lesson.description && lesson.mimeType !== 'application/vnd.sunbird.questionset' && (
              <Typography sx={{ fontSize: 11, color: '#6B7280', mt: 0.8, fontFamily: 'Inter, sans-serif' }}>{lesson.description}</Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', color: isCompleted ? SUCCESS : PRIMARY }}>
            {isUnlocked && (hasChildren
              ? (expanded ? <KeyboardArrowUpIcon sx={{ fontSize: 22 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 22 }} />)
              : <ChevronRightIcon color={isCompleted ? SUCCESS : PRIMARY} />
            )}
          </Box>
        </Box>
      </Box>

      {hasChildren && (
        <Collapse in={expanded && isUnlocked}>
          <Box sx={{ pl: 7, pb: 1, display: 'flex', flexDirection: 'column' }}>
            {(lesson.children || []).map((child: any, cIdx: number) => (
              <LessonNode key={child.identifier} lesson={child} courseId={courseId} moduleId={moduleId} subtopicId={subtopicId} statusData={statusData} isUnlocked={isUnlocked && (cIdx === 0 || isNodeDone(lesson.children[cIdx - 1], statusData))} router={router} t={t} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export default function SubtopicPage() {
  const router = useRouter();
  const { courseId, moduleId, subtopicId } = useParams() as { courseId: string; moduleId: string; subtopicId: string };
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [subtopicName, setSubtopicName] = useState('');
  const [subtopicDescription, setSubtopicDescription] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextSubtopic, setNextSubtopic] = useState<any>(null);
  const [nextModule, setNextModule] = useState<any>(null);
  const [isModuleComplete, setIsModuleComplete] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) window.location.replace('/swadhaar-login');
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId') || '';
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';
      const courseHierarchy = await getCourseHierarchy(courseId);
      setCourseName(courseHierarchy?.name || '');
      const allModules: any[] = courseHierarchy?.children || [];

      const findNode = (nodes: any[], id: string): any => {
        for (const n of nodes) {
          if (n.identifier === id) return n;
          if (n.children?.length > 0) { const f = findNode(n.children, id); if (f) return f; }
        }
        return null;
      };

      const currentModule = findNode(allModules, moduleId);
      setModuleName(currentModule?.name || '');
      const allSubtopics = currentModule?.children || [];
      const currentSubtopic = findNode(allSubtopics, subtopicId);
      setSubtopicName(currentSubtopic?.name || '');
      setSubtopicDescription(currentSubtopic?.description || '');
      const rawLessons = currentSubtopic?.children || [];

      const collectIds = (nodes: any[]): string[] => {
        const ids: string[] = [];
        nodes.forEach((n: any) => { ids.push(n.identifier); if (n.children?.length > 0) ids.push(...collectIds(n.children)); });
        return ids;
      };
      // Include ALL subtopics+lessons so isModuleComplete is accurate
      const allIds = [...new Set([courseId, moduleId, ...collectIds(allSubtopics), ...collectIds(allModules.flatMap((m: any) => m.children || []))].filter(Boolean))];
      let status: any[] = [];
      if (userId && allIds.length && tenantId) status = await getContentCourseStatus([userId], allIds, tenantId).catch(() => []);

      try {
        const raw = sessionStorage.getItem('swadhaar_progress_guard');
        const guard: Record<string, { percentage: number; status: number }> = raw ? JSON.parse(raw) : {};
        status = status.map(item => {
          const g = guard[item.contentId];
          return (g && g.status === 1 && item.status === 2) ? { ...item, status: 1, completionPercentage: g.percentage } : item;
        });
      } catch { /* SSR no-op */ }

      setStatusData(status);
      setLessons(rawLessons);

      const subIdx = allSubtopics.findIndex((s: any) => s.identifier === subtopicId);
      setNextSubtopic(subIdx >= 0 && subIdx < allSubtopics.length - 1 ? allSubtopics[subIdx + 1] : null);
      const modIdx = allModules.findIndex((m: any) => m.identifier === moduleId);
      setNextModule(modIdx >= 0 && modIdx < allModules.length - 1 ? allModules[modIdx + 1] : null);
      setIsModuleComplete(allSubtopics.every((s: any) => isNodeDone(s, status)));
      setIsLevelComplete(allModules.every((m: any) => isNodeDone(m, status)));
    } catch (err) { console.error('[SubtopicPage]', err); }
    finally { setIsLoading(false); }
  }, [courseId, moduleId, subtopicId, tenant]);

  useEffect(() => { loadData(); setUnreadCount(getUnreadCount()); }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  const subtopicComplete = lessons.length > 0 && lessons.every(l => isNodeDone(l, statusData));
  const currentIdx = lessons.findIndex(l => !isNodeDone(l, statusData));
  const firstIncomplete = currentIdx >= 0 ? lessons[currentIdx] : lessons[0];

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header — same as module page */}
      <Box sx={{ bgcolor: 'background.paper', px: 1, py: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100 }}>
        <IconButton onClick={() => router.push(`/learn/${courseId}/${moduleId}`)}>
          <ArrowBackIcon sx={{ color: PRIMARY, fontSize: 20 }} />
        </IconButton>
        <Typography variant="h1" sx={{ fontWeight: 700, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtopicName}</Typography>
        <Box onClick={() => router.push('/alerts')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', px: 1 }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16, backgroundColor: '#FFFFFF', color: PRIMARY, border: `1px solid ${PRIMARY}`, top: 2, right: 2 } }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(230,135,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: PRIMARY }} />
            </Box>
          </Badge>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: PRIMARY, mt: 0.5 }}>{t('LEARNER_APP.ALERTS.TITLE')}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2, flex: 1, pb: 22 }}>

        {/* ── SUBTOPIC banner: always exclusively shows Subtopic Complete when done ── */}
        {subtopicComplete && (
          <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '24px', p: 3, textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#6DBB6D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon sx={{ color: '#fff', fontSize: 32 }} />
              </Box>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#388E3C', mb: 0.5 }}>Subtopic Complete!</Typography>
          </Box>
        )}

        {/* ── Up Next: next subtopic lessons (only subtopic done, module not done) ── */}
        {subtopicComplete && !isModuleComplete && nextSubtopic && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#6B7280', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Up Next</Typography>
            <Box sx={{ borderRadius: '16px', border: `1.5px solid ${Math.round(getNodeCompletionPercent(nextSubtopic, statusData)) >= 70 ? '#388E3C' : PRIMARY}`, bgcolor: '#fff', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
                  {Math.round(getNodeCompletionPercent(nextSubtopic, statusData)) >= 70 ? (
                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                  ) : (
                    <>
                      <CircularProgress variant="determinate" value={100} size={32} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                      <CircularProgress variant="determinate" value={Math.round(getNodeCompletionPercent(nextSubtopic, statusData))} size={32} thickness={3.5} sx={{ color: PRIMARY }} />
                      <Typography sx={{ position: 'absolute', fontSize: 8, fontWeight: 700, color: PRIMARY }}>{Math.round(getNodeCompletionPercent(nextSubtopic, statusData))}%</Typography>
                    </>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}>{nextSubtopic.name}</Typography>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Completed {(nextSubtopic.children || []).filter((l: any) => isNodeDone(l, statusData)).length}/{(nextSubtopic.children || []).length} Lessons</Typography>
                </Box>
                <KeyboardArrowDownIcon sx={{ color: Math.round(getNodeCompletionPercent(nextSubtopic, statusData)) >= 70 ? '#388E3C' : PRIMARY, fontSize: 20 }} />
              </Box>
              {(nextSubtopic.children || []).map((lesson: any, idx: number) => (
                <Box key={lesson.identifier} onClick={() => router.push(`/learn/${courseId}/${moduleId}/${nextSubtopic.identifier}/${lesson.identifier}`)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: idx < (nextSubtopic.children || []).length - 1 ? '1px solid #F9FAFB' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#FFF7F0' } }}>
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0 }}>
                    {isNodeDone(lesson, statusData) ? (
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon sx={{ color: '#fff', fontSize: 16 }} />
                      </Box>
                    ) : (
                      <>
                        <CircularProgress variant="determinate" value={100} size={28} thickness={3} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                        <CircularProgress variant="determinate" value={Math.round(getNodeCompletionPercent(lesson, statusData))} size={28} thickness={3} sx={{ color: PRIMARY }} />
                        <Typography sx={{ position: 'absolute', fontSize: 8, fontWeight: 700, color: PRIMARY }}>{Math.round(getNodeCompletionPercent(lesson, statusData))}%</Typography>
                      </>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 12, color: 'text.primary' }}>{lesson.name}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Lesson</Typography>
                  </Box>
                  <ChevronRightIcon sx={{ color: isNodeDone(lesson, statusData) ? '#388E3C' : PRIMARY }} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── Current subtopic card ── */}
        <Box sx={{ mb: 2, borderRadius: '16px', overflow: 'hidden', border: `1.5px solid ${subtopicComplete ? SUCCESS : '#E5E7EB'}`, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 2 }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
              {subtopicComplete ? (
                <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 44 }} />
              ) : (
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress variant="determinate" value={100} size={40} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                  <CircularProgress variant="determinate" value={Math.round(lessons.length > 0 ? lessons.filter(l => isNodeDone(l, statusData)).length / lessons.length * 100 : 0)} size={40} thickness={4} sx={{ color: PRIMARY }} />
                  <Typography sx={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: PRIMARY }}>{Math.round(lessons.length > 0 ? lessons.filter(l => isNodeDone(l, statusData)).length / lessons.length * 100 : 0)}%</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, color: 'text.primary' }}>{subtopicName}</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.3 }}>
                {t('LEARNER_APP.LEARN.COMPLETED_LESSONS', { completed: lessons.filter(l => isNodeDone(l, statusData)).length, total: lessons.length })}
              </Typography>
              {subtopicDescription && <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', mt: 0.8 }}>{subtopicDescription}</Typography>}
            </Box>
          </Box>
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column' }}>
            {lessons.map((lesson: any, lIdx: number) => (
              <LessonNode key={lesson.identifier || lesson.id} lesson={lesson} courseId={courseId} moduleId={moduleId} subtopicId={subtopicId} statusData={statusData} isUnlocked={lIdx === 0 || isNodeDone(lessons[lIdx - 1], statusData)} prevNode={lIdx === 0 ? null : lessons[lIdx - 1]} router={router} t={t} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── CTA button ── */}
      <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, px: 2, py: 1.5, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', zIndex: 10 }}>
        {subtopicComplete && !nextSubtopic && !nextModule ? (
          <Button fullWidth variant="contained" onClick={() => router.push(`/learn/${courseId}/${moduleId}?view=module_completion`)} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            Module Completion
          </Button>
        ) : subtopicComplete && !nextSubtopic && nextModule ? (
          <Button fullWidth variant="contained" onClick={() => router.push(`/learn/${courseId}/${nextModule.identifier}`)} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {`Start ${nextModule.name}`}
          </Button>
        ) : subtopicComplete && nextSubtopic ? (
          <Button fullWidth variant="contained" onClick={() => router.push(`/learn/${courseId}/${moduleId}/${nextSubtopic.identifier}`)} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {`Start ${nextSubtopic.name}`}
          </Button>
        ) : firstIncomplete ? (
          <Button fullWidth variant="contained" onClick={() => router.push(`/learn/${courseId}/${moduleId}/${subtopicId}/${firstIncomplete.identifier}`)} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {`Start ${firstIncomplete.name}`}
          </Button>
        ) : null}
      </Box>
      <SwadhaarBottomNav />
    </Box>
  );
}
