import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, Button, 
  IconButton, Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, FormControl, InputLabel, Grid, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import useAIStudioStore from '../../store/aiStudioStore';
import { LessonOutput, LessonSlide } from '../../utils/AIContentTypes';

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const LessonEditor: React.FC = () => {
  const { generatedOutputs, updateOutput } = useAIStudioStore();
  const lesson = generatedOutputs['lesson'] as LessonOutput;
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!lesson) return null;

  const handleSlideChange = (id: string, field: 'title' | 'body', value: string) => {
    const updatedSlides = lesson.slides.map(slide => 
      slide.id === id ? { ...slide, [field]: value } : slide
    );
    updateOutput('lesson', { ...lesson, slides: updatedSlides });
  };

  const addSlide = () => {
    const newSlide: LessonSlide = {
      id: `s${lesson.slides.length + 1}`,
      title: 'New Slide',
      body: 'Add slide content here...'
    };
    updateOutput('lesson', { ...lesson, slides: [...lesson.slides, newSlide] });
  };

  const deleteSlide = (id: string) => {
    const updatedSlides = lesson.slides.filter(slide => slide.id !== id);
    updateOutput('lesson', { ...lesson, slides: updatedSlides });
  };

  const handleBrandingChange = (field: string, value: string) => {
    updateOutput('lesson', {
      ...lesson,
      branding: { ...lesson.branding, [field]: value }
    });
  };

  const generatePreviewHtml = () => {
    const slideHtml = lesson.slides.map(slide => `
      <section class="slide">
        <h2>${escapeHtml(slide.title)}</h2>
        <p>${escapeHtml(slide.body)}</p>
      </section>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.sourceFile}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${lesson.branding.fontFamily}; background: #f5f5f5; }
    .deck { max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: ${lesson.branding.primaryColor}; margin-bottom: 2rem; font-size: 2rem; }
    .slide {
      background: white; border-radius: 12px; padding: 2rem;
      margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid ${lesson.branding.secondaryColor};
    }
    .slide h2 { color: ${lesson.branding.primaryColor}; margin-bottom: 0.5rem; }
    .slide p { color: #333; line-height: 1.6; }
  </style>
</head>
<body>
  <main class="deck">
    <h1>${lesson.sourceFile}</h1>
    ${slideHtml}
  </main>
</body>
</html>`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h2">Micro-Lesson Editor</Typography>
        <Button 
          variant="outlined" 
          startIcon={<VisibilityIcon />} 
          onClick={() => setPreviewOpen(true)}
        >
          Live Preview
        </Button>
      </Box>

      <Stack spacing={3}>
        {/* Slides List */}
        <Box>
          <Typography variant="h3" sx={{ mb: 2 }}>Slides</Typography>
          <Stack spacing={2}>
            {lesson.slides.map((slide, index) => (
              <Card key={slide.id} variant="outlined" sx={{ position: 'relative' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <DragIndicatorIcon sx={{ color: 'text.disabled', mt: 1, cursor: 'grab' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        label={`Slide ${index + 1} Title`}
                        value={slide.title}
                        onChange={(e) => handleSlideChange(slide.id, 'title', e.target.value)}
                        variant="standard"
                        sx={{ mb: 2, '& .MuiInput-input': { fontWeight: 600, fontSize: '1.2rem' } }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Body Content"
                        value={slide.body}
                        onChange={(e) => handleSlideChange(slide.id, 'body', e.target.value)}
                        variant="outlined"
                      />
                    </Box>
                    <IconButton color="error" onClick={() => deleteSlide(slide.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addSlide}
              sx={{ 
                py: 2, 
                borderStyle: 'dashed', 
                borderWidth: 2,
                borderRadius: '12px',
                color: 'text.secondary'
              }}
            >
              Add Slide
            </Button>
          </Stack>
        </Box>

        {/* Branding Accordion */}
        <Accordion variant="outlined" sx={{ borderRadius: '12px !important' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3" sx={{ m: 0 }}>Branding & Customization</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={lesson.branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Secondary Color"
                  type="color"
                  value={lesson.branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={lesson.branding.fontFamily}
                    label="Font Family"
                    onChange={(e) => handleBrandingChange('fontFamily', e.target.value)}
                  >
                    <MenuItem value="Inter, sans-serif">Inter</MenuItem>
                    <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                    <MenuItem value="Noto Sans, sans-serif">Noto Sans</MenuItem>
                    <MenuItem value="Georgia, serif">Georgia</MenuItem>
                    <MenuItem value="Monospace">Monospace</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Lesson Preview
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '85vh' }}>
          <iframe
            title="Lesson Preview"
            srcDoc={generatePreviewHtml()}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </DialogContent>
        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, ml: 2 }}>
            Previewing live branded HTML5 output
          </Typography>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LessonEditor;
