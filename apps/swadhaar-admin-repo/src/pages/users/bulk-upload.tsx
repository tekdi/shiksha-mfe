import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckIcon from '@mui/icons-material/Check';
import Papa from 'papaparse';
import { TFunction } from 'i18next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { createUserAccount } from '@/services/UserService';
import TenantService from '@/services/TenantService';
import { SWADHAAR_TENANT_ID } from '@/utils/app.constant';
import { buildCreateUserPayload } from '@/utils/userPayloadBuilder';
import { NEUTRAL } from '@/styles/customTheme';

interface ParsedUserRow {
  full_name?: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  gender?: string;
  state?: string;
  district?: string;
  branch?: string;
  program?: string;
  role?: string;
  [key: string]: any;
}

interface FailedRowItem {
  rowNum: number;
  employeeId: string;
  email: string;
  reason: string;
}

const MANDATORY_COLUMNS = [
  'full_name',
  'email',
  'phone',
  'employee_id',
  'gender',
  'state',
  'district',
  'branch',
  'program',
  'role',
];

const EMPTY_VALUE = '-';
const WHITE = '#FFFFFF';
const CARD_BORDER = `1px solid ${NEUTRAL.border}`;
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const PHONE_REGEX = /^\d{10}$/;

interface RowFields {
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
  state: string;
  district: string;
  branch: string;
  program: string;
  role: string;
  gender: string;
}

interface SeenKeys {
  employeeIds: Set<string>;
  emails: Set<string>;
  phones: Set<string>;
}

const trimField = (value?: string) => (value || '').trim();

const toRowFields = (row: ParsedUserRow): RowFields => ({
  fullName: trimField(row.full_name),
  email: trimField(row.email),
  phone: trimField(row.phone),
  employeeId: trimField(row.employee_id),
  state: trimField(row.state),
  district: trimField(row.district),
  branch: trimField(row.branch),
  program: trimField(row.program),
  role: trimField(row.role),
  gender: trimField(row.gender),
});

/** Returns the (translated) failure reason for a row, or an empty string when the row is valid. */
const getValidationError = (fields: RowFields, seen: SeenKeys, t: TFunction): string => {
  const missing = (fieldKey: string) =>
    t('BULK_UPLOAD.ERRORS.MANDATORY_MISSING', { field: t(`BULK_UPLOAD.FIELDS.${fieldKey}`) });

  if (!fields.fullName) return missing('FULL_NAME');
  if (!fields.employeeId) return missing('EMPLOYEE_ID');
  if (seen.employeeIds.has(fields.employeeId.toLowerCase())) return t('BULK_UPLOAD.ERRORS.DUPLICATE_EMPLOYEE_ID');
  if (!fields.email) return missing('EMAIL');
  if (!EMAIL_REGEX.test(fields.email)) return t('BULK_UPLOAD.ERRORS.INVALID_EMAIL');
  if (seen.emails.has(fields.email.toLowerCase())) return t('BULK_UPLOAD.ERRORS.DUPLICATE_EMAIL');
  if (!fields.phone) return missing('PHONE');
  if (!PHONE_REGEX.test(fields.phone)) return t('BULK_UPLOAD.ERRORS.INVALID_PHONE');
  if (seen.phones.has(fields.phone)) return t('BULK_UPLOAD.ERRORS.DUPLICATE_PHONE');
  if (!fields.state) return missing('STATE');
  if (!fields.district) return missing('DISTRICT');
  if (!fields.branch) return missing('BRANCH');
  if (!fields.program) return missing('PROGRAM');
  if (!fields.role) return missing('ROLE');
  return '';
};

/** Creates the user account; returns a failure reason, or null on success. */
const createUserFromRow = async (fields: RowFields, tenantId: string, t: TFunction): Promise<string | null> => {
  try {
    const resp = await createUserAccount(buildCreateUserPayload(fields, tenantId));
    if (resp?.responseCode === 'OK' || resp?.result || resp?.params?.status === 'successful') {
      return null;
    }
    return resp?.params?.errmsg || resp?.message || t('BULK_UPLOAD.ERRORS.CREATE_FAILED');
  } catch (apiErr: any) {
    return (
      apiErr?.response?.data?.params?.errmsg ||
      apiErr?.response?.data?.message ||
      apiErr?.message ||
      t('BULK_UPLOAD.ERRORS.SERVER_ERROR')
    );
  }
};

const hasCellValue = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim() !== '';
  return value !== null && value !== undefined;
};

const toFailedRow = (rowNum: number, fields: RowFields, reason: string): FailedRowItem => ({
  rowNum,
  employeeId: fields.employeeId || EMPTY_VALUE,
  email: fields.email || EMPTY_VALUE,
  reason,
});

interface ValidRow {
  rowNum: number;
  fields: RowFields;
}

/** Validates every row (including duplicates within the file) before any account is created. */
const validateRows = (rows: ParsedUserRow[], t: TFunction) => {
  const seen: SeenKeys = { employeeIds: new Set<string>(), emails: new Set<string>(), phones: new Set<string>() };
  const validRows: ValidRow[] = [];
  const failures: FailedRowItem[] = [];
  rows.forEach((row, i) => {
    const fields = toRowFields(row);
    const rowNum = i + 2; // Row 1 is header, so data starts at row 2
    const failureReason = getValidationError(fields, seen, t);
    if (failureReason) {
      failures.push(toFailedRow(rowNum, fields, failureReason));
      return;
    }
    seen.employeeIds.add(fields.employeeId.toLowerCase());
    seen.emails.add(fields.email.toLowerCase());
    seen.phones.add(fields.phone);
    validRows.push({ rowNum, fields });
  });
  return { validRows, failures };
};

const STEP_ACTIVE_COLOR = '#E6873C';

/** Step 2 is orange while active and dark once completed. */
const getStepTwoBackground = (step: number): string => (step === 2 ? STEP_ACTIVE_COLOR : NEUTRAL.ink);

const downloadCsv = (csvContent: string, fileName: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

interface StepConfig {
  label: string;
  content: React.ReactNode;
  filled: boolean;
  fillColor: string;
  active: boolean;
  activeColor: string;
}

const renderStep = ({ label, content, filled, fillColor, active, activeColor }: StepConfig) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: filled ? fillColor : WHITE,
        color: filled ? WHITE : NEUTRAL.muted,
        border: filled ? 'none' : `1.5px solid ${NEUTRAL.borderStrong}`,
      }}
    >
      {content}
    </Box>
    <Typography
      sx={{
        fontSize: '14px',
        fontWeight: active ? 600 : 500,
        color: active ? activeColor : NEUTRAL.muted,
      }}
    >
      {label}
    </Typography>
  </Box>
);

const renderStepDivider = (filled: boolean) => (
  <Box
    sx={{
      width: 36,
      height: '1px',
      backgroundColor: filled ? NEUTRAL.ink : NEUTRAL.borderStrong,
    }}
  />
);

export default function BulkUploadUsersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stepper state: 1: Upload file, 2: Validate & Process, 3: Summary
  const [step, setStep] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Processing & Results states
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [failedRows, setFailedRows] = useState<FailedRowItem[]>([]);

  // 1. Template Download Handler
  const handleDownloadTemplate = () => {
    const csvContent =
      'full_name,email,phone,employee_id,gender,state,district,branch,program,role\n' +
      'Aarav Sharma,aarav.sharma@example.com,9876543210,EMP1001,Male,Maharashtra,Pune,Haveli,Financial Literacy,Trainer\n' +
      'Priya Patel,priya.patel@example.com,9876543211,EMP1002,Female,Gujarat,Ahmedabad,City,Women Empowerment,ARM\n' +
      'Rohan Deshmukh,rohan.deshmukh@example.com,9876543212,EMP1003,Male,Maharashtra,Nagpur,Nagpur Rural,Digital Banking,DI\n';

    downloadCsv(csvContent, 'swadhaar_users_bulk_template.csv');
  };

  // 2. File Selection & Parsing Handler
  const processUploadedFile = (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);

    Papa.parse<ParsedUserRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const rows = results.data.filter((r) => Object.values(r).some(hasCellValue));
        setParsedRows(rows);
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        setErrorMsg(t('BULK_UPLOAD.ERRORS.PARSE_FAILED'));
      },
    });
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Validation and User Creation Workflow
  const handleValidateAndCreate = async () => {
    if (!selectedFile || parsedRows.length === 0) {
      setErrorMsg(t('BULK_UPLOAD.ERRORS.NO_RECORDS'));
      return;
    }

    setStep(2);
    setProgressPercent(10);
    setErrorMsg(null);

    const tenantId = TenantService.getTenantId() || SWADHAAR_TENANT_ID;
    const { validRows, failures } = validateRows(parsedRows, t);
    const total = parsedRows.length;
    let processed = failures.length;
    let successCount = 0;

    // Create users one at a time (sequentially) to keep load on the API predictable
    await validRows.reduce(
      (chain, { rowNum, fields }) =>
        chain.then(async () => {
          const failureReason = await createUserFromRow(fields, tenantId, t);
          if (failureReason) {
            failures.push(toFailedRow(rowNum, fields, failureReason));
          } else {
            successCount++;
          }
          processed++;
          setProgressPercent(Math.min(95, Math.round((processed / total) * 100)));
        }),
      Promise.resolve()
    );
    failures.sort((a, b) => a.rowNum - b.rowNum);

    setProgressPercent(100);
    setCreatedCount(successCount);
    setFailedRows(failures);
    setStep(3); // Go to summary
  };

  // 4. Download Failed Rows CSV Handler
  const handleDownloadFailedRows = () => {
    if (failedRows.length === 0) return;

    let csvContent = 'Row,Employee ID,Email,Reason for failure\n';
    failedRows.forEach((item) => {
      csvContent += `"${item.rowNum}","${item.employeeId}","${item.email}","${item.reason.replace(/"/g, '""')}"\n`;
    });

    downloadCsv(csvContent, `failed_users_${Date.now()}.csv`);
  };

  // 5. Reset to Step 1 for corrected file upload
  const handleResetForCorrection = () => {
    setStep(1);
    setSelectedFile(null);
    setParsedRows([]);
    setFailedRows([]);
    setCreatedCount(0);
    setErrorMsg(null);
    setProgressPercent(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ py: 1, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Breadcrumb */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2.5,
          fontSize: '13px',
          color: '#6B6862',
        }}
      >
        <span>People</span>
        <span>/</span>
        <Link
          href="/users"
          style={{ color: '#6B6862', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E6873C')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6862')}
        >
          Users
        </Link>
        <span>/</span>
        <Typography component="span" sx={{ color: '#1F1E1C', fontWeight: 600, fontSize: '13px' }}>
          Bulk upload
        </Typography>
      </Box>

      {/* Header and Stepper Progress Bar */}
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
        {/* Title and Subtitle */}
        <Box sx={{ maxWidth: '640px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F1E1C', fontSize: '26px' }}>
              {step === 3 ? t('BULK_UPLOAD.UPLOAD_SUMMARY') : t('BULK_UPLOAD.TITLE')}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B6862', fontSize: '14px', lineHeight: 1.5 }}>
            {step === 3
              ? `${selectedFile?.name || 'users_file.csv'} · ${t('BULK_UPLOAD.PROCESSED_SUFFIX')}`
              : t('BULK_UPLOAD.SUBTITLE')}
          </Typography>
        </Box>

        {/* 3-Step Stepper Progress Bar matching Prototype */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {renderStep({
            label: t('BULK_UPLOAD.STEPPER.UPLOAD_FILE'),
            content: step > 1 ? <CheckIcon sx={{ fontSize: 14 }} /> : '1',
            filled: true,
            fillColor: NEUTRAL.ink,
            active: step === 1,
            activeColor: NEUTRAL.ink,
          })}
          {renderStepDivider(step >= 2)}
          {renderStep({
            label: t('BULK_UPLOAD.STEPPER.VALIDATE'),
            content: step > 2 ? <CheckIcon sx={{ fontSize: 14 }} /> : '2',
            filled: step >= 2,
            fillColor: getStepTwoBackground(step),
            active: step === 2,
            activeColor: STEP_ACTIVE_COLOR,
          })}
          {renderStepDivider(step >= 3)}
          {renderStep({
            label: t('BULK_UPLOAD.STEPPER.SUMMARY'),
            content: '3',
            filled: step === 3,
            fillColor: NEUTRAL.ink,
            active: step === 3,
            activeColor: NEUTRAL.ink,
          })}
        </Box>
      </Box>

      {/* Error Alert */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '6px' }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* ======================================================== */}
      {/* STEP 1: Upload File Layout (Left 8 cols, Right 4 cols)     */}
      {/* ======================================================== */}
      {step === 1 && (
        <Grid container spacing={3} sx={{ flex: 1 }}>
          {/* Left Column: Dropzone and File Card */}
          <Grid item xs={12} lg={8}>
            {/* Dropzone Box */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                height: 290,
                boxSizing: 'border-box',
                border: isDragging ? '2px dashed #E6873C' : '2px dashed #BDB9B1',
                borderRadius: '10px',
                backgroundColor: isDragging ? '#FDF8F3' : '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#E6873C',
                  backgroundColor: '#FCFAF7',
                },
              }}
            >
              <CloudUploadOutlinedIcon sx={{ fontSize: 44, color: isDragging ? '#E6873C' : '#3D3B37' }} />
              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F1E1C' }}>
                {t('BULK_UPLOAD.DROP_PROMPT')}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#6B6862' }}>
                {t('BULK_UPLOAD.FILE_TYPES')}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </Box>

            {/* Selected File Card */}
            {selectedFile && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  mt: 2,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D6D3CC',
                  borderRadius: '8px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '6px',
                      backgroundColor: '#F4F3EF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#3D3B37',
                    }}
                  >
                    CSV
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                      {parsedRows.length} rows detected
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRemoveFile}
                  sx={{
                    height: 34,
                    borderColor: '#D6D3CC',
                    color: '#374151',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '13px',
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                      borderColor: '#9CA3AF',
                    },
                  }}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Grid>

          {/* Right Column: File Requirements Card */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6D3CC',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                File requirements
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#6B6862', lineHeight: 1.5 }}>
                One row per user. Every mandatory field must be filled in.
              </Typography>

              {/* Required Columns Chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {MANDATORY_COLUMNS.map((col) => (
                  <Box
                    key={col}
                    sx={{
                      backgroundColor: '#F4F3EF',
                      border: '1px solid #D6D3CC',
                      borderRadius: '4px',
                      px: 1,
                      py: 0.4,
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#3D3B37',
                    }}
                  >
                    {col}
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: '12px', color: '#6B6862', lineHeight: 1.5 }}>
                Role = company role (ARM, DI, Trainer…). Learner / Reviewer are set per group, not in this file.
              </Typography>

              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                sx={{
                  alignSelf: 'flex-start',
                  borderColor: '#D6D3CC',
                  color: '#1F1E1C',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '6px',
                  px: 2,
                  py: 0.8,
                  '&:hover': {
                    borderColor: '#E6873C',
                    backgroundColor: '#FDF3E9',
                    color: '#E6873C',
                  },
                }}
              >
                Download template
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Validating and Processing View                    */}
      {/* ======================================================== */}
      {step === 2 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            my: 'auto',
            border: '1px solid #D6D3CC',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            textAlign: 'center',
            maxWidth: 580,
            mx: 'auto',
            width: '100%',
          }}
        >
          <CircularProgress sx={{ color: '#E6873C', mb: 3 }} size={52} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1F1E1C', mb: 1 }}>
            Validating and creating users…
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B6862', mb: 3 }}>
            Verifying mandatory columns, formatting, and creating active accounts on Swadhaar.
          </Typography>
          <Box sx={{ width: '100%', mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#F4F3EF',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#E6873C',
                },
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#6B6862' }}>
            {progressPercent}% completed
          </Typography>
        </Paper>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Summary Results View                              */}
      {/* ======================================================== */}
      {step === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {/* 3 Metric Summary Tiles matching Prototype */}
          <Grid container spacing={2.5}>
            {/* Tile 1: Rows in file */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D6D3CC',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography sx={{ fontSize: '13px', color: '#6B6862', fontWeight: 500 }}>
                  Rows in file
                </Typography>
                <Typography sx={{ fontSize: '30px', fontWeight: 700, color: '#1F1E1C' }}>
                  {parsedRows.length}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                  Total records detected in file
                </Typography>
              </Paper>
            </Grid>

            {/* Tile 2: Users created (Green) */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  backgroundColor: '#F6FBF7',
                  border: '1.5px solid #86B896',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography sx={{ fontSize: '13px', color: '#1D5B34', fontWeight: 600 }}>
                  Users created
                </Typography>
                <Typography sx={{ fontSize: '30px', fontWeight: 700, color: '#1D5B34' }}>
                  {createdCount}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                  Welcome email / SMS sent to each
                </Typography>
              </Paper>
            </Grid>

            {/* Tile 3: Rows failed (Red) */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  backgroundColor: '#FDF6F6',
                  border: '1.5px solid #E3A3A3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography sx={{ fontSize: '13px', color: '#8A1C1C', fontWeight: 600 }}>
                  Rows failed
                </Typography>
                <Typography sx={{ fontSize: '30px', fontWeight: 700, color: '#8A1C1C' }}>
                  {failedRows.length}
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B6862' }}>
                  Not created — see reasons below
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Failed Rows Table Section (if any failures) */}
          {failedRows.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1.8,
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 600, color: '#1F1E1C' }}>
                    Failed rows
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      px: 1,
                      py: 0.3,
                      borderRadius: '4px',
                    }}
                  >
                    PROPOSED
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    onClick={handleDownloadFailedRows}
                    sx={{
                      borderColor: '#D6D3CC',
                      color: '#1F1E1C',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '13px',
                      borderRadius: '6px',
                      height: 36,
                      px: 2,
                      backgroundColor: '#FFFFFF',
                      '&:hover': {
                        backgroundColor: '#F9FAFB',
                        borderColor: '#9CA3AF',
                      },
                    }}
                  >
                    Download failed rows
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleResetForCorrection}
                    sx={{
                      borderColor: '#D6D3CC',
                      color: '#1F1E1C',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '13px',
                      borderRadius: '6px',
                      height: 36,
                      px: 2,
                      backgroundColor: '#FFFFFF',
                      '&:hover': {
                        borderColor: '#E6873C',
                        backgroundColor: '#FDF3E9',
                        color: '#E6873C',
                      },
                    }}
                  >
                    {t('BULK_UPLOAD.COLUMNS.UPLOAD_CORRECTED_FILE')}
                  </Button>
                </Box>
              </Box>

              {/* Table */}
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid #D6D3CC',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                }}
              >
                <Table size="medium">
                  <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ width: '80px', fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>
                        {t('BULK_UPLOAD.COLUMNS.ROW')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>
                        {t('BULK_UPLOAD.COLUMNS.EMPLOYEE_ID')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>
                        {t('BULK_UPLOAD.COLUMNS.EMAIL')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>
                        {t('BULK_UPLOAD.COLUMNS.FAILURE_REASON')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {failedRows.map((fail) => (
                      <TableRow
                        key={`fail-${fail.rowNum}`}
                        sx={{
                          '&:last-child td': { borderBottom: 0 },
                          '&:hover': { backgroundColor: '#FDFBF9' },
                        }}
                      >
                        <TableCell sx={{ fontSize: '13px', color: '#1F1E1C', fontWeight: 500 }}>
                          #{fail.rowNum}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                          {fail.employeeId}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                          {fail.email}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>
                          {fail.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {/* ======================================================== */}
      {/* Bottom Actions Bar matching Prototype                    */}
      {/* ======================================================== */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1.5,
          mt: 'auto',
          pt: 4,
        }}
      >
        {step === 1 && (
          <>
            <Button
              variant="outlined"
              onClick={() => router.push('/users')}
              sx={{
                borderColor: '#D6D3CC',
                color: '#1F1E1C',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                borderRadius: '6px',
                height: 38,
                px: 2.5,
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  borderColor: '#9CA3AF',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!selectedFile || parsedRows.length === 0}
              onClick={handleValidateAndCreate}
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
                '&:hover': {
                  backgroundColor: '#C66C23',
                  boxShadow: 'none',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#E5E7EB',
                  color: '#9CA3AF',
                },
              }}
            >
              Validate and create users
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <Button
              variant="outlined"
              onClick={() => router.push('/users')}
              sx={{
                borderColor: '#D6D3CC',
                color: '#1F1E1C',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                borderRadius: '6px',
                height: 38,
                px: 2.5,
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  borderColor: '#9CA3AF',
                },
              }}
            >
              View created users
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/users')}
              sx={{
                backgroundColor: '#E6873C',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                borderRadius: '6px',
                height: 38,
                px: 3,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#C66C23',
                  boxShadow: 'none',
                },
              }}
            >
              Done
            </Button>
          </>
        )}
      </Box>
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
