import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ReportsPage() {
  const reports = [
    { title: 'Learner Enrollment Summary', desc: 'Detailed list of enrolled learners grouped by regional center and batch.' },
    { title: 'Level Progression Report', desc: 'Progression status across Level 1, Level 2, Level 3 modules and quizzes.' },
    { title: 'Trainer Performance & Batches', desc: 'Hours logged, batch completion ratios, and learner attendance records.' },
    { title: 'Certification Issuance Audit', desc: 'List of certificates issued under Swadhaar Training Framework.' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1C2B4A' }}>
          Training Reports & Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Generate and export comprehensive reports for Swadhaar training initiatives
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {reports.map((rep) => (
          <Grid item xs={12} sm={6} key={rep.title}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <AssessmentIcon sx={{ color: '#E6873C' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1C2B4A' }}>
                    {rep.title}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
                  {rep.desc}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{
                    color: '#E6873C',
                    borderColor: '#E6873C',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#C66C23',
                      backgroundColor: 'rgba(230, 135, 60, 0.05)',
                    },
                  }}
                >
                  Export CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

import nextI18NextConfig from '../../next-i18next.config.js';

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
}
