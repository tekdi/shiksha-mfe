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
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
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
  const view = searchParams.get('view');

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
  if (!effectiveView && isModuleComplete) {
    if (isCourseOnlyLessons && !nextModule) {
      effectiveView = 'course_completion';
    } else if (isModuleOnlyLessons) {
      effectiveView = 'module_completion';
    }
  }

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
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* ── Completion Hero Banner ── */}
              {effectiveView === 'module_completion' ? (
                /* Explicitly viewing Module Completion */
                <Box sx={{ bgcolor: '#ECF5EE', borderRadius: '24px', p: 3, textAlign: 'center' }}>
                  <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#6DBB6D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon sx={{ color: '#fff', fontSize: 32 }} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#388E3C', mb: 0.5 }}>Module Complete!</Typography>
                </Box>
              ) : effectiveView === 'course_completion' ? (
                /* Explicitly viewing Course Completion */
                <Box sx={{ bgcolor: '#F0F9F1', borderRadius: '24px', p: 4, textAlign: 'center' }}>
                  <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                    <Box sx={{ width: 76, height: 76, borderRadius: '50%', bgcolor: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StarRoundedIcon sx={{ fontSize: 48, color: '#fff', stroke: '#1F2937', strokeWidth: 1.5 }} />
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 26, color: '#065F46', mb: 0.5 }}>{t('LEARNER_APP.HOME.CONGRATULATIONS') !== 'LEARNER_APP.HOME.CONGRATULATIONS' ? t('LEARNER_APP.HOME.CONGRATULATIONS') : 'Congratulations!'}</Typography>
                  <Typography sx={{ fontSize: 14, color: '#065F46', fontWeight: 500, opacity: 0.7 }}>{`You have finished ${courseName}`}</Typography>
                </Box>
              ) : null}

              {/* ── Up Next: next module's subtopics (only when not last module) ── */}
              {isModuleComplete && nextModule && (
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#6B7280', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Up Next</Typography>
                  <Box sx={{ borderRadius: '16px', border: `1.5px solid ${Math.round(getNodeCompletionPercent(nextModule, statusData)) >= 70 ? '#388E3C' : PRIMARY}`, bgcolor: '#fff', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, flexShrink: 0 }}>
                        {Math.round(getNodeCompletionPercent(nextModule, statusData)) >= 70 ? (
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#388E3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
                          </Box>
                        ) : (
                          <>
                            <CircularProgress variant="determinate" value={100} size={36} thickness={3.5} sx={{ color: '#E5E7EB', position: 'absolute' }} />
                            <CircularProgress variant="determinate" value={Math.round(getNodeCompletionPercent(nextModule, statusData))} size={36} thickness={3.5} sx={{ color: PRIMARY }} />
                            <Typography sx={{ position: 'absolute', fontSize: 8, fontWeight: 700, color: PRIMARY }}>{Math.round(getNodeCompletionPercent(nextModule, statusData))}%</Typography>
                          </>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.primary' }}>{nextModule.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                          Completed {(nextModule.children || []).filter((s: any) => Math.round(getNodeCompletionPercent(s, statusData)) >= 70).length}/{(nextModule.children || []).length} Subtopics
                        </Typography>
                      </Box>
                      <KeyboardArrowDownIcon sx={{ color: Math.round(getNodeCompletionPercent(nextModule, statusData)) >= 70 ? '#388E3C' : PRIMARY, fontSize: 20 }} />
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
                          <Typography sx={{ fontWeight: 600, fontSize: 12, color: 'text.primary' }}>{sub.name}</Typography>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Completed {(sub.children || []).filter((l: any) => isNodeDone(l, statusData)).length}/{(sub.children || []).length} Lessons</Typography>
                        </Box>
                        <KeyboardArrowRightIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* ── Full course hierarchy: only when course is done AND in course completion view ── */}
              {isModuleComplete && effectiveView === 'course_completion' && (
                <Box>
                  {courseModules.map((mod: any, mIdx: number) => (
                    <HierarchyNode
                      key={mod.identifier}
                      node={mod}
                      courseId={courseId}
                      moduleId={mod.identifier}
                      parentId={courseId}
                      statusData={statusData}
                      isFirstLevel={true}
                      isParentUnlocked={mIdx === 0 || isNodeDone(courseModules[mIdx - 1], statusData)}
                      prevNode={mIdx === 0 ? null : courseModules[mIdx - 1]}
                      t={t}
                      router={router}
                    />
                  ))}
                </Box>
              )}

              {/* ── Current Module Hierarchy (when not in course completion view) ── */}
              {effectiveView !== 'course_completion' && (
                <Box>
                  <HierarchyNode
                    node={{
                      id: moduleId,
                      identifier: moduleId,
                      name: moduleName,
                      description: moduleDescription,
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
              )}
            </Box>
          );
        })()}
      </Box>

      {/* Fixed Bottom Buttons */}
      <Box sx={{ position: 'fixed', bottom: 65, left: 0, right: 0, px: 2, py: 1.5, bgcolor: '#fff', borderTop: '1px solid #F3F4F6', zIndex: 10 }}>
        {effectiveView === 'course_completion' ? (
          /* Explicit Course Completion View: Download Cert + Start Next Level */
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
              {certLoading ? <CircularProgress size={20} /> : 'Download Certificate'}
            </Button>
            <Button variant="contained" fullWidth onClick={() => {
              if (nextLevel) {
                const firstModuleId = nextLevel.children?.[0]?.identifier;
                if (firstModuleId) router.push(`/learn/${nextLevel.identifier}/${firstModuleId}`);
                else router.push(`/learn/${nextLevel.identifier}`);
              } else {
                router.push('/learn');
              }
            }} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
              {nextLevel ? `Start ${nextLevel.name}` : 'Back to Learning'}
            </Button>
          </Box>
        ) : effectiveView === 'module_completion' ? (
          /* Explicit Module Completion View: Click to proceed to Course Completion */
          <Button fullWidth variant="contained"
            onClick={() => router.push(`/learn/${courseId}/${moduleId}?view=course_completion`)}
            sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            Course Completion
          </Button>
        ) : isModuleComplete && nextModule ? (
          /* Module done, next module exists: Start [next module name] */
          <Button fullWidth variant="contained"
            onClick={() => router.push(`/learn/${courseId}/${nextModule.identifier}`)}
            sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {`Start ${nextModule.name}`}
          </Button>
        ) : isModuleComplete && !nextModule ? (
          /* Default Module View for completed module */
          <Button fullWidth variant="contained" onClick={() => router.push('/learn')} sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            Back to Learning
          </Button>
        ) : (
          /* Module in progress: Start next lesson */
          <Button fullWidth variant="contained"
            onClick={() => {
              const findFirstIncomplete = (node: any): any => {
                if (!node.children || node.children.length === 0) return node;
                const incomplete = (node.children || []).find((c: any) => Math.round(getNodeCompletionPercent(c, statusData)) < 70) || node.children[0];
                return findFirstIncomplete(incomplete);
              };
              const currentSubtopic = subtopics.find(s => s.isUnlocked && s.completionPercentage < 70) || subtopics[0];
              if (currentSubtopic) {
                const lesson = findFirstIncomplete(currentSubtopic);
                const parentId = currentSubtopic.identifier === lesson.identifier ? moduleId : currentSubtopic.identifier;
                router.push(`/learn/${courseId}/${moduleId}/${parentId}/${lesson.identifier || lesson.id}`);
              }
            }}
            sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.5, fontSize: 15 }}>
            {(() => {
              const findFirstIncomplete = (node: any): any => {
                if (!node.children || node.children.length === 0) return node;
                const incomplete = (node.children || []).find((c: any) => Math.round(getNodeCompletionPercent(c, statusData)) < 70) || node.children[0];
                return findFirstIncomplete(incomplete);
              };
              const currentSubtopic = subtopics.find(s => s.isUnlocked && s.completionPercentage < 70) || subtopics[0];
              const lesson = currentSubtopic ? findFirstIncomplete(currentSubtopic) : null;
              return `Start ${lesson?.name || currentSubtopic?.name || ''}`;
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

const isNodeDone = (node: any, statusList: any[]): boolean => Math.round(getNodeCompletionPercent(node, statusList)) >= 70; // 70% threshold

/* ── Recursive Component ── */
interface HierarchyNodeProps {
  node: any; courseId: string; moduleId: string; parentId: string; statusData: any[]; isFirstLevel?: boolean; isParentUnlocked?: boolean; prevNode?: any; t: any; router: any; expandedSubtopicId?: string | null;
  onNonLeafClick?: (courseId: string, node: any) => void;
}
export function HierarchyNode({ node, courseId, moduleId, parentId, statusData, isFirstLevel = false, isParentUnlocked = true, prevNode = null, t, router, expandedSubtopicId, onNonLeafClick }: HierarchyNodeProps) {
  const completionPercentage = Math.round(getNodeCompletionPercent(node, statusData));
  const isCompleted = completionPercentage >= 70; // green check at 70%+
  const [isLocalExpanded, setIsLocalExpanded] = useState((isFirstLevel && expandedSubtopicId === node.id) || isCompleted);
  const isUnlocked = isParentUnlocked && (!prevNode || isNodeDone(prevNode, statusData));
  const isCurrent = isUnlocked && !isCompleted;
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;

  const handleToggle = () => {
    if (!isUnlocked) return;
    if (isLeaf) {
      router.push(`/learn/${courseId}/${moduleId}/${parentId}/${node.identifier || node.id}`);
    } else if (isFirstLevel) {
      setIsLocalExpanded(!isLocalExpanded);
    } else if (onNonLeafClick) {
      // Custom navigation (e.g. from next-level preview — navigate to module page)
      onNonLeafClick(courseId, node);
    } else {
      // Default: subtopic page
      router.push(`/learn/${courseId}/${moduleId}/${node.identifier || node.id}`);
    }
  };

  return (
    <Box sx={{ mb: isFirstLevel ? 2 : 0, borderRadius: '16px', overflow: 'hidden', border: isFirstLevel ? `1.5px solid ${isCompleted ? SUCCESS : (isLocalExpanded ? PRIMARY : '#E5E7EB')}` : 'none', bgcolor: isFirstLevel ? 'background.paper' : 'transparent', opacity: isUnlocked ? 1 : 0.7 }}>
      <Box onClick={handleToggle} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: isFirstLevel ? 2 : 1.5, cursor: isUnlocked ? 'pointer' : 'not-allowed', border: !isFirstLevel ? `1.5px solid ${isCurrent ? PRIMARY : (isCompleted ? SUCCESS : '#E5E7EB')}` : 'none', borderRadius: !isFirstLevel ? '16px' : 0, bgcolor: !isFirstLevel ? '#fff' : 'transparent', mb: !isFirstLevel ? 1.5 : 0, '&:hover': { bgcolor: isUnlocked && !isFirstLevel ? '#FFF7F0' : undefined } }}>
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isFirstLevel ? 44 : 28, height: isFirstLevel ? 44 : 28, flexShrink: 0 }}>
          {!isUnlocked ? <LockIcon sx={{ color: '#C0C4CC', fontSize: isFirstLevel ? 28 : 20 }} /> : isCompleted ? <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: isFirstLevel ? 44 : 28 }} /> : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress variant="determinate" value={100} size={isFirstLevel ? 40 : 28} thickness={4} sx={{ color: '#E5E7EB', position: 'absolute' }} />
              <CircularProgress variant="determinate" value={completionPercentage} size={isFirstLevel ? 40 : 28} thickness={4} sx={{ color: completionPercentage >= 70 ? SUCCESS : (completionPercentage > 0 ? PRIMARY : 'transparent') }} />
              <Typography sx={{ position: 'absolute', fontSize: isFirstLevel ? 10 : 8, fontWeight: 700, color: completionPercentage >= 70 ? SUCCESS : (completionPercentage > 0 ? PRIMARY : '#9CA3AF') }}>{completionPercentage}%</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: isFirstLevel ? 800 : 600, fontSize: isFirstLevel ? 14 : 13, color: 'text.primary' }}>{node.name}</Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.3 }}>{isLeaf ? t('LEARNER_APP.LEARN.LESSON') : t('LEARNER_APP.LEARN.COMPLETED_LESSONS', { completed: (node.children || []).filter((c: any) => isNodeDone(c, statusData)).length, total: (node.children || []).length })}</Typography>
          {node.description && node.mimeType !== 'application/vnd.sunbird.questionset' && (
            <Typography sx={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7280', mt: 0.8 }}>{node.description}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isUnlocked && (
            isLeaf ? <ChevronRightIcon color={isCompleted ? SUCCESS : PRIMARY} />
            : isFirstLevel ? (isLocalExpanded ? <KeyboardArrowUpIcon sx={{ color: isCompleted ? SUCCESS : PRIMARY }} /> : <KeyboardArrowDownIcon sx={{ color: isCompleted ? SUCCESS : PRIMARY }} />)
            : <KeyboardArrowRightIcon sx={{ color: isCompleted ? SUCCESS : PRIMARY, fontSize: 22 }} />
          )}
        </Box>
      </Box>
      {!isLeaf && isFirstLevel && <Collapse in={isLocalExpanded && isUnlocked}><Box sx={{ px: 2, pb: 2, pl: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {(node.children || []).map((child: any, cIdx: number) => (
          <HierarchyNode key={child.identifier || child.id} node={child} courseId={courseId} moduleId={moduleId} parentId={node.identifier || node.id} statusData={statusData} isFirstLevel={false} isParentUnlocked={isUnlocked} prevNode={cIdx === 0 ? null : node.children[cIdx - 1]} t={t} router={router} onNonLeafClick={onNonLeafClick} />
        ))}
      </Box></Collapse>}
    </Box>
  );
}
