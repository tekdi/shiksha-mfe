import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Alert, Chip, List, ListItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import useAIStudioStore from '../../store/aiStudioStore';
import { downloadH5P } from '../../utils/h5pPackager';
import { downloadSCORM } from '../../utils/scormPackager';
import { ValidationResult } from '../../utils/h5pValidator';
import H5PPreview from './H5PPreview';

const ExportPanel = () => {
  const theme = useTheme<any>();
  const { generatedOutputs, setStep } = useAIStudioStore();
  const [isPacking, setIsPacking] = useState(false);
  const [isScormPacking, setIsScormPacking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleExportH5P = async () => {
    setIsPacking(true);
    setValidationResult(null);
    try {
      const result = await downloadH5P(generatedOutputs);
      setValidationResult(result);
      if (result.valid) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsPacking(false);
    }
  };

  const handleExportSCORM = async () => {
    setIsScormPacking(true);
    try {
      await downloadSCORM(generatedOutputs, "AI Assessment");
      setSuccess(true);
    } catch (error) {
      console.error('SCORM Export failed', error);
    } finally {
      setIsScormPacking(false);
    }
  };

  const getSummaryText = () => {
    const parts = [];
    if (generatedOutputs['key_takeaways']) parts.push(`${(generatedOutputs['key_takeaways'] as any).takeaways.length} Takeaways`);
    if (generatedOutputs['glossary']) parts.push(`${(generatedOutputs['glossary'] as any).terms.length} Glossary Terms`);
    if (generatedOutputs['quiz']) parts.push(`${(generatedOutputs['quiz'] as any).questions.length} Quiz Questions`);
    if (generatedOutputs['lesson']) parts.push(`${(generatedOutputs['lesson'] as any).slides.length} Slides`);
    return parts.join(', ');
  };

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
      <Typography variant="h1" gutterBottom>Content Ready for Export!</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
        Your interactive micro-lesson has been compiled. Choose your preferred format below.
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {/* H5P Card */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.primary.light + '08', borderColor: theme.palette.primary.main }}>
            <CardContent sx={{ py: 4, flexGrow: 1 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                <Typography variant="h3">H5P Package</Typography>
                {validationResult && (
                  <Chip 
                    label={validationResult.valid ? "Valid" : "Issues"} 
                    color={validationResult.valid ? "success" : "error"}
                    size="small"
                    icon={validationResult.valid ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ mb: 4 }}>
                Best for LMS integration (Moodle, Canvas). Includes {getSummaryText()}.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={isPacking ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                disabled={isPacking}
                onClick={handleExportH5P}
                sx={{ px: 4, borderRadius: '100px' }}
              >
                {isPacking ? 'Compiling...' : 'Download .h5p'}
              </Button>

              <Button
                variant="text"
                startIcon={<VisibilityIcon />}
                onClick={() => setPreviewOpen(true)}
                sx={{ mt: 1, color: 'text.secondary' }}
              >
                Preview Content
              </Button>

              <H5PPreview 
                open={previewOpen} 
                onClose={() => setPreviewOpen(false)} 
                contentJson={generatedOutputs['quiz']} 
              />

              {validationResult && !validationResult.valid && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={showErrors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    View {validationResult.errors.length} Errors
                  </Button>
                  <Collapse in={showErrors}>
                    <List dense sx={{ bgcolor: '#fff5f5', borderRadius: 1, mt: 1 }}>
                      {validationResult.errors.map((err, i) => (
                        <ListItem key={i}>
                          <ListItemIcon sx={{ minWidth: 28 }}><ErrorOutlineIcon color="error" sx={{ fontSize: 16 }} /></ListItemIcon>
                          <ListItemText primary={err} primaryTypographyProps={{ fontSize: '0.75rem', color: 'error.main' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SCORM Card */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ py: 4, flexGrow: 1 }}>
              <Typography variant="h3" gutterBottom>SCORM 1.2</Typography>
              <Typography variant="body2" sx={{ mb: 4 }}>
                Universal LMS support with score reporting. Ideal for tracking student progress.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                startIcon={isScormPacking ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                disabled={isScormPacking}
                onClick={handleExportSCORM}
                sx={{ px: 4, borderRadius: '100px' }}
              >
                {isScormPacking ? 'Packaging...' : 'Download .zip'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* JSON Card */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ py: 4, flexGrow: 1 }}>
              <Typography variant="h3" gutterBottom>Raw JSON</Typography>
              <Typography variant="body2" sx={{ mb: 4 }}>
                For developers or custom integrations. Pure data structure of the generated content.
              </Typography>
              <Button
                variant="outlined"
                size="large"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedOutputs, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href",     dataStr);
                  downloadAnchorNode.setAttribute("download", "ai_content.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                sx={{ px: 4, borderRadius: '100px' }}
              >
                Download .json
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Lesson HTML Card */}
        {generatedOutputs['lesson'] && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.success.light + '08', borderColor: theme.palette.success.main }}>
              <CardContent sx={{ py: 4, flexGrow: 1 }}>
                <Typography variant="h3" gutterBottom>HTML5 Slide Deck</Typography>
                <Typography variant="body2" sx={{ mb: 4 }}>
                  Branded standalone lesson. Opens in any browser. Great for direct distribution.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                    const lesson = generatedOutputs['lesson'] as any;
                    const blob = new Blob([lesson.htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${lesson.sourceFile.replace(/\.[^/.]+$/, "")}_lesson.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setSuccess(true);
                  }}
                  sx={{ px: 4, borderRadius: '100px' }}
                >
                  Download .html
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {success && validationResult?.valid && (
        <Alert severity="success" sx={{ mt: 6, borderRadius: '12px', textAlign: 'left' }}>
          Export successful! Your content is ready to be uploaded to your LMS.
        </Alert>
      )}

      <Box sx={{ mt: 8 }}>
        <Button onClick={() => setStep(3)}>Back to Review</Button>
      </Box>
    </Box>
  );
};

export default ExportPanel;

