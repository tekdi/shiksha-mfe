import React from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Chip, FormControl, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';

/** Shared building blocks for the content library create/edit pages (video, PDF, assessment). */

export const CARD_SX = {
  border: '1px solid #D6D3CC',
  borderRadius: '10px',
  backgroundColor: '#FFFFFF',
  overflow: 'hidden',
};

export const OUTLINED_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    '& fieldset': { borderColor: '#BDB9B1' },
    '&:hover fieldset': { borderColor: '#1F1E1C' },
    '&.Mui-focused fieldset': { borderColor: '#E6873C' },
  },
};

export const FIELD_LABEL_SX = { fontSize: '13px', fontWeight: 600, color: '#1F1E1C' };

const BREADCRUMB_LINK_STYLE: React.CSSProperties = {
  color: '#6B6862',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

const highlightLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = '#E6873C';
};

const resetLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.color = '#6B6862';
};

const SECONDARY_BUTTON_SX = {
  borderColor: '#D6D3CC',
  color: '#1F1E1C',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '14px',
  borderRadius: '6px',
  height: 38,
  px: 2.2,
  backgroundColor: '#FFFFFF',
} as const;

interface ContentFormHeaderProps {
  /** Breadcrumb entry between "Content library" and the page title, e.g. Videos. */
  sectionLabel: string;
  sectionHref: string;
  title: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
  /** When omitted, the "Save as draft" button is not shown. */
  onSaveDraft?: () => void;
  saveDraftLabel?: string;
}

export const ContentFormHeader: React.FC<ContentFormHeaderProps> = ({
  sectionLabel,
  sectionHref,
  title,
  saveLabel,
  onCancel,
  onSave,
  onSaveDraft,
  saveDraftLabel = 'Save as draft',
}) => (
  <>
    {/* Breadcrumb Navigation */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 2, fontSize: '13px', color: '#6B6862' }}>
      <span>Learning</span>
      <span>/</span>
      <Link href="/content" style={BREADCRUMB_LINK_STYLE} onMouseEnter={highlightLink} onMouseLeave={resetLink}>
        Content library
      </Link>
      <span>/</span>
      <Link href={sectionHref} style={BREADCRUMB_LINK_STYLE} onMouseEnter={highlightLink} onMouseLeave={resetLink}>
        {sectionLabel}
      </Link>
      <span>/</span>
      <Typography component="span" sx={{ color: '#1F1E1C', fontWeight: 600, fontSize: '13px' }}>
        {title}
      </Typography>
    </Box>

    {/* Header & Action Bar */}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F1E1C', fontSize: '26px' }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{ ...SECONDARY_BUTTON_SX, '&:hover': { backgroundColor: '#F3F4F6', borderColor: '#BDB9B1' } }}
        >
          Cancel
        </Button>

        {onSaveDraft && (
          <Button
            variant="outlined"
            onClick={onSaveDraft}
            sx={{
              ...SECONDARY_BUTTON_SX,
              '&:hover': { backgroundColor: '#FDF3E9', borderColor: '#E6873C', color: '#E6873C' },
            }}
          >
            {saveDraftLabel}
          </Button>
        )}

        <Button
          variant="contained"
          onClick={onSave}
          sx={{
            backgroundColor: '#E6873C',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            borderRadius: '6px',
            height: 38,
            px: 2.5,
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#C66C23', boxShadow: 'none' },
          }}
        >
          {saveLabel}
        </Button>
      </Box>
    </Box>
  </>
);

interface FormAlertsProps {
  error: string | null;
  successMsg: string | null;
  onCloseError: () => void;
  onCloseSuccess: () => void;
}

export const FormAlerts: React.FC<FormAlertsProps> = ({ error, successMsg, onCloseError, onCloseSuccess }) => (
  <>
    {error && (
      <Alert severity="error" sx={{ mb: 2.5, borderRadius: '6px' }} onClose={onCloseError}>
        {error}
      </Alert>
    )}
    {successMsg && (
      <Alert severity="success" sx={{ mb: 2.5, borderRadius: '6px' }} onClose={onCloseSuccess}>
        {successMsg}
      </Alert>
    )}
  </>
);

export const FormCardHeader: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid #ECEAE5' }}>
    <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>{title}</Typography>
  </Box>
);

interface LabeledTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

/** Label + small outlined text field (+ optional muted hint) used by the content forms. */
export const LabeledTextField: React.FC<LabeledTextFieldProps> = ({ label, value, onChange, placeholder, hint }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
    <Typography component="label" sx={FIELD_LABEL_SX}>
      {label}
    </Typography>
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={OUTLINED_FIELD_SX}
    />
    {hint && (
      <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
        {hint}
      </Typography>
    )}
  </Box>
);

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}

/** Description textarea with the (visual-only) formatting toolbar used across content forms. */
export const DescriptionField: React.FC<DescriptionFieldProps> = ({
  value,
  onChange,
  placeholder,
  label = 'Description (optional)',
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
    <Typography component="label" sx={FIELD_LABEL_SX}>
      {label}
    </Typography>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 0.8,
        backgroundColor: '#FAF9F6',
        border: '1px solid #BDB9B1',
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        color: '#6B6862',
      }}
    >
      <Box component="span" sx={{ fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>B</Box>
      <Box component="span" sx={{ fontStyle: 'italic', fontSize: '13px', cursor: 'pointer' }}>I</Box>
      <Box component="span" sx={{ textDecoration: 'underline', fontSize: '13px', cursor: 'pointer' }}>U</Box>
      <Box sx={{ width: '1px', height: 16, backgroundColor: '#D6D3CC' }} />
      <Box component="span" sx={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>• List</Box>
      <Box component="span" sx={{ fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Link</Box>
    </Box>
    <TextField
      fullWidth
      multiline
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{
        '& .MuiOutlinedInput-root': {
          ...OUTLINED_FIELD_SX['& .MuiOutlinedInput-root'],
          borderRadius: '0 0 6px 6px',
        },
      }}
    />
  </Box>
);

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({ value, onChange }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
    <Typography component="label" sx={FIELD_LABEL_SX}>
      Language *
    </Typography>
    <FormControl size="small" fullWidth>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          borderRadius: '6px',
          backgroundColor: '#FFFFFF',
          fontSize: '14px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1F1E1C' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
        }}
      >
        <MenuItem value="Hindi">Hindi</MenuItem>
        <MenuItem value="English">English</MenuItem>
      </Select>
    </FormControl>
  </Box>
);

const STATUS_CHIP_SX = { fontWeight: 600, fontSize: '11px', borderRadius: '4px', height: 22 };
const NOT_USED_LABEL = 'Not used in any course yet';

interface UsedInCardProps {
  usedIn: string;
  /** Caption shown when the item is linked, e.g. "This video is linked and used in the course curriculum." */
  linkedCaption: string;
  /** Hint shown when not used, e.g. "Add it to a section from the section editor (+ Video)." */
  addHint: string;
}

export const UsedInCard: React.FC<UsedInCardProps> = ({ usedIn, linkedCaption, addHint }) => {
  const isUsed = Boolean(usedIn) && usedIn !== NOT_USED_LABEL;
  return (
    <Paper elevation={0} sx={CARD_SX}>
      <FormCardHeader title="Used in" />
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isUsed ? (
            <>
              <Chip label="In course" size="small" sx={{ ...STATUS_CHIP_SX, backgroundColor: '#E8F5E9', color: '#2E7D32' }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>{usedIn}</Typography>
            </>
          ) : (
            <>
              <Chip label="Not in course" size="small" sx={{ ...STATUS_CHIP_SX, backgroundColor: '#F3F4F6', color: '#6B7280' }} />
              <Typography sx={{ fontSize: '14px', color: '#6B6862' }}>{NOT_USED_LABEL}.</Typography>
            </>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: isUsed ? '#6B6862' : '#8A867F', fontSize: '12px' }}>
          {isUsed ? linkedCaption : addHint}
        </Typography>
      </Box>
    </Paper>
  );
};
