import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  Grid,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { apiErrorMessage, runWithConcurrency } from '@/utils/concurrency';
import { getUserCourseProgress, UserCourseProgress } from '@/services/CourseService';
import { getUserDetailsInfo, blockUser, unblockUser, deleteUser } from '@/services/UserService';
import CreateUserModal from '@/components/common/CreateUserModal';
import { readUserLocation, resolveLocationLabels, UserLocation } from '@/utils/userLocation';
import { AddToGroupDialog, AddReviewUsersDialog, UserGroup, ReviewUser } from '@/components/common/UserGroupDialogs';
import {
  bulkCreateCohortMembers,
  getMembershipId,
  isCurrentMember,
  removeUsersFromCohorts,
  getCohortMemberListApplication,
  getCohortSearch,
  getMemberRows,
} from '@/services/CohortService';

const EMPTY_PARSED_USER = {
  fullName: '-',
  initials: 'U',
  email: '-',
  phone: '-',
  empId: '-',
  gender: '-',
  state: '-',
  district: '-',
  branch: '-',
  stateValue: '',
  districtValue: '',
  blockValue: '',
  program: '-',
  role: 'Student',
  status: 'active',
};

const getQueryParam = (value: string | string[] | undefined): string => {
  if (typeof value === 'string') return value;
  return Array.isArray(value) ? value[0] : '';
};

const trimmedOrEmpty = (value?: string | number | null): string => (value ? String(value).trim() : '');

const BRANCH_LABEL_HINTS = ['university', 'college', 'branch', 'line 1', 'line 2'];
const PROGRAM_LABEL_HINTS = ['field(s) of study', 'field of study', 'course', 'level of education'];

interface LocationFields {
  state: string;
  district: string;
  branch: string;
  program: string;
}

/** Returns the trimmed string value of a custom field, or '' when it has none. */
const customFieldValue = (cf: any): string => {
  const rawVal = cf.value ?? cf.code;
  const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
  return typeof val === 'string' ? val.trim() : '';
};

/** Fills empty location fields from the user's custom fields (first match wins). */
const fillLocationFromCustomFields = (initial: LocationFields, customFields: any[]): LocationFields => {
  const result = { ...initial };
  for (const cf of customFields) {
    const label = (cf.label || cf.name || '').toLowerCase();
    const value = customFieldValue(cf);
    if (!value) continue;
    if (!result.state && label.includes('state')) result.state = value;
    if (!result.district && (label === 'city' || label === 'district')) result.district = value;
    if (!result.branch && BRANCH_LABEL_HINTS.some((hint) => label.includes(hint)) && !value.startsWith('http')) {
      result.branch = value;
    }
    if (!result.program && (label === 'program' || PROGRAM_LABEL_HINTS.some((hint) => label.includes(hint)))) {
      result.program = value;
    }
  }
  return result;
};

const getCustomFields = (userData: any): any[] => {
  if (Array.isArray(userData.customFields)) return userData.customFields;
  if (Array.isArray(userData.customField)) return userData.customField;
  return [];
};

const getInitials = (firstName: string, lastName: string, username?: string): string => {
  const firstInitial = firstName.charAt(0) || username?.charAt(0) || 'U';
  return (firstInitial + lastName.charAt(0)).toUpperCase();
};

const parseUserDetails = (userData: any) => {
  if (!userData) return EMPTY_PARSED_USER;

  const fn = trimmedOrEmpty(userData.firstName);
  const mn = trimmedOrEmpty(userData.middleName);
  const ln = trimmedOrEmpty(userData.lastName);
  const fullName = [fn, mn, ln].filter(Boolean).join(' ') || userData.name || userData.username || '-';
  const role = userData.role || userData.tenantData?.[0]?.roleName || 'Student';
  const gender = userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : '-';
  const isPhoneUsername = /^\d{10}$/.test(userData.username);

  const location = fillLocationFromCustomFields(
    {
      state: trimmedOrEmpty(userData.state),
      district: trimmedOrEmpty(userData.district) || trimmedOrEmpty(userData.city),
      branch: trimmedOrEmpty(userData.branch),
      program: trimmedOrEmpty(userData.program),
    },
    getCustomFields(userData)
  );

  const stored = readUserLocation(userData);

  return {
    stateValue: stored.state,
    districtValue: stored.district,
    blockValue: stored.block,
    fullName,
    initials: getInitials(fn, ln, userData.username),
    email: userData.email || userData.username || '-',
    phone: userData.mobile || userData.phone || '-',
    empId: userData.employeeId || (isPhoneUsername ? '-' : userData.username),
    gender,
    state: stored.state || location.state || userData.currentCountry || userData.country || '-',
    district: stored.district || location.district || '-',
    branch: stored.block || location.branch || '-',
    program: location.program || role,
    role,
    status: (userData.status || 'active').toLowerCase(),
  };
};

const dashToEmpty = (value: string): string => (value === '-' ? '' : value);

/** Maps the parsed profile to CreateUserModal's edit prefill shape ('-' placeholders become ''). */
const toEditInitialData = (userId: string, parsedUser: typeof EMPTY_PARSED_USER) => ({
  userId,
  fullName: dashToEmpty(parsedUser.fullName),
  email: dashToEmpty(parsedUser.email),
  phone: dashToEmpty(parsedUser.phone),
  employeeId: dashToEmpty(parsedUser.empId),
  gender: dashToEmpty(parsedUser.gender),
  role: parsedUser.role,
  // The stored option values (ids), so the edit dialog can select them in its state, district and block lists
  state: parsedUser.stateValue || dashToEmpty(parsedUser.state),
  district: parsedUser.districtValue || dashToEmpty(parsedUser.district),
  branch: parsedUser.blockValue || dashToEmpty(parsedUser.branch),
  program: dashToEmpty(parsedUser.program),
  status: parsedUser.status,
});

const DARK_CONFIRM_COLORS = { backgroundColor: '#18181B', hover: '#27272A' };
const DANGER_CONFIRM_COLORS = { backgroundColor: '#9F1239', hover: '#881337' };

const DialogText: React.FC<{ mb: number; children: React.ReactNode }> = ({ mb, children }) => (
  <Typography sx={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5, mb }}>{children}</Typography>
);

interface UserActionDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  titleMb?: number;
  confirmLabel: string;
  confirmColors: { backgroundColor: string; hover: string };
  onConfirm: () => void;
  children: React.ReactNode;
}

/** Confirmation dialog used for the block / unblock / delete user actions. */
const UserActionDialog: React.FC<UserActionDialogProps> = ({
  open,
  onClose,
  title,
  titleMb = 2,
  confirmLabel,
  confirmColors,
  onConfirm,
  children,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: '100%',
        maxWidth: '520px',
        borderRadius: '16px',
        p: 3,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    }}
  >
    <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 700, color: '#111827', mb: titleMb }}>
      {title}
    </Typography>
    {children}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
      <Button
        variant="outlined"
        onClick={onClose}
        sx={{
          textTransform: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
          borderColor: '#D1D5DB',
          backgroundColor: '#FFFFFF',
          px: 2.2,
          py: 0.8,
          '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#9CA3AF' },
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onConfirm}
        sx={{
          textTransform: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor: confirmColors.backgroundColor,
          color: '#FFFFFF',
          px: 2.4,
          py: 0.8,
          boxShadow: 'none',
          '&:hover': { backgroundColor: confirmColors.hover, boxShadow: 'none' },
        }}
      >
        {confirmLabel}
      </Button>
    </Box>
  </Dialog>
);

export default function UserDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const userId = getQueryParam(id);

  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Modal & Feedback states
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [dialogType, setDialogType] = useState<'block' | 'unblock' | 'delete' | 'remove_group' | 'remove_review' | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionType: 'delete' | 'block' | 'unblock' | 'remove_group' | 'remove_review';
  }>({
    open: false,
    title: '',
    description: '',
    actionType: 'block',
  });

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getUserDetailsInfo(userId);
      const user = res?.result?.userData || res?.userData || res;
      setUserData(user);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, fetchUserDetails]);

  // Extract parsed fields from userData
  const baseParsedUser = useMemo(() => parseUserDetails(userData), [userData]);

  // The record stores option ids (e.g. state "4"); show their names
  const [locationNames, setLocationNames] = useState<UserLocation | null>(null);
  useEffect(() => {
    setLocationNames(null);
    const { stateValue, districtValue, blockValue } = baseParsedUser;
    if (!stateValue) return;
    let cancelled = false;
    resolveLocationLabels({ state: stateValue, district: districtValue, block: blockValue })
      .then((names) => { if (!cancelled) setLocationNames(names); })
      .catch((e) => console.error('Failed to resolve location names:', e));
    return () => { cancelled = true; };
  }, [baseParsedUser]);

  const parsedUser = useMemo(
    () =>
      locationNames
        ? {
          ...baseParsedUser,
          state: locationNames.state || baseParsedUser.state,
          district: locationNames.district || baseParsedUser.district,
          branch: locationNames.block || baseParsedUser.branch,
        }
        : baseParsedUser,
    [baseParsedUser, locationNames]
  );

  // Groups the user belongs to: from the cohort member list, falling back to what the user record carries
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [groupReviewers, setGroupReviewers] = useState<Array<{ id: string; name: string; group: string }>>([]);
  const [individualReviews, setIndividualReviews] = useState<ReviewUser[]>([]);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [groupToRemove, setGroupToRemove] = useState<UserGroup | null>(null);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [courseProgress, setCourseProgress] = useState<UserCourseProgress[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [reviewToRemove, setReviewToRemove] = useState<ReviewUser | null>(null);

  const loadGroups = useCallback(async () => {
    if (!userId) return;
    // The member list cannot be filtered by user, so each group's members are checked for this user
    const mine: UserGroup[] = [];
    const reviewers: Array<{ id: string; name: string; group: string }> = [];
    try {
      const search = await getCohortSearch({
        limit: 200,
        offset: 0,
        filters: { status: ['active', 'draft', 'inactive'] },
      });
      const all: any[] = search?.result?.results?.cohortDetails || [];
      await runWithConcurrency(all, 5, async (g) => {
        try {
          const res = await getCohortMemberListApplication({
            limit: 1000,
            offset: 0,
            filters: { cohortId: [g.cohortId] },
          });
          const rows = getMemberRows(res).filter(isCurrentMember);
          const me = rows.find((m: any) => (m.userId || m.id) === userId);
          if (!me) return;
          mine.push({ cohortId: g.cohortId, name: g.name, role: me.role, membershipId: getMembershipId(me) });
          rows
            .filter((m: any) => String(m.role || '').toLowerCase() === 'reviewer' && (m.userId || m.id) !== userId)
            .forEach((m: any) => {
              const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.name || m.username || '-';
              reviewers.push({ id: m.userId || m.id, name, group: g.name });
            });
        } catch (e) {
          console.error('Failed to load members of group:', g.name, e);
        }
      });
    } catch (e) {
      console.error('Failed to load user groups:', e);
    }
    const sortedGroups = [...mine];
    sortedGroups.sort((x, y) => x.name.localeCompare(y.name));
    setUserGroups(sortedGroups);
    setGroupReviewers(reviewers);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setProgressLoading(true);
    getUserCourseProgress(userId)
      .then(setCourseProgress)
      .catch((e) => {
        console.error('Failed to load learning progress:', e);
        setCourseProgress([]);
      })
      .finally(() => setProgressLoading(false));
  }, [userId]);

  useEffect(() => {
    if (userId) loadGroups();
  }, [userId, loadGroups]);

  const handleAddToGroup = async (groups: UserGroup[]) => {
    await bulkCreateCohortMembers({ userId: [userId], cohortId: groups.map((g) => g.cohortId), role: 'Student', status: 'active' });
    setFeedback({ open: true, message: `${parsedUser.fullName} added to ${groups.map((g) => g.name).join(', ')}.`, severity: 'success' });
    setAddGroupOpen(false);
    loadGroups();
  };

  const handleRemoveFromGroup = async (group: UserGroup) => {
    await removeUsersFromCohorts([userId], [group.cohortId]);
    setFeedback({ open: true, message: `${parsedUser.fullName} removed from ${group.name}.`, severity: 'success' });
    loadGroups();
  };

  const userCohorts = userGroups;

  const handleStatusChange = async (status: 'blocked' | 'active', verb: 'block' | 'unblock') => {
    try {
      await (status === 'blocked' ? blockUser(userId) : unblockUser(userId));
      setUserData((prev: any) => ({ ...prev, status: status === 'blocked' ? 'inactive' : status }));
      setFeedback({ open: true, message: `${parsedUser.fullName} has been ${verb}ed.`, severity: 'success' });
      fetchUserDetails();
    } catch (e) {
      console.error(`Failed to ${verb} user:`, e);
      setFeedback({ open: true, message: `Failed to ${verb} user. Please try again.`, severity: 'error' });
    }
    setDialogType(null);
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(parsedUser.email);
      setFeedback({ open: true, message: `${parsedUser.fullName} has been deleted.`, severity: 'success' });
      router.push('/users');
    } catch (e) {
      console.error('Failed to delete user:', e);
      const reason = apiErrorMessage(e);
      setFeedback({ open: true, message: reason ? `Failed to delete user: ${reason}` : 'Failed to delete user. Please try again.', severity: 'error' });
    }
    setDialogType(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={36} sx={{ color: 'primary.main', mb: 2 }} />
        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Loading user details...</Typography>
      </Box>
    );
  }

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
            onClick={() => router.push('/users')}
            sx={{ cursor: 'pointer', color: '#6B7280', '&:hover': { color: 'primary.main' } }}
          >
            Users
          </MuiLink>
          <Typography sx={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}>
            {parsedUser.email}
          </Typography>
        </Breadcrumbs>

        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '20px',
              py: 0.4,
              px: 1.5,
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#111827',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              SA
            </Box>
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
                Admin
              </Typography>
              <Typography sx={{ fontSize: '10px', color: '#6B7280', lineHeight: 1 }}>
                Super Admin
              </Typography>
            </Box>
          </Box>
        </Box> */}
      </Box>

      {/* 2. Top User Card Matching Image 2 */}
      <Card
        sx={{
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
          boxShadow: 'none',
          backgroundColor: '#FFFFFF',
          p: 2.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Avatar Pill / Circle */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '10px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {parsedUser.initials}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontSize: '20px' }}>
                  {parsedUser.fullName}
                </Typography>

                <Chip
                  label={parsedUser.status === 'active' ? 'Active' : parsedUser.status.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: parsedUser.status === 'active' ? '#ECFDF5' : '#F3F4F6',
                    color: parsedUser.status === 'active' ? '#047857' : '#4B5563',
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    height: '22px',
                  }}
                />

                <Chip
                  label={parsedUser.role}
                  size="small"
                  sx={{
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    height: '22px',
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '13px' }}>
                {parsedUser.email} · {parsedUser.empId} · {parsedUser.state}, {parsedUser.district} · {parsedUser.branch}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons matching Image 2 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsEditModalOpen(true)}
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

            {parsedUser.status === 'blocked' || parsedUser.status === 'inactive' ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDialogType('unblock')}
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
                Restore
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDialogType('block')}
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
                Archive
              </Button>
            )}

            {/* <Button
              variant="outlined"
              size="small"
              onClick={() => setDialogType('delete')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#E11D48',
                borderColor: '#FECDD3',
                backgroundColor: '#FFFFFF',
                '&:hover': { backgroundColor: '#FFF1F2', borderColor: '#FDA4AF' },
              }}
            >
              Delete
            </Button> */}
          </Box>
        </Box>
      </Card>

      {/* 3. Two-Column Grid Matching Image 2 */}
      <Grid container spacing={2.5}>
        {/* Left Column: Profile, Location & Program, Role */}
        <Grid item xs={12} md={6}>
          {/* Card 1: Profile */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Profile
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Full name</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.fullName}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Email (login ID)</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.email}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Phone</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.phone}
                </Typography>
              </Box>

              {/* <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Employee ID</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.empId}
                </Typography>
              </Box> */}

              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Gender</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.gender}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Card 2: Location and program */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Location and program
              </Typography>

            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>State</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.state}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>District</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.district}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Branch</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.branch}
                </Typography>
              </Box>

              {/* <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Program</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.program}
                </Typography>
              </Box> */}
            </Box>
          </Card>

          {/* Card 3: Role */}
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Role
              </Typography>

            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Box sx={{ display: 'flex' }}>
                <Typography sx={{ width: 140, fontSize: '13px', color: '#6B7280' }}>Role</Typography>
                <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 500 }}>
                  {parsedUser.role}
                </Typography>
              </Box>


            </Box>
          </Card>
        </Grid>

        {/* Right Column: Groups, Reviews, Learning Progress */}
        <Grid item xs={12} md={6}>
          {/* Card 4: Groups */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Groups
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setAddGroupOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  borderRadius: '6px',
                  borderColor: '#D1D5DB',
                  color: '#374151',
                }}
              >
                Add to group
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {userCohorts.length > 0 ? (
                userCohorts.map((c: any) => (
                  <Box
                    key={c.cohortId || c.name || c.cohortName}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.8,
                      borderBottom: '1px solid #F3F4F6',
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
                      onClick={() => router.push(`/cohorts/${c.cohortId}`)}
                    >
                      {c.name || c.cohortName || 'Group'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={c.role || 'Learner'}
                        size="small"
                        sx={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: '11px', height: '22px' }}
                      />
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          aria-label={`Remove from ${c.name || 'group'}`}
                          onClick={() => setGroupToRemove(c)}
                          sx={{ color: '#9CA3AF', p: 0.3 }}
                        >
                          <RemoveCircleOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography sx={{ fontSize: '13px', color: '#6B7280', py: 1 }}>
                  Not enrolled in any group yet.
                </Typography>
              )}

              {/* Bottom footnote */}

            </Box>
          </Card>

          {/* Card 5: Reviews */}
          {/* <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
              mb: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                Reviews
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setAddReviewOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  borderRadius: '6px',
                  borderColor: '#D1D5DB',
                  color: '#374151',
                }}
              >
                Add individual user
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              {groupReviewers.length + individualReviews.length > 0 ? (
                <>
                  {groupReviewers.map((r) => (
                    <Box key={`${r.group}-${r.id}`}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{r.name}</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#6B7280' }}>
                        Reviewer · from the Reviewer role in {r.group}
                      </Typography>
                    </Box>
                  ))}
                  {individualReviews.map((u) => (
                    <Box key={u.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{u.name}</Typography>
                        <Typography sx={{ fontSize: '11.5px', color: '#6B7280' }}>
                          Individual user{u.role ? ` · ${u.role}` : ''}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          aria-label={`Remove ${u.name}`}
                          onClick={() => setReviewToRemove(u)}
                          sx={{ color: '#9CA3AF', p: 0.3 }}
                        >
                          <RemoveCircleOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </>
              ) : (
                <Typography sx={{ fontSize: '13px', color: '#6B7280', py: 0.5 }}>
                  No reviewer assigned.
                </Typography>
              )}
            </Box>
          </Card> */}

          {/* Card 6: Learning progress */}
          <Card
            sx={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: 'none',
              backgroundColor: '#FFFFFF',
              p: 2.5,
            }}
          >
            <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#111827', mb: 2 }}>
              Learning progress
            </Typography>

            {progressLoading && <CircularProgress size={20} sx={{ color: 'primary.main', mb: 2 }} />}
            {!progressLoading && courseProgress.length === 0 && (
              <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 2 }}>Not enrolled in any course yet.</Typography>
            )}
            {courseProgress.map((c) => (
              <Box key={c.courseId} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{c.title}</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#6B7280' }}>{c.progress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={c.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            ))}

            {/* <MuiLink
              underline="hover"
              onClick={() => router.push('/reports')}
              sx={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'primary.main',
                cursor: 'pointer',
              }}
            >
              View in Insights
            </MuiLink> */}
          </Card>
        </Grid>
      </Grid>

      <UserActionDialog
        open={dialogType === 'block'}
        onClose={() => setDialogType(null)}
        title={`Archive ${parsedUser.fullName}?`}
        confirmLabel="Archive user"
        confirmColors={DARK_CONFIRM_COLORS}
        onConfirm={() => handleStatusChange('blocked', 'block')}
      >
        <DialogText mb={2}>
          Their platform access is revoked immediately. The account and its data are not deleted, and
          you can restore them at any time.
        </DialogText>
        <DialogText mb={3}>They will see a message when they try to log in.</DialogText>
      </UserActionDialog>

      <UserActionDialog
        open={dialogType === 'unblock'}
        onClose={() => setDialogType(null)}
        title={`Restore ${parsedUser.fullName}?`}
        confirmLabel="Restore user"
        confirmColors={DARK_CONFIRM_COLORS}
        onConfirm={() => handleStatusChange('active', 'unblock')}
      >
        <DialogText mb={3}>
          Their platform access is restored immediately with their existing roles, groups and progress.
        </DialogText>
      </UserActionDialog>

      <UserActionDialog
        open={dialogType === 'delete'}
        onClose={() => setDialogType(null)}
        title={`Delete ${parsedUser.fullName}?`}
        titleMb={1.5}
        confirmLabel="Delete user"
        confirmColors={DANGER_CONFIRM_COLORS}
        onConfirm={handleDeleteUser}
      >
        <DialogText mb={2}>The user can no longer log in. Their record is kept for audit.</DialogText>
        {/* Shaded gray retention box */}
        <Box
          sx={{
            backgroundColor: '#F4F4F5',
            border: '1px solid #E4E4E7',
            borderRadius: '8px',
            px: 2,
            py: 1.5,
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: '13.5px', color: '#52525B' }}>
            Retention period and access to retained data
          </Typography>
        </Box>
      </UserActionDialog>

      {/* Confirmation Dialog for group/review removal */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        PaperProps={{ sx: { borderRadius: '12px', p: 1, maxWidth: 420 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
            {confirmDialog.description}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => {
              setConfirmDialog((prev) => ({ ...prev, open: false }));
              setFeedback({
                open: true,
                message: `Action executed: ${confirmDialog.title}`,
                severity: 'success',
              });
            }}
            sx={{ textTransform: 'none', borderRadius: '6px' }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <AddToGroupDialog
        open={addGroupOpen}
        userName={parsedUser.fullName}
        currentGroups={userGroups}
        onClose={() => setAddGroupOpen(false)}
        onAdd={handleAddToGroup}
        onRemove={handleRemoveFromGroup}
      />
      <AddReviewUsersDialog
        open={addReviewOpen}
        reviewerName={parsedUser.fullName}
        excludeId={userId}
        assignedIds={individualReviews.map((u) => u.id)}
        onClose={() => setAddReviewOpen(false)}
        onAdd={(picked) => {
          setIndividualReviews((prev) => [...prev, ...picked.filter((u) => !prev.some((x) => x.id === u.id))]);
          setAddReviewOpen(false);
        }}
      />
      <Dialog open={Boolean(groupToRemove)} onClose={() => setGroupToRemove(null)}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '16px' }}>Remove from {groupToRemove?.name}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
            Remove {parsedUser.fullName} from {groupToRemove?.name}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGroupToRemove(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const g = groupToRemove;
              setGroupToRemove(null);
              if (!g) return;
              try {
                await handleRemoveFromGroup(g);
              } catch (e) {
                setFeedback({ open: true, message: apiErrorMessage(e) || 'Failed to remove from group.', severity: 'error' });
              }
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(reviewToRemove)} onClose={() => setReviewToRemove(null)}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '16px' }}>Remove reviewer</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#4B5563' }}>
            Remove {reviewToRemove?.name} as a reviewer of {parsedUser.fullName}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewToRemove(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const r = reviewToRemove;
              setReviewToRemove(null);
              if (!r) return;
              setIndividualReviews((prev) => prev.filter((x) => x.id !== r.id));
              setFeedback({ open: true, message: `${r.name} removed from reviewers.`, severity: 'success' });
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={3000}
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

      {/* CreateUserModal in edit mode */}
      {isEditModalOpen && (
        <CreateUserModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchUserDetails();
          }}
          isEdit={true}
          initialData={toEditInitialData(userId, parsedUser)}
        />
      )}
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
