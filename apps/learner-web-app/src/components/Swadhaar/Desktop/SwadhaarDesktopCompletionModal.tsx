'use client';

import React from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent,
  IconButton, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { issueCertificate } from '@shared-lib-v2/utils/CertificateService/coursesCertificates';
import { CertificateModal, useTranslation } from '@shared-lib';

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

  const title = mode === 'course' ? 'Congratulations!' : (mode === 'module' ? 'Module Complete!' : 'Subtopic Complete!');

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
              Close
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            {/* Achievement Hero Card */}
            <Box sx={{ bgcolor: '#F0FDF4', borderRadius: '16px', py: 5, textAlign: 'center', mb: 3 }}>
              <Box sx={{ 
                width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 2,
                bgcolor: mode === 'course' ? '#F2BC33' : '#C8E6C9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: mode === 'course'
                  ? '0 8px 28px rgba(242,188,51,0.35)'
                  : '0 8px 24px rgba(76,175,80,0.2)'
              }}>
                {mode === 'course' ? (
                  /* Outlined star matching Figma — hollow center, white stroke */
                  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L12 15.77 6.79 18.51l1-5.79L3.58 8.62l5.82-.85L12 2.5z"
                      fill="#FFFFFF"
                      stroke="#000000"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <Box sx={{ 
                    width: 82, height: 82, borderRadius: '50%', bgcolor: '#66BB6A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Box sx={{ 
                      width: 60, height: 60, borderRadius: '50%', bgcolor: '#2E7D32',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Box>
                  </Box>
                )}
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: SUCCESS, mb: 1 }}>{title}</Typography>
              {mode === 'course' && <Typography sx={{ fontSize: 14, color: SUCCESS, fontWeight: 600 }}>You have finished {levelName}</Typography>}
            </Box>

            {/* "Up Next" Section (Sidebar Style Hierarchy) */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: DARK_NAV, mb: 1.5, px: 0.5 }}>
                {mode === 'course' ? `${nextLevelName || 'Intermediate Level'} Unlocked` : 'Up Next'}
              </Typography>
              
              {upNext && (
                <Box sx={{ border: `1.5px solid ${PRIMARY}`, borderRadius: '14px', overflow: 'hidden' }}>
                   {/* Group Header */}
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.75, bgcolor: '#fff' }}>
                     <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: DARK_NAV }}>{upNext.groupName}</Typography>
                        {upNext.groupSubtitle && <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, mt: 0.2 }}>{upNext.groupSubtitle}</Typography>}
                     </Box>
                     <KeyboardDoubleArrowDownIcon sx={{ color: PRIMARY, fontSize: 22 }} />
                   </Box>

                   {/* Item List (Matches Sidebar Items) */}
                   <Box sx={{ px: 1.5, pb: 1.5 }}>
                      {upNext.items.map((item) => {
                        const isDone = item.status === 2 || (item.completionPercentage || 0) >= 100;
                        return (
                          <Box key={item.id} onClick={item.onClick} sx={{ 
                            display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.5, mb: 1,
                            borderRadius: '12px', border: '1px solid #F3F4F6', bgcolor: '#fff',
                            cursor: item.onClick ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            '&:hover': { bgcolor: '#F9FAFB', borderColor: PRIMARY, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }
                          }}>
                            <ProgressIcon percentage={item.completionPercentage || 0} isDone={isDone} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: DARK_NAV, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </Typography>
                              {item.subtitle && <Typography sx={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{item.subtitle}</Typography>}
                            </Box>
                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 12, color: '#BDBDBD' }} />
                          </Box>
                        );
                      })}
                   </Box>
                </Box>
              )}
            </Box>

            {/* Footer Action Buttons */}
            <Box sx={{ mt: 1 }}>
              {mode === 'course' ? (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined" fullWidth disabled={certLoading} onClick={handleDownloadCert}
                    sx={{ borderColor: PRIMARY, color: PRIMARY, borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.4, fontSize: 13.5, '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(230,135,60,0.04)' } }}
                  >
                    Download Certificate
                  </Button>
                  <Button
                    variant="contained" fullWidth onClick={() => { onClose(); onStartNextLevel?.(); }}
                    sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.4, fontSize: 13.5, boxShadow: 'none', '&:hover': { bgcolor: PRIMARY, boxShadow: 'none' } }}
                  >
                    Start Next Level
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained" fullWidth onClick={() => { onClose(); onContinue?.(); }}
                  sx={{ bgcolor: PRIMARY, color: '#fff', borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.6, fontSize: 14.5, boxShadow: '0 4px 12px rgba(230,135,60,0.2)', '&:hover': { bgcolor: PRIMARY, boxShadow: 'none' } }}
                >
                  Continue
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
