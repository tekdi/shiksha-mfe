'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import {
  downloadSwadhaarCertificatePdf,
  ensureSwadhaarCertificate,
  getCourseCertificateTemplateId,
  renderSwadhaarCertificate,
  swadhaarErrorMessage,
} from '@learner/utils/API/SwadhaarService';

interface SwadhaarCertificateModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

/**
 * The learner's certificate of a completed course: finds or issues it, then shows it (render) with a
 * download button (render-PDF). All calls go to the Swadhaar LMS.
 */
export const SwadhaarCertificateModal: React.FC<SwadhaarCertificateModalProps> = ({ open, onClose, courseId, courseName }) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [ids, setIds] = useState<{ credentialId: string; templateId: string } | null>(null);

  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml('');
    (async () => {
      try {
        const [credentialId, templateId] = await Promise.all([
          ensureSwadhaarCertificate(courseId, courseName),
          getCourseCertificateTemplateId(courseId),
        ]);
        const rendered = await renderSwadhaarCertificate(credentialId, templateId);
        if (cancelled) return;
        setIds({ credentialId, templateId });
        setHtml(rendered);
      } catch (err) {
        console.error('Certificate error:', err);
        if (!cancelled) setError(swadhaarErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, courseId, courseName]);

  const handleDownload = async () => {
    if (!ids) return;
    setDownloading(true);
    try {
      const blob = await downloadSwadhaarCertificatePdf(ids.credentialId, ids.templateId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(courseName || 'certificate').replace(/\s+/g, '_')}_certificate.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(swadhaarErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        Certificate
        <Box>
          <Button startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!ids || downloading} sx={{ textTransform: 'none', mr: 1 }}>
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && error && (
          <Typography sx={{ color: '#B91C1C', textAlign: 'center', py: 6 }}>{error}</Typography>
        )}
        {!loading && !error && html && (
          <Box sx={{ width: '100%', aspectRatio: '16 / 9', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe srcDoc={html} title="Certificate" style={{ width: '100%', height: '100%', border: 'none' }} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SwadhaarCertificateModal;
