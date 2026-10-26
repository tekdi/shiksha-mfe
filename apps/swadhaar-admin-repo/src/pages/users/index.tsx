import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Chip, IconButton, Menu, MenuItem, Tooltip, Snackbar, Alert } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import SDBVHierarchyFilter, { SDBVFilterValues } from '@/components/common/SDBVHierarchyFilter';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import CreateUserModal from '@/components/common/CreateUserModal';
import CommonButton from '@/components/common/CommonButton';
import CommonDialog from '@/components/common/CommonDialog';
import PageHeader from '@/components/common/PageHeader';
import { getUserList } from '@/services/UserService';

export interface UserRowItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  stateDistrict: string;
  branch: string;
  program: string;
  status: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  username?: string;
  mobile?: string;
  phone?: string;
  employeeId?: string;
  gender?: string;
  state?: string;
  district?: string;
  rawUser?: any;
}

type UserDialogType = 'block' | 'unblock' | 'delete';

const DEFAULT_ROLE = 'Student';
const STATUS_BLOCKED = 'blocked';
const STATUS_ACTIVE = 'active';
const PHONE_REGEX = /^\d{10}$/;

const DEFAULT_FILTERS: SDBVFilterValues = {
  search: '',
  status: 'all',
  role: 'all',
  state: 'all',
  district: 'all',
  branch: 'all',
  program: 'all',
};

const MENU_ITEM_SX = { fontSize: '13px', py: 0.8, color: '#1F2937', fontWeight: 500 };
const CELL_TEXT_SX = { fontSize: '13px', color: '#4B5563', whiteSpace: 'nowrap' };

/** i18n keys for status values that have a translated label. */
const STATUS_LABEL_KEYS: Record<string, string> = {
  active: 'COMMON.ACTIVE',
  inactive: 'COMMON.INACTIVE',
  blocked: 'COMMON.BLOCKED',
  archived: 'COMMON.ARCHIVED',
  draft: 'COMMON.DRAFT',
};

const toStr = (val: any): string => (val !== null && val !== undefined ? String(val).trim() : '');

const lower = (val: any): string | undefined => val?.toLowerCase();

/** Returns the trimmed first value of the matching custom field, or undefined when there is none. */
const findCustomFieldValue = (customFields: any[], matcher: (cf: any) => boolean): string | undefined => {
  const field = customFields.find(matcher);
  if (!field?.value) return undefined;
  const val = Array.isArray(field.value) ? field.value[0] : field.value;
  return val ? toStr(val) : undefined;
};

const isStateField = (cf: any) =>
  cf.fieldId === '1c5e2836-4831-4b34-b963-8aeffd1c14f7' ||
  cf.fieldId === 'c572783a-4a0b-4936-8172-c2009d2453e3' ||
  cf.fieldId === '800265b1-9058-482a-94f4-726197e1dfe4' ||
  lower(cf.label) === 'state' ||
  lower(cf.name) === 'state';

const isDistrictField = (cf: any) =>
  cf.fieldId === '56ce5f2b-1d81-4d60-9eba-798f764008d3' ||
  cf.fieldId === 'd0368400-8529-407e-b8c6-f41c29297fa6' ||
  lower(cf.label) === 'city' ||
  lower(cf.label) === 'district' ||
  lower(cf.name) === 'city' ||
  lower(cf.name) === 'district';

const isBranchField = (cf: any) =>
  cf.fieldId === '2b5da81a-b803-4550-9af3-f4c61e8f8ca1' ||
  cf.fieldId === 'ac8dcb40-8c45-4acb-b4ea-4d6282c51c22' ||
  lower(cf.label)?.includes('university or college') ||
  lower(cf.label) === 'branch' ||
  lower(cf.label) === 'block' ||
  lower(cf.name) === 'branch' ||
  lower(cf.name) === 'block';

const isProgramField = (cf: any) =>
  cf.fieldId === '1b92932d-648b-4b26-9f12-f43cec5416ef' ||
  cf.fieldId === 'a64e51c9-082f-498f-a824-2c8fad206eae' ||
  lower(cf.label)?.includes('field(s) of study') ||
  lower(cf.label) === 'program' ||
  lower(cf.name) === 'program';

/** Maps a raw API user record to a table row. */
const mapUserRow = (u: any, idx: number): UserRowItem => {
  const userId = toStr(u.userId || u.id || `user-${idx}`);
  const fn = toStr(u.firstName);
  const ln = toStr(u.lastName);
  const mn = toStr(u.middleName);
  const uUsername = toStr(u.username);
  const name = toStr(u.name) || [fn, mn, ln].filter(Boolean).join(' ') || uUsername || '-';
  const email = u.email && u.email !== '-' ? toStr(u.email) : uUsername || '-';
  const actualRole = toStr(u.role || u.tenantData?.[0]?.roleName) || DEFAULT_ROLE;

  // Extract phone/mobile as clean string
  const rawMobile = toStr(u.mobile || u.phone);
  const usernameIsPhone = PHONE_REGEX.test(uUsername);
  const mobile = rawMobile || (usernameIsPhone ? uUsername : '');

  // Extract employeeId as clean string
  const rawEmpId = toStr(u.employeeId);
  const employeeId = rawEmpId || (!usernameIsPhone && uUsername ? uUsername : '');

  // Extract location fields from customFields, direct properties, and country fields
  let userState = toStr(u.state);
  let userDistrict = toStr(u.district || u.city);
  let userBranch = toStr(u.branch || u.block);
  let userProgram = toStr(u.program);

  if (Array.isArray(u.customFields)) {
    userState = findCustomFieldValue(u.customFields, isStateField) ?? userState;
    userDistrict = findCustomFieldValue(u.customFields, isDistrictField) ?? userDistrict;
    userBranch = findCustomFieldValue(u.customFields, isBranchField) ?? userBranch;
    userProgram = findCustomFieldValue(u.customFields, isProgramField) ?? userProgram;
  }

  // Build stateDistrict display string
  const locParts = [userState, userDistrict].filter(Boolean);
  const stateDistrict =
    locParts.length > 0
      ? locParts.join(' · ')
      : toStr(u.country || u.permanentCountry || u.currentCountry || '-');

  return {
    id: userId,
    userId,
    fullName: name,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    middleName: u.middleName || '',
    username: u.username || '',
    email,
    role: actualRole,
    mobile,
    phone: mobile,
    employeeId,
    gender: u.gender || '',
    state: userState,
    district: userDistrict,
    branch: userBranch && userBranch !== '[Branch]' ? userBranch : '-',
    program: userProgram && userProgram !== '[Program]' ? userProgram : '-',
    stateDistrict,
    status: u.status || 'Active',
    rawUser: u,
  };
};

/** Collects unique non-empty string values from the API list. */
const collectUnique = (list: any[], pick: (u: any) => any): string[] =>
  Array.from(new Set(list.map(pick).filter((v: any) => typeof v === 'string' && v.length > 0)));

// Status chip colors matching exact user specification
const getStatusChipStyles = (status: string) => {
  const s = status.toLowerCase();
  if (s === 'archived' || s === 'inactive') {
    return {
      color: '#9F1239',
      backgroundColor: 'rgba(159, 18, 57, 0.12)', // faint shade of #9F1239
    };
  }
  if (s === 'active') {
    return {
      color: '#15803D',
      backgroundColor: '#DCFCE7',
    };
  }
  if (s === 'draft') {
    return {
      color: '#B45309',
      backgroundColor: '#FEF3C7',
    };
  }
  if (s === 'blocked') {
    return {
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
    };
  }
  return {
    color: '#374151',
    backgroundColor: '#F3F4F6',
  };
};

/** Display label for a status value; unknown statuses are shown capitalised as before. */
const getStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = STATUS_LABEL_KEYS[status.toLowerCase()];
  if (key) return t(key);
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export default function UsersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRowItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Common Hierarchy & Search Filter State
  const [filters, setFilters] = useState<SDBVFilterValues>(DEFAULT_FILTERS);

  // Dynamic status and role options extracted from API response
  const [availableStatuses, setAvailableStatuses] = useState<string[]>(['active', 'inactive']);
  const [availableRoles, setAvailableRoles] = useState<string[]>([DEFAULT_ROLE]);

  // Action menu state for row actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeUser, setActiveUser] = useState<UserRowItem | null>(null);

  // Dialog state for Block, Unblock, Delete
  const [dialogType, setDialogType] = useState<UserDialogType | null>(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState<UserRowItem | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Create & Edit modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const payload: any = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        filters: {
          role: filters.role && filters.role !== 'all' ? [filters.role] : [DEFAULT_ROLE],
          status:
            filters.status && filters.status !== 'all'
              ? [filters.status.toLowerCase()]
              : ['active', 'inactive'],
        },
        sort: ['name', 'asc'],
      };

      const response = await getUserList(payload);
      if (response?.result?.getUserDetails) {
        const rawList = response.result.getUserDetails;

        // Collect unique statuses and roles directly from API response
        const apiStatuses = collectUnique(rawList, (u: any) => u.status?.toLowerCase());
        if (apiStatuses.length > 0) {
          setAvailableStatuses((prev) => Array.from(new Set([...prev, ...apiStatuses])));
        }

        const apiRoles = collectUnique(rawList, (u: any) => u.role);
        if (apiRoles.length > 0) {
          setAvailableRoles((prev) => Array.from(new Set([...prev, ...apiRoles])));
        }

        const mappedUsers: UserRowItem[] = rawList.map(mapUserRow);

        setUsers(mappedUsers);
        const count =
          Number(response.result.totalCount) ||
          Number(rawList[0]?.total_count) ||
          mappedUsers.length;
        setTotalCount(count);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('API fetch failed:', err);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, page, filters.role, filters.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search by typing name or email across the loaded dataset
  const displayedUsers = useMemo(() => {
    return users.filter((user) => {
      if (!filters.search?.trim()) return true;
      const term = filters.search.toLowerCase().trim();
      const matchesName = user.fullName.toLowerCase().includes(term);
      const matchesEmail = user.email.toLowerCase().includes(term);
      return matchesName || matchesEmail;
    });
  }, [users, filters.search]);

  const handleOpenActionMenu = (event: React.MouseEvent<HTMLElement>, user: UserRowItem) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveUser(user);
  };

  const handleCloseActionMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = () => {
    setMenuAnchorEl(null);
    setIsEditModalOpen(true);
  };

  const openActionDialog = (type: UserDialogType) => {
    setSelectedUserForAction(activeUser);
    setDialogType(type);
    handleCloseActionMenu();
  };

  const closeDialog = () => setDialogType(null);

  const getActionUserName = () => selectedUserForAction?.fullName || t('USERS.LIST.USER_FALLBACK');

  const updateUserStatus = (uid: string, status: string) => {
    setUsers((prev) => prev.map((u) => (u.userId === uid ? { ...u, status } : u)));
    if (activeUser?.userId === uid) {
      setActiveUser({ ...activeUser, status });
    }
  };

  const handleConfirmBlock = () => {
    if (selectedUserForAction) {
      const uid = selectedUserForAction.userId;
      setBlockedUserIds((prev) => new Set([...prev, uid]));
      updateUserStatus(uid, STATUS_BLOCKED);
      setSnackbar({
        open: true,
        message: t('USERS.LIST.BLOCKED_SUCCESS', { name: getActionUserName() }),
        severity: 'success',
      });
    }
    setDialogType(null);
  };

  const handleConfirmUnblock = () => {
    if (selectedUserForAction) {
      const uid = selectedUserForAction.userId;
      setBlockedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });
      updateUserStatus(uid, STATUS_ACTIVE);
      setSnackbar({
        open: true,
        message: t('USERS.LIST.UNBLOCKED_SUCCESS', { name: getActionUserName() }),
        severity: 'success',
      });
    }
    setDialogType(null);
  };

  const handleConfirmDelete = () => {
    if (selectedUserForAction) {
      const uid = selectedUserForAction.userId;
      setUsers((prev) => prev.filter((u) => u.userId !== uid));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setSnackbar({
        open: true,
        message: t('USERS.LIST.DELETED_SUCCESS', { name: getActionUserName() }),
        severity: 'success',
      });
    }
    setDialogType(null);
  };

  const isUserBlocked = (user: UserRowItem) =>
    blockedUserIds.has(user.userId) || user.status?.toLowerCase() === STATUS_BLOCKED;

  // Common Table Columns Definition
  const columns: ColumnDef<UserRowItem>[] = useMemo(
    () => [
      {
        id: 'fullName',
        label: t('USERS.LIST.COL_FULL_NAME'),
        labelKey: 'USERS.LIST.COL_FULL_NAME',
        minWidth: 160,
        render: (row) => (
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
                  color: 'primary.dark',
                },
              }}
            >
              {row.fullName}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'email',
        label: t('USERS.LIST.COL_EMAIL'),
        labelKey: 'USERS.LIST.COL_EMAIL',
        minWidth: 180,
        render: (row) => (
          <Tooltip title={row.email} arrow placement="top">
            <Typography
              sx={{
                fontSize: '13px',
                color: '#1F2937',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {row.email}
            </Typography>
          </Tooltip>
        ),
      },
      {
        id: 'role',
        label: t('USERS.LIST.COL_ROLE'),
        labelKey: 'USERS.LIST.COL_ROLE',
        render: (row) => (
          <Typography sx={{ fontSize: '13px', color: '#1F2937', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {row.role}
          </Typography>
        ),
      },
      {
        id: 'stateDistrict',
        label: t('USERS.LIST.COL_STATE_DISTRICT'),
        labelKey: 'USERS.LIST.COL_STATE_DISTRICT',
        render: (row) => <Typography sx={CELL_TEXT_SX}>{row.stateDistrict}</Typography>,
      },
      {
        id: 'branch',
        label: t('USERS.LIST.COL_BRANCH'),
        labelKey: 'USERS.LIST.COL_BRANCH',
        render: (row) => <Typography sx={CELL_TEXT_SX}>{row.branch}</Typography>,
      },
      {
        id: 'program',
        label: t('USERS.LIST.COL_PROGRAM'),
        labelKey: 'USERS.LIST.COL_PROGRAM',
        render: (row) => <Typography sx={CELL_TEXT_SX}>{row.program}</Typography>,
      },
      {
        id: 'status',
        label: t('USERS.LIST.COL_STATUS'),
        labelKey: 'USERS.LIST.COL_STATUS',
        render: (row) => {
          const isBlocked =
            blockedUserIds.has(row.userId) || row.status?.toLowerCase() === STATUS_BLOCKED;
          const effectiveStatus = isBlocked ? STATUS_BLOCKED : row.status;

          return (
            <Chip
              label={getStatusLabel(effectiveStatus, t)}
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                height: '24px',
                px: 0.5,
                ...getStatusChipStyles(effectiveStatus),
              }}
            />
          );
        },
      },
      {
        id: 'actions',
        label: '',
        align: 'right',
        render: (row) => (
          <IconButton
            size="small"
            aria-label={t('COMMON.ACTIONS')}
            onClick={(e) => handleOpenActionMenu(e, row)}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              p: 0.4,
              color: '#6B7280',
              '&:hover': { backgroundColor: '#F9FAFB' },
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [t, router.locale, blockedUserIds]
  );

  const actionUserName = selectedUserForAction?.fullName || t('USERS.DIALOG.FULL_NAME_FALLBACK');

  return (
    <Box sx={{ py: 1 }}>
      {/* 1. Header with Action Buttons */}
      <PageHeader
        title={t('USERS.LIST.TITLE')}
        subtitle={t('USERS.LIST.SUBTITLE')}
        actions={
          <>
            <CommonButton
              variant="secondary"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={() => router.push('/users/bulk-upload')}
            >
              {t('USERS.LIST.BULK_UPLOAD')}
            </CommonButton>
            <CommonButton
              variant="primary"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t('USERS.LIST.CREATE_USER')}
            </CommonButton>
          </>
        }
      />

      {/* 2. Common Filter Component: SDBVHierarchyFilter with search and hierarchy */}
      <SDBVHierarchyFilter
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        showSearch={true}
        searchPlaceholder={t('USERS.LIST.SEARCH_PLACEHOLDER')}
        showStatus={true}
        statusOptions={availableStatuses}
        showRole={true}
        roleOptions={availableRoles}
        showBranch={true}
        showProgram={true}
        onClear={() => {
          setFilters(DEFAULT_FILTERS);
          setPage(0);
        }}
      />

      {/* 3. Subtitle Row with Count */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          px: 0.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: '#4B5563', fontSize: '13px', fontWeight: 500 }}>
          {t('USERS.LIST.SHOWING_USERS', {
            from: totalCount > 0 ? page * rowsPerPage + 1 : 0,
            to: Math.min((page + 1) * rowsPerPage, totalCount),
            total: totalCount,
          })}
        </Typography>
      </Box>

      {/* 4. Common Table Component: SwadhaarDataTable */}
      <SwadhaarDataTable<UserRowItem>
        columns={columns}
        data={displayedUsers}
        keyExtractor={(row) => row.id}
        loading={loading}
        hideToolbar={true}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={(newSize) => {
          setRowsPerPage(newSize);
          setPage(0);
        }}
        emptyMessage={t('USERS.LIST.EMPTY')}
      />

      {/* 5. Action Menu (View details, Edit, Block, Delete) */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: {
            width: 150,
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
            py: 0.5,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const uid = activeUser?.userId;
            handleCloseActionMenu();
            if (uid) router.push(`/users/${uid}`);
          }}
          sx={MENU_ITEM_SX}
        >
          {t('COMMON.VIEW_DETAILS')}
        </MenuItem>
        <MenuItem onClick={handleEditClick} sx={MENU_ITEM_SX}>
          {t('COMMON.EDIT')}
        </MenuItem>
        {activeUser && isUserBlocked(activeUser) ? (
          <MenuItem onClick={() => openActionDialog('unblock')} sx={MENU_ITEM_SX}>
            {t('USERS.LIST.UNBLOCK')}
          </MenuItem>
        ) : (
          <MenuItem onClick={() => openActionDialog('block')} sx={MENU_ITEM_SX}>
            {t('USERS.LIST.BLOCK')}
          </MenuItem>
        )}
        <MenuItem onClick={() => openActionDialog('delete')} sx={{ ...MENU_ITEM_SX, color: '#DC2626' }}>
          {t('COMMON.DELETE')}
        </MenuItem>
      </Menu>

      {/* 6. Create User Modal */}
      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchUsers}
        availableRoles={availableRoles}
      />

      {/* 7. Edit User Modal */}
      {activeUser && (
        <CreateUserModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setActiveUser(null);
          }}
          onSuccess={fetchUsers}
          availableRoles={availableRoles}
          initialData={activeUser}
          isEdit={true}
        />
      )}

      {/* 8. Block User Dialog */}
      <CommonDialog
        open={dialogType === 'block'}
        onClose={closeDialog}
        title={t('USERS.DIALOG.BLOCK_TITLE', { name: actionUserName })}
        onConfirm={handleConfirmBlock}
        confirmLabel={t('USERS.DIALOG.BLOCK_CONFIRM')}
        confirmVariant="dark"
      >
        <Typography sx={{ fontSize: '14px', lineHeight: 1.5, mb: 2 }}>
          {t('USERS.DIALOG.BLOCK_DESCRIPTION')}
        </Typography>
        <Typography sx={{ fontSize: '14px', lineHeight: 1.5 }}>{t('USERS.DIALOG.BLOCK_LOGIN_NOTE')}</Typography>
      </CommonDialog>

      {/* 9. Unblock User Dialog */}
      <CommonDialog
        open={dialogType === 'unblock'}
        onClose={closeDialog}
        title={t('USERS.DIALOG.UNBLOCK_TITLE', { name: actionUserName })}
        onConfirm={handleConfirmUnblock}
        confirmLabel={t('USERS.DIALOG.UNBLOCK_CONFIRM')}
        confirmVariant="dark"
      >
        <Typography sx={{ fontSize: '14px', lineHeight: 1.5 }}>{t('USERS.DIALOG.UNBLOCK_DESCRIPTION')}</Typography>
      </CommonDialog>

      {/* 10. Delete User Dialog */}
      <CommonDialog
        open={dialogType === 'delete'}
        onClose={closeDialog}
        title={t('USERS.DIALOG.DELETE_TITLE', { name: actionUserName })}
        onConfirm={handleConfirmDelete}
        confirmLabel={t('USERS.DIALOG.DELETE_CONFIRM')}
        confirmVariant="danger"
      >
        <Typography sx={{ fontSize: '14px', lineHeight: 1.5, mb: 2 }}>
          {t('USERS.DIALOG.DELETE_DESCRIPTION')}
        </Typography>
        {/* Shaded retention box */}
        <Box
          sx={{
            backgroundColor: '#F4F4F5',
            border: '1px solid #E4E4E7',
            borderRadius: '8px',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontSize: '13.5px', color: '#52525B' }}>{t('USERS.DIALOG.DELETE_RETENTION')}</Typography>
        </Box>
      </CommonDialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {snackbar.message}
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
