'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Badge, Button, Snackbar, Alert, Collapse } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useRouter, useParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import {
  getCourseHierarchy,
  getContentCourseStatus,
  trackCourseClick,
  fetchSwadhaarLevelCourses,
} from '@learner/utils/API/SwadhaarService';
import { issueCertificate, downloadCertificate } from '@shared-lib-v2/utils/CertificateService/coursesCertificates';
import { sendCourseCompleteNotification } from '@learner/utils/API/NotificationService';
import { useTenant } from '@learner/context/TenantContext';
import { CertificateModal, useTranslation } from '@shared-lib';
import { telemetryFactory } from '@learner/utils/telemtery';
import { addAlert, getUnreadCount } from '@learner/utils/alertsStore';
import CircleNotificationsRoundedIcon from '@mui/icons-material/CircleNotificationsRounded';

const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

export default function SubtopicDetailsPage() {
  const router = useRouter();
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [moduleName, setModuleName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextModule, setNextModule] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [nextModuleStatus, setNextModuleStatus] = useState<any[]>([]);
  
  const [certLoading, setCertLoading] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [courseModules, setCourseModules] = useState<any[]>([]);
  const [certSnackbar, setCertSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
  const [expandedSubtopicId, setExpandedSubtopicId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certId, setCertId] = useState('');

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/swadhaar-login');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId') || '';
      const tenantId = localStorage.getItem('tenantId') || tenant?.tenantId || '';

      const courseHierarchy = await getCourseHierarchy(courseId);
      setCourseName(courseHierarchy?.name || '');
      const allModules: any[] = courseHierarchy?.children || [];
      setCourseModules(allModules);

      const findNode = (nodes: any[], id: string): any => {
        for (const n of nodes) {
          if (n.identifier === id) return n;
          if (n.children && n.children.length > 0) {
            const found = findNode(n.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const currentModule = findNode(allModules, moduleId);
      setModuleName(currentModule?.name || t('LEARNER_APP.LEARN.PAGE_TITLE'));
      const rawSubtopics = currentModule?.children || [];

      const collectAllIds = (nodes: any[]): string[] => {
        const ids: string[] = [];
        nodes.forEach((n: any) => {
          ids.push(n.identifier);
          if (n.children && n.children.length > 0) ids.push(...collectAllIds(n.children));
        });
        return ids;
      };

      const allIds = [...new Set([courseId, moduleId, ...collectAllIds(rawSubtopics)])];
      let status: any[] = [];
      if (userId && allIds.length && tenantId) {
        status = await getContentCourseStatus([userId], allIds, tenantId).catch(() => []);
      }

      // Apply sessionStorage progress guard — same guard as the lesson page.
      // If the user was watching a lesson in this browser session and the backend
      // auto-completed it (premature), we restore the locally-tracked in-progress value
      // so the module list doesn't incorrectly show a green checkmark.
      try {
        const raw = sessionStorage.getItem('swadhaar_progress_guard');
        const guard: Record<string, { percentage: number; status: number }> = raw ? JSON.parse(raw) : {};
        status = status.map(item => {
          const sessionEntry = guard[item.contentId];
          if (sessionEntry && sessionEntry.status === 1 && item.status === 2) {
            return {
              ...item,
              status: 1,
              completionPercentage: sessionEntry.percentage,
            };
          }
          return item;
        });
      } catch { /* sessionStorage not available (SSR), no-op */ }

      setStatusData(status);

      // Filter and process subtopics
      const filterHierarchy = (items: any[]): any[] =>
        items.map((item: any) => ({
          ...item,
          children: item.children ? filterHierarchy(item.children) : undefined
        })).filter((item: any) => {
          const isContainer = item.mimeType === 'application/vnd.ekstep.content-collection' || item.contentType === 'CourseUnit' || item.contentType === 'TextBookUnit';
          if (item.children) return item.children.length > 0;
          return !isContainer;
        });

      const filteredSubtopics = filterHierarchy(rawSubtopics);
      
      const processed = filteredSubtopics.map((sub: any, idx: number, filteredSubs: any[]) => {
        const lessons = sub.children || [];
        const isLesson = lessons.length === 0;
        const perc = getNodeCompletionPercent(sub, status);
        const prevSub = idx === 0 ? null : filteredSubs[idx - 1];
        const isUnlocked = idx === 0 || isNodeDone(prevSub, status);

        return {
          ...sub,
          id: sub.identifier,
          name: sub.name,
          completionPercentage: perc,
          isUnlocked,
          rawLessons: lessons,
          isLesson: lessons.length === 0
        };
      });

      setSubtopics(processed);
      const active = processed.find((s: any) => s.isUnlocked && s.completionPercentage < 100) || processed[0];
      if (active) setExpandedSubtopicId(active.id);

      const levelDone = allModules.length > 0 && allModules.every(m => {
        const mPerc = getNodeCompletionPercent(m, status);
        return Math.round(mPerc) >= 100;
      });
      setIsLevelComplete(levelDone);

      const currentModuleIdx = allModules.findIndex((m: any) => m.identifier === moduleId);
      const next = currentModuleIdx >= 0 && currentModuleIdx < allModules.length - 1 ? allModules[currentModuleIdx + 1] : null;
      setNextModule(next);

      if (!next) {
        const allLevelCourses: any[] = await fetchSwadhaarLevelCourses();
        const currentLevelIdx = allLevelCourses.findIndex((l: any) => l.identifier === courseId);
        const nextLev = currentLevelIdx >= 0 && currentLevelIdx < allLevelCourses.length - 1 ? allLevelCourses[currentLevelIdx + 1] : null;
        if (nextLev) {
          const nextLevHierarchy = await getCourseHierarchy(nextLev.identifier);
          setNextLevel(nextLevHierarchy);

          // Fetch status for next level to show real progress in preview
          if (userId && tenantId) {
            const nextLevIds = (nextLevHierarchy?.children || []).map((m: any) => m.identifier);
            if (nextLevIds.length > 0) {
              const nextStatus = await getContentCourseStatus([userId], [nextLev.identifier, ...nextLevIds], tenantId).catch(() => []);
              // Merge with current status
              setStatusData(prev => [...prev, ...nextStatus]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading subtopics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, courseId, tenant, t]);

  useEffect(() => { 
    loadData();
    setUnreadCount(getUnreadCount());
  }, [loadData]);

  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.eid === 'END' || data?.eid === 'SUMMARY') loadData();
      } catch (e) { }
    };
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [loadData]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  const isModuleComplete = subtopics.length > 0 && subtopics.every(s => s.completionPercentage >= 100);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'background.paper', px: 1, py: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100 }}>
        <IconButton onClick={() => router.push('/learn')}><ArrowBackIcon sx={{ color: '#E6873C', fontSize: 20 }} /></IconButton>
        <Typography variant="h1" sx={{ fontWeight: 700, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleName}</Typography>
        <Box onClick={() => router.push('/alerts')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', px: 1 }}>
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16, backgroundColor: '#FFFFFF', color: '#E6873C', border: '1px solid #E6873C', top: 2, right: 2 } }}>
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(230,135,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircleNotificationsRoundedIcon sx={{ fontSize: 24, color: '#E6873C' }} /></Box>
          </Badge>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: PRIMARY, mt: 0.5 }}>{t('LEARNER_APP.ALERTS.TITLE')}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 2, flex: 1, pb: 22 }}>
        {(() => {
          const currentIdx = subtopics.findIndex(s => s.isUnlocked && s.completionPercentage < 100);
          const current = currentIdx >= 0 ? subtopics[currentIdx] : subtopics[0];
          const prevSub = currentIdx > 0 ? subtopics[currentIdx - 1] : null;
          const showSubtopicComplete = !isModuleComplete && prevSub && prevSub.completionPercentage >= 100;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Milestone Hero Section */}
              <Box>
                {(isModuleComplete && nextModule) ? (
                  <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '24px', p: 4, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#6DBB6D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon sx={{ color: '#fff', fontSize: 32 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#388E3C', mb: 0.5 }}>{t('LEARNER_APP.MODULE_COMPLETE') !== 'LEARNER_APP.MODULE_COMPLETE' ? t('LEARNER_APP.MODULE_COMPLETE') : 'Module Complete!'}</Typography>
                  </Box>
                ) : isLevelComplete ? (
                  <Box sx={{ bgcolor: '#F0F9F1', borderRadius: '24px', p: 4, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <Box sx={{ width: 76, height: 76, borderRadius: '50%', bgcolor: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StarRoundedIcon sx={{ fontSize: 48, color: '#fff', stroke: '#1F2937', strokeWidth: 1.5 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 26, color: '#065F46', mb: 0.5 }}>{t('LEARNER_APP.HOME.CONGRATULATIONS') !== 'LEARNER_APP.HOME.CONGRATULATIONS' ? t('LEARNER_APP.HOME.CONGRATULATIONS') : 'Congratulations!'}</Typography>
                    <Typography sx={{ fontSize: 14, color: '#065F46', fontWeight: 500, opacity: 0.7 }}>{t('LEARNER_APP.HOME.FINISHED_COURSE', { courseName }) !== 'LEARNER_APP.HOME.FINISHED_COURSE' ? t('LEARNER_APP.HOME.FINISHED_COURSE', { courseName }) : `You have finished ${courseName}`}</Typography>
                  </Box>
                ) : isModuleComplete ? (
                  // Fallback for module completion when no next module but level check failed or is ambiguous
                  <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '24px', p: 4, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#6DBB6D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon sx={{ color: '#fff', fontSize: 32 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#388E3C', mb: 0.5 }}>{t('LEARNER_APP.MODULE_COMPLETE') !== 'LEARNER_APP.MODULE_COMPLETE' ? t('LEARNER_APP.MODULE_COMPLETE') : 'Module Complete!'}</Typography>
                  </Box>
                ) : showSubtopicComplete ? (
                  <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '24px', p: 4, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#6DBB6D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon sx={{ color: '#fff', fontSize: 32 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#388E3C', mb: 0.5 }}>{t('LEARNER_APP.LEARN.SUBTOPIC_COMPLETE') !== 'LEARNER_APP.LEARN.SUBTOPIC_COMPLETE' ? t('LEARNER_APP.LEARN.SUBTOPIC_COMPLETE') : 'Subtopic Complete!'}</Typography>
                  </Box>
                ) : null}
              </Box>

              {/* Up Next / Next Level Section (Only for Level Completion) */}
              <Box>
                {isLevelComplete && nextLevel && (
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#1F2937', mb: 2 }}>{nextLevel.name} {t('LEARNER_APP.LEARN.UNLOCKED') !== 'LEARNER_APP.LEARN.UNLOCKED' ? t('LEARNER_APP.LEARN.UNLOCKED') : 'Unlocked'}</Typography>
                    <HierarchyNode node={{...nextLevel, id: nextLevel.identifier}} courseId={nextLevel.identifier} moduleId={nextLevel.children?.[0]?.identifier || ''} parentId={nextLevel.identifier} statusData={statusData} isFirstLevel={true} isParentUnlocked={true} t={t} router={router} />
                  </Box>
                )}
              </Box>

              {/* Current Module Hierarchy (Collapsible) */}
              <Box>
                <HierarchyNode 
                  node={{
                    id: moduleId,
                    identifier: moduleId,
                    name: moduleName,
                    children: subtopics
                  }} 
                  courseId={courseId} 
                  moduleId={moduleId} 
                  parentId={courseId} 
                  statusData={statusData} 
                  isFirstLevel={true} 
                  isParentUnlocked={true} 
                  t={t} 
                  router={router} 
                  expandedSubtopicId={expandedSubtopicId}
                />
              </Box>
            </Box>
          );
        })()}
      </Box>

      {/* Fixed Bottom Buttons */}
      <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, px: 2, py: 1.5, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', zIndex: 10 }}>
        {isLevelComplete && !nextModule ? (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth disabled={certLoading} onClick={async () => {
               try {
                 setCertLoading(true);
                 const userId = localStorage.getItem('userId') || '';
                 const firstName = localStorage.getItem('firstName') || localStorage.getItem('name') || 'Learner';
                 const lastName = localStorage.getItem('lastName') || '';
                 const templateId = localStorage.getItem('templtateId') || 'temp';
                 const issueResult = await issueCertificate({ userId, courseId, courseName, issuanceDate: new Date().toISOString(), expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString(), credentialId: templateId, firstName, middleName: '', lastName });
                 setCertId(issueResult?.credential?.id || 'temp');
                 setShowCertificate(true);
               } catch (err) { console.error('Cert error:', err); } finally { setCertLoading(false); }
            }} sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
              {certLoading ? <CircularProgress size={20} /> : (t('LEARNER_APP.PROFILE.DOWNLOAD_CERTIFICATE') !== 'LEARNER_APP.PROFILE.DOWNLOAD_CERTIFICATE' ? t('LEARNER_APP.PROFILE.DOWNLOAD_CERTIFICATE') : 'Download Certificate')}
            </Button>
            <Button variant="contained" fullWidth onClick={() => { 
              if (nextLevel) {
                // If the next course level has modules, navigate to the first one
                const firstModuleId = nextLevel.children?.[0]?.identifier;
                if (firstModuleId) router.push(`/learn/${nextLevel.identifier}/${firstModuleId}`);
                else router.push(`/learn/${nextLevel.identifier}`);
              } else {
                router.push('/learn');
              }
            }} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
              {t('LEARNER_APP.LEARN.START_NEXT_LEVEL')}
            </Button>
          </Box>
        ) : (
          <Button fullWidth variant="contained" 
            onClick={() => {
              if (isModuleComplete && nextModule) router.push(`/learn/${courseId}/${nextModule.identifier}`);
              else {
                const findFirstIncomplete = (node: any): any => {
                  if (!node.children || node.children.length === 0) return node;
                  const incomplete = (node.children || []).find((c: any) => Math.round(getNodeCompletionPercent(c, statusData)) < 100) || node.children[0];
                  return findFirstIncomplete(incomplete);
                };

                const currentSubtopic = subtopics.find(s => s.isUnlocked && s.completionPercentage < 100) || subtopics[0];
                if (currentSubtopic) {
                  const lesson = findFirstIncomplete(currentSubtopic);
                  const parentId = currentSubtopic.identifier === lesson.identifier ? moduleId : currentSubtopic.identifier;
                  router.push(`/learn/${courseId}/${moduleId}/${parentId}/${lesson.identifier || lesson.id}`);
                }
              }
            }}
            sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {isModuleComplete ? (nextModule ? (t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextModule.name }) !== 'LEARNER_APP.LEARN.START_MODULE' ? t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextModule.name }) : `Start ${nextModule.name}`) : t('LEARNER_APP.LEARN.BACK_TO_LEARNING')) 
              : (() => {
                  const findFirstIncomplete = (node: any): any => {
                    if (!node.children || node.children.length === 0) return node;
                    const incomplete = (node.children || []).find((c: any) => Math.round(getNodeCompletionPercent(c, statusData)) < 100) || node.children[0];
                    return findFirstIncomplete(incomplete);
                  };
                  const currentSubtopic = subtopics.find(s => s.isUnlocked && s.completionPercentage < 100) || subtopics[0];
                  const lesson = currentSubtopic ? findFirstIncomplete(currentSubtopic) : null;
                  const name = lesson?.name || currentSubtopic?.name || '';
                  return t('LEARNER_APP.LEARN.START_SUBTOPIC', { subtopicName: name }) !== 'LEARNER_APP.LEARN.START_SUBTOPIC' ? t('LEARNER_APP.LEARN.START_SUBTOPIC', { subtopicName: name }) : `Start ${name}`;
                })()}
          </Button>
        )}
      </Box>

      <CertificateModal 
        open={showCertificate} 
        setOpen={setShowCertificate} 
        certificateId={certId}
        userName={typeof window !== 'undefined' ? (localStorage.getItem('firstName') || localStorage.getItem('name') || '') : ''}
        courseName={courseName}
      />

      <SwadhaarBottomNav />

      <Snackbar open={certSnackbar.open} autoHideDuration={4000} onClose={() => setCertSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: 90 }}>
        <Alert severity={certSnackbar.severity}>{certSnackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

/* ── Helpers ── */
const ChevronRightIcon = ({ color = PRIMARY }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
);

const getNodeCompletionPercent = (node: any, statusList: any[]): number => {
  if (!node) return 0;
  const children = node.children || [];
  if (Array.isArray(children) && children.length > 0) {
    const childPercs = children.map((c: any) => getNodeCompletionPercent(c, statusList));
    return childPercs.length > 0 ? childPercs.reduce((a: number, b: number) => a + b, 0) / childPercs.length : 0;
  }
  const found = statusList.find((d: any) => d.contentId === (node.identifier || node.id));
  return found?.completionPercentage ?? (found?.status === 2 ? 100 : 0);
};

const isNodeDone = (node: any, statusList: any[]): boolean => Math.round(getNodeCompletionPercent(node, statusList)) >= 100;

/* ── Recursive Component ── */
interface HierarchyNodeProps {
  node: any; courseId: string; moduleId: string; parentId: string; statusData: any[]; isFirstLevel?: boolean; isParentUnlocked?: boolean; prevNode?: any; t: any; router: any; expandedSubtopicId?: string | null;
}
export function HierarchyNode({ node, courseId, moduleId, parentId, statusData, isFirstLevel = false, isParentUnlocked = true, prevNode = null, t, router, expandedSubtopicId }: HierarchyNodeProps) {
  const completionPercentage = Math.round(getNodeCompletionPercent(node, statusData));
  const isCompleted = completionPercentage >= 100;
  const [isLocalExpanded, setIsLocalExpanded] = useState((isFirstLevel && expandedSubtopicId === node.id) || isCompleted);
  const isUnlocked = isParentUnlocked && (!prevNode || isNodeDone(prevNode, statusData));
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  const handleToggle = () => {
    if (isUnlocked) {
      if (isLeaf) router.push(`/learn/${courseId}/${moduleId}/${parentId}/${node.identifier || node.id}`);
      else setIsLocalExpanded(!isLocalExpanded);
    }
  };

  return (
    <Box sx={{ mb: isFirstLevel ? 2 : 0, borderRadius: '16px', overflow: 'hidden', border: isFirstLevel ? `1.5px solid ${isLocalExpanded ? PRIMARY : '#E5E7EB'}` : 'none', bgcolor: isFirstLevel ? 'background.paper' : 'transparent', opacity: isUnlocked ? 1 : 0.7 }}>
      <Box onClick={handleToggle} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: isFirstLevel ? 2 : 1.5, cursor: isUnlocked ? 'pointer' : 'not-allowed', border: !isFirstLevel ? `1.5px solid ${isUnlocked ? (isCompleted ? SUCCESS : (isLocalExpanded ? PRIMARY : '#F3F4F6')) : '#F3F4F6'}` : 'none', borderRadius: !isFirstLevel ? '16px' : 0, bgcolor: !isFirstLevel ? '#fff' : 'transparent', mb: !isFirstLevel ? 1.5 : 0 }}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isFirstLevel ? 44 : 28, height: isFirstLevel ? 44 : 28, flexShrink: 0 }}>
          {!isUnlocked ? <LockIcon sx={{ color: '#C0C4CC', fontSize: isFirstLevel ? 28 : 20 }} /> : isCompleted ? <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: isFirstLevel ? 44 : 28 }} /> : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={isFirstLevel ? 40 : 28} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={completionPercentage} size={isFirstLevel ? 40 : 28} thickness={4} sx={{ color: completionPercentage > 0 ? PRIMARY : 'transparent' }} />
              <Typography sx={{ position: 'absolute', fontSize: isFirstLevel ? 10 : 8, fontWeight: 700, color: completionPercentage > 0 ? PRIMARY : '#9CA3AF' }}>{completionPercentage}%</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: isFirstLevel ? 800 : 600, fontSize: isFirstLevel ? 14 : 13, color: 'text.primary' }}>{node.name}</Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{isLeaf ? t('LEARNER_APP.LEARN.LESSON') : t('LEARNER_APP.LEARN.COMPLETED_LESSONS', { completed: (node.children || []).filter((c: any) => isNodeDone(c, statusData)).length, total: (node.children || []).length })}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>{isUnlocked && (isLeaf ? <ChevronRightIcon color={isCompleted ? SUCCESS : PRIMARY} /> : (isLocalExpanded ? <KeyboardArrowUpIcon sx={{ color: PRIMARY }} /> : <KeyboardArrowDownIcon sx={{ color: PRIMARY }} />))}</Box>
      </Box>
      {!isLeaf && <Collapse in={isLocalExpanded && isUnlocked}><Box sx={{ px: 2, pb: 2, pl: isFirstLevel ? 2 : 4, borderLeft: !isFirstLevel ? '1.5px dashed #E5E7EB' : 'none', ml: !isFirstLevel ? 1.5 : 0, display: 'flex', flexDirection: 'column', gap: isFirstLevel ? 0 : 0 }}>
        {(node.children || []).map((child: any, cIdx: number) => (
          <HierarchyNode key={child.identifier || child.id} node={child} courseId={courseId} moduleId={moduleId} parentId={node.identifier || node.id} statusData={statusData} isFirstLevel={false} isParentUnlocked={isUnlocked} prevNode={cIdx === 0 ? null : node.children[cIdx - 1]} t={t} router={router} />
        ))}
      </Box></Collapse>}
    </Box>
  );
}
