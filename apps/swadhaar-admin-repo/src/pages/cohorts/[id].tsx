import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTenantRoles } from '@/services/UserService';
import { apiErrorMessage, runWithConcurrency } from '@/utils/concurrency';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  TextField,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import CommonDialog from '@/components/common/CommonDialog';
import EditCohortModal from '@/components/common/EditCohortModal';
import { getCohortLearningPaths } from '@/services/PathwayService';
import AssignPathwayToGroupModal from '@/components/common/AssignPathwayToGroupModal';
import LifecycleChip from '@/components/common/LifecycleChip';
import {
  getCohortById,
  getCohortMemberListApplication,
  getMemberRows,
  getMemberTotal,
  getMembershipId,
  isCurrentMember,
  removeUsersFromCohorts,
  deleteCohort,
  setCohortMemberRole,
  toCohortRoleCode,
  COHORT_ROLE_LABELS,
  CohortRoleCode,
} from '@/services/CohortService';

const COHORT_ROLE_OPTIONS: CohortRoleCode[] = ['learner', 'reviewer'];

export interface MemberRowItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  /** The user's own role (Admin, Trainer, DI, ARM ...); group roles never change it */
  role: string;
  /** Role in this group only (Task 16a): learner or reviewer */
  cohortRoleCode: CohortRoleCode;
  membershipId: string;
  stateDistrict: string;
  branch: string;
  program: string;
  employeeId: string;
  organisationCode: string;
  organisationName: string;
  status: string;
  completionPercentage?: string;
  country?: string;
}

const MEMBER_STATUS_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  active: { backgroundColor: '#ECFDF5', color: '#047857' },
  applied: { backgroundColor: '#EFF6FF', color: '#1D4ED8' },
  shortlisted: { backgroundColor: '#F0FDF4', color: '#15803D' },
  submitted: { backgroundColor: '#FEF3C7', color: '#B45309' },
  inactive: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  rejected: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};
const DEFAULT_MEMBER_STATUS_STYLE = { backgroundColor: '#F3F4F6', color: '#4B5563' };

const MEMBER_HEAD_CELL_SX = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #E5E7EB',
  py: 1.2,
  whiteSpace: 'nowrap',
} as const;

const getMemberStatusStyle = (status: string) => MEMBER_STATUS_STYLES[status] ?? DEFAULT_MEMBER_STATUS_STYLE;

const getQueryParam = (value: string | string[] | undefined): string => {
  if (typeof value === 'string') return value;
  return Array.isArray(value) ? value[0] : '';
};

/** Cohort dates come as ISO strings; shown as 05 Nov 2026, or '—' when not set */
const formatCohortDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toGroupStatus = (status?: string): 'Active' | 'Inactive' | 'Archived' => {
  const rawStatus = (status || 'active').toLowerCase();
  if (rawStatus === 'inactive' || rawStatus === 'draft') return 'Inactive';
  if (rawStatus === 'archived') return 'Archived';
  return 'Active';
};

const trimmedOrEmpty = (value?: string | number | null): string => (value ? String(value).trim() : '');

const getMemberCustomFields = (user: any): any[] => {
  if (Array.isArray(user.customField)) return user.customField;
  if (Array.isArray(user.customFields)) return user.customFields;
  return [];
};

const memberFieldValue = (cf: any): string => {
  const rawVal = cf.value ?? cf.code ?? cf.selectedValues?.[0]?.value;
  const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
  return typeof val === 'string' ? val.trim() : '';
};

interface MemberLocation {
  state: string;
  district: string;
  branch: string;
  program: string;
}

/** Fills empty location fields from the member's custom fields (first match wins). */
const fillMemberLocation = (initial: MemberLocation, customFields: any[]): MemberLocation => {
  const result = { ...initial };
  for (const cf of customFields) {
    const label = (cf.label || cf.name || '').toLowerCase();
    const value = memberFieldValue(cf);
    if (!value) continue;
    if (!result.state && (label === 'state' || label.includes('choose your state'))) result.state = value;
    if (!result.district && (label === 'city' || label === 'district')) result.district = value;
    if (!result.branch && ['branch', 'block', 'institution', 'university', 'college'].some((hint) => label.includes(hint)) && !value.startsWith('http')) {
      result.branch = value;
    }
    if (!result.program && ['program', 'course', 'field of study', 'field(s) of study'].some((hint) => label.includes(hint))) {
      result.program = value;
    }
  }
  return result;
};

const mapMemberToRow = (user: any, index: number): MemberRowItem => {
  const userId = user.userId || user.id || `member-${index}`;
  const uUsername = trimmedOrEmpty(user.username);
  const nameParts = [user.firstName, user.middleName, user.lastName].map(trimmedOrEmpty);
  const fullName = nameParts.filter(Boolean).join(' ') || user.name || uUsername || '-';
  const email = user.email && user.email !== '-' ? String(user.email).trim() : uUsername || '-';

  const location = fillMemberLocation(
    {
      state: trimmedOrEmpty(user.state),
      district: trimmedOrEmpty(user.district) || trimmedOrEmpty(user.city),
      branch: trimmedOrEmpty(user.branch),
      program: trimmedOrEmpty(user.program),
    },
    getMemberCustomFields(user)
  );

  const country = trimmedOrEmpty(user.applicationCountry || user.currentCountry || user.country || user.permanentCountry);
  const locParts = [location.state, location.district].filter(Boolean);
  const countryAlreadyListed = locParts.some((p) => p.toLowerCase() === country.toLowerCase());
  const countrySuffix = country && !countryAlreadyListed ? `, ${country}` : '';
  const displayLocation = locParts.length > 0 ? locParts.join(' · ') + countrySuffix : country || '-';

  const formCompletion = user.form?.completionPercentage
    ? `${Math.round(Number(user.form.completionPercentage))}%`
    : undefined;

  return {
    id: userId,
    userId,
    fullName,
    email,
    role: user.role || user.membershipRole || '-',
    cohortRoleCode: toCohortRoleCode(user.cohortRoleCode),
    membershipId: getMembershipId(user),
    stateDistrict: displayLocation,
    branch: location.branch || location.district || country || '-',
    program: location.program || user.form?.title || '-',
    // Returned by cohortmember/list-application (user service, Task 32); '-' / '' when not set
    employeeId: trimmedOrEmpty(user.employeeId) || '-',
    organisationCode: trimmedOrEmpty(user.organisationCode),
    organisationName: trimmedOrEmpty(user.organisationName),
    status: (user.status || 'applied').toLowerCase(),
    completionPercentage: formCompletion,
    country,
  };
};

export default function GroupDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const cohortId = getQueryParam(id);

  const [cohort, setCohort] = useState<any>(null);
  const [members, setMembers] = useState<MemberRowItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cohortContents, setCohortContents] = useState<any[]>([]);

  // Filter States
  const [roleFilter, setRoleFilter] = useState<string>('all');
  // Role filter options: titles from the tenant roles API, as on the Users page
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  // Group role filter (Task 18): learner / reviewer in this group
  const [groupRoleFilter, setGroupRoleFilter] = useState<'all' | CohortRoleCode>('all');
  // Members whose group role is being saved from the table
  const [savingRoleIds, setSavingRoleIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    getTenantRoles()
      .then((roles) => setRoleOptions(roles.map((r) => r.name)))
      .catch(() => setRoleOptions([]));
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (router.query.role && typeof router.query.role === 'string') {
      setRoleFilter(router.query.role);
    }
  }, [router.query.role]);

  // Modals & Action States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAssignPathOpen, setIsAssignPathOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState<boolean>(false);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState<boolean>(false);
  const [newGroupRole, setNewGroupRole] = useState<CohortRoleCode>('reviewer');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Feedback Snackbar
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'error' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch cohort metadata
  const fetchCohortDetails = useCallback(async () => {
    if (!cohortId) return;
    try {
      const cohortData = await getCohortById(cohortId);
      if (cohortData) {
        setCohort(cohortData);
      }
    } catch (err) {
      console.error('Failed to load cohort details:', err);
    }
  }, [cohortId]);

  // Fetch cohort members list
  const fetchMembers = useCallback(async () => {
    if (!cohortId) return;
    setLoading(true);
    try {
      const filtersObj: any = {
        cohortId: [cohortId],
      };

      if (roleFilter && roleFilter !== 'all') {
        filtersObj.role = roleFilter;
      }
      if (groupRoleFilter !== 'all') {
        filtersObj.cohortRole = groupRoleFilter;
      }

      const payload: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        filters: filtersObj,
      };

      const res = await getCohortMemberListApplication(payload);
      const allRows = getMemberRows(res);
      const userDetails = allRows.filter(isCurrentMember);
      setTotalCount(Math.max(getMemberTotal(res, allRows) - (allRows.length - userDetails.length), userDetails.length));

      setMembers(userDetails.map(mapMemberToRow));
    } catch (err) {
      console.error('Failed to load cohort members:', err);
      setMembers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [cohortId, page, rowsPerPage, roleFilter, groupRoleFilter]);

  // Reviewers card: every Reviewer in this group, not only the ones on the current table page
  const [reviewerMembers, setReviewerMembers] = useState<MemberRowItem[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(false);
  const fetchReviewers = useCallback(async () => {
    if (!cohortId) return;
    setReviewersLoading(true);
    try {
      const res = await getCohortMemberListApplication({
        limit: 200,
        offset: 0,
        filters: { cohortId: [cohortId], cohortRole: 'reviewer' },
      });
      setReviewerMembers(
        getMemberRows(res)
          .filter(isCurrentMember)
          .map(mapMemberToRow)
          .filter((m) => m.cohortRoleCode === 'reviewer')
      );
    } catch (err) {
      console.error('Failed to load group reviewers:', err);
      setReviewerMembers([]);
    } finally {
      setReviewersLoading(false);
    }
  }, [cohortId]);

  // Fetch cohort assigned contents/learning paths
  const fetchCohortContent = useCallback(async () => {
    if (!cohortId) return;
    try {
      setCohortContents(await getCohortLearningPaths(cohortId as string));
    } catch (err) {
      // Non-critical, fallback gracefully
      console.log('No cohort content returned:', err);
    }
  }, [cohortId]);

  useEffect(() => {
    if (cohortId) {
      fetchCohortDetails();
      fetchMembers();
      fetchCohortContent();
    }
  }, [cohortId, fetchCohortDetails, fetchMembers, fetchCohortContent]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  // Client-side quick filter over current page results
  const displayedMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.stateDistrict.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        m.organisationCode.toLowerCase().includes(q) ||
        m.organisationName.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        COHORT_ROLE_LABELS[m.cohortRoleCode].toLowerCase().includes(q) ||
        m.status.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // Selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(displayedMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (rowId: string) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  // Action: Remove selected members from cohort
  const handleConfirmRemoveMembers = async () => {
    if (selectedIds.length === 0 || !cohortId) return;
    setActionLoading(true);
    try {
      await removeUsersFromCohorts(selectedIds, [cohortId]);
      setFeedback({
        open: true,
        message: `Successfully removed ${selectedIds.length} member(s) from group.`,
        severity: 'success',
      });
      setSelectedIds([]);
      setIsRemoveConfirmOpen(false);
      fetchMembers();
      fetchReviewers();
      fetchCohortDetails();
    } catch (err: any) {
      console.error('Failed to remove members:', err);
      setFeedback({
        open: true,
        message: apiErrorMessage(err) || 'Failed to remove members from group.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Saves group roles one membership at a time; returns the members saved and the first error
  const saveGroupRoles = async (rows: MemberRowItem[], code: CohortRoleCode) => {
    const saved: string[] = [];
    let firstError = '';
    await runWithConcurrency(rows, 5, async (row) => {
      try {
        if (!row.membershipId) throw new Error('This membership has no id.');
        await setCohortMemberRole(row.membershipId, code);
        saved.push(row.userId);
      } catch (err: any) {
        firstError = firstError || apiErrorMessage(err);
      }
    });
    return { saved, firstError };
  };

  // Action (Task 18): set Learner or Reviewer in this group on every selected member.
  // Only the group membership changes; the user's own role (Admin, Trainer, DI, ARM) stays as it is.
  const handleConfirmChangeRole = async () => {
    const rows = members.filter((m) => selectedIds.includes(m.id) && m.cohortRoleCode !== newGroupRole);
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    const { saved, firstError } = await saveGroupRoles(rows, newGroupRole);
    const failed = rows.length - saved.length;
    const label = COHORT_ROLE_LABELS[newGroupRole];
    if (failed === 0) {
      setFeedback({ open: true, message: `${selectedIds.length} member(s) are now ${label} in this group.`, severity: 'success' });
      setSelectedIds([]);
      setIsChangeRoleOpen(false);
    } else {
      setFeedback({
        open: true,
        message: `${failed} of ${rows.length} member(s) could not be updated${firstError ? `: ${firstError}` : '.'}`,
        severity: 'error',
      });
    }
    if (saved.length > 0) {
      fetchMembers();
      fetchReviewers();
    }
    setActionLoading(false);
  };

  // Inline change of one member's group role from the table
  const handleRowGroupRoleChange = async (row: MemberRowItem, code: CohortRoleCode) => {
    if (code === row.cohortRoleCode) return;
    setSavingRoleIds((prev) => new Set(prev).add(row.id));
    setMembers((prev) => prev.map((m) => (m.id === row.id ? { ...m, cohortRoleCode: code } : m)));
    const { saved, firstError } = await saveGroupRoles([row], code);
    if (saved.length === 0) {
      setMembers((prev) => prev.map((m) => (m.id === row.id ? { ...m, cohortRoleCode: row.cohortRoleCode } : m)));
      setFeedback({ open: true, message: firstError || 'The group role could not be changed.', severity: 'error' });
    } else {
      setFeedback({ open: true, message: `${row.fullName} is now ${COHORT_ROLE_LABELS[code]} in this group.`, severity: 'success' });
      fetchReviewers();
    }
    setSavingRoleIds((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
  };

  // Action: Delete cohort
  const handleConfirmDeleteCohort = async () => {
    if (!cohortId) return;
    setActionLoading(true);
    try {
      await deleteCohort(cohortId);
      setFeedback({
        open: true,
        message: `Group "${cohort?.name || 'Group'}" deleted successfully.`,
        severity: 'success',
      });
      setIsDeleteConfirmOpen(false);
      setTimeout(() => {
        router.push('/cohorts');
      }, 700);
    } catch (err: any) {
      console.error('Failed to delete cohort:', err);
      setFeedback({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Failed to delete group.',
        severity: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const groupName = cohort?.name || 'Group Details';
  const groupStatus = toGroupStatus(cohort?.status);

  const renderMembersBody = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={11} sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={30} sx={{ color: 'primary.main', mb: 1 }} />
            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
              Loading cohort members...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    if (displayedMembers.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={11} sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
              {members.length === 0
                ? 'No members found for this group.'
                : 'No members match the current search or filters.'}
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    return displayedMembers.map((row) => {
      const isSelected = selectedIds.includes(row.id);
      return (
        <TableRow
          key={row.id}
          hover
          selected={isSelected}
          sx={{
            '&:last-child td, &:last-child th': { border: 0 },
            '&.Mui-selected': { backgroundColor: 'primary.50' },
          }}
        >
          <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #F3F4F6' }}>
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={() => handleSelectRow(row.id)}
              sx={{
                color: '#9CA3AF',
                '&.Mui-checked': { color: 'primary.main' },
              }}
            />
          </TableCell>

          {/* 1. Full name */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Box
              sx={{ cursor: 'pointer', display: 'inline-block' }}
              onClick={() => router.push(`/users/${row.userId}`)}
            >
              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'primary.main',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#B85D1B',
                  },
                }}
              >
                {row.fullName}
              </Typography>
            </Box>
          </TableCell>

          {/* Employee ID */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#374151', whiteSpace: 'nowrap' }}>
              {row.employeeId}
            </Typography>
          </TableCell>

          {/* Organization: code, with the name below */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            {row.organisationCode ? (
              <Tooltip title={row.organisationName || row.organisationCode} placement="top">
                <Box sx={{ maxWidth: 160 }}>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                    {row.organisationCode}
                  </Typography>
                  {row.organisationName && (
                    <Typography sx={{ fontSize: '11.5px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.organisationName}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            ) : (
              <Typography sx={{ fontSize: '12.5px', color: '#9CA3AF' }}>-</Typography>
            )}
          </TableCell>

          {/* 2. Email (login ID) */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Tooltip title={row.email}>
              <Typography
                sx={{
                  fontSize: '12.5px',
                  color: '#374151',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.email}
              </Typography>
            </Tooltip>
          </TableCell>

          {/* 3. Own role (Admin, Trainer, DI, ARM ...): never changed from this page */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#4B5563' }}>
              {row.role}
            </Typography>
          </TableCell>

          {/* Group role: Learner / Reviewer in this group only */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <FormControl size="small">
              <Select
                value={row.cohortRoleCode}
                disabled={savingRoleIds.has(row.id)}
                onChange={(e) => handleRowGroupRoleChange(row, e.target.value as CohortRoleCode)}
                inputProps={{ 'aria-label': `Role of ${row.fullName} in this group` }}
                sx={{ fontSize: '12px', minWidth: 104, backgroundColor: '#FFFFFF', '& .MuiSelect-select': { py: 0.5 } }}
              >
                {COHORT_ROLE_OPTIONS.map((code) => (
                  <MenuItem key={code} value={code} sx={{ fontSize: '12.5px' }}>
                    {COHORT_ROLE_LABELS[code]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </TableCell>

          {/* 4. State · District / Location */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#4B5563', whiteSpace: 'nowrap' }}>
              {row.stateDistrict}
            </Typography>
          </TableCell>

          {/* 5. Branch */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#4B5563', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.branch}
            </Typography>
          </TableCell>

          {/* 6. Form Progress */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            {row.completionPercentage ? (
              <Chip
                label={row.completionPercentage}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '11px',
                  borderRadius: '12px',
                  height: '22px',
                  backgroundColor: row.completionPercentage === '100%' ? '#ECFDF5' : '#FEF3C7',
                  color: row.completionPercentage === '100%' ? '#047857' : '#B45309',
                }}
              />
            ) : (
              <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>-</Typography>
            )}
          </TableCell>

          {/* 7. Status */}
          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.3 }}>
            <Chip
              label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '11px',
                borderRadius: '12px',
                height: '22px',
                ...getMemberStatusStyle(row.status),
              }}
            />
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Box sx={{ py: 1.5, px: { xs: 1, md: 2 } }}>
      {/* 1. Breadcrumbs Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#9CA3AF' }} />}
          aria-label="breadcrumb"
          sx={{ fontSize: '13px' }}
        >
          <MuiLink
            underline="hover"
            color="inherit"
            onClick={() => router.push('/users')}
            sx={{ cursor: 'pointer', color: '#6B7280', '&:hover': { color: 'primary.main' } }}
          >
            People
          </MuiLink>
          <MuiLink
            underline="hover"
            color="inherit"
            onClick={() => router.push('/cohorts')}
            sx={{ cursor: 'pointer', color: '#6B7280', '&:hover': { color: 'primary.main' } }}
          >
            Groups
          </MuiLink>
          <Typography sx={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}>
            {groupName}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 2. Group Header Card with Title, Badges, and Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', fontSize: '24px' }}>
              {groupName}
            </Typography>
            <LifecycleChip state={groupStatus} />
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
            {cohort?.description || 'Cohort training group'} · {totalCount} enrolled member(s)
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mt: 0.3 }}>
            Start date: {formatCohortDate(cohort?.cohort_startDate)} · End date: {formatCohortDate(cohort?.cohort_endDate)}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsEditModalOpen(true)}
            startIcon={<EditOutlinedIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              borderColor: '#D1D5DB',
              backgroundColor: '#FFFFFF',
              '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#9CA3AF' },
            }}
          >
            Edit
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsDeleteConfirmOpen(true)}
            startIcon={<DeleteOutlineIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#DC2626',
              borderColor: '#FECDD3',
              backgroundColor: '#FFFFFF',
              '&:hover': { backgroundColor: '#FFF1F2', borderColor: '#FDA4AF' },
            }}
          >
            Delete
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<PersonAddOutlinedIcon fontSize="small" />}
            onClick={() => router.push(`/cohorts/create?cohortId=${cohortId}&mode=addMembers`)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#D4752A',
              color: '#FFFFFF',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#B85D1A', boxShadow: 'none' },
            }}
          >
            Add members
          </Button>
        </Box>
      </Box>

      {/* 3. Main Grid Layout: Left (Members Table) + Right (Reviewers & Learning Paths) */}
      <Grid container spacing={2.5}>
        {/* Left Column: Members Table Card */}
        <Grid item xs={12} lg={8.5}>
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
            }}
          >
            {/* Top Toolbar of Members Card */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                Enrolled Members ({totalCount})
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '12.5px', color: '#6B7280' }}>
                  {selectedIds.length} selected
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  disabled={selectedIds.length === 0}
                  onClick={() => setIsChangeRoleOpen(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#374151',
                    borderColor: '#D1D5DB',
                  }}
                >
                  Change group role
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  disabled={selectedIds.length === 0}
                  onClick={() => setIsRemoveConfirmOpen(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                    '&:hover': { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
                  }}
                >
                  Remove from group
                </Button>
              </Box>
            </Box>

            {/* Filter toolbar: Search, Status Chips, and Role Dropdown */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
                pb: 1.5,
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              {/* Search input */}
              <TextField
                size="medium"
                placeholder="Search name, email, Employee ID, Organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 320,
                  flexGrow: { xs: 1, sm: 0 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: '#F9FAFB',
                  },
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {/* Group role filter (Learner / Reviewer in this group) */}
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={groupRoleFilter}
                    onChange={(e) => {
                      setGroupRoleFilter(e.target.value as 'all' | CohortRoleCode);
                      setPage(0);
                    }}
                    inputProps={{ 'aria-label': 'Filter by group role' }}
                    sx={{ borderRadius: '8px', fontSize: '12.5px', height: '32px', backgroundColor: '#FFFFFF' }}
                  >
                    <MenuItem value="all" sx={{ fontSize: '12.5px' }}>
                      All group roles
                    </MenuItem>
                    {COHORT_ROLE_OPTIONS.map((code) => (
                      <MenuItem key={code} value={code} sx={{ fontSize: '12.5px' }}>
                        {COHORT_ROLE_LABELS[code]}s
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Own role filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(0);
                    }}
                    sx={{
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      height: '32px',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <MenuItem value="all" sx={{ fontSize: '12.5px' }}>
                      All own roles
                    </MenuItem>
                    {roleOptions.map((roleName) => (
                      <MenuItem key={roleName} value={roleName} sx={{ fontSize: '12.5px' }}>
                        {roleName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Table */}
            <TableContainer sx={{ minHeight: 320 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #E5E7EB' }}>
                      <Checkbox
                        size="small"
                        indeterminate={
                          selectedIds.length > 0 && selectedIds.length < displayedMembers.length
                        }
                        checked={displayedMembers.length > 0 && selectedIds.length === displayedMembers.length}
                        onChange={handleSelectAll}
                        sx={{
                          color: '#9CA3AF',
                          '&.Mui-checked': { color: 'primary.main' },
                          '&.MuiCheckbox-indeterminate': { color: 'primary.main' },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      FULL NAME
                    </TableCell>
                    <TableCell sx={MEMBER_HEAD_CELL_SX}>EMPLOYEE ID</TableCell>
                    <TableCell sx={MEMBER_HEAD_CELL_SX}>ORGANIZATION</TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      EMAIL (LOGIN ID)
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      OWN ROLE
                    </TableCell>
                    <TableCell sx={MEMBER_HEAD_CELL_SX}>GROUP ROLE</TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      STATE · DISTRICT
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      BRANCH
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      FORM PROGRESS
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                        py: 1.2,
                      }}
                    >
                      STATUS
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {renderMembersBody()}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 2, color: '#6B7280', fontSize: '12px' }}
            >
              Learner progress data is retained when a user is removed from a group.
            </Typography>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ borderTop: '1px solid #F3F4F6', mt: 1 }}
            />
          </Card>
        </Grid>

        {/* Right Column: Reviewers & Learning Paths Cards */}
        <Grid item xs={12} lg={3.5}>
          {/* Reviewers Card: members whose group role is Reviewer (Task 16a / 18) */}
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
              mb: 2.5,
            }}
          >
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827', mb: 2 }}>
              Reviewers ({reviewerMembers.length})
            </Typography>

            {reviewersLoading && reviewerMembers.length === 0 ? (
              <CircularProgress size={18} sx={{ color: 'primary.main' }} />
            ) : reviewerMembers.length === 0 ? (
              <Typography sx={{ fontSize: '12.5px', color: '#6B7280', py: 1 }}>
                No reviewers in this group yet. Set a member&apos;s Group Role to Reviewer in the table.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {reviewerMembers.map((rev) => (
                  <Box key={rev.userId}>
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => router.push(`/users/${rev.userId}`)}
                    >
                      {rev.fullName}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                      {[rev.email, rev.role && rev.role !== '-' ? rev.role : null].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Typography
              sx={{
                fontSize: '11.5px',
                color: '#9CA3AF',
                pt: 1.5,
                mt: 1.5,
                borderTop: '1px solid #F3F4F6',
                lineHeight: 1.4,
              }}
            >
              Reviewers in this group review the work of its learners. Their own role does not change.
            </Typography>
          </Card>

          {/* Learning Paths Card */}
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Learning Paths
              </Typography>
              {/* <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  size="small"
                  onClick={() => setIsAssignPathOpen(true)}
                  sx={{ textTransform: 'none', fontSize: '12px', color: 'primary.main', p: 0, minWidth: 0 }}
                >
                  Assign
                </Button>
                <Button
                  size="small"
                  onClick={() => router.push('/learning-paths')}
                  sx={{ textTransform: 'none', fontSize: '12px', color: 'primary.main', p: 0, minWidth: 0 }}
                >
                  Browse paths
                </Button>
              </Box> */}
            </Box>

            {cohortContents.length === 0 ? (
              <Box sx={{ py: 1 }}>
                <Typography sx={{ fontSize: '12.5px', color: '#6B7280', mb: 1 }}>
                  No learning paths assigned to this cohort yet.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setIsAssignPathOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '12px',
                    borderRadius: '6px',
                    borderColor: '#D1D5DB',
                    color: '#374151',
                  }}
                >
                  Assign Learning Path
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {cohortContents.map((cc, idx) => (
                  <Box
                    key={cc.id || idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                      onClick={() => router.push('/learning-paths')}
                    >
                      {cc.name || 'Learning path'}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                      Enrolled
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      <AssignPathwayToGroupModal
        open={isAssignPathOpen}
        onClose={() => setIsAssignPathOpen(false)}
        cohortId={cohortId as string}
        cohortName={cohort?.name}
        onDone={(message, severity) => {
          setFeedback({ open: true, message, severity });
          fetchCohortContent();
        }}
      />

      {/* Edit Cohort Modal */}
      {cohort && (
        <EditCohortModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setFeedback({
              open: true,
              message: 'Group updated successfully.',
              severity: 'success',
            });
            fetchCohortDetails();
          }}
          cohort={cohort}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <CommonDialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Group"
        subtitle={`Are you sure you want to delete "${groupName}"?`}
        confirmLabel={actionLoading ? 'Deleting...' : 'Delete Group'}
        confirmVariant="danger"
        confirmDisabled={actionLoading}
        loading={actionLoading}
        onConfirm={handleConfirmDeleteCohort}
      >
        <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
          The group will be removed from the list.
        </Typography>
      </CommonDialog>

      {/* Remove Members Confirmation Dialog */}
      <CommonDialog
        open={isRemoveConfirmOpen}
        onClose={() => setIsRemoveConfirmOpen(false)}
        title="Remove from Group"
        subtitle={`Remove ${selectedIds.length} member(s) from this group?`}
        confirmLabel={actionLoading ? 'Removing...' : 'Remove Members'}
        confirmVariant="danger"
        confirmDisabled={actionLoading}
        loading={actionLoading}
        onConfirm={handleConfirmRemoveMembers}
      >
        <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
          Enrolled members will be removed from this cohort. Their past course completion and assessment progress will remain intact.
        </Typography>
      </CommonDialog>

      {/* Change Role Dialog */}
      <CommonDialog
        open={isChangeRoleOpen}
        onClose={() => setIsChangeRoleOpen(false)}
        title="Change group role"
        subtitle={`Role in this group for ${selectedIds.length} member(s)`}
        confirmLabel={actionLoading ? 'Updating...' : 'Update group role'}
        confirmVariant="primary"
        confirmDisabled={actionLoading}
        loading={actionLoading}
        onConfirm={handleConfirmChangeRole}
      >
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth size="small">
            <Select
              value={newGroupRole}
              onChange={(e) => setNewGroupRole(e.target.value as CohortRoleCode)}
              sx={{ fontSize: '13.5px' }}
            >
              {COHORT_ROLE_OPTIONS.map((code) => (
                <MenuItem key={code} value={code}>
                  {COHORT_ROLE_LABELS[code]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 1.5 }}>
            Applies to this group only. Their own role (Admin, Trainer, DI, ARM) does not change.
          </Typography>
        </Box>
      </CommonDialog>

      {/* Feedback Snackbar */}
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

export const getServerSideProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
};
