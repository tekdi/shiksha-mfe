import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import PageHeader from '@/components/common/PageHeader';
import CommonButton from '@/components/common/CommonButton';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import BranchFormDialog, { BranchSaved } from '@/components/masters/BranchFormDialog';
import {
  MasterRowActions,
  MasterStatusChip,
  MastersFilterBar,
  StatusChangeDialog,
} from '@/components/masters/MastersShared';
import { useDebounced, useMasterList } from '@/components/masters/useMasterList';
import {
  Branch,
  listBranches,
  listDistricts,
  listStates,
  LocationOption,
  updateBranch,
} from '@/services/MastersService';
import { apiErrorMessage } from '@/utils/concurrency';
import { StatusFilter } from '@/utils/masters';

interface Feedback {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const NONE = '-';

/**
 * Branch Management (Administration menu): branches under the fixed state and district master
 * list. Add a branch by picking its state and district and entering its code and name; rename,
 * deactivate or reactivate it. Nothing is deleted; users keep a deactivated branch.
 */
export default function BranchManagementPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [stateValue, setStateValue] = useState('');
  const [districtValue, setDistrictValue] = useState('');
  const filters = useMemo(
    () => ({ search, status, stateValue, districtValue }),
    [search, status, stateValue, districtValue]
  );
  const list = useMasterList(listBranches, filters);
  const { setPage } = list;

  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  // The target stays set while the dialog closes, so its text doesn't change mid-animation
  const [statusTarget, setStatusTarget] = useState<Branch | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ open: false, message: '', severity: 'success' });

  const notify = (message: string, severity: Feedback['severity'] = 'success') =>
    setFeedback({ open: true, message, severity });

  useEffect(() => setPage(0), [filters, setPage]);

  useEffect(() => {
    listStates()
      .then(setStates)
      .catch((err) => notify(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.LOAD_FAILED'), 'error'));
  }, [t]);

  useEffect(() => {
    if (!stateValue) {
      setDistricts([]);
      return;
    }
    let current = true;
    listDistricts(stateValue)
      .then((items) => current && setDistricts(items))
      .catch((err) => current && notify(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.LOAD_FAILED'), 'error'));
    return () => {
      current = false;
    };
  }, [stateValue, t]);

  const openForm = (branch: Branch | null) => {
    setEditing(branch);
    setFormOpen(true);
  };

  const handleSaved = ({ branch, mode }: BranchSaved) => {
    setFormOpen(false);
    notify(t(mode === 'create' ? 'ADMINISTRATION.BRANCH.CREATED' : 'ADMINISTRATION.BRANCH.UPDATED', { name: branch.name }));
    list.reload();
  };

  const askStatusChange = (branch: Branch) => {
    setStatusTarget(branch);
    setStatusOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const target = statusTarget;
    setStatusSaving(true);
    try {
      await updateBranch(target.value, { isActive: !target.isActive });
      notify(
        t(target.isActive ? 'ADMINISTRATION.BRANCH.DEACTIVATED' : 'ADMINISTRATION.BRANCH.REACTIVATED', {
          name: target.name,
        })
      );
      list.reload();
    } catch (err) {
      notify(apiErrorMessage(err) || t('ADMINISTRATION.ERRORS.SAVE_FAILED'), 'error');
    } finally {
      setStatusSaving(false);
      setStatusOpen(false);
    }
  };

  const columns: ColumnDef<Branch>[] = useMemo(
    () => [
      { id: 'code', label: t('ADMINISTRATION.BRANCH.CODE'), minWidth: 110, render: (row) => row.code || NONE },
      { id: 'name', label: t('ADMINISTRATION.BRANCH.NAME'), minWidth: 180 },
      { id: 'districtName', label: t('ADMINISTRATION.BRANCH.DISTRICT'), render: (row) => row.districtName || NONE },
      { id: 'stateName', label: t('ADMINISTRATION.BRANCH.STATE'), render: (row) => row.stateName || NONE },
      {
        id: 'userCount',
        label: t('ADMINISTRATION.COLUMNS.USERS'),
        align: 'right',
        render: (row) => String(row.userCount ?? 0),
      },
      {
        id: 'isActive',
        label: t('COMMON.STATUS'),
        render: (row) => <MasterStatusChip isActive={row.isActive} />,
      },
      {
        id: 'actions',
        label: t('COMMON.ACTIONS'),
        align: 'center',
        render: (row) => (
          <MasterRowActions
            isActive={row.isActive}
            onEdit={() => openForm(row)}
            onToggleActive={() => askStatusChange(row)}
          />
        ),
      },
    ],
    [t]
  );

  return (
    <Box sx={{ py: 1 }}>
      <PageHeader
        title={t('ADMINISTRATION.BRANCH.TITLE')}
        subtitle={t('ADMINISTRATION.BRANCH.SUBTITLE')}
        actions={
          <CommonButton variant="primary" startIcon={<AddLocationAltOutlinedIcon />} onClick={() => openForm(null)}>
            {t('ADMINISTRATION.BRANCH.ADD')}
          </CommonButton>
        }
      />

      <MastersFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t('ADMINISTRATION.BRANCH.SEARCH_PLACEHOLDER')}
        status={status}
        onStatusChange={setStatus}
        onClear={() => {
          setSearchInput('');
          setStatus('all');
          setStateValue('');
          setDistrictValue('');
        }}
        location={{
          states,
          districts,
          stateValue,
          districtValue,
          onStateChange: (value) => {
            setStateValue(value);
            setDistrictValue('');
          },
          onDistrictChange: setDistrictValue,
        }}
      />

      <SwadhaarDataTable<Branch>
        columns={columns}
        data={list.rows}
        keyExtractor={(row) => row.value}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        hideToolbar
        page={list.page}
        rowsPerPage={list.rowsPerPage}
        totalCount={list.totalCount}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setRowsPerPage}
        emptyMessage={t('ADMINISTRATION.BRANCH.EMPTY')}
      />

      <BranchFormDialog open={formOpen} branch={editing} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <StatusChangeDialog
        open={statusOpen}
        group="BRANCH"
        deactivate={Boolean(statusTarget?.isActive)}
        name={statusTarget?.name ?? ''}
        userCount={statusTarget?.userCount ?? 0}
        loading={statusSaving}
        onConfirm={handleStatusChange}
        onClose={() => setStatusOpen(false)}
      />

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

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any, ['en', 'mr', 'hi'])),
  },
});
