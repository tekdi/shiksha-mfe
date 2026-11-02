import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Radio,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { getPathwayList, assignPathwayToUser, PathwayItem } from '@/services/PathwayService';
import { getCohortLearnerIds } from '@/services/CohortService';
import { BRAND, NEUTRAL } from '@/styles/customTheme';

interface AssignPathwayToGroupModalProps {
  open: boolean;
  onClose: () => void;
  cohortId: string;
  cohortName?: string;
  /** Called after the assign calls finish, with a summary for the page's snackbar */
  onDone?: (message: string, severity: 'success' | 'error') => void;
}

const ASSIGN_CONCURRENCY = 5;

/** Assigns one learning path to every learner in a group: POST /user/v1/pathway/assign once per learner */
export const AssignPathwayToGroupModal: React.FC<AssignPathwayToGroupModalProps> = ({
  open,
  onClose,
  cohortId,
  cohortName,
  onDone,
}) => {
  const [pathways, setPathways] = useState<PathwayItem[]>([]);
  const [learnerIds, setLearnerIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedId('');
    setError('');
    setLoading(true);
    Promise.all([getPathwayList({ limit: 100 }), getCohortLearnerIds(cohortId)])
      .then(([list, ids]) => {
        setPathways(list.pathways);
        setLearnerIds(ids);
      })
      .catch((err) => setError(err?.response?.data?.params?.errmsg || err?.message || 'Failed to load learning paths.'))
      .finally(() => setLoading(false));
  }, [open, cohortId]);

  const handleAssign = async () => {
    if (!selectedId || learnerIds.length === 0) return;
    setAssigning(true);
    let assigned = 0;
    let failed = 0;
    let firstError = '';
    const queue = [...learnerIds];
    const worker = async () => {
      while (queue.length > 0) {
        const userId = queue.shift() as string;
        try {
          await assignPathwayToUser(userId, selectedId);
          assigned += 1;
        } catch (err: any) {
          failed += 1;
          firstError = firstError || err?.response?.data?.params?.errmsg || err?.message || '';
        }
      }
    };
    await Promise.all(Array.from({ length: ASSIGN_CONCURRENCY }, worker));
    setAssigning(false);

    const pathwayName = pathways.find((p) => p.id === selectedId)?.name || 'learning path';
    if (failed === 0) {
      onDone?.(`Assigned "${pathwayName}" to ${assigned} learner(s).`, 'success');
      onClose();
    } else {
      onDone?.(
        `Assigned to ${assigned} learner(s); ${failed} failed${firstError ? `: ${firstError}` : ''}.`,
        'error'
      );
      if (assigned > 0) onClose();
      else setError(firstError || 'Could not assign the learning path.');
    }
  };

  return (
    <Dialog open={open} onClose={assigning ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        Assign learning path{cohortName ? ` to ${cohortName}` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography sx={{ fontSize: '13px', color: NEUTRAL.muted, mb: 1.5 }}>
              {learnerIds.length === 0
                ? 'This group has no learners to assign to.'
                : `The path is assigned to each of the ${learnerIds.length} learner(s) in this group.`}
            </Typography>
            {pathways.length === 0 && !error ? (
              <Typography sx={{ fontSize: '13px' }}>No learning paths available.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pathways.map((pathway) => (
                  <Box
                    key={pathway.id}
                    onClick={() => setSelectedId(pathway.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      border: `1px solid ${selectedId === pathway.id ? BRAND.primary : '#E5E7EB'}`,
                    }}
                  >
                    <Radio checked={selectedId === pathway.id} size="small" />
                    <Box>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{pathway.name}</Typography>
                      {pathway.description && (
                        <Typography sx={{ fontSize: '12px', color: NEUTRAL.muted }}>
                          {pathway.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={assigning} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!selectedId || learnerIds.length === 0 || assigning || loading}
          sx={{ textTransform: 'none' }}
        >
          {assigning ? 'Assigning…' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPathwayToGroupModal;
