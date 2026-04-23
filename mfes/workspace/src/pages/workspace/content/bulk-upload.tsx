/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @nx/enforce-module-boundaries */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import Papa from 'papaparse';
import { ContentBulkService } from '../../../services/ContentBulkService';
import Layout from '../../../components/Layout';
import WorkspaceHeader from '@workspace/components/WorkspaceHeader';
import { getOptionsByCategory } from '../../../utils/Helper';
import useTenantConfig from '../../../hooks/useTenantConfig';

const contentService = new ContentBulkService();

interface UploadedData {
  topic?: string;
  sub_category?: string;
  cont_tagwords?: string;
  cont_description?: string;
  cont_title?: string;
  language?: string;
  resourse_type?: string;
  author?: string;
  publisher?: string;
  year?: string;
  cont_url?: string;
  cont_dwurl?: string;
  access?: string;
  image?: string;
  thumbnail?: string;
  domain?: string;
  sub_domain?: string;
  content_language?: string;
  primary_user?: string;
  target_age_group?: string;
  program?: string;
  old_system_content_id?: string;
  // Framework-specific fields
  board?: string;
  medium?: string;
  gradeLevel?: string;
  subject?: string;
}

interface ImportStatus {
  progress: number;
  message: string;
}

interface FrameworkCategory {
  code: string;
  name: string;
  terms: Array<{
    name: string;
    code: string;
    associations: any[];
  }>;
}

interface Framework {
  categories: FrameworkCategory[];
}

const BulkUpload: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string>('bulk-upload');
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [currentRecord, setCurrentRecord] = useState<number>(0);
  const [processedRecords, setProcessedRecords] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  });
  const [framework, setFramework] = useState<Framework | null>(null);
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [isLoadingFramework, setIsLoadingFramework] = useState(true);

  const { tenantConfig, isLoading, error } = useTenantConfig();

  useEffect(() => {
    const headerValue = localStorage.getItem('showHeader');
    setShowHeader(headerValue === 'true');
  }, []);

  // Fetch framework details and generate dynamic headers
  useEffect(() => {
    const fetchFrameworkAndHeaders = async () => {
      try {
        setIsLoadingFramework(true);

        // Get framework ID from localStorage or tenant config
        const frameworkId =
          localStorage.getItem('frameworkId') ||
          tenantConfig?.COLLECTION_FRAMEWORK;

        if (!frameworkId) {
          console.error('Framework ID not found');
          setSnackbar({
            open: true,
            message:
              'Framework configuration not found. Please check your setup.',
            severity: 'error',
          });
          return;
        }

        // Fetch framework details
        const response = await fetch(`/api/framework/v1/read/${frameworkId}`);
        const data = await response.json();

        if (!data?.result?.framework) {
          throw new Error('Invalid framework response');
        }

        const frameworkData = data.result.framework;
        setFramework(frameworkData);

        console.log('Framework data loaded:', frameworkData);
        console.log('Framework categories:', frameworkData.categories);

        // Check if framework has topic or board
        const hasTopic = frameworkData.categories.some(
          (cat: FrameworkCategory) => cat.code === 'topic'
        );
        const hasBoard = frameworkData.categories.some(
          (cat: FrameworkCategory) => cat.code === 'board'
        );

        let headers: string[] = [];

        if (hasTopic) {
          // Topic-based headers
          headers = [
            'topic',
            'sub_category',
            'cont_tagwords',
            'cont_description',
            'cont_title',
            'language',
            'resourse_type',
            'author',
            'publisher',
            'year',
            'cont_url',
            'cont_dwurl',
            'access',
            'image',
            'thumbnail',
          ];
        } else if (hasBoard) {
          // Board-based headers
          headers = [
            'cont_title',
            'cont_description',
            'language',
            'resourse_type',
            'author',
            'publisher',
            'year',
            'cont_url',
            'cont_tagwords',
            'content_language',
            'cont_dwurl'
          ];

          // Add framework-specific headers if they exist
          const frameworkCategories = [
            'board',
            'medium',
            'gradeLevel',
            'subject',
          ];
          frameworkCategories.forEach((category) => {
            const categoryExists = frameworkData.categories.some(
              (cat: FrameworkCategory) => cat.code === category
            );
            if (categoryExists) {
              headers.push(category);
            }
          });
        } else {
          // Default headers
          headers = [
            'cont_title',
            'cont_description',
            'language',
            'resourse_type',
            'author',
            'publisher',
            'year',
            'cont_url',
            'cont_dwurl',
            'access',
            'image',
            'thumbnail',
            'topic',
            'sub_category',
            'cont_tagwords',
          ];
        }

        console.log('Generated headers:', headers);
        setDynamicHeaders(headers);
      } catch (error) {
        console.error('Error fetching framework:', error);
        setSnackbar({
          open: true,
          message:
            'Failed to load framework configuration. Using default headers.',
          severity: 'warning',
        });
        // Fallback to default headers
        setDynamicHeaders([
          'topic',
          'sub_category',
          'cont_tagwords',
          'cont_description',
          'cont_title',
          'language',
          'resourse_type',
          'author',
          'publisher',
          'year',
          'cont_url',
          'cont_dwurl',
          'access',
          'image',
          'thumbnail',
        ]);
      } finally {
        setIsLoadingFramework(false);
      }
    };

    fetchFrameworkAndHeaders();
  }, [tenantConfig]);

  const SUPPORTED_FILE_TYPES = ['pdf', 'mp4', 'zip', 'mp3', 'html'];
  const isYouTubeUrl = (url: string) =>
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
  const isGoogleDriveUrl = (url: string) =>
    /drive\.google\.com\/(file\/d\/|uc\?export=download&id=)/.test(url);
  const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

  const sanitizeRow = (row: UploadedData): UploadedData => {
    const sanitized: UploadedData = { ...row };

    Object.keys(sanitized).forEach((key) => {
      const k = key as keyof UploadedData;
      const value = sanitized[k];
      if (typeof value === 'string') {
        sanitized[k] = value.trim() as any;
      }
    });

    if (sanitized.cont_tagwords) {
      sanitized.cont_tagwords = sanitized.cont_tagwords
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)
        .join(', ');
    }

    if (sanitized.cont_url) sanitized.cont_url = sanitized.cont_url.trim();
    if (sanitized.cont_dwurl)
      sanitized.cont_dwurl = sanitized.cont_dwurl.trim();

    return sanitized;
  };

  const validateRecord = (row: UploadedData, index: number): string[] => {
    const messages: string[] = [];
    const title = row.cont_title?.trim() || '';
    const topic = row.topic?.trim() || '';
    const pageUrl = row.cont_url?.trim() || '';
    const dwurl = row.cont_dwurl?.trim() || '';

    if (!title) messages.push(`Row ${index + 1}: Missing Title (cont_title).`);

    // Check if framework has topic or board
    const hasTopic = framework?.categories.some(
      (cat: FrameworkCategory) => cat.code === 'topic'
    );
    const hasBoard = framework?.categories.some(
      (cat: FrameworkCategory) => cat.code === 'board'
    );

    // Topic and cont_dwurl are only mandatory for topic-based frameworks
    if (hasTopic && !hasBoard) {
      if (!topic) messages.push(`Row ${index + 1}: Missing Topic (topic).`);
      if (!dwurl)
        messages.push(`Row ${index + 1}: Missing Download URL (cont_dwurl).`);
    }

    // Validate framework-specific fields if they exist
    if (framework) {
      const frameworkCategories = ['board', 'medium', 'gradeLevel', 'subject'];
      frameworkCategories.forEach((category) => {
        const categoryExists = framework.categories.some(
          (cat: FrameworkCategory) => cat.code === category
        );
        if (categoryExists) {
          const fieldValue = row[category as keyof UploadedData]?.trim();
          if (!fieldValue) {
            messages.push(
              `Row ${index + 1}: Missing ${category} (${category}).`
            );
          } else {
            // Validate that the value exists in the framework
            if (!validateFrameworkValue(category, fieldValue)) {
              const availableOptions = getFrameworkOptions(category);
              // Split the value to check which specific values are invalid
              const values = fieldValue
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v);
              const invalidValues = values.filter(
                (val) =>
                  !framework.categories
                    .find((cat) => cat.code === category)
                    ?.terms.some((term) => term.name === val)
              );

              if (invalidValues.length > 0) {
                messages.push(
                  `Row ${
                    index + 1
                  }: Invalid ${category} value(s) "${invalidValues.join(
                    ', '
                  )}". Available options: ${availableOptions.join(', ')}`
                );
              }
            }
          }
        }
      });
    }

    if (pageUrl && !isHttpUrl(pageUrl)) {
      messages.push(
        `Row ${
          index + 1
        }: Content URL (cont_url) must start with http:// or https://`
      );
    }

    // cont_dwurl validation is only for topic-based frameworks
    if (hasTopic && !hasBoard) {
      if (!dwurl) {
        messages.push(`Row ${index + 1}: Missing Download URL (cont_dwurl).`);
      } else if (!isHttpUrl(dwurl)) {
        messages.push(
          `Row ${index + 1}: Download URL must start with http:// or https://`
        );
      } else if (!isYouTubeUrl(dwurl) && !isGoogleDriveUrl(dwurl)) {
        const ext = dwurl.split('.').pop()?.toLowerCase();
        if (!ext || !SUPPORTED_FILE_TYPES.includes(ext)) {
          messages.push(
            `Row ${
              index + 1
            }: Unsupported file type. Allowed: ${SUPPORTED_FILE_TYPES.join(
              ', '
            )} or a YouTube/Google Drive link.`
          );
        }
      }
    }

    return messages;
  };

  const toUserFriendlyMessage = (error: unknown): string => {
    // Prefer backend-provided validation messages if present
    const anyErr: any = error as any;
    const respData = anyErr?.response?.data;
    if (respData) {
      const apiMessages = respData?.result?.messages;
      if (Array.isArray(apiMessages) && apiMessages.length > 0) {
        return apiMessages.join(' | ');
      }
      const apiErrMsg = respData?.params?.errmsg;
      if (typeof apiErrMsg === 'string' && apiErrMsg.trim()) {
        return apiErrMsg;
      }
      const dataMessage = respData?.message || respData?.error;
      if (typeof dataMessage === 'string' && dataMessage.trim()) {
        return dataMessage;
      }
    }

    const raw =
      error instanceof Error ? error.message : String(error || 'Unknown error');

    // Handle file size errors
    if (
      /Payload too large|Maximum size is 10MB|exceeds the maximum allowed size/i.test(
        raw
      )
    ) {
      return 'File size exceeds the 10MB limit. Please use a smaller file or compress the content.';
    }
    if (/Missing required fields/i.test(raw)) {
      return raw;
    }
    if (
      /Title and Download URL are required|Title or file URL is missing/i.test(
        raw
      )
    ) {
      return 'Missing required fields: Title and Download URL.';
    }
    if (/Invalid file URL/i.test(raw)) {
      return 'We could not access the file at the Download URL. Ensure it is public and the link is correct.';
    }
    if (/MIME type .* is not supported|not supported/i.test(raw)) {
      return `Unsupported file type. Use one of: ${SUPPORTED_FILE_TYPES.join(
        ', '
      )} or a YouTube/Google Drive link.`;
    }
    if (/401|unauthorized/i.test(raw)) {
      return 'You are not authorized. Please log in again and retry.';
    }
    if (/403/i.test(raw)) {
      return 'You do not have permission to perform this action.';
    }
    if (/400|Bad Request/i.test(raw)) {
      return 'Upload failed. Check that the URL is public and the file type matches the selected content.';
    }
    if (/500|Internal Server Error|network|timeout/i.test(raw)) {
      return 'A server or network error occurred during upload. Please try again later.';
    }
    return raw;
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // Get authentication token - try multiple possible storage keys
      const userToken =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('access_token');

      // Get user ID - try multiple possible storage keys
      const userId =
        localStorage.getItem('userId') ||
        localStorage.getItem('user_id') ||
        (() => {
          const userData = localStorage.getItem('userData');
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              return parsed.userId || parsed.user_id || parsed.id;
            } catch (e) {
              console.error('Error parsing userData:', e);
              return null;
            }
          }
          return null;
        })();

      if (!userToken) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      if (!uploadedData.length) {
        throw new Error('No data to publish. Please upload a CSV file first.');
      }

      // Pre-validate all rows and show friendly errors
      const allValidationErrors: string[] = [];
      uploadedData.forEach((row, i) => {
        const sanitized = sanitizeRow(row);
        allValidationErrors.push(...validateRecord(sanitized, i));
      });

      if (allValidationErrors.length > 0) {
        setProcessedRecords({
          total: uploadedData.length,
          success: 0,
          failed: allValidationErrors.length,
          errors: allValidationErrors,
        });
        const preview = allValidationErrors.slice(0, 3).join(' | ');
        setSnackbar({
          open: true,
          message: `Found ${allValidationErrors.length} issue(s): ${preview}`,
          severity: 'error',
        });
        return; // Stop before calling APIs
      }

      // Proceed with processing
      let successCount = 0;
      let failedCount = 0;

      setProcessedRecords({
        total: uploadedData.length,
        success: 0,
        failed: 0,
        errors: [],
      });

      for (let i = 0; i < uploadedData.length; i++) {
        const record = sanitizeRow(uploadedData[i]);
        setCurrentRecord(i + 1);

        try {
          // Validate required fields (defensive)
          const hasTopic = framework?.categories.some(
            (cat: FrameworkCategory) => cat.code === 'topic'
          );
          const hasBoard = framework?.categories.some(
            (cat: FrameworkCategory) => cat.code === 'board'
          );

          if (!record.cont_title?.trim()) {
            throw new Error('Missing required field: Title (cont_title).');
          }

          // Topic and cont_dwurl are only required for topic-based frameworks
          if (hasTopic && !hasBoard) {
            if (!record.cont_dwurl?.trim()) {
              throw new Error(
                'Missing required field: Download URL (cont_dwurl).'
              );
            }
            if (!record.topic?.trim()) {
              throw new Error('Missing required field: Topic (topic).');
            }
          }

          await contentService.processContent(record, userId, userToken);
          successCount += 1;
          setProcessedRecords((prev) => ({
            ...prev,
            success: prev.success + 1,
          }));
        } catch (error) {
          const friendly = toUserFriendlyMessage(error);
          failedCount += 1;
          setProcessedRecords((prev) => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `Record ${i + 1}: ${friendly}`],
          }));
        }
      }

      setSnackbar({
        open: true,
        message: `Processing complete. Success: ${successCount}, Failed: ${failedCount}`,
        severity: failedCount === 0 ? 'success' : 'warning',
      });
    } catch (error) {
      console.error('Publishing error:', error);
      setSnackbar({
        open: true,
        message:
          error instanceof Error ? error.message : 'Failed to publish content',
        severity: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadTemplate = () => {
    console.log('Downloading template with headers:', dynamicHeaders);
    console.log('Framework state:', framework);
    console.log('Framework categories:', framework?.categories);

    const csv = Papa.unparse([dynamicHeaders]);
    console.log('Generated CSV:', csv);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Header validation
          // @ts-ignore meta is present from PapaParse
          const fields: string[] = results?.meta?.fields || [];

          const missing = dynamicHeaders.filter((h) => !fields.includes(h));
          if (missing.length) {
            setIsUploading(false);
            setUploadedData([]);
            setSnackbar({
              open: true,
              message: `Missing required column(s): ${missing.join(', ')}`,
              severity: 'error',
            });
            return;
          }

          // Filter and sanitize rows
          const validData = (results.data as UploadedData[])
            .map(sanitizeRow)
            .filter((row) => {
              return Object.values(row).some(
                (value) => value && (value as string).toString().trim() !== ''
              );
            });

          console.log('Parsed CSV data:', validData);
          setUploadedData(validData);
          setIsUploading(false);
          setSnackbar({
            open: true,
            message: `Successfully uploaded ${validData.length} record(s)`,
            severity: 'success',
          });
        },
        error: (error) => {
          setIsUploading(false);
          setSnackbar({
            open: true,
            message: `Error uploading file: ${error.message}`,
            severity: 'error',
          });
        },
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Generate required fields message based on framework
  const getRequiredFieldsMessage = () => {
    const baseRequired = ['cont_title'];
    const frameworkRequired: string[] = [];

    // Check if framework has topic or board
    const hasTopic = framework?.categories.some(
      (cat: FrameworkCategory) => cat.code === 'topic'
    );
    const hasBoard = framework?.categories.some(
      (cat: FrameworkCategory) => cat.code === 'board'
    );

    // Topic and cont_dwurl are only required for topic-based frameworks
    if (hasTopic && !hasBoard) {
      baseRequired.push('topic', 'cont_dwurl');
    }

    if (framework) {
      const frameworkCategories = ['board', 'medium', 'gradeLevel', 'subject'];
      frameworkCategories.forEach((category) => {
        const categoryExists = framework.categories.some(
          (cat: FrameworkCategory) => cat.code === category
        );
        if (categoryExists) {
          frameworkRequired.push(category);
        }
      });
    }

    const allRequired = [...baseRequired, ...frameworkRequired];
    return allRequired.map((field) => `<b>${field}</b>`).join(', ');
  };

  // Helper function to validate framework values
  const validateFrameworkValue = (category: string, value: string): boolean => {
    if (!framework || !value) return false;

    const categoryData = framework.categories.find(
      (cat: FrameworkCategory) => cat.code === category
    );

    if (!categoryData) return false;

    // Split the value by commas and trim each part to handle multiple values
    const values = value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v);

    // For single value, check exact match
    if (values.length === 1) {
      return categoryData.terms.some((term) => term.name === values[0]);
    }

    // For multiple values, check if all values are valid
    return values.every((val) =>
      categoryData.terms.some((term) => term.name === val)
    );
  };

  // Get available options for a framework category
  const getFrameworkOptions = (category: string): string[] => {
    if (!framework) return [];

    const categoryData = framework.categories.find(
      (cat: FrameworkCategory) => cat.code === category
    );

    if (!categoryData) return [];

    return categoryData.terms.map((term) => term.name);
  };

  if (isLoadingFramework) {
    return (
      <>
        {showHeader && <WorkspaceHeader />}
        <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
          <Box
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Loading framework configuration...
            </Typography>
          </Box>
        </Layout>
      </>
    );
  }

  return (
    <>
      {showHeader && <WorkspaceHeader />}
      <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0px 2px 6px 2px #00000026',
              p: 3,
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontWeight: 'bold', fontSize: '16px', mb: 3 }}
            >
              Bulk Upload
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<CloudDownloadIcon />}
                onClick={handleDownloadTemplate}
                disabled={isUploading || isPublishing}
              >
                Download Template
              </Button>

              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={isUploading || isPublishing}
              >
                Upload Content
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Required columns: {getRequiredFieldsMessage()}. Allowed file
              types: {SUPPORTED_FILE_TYPES.join(', ')} or a public
              YouTube/Google Drive link. The URLs must be publicly accessible.
              <br />
              <strong>Note:</strong> File size limit is 10MB. Larger files will
              be rejected.
            </Alert>

            {/* {framework && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Framework Configuration:
                </Typography>
                {['board', 'medium', 'gradeLevel', 'subject'].map(
                  (category) => {
                    const categoryExists = framework.categories.some(
                      (cat: FrameworkCategory) => cat.code === category
                    );
                    if (!categoryExists) return null;

                    const options = getFrameworkOptions(category);
                    return (
                      <Box key={category} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                          :
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ ml: 2, fontSize: '0.875rem' }}
                        >
                          {options.join(', ')}
                        </Typography>
                      </Box>
                    );
                  }
                )}
              </Alert>
            )} */}

            {(isUploading || isPublishing) && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress />
              </Box>
            )}

            {uploadedData.length > 0 && (
              <>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {Object.keys(uploadedData[0]).map((header) => (
                          <TableCell key={header}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadedData.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>{value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  sx={{ mt: 2 }}
                >
                  {isPublishing ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </Button>
              </>
            )}

            {(isPublishing || processedRecords.total > 0) && (
              <Box sx={{ mt: 3 }} data-testid="bulk-processing-summary">
                <Typography variant="h6">
                  Processing Records: {currentRecord} / {processedRecords.total}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography>Success: {processedRecords.success}</Typography>
                  <Typography>Failed: {processedRecords.failed}</Typography>
                </Box>
                {processedRecords.errors.length > 0 && (
                  <Box sx={{ mt: 2 }} data-testid="bulk-errors">
                    <Typography variant="h6" color="error">
                      Issues:
                    </Typography>
                    {processedRecords.errors.map((error, index) => (
                      <Typography
                        key={index}
                        color="error"
                        data-testid={`bulk-error-${index}`}
                      >
                        {error}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Box>
      </Layout>
    </>
  );
};

export default BulkUpload;
