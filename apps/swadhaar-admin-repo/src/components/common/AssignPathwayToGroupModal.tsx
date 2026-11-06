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
import {
  getPathwayList,
  getPathwayCourseIds,
  assignCohortToCourses,
  enrolLearnerInCohortCourses,
  PathwayItem,
} from '@/services/PathwayService';
import { getCohortLearnerIds } from '@/services/CohortService';
import { apiErrorMessage, runWithConcurrency } from '@/utils/concurrency';
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

/**
 * Assigns a learning path to a group: the path's courses are linked to the group (params.cohortId), then each
 * learner of the group is enrolled in the group's courses (POST /lms-service/v1/enrollments/cohort).
 */
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
    setError('');
    const pathwayName = pathways.find((p) => p.id === selectedId)?.name || 'learning path';
    try {
      const courseIds = await getPathwayCourseIds(selectedId);
      if (courseIds.length === 0) {
        throw new Error('This learning path has no courses yet. Add courses before assigning it to a group.');
      }
      await assignCohortToCourses(courseIds, cohortId);

      let enrolled = 0;
      let failed = 0;
      let firstError = '';
      await runWithConcurrency(learnerIds, ASSIGN_CONCURRENCY, (learnerId) =>
        enrolLearnerInCohortCourses(learnerId, cohortId).then(
          () => {
            enrolled += 1;
          },
          (err: any) => {
            failed += 1;
            firstError = firstError || apiErrorMessage(err);
          }
        )
      );
      if (failed === 0) {
        onDone?.(`Assigned "${pathwayName}" to the group and enrolled ${enrolled} learner(s).`, 'success');
      } else {
        const reason = firstError ? `: ${firstError}` : '';
        onDone?.(`Assigned "${pathwayName}"; ${enrolled} learner(s) enrolled, ${failed} failed${reason}.`, 'error');
      }
      onClose();
    } catch (err: any) {
      setError(apiErrorMessage(err) || 'Could not assign the learning path.');
    } finally {
      setAssigning(false);
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
                : `The path is linked to this group and its ${learnerIds.length} learner(s) are enrolled in it. A course belongs to one group, so its courses move here from any group they were linked to.`}
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
