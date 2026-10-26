import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
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
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import SDBVHierarchyFilter, { SDBVFilterValues } from '@/components/common/SDBVHierarchyFilter';
import CommonTextField from '@/components/common/CommonTextField';
import CommonSelect from '@/components/common/CommonSelect';
import { getUserList } from '@/services/UserService';
import {
  createCohort,
  bulkCreateCohortMembers,
  getCohortById,
} from '@/services/CohortService';
import { SWADHAAR_FIELD_IDS } from '@/utils/userPayloadBuilder';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';

export interface UserRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  stateDistrict: string;
  branch: string;
  rawUser?: any;
}

export interface SelectedMember {
  userId: string;
  name: string;
  email: string;
  roleInGroup: 'Learner' | 'Reviewer';
}

const DEFAULT_FILTERS: SDBVFilterValues = {
  search: '',
  status: 'active',
  state: 'all',
  district: 'all',
  block: 'all',
  branch: 'all',
  village: 'all',
  program: 'all',
  role: 'all',
};

const isActiveFilter = (value?: string): value is string => Boolean(value) && value !== 'all';

const USER_FILTER_KEYS = ['role', 'state', 'district', 'branch', 'program'] as const;

const buildUserSearchPayload = (filters: SDBVFilterValues, page: number, rowsPerPage: number) => {
  const filterObj: Record<string, string[]> = {
    status: isActiveFilter(filters.status) ? [filters.status.toLowerCase()] : ['active'],
  };
  USER_FILTER_KEYS.forEach((key) => {
    const value = filters[key];
    if (isActiveFilter(value)) {
      filterObj[key] = [value];
    }
  });

  const payload: Record<string, any> = {
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    filters: filterObj,
    sort: ['name', 'asc'],
  };
  const search = filters.search?.trim();
  if (search) {
    payload.search = search;
  }
  return payload;
};

const trimmedOrEmpty = (value?: string | number | null): string => (value ? String(value).trim() : '');

interface UserLocation {
  state: string;
  district: string;
  branch: string;
}

/** Overrides location fields with matching custom field values (last match wins, as before). */
const applyLocationCustomFields = (initial: UserLocation, customFields: unknown): UserLocation => {
  const result = { ...initial };
  if (!Array.isArray(customFields)) return result;
  for (const cf of customFields) {
    const label = (cf.label || cf.name || '').toLowerCase();
    const val = cf.selectedValues?.[0]?.value || cf.value?.[0] || cf.value;
    if (typeof val !== 'string' || !val.trim()) continue;
    if (label.includes('state')) result.state = val;
    if (label.includes('district') || label.includes('city')) result.district = val;
    if (label.includes('branch') || label.includes('block')) result.branch = val;
  }
  return result;
};

const mapUserToRow = (u: any, idx: number): UserRow => {
  const nameParts = [u.firstName, u.middleName, u.lastName].map(trimmedOrEmpty);
  const location = applyLocationCustomFields(
    { state: u.state || '', district: u.district || u.city || '', branch: u.branch || u.block || '' },
    u.customFields
  );
  const locParts = [location.state, location.district].filter(Boolean);

  return {
    userId: u.userId || u.id || `user-${idx}`,
    name: nameParts.filter(Boolean).join(' ') || u.name || u.username || '-',
    email: u.email && u.email !== '-' ? u.email : u.username || '-',
    role: u.role || u.tenantData?.[0]?.roleName || 'Student',
    stateDistrict: locParts.length > 0 ? locParts.join(' · ') : '-',
    branch: location.branch || '-',
    rawUser: u,
  };
};

const COHORT_LOCATION_FIELDS = [
  ['state', SWADHAAR_FIELD_IDS.STATE],
  ['district', SWADHAAR_FIELD_IDS.DISTRICT],
  ['branch', SWADHAAR_FIELD_IDS.BRANCH],
  ['program', SWADHAAR_FIELD_IDS.PROGRAM],
] as const;

const buildCohortCustomFields = (filters: SDBVFilterValues) =>
  COHORT_LOCATION_FIELDS.filter(([key]) => isActiveFilter(filters[key])).map(([key, fieldId]) => ({
    fieldId,
    value: [filters[key] as string],
  }));

/** Creates the cohort and returns its id (throws when the API does not return one). */
const createCohortFromForm = async (
  groupName: string,
  groupDescription: string,
  groupStatus: string,
  filters: SDBVFilterValues
): Promise<string> => {
  const customFields = buildCohortCustomFields(filters);
  const cohortPayload: any = {
    name: groupName.trim(),
    status: groupStatus.toLowerCase(),
    type: 'COHORT',
    cohort_type: 'batch',
    customFields: customFields.length > 0 ? customFields : undefined,
  };
  if (groupDescription.trim()) {
    cohortPayload.description = groupDescription.trim();
  }

  const createRes = await createCohort(cohortPayload);
  const cohortId =
    createRes?.result?.cohortId || createRes?.result?.id || createRes?.cohortId || createRes?.data?.cohortId;
  if (!cohortId) {
    throw new Error('Failed to retrieve newly created cohort ID.');
  }
  return cohortId;
};

/** Enrolls learners and reviewers into the cohort (one bulk call per role). */
const enrollMembers = async (cohortId: string, members: SelectedMember[]) => {
  const learners = members.filter((m) => m.roleInGroup === 'Learner').map((m) => m.userId);
  const reviewers = members.filter((m) => m.roleInGroup === 'Reviewer').map((m) => m.userId);

  if (learners.length > 0) {
    await bulkCreateCohortMembers({ userId: learners, cohortId: [cohortId], role: 'Student' });
  }
  if (reviewers.length > 0) {
    await bulkCreateCohortMembers({ userId: reviewers, cohortId: [cohortId], role: 'Reviewer' });
  }
};

const getSubmitIcon = (submitting: boolean, isAddMembersMode: boolean) => {
  if (submitting) return <CircularProgress size={16} color="inherit" />;
  return isAddMembersMode ? <PersonAddOutlinedIcon /> : <GroupAddOutlinedIcon />;
};

const getSubmitLabel = (submitting: boolean, isAddMembersMode: boolean, selectedCount: number): string => {
  if (submitting) return 'Processing...';
  if (isAddMembersMode) return `Enroll ${selectedCount} Member(s)`;
  return selectedCount > 0 ? `Create & Enroll ${selectedCount} Member(s)` : 'Create Group';
};

export default function CreateCohortPage() {
  const router = useRouter();
  const { cohortId: queryCohortId, mode } = router.query;
  const isAddMembersMode = Boolean(queryCohortId) || mode === 'addMembers';
  const targetCohortId = typeof queryCohortId === 'string' ? queryCohortId : '';

  // Existing Cohort state (for add-members mode)
  const [existingCohort, setExistingCohort] = useState<any>(null);

  // Group metadata state (for create mode)
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupStatus, setGroupStatus] = useState('active');

  // User search & table state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [filters, setFilters] = useState<SDBVFilterValues>(DEFAULT_FILTERS);

  // Selected members state (userId -> SelectedMember)
  const [selectedMembers, setSelectedMembers] = useState<Map<string, SelectedMember>>(new Map());

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Guard against unsaved changes on navigation
  const isFormDirty = useMemo(() => {
    if (submitting || submitted) return false;
    if (isAddMembersMode) {
      return selectedMembers.size > 0;
    }
    return Boolean(groupName.trim() || groupDescription.trim() || selectedMembers.size > 0);
  }, [submitting, submitted, isAddMembersMode, groupName, groupDescription, selectedMembers.size]);

  useUnsavedChangesGuard(
    isFormDirty,
    'You have unsaved changes to this group. Are you sure you want to leave this page?'
  );

  // Fetch existing cohort details if in add-members mode
  useEffect(() => {
    if (targetCohortId) {
      getCohortById(targetCohortId)
        .then((data) => {
          if (data) {
            setExistingCohort(data);
            setGroupName(data.name || '');
          }
        })
        .catch((err) => {
          console.error('Failed to fetch existing cohort:', err);
        });
    }
  }, [targetCohortId]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const payload = buildUserSearchPayload(filters, page, rowsPerPage);

      const response = await getUserList(payload);
      const rawList = response?.result?.getUserDetails || [];
      const total =
        Number(response?.result?.totalCount) ||
        Number(rawList[0]?.total_count) ||
        rawList.length;

      setTotalCount(total);

      const mapped: UserRow[] = rawList.map(mapUserToRow);

      setUsers(mapped);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoadingUsers(false);
    }
  }, [rowsPerPage, page, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Selection toggle handler
  const handleToggleUser = (user: UserRow) => {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      if (next.has(user.userId)) {
        next.delete(user.userId);
      } else {
        next.set(user.userId, {
          userId: user.userId,
          name: user.name,
          email: user.email,
          roleInGroup: 'Learner',
        });
      }
      return next;
    });
  };

  // Toggle all users on current page
  const handleToggleAllOnPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      if (event.target.checked) {
        users.forEach((u) => {
          if (!next.has(u.userId)) {
            next.set(u.userId, {
              userId: u.userId,
              name: u.name,
              email: u.email,
              roleInGroup: 'Learner',
            });
          }
        });
      } else {
        users.forEach((u) => {
          next.delete(u.userId);
        });
      }
      return next;
    });
  };

  const isAllCurrentPageSelected = useMemo(() => {
    if (users.length === 0) return false;
    return users.every((u) => selectedMembers.has(u.userId));
  }, [users, selectedMembers]);

  const isSomeCurrentPageSelected = useMemo(() => {
    if (users.length === 0) return false;
    const count = users.filter((u) => selectedMembers.has(u.userId)).length;
    return count > 0 && count < users.length;
  }, [users, selectedMembers]);

  // Update member role in group
  const handleChangeRole = (userId: string, newRole: 'Learner' | 'Reviewer') => {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      const existing = next.get(userId);
      if (existing) {
        next.set(userId, { ...existing, roleInGroup: newRole });
      }
      return next;
    });
  };

  // Remove a member from selection
  const handleRemoveMember = (userId: string) => {
    setSelectedMembers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  };

  // Submit action: Create Cohort + Bulk Enroll, or Bulk Enroll to existing cohort
  const handleSubmit = async () => {
    if (!isAddMembersMode && !groupName.trim()) {
      setFeedback({
        open: true,
        message: 'Group name is required.',
        severity: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const finalCohortId = isAddMembersMode
        ? targetCohortId
        : await createCohortFromForm(groupName, groupDescription, groupStatus, filters);

      // Step 2: Enroll selected members
      const membersArray = Array.from(selectedMembers.values());
      if (finalCohortId) {
        await enrollMembers(finalCohortId, membersArray);
      }

      setFeedback({
        open: true,
        message: isAddMembersMode
          ? `Successfully added ${membersArray.length} member(s) to group.`
          : 'Group created and members enrolled successfully!',
        severity: 'success',
      });
      setSubmitted(true);

      // Redirect to group detail
      setTimeout(() => {
        router.push(finalCohortId ? `/cohorts/${finalCohortId}` : '/cohorts');
      }, 800);
    } catch (err: any) {
      console.error('Error creating group or enrolling members:', err);
      setFeedback({
        open: true,
        message:
          err?.response?.data?.message ||
          err?.message ||
          'Failed to process request. Please try again.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = selectedMembers.size;
  const isSubmitDisabled =
    submitting || (isAddMembersMode ? selectedCount === 0 : !groupName.trim());
  const pageTitle = isAddMembersMode
    ? `Add Members: ${existingCohort?.name || 'Group'}`
    : 'Create New Group';

  const renderUsersBody = () => {
    if (loadingUsers) {
      return (
        <TableRow>
          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: 'primary.main', mb: 1 }} />
            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
              Loading users directory...
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    if (users.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: '13.5px', color: '#6B7280' }}>
              No users found matching the filter criteria.
            </Typography>
          </TableCell>
        </TableRow>
      );
    }
    return users.map((row) => {
      const isSelected = selectedMembers.has(row.userId);
      return (
        <TableRow
          key={row.userId}
          hover
          selected={isSelected}
          onClick={() => handleToggleUser(row)}
          sx={{
            cursor: 'pointer',
            '&.Mui-selected': { backgroundColor: 'primary.50' },
            '&:last-child td': { border: 0 },
          }}
        >
          <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #F3F4F6' }}>
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={() => handleToggleUser(row)}
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: '#9CA3AF',
                '&.Mui-checked': { color: 'primary.main' },
              }}
            />
          </TableCell>

          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.2 }}>
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#111827',
                whiteSpace: 'nowrap',
              }}
            >
              {row.name}
            </Typography>
          </TableCell>

          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.2 }}>
            <Typography
              sx={{
                fontSize: '12.5px',
                color: '#4B5563',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.email}
            </Typography>
          </TableCell>

          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.2 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#6B7280' }}>
              {row.role}
            </Typography>
          </TableCell>

          <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.2 }}>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#6B7280',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.branch !== '-' ? `${row.branch} · ` : ''}
              {row.stateDistrict}
            </Typography>
          </TableCell>
        </TableRow>
      );
    })
  };

  return (
    <Box sx={{ py: 1.5, px: { xs: 1, md: 2 } }}>
      {/* 1. Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
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
          {isAddMembersMode && existingCohort?.name && (
            <MuiLink
              underline="hover"
              color="inherit"
              onClick={() => router.push(`/cohorts/${targetCohortId}`)}
              sx={{ cursor: 'pointer', color: '#6B7280', '&:hover': { color: 'primary.main' } }}
            >
              [{existingCohort.name}]
            </MuiLink>
          )}
          <Typography sx={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}>
            {isAddMembersMode ? 'Add members' : 'Create new group'}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* 2. Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '24px' }}>
          {pageTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px', mt: 0.3 }}>
          {isAddMembersMode
            ? 'Select registered beneficiaries and learners to add to this group.'
            : 'Configure group details and assign learners and reviewers from the directory.'}
        </Typography>
      </Box>

      {/* 3. Main 2-Column Responsive Layout */}
      <Grid container spacing={3}>
        {/* Left Column: User Directory & Filters */}
        <Grid item xs={12} lg={7.5}>
          {/* Filter Bar */}
          <Box sx={{ mb: 2 }}>
            <SDBVHierarchyFilter
              values={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setPage(0);
              }}
              showSearch={true}
              searchPlaceholder="Search people by name, email, or mobile..."
              showRole={true}
              showBranch={true}
              showProgram={true}
              onClear={() => {
                setFilters(DEFAULT_FILTERS);
                setPage(0);
              }}
            />
          </Box>

          {/* Users Table Card */}
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Beneficiaries & Learners
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#6B7280' }}>
                Showing {totalCount > 0 ? page * rowsPerPage + 1 : 0}–
                {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount} users
              </Typography>
            </Box>

            <TableContainer sx={{ minHeight: 340 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #E5E7EB' }}>
                      <Checkbox
                        size="small"
                        indeterminate={isSomeCurrentPageSelected}
                        checked={isAllCurrentPageSelected}
                        onChange={handleToggleAllOnPage}
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
                      }}
                    >
                      FULL NAME
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                      }}
                    >
                      LOGIN / EMAIL
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                      }}
                    >
                      ROLE
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #E5E7EB',
                      }}
                    >
                      LOCATION
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {renderUsersBody()}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number.parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: '1px solid #F3F4F6' }}
            />
          </Card>
        </Grid>

        {/* Right Column: Group Settings & Selected Members */}
        <Grid item xs={12} lg={4.5}>
          {/* Card 1: Group Details (shown in create mode or subtle summary in add-members mode) */}
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
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#111827', mb: 2 }}>
              {isAddMembersMode ? 'Cohort Information' : 'Group Details'}
            </Typography>

            {isAddMembersMode ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Group Name
                  </Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {existingCohort?.name || 'Loading...'}
                  </Typography>
                </Box>
                {existingCohort?.status && (
                  <Box>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                      Status
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#374151', textTransform: 'capitalize' }}>
                      {existingCohort.status}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <CommonTextField
                  id="create-cohort-name"
                  label="Group Name"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Pune Batch A - Financial Literacy"
                />

                <CommonTextField
                  id="create-cohort-description"
                  label="Description"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Optional notes or batch objectives..."
                  multiline
                  rows={2}
                />

                <CommonSelect
                  id="create-cohort-status"
                  label="Initial Status"
                  value={groupStatus}
                  onChange={(val) => setGroupStatus(val)}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'draft', label: 'Draft' },
                  ]}
                />
              </Box>
            )}
          </Card>

          {/* Card 2: Selected Members with Role in Group */}
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                Selected Members ({selectedCount})
              </Typography>
              {selectedCount > 0 && (
                <Button
                  size="small"
                  onClick={() => setSelectedMembers(new Map())}
                  sx={{ textTransform: 'none', fontSize: '12px', color: '#DC2626' }}
                >
                  Clear all
                </Button>
              )}
            </Box>

            {selectedCount === 0 ? (
              <Box
                sx={{
                  py: 4,
                  px: 2,
                  textAlign: 'center',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px dashed #D1D5DB',
                }}
              >
                <PersonAddOutlinedIcon sx={{ fontSize: 32, color: '#9CA3AF', mb: 1 }} />
                <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                  No members selected
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#9CA3AF', mt: 0.5 }}>
                  Select beneficiaries from the directory table on the left to assign them to this group.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  maxHeight: 380,
                  overflowY: 'auto',
                  pr: 0.5,
                }}
              >
                {Array.from(selectedMembers.values()).map((member) => (
                  <Box
                    key={member.userId}
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '11.5px',
                          color: '#6B7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {member.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          size="small"
                          value={member.roleInGroup}
                          onChange={(e) =>
                            handleChangeRole(
                              member.userId,
                              e.target.value as 'Learner' | 'Reviewer'
                            )
                          }
                          sx={{
                            fontSize: '12px',
                            height: '30px',
                            backgroundColor: '#FFFFFF',
                            '& .MuiSelect-select': { py: '4px', px: '8px' },
                          }}
                        >
                          <MenuItem value="Learner" sx={{ fontSize: '12px' }}>
                            Learner
                          </MenuItem>
                          <MenuItem value="Reviewer" sx={{ fontSize: '12px' }}>
                            Reviewer
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMember(member.userId)}
                          sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Card>

          {/* Action Card */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 1.5,
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push(targetCohortId ? `/cohorts/${targetCohortId}` : '/cohorts')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 500,
                color: '#374151',
                borderColor: '#D1D5DB',
                '&:hover': { backgroundColor: '#F9FAFB' },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              startIcon={getSubmitIcon(submitting, isAddMembersMode)}
              sx={{
                backgroundColor: '#D4752A',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13.5px',
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#B85D1A' },
                '&:disabled': { backgroundColor: '#E5E7EB', color: '#9CA3AF' },
              }}
            >
              {getSubmitLabel(submitting, isAddMembersMode, selectedCount)}
            </Button>
          </Box>
        </Grid>
      </Grid>

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

export const getServerSideProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
};
