import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'next-i18next';

export type LifecycleState =
  | 'Draft'
  | 'draft'
  | 'Submitted for Review'
  | 'submitted'
  | 'Changes Requested'
  | 'changes_requested'
  | 'Approved'
  | 'approved'
  | 'Published'
  | 'published'
  | 'Active'
  | 'active'
  | 'Suspended'
  | 'suspended'
  | 'Blocked'
  | 'blocked'
  | 'Archived'
  | 'archived'
  | 'Deleted'
  | 'deleted';

interface LifecycleChipProps {
  /** A LifecycleState or any other backend status string. */
  state: string;
  size?: 'small' | 'medium';
}

interface StateStyleConfig {
  /** i18n key for the label; when absent, `rawLabel` is shown as-is. */
  labelKey?: string;
  rawLabel?: string;
  bg: string;
  color: string;
  dotColor: string;
}

const getStateConfig = (state: string): StateStyleConfig => {
  const normalized = state?.toLowerCase() || '';

  if (normalized === 'published' || normalized === 'live') {
    return {
      labelKey: 'LIFECYCLE.PUBLISHED',
      bg: '#DCFCE7',
      color: '#15803D',
      dotColor: '#15803D',
    };
  }
  if (normalized === 'active') {
    return {
      labelKey: 'LIFECYCLE.ACTIVE',
      bg: '#DCFCE7',
      color: '#15803D',
      dotColor: '#15803D',
    };
  }
  if (normalized.includes('draft') || normalized === 'unpublished') {
    return {
      labelKey: 'LIFECYCLE.DRAFT',
      bg: '#FFF8E1',
      color: '#B78103',
      dotColor: '#B78103',
    };
  }
  if (normalized.includes('review') || normalized === 'submitted') {
    return {
      labelKey: 'LIFECYCLE.IN_REVIEW',
      bg: '#E3F2FD',
      color: '#1565C0',
      dotColor: '#1976D2',
    };
  }
  if (normalized.includes('change')) {
    return {
      labelKey: 'LIFECYCLE.CHANGES_REQUESTED',
      bg: '#FFF3E0',
      color: '#E65100',
      dotColor: '#E65100',
    };
  }
  if (normalized === 'approved') {
    return {
      labelKey: 'LIFECYCLE.APPROVED',
      bg: '#E0F2F1',
      color: '#00695C',
      dotColor: '#00897B',
    };
  }
  if (normalized === 'archived') {
    return {
      labelKey: 'LIFECYCLE.ARCHIVED',
      bg: 'rgba(159, 18, 57, 0.12)',
      color: '#9F1239',
      dotColor: '#9F1239',
    };
  }
  if (normalized === 'suspended' || normalized === 'blocked' || normalized === 'deleted') {
    return {
      labelKey: normalized === 'deleted' ? 'LIFECYCLE.DELETED' : 'LIFECYCLE.BLOCKED',
      bg: '#FFEBEE',
      color: '#C62828',
      dotColor: '#D32F2F',
    };
  }

  return {
    rawLabel: state,
    labelKey: state ? undefined : 'LIFECYCLE.UNKNOWN',
    bg: '#F5F5F5',
    color: '#616161',
    dotColor: '#9E9E9E',
  };
};

export const LifecycleChip: React.FC<LifecycleChipProps> = ({ state, size = 'small' }) => {
  const { t } = useTranslation();
  const config = getStateConfig(state);
  const label = config.labelKey ? t(config.labelKey) : config.rawLabel;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.8,
        px: size === 'small' ? 1.2 : 1.6,
        py: size === 'small' ? 0.35 : 0.6,
        borderRadius: '16px',
        backgroundColor: config.bg,
        border: `1px solid ${config.dotColor}33`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: config.color,
          fontWeight: 600,
          fontSize: size === 'small' ? '11px' : '12px',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default LifecycleChip;
