'use client';

import React from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent,
  IconButton, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import UnfoldLessRoundedIcon from '@mui/icons-material/UnfoldLessRounded';
import { issueCertificate } from '@shared-lib-v2/utils/CertificateService/coursesCertificates';
import { CertificateModal, useTranslation } from '@shared-lib';
import { CircularProgress } from '@mui/material';

const PRIMARY = '#E6873C';
const DARK_NAV = '#1C2B4A';
const SUCCESS = '#4CAF50';
const GOLD = '#EDB712';
const BORDER = '#E5E7EB';

export type CompletionMode = 'subtopic' | 'module' | 'course';

interface UpNextItem {
  id: string;
  name: string;
  subtitle?: string;
  completionPercentage?: number;
  status?: number;
  isLesson?: boolean;
  onClick?: () => void;
}

interface UpNextGroup {
  groupName: string;
  groupSubtitle?: string;
  items: UpNextItem[];
}

export interface CompletionModalProps {
  open: boolean;
  mode: CompletionMode;
  levelName?: string;
  nextLevelName?: string;
  courseId?: string;
  upNext?: UpNextGroup;
  currentGroup?: UpNextGroup & { isCompleted?: boolean };
  continueText?: string;
  onContinue?: () => void;
  onClose: () => void;
  onStartNextLevel?: () => void;
}

/* ─── Circular Progress Component (Sidebar style) ─── */
function ProgressIcon({ percentage, isDone }: { percentage: number; isDone: boolean }) {
  if (isDone) return <CheckCircleRoundedIcon sx={{ fontSize: 22, color: SUCCESS }} />;
  
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="24" height="24" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="12" cy="12" r={radius} fill="transparent" stroke="#F3F4F6" strokeWidth="2.5" />
        <circle
          cx="12" cy="12" r={radius} fill="transparent" stroke={percentage > 0 ? PRIMARY : '#DADADA'}
          strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <Typography sx={{ position: 'absolute', fontSize: '7px', fontWeight: 800, color: percentage > 0 ? PRIMARY : '#9CA3AF' }}>
        {Math.round(percentage)}%
      </Typography>
    </Box>
  );
}

const SwadhaarDesktopCompletionModal: React.FC<CompletionModalProps> = ({
  open,
  mode,
  levelName = '',
  nextLevelName = '',
  courseId,
  upNext,
  currentGroup,
  continueText,
  onContinue,
  onClose,
  onStartNextLevel,
}) => {
  const { t } = useTranslation();
  const [certOpen, setCertOpen] = React.useState(false);
  const [certId, setCertId] = React.useState('');
  const [certLoading, setCertLoading] = React.useState(false);

  const handleDownloadCert = async () => {
    if (!courseId) return;
    try {
      setCertLoading(true);
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const firstName = typeof window !== 'undefined' ? localStorage.getItem('firstName') || localStorage.getItem('name') || 'Learner' : 'Learner';
      const lastName = typeof window !== 'undefined' ? localStorage.getItem('lastName') || '' : '';
      const templateId = typeof window !== 'undefined' ? localStorage.getItem('templtateId') || 'temp' : 'temp';
      const result = await issueCertificate({
        userId, courseId, courseName: levelName || 'Course',
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString(),
        credentialId: templateId, firstName, middleName: '', lastName,
      });
      setCertId(result?.credential?.id || 'temp');
      setCertOpen(true);
    } catch (e) {
      console.error('Cert error:', e);
    } finally {
      setCertLoading(false);
    }
  };

  const title = mode === 'course' ? t('LEARNER_APP.LEARN.CONGRATULATIONS') : (mode === 'module' ? t('LEARNER_APP.MODULE_COMPLETE') : t('LEARNER_APP.LEARN.SUBTOPIC_COMPLETE'));

  return (
    <>
      <Dialog
        open={open}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') onClose(); }}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0, bgcolor: '#fff' }}>
          {/* Header Bar */}
          <Box sx={{ bgcolor: DARK_NAV, display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.2 }}>
            <Typography onClick={onClose} sx={{ color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
              {t('COMMON.CLOSE')}
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            {/* Achievement Hero Card */}
            <Box sx={{ 
              bgcolor: '#E8F5E9', borderRadius: '16px', py: 4, textAlign: 'center', mb: 3,
              border: '1px solid #E0E0E0'
            }}>
              {/* Concentric circle icon matching Figma */}
              {mode === 'course' ? (
                /* Double outer ring: #EDDF8E → #EDB712 → gold star center */
                <Box sx={{ 
                  width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 2.5,
                  bgcolor: '#EDDF8E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{ 
                    width: 96, height: 96, borderRadius: '50%',
                    bgcolor: '#EDB712',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
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
              ) : (
                <Box sx={{ 
                  width: 120, height: 120, borderRadius: '50%', mx: 'auto', mb: 2.5,
                  bgcolor: '#4CAF50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{ 
                    width: 96, height: 96, borderRadius: '50%', bgcolor: '#2E7D32',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="30.5" height="22.5" viewBox="0 0 31 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 11.5L11 20L28.5 2.5" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Box>
                </Box>
              )}
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#2E7D32', fontFamily: 'Open Sans' }}>
                {title}
              </Typography>
              {mode === 'course' && (
                <Typography sx={{ fontSize: 13, color: '#2E7D32', fontWeight: 600, mt: 0.5, fontFamily: 'Open Sans' }}>
                  {t('LEARNER_APP.LEARN.FINISHED_COURSE', { courseName: levelName })}
                </Typography>
              )}
            </Box>

            {/* "Up Next" Section (Sidebar Style Hierarchy) */}
            {upNext && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', mb: 1.5, px: 0.5 }}>
                  {mode === 'course' ? `${nextLevelName || 'Intermediate Level'} ${t('LEARNER_APP.LEARN.LEVEL_UNLOCKED').split(' ')[1]}` : t('LEARNER_APP.LEARN.UP_NEXT')}
                </Typography>
                <Box sx={{ border: `1px solid ${PRIMARY}`, borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff' }}>
                   {/* Group Header */}
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.75 }}>
                     <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', fontFamily: 'Inter' }}>{upNext.groupName}</Typography>
                        {upNext.groupSubtitle && <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 400, mt: 0.2, fontFamily: 'Inter' }}>{upNext.groupSubtitle}</Typography>}
                     </Box>
                     <UnfoldMoreRoundedIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                   </Box>

                    {/* Item List (Matches Sidebar Items) */}
                    <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {upNext.items.map((item) => {
                         const isDone = item.status === 2 || (item.completionPercentage || 0) >= 100;
                         const perc = Math.round(item.completionPercentage || 0);
                         return (
                           <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                             {item.isLesson && (
                               <Box sx={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {isDone ? (
                                   <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 16 }} />
                                 ) : (
                                   <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#6B7280', fontFamily: 'Inter' }}>{perc}%</Typography>
                                 )}
                               </Box>
                             )}
                             <Box onClick={item.onClick} sx={{ 
                               flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25,
                               borderRadius: '8px', border: `1px solid #E5E7EB`, bgcolor: '#fff',
                               overflow: 'hidden',
                               cursor: item.onClick ? 'pointer' : 'default',
                               transition: 'all 0.2s',
                               '&:hover': { bgcolor: '#F9FAFB' }
                             }}>
                               <Box sx={{ flex: 1, minWidth: 0 }}>
                                 <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#1A1A1A', fontFamily: 'Inter', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   {item.name}
                                 </Typography>
                                 {!item.isLesson && item.subtitle && <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, fontFamily: 'Inter' }}>{item.subtitle}</Typography>}
                               </Box>
                               <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: '#BDBDBD', flexShrink: 0 }} />
                             </Box>
                           </Box>
                         );
                       })}
                    </Box>
                 </Box>
              </Box>
            )}

             {/* "Current" Section (Matching PWA Current Subtopic/Module) */}
             {currentGroup && (
               <Box sx={{ mb: 3 }}>
                 <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', mb: 1.5, px: 0.5 }}>
                   {mode === 'course' ? t('LEARNER_APP.LEARN.CURRENT_COURSE') : (mode === 'module' ? t('LEARNER_APP.LEARN.CURRENT_MODULE') : t('LEARNER_APP.LEARN.CURRENT_SUBTOPIC'))}
                 </Typography>
                 <Box sx={{ border: `1px solid ${currentGroup.isCompleted ? SUCCESS : '#E5E7EB'}`, borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.75, bgcolor: '#fff' }}>
                      <Box>
                         <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', fontFamily: 'Inter' }}>{currentGroup.groupName}</Typography>
                         {currentGroup.groupSubtitle && <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 400, mt: 0.2, fontFamily: 'Inter' }}>{currentGroup.groupSubtitle}</Typography>}
                      </Box>
                      <UnfoldLessRoundedIcon sx={{ color: currentGroup.isCompleted ? SUCCESS : PRIMARY, fontSize: 24 }} />
                    </Box>
                    <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {currentGroup.items.map((item) => {
                         const isDone = item.status === 2 || (item.completionPercentage || 0) >= 100;
                         const perc = Math.round(item.completionPercentage || 0);
                         return (
                           <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                             {item.isLesson && (
                               <Box sx={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {isDone ? (
                                   <CheckCircleRoundedIcon sx={{ color: SUCCESS, fontSize: 16 }} />
                                 ) : (
                                   <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#6B7280', fontFamily: 'Inter' }}>{perc}%</Typography>
                                 )}
                               </Box>
                             )}
                             <Box onClick={item.onClick} sx={{ 
                               flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25,
                               borderRadius: '8px', border: `1px solid ${isDone ? SUCCESS : '#E5E7EB'}`, bgcolor: '#fff',
                               overflow: 'hidden',
                               cursor: item.onClick ? 'pointer' : 'default',
                               transition: 'all 0.2s',
                               '&:hover': { bgcolor: '#F9FAFB' }
                             }}>
                               <Box sx={{ flex: 1, minWidth: 0 }}>
                                 <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#1A1A1A', fontFamily: 'Inter', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   {item.name}
                                 </Typography>
                                 {!item.isLesson && item.subtitle && <Typography sx={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, fontFamily: 'Inter' }}>{item.subtitle}</Typography>}
                               </Box>
                               <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: '#BDBDBD', flexShrink: 0 }} />
                             </Box>
                           </Box>
                         );
                       })}
                    </Box>
                 </Box>
               </Box>
             )}

            {/* Footer Action Buttons */}
            <Box sx={{ mt: 1 }}>
              {mode === 'course' ? (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined" fullWidth disabled={certLoading} onClick={handleDownloadCert}
                    sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.4, fontSize: 13.5, '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(230,135,60,0.04)' } }}
                  >
                    {t('LEARNER_APP.LEARN.DOWNLOAD_CERTIFICATE')}
                  </Button>
                  <Button
                    variant="contained" fullWidth onClick={() => { onClose(); onStartNextLevel?.(); }}
                    sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.4, fontSize: 13.5, boxShadow: 'none', '&:hover': { bgcolor: PRIMARY, boxShadow: 'none' } }}
                  >
                    {continueText || (nextLevelName ? t('LEARNER_APP.LEARN.START_NEXT_LEVEL') : t('LEARNER_APP.LEARN.BACK_TO_LEARNING'))}
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained" fullWidth onClick={() => { onClose(); onContinue?.(); }}
                  sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.6, fontSize: 14.5, boxShadow: '0 4px 12px rgba(230,135,60,0.2)', '&:hover': { bgcolor: PRIMARY, boxShadow: 'none' } }}
                >
                  {continueText || t('COMMON.CONTINUE') || 'Continue'}
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {certOpen && (
        <CertificateModal
          open={certOpen} setOpen={setCertOpen} certificateId={certId}
          userName={typeof window !== 'undefined' ? (localStorage.getItem('firstName') || localStorage.getItem('name') || '') : ''}
          courseName={levelName || ''}
        />
      )}
    </>
  );
};

export default SwadhaarDesktopCompletionModal;
