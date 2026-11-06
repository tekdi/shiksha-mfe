import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Checkbox,
  CircularProgress,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getCohortSearch } from '@/services/CohortService';
import { getTenantRoles, listUsersByRoles } from '@/services/UserService';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

export interface AssignTarget {
  id: string;
  name: string;
}

interface ChooseGroupsUsersDialogProps {
  open: boolean;
  onClose: () => void;
  /** Already chosen groups and users, shown ticked when the dialog opens */
  groups: AssignTarget[];
  users: AssignTarget[];
  onApply: (groups: AssignTarget[], users: AssignTarget[]) => void;
}

interface UserOption extends AssignTarget {
  detail: string;
}

type Tab = 'groups' | 'users';

const CHECKBOX_SX = { color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } } as const;

const toggle = (list: AssignTarget[], item: AssignTarget): AssignTarget[] =>
  list.some((x) => x.id === item.id) ? list.filter((x) => x.id !== item.id) : [...list, item];

/** Groups tab and Users tab to pick who something is assigned to: groups from the cohort search, users from the user list. */
export const ChooseGroupsUsersDialog: React.FC<ChooseGroupsUsersDialogProps> = ({
  open,
  onClose,
  groups,
  users,
  onApply,
}) => {
  const [tab, setTab] = useState<Tab>('groups');
  const [search, setSearch] = useState('');
  const [groupOptions, setGroupOptions] = useState<AssignTarget[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<AssignTarget[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AssignTarget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('groups');
    setSearch('');
    setSelectedGroups(groups);
    setSelectedUsers(users);
    setLoading(true);
    const loadGroups = getCohortSearch({
      limit: 100,
      offset: 0,
      sort: ['updatedAt', 'desc'],
      filters: { status: ['active'] },
    })
      .then((res) => {
        const list: any[] = res?.result?.results?.cohortDetails || [];
        setGroupOptions(list.map((g) => ({ id: g.cohortId, name: g.name || 'Untitled group' })));
      })
      .catch((err) => {
        console.error('Failed to load groups:', err);
        setGroupOptions([]);
      });
    const loadUsers = getTenantRoles()
      .then((roles) =>
        listUsersByRoles(
          { limit: 100, offset: 0, filters: {} },
          roles.map((r) => r.name).filter((name) => !/admin/i.test(name))
        )
      )
      .then(({ users: raw }) =>
        setUserOptions(
          raw.map((u: any) => ({
            id: u.userId || u.id,
            name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'User',
            detail: [u.role || u.tenantData?.[0]?.roleName, u.email && u.email !== '-' ? u.email : u.username]
              .filter(Boolean)
              .join(' · '),
          }))
        )
      )
      .catch((err) => {
        console.error('Failed to load users:', err);
        setUserOptions([]);
      });
    Promise.all([loadGroups, loadUsers]).finally(() => setLoading(false));
    // the chosen lists are read once when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const q = search.trim().toLowerCase();
  const shownGroups = useMemo(
    () => groupOptions.filter((g) => !q || g.name.toLowerCase().includes(q)),
    [groupOptions, q]
  );
  const shownUsers = useMemo(
    () => userOptions.filter((u) => !q || u.name.toLowerCase().includes(q) || u.detail.toLowerCase().includes(q)),
    [userOptions, q]
  );

  const renderRow = (item: AssignTarget, detail: string | undefined, checked: boolean, onToggle: () => void) => (
    <Box
      key={item.id}
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        cursor: 'pointer',
        borderRadius: '6px',
        backgroundColor: checked ? BRAND.primarySoft : 'transparent',
        '&:hover': { backgroundColor: BRAND.primarySoft },
      }}
    >
      <Checkbox size="small" checked={checked} sx={CHECKBOX_SX} />
      <Box>
        <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: NEUTRAL.ink }}>{item.name}</Typography>
        {detail && <Typography sx={{ fontSize: '11.5px', color: NEUTRAL.muted }}>{detail}</Typography>}
      </Box>
    </Box>
  );

  const isGroups = tab === 'groups';
  let body: React.ReactNode;
  if (loading) {
    body = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={26} sx={{ color: 'primary.main' }} />
      </Box>
    );
  } else if (isGroups) {
    body =
      shownGroups.length === 0 ? (
        <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted, py: 2 }}>No groups found.</Typography>
      ) : (
        shownGroups.map((g) =>
          renderRow(g, undefined, selectedGroups.some((x) => x.id === g.id), () =>
            setSelectedGroups((prev) => toggle(prev, g))
          )
        )
      );
  } else {
    body =
      shownUsers.length === 0 ? (
        <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted, py: 2 }}>No users found.</Typography>
      ) : (
        shownUsers.map((u) =>
          renderRow(u, u.detail, selectedUsers.some((x) => x.id === u.id), () =>
            setSelectedUsers((prev) => toggle(prev, { id: u.id, name: u.name }))
          )
        )
      );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '10px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: NEUTRAL.ink }}>Choose groups or users</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>
      <Box sx={{ px: 3, borderBottom: `1px solid ${NEUTRAL.divider}` }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setSearch('');
          }}
          sx={{ minHeight: 40, '& .MuiTabs-indicator': { backgroundColor: 'primary.main' } }}
        >
          <Tab
            value="groups"
            label={`Groups (${selectedGroups.length})`}
            sx={{ textTransform: 'none', minHeight: 40, '&.Mui-selected': { color: 'primary.main', fontWeight: 600 } }}
          />
          <Tab
            value="users"
            label={`Users (${selectedUsers.length})`}
            sx={{ textTransform: 'none', minHeight: 40, '&.Mui-selected': { color: 'primary.main', fontWeight: 600 } }}
          />
        </Tabs>
      </Box>
      <DialogContent sx={{ p: 2.5 }}>
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isGroups ? 'Search groups' : 'Search users'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />
        <Box sx={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          {body}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onApply(selectedGroups, selectedUsers)}
          sx={{ textTransform: 'none', backgroundColor: '#E6873C', '&:hover': { backgroundColor: '#C66C23' } }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChooseGroupsUsersDialog;
