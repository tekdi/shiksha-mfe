import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getCohortSearch } from '@/services/CohortService';
import { getTenantRoles, listUsersByRoles } from '@/services/UserService';
import { apiErrorMessage } from '@/utils/concurrency';
import { NEUTRAL } from '@/styles/customTheme';
import CommonButton from './CommonButton';

export interface UserGroup {
  cohortId: string;
  name: string;
  role?: string;
}

const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  px: 1.5,
  py: 0.75,
  borderBottom: `1px solid ${NEUTRAL.border}`,
} as const;

interface AddToGroupDialogProps {
  open: boolean;
  userName: string;
  /** Groups the user already belongs to */
  currentGroups: UserGroup[];
  onClose: () => void;
  onAdd: (groups: UserGroup[]) => Promise<void>;
  onRemove: (group: UserGroup) => Promise<void>;
}

export const AddToGroupDialog: React.FC<AddToGroupDialogProps> = ({
  open,
  userName,
  currentGroups,
  onClose,
  onAdd,
  onRemove,
}) => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setSearch('');
    setError('');
    setLoading(true);
    getCohortSearch({ limit: 200, offset: 0, sort: ['name', 'asc'], filters: { status: ['active', 'draft'] } })
      .then((res) => {
        const rows = res?.result?.results?.cohortDetails || [];
        setGroups(rows.map((g: any) => ({ cohortId: g.cohortId, name: g.name })));
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [open]);

  const memberIds = useMemo(() => new Set(currentGroups.map((g) => g.cohortId)), [currentGroups]);
  const visible = groups.filter((g) => g.name?.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = groups.filter((g) => selectedIds.includes(g.cohortId));
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(apiErrorMessage(e) || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Add {userName} to a group</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {currentGroups.length > 0 && selected.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            This user is already in {currentGroups.length === 1 ? 'another group' : 'other groups'}. Remove them if the
            user should only be in the selected groups.
          </Alert>
        )}
        {currentGroups.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: NEUTRAL.muted, mb: 0.5 }}>
              Current groups
            </Typography>
            <Box sx={{ border: `1px solid ${NEUTRAL.border}`, borderRadius: '8px' }}>
              {currentGroups.map((g) => (
                <Box key={g.cohortId} sx={ROW_SX}>
                  <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{g.name}</Typography>
                  <IconButton
                    size="small"
                    aria-label={`Remove from ${g.name}`}
                    disabled={busy}
                    onClick={() => run(() => onRemove(g))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        <TextField
          size="small"
          fullWidth
          placeholder="Search groups"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ border: `1px solid ${NEUTRAL.border}`, borderRadius: '8px', maxHeight: 260, overflowY: 'auto' }}>
          {loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={22} /></Box>
          )}
          {!loading && visible.length === 0 && (
            <Typography sx={{ p: 2, fontSize: 13, color: NEUTRAL.muted }}>No groups found.</Typography>
          )}
          {visible.map((g) => {
            const isMember = memberIds.has(g.cohortId);
            return (
              <Box key={g.cohortId} sx={{ ...ROW_SX, opacity: isMember ? 0.6 : 1 }}>
                <Checkbox
                  size="small"
                  checked={isMember || selectedIds.includes(g.cohortId)}
                  disabled={isMember}
                  onChange={() => toggle(g.cohortId)}
                />
                <Typography sx={{ flex: 1, fontSize: 13 }}>{g.name}</Typography>
                {isMember && <Typography sx={{ fontSize: 11, color: NEUTRAL.muted }}>Already a member</Typography>}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <CommonButton variant="secondary" onClick={onClose} disabled={busy}>Cancel</CommonButton>
        <CommonButton
          variant="primary"
          disabled={selected.length === 0 || busy}
          onClick={() => run(() => onAdd(selected))}
        >
          {selected.length > 1 ? `Add to ${selected.length} groups` : 'Add to group'}
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
};

export interface ReviewUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AddReviewUsersDialogProps {
  open: boolean;
  reviewerName: string;
  /** Ids already assigned, shown checked and not selectable again */
  assignedIds: string[];
  excludeId?: string;
  onClose: () => void;
  onAdd: (users: ReviewUser[]) => void;
}

const toReviewUser = (u: any): ReviewUser => {
  const name = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ').trim();
  return {
    id: u.userId || u.id,
    name: name || u.name || u.username || '-',
    email: u.email || u.username || '',
    role: u.role || u.roles?.[0]?.roleName || u.roles?.[0] || '',
  };
};

export const AddReviewUsersDialog: React.FC<AddReviewUsersDialogProps> = ({
  open,
  reviewerName,
  assignedIds,
  excludeId,
  onClose,
  onAdd,
}) => {
  const [users, setUsers] = useState<ReviewUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSearch('');
    setLoading(true);
    getTenantRoles()
      // every role, so users of any role can be picked
      .then((roles) => listUsersByRoles({ limit: 100, offset: 0, filters: {} }, roles.map((r) => r.name)))
      .then(({ users: rows }) => setUsers(rows.map(toReviewUser).filter((u) => u.id && u.id !== excludeId)))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [open, excludeId]);

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Add individual user to review</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: 12.5, color: NEUTRAL.muted, mb: 1.5 }}>
          Reviewer: <b>{reviewerName}</b>. Pick the users this reviewer should follow.
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ border: `1px solid ${NEUTRAL.border}`, borderRadius: '8px', maxHeight: 300, overflowY: 'auto' }}>
          {loading && <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={22} /></Box>}
          {!loading && visible.length === 0 && (
            <Typography sx={{ p: 2, fontSize: 13, color: NEUTRAL.muted }}>No users found.</Typography>
          )}
          {visible.map((u) => {
            const assigned = assignedIds.includes(u.id);
            return (
              <Box key={u.id} sx={{ ...ROW_SX, opacity: assigned ? 0.6 : 1 }}>
                <Checkbox
                  size="small"
                  checked={assigned || selected.includes(u.id)}
                  disabled={assigned}
                  onChange={() => toggle(u.id)}
                />
                <Typography sx={{ flex: 1, fontSize: 13 }}>{u.name}</Typography>
                <Typography sx={{ fontSize: 12, color: NEUTRAL.muted }}>{u.role}</Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <CommonButton variant="secondary" onClick={onClose}>Cancel</CommonButton>
        <CommonButton
          variant="primary"
          disabled={selected.length === 0}
          onClick={() => onAdd(users.filter((u) => selected.includes(u.id)))}
        >
          Add
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
};
