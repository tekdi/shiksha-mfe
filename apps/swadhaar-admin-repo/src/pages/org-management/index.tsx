import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import PageHeader from '@/components/common/PageHeader';
import CommonButton from '@/components/common/CommonButton';
import SwadhaarDataTable, { ColumnDef } from '@/components/common/SwadhaarDataTable';
import OrganisationFormDialog, { OrganisationSaved } from '@/components/masters/OrganisationFormDialog';
import {
  MasterRowActions,
  MasterStatusChip,
  MastersFilterBar,
  StatusChangeDialog,
} from '@/components/masters/MastersShared';
import { useDebounced, useMasterList } from '@/components/masters/useMasterList';
import { listOrganisations, Organisation, updateOrganisation } from '@/services/MastersService';
import { apiErrorMessage } from '@/utils/concurrency';
import { StatusFilter } from '@/utils/masters';

interface Feedback {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

/**
 * Org Management (Administration menu): list, add, rename, deactivate and reactivate
 * organisations. Nothing is deleted; users keep a deactivated org.
 */
export default function OrgManagementPage() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounced(searchInput);
  const [status, setStatus] = useState<StatusFilter>('all');
  const filters = useMemo(() => ({ search, status }), [search, status]);
  const list = useMasterList(listOrganisations, filters);
  const { setPage } = list;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Organisation | null>(null);
  // The target stays set while the dialog closes, so its text doesn't change mid-animation
  const [statusTarget, setStatusTarget] = useState<Organisation | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ open: false, message: '', severity: 'success' });

  useEffect(() => setPage(0), [search, status, setPage]);

  const notify = (message: string, severity: Feedback['severity'] = 'success') =>
    setFeedback({ open: true, message, severity });

  const openForm = (organisation: Organisation | null) => {
    setEditing(organisation);
    setFormOpen(true);
  };

  const handleSaved = ({ organisation, mode, usersUpdated }: OrganisationSaved) => {
    setFormOpen(false);
    notify(
      mode === 'create'
        ? t('ADMINISTRATION.ORG.CREATED', { name: organisation.name })
        : t('ADMINISTRATION.ORG.UPDATED', { name: organisation.name, count: usersUpdated ?? 0 })
    );
    list.reload();
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const target = statusTarget;
    setStatusSaving(true);
    try {
      await updateOrganisation(target.organisationId, { isActive: !target.isActive });
      notify(
        t(target.isActive ? 'ADMINISTRATION.ORG.DEACTIVATED' : 'ADMINISTRATION.ORG.REACTIVATED', {
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

  const askStatusChange = (organisation: Organisation) => {
    setStatusTarget(organisation);
    setStatusOpen(true);
  };

  const columns: ColumnDef<Organisation>[] = useMemo(
    () => [
      { id: 'code', label: t('ADMINISTRATION.ORG.CODE'), minWidth: 110 },
      { id: 'name', label: t('ADMINISTRATION.ORG.NAME'), minWidth: 220 },
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
        title={t('ADMINISTRATION.ORG.TITLE')}
        subtitle={t('ADMINISTRATION.ORG.SUBTITLE')}
        actions={
          <CommonButton variant="primary" startIcon={<AddBusinessOutlinedIcon />} onClick={() => openForm(null)}>
            {t('ADMINISTRATION.ORG.ADD')}
          </CommonButton>
        }
      />

      <MastersFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder={t('ADMINISTRATION.ORG.SEARCH_PLACEHOLDER')}
        status={status}
        onStatusChange={setStatus}
        onClear={() => {
          setSearchInput('');
          setStatus('all');
        }}
      />

      <SwadhaarDataTable<Organisation>
        columns={columns}
        data={list.rows}
        keyExtractor={(row) => row.organisationId}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        hideToolbar
        page={list.page}
        rowsPerPage={list.rowsPerPage}
        totalCount={list.totalCount}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setRowsPerPage}
        emptyMessage={t('ADMINISTRATION.ORG.EMPTY')}
      />

      <OrganisationFormDialog
        open={formOpen}
        organisation={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <StatusChangeDialog
        open={statusOpen}
        group="ORG"
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
