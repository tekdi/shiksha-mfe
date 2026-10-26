import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import ContentPreviewModal, { PreviewContentData } from '@/components/common/ContentPreviewModal';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import LifecycleChip from '@/components/common/LifecycleChip';
import CommonButton from '@/components/common/CommonButton';
import CommonSelect from '@/components/common/CommonSelect';
import PageHeader from '@/components/common/PageHeader';
import CommonDialog from '@/components/common/CommonDialog';
import { BRAND, NEUTRAL } from '@/styles/customTheme';
import {
  searchContentLibrary,
  fetchContentTabCounts,
  retireContent,
  ContentItem,
  ContentTabType,
  ContentTabCounts,
} from '@/services/ContentLibraryService';
import { getCourseList } from '@/services/CourseService';

type AssessmentSubTab = 'assessments' | 'questions' | 'results';

/** i18n keys per library tab. */
const TAB_META: Record<
  ContentTabType,
  { labelKey: string; searchKey: string; hintKey: string; emptyKey: string }
> = {
  videos: {
    labelKey: 'CONTENT.LIBRARY.TAB_VIDEOS',
    searchKey: 'CONTENT.LIBRARY.SEARCH_VIDEOS',
    hintKey: 'CONTENT.LIBRARY.SHOWING_VIDEOS',
    emptyKey: 'CONTENT.LIBRARY.EMPTY_VIDEOS',
  },
  pdfs: {
    labelKey: 'CONTENT.LIBRARY.TAB_PDFS',
    searchKey: 'CONTENT.LIBRARY.SEARCH_PDFS',
    hintKey: 'CONTENT.LIBRARY.SHOWING_PDFS',
    emptyKey: 'CONTENT.LIBRARY.EMPTY_PDFS',
  },
  assessments: {
    labelKey: 'CONTENT.LIBRARY.TAB_ASSESSMENTS',
    searchKey: 'CONTENT.LIBRARY.SEARCH_ASSESSMENTS',
    hintKey: 'CONTENT.LIBRARY.SHOWING_ASSESSMENTS',
    emptyKey: 'CONTENT.LIBRARY.EMPTY_ASSESSMENTS',
  },
};

const TAB_ORDER: ContentTabType[] = ['videos', 'pdfs', 'assessments'];

const ASSESSMENT_SUB_TABS: { value: AssessmentSubTab; labelKey: string }[] = [
  { value: 'assessments', labelKey: 'CONTENT.LIBRARY.TAB_ASSESSMENTS' },
  { value: 'questions', labelKey: 'CONTENT.LIBRARY.QUESTION_BANK' },
  { value: 'results', labelKey: 'CONTENT.LIBRARY.RESULTS' },
];

const CREATE_ACTIONS: { tab: ContentTabType; href: string; labelKey: string }[] = [
  { tab: 'videos', href: '/content/create-video', labelKey: 'CONTENT.LIBRARY.ADD_VIDEO' },
  { tab: 'pdfs', href: '/content/create-pdf', labelKey: 'CONTENT.LIBRARY.ADD_PDF' },
  { tab: 'assessments', href: '/content/create-assessment', labelKey: 'CONTENT.LIBRARY.ADD_ASSESSMENT' },
];

const LOAD_ERROR_KEY = 'CONTENT.LIBRARY.LOAD_ERROR';

const isContentTab = (value: unknown): value is ContentTabType =>
  value === 'videos' || value === 'pdfs' || value === 'assessments';

const getEditHref = (tab: ContentTabType, id: string, usedIn?: string) => {
  const query = new URLSearchParams({ id });
  if (usedIn) query.set('usedIn', usedIn);
  return tab === 'videos' ? `/content/create-video?${query.toString()}` : `/content/create-pdf?${query.toString()}`;
};

const actionIconSx = {
  color: NEUTRAL.muted,
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '6px',
  width: 32,
  height: 32,
  '&:hover': {
    backgroundColor: BRAND.primarySoft,
    borderColor: 'primary.main',
    color: 'primary.main',
  },
};

const deleteIconSx = {
  ...actionIconSx,
  '&:hover': {
    backgroundColor: '#FEE2E2',
    borderColor: '#BA1A1A',
    color: '#BA1A1A',
  },
};

const cellTextSx = { color: NEUTRAL.ink, fontSize: '13px' };

const nameLinkSx = {
  fontSize: '14px',
  fontWeight: 600,
  color: NEUTRAL.ink,
  cursor: 'pointer',
  transition: 'color 0.2s',
  '&:hover': {
    color: 'primary.main',
    textDecoration: 'underline',
  },
};

const filterSelectSx = { minWidth: 140, fontSize: '13px', height: 38 };

const countBadgeSx = (active: boolean) => ({
  px: 1,
  py: 0.2,
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: active ? BRAND.primarySoft : '#F3F4F6',
  color: active ? 'primary.main' : NEUTRAL.muted,
  transition: 'all 0.2s',
});

const subTabSx = (active: boolean) => ({
  textTransform: 'none',
  fontWeight: active ? 600 : 500,
  color: active ? 'primary.main' : NEUTRAL.muted,
  borderBottom: active ? `2px solid ${BRAND.primary}` : '2px solid transparent',
  borderRadius: 0,
  pb: 1,
  '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
});

export default function ContentLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const initialTab = (router.query.tab as ContentTabType) || 'videos';

  const [activeTab, setActiveTab] = useState<ContentTabType>(initialTab);
  const [assessmentSubTab, setAssessmentSubTab] = useState<AssessmentSubTab>('assessments');

  const [tabCounts, setTabCounts] = useState<ContentTabCounts>({
    videos: 15,
    pdfs: 0,
    assessments: 87,
  });

  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  /** Holds an i18n key so the message re-renders in the active language. */
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');

  // Preview Modal state (Native in-app viewer, no external player/workspace MFE)
  const [previewContent, setPreviewContent] = useState<PreviewContentData | null>(null);

  // Delete confirmation & action states
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Dynamic Course Filter Options
  const [courseOptions, setCourseOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Courses' },
  ]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sync tab with router query
  useEffect(() => {
    if (isContentTab(router.query.tab)) {
      setActiveTab(router.query.tab);
    }
  }, [router.query.tab]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load counts once
  useEffect(() => {
    fetchContentTabCounts()
      .then((counts) => {
        setTabCounts(counts);
      })
      .catch((err) => console.error('Failed to load content counts:', err));
  }, []);

  // Fetch content for current active tab
  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchContentLibrary({
        tab: activeTab,
        query: debouncedSearch.trim(),
        courseFilter,
        languageFilter,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });

      setContentList(response.content || []);
      setTotalCount(response.count || 0);

      // Update current tab count
      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: response.count ?? prev[activeTab],
      }));
    } catch (err) {
      console.error('Failed to fetch content library items:', err);
      setError(LOAD_ERROR_KEY);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, courseFilter, languageFilter, page, rowsPerPage]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: ContentTabType) => {
    setActiveTab(newValue);
    setPage(0);
    router.replace({ pathname: '/content', query: { tab: newValue } }, undefined, { shallow: true });
  };

  const isVideoTab = activeTab === 'videos';

  // Load actual courses for the filter
  useEffect(() => {
    getCourseList({ limit: 50 })
      .then((res) => {
        if (res?.content?.length > 0) {
          const opts = res.content.map((c) => ({
            value: c.name || c.identifier,
            label: c.name || 'Untitled Course',
          }));
          setCourseOptions([
            { value: 'all', label: t('CONTENT.LIBRARY.ALL_COURSES') || 'All Courses' },
            ...opts,
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load courses for filter:', err);
      });
  }, [t]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await retireContent(itemToDelete.identifier);
      setContentList((prev) => prev.filter((item) => item.identifier !== itemToDelete.identifier));
      setFeedback({
        open: true,
        message: 'Content deleted successfully.',
        severity: 'success',
      });
      setItemToDelete(null);
      fetchContentTabCounts()
        .then(setTabCounts)
        .catch((countErr) => console.error('Failed to refresh content counts:', countErr));
    } catch (err: any) {
      console.error('Failed to retire content:', err);
      setFeedback({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to delete content.',
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const languageOptions = [
    { value: 'all', label: t('CONTENT.LIBRARY.ALL_LANGUAGES') },
    { value: 'english', label: t('CONTENT.LANGUAGES.ENGLISH') },
    { value: 'hindi', label: t('CONTENT.LANGUAGES.HINDI') },
  ];

  // Columns for Videos and PDFs matching Prototype Image 1 with Swadhaar Theme
  const videoPdfColumns: ColumnDef<ContentItem>[] = useMemo(
    () => [
      {
        id: 'name',
        label: isVideoTab ? t('CONTENT.LIBRARY.COL_VIDEO') : t('CONTENT.LIBRARY.COL_DOCUMENT'),
        labelKey: isVideoTab ? 'CONTENT.LIBRARY.COL_VIDEO' : 'CONTENT.LIBRARY.COL_DOCUMENT',
        sortable: true,
        minWidth: 320,
        render: (row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 58,
                height: 34,
                borderRadius: '4px',
                backgroundColor: BRAND.primarySoft,
                border: '1px solid #FBE3CD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                color: 'primary.main',
                letterSpacing: '0.5px',
                flexShrink: 0,
              }}
            >
              {isVideoTab ? t('CONTENT.LIBRARY.BADGE_VIDEO') : 'PDF'}
            </Box>
            <Link href={getEditHref(activeTab, row.identifier, row.usedIn)} style={{ textDecoration: 'none' }}>
              <Typography sx={{ ...nameLinkSx, lineHeight: 1.35 }}>{row.name}</Typography>
            </Link>
          </Box>
        ),
      },
      {
        id: 'duration',
        label: isVideoTab ? t('CONTENT.LIBRARY.COL_DURATION') : t('CONTENT.LIBRARY.COL_READING_TIME'),
        labelKey: isVideoTab ? 'CONTENT.LIBRARY.COL_DURATION' : 'CONTENT.LIBRARY.COL_READING_TIME',
        minWidth: 100,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.formattedDuration || '—'}
          </Typography>
        ),
      },
      {
        id: 'source',
        label: t('CONTENT.LIBRARY.COL_SOURCE'),
        labelKey: 'CONTENT.LIBRARY.COL_SOURCE',
        minWidth: 120,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.source || 'YouTube'}
          </Typography>
        ),
      },
      {
        id: 'usedIn',
        label: t('CONTENT.LIBRARY.COL_USED_IN'),
        labelKey: 'CONTENT.LIBRARY.COL_USED_IN',
        minWidth: 140,
        render: (row) => {
          const isUsed = Boolean(row.usedIn && row.usedIn !== 'Not used in any course yet');
          return (
            <Typography
              variant="body2"
              sx={{
                ...cellTextSx,
                color: isUsed ? NEUTRAL.ink : NEUTRAL.muted,
                fontWeight: isUsed ? 500 : 400,
              }}
            >
              {row.usedIn || 'Not used in any course yet'}
            </Typography>
          );
        },
      },
      {
        id: 'language',
        label: t('COMMON.LANGUAGE'),
        labelKey: 'COMMON.LANGUAGE',
        minWidth: 110,
        render: (row) => (
          <Chip
            label={row.detectedLanguage || t('CONTENT.LANGUAGES.ENGLISH')}
            size="small"
            sx={{
              fontWeight: 500,
              fontSize: '11px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '4px',
              height: 22,
            }}
          />
        ),
      },
      {
        id: 'status',
        label: t('COMMON.STATUS'),
        labelKey: 'COMMON.STATUS',
        minWidth: 110,
        render: (row) => <LifecycleChip state={row.status || 'Live'} />,
      },
      {
        id: 'actions',
        label: t('COMMON.ACTIONS'),
        labelKey: 'COMMON.ACTIONS',
        align: 'right',
        minWidth: 110,
        render: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
            <Tooltip title={isVideoTab ? t('CONTENT.LIBRARY.VIEW_VIDEO') : t('CONTENT.LIBRARY.VIEW_PDF')}>
              <IconButton
                size="small"
                onClick={() => {
                  setPreviewContent({
                    ...row,
                    type: isVideoTab ? 'video' : 'pdf',
                  });
                }}
                sx={actionIconSx}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('CONTENT.LIBRARY.EDIT_CONTENT')}>
              <IconButton
                size="small"
                onClick={() => router.push(getEditHref(activeTab, row.identifier, row.usedIn))}
                sx={actionIconSx}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('COMMON.DELETE')}>
              <IconButton size="small" onClick={() => setItemToDelete(row)} sx={deleteIconSx}>
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [isVideoTab, activeTab, t, router.locale]
  );

  // Columns for Assessments matching Prototype Image 5 with Swadhaar Theme
  const assessmentColumns: ColumnDef<ContentItem>[] = useMemo(
    () => [
      {
        id: 'name',
        label: t('CONTENT.LIBRARY.COL_ASSESSMENT'),
        labelKey: 'CONTENT.LIBRARY.COL_ASSESSMENT',
        sortable: true,
        minWidth: 320,
        render: (row) => (
          <Link href={`/content/assessments/${row.identifier}`} style={{ textDecoration: 'none' }}>
            <Typography sx={nameLinkSx}>{row.name}</Typography>
          </Link>
        ),
      },
      {
        id: 'linkedTo',
        label: t('CONTENT.LIBRARY.COL_LINKED_TO'),
        labelKey: 'CONTENT.LIBRARY.COL_LINKED_TO',
        minWidth: 130,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.linkedTo || '—'}
          </Typography>
        ),
      },
      {
        id: 'questions',
        label: t('CONTENT.LIBRARY.COL_QUESTIONS'),
        labelKey: 'CONTENT.LIBRARY.COL_QUESTIONS',
        minWidth: 90,
        render: (row) => (
          <Typography variant="body2" sx={{ ...cellTextSx, fontWeight: 600 }}>
            {row.questionsCount || 10}
          </Typography>
        ),
      },
      {
        id: 'passMark',
        label: t('CONTENT.LIBRARY.COL_PASS_MARK'),
        labelKey: 'CONTENT.LIBRARY.COL_PASS_MARK',
        minWidth: 100,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.passMark || '70%'}
          </Typography>
        ),
      },
      {
        id: 'attempts',
        label: t('CONTENT.LIBRARY.COL_ATTEMPTS'),
        labelKey: 'CONTENT.LIBRARY.COL_ATTEMPTS',
        minWidth: 90,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.attempts || t('CONTENT.LIBRARY.UNLIMITED')}
          </Typography>
        ),
      },
      {
        id: 'timeLimit',
        label: t('CONTENT.LIBRARY.COL_TIME_LIMIT'),
        labelKey: 'CONTENT.LIBRARY.COL_TIME_LIMIT',
        minWidth: 100,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.timeLimit || '—'}
          </Typography>
        ),
      },
      {
        id: 'assignedTo',
        label: t('CONTENT.LIBRARY.COL_ASSIGNED_TO'),
        labelKey: 'CONTENT.LIBRARY.COL_ASSIGNED_TO',
        minWidth: 130,
        render: (row) => (
          <Typography variant="body2" sx={cellTextSx}>
            {row.assignedTo || t('CONTENT.LIBRARY.N_GROUPS')}
          </Typography>
        ),
      },
      {
        id: 'status',
        label: t('COMMON.STATUS'),
        labelKey: 'COMMON.STATUS',
        minWidth: 110,
        render: (row) => <LifecycleChip state={row.status || 'Live'} />,
      },
      {
        id: 'actions',
        label: t('COMMON.ACTIONS'),
        labelKey: 'COMMON.ACTIONS',
        align: 'right',
        minWidth: 110,
        render: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
            <Tooltip title={t('CONTENT.LIBRARY.PREVIEW_ASSESSMENT')}>
              <IconButton
                size="small"
                onClick={() => {
                  setPreviewContent({
                    ...row,
                    type: 'assessment',
                  });
                }}
                sx={actionIconSx}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('CONTENT.LIBRARY.EDIT_ASSESSMENT')}>
              <IconButton
                size="small"
                onClick={() => router.push(`/content/assessments/${row.identifier}`)}
                sx={actionIconSx}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('CONTENT.LIBRARY.RESULTS_ANALYTICS')}>
              <IconButton
                size="small"
                onClick={() => alert(t('CONTENT.LIBRARY.RESULTS_FOR', { name: row.name }))}
                sx={actionIconSx}
              >
                <BarChartOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [t, router.locale]
  );

  const tabMeta = TAB_META[activeTab];
  const currentColumns = activeTab === 'assessments' ? assessmentColumns : videoPdfColumns;

  return (
    <Box sx={{ py: 1 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
          {t('CONTENT.LEARNING')}
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
          {t('CONTENT.LIBRARY.TITLE')}
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.subtle, fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: NEUTRAL.ink, fontSize: '13px', fontWeight: 600 }}>
          {t(tabMeta.labelKey)}
        </Typography>
      </Box>

      {/* Header & Create CTAs routing to full pages */}
      <PageHeader
        title={t('CONTENT.LIBRARY.TITLE')}
        subtitle={t('CONTENT.LIBRARY.SUBTITLE')}
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px', mr: 0.5 }}>
              {t('COMMON.CREATE')}
            </Typography>
            {CREATE_ACTIONS.map((action) => (
              <CommonButton
                key={action.tab}
                variant={activeTab === action.tab ? 'primary' : 'secondary'}
                onClick={() => router.push(action.href)}
                sx={{ height: 38 }}
              >
                {t(action.labelKey)}
              </CommonButton>
            ))}
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {t(error)}
        </Alert>
      )}

      {/* Main Tabs (Videos | PDFs | Assessments) with Swadhaar Orange Theme */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        textColor="inherit"
        sx={{
          minHeight: 44,
          borderBottom: `1px solid ${NEUTRAL.border}`,
          mb: activeTab === 'assessments' ? 1.5 : 2,
          '& .MuiTabs-indicator': {
            backgroundColor: 'primary.main',
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '14px',
            color: NEUTRAL.muted,
            px: 2,
            '&.Mui-selected': {
              color: 'primary.main',
              fontWeight: 600,
            },
            '&:hover': {
              color: 'primary.main',
            },
          },
        }}
      >
        {TAB_ORDER.map((tab) => (
          <Tab
            key={tab}
            value={tab}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{t(TAB_META[tab].labelKey)}</span>
                <Box sx={countBadgeSx(activeTab === tab)}>{tabCounts[tab]}</Box>
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Sub-tabs if Assessments is active (matching Image 5 with Swadhaar Theme) */}
      {activeTab === 'assessments' && (
        <Box sx={{ display: 'flex', gap: 1, borderBottom: `1px solid ${NEUTRAL.divider}`, mb: 2 }}>
          {ASSESSMENT_SUB_TABS.map((sub) => (
            <Button
              key={sub.value}
              size="small"
              onClick={() => setAssessmentSubTab(sub.value)}
              sx={subTabSx(assessmentSubTab === sub.value)}
            >
              {t(sub.labelKey)}
            </Button>
          ))}
        </Box>
      )}

      {/* Toolbar: Search & Filter dropdowns with Swadhaar Theme */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder={t(tabMeta.searchKey)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: NEUTRAL.subtle, fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label={t('COMMON.CLEAR')} onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: 260,
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                height: 38,
                borderRadius: '6px',
                fontSize: '13px',
                '& fieldset': { borderColor: NEUTRAL.border },
                '&:hover fieldset': { borderColor: 'primary.main' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />

          {/* Filter 1: All Courses */}
          <CommonSelect
            value={courseFilter}
            onChange={(value) => {
              setCourseFilter(value);
              setPage(0);
            }}
            options={courseOptions}
            fullWidth={false}
            sx={filterSelectSx}
          />

          {/* Filter 2: All Languages */}
          <CommonSelect
            value={languageFilter}
            onChange={(value) => {
              setLanguageFilter(value);
              setPage(0);
            }}
            options={languageOptions}
            fullWidth={false}
            sx={filterSelectSx}
          />
        </Box>

        {/* Counter Hint (matching Prototype Image 1) */}
        <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
          {t(tabMeta.hintKey, { shown: contentList.length, total: totalCount })}
        </Typography>
      </Box>

      {/* Swadhaar Data Table */}
      <SwadhaarDataTable<ContentItem>
        columns={currentColumns}
        data={contentList}
        keyExtractor={(item) => item.identifier}
        loading={loading}
        error={error ? t(error) : null}
        onRetry={fetchContent}
        hideToolbar={true}
        emptyMessage={t(tabMeta.emptyKey)}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newSize) => {
          setRowsPerPage(newSize);
          setPage(0);
        }}
      />

      {/* Prototype Footer Note (matching Image 5) */}
      <Box sx={{ mt: 1.5, px: 0.5 }}>
        <Typography variant="caption" sx={{ color: NEUTRAL.subtle, fontSize: '11px' }}>
          {activeTab === 'assessments'
            ? t('CONTENT.LIBRARY.FOOTER_ASSESSMENTS')
            : t('CONTENT.LIBRARY.FOOTER_DEFAULT')}
        </Typography>
      </Box>

      {/* In-App Native Preview Modal (PDF / Video / Assessment) */}
      <ContentPreviewModal
        open={Boolean(previewContent)}
        onClose={() => setPreviewContent(null)}
        content={previewContent}
      />

      {/* Confirm Retire / Delete Content Dialog */}
      <CommonDialog
        open={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Delete Content"
        subtitle={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete Content'}
        confirmVariant="danger"
        confirmDisabled={deleteLoading}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
      >
        <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
          This will archive/retire this content item from the Swadhaar repository.
        </Typography>
      </CommonDialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any, ['en', 'mr', 'hi'])),
    },
  };
};
