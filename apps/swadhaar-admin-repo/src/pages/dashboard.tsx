import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Grid, Card, CardContent, Typography, Chip, LinearProgress } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import HubIcon from '@mui/icons-material/Hub';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Link from 'next/link';
import { useTranslation, UserConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config.js';
import { SWADHAAR_CHANNEL_ID, SWADHAAR_FRAMEWORK } from '@/utils/app.constant';
import SwadhaarStatCard from '@/components/common/SwadhaarStatCard';
import LifecycleChip from '@/components/common/LifecycleChip';
import SDBVHierarchyFilter, { SDBVFilterValues } from '@/components/common/SDBVHierarchyFilter';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import BreadcrumbsNav from '@/components/common/BreadcrumbsNav';
import CommonButton from '@/components/common/CommonButton';

interface CohortRecord {
  id: string;
  name: string;
  branch: string;
  members: number;
  progress: number;
  status: string;
}

interface QuickOperationProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

/** Card-style shortcut link shown in the Quick Operations panel. */
const QuickOperationLink: React.FC<QuickOperationProps> = ({ href, icon, title, description }) => (
  <Link href={href} style={{ textDecoration: 'none' }}>
    <Box
      sx={{
        p: 2,
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'primary.100',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {icon}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        </Box>
      </Box>
      <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    </Box>
  </Link>
);

// Sample cohort rows (mock data shown until the dashboard API is wired)
const RECENT_COHORTS: CohortRecord[] = [
  {
    id: 'COH-101',
    name: 'Financial Inclusion - Batch 14',
    branch: 'Pune Central CFL',
    members: 32,
    progress: 85,
    status: 'Active',
  },
  {
    id: 'COH-102',
    name: 'Micro-Enterprise Skillset',
    branch: 'Nagpur East',
    members: 28,
    progress: 60,
    status: 'Active',
  },
  {
    id: 'COH-103',
    name: 'Digital Banking Basics',
    branch: 'Nashik Urban',
    members: 40,
    progress: 92,
    status: 'Published',
  },
  {
    id: 'COH-104',
    name: 'Household Budgeting & Savings',
    branch: 'Solapur Hub',
    members: 25,
    progress: 40,
    status: 'Draft',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  const [filters, setFilters] = useState<SDBVFilterValues>({
    state: '',
    district: '',
    block: '',
    village: '',
    program: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserName(parsed?.name || parsed?.username || '');
        } catch (error) {
          console.error('Failed to parse adminInfo:', error);
        }
      }
    }
  }, []);

  const displayName = userName || t('DASHBOARD.DEFAULT_USER_NAME');

  const stats = [
    {
      id: 'active-users',
      label: t('DASHBOARD.ACTIVE_USERS'),
      value: '1,420',
      change: t('DASHBOARD.ACTIVE_USERS_CHANGE', { percent: 12 }),
      trend: 'up' as const,
      icon: <GroupIcon sx={{ color: 'primary.main', fontSize: 26 }} />,
      bg: 'primary.100',
    },
    {
      id: 'active-cohorts',
      label: t('DASHBOARD.ACTIVE_COHORTS'),
      value: '38',
      change: t('DASHBOARD.ACTIVE_COHORTS_CHANGE', { regions: 6 }),
      trend: 'neutral' as const,
      icon: <HubIcon sx={{ color: 'secondary.main', fontSize: 26 }} />,
      bg: 'secondary.100',
    },
    {
      id: 'published-courses',
      label: t('DASHBOARD.PUBLISHED_COURSES'),
      value: '14',
      change: t('DASHBOARD.PUBLISHED_COURSES_CHANGE'),
      trend: 'up' as const,
      icon: <MenuBookIcon sx={{ color: 'success.main', fontSize: 26 }} />,
      bg: 'success.light',
    },
    {
      id: 'completion-rate',
      label: t('DASHBOARD.COMPLETION_RATE'),
      value: '78.4%',
      change: t('DASHBOARD.COMPLETION_RATE_CHANGE', { target: '75%' }),
      trend: 'up' as const,
      icon: <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 26 }} />,
      bg: 'primary.100',
    },
  ];

  const cohortColumns: ColumnDef<CohortRecord>[] = useMemo(
    () => [
      {
        id: 'name',
        label: t('DASHBOARD.COLUMN_COHORT_NAME'),
        labelKey: 'DASHBOARD.COLUMN_COHORT_NAME',
        minWidth: 220,
        sortable: true,
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'branch',
        label: t('DASHBOARD.COLUMN_BRANCH'),
        labelKey: 'DASHBOARD.COLUMN_BRANCH',
        minWidth: 160,
        sortable: true,
      },
      {
        id: 'members',
        label: t('DASHBOARD.COLUMN_MEMBERS'),
        labelKey: 'DASHBOARD.COLUMN_MEMBERS',
        minWidth: 100,
        align: 'center',
        sortable: true,
      },
      {
        id: 'progress',
        label: t('DASHBOARD.COLUMN_PROGRESS'),
        labelKey: 'DASHBOARD.COLUMN_PROGRESS',
        minWidth: 150,
        render: (row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={row.progress}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: 'secondary.300',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: row.progress >= 80 ? 'success.main' : 'primary.main',
                },
              }}
            />
            <Typography variant="body2" sx={{ fontSize: '11px', color: 'text.secondary', minWidth: 28 }}>
              {row.progress}%
            </Typography>
          </Box>
        ),
      },
      {
        id: 'status',
        label: t('DASHBOARD.COLUMN_LIFECYCLE_STATE'),
        labelKey: 'DASHBOARD.COLUMN_LIFECYCLE_STATE',
        minWidth: 140,
        render: (row) => <LifecycleChip state={row.status} />,
      },
    ],
    [t, router.locale]
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Breadcrumb Navigation */}
      <BreadcrumbsNav items={[{ label: t('SIDEBAR.DASHBOARD') }]} />

      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 3,
          backgroundColor: 'secondary.main',
          color: 'secondary.contrastText',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(26, 26, 26, 0.15)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 0.8, color: '#FFFFFF' }}>
                {t('DASHBOARD.WELCOME_BACK', { name: displayName })}
              </Typography>
              <Typography variant="body1" sx={{ color: '#D1D5DB', maxWidth: 650 }}>
                {t('DASHBOARD.WELCOME_DESCRIPTION')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={t('DASHBOARD.CHANNEL_LABEL', { channel: SWADHAAR_CHANNEL_ID })}
                size="small"
                sx={{
                  backgroundColor: 'rgba(230, 135, 60, 0.2)',
                  color: 'primary.light',
                  border: '1px solid rgba(230, 135, 60, 0.5)',
                  fontWeight: 600,
                  fontSize: '11px',
                }}
              />
              <Chip
                label={t('DASHBOARD.FRAMEWORK_LABEL', { framework: SWADHAAR_FRAMEWORK })}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  fontSize: '11px',
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* SDBV Cascading Filter Bar */}
      <SDBVHierarchyFilter values={filters} onChange={setFilters} />

      {/* KPI Stat Cards (SwadhaarStatCard Primitive) */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {stats.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id}>
            <SwadhaarStatCard
              label={item.label}
              value={item.value}
              change={item.change}
              trend={item.trend}
              icon={item.icon}
              bg={item.bg}
            />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid: Cohorts Table & Quick Operations */}
      <Grid container spacing={3}>
        {/* Active Cohorts using SwadhaarDataTable Primitive */}
        <Grid item xs={12} lg={8}>
          <SwadhaarDataTable<CohortRecord>
            columns={cohortColumns}
            data={RECENT_COHORTS}
            keyExtractor={(item) => item.id}
            searchPlaceholder={t('DASHBOARD.SEARCH_ACTIVE_COHORTS')}
            actionsToolbar={
              <Link href="/cohorts" style={{ textDecoration: 'none' }}>
                <CommonButton
                  size="small"
                  variant="secondary"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontSize: '12px' }}
                >
                  {t('DASHBOARD.VIEW_ALL_COHORTS')}
                </CommonButton>
              </Link>
            }
          />
        </Grid>

        {/* Quick Operations Panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h3" sx={{ color: 'secondary.main', mb: 2 }}>
                {t('DASHBOARD.QUICK_OPERATIONS')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <QuickOperationLink
                  href="/users"
                  icon={<GroupIcon sx={{ color: 'primary.main' }} />}
                  title={t('DASHBOARD.QUICK_MANAGE_USERS')}
                  description={t('DASHBOARD.QUICK_MANAGE_USERS_DESC')}
                />
                <QuickOperationLink
                  href="/cohorts"
                  icon={<HubIcon sx={{ color: 'secondary.main' }} />}
                  title={t('DASHBOARD.QUICK_COHORTS')}
                  description={t('DASHBOARD.QUICK_COHORTS_DESC')}
                />
                <QuickOperationLink
                  href="/content/courses"
                  icon={<MenuBookIcon sx={{ color: 'success.main' }} />}
                  title={t('DASHBOARD.QUICK_COURSES')}
                  description={t('DASHBOARD.QUICK_COURSES_DESC')}
                />
                <QuickOperationLink
                  href="/reports"
                  icon={<AssessmentIcon sx={{ color: 'info.main' }} />}
                  title={t('DASHBOARD.QUICK_REPORTS')}
                  description={t('DASHBOARD.QUICK_REPORTS_DESC')}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as UserConfig, ['en', 'mr', 'hi'])),
    },
  };
}
