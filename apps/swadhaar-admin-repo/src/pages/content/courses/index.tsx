import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import LifecycleChip from '@/components/common/LifecycleChip';
import PageHeader from '@/components/common/PageHeader';
import CommonButton from '@/components/common/CommonButton';
import CommonSelect from '@/components/common/CommonSelect';
import { BRAND, NEUTRAL } from '@/styles/customTheme';
import {
  getCourseList,
  CourseItem,
  CourseSearchParams,
  CourseTabCounts,
  fetchCourseTabCounts,
} from '@/services/CourseService';

type StatusTab = 'all' | 'published' | 'draft';

const STATUS_TABS: { value: StatusTab; labelKey: string }[] = [
  { value: 'all', labelKey: 'COMMON.ALL' },
  { value: 'published', labelKey: 'COMMON.PUBLISHED' },
  { value: 'draft', labelKey: 'COURSES.LIST.DRAFTS' },
];

const LANGUAGE_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'COURSES.LIST.ALL_LANGUAGES' },
  { value: 'english', labelKey: 'COURSES.LANGUAGE_ENGLISH' },
  { value: 'hindi', labelKey: 'COURSES.LANGUAGE_HINDI' },
];

const COUNT_CHIP_SX = {
  height: 20,
  fontSize: '11px',
  fontWeight: 600,
  backgroundColor: '#F3F4F6',
  color: '#374151',
  borderRadius: '10px',
};

const ROW_ICON_BUTTON_SX = {
  border: `1px solid ${NEUTRAL.border}`,
  borderRadius: '6px',
  width: 32,
  height: 32,
};

// Format date helper
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (err) {
    console.error('Failed to format date:', err);
    return dateStr;
  }
};

export default function CoursesPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tabCounts, setTabCounts] = useState<CourseTabCounts>({
    all: 50,
    published: 4,
    draft: 46,
  });
  const [loading, setLoading] = useState<boolean>(true);
  // Stores an i18n key so the message re-renders in the active language
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Status Tab Filter ('all' | 'published' | 'draft')
  const [statusTab, setStatusTab] = useState<StatusTab>('all');

  // Search & Language filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  // Server Pagination
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tab counts for All, Published, and Drafts
  useEffect(() => {
    fetchCourseTabCounts(debouncedSearch)
      .then((counts) => {
        setTabCounts(counts);
      })
      .catch((err) => console.error('Failed to load course counts:', err));
  }, [debouncedSearch]);

  // Fetch courses from Aspire LMS search API
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      // Determine status filter based on active tab
      let statusParam: string | undefined;
      if (statusTab === 'published') {
        statusParam = 'published';
      } else if (statusTab === 'draft') {
        statusParam = 'unpublished';
      }

      const params: CourseSearchParams = {
        query: debouncedSearch.trim(),
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        status: statusParam,
      };

      const response = await getCourseList(params);
      let content = response.content || [];

      // Filter by language client-side if selected
      if (languageFilter !== 'all') {
        content = content.filter(
          (c) => c.detectedLanguage?.toLowerCase() === languageFilter.toLowerCase()
        );
      }

      setCourses(content);
      const activeCount = response.count ?? content.length;
      setTotalCount(activeCount);
      setTabCounts((prev) => ({
        ...prev,
        [statusTab]: activeCount,
      }));
    } catch (err) {
      console.error('Error fetching courses:', err);
      setErrorKey('COURSES.LIST.FETCH_ERROR');
    } finally {
      setLoading(false);
    }
  }, [statusTab, debouncedSearch, languageFilter, page, rowsPerPage]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleStatusTabChange = (_: React.SyntheticEvent, newValue: StatusTab) => {
    setStatusTab(newValue);
    setPage(0);
  };

  const getSectionsLabel = (row: CourseItem): string | number => {
    if (row.moduleCount !== undefined) {
      return t('COURSES.MODULES_COUNT', { count: row.moduleCount });
    }
    if (row.leafNodesCount !== undefined) {
      return row.leafNodesCount;
    }
    return row.childNodes?.length || '—';
  };

  const openCourse = (row: CourseItem) => {
    router.push(`/content/courses/${row.courseId || row.identifier}`);
  };

  // Table Columns matching Swadhaar_Admin_Prototype (2).html:
  // Course | Sections | Duration | Language | Status | Updated | Actions
  const columns: ColumnDef<CourseItem>[] = useMemo(
    () => [
      {
        id: 'name',
        label: t('COURSES.LIST.COLUMN_COURSE'),
        labelKey: 'COURSES.LIST.COLUMN_COURSE',
        sortable: true,
        minWidth: 320,
        render: (row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {row.courseCode && (
              <Typography
                variant="caption"
                sx={{ color: NEUTRAL.muted, fontSize: '12px', fontWeight: 500 }}
              >
                {row.courseCode}
              </Typography>
            )}
            <Link
              href={`/content/courses/${row.courseId || row.identifier}`}
              style={{ textDecoration: 'none' }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: NEUTRAL.ink,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                }}
              >
                {row.cleanTitle || row.title || row.name}
              </Typography>
            </Link>
          </Box>
        ),
      },
      {
        id: 'sections',
        label: t('COURSES.LIST.COLUMN_SECTIONS'),
        labelKey: 'COURSES.LIST.COLUMN_SECTIONS',
        sortable: true,
        minWidth: 100,
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: NEUTRAL.ink, fontSize: '13px' }}>
            {getSectionsLabel(row)}
          </Typography>
        ),
      },
      {
        id: 'duration',
        label: t('COURSES.LIST.COLUMN_DURATION'),
        labelKey: 'COURSES.LIST.COLUMN_DURATION',
        minWidth: 130,
        render: (row) => (
          <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '13px' }}>
            {row.enrolledUsersCount !== undefined
              ? t('COURSES.LIST.ENROLLED_COUNT', { count: Number(row.enrolledUsersCount) || 0 })
              : (row.formattedDuration || '—')}
          </Typography>
        ),
      },
      {
        id: 'language',
        label: t('COMMON.LANGUAGE'),
        labelKey: 'COMMON.LANGUAGE',
        minWidth: 110,
        render: (row) => (
          <Chip
            label={row.detectedLanguage || t('COURSES.LANGUAGE_ENGLISH')}
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
        sortable: true,
        minWidth: 120,
        render: (row) => <LifecycleChip state={row.status || 'Live'} />,
      },
      {
        id: 'lastUpdatedOn',
        label: t('COURSES.LIST.COLUMN_UPDATED'),
        labelKey: 'COURSES.LIST.COLUMN_UPDATED',
        sortable: true,
        minWidth: 120,
        render: (row) => (
          <Typography variant="body2" sx={{ color: NEUTRAL.muted, fontSize: '12px' }}>
            {formatDate(row.lastUpdatedOn || row.createdOn)}
          </Typography>
        ),
      },
      {
        id: 'actions',
        label: t('COMMON.ACTIONS'),
        labelKey: 'COMMON.ACTIONS',
        align: 'right',
        minWidth: 140,
        render: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
            <Tooltip title={t('COURSES.LIST.OPEN_STRUCTURE')}>
              <IconButton
                size="small"
                aria-label={t('COURSES.LIST.OPEN_STRUCTURE')}
                onClick={() => openCourse(row)}
                sx={{
                  ...ROW_ICON_BUTTON_SX,
                  color: NEUTRAL.ink,
                  '&:hover': {
                    backgroundColor: BRAND.primarySoft,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                }}
              >
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('COURSES.EDIT_DETAILS')}>
              <IconButton
                size="small"
                aria-label={t('COURSES.EDIT_DETAILS')}
                onClick={() => openCourse(row)}
                sx={{
                  ...ROW_ICON_BUTTON_SX,
                  color: NEUTRAL.muted,
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                    color: NEUTRAL.ink,
                  },
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [t, router.locale]
  );

  return (
    <Box sx={{ py: 1 }}>
      {/* Page Title & Action Bar */}
      <PageHeader
        title={t('COURSES.LIST.TITLE')}
        subtitle={t('COURSES.LIST.SUBTITLE')}
        actions={
          <CommonButton variant="primary" onClick={() => router.push('/content/courses/create')}>
            {t('COURSES.LIST.CREATE_COURSE')}
          </CommonButton>
        }
      />

      {errorKey && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorKey(null)}>
          {t(errorKey)}
        </Alert>
      )}

      {/* Tabs and Toolbar Row matching Prototype */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: `1px solid ${NEUTRAL.border}`,
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Status Tabs */}
        <Tabs
          value={statusTab}
          onChange={handleStatusTabChange}
          textColor="inherit"
          sx={{
            minHeight: 44,
            '& .MuiTabs-indicator': {
              backgroundColor: NEUTRAL.ink,
              height: 2,
            },
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              color: NEUTRAL.muted,
              px: 2,
              '&.Mui-selected': {
                color: NEUTRAL.ink,
                fontWeight: 600,
              },
            },
          }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{t(tab.labelKey)}</span>
                  <Chip label={tabCounts[tab.value]} size="small" sx={COUNT_CHIP_SX} />
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Search & Language Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          {/* Language Filter */}
          <CommonSelect
            value={languageFilter}
            onChange={(value) => {
              setLanguageFilter(value);
              setPage(0);
            }}
            options={LANGUAGE_FILTER_OPTIONS.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
            fullWidth={false}
            sx={{ minWidth: 120, fontSize: '13px', borderRadius: '6px' }}
          />

          {/* Search Input */}
          <TextField
            size="small"
            placeholder={t('COMMON.SEARCH')}
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
                  <IconButton
                    size="small"
                    aria-label={t('COMMON.CLEAR')}
                    onClick={() => setSearchQuery('')}
                  >
                    <ClearIcon fontSize="small" sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: 260,
              backgroundColor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                height: 36,
                borderRadius: '6px',
                fontSize: '13px',
                '& fieldset': {
                  borderColor: NEUTRAL.border,
                },
                '&:hover fieldset': {
                  borderColor: NEUTRAL.ink,
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Swadhaar Data Table */}
      <SwadhaarDataTable<CourseItem>
        columns={columns}
        data={courses}
        keyExtractor={(item) => item.identifier}
        loading={loading}
        hideToolbar={true}
        emptyMessage={t('COURSES.LIST.EMPTY')}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={(newSize) => {
          setRowsPerPage(newSize);
          setPage(0);
        }}
      />

      {/* Prototype Footer Note */}
      <Box sx={{ mt: 1.5, px: 0.5 }}>
        <Typography variant="caption" sx={{ color: NEUTRAL.subtle, fontSize: '11px' }}>
          {t('COURSES.LIST.FOOTER_NOTE')}
        </Typography>
      </Box>
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
