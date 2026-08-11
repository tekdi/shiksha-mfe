'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Badge, Button, Snackbar, Alert, Collapse } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LockIcon from '@mui/icons-material/Lock';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { checkAuth } from '@shared-lib-v2/utils/AuthService';
import SwadhaarBottomNav from '@learner/components/Swadhaar/SwadhaarBottomNav';
import CFLHeader from '../../../../../../../libs/cfl/components/CFLHeader';
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
const PRIMARY = '#E6873C';
const SUCCESS = '#4CAF50';

export default function SubtopicDetailsPage() {
  const router = useRouter();
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const { tenant } = useTenant();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [moduleName, setModuleName] = useState<string>('');
  const [moduleDescription, setModuleDescription] = useState<string>('');
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
  const searchParams = useSearchParams();
  const isCFL = searchParams.get('isCFL') === 'true';
  const view = searchParams.get('view');

  React.useLayoutEffect(() => {
    if (typeof window !== 'undefined' && !checkAuth()) {
      window.location.replace('/swadhaar-login');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const trainerId = searchParams.get('trainerId');
      const userId = trainerId || localStorage.getItem('userId') || '';
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
      setModuleDescription(currentModule?.description || '');
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
      const active = processed.find((s: any) => s.isUnlocked && s.completionPercentage < 70) || processed[0];
      if (active) setExpandedSubtopicId(active.id);

      const levelDone = allModules.length > 0 && allModules.every(m => {
        const mPerc = getNodeCompletionPercent(m, status);
        return Math.round(mPerc) >= 70; // 70% threshold for level completion
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

  const isModuleComplete = subtopics.length > 0 && subtopics.every(s => s.completionPercentage >= 70);
  const isCourseOnlyLessons = courseModules.length > 0 && courseModules.every(m => m.mimeType !== 'application/vnd.ekstep.content-collection' && m.contentType !== 'CourseUnit' && m.contentType !== 'TextBookUnit');
  const isModuleOnlyLessons = subtopics.length > 0 && subtopics.every(s => s.isLesson);

  let effectiveView = view;

  const trainerName = searchParams.get('name') || '';

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header */}
      {isCFL ? (
        <CFLHeader title={moduleName || "Module Progress"} showBack onBack={() => router.back()} />
      ) : (
        <Box sx={{ bgcolor: 'background.paper', px: 1, py: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', top: 0, zIndex: 100 }}>
          <IconButton onClick={() => router.push('/learn')}><ArrowBackIcon sx={{ color: '#1A1A1A', fontSize: 20 }} /></IconButton>
          <Typography variant="h1" sx={{ fontWeight: 700, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleName}</Typography>
        </Box>
      )}

      <Box sx={{ px: 2, py: 2, flex: 1, pb: 22 }}>
        {(() => {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* ── Completion Hero Banner ── */}
              {effectiveView === 'module_completion' ? (
                /* Explicitly viewing Module Completion */
                <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '12px', p: 3, textAlign: 'center', border: '1px solid #E0E0E0' }}>
                  <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <Box sx={{ width: 96, height: 96, borderRadius: '50%', bgcolor: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="30.5" height="22.5" viewBox="0 0 31 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 11.5L11 20L28.5 2.5" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 22, fontFamily: 'Open sans', color: '#2E7D32', mb: 0.5 }}>{t('LEARNER_APP.LEARN.MODULE_COMPLETE')}</Typography>
                </Box>
              ) : effectiveView === 'course_completion' ? (
                /* Explicitly viewing Course Completion */
                <Box sx={{ bgcolor: '#F0F9F1', borderRadius: '24px', p: 4, textAlign: 'center', border: '1px solid #E0E0E0' }}>
                  <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: '#EDDF8E', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <Box sx={{ width: 96, height: 96, borderRadius: '50%', bgcolor: '#EDB712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="43.33" height="35.66" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 2.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L12 15.77 6.79 18.51l1-5.79L3.58 8.62l5.82-.85L12 2.5z"
                          fill="#FFFFFF"
                          stroke="#1E1E1E"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 22, color: '#2E7D32', fontFamily: 'Open sans', mb: 0.5 }}>{t('LEARNER_APP.LEARN.CONGRATULATIONS')}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#2E7D32', fontFamily: 'Open sans', fontWeight: 400, opacity: 0.7 }}>{`${t('LEARNER_APP.LEARN.YOU_HAVE_FINISHED')}${courseName}`}</Typography>
                </Box>
              ) : null}

              {/* ── Up Next: next module's subtopics (only when not last module) ── */}
              {/* {isModuleComplete && nextModule && (
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A',fontFamily:'Open sans', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('LEARNER_APP.LEARN.UP_NEXT')}</Typography>
                  <Box sx={{ borderRadius: '16px', border: `1.5px solid ${Math.round(getNodeCompletionPercent(nextModule, statusData)) >= 70 ? '#388E3C' : PRIMARY}`, bgcolor: '#fff', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A',fontFamily:'Open sans', mb: 1 }}>{nextModule.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: '#2E7D32',fontFamily:'Inter', fontWeight: 400 }}>
                          Completed {(nextModule.children || []).filter((s: any) => Math.round(getNodeCompletionPercent(s, statusData)) >= 70).length}/{(nextModule.children || []).length} Subtopics
                        </Typography>
                      </Box>
                      <KeyboardArrowRightIcon sx={{ color: Math.round(getNodeCompletionPercent(nextModule, statusData)) >= 70 ? '#388E3C' : PRIMARY, fontSize: 20 }} />
                    </Box>
                    {(nextModule.children || []).map((sub: any, idx: number) => (
                      <Box key={sub.identifier}
                        onClick={() => router.push(`/learn/${courseId}/${nextModule.identifier}/${sub.identifier}`)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: idx < (nextModule.children || []).length - 1 ? '1px solid #F9FAFB' : 'none', cursor: 'pointer', '&:hover': { bgcolor: '#FFF7F0' } }}>
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0 }}>
                          {Math.round(getNodeCompletionPercent(sub, statusData)) >= 70 ? (
                            <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckIcon sx={{ color: '#fff', fontSize: 16 }} />
                            </Box>
                          ) : (
                            <>
                              <CircularProgress variant="determinate" value={100} size={28} thickness={3} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                              <CircularProgress variant="determinate" value={Math.round(getNodeCompletionPercent(sub, statusData))} size={28} thickness={3} sx={{ color: PRIMARY }} />
                              <Typography sx={{ position: 'absolute', fontSize: 8, fontWeight: 700, color: PRIMARY }}>{Math.round(getNodeCompletionPercent(sub, statusData))}%</Typography>
                            </>
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#1A1A1A',fontFamily:'Inter', mb: 1 }}>{sub.name}</Typography>
                          <Typography sx={{ fontSize: 10, color: '#2E7D32',fontFamily:'Inter', fontWeight: 400 }}>Completed {(sub.children || []).filter((l: any) => isNodeDone(l, statusData)).length}/{(sub.children || []).length} Lessons</Typography>
                        </Box>
                        <KeyboardArrowRightIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )} */}

              {/* ── Full course hierarchy: only when course is done AND in course completion view ── */}
              {isModuleComplete && effectiveView === 'course_completion' && (
                <Box>
                  {(nextLevel ? nextLevel.children || [] : courseModules).map((mod: any, mIdx: number) => (
                    <HierarchyNode
                      key={mod.identifier}
                      node={mod}
                      courseId={nextLevel ? nextLevel.identifier : courseId}
                      moduleId={mod.identifier}
                      parentId={nextLevel ? nextLevel.identifier : courseId}
                      statusData={statusData}
                      isFirstLevel={true}
                      isParentUnlocked={mIdx === 0 || isNodeDone((nextLevel ? nextLevel.children || [] : courseModules)[mIdx - 1], statusData)}
                      prevNode={mIdx === 0 ? null : (nextLevel ? nextLevel.children || [] : courseModules)[mIdx - 1]}
                      t={t}
                      router={router}
                      isModuleNode={true}
                    />
                  ))}
                </Box>
              )}

              {/* ── Current Module: render subtopics directly (no module accordion wrapper) ── */}
              {effectiveView !== 'course_completion' && effectiveView !== 'module_completion' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {subtopics.map((sub: any, sIdx: number) => (
                    <HierarchyNode
                      key={sub.identifier || sub.id}
                      node={sub}
                      courseId={courseId}
                      moduleId={moduleId}
                      parentId={moduleId}
                      statusData={statusData}
                      isFirstLevel={true}
                      isParentUnlocked={sIdx === 0 || isNodeDone(subtopics[sIdx - 1], statusData)}
                      prevNode={sIdx === 0 ? null : subtopics[sIdx - 1]}
                      t={t}
                      router={router}
                      expandedSubtopicId={expandedSubtopicId}
                    />
                  ))}
                </Box>
              )}

              {effectiveView === 'module_completion' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A1A1A', fontFamily: 'Open sans', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('LEARNER_APP.LEARN.CURRENT_MODULE')}</Typography>
                  {courseModules.filter((m: any) => m.identifier === moduleId).map((mod: any) => (
                    <HierarchyNode
                      key={mod.identifier || mod.id}
                      node={mod}
                      courseId={courseId}
                      moduleId={mod.identifier || mod.id}
                      parentId={courseId}
                      statusData={statusData}
                      isFirstLevel={true}
                      isParentUnlocked={true}
                      t={t}
                      router={router}
                      expandedSubtopicId={mod.identifier || mod.id}
                      isModuleNode={true}
                    />
                  ))}
                </Box>
              )}
            </Box>
          );
        })()}
      </Box>

      {/* Fixed Bottom Buttons */}
      {(() => {
        const isCFLUser = isCFL || (typeof window !== 'undefined' && localStorage.getItem('userRole')?.trim()?.toUpperCase() === 'CFL');
        if (isCFL) return null;

        const isCompletionState = effectiveView === 'course_completion' || effectiveView === 'module_completion' || (isCourseOnlyLessons && isCourseComplete) || (isModuleOnlyLessons && isModuleComplete);
        const isTerminalState = isModuleComplete && !nextModule;

        const showStickyBox = isCompletionState || isTerminalState;
        if (!showStickyBox) return null;

        return (
          <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, px: 2, py: 1.5, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', zIndex: 10 }}>
            {effectiveView === 'course_completion' ? (
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
                }} sx={{ fontFamily: 'Open sans', borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 600, textTransform: 'none', py: 1.5, fontSize: 15 }}>
                  {certLoading ? <CircularProgress size={20} /> : t('LEARNER_APP.LEARN.DOWNLOAD_CERTIFICATE')}
                </Button>
                <Button variant="contained" fullWidth onClick={() => {
                  if (nextLevel) {
                    const firstModuleId = nextLevel.children?.[0]?.identifier;
                    if (firstModuleId) router.push(`/learn/${nextLevel.identifier}/${firstModuleId}`);
                    else router.push(`/learn/${nextLevel.identifier}`);
                  } else {
                    router.push('/learn');
                  }
                }} sx={{ fontFamily: 'Open sans', bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 600, textTransform: 'none', py: 1.5, fontSize: 15 }}>
                  {nextLevel ? t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextLevel.name }) : t('LEARNER_APP.LEARN.BACK_TO_LEARNING')}
                </Button>
              </Box>
            ) : effectiveView === 'module_completion' ? (
              <Button fullWidth variant="contained"
                onClick={() => nextModule ? router.push(`/learn/${courseId}/${nextModule.identifier}`) : router.push(`/learn/${courseId}/${moduleId}?view=course_completion`)}
                sx={{ fontFamily: 'Open sans', bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 600, textTransform: 'none', py: 1.5, fontSize: 15 }}>
                {nextModule ? t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextModule.name }) : t('LEARNER_APP.LEARN.COURSE_COMPLETION')}
              </Button>
            ) : isModuleComplete && nextModule && !isCFLUser ? (
              <Button fullWidth variant="contained"
                onClick={() => router.push(`/learn/${courseId}/${nextModule.identifier}`)}
                sx={{ fontFamily: 'Open sans', bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 600, textTransform: 'none', py: 1.5, fontSize: 15 }}>
                {t('LEARNER_APP.LEARN.START_MODULE', { moduleName: nextModule.name })}
              </Button>
            )
              // : isModuleComplete && !nextModule ? (
              //   <Button fullWidth variant="contained" onClick={() => router.push('/learn')} sx={{ fontFamily:'Open sans', bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 600, textTransform: 'none', py: 1.5, fontSize: 15 }}>
              //     Back to Learning
              //   </Button>
              // ) 
              : null}
          </Box>
        );
      })()}

      <CertificateModal
        open={showCertificate}
        setOpen={setShowCertificate}
        certificateId={certId}
        userName={typeof window !== 'undefined' ? (localStorage.getItem('firstName') || localStorage.getItem('name') || '') : ''}
        courseName={courseName}
      />

      {!isCFL && <SwadhaarBottomNav />}

      <Snackbar open={certSnackbar.open} autoHideDuration={4000} onClose={() => setCertSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: 90 }}>
        <Alert severity={certSnackbar.severity}>{certSnackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

/* ── Helpers ── */
// const ChevronRightIcon = ({ color = PRIMARY }: { color?: string }) => (
//   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
// );

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

const isNodeDone = (node: any, statusList: any[]): boolean => Math.round(getNodeCompletionPercent(node, statusList)) >= 70; // 70% threshold

/* ── Recursive Component ── */
interface HierarchyNodeProps {
  node: any; courseId: string; moduleId: string; parentId: string; statusData: any[]; isFirstLevel?: boolean; isParentUnlocked?: boolean; prevNode?: any; t: any; router: any; expandedSubtopicId?: string | null;
  onNonLeafClick?: (courseId: string, node: any) => void;
  isModuleNode?: boolean;
}
export function HierarchyNode({ node, courseId, moduleId, parentId, statusData, isFirstLevel = false, isParentUnlocked = true, prevNode = null, t, router, expandedSubtopicId, onNonLeafClick, isModuleNode = false }: HierarchyNodeProps) {
  const completionPercentage = Math.round(getNodeCompletionPercent(node, statusData));
  const isCompleted = completionPercentage >= 70;
  const isUnlocked = isParentUnlocked && (!prevNode || isNodeDone(prevNode, statusData));
  const isCurrent = isUnlocked && !isCompleted;
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  // For first-level subtopics: accordion expand/collapse
  const [isExpanded, setIsExpanded] = useState(
    isFirstLevel && (expandedSubtopicId === (node.identifier || node.id) || (isUnlocked && !isCompleted))
  );

  const searchParams = useSearchParams();
  const queryStr = searchParams.toString();
  const query = queryStr ? `?${queryStr}` : '';
  const isCFL = searchParams.get('isCFL') === 'true';

  const handleToggle = () => {
    if (!isUnlocked) return;
    if (onNonLeafClick && !isLeaf) {
      onNonLeafClick(courseId, node);
    } else if (isLeaf) {
      if (isCFL) {
        return; // Disable lesson opening for CFL Trainer view
      }
      // Leaf lesson: navigate to player
      router.push(`/learn/${courseId}/${moduleId}/${parentId}/${node.identifier || node.id}${query}`);
    } else if (isFirstLevel) {
      setIsExpanded(v => !v);
    } else {
      router.push(`/learn/${courseId}/${moduleId}/${node.identifier || node.id}${query}`);
    }
  };

  const borderColor = isCompleted ? SUCCESS : (isCurrent ? PRIMARY : '#E5E7EB');

  if (isFirstLevel) {
    return (
      <Box sx={{
        mb: 2,
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1.5px solid ${borderColor}`,
        bgcolor: 'background.paper',
        opacity: isUnlocked ? 1 : 0.7,
      }}>
        <Box
          onClick={handleToggle}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            px: 2,
            py: 2,
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            '&:hover': { bgcolor: isUnlocked ? 'rgba(0,0,0,0.01)' : undefined },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#1A1A1A', fontFamily: 'Inter', lineHeight: 1.3 }}>
              {node.name}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#999999', fontFamily: 'Inter', fontWeight: 400, mt: 0.3 }}>
              {isModuleNode
                ? `Completed ${(node.children || []).filter((c: any) => isNodeDone(c, statusData)).length}/${(node.children || []).length} Subtopics`
                : t('LEARNER_APP.LEARN.COMPLETED_LESSONS', {
                  completed: (node.children || []).filter((c: any) => isNodeDone(c, statusData)).length,
                  total: (node.children || []).length,
                })}
            </Typography>
            {isExpanded && !isCFL && node.description && (
              <Typography sx={{ fontSize: 10, color: '#999999', fontFamily: 'Inter', fontWeight: 400, mt: 0.5, lineHeight: 1.3 }}>
                {node.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {isExpanded ? (
              <UnfoldLessRoundedIcon sx={{ color: !isUnlocked ? '#D1D5DB' : (isCompleted ? SUCCESS : PRIMARY) }} />
            ) : (
              <UnfoldMoreRoundedIcon sx={{ color: !isUnlocked ? '#D1D5DB' : (isCompleted ? SUCCESS : PRIMARY) }} />
            )}
          </Box>
        </Box>

        {!isLeaf && (
          <Collapse in={isExpanded && isUnlocked}>
            <Box sx={{ pl: '10px', pr: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(node.children || []).map((child: any, cIdx: number) => (
                <HierarchyNode
                  key={child.identifier || child.id}
                  node={child}
                  courseId={courseId}
                  moduleId={moduleId}
                  parentId={node.identifier || node.id}
                  statusData={statusData}
                  isFirstLevel={false}
                  isParentUnlocked={isUnlocked}
                  prevNode={cIdx === 0 ? null : node.children[cIdx - 1]}
                  t={t}
                  router={router}
                  onNonLeafClick={onNonLeafClick}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 1, opacity: isUnlocked ? 1 : 0.7 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Status icon outside card */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0 }}>
          {!isUnlocked
            ? <LockIcon sx={{ color: '#9CA3AF', fontSize: 24 }} />
            : isCompleted
              ? <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 40 }} />
              : (
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress variant="determinate" value={100} size={40} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                  <CircularProgress variant="determinate" value={completionPercentage} size={40} thickness={3.5} sx={{ color: completionPercentage > 0 ? PRIMARY : 'transparent' }} />
                  <Typography sx={{ position: 'absolute', fontSize: 10, fontWeight: 700, color: completionPercentage > 0 ? PRIMARY : '#9CA3AF' }}>{completionPercentage}%</Typography>
                </Box>
              )}
        </Box>

        {/* Card */}
        <Box
          onClick={handleToggle}
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            border: `1.5px solid ${isCurrent ? PRIMARY : (isCompleted ? SUCCESS : '#E5E7EB')}`,
            borderRadius: '16px',
            bgcolor: '#fff',
            '&:hover': { bgcolor: isUnlocked ? '#FFF7F0' : undefined },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 12, color: '#1A1A1A', fontFamily: 'Inter', lineHeight: 1.3 }}>
              {node.name}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#999999', fontFamily: 'Inter', fontWeight: 400, mt: 0.3 }}>
              {t('LEARNER_APP.LEARN.LESSON')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isCompleted ? (
              <ArrowForwardRoundedIcon sx={{ color: SUCCESS }} />
            ) : isUnlocked ? (
              <ArrowForwardIcon sx={{ color: PRIMARY }} />
            ) : (
              <ArrowForwardIcon sx={{ color: '#D1D5DB' }} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
