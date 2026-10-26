import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import { getCourseList, CourseItem } from '@/services/CourseService';
import EnrolLearningPathModal from '@/components/common/EnrolLearningPathModal';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';

interface SequenceItem {
  id: string;
  stepNumber: number;
  label: string;
  title: string;
  unlockCondition: string;
  courseId?: string;
}

const FALLBACK_SEQUENCE: SequenceItem[] = [
  {
    id: 'seq-0',
    stepNumber: 1,
    label: 'Course 0 + assessment',
    title: 'Introduction to Swadhaar FinAccess & Its Digital Platform',
    unlockCondition: 'Open from start',
  },
  {
    id: 'seq-1',
    stepNumber: 2,
    label: 'Course 1 + assessment',
    title: 'Introduction to Saving',
    unlockCondition: 'Unlocks after previous',
  },
  {
    id: 'seq-2',
    stepNumber: 3,
    label: 'Course 2 + assessment',
    title: 'Financial Products and Schemes',
    unlockCondition: 'Unlocks after previous',
  },
  {
    id: 'seq-3',
    stepNumber: 4,
    label: 'Course 3 + assessment',
    title: 'Digital banking',
    unlockCondition: 'Unlocks after previous',
  },
];

const BUILDER_CARD_SX = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D6D3CC',
  borderRadius: '10px',
  overflow: 'hidden',
};

const BUILDER_CARD_HEADER_SX = {
  px: 2.5,
  py: 1.8,
  borderBottom: '1px solid #ECEAE5',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#FAF9F6',
};

const DateField: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Box>
    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C', mb: 0.6 }}>{label}</Typography>
    <TextField
      fullWidth
      size="small"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '6px',
          '&:hover fieldset': { borderColor: '#E6873C' },
          '&.Mui-focused fieldset': { borderColor: '#E6873C' },
        },
      }}
    />
  </Box>
);

const DEFAULT_PATH_TITLE = 'Financial Inclusion Training Programme';

export default function LearningPathBuilderPage() {
  const router = useRouter();

  const pathTitle = DEFAULT_PATH_TITLE;
  const [coursesList, setCoursesList] = useState<CourseItem[]>([]);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [generateCertificate, setGenerateCertificate] = useState(true);
  const [certificateTemplate, setCertificateTemplate] = useState('Financial Inclusion Certificate');

  // Enrolled status state
  const [enrolledSummary, setEnrolledSummary] = useState({
    groups: 'No groups enrolled yet',
    users: 'No individual users enrolled yet',
  });

  // Modals
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Navigation guard against unsaved changes
  useUnsavedChangesGuard(
    isDirty && !saveSuccess,
    'You have unsaved changes in the Learning Path Builder. Are you sure you want to leave this page?'
  );

  // Fetch Sunbird courses using search API
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCourseList({
        limit: 20,
        filters: {
          primaryCategory: ['Course'],
        },
      });

      const courses = response.content || [];
      setCoursesList(courses);

      if (courses.length > 0) {
        // Build sequence from courses
        const items: SequenceItem[] = courses.slice(0, 4).map((c, idx) => ({
          id: c.identifier || `seq-${idx}`,
          stepNumber: idx + 1,
          label: `Course ${idx} + assessment`,
          title: c.cleanTitle || c.name,
          unlockCondition: idx === 0 ? 'Open from start' : 'Unlocks after previous',
          courseId: c.identifier,
        }));
        setSequence(items);
      } else {
        // Fallback sequence matching Prototype Image 2
        setSequence(FALLBACK_SEQUENCE);
      }
    } catch (err) {
      console.warn('Could not load courses from Sunbird, using fallback:', err);
      setSequence(FALLBACK_SEQUENCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Sequence Reordering Functions (Up / Down)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSeq = [...sequence];
    const temp = newSeq[index];
    newSeq[index] = newSeq[index - 1];
    newSeq[index - 1] = temp;

    // Recalculate step numbers and unlock rules
    const updated = newSeq.map((item, idx) => ({
      ...item,
      stepNumber: idx + 1,
      unlockCondition: idx === 0 ? 'Open from start' : 'Unlocks after previous',
    }));
    setSequence(updated);
    setIsDirty(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === sequence.length - 1) return;
    const newSeq = [...sequence];
    const temp = newSeq[index];
    newSeq[index] = newSeq[index + 1];
    newSeq[index + 1] = temp;

    const updated = newSeq.map((item, idx) => ({
      ...item,
      stepNumber: idx + 1,
      unlockCondition: idx === 0 ? 'Open from start' : 'Unlocks after previous',
    }));
    setSequence(updated);
    setIsDirty(true);
  };

  const handleRemoveItem = (id: string) => {
    const newSeq = sequence.filter((item) => item.id !== id);
    const updated = newSeq.map((item, idx) => ({
      ...item,
      stepNumber: idx + 1,
      unlockCondition: idx === 0 ? 'Open from start' : 'Unlocks after previous',
    }));
    setSequence(updated);
    setIsDirty(true);
  };

  const handleAddCourseToSequence = () => {
    if (!selectedCourseToAdd) return;
    const course = coursesList.find((c) => c.identifier === selectedCourseToAdd);
    if (!course) return;

    const newItem: SequenceItem = {
      id: `seq-${Date.now()}`,
      stepNumber: sequence.length + 1,
      label: `Course ${sequence.length} + assessment`,
      title: course.cleanTitle || course.name,
      unlockCondition: sequence.length === 0 ? 'Open from start' : 'Unlocks after previous',
      courseId: course.identifier,
    };

    setSequence([...sequence, newItem]);
    setIsAddCourseModalOpen(false);
    setSelectedCourseToAdd('');
    setIsDirty(true);
  };

  const handleSave = () => {
    setIsDirty(false);
    setSaveSuccess(true);
    setTimeout(() => {
      router.push('/learning-paths');
    }, 1000);
  };

  return (
    <Box sx={{ py: 1, backgroundColor: '#F4F3EF', minHeight: 'calc(100vh - 120px)', m: -2, p: 3 }}>
      {/* Breadcrumb Navigation matching Image 2 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        <Link href="/learning-paths" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{ color: '#6B6862', fontSize: '13px', '&:hover': { color: '#E6873C' } }}
          >
            Learning
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
          /
        </Typography>
        <Link href="/learning-paths" style={{ textDecoration: 'none' }}>
          <Typography
            variant="body2"
            sx={{ color: '#6B6862', fontSize: '13px', '&:hover': { color: '#E6873C' } }}
          >
            Learning paths
          </Typography>
        </Link>
        <Typography variant="body2" sx={{ color: '#8A867F', fontSize: '13px' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: '#1F1E1C', fontSize: '13px', fontWeight: 600 }}>
          {pathTitle}
        </Typography>
      </Box>

      {/* Header & Actions */}
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
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F1E1C', fontSize: '26px' }}>
              {pathTitle}
            </Typography>
          </Box>
        </Box>

        {/* Top Right Action Buttons matching Image 2 */}
        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/learning-paths')}
            sx={{
              borderColor: '#D6D3CC',
              color: '#1F1E1C',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              '&:hover': { borderColor: '#E6873C', backgroundColor: '#FDF3E9' },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="outlined"
            onClick={() => setIsEnrolModalOpen(true)}
            sx={{
              borderColor: '#E6873C',
              color: '#E6873C',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              '&:hover': {
                borderColor: '#C66C23',
                backgroundColor: '#FDF3E9',
              },
            }}
          >
            Enrol users or groups
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              backgroundColor: '#E6873C',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'none',
              borderRadius: '6px',
              height: 38,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#C66C23', boxShadow: 'none' },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Learning path sequence and settings saved successfully! Redirecting...
        </Alert>
      )}

      {/* Main Grid: Left Column 2/3 (Sequence & prerequisites), Right Column 1/3 (Settings) */}
      <Grid container spacing={3}>
        {/* Left Column (Sequence and prerequisites) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Header row for Sequence */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C' }}>
                Sequence and prerequisites
              </Typography>
              <Button
                size="small"
                variant="outlined"
                // startIcon={<AddCircleOutlineIcon />}
                onClick={() => setIsAddCourseModalOpen(true)}
                sx={{
                  borderColor: '#D6D3CC',
                  color: '#1F1E1C',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  height: 32,
                  '&:hover': { borderColor: '#E6873C', backgroundColor: '#FDF3E9' },
                }}
              >
                + Add course or assessment
              </Button>
            </Box>

            {/* Sequence Item Cards with Up / Down reordering */}
            {loading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} sx={{ color: '#E6873C' }} />
              </Box>
            ) : (
              sequence.map((item, index) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {/* Up / Down Arrow buttons matching Image 2 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      sx={{
                        width: 28,
                        height: 28,
                        border: '1px solid #D6D3CC',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: index === 0 ? '#BDB9B1' : '#1F1E1C',
                        '&:hover': {
                          backgroundColor: '#FDF3E9',
                          borderColor: '#E6873C',
                          color: '#E6873C',
                        },
                      }}
                    >
                      <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={index === sequence.length - 1}
                      onClick={() => handleMoveDown(index)}
                      sx={{
                        width: 28,
                        height: 28,
                        border: '1px solid #D6D3CC',
                        borderRadius: '6px',
                        backgroundColor: '#FFFFFF',
                        color: index === sequence.length - 1 ? '#BDB9B1' : '#1F1E1C',
                        '&:hover': {
                          backgroundColor: '#FDF3E9',
                          borderColor: '#E6873C',
                          color: '#E6873C',
                        },
                      }}
                    >
                      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  {/* Course Sequence Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.8,
                      px: 2,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D6D3CC',
                      borderRadius: '10px',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: '#E6873C' },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      {/* Step Number Circle */}
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '14px',
                          backgroundColor: '#EEEDE9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#1F1E1C',
                        }}
                      >
                        {item.stepNumber}
                      </Box>

                      {/* Course Title & Label */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Typography variant="caption" sx={{ color: '#6B6862', fontSize: '12px' }}>
                          {item.label}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
                          {item.title}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Unlock Status Pill & Remove Action */}
                    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.2,
                          py: 0.3,
                          borderRadius: '11px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: '#EEEDE9',
                          color: '#3D3B37',
                        }}
                      >
                        {item.unlockCondition}
                      </Box>

                      <Tooltip title="Remove from sequence">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                          sx={{
                            color: '#BA1A1A',
                            '&:hover': { backgroundColor: '#FEE2E2' },
                          }}
                        >
                          <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>
              ))
            )}

            {/* Hint & Unlock Rule Banner matching Image 2 */}
            <Typography variant="caption" sx={{ color: '#6B6862', pl: 5, fontSize: '12px' }}>
              + Courses 4, 5, 6
            </Typography>

            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                gap: 1.2,
                alignItems: 'center',
                p: 1.8,
                px: 2,
                backgroundColor: '#FFFFFF',
                border: '1px solid #D6D3CC',
                borderRadius: '10px',
                mt: 0.5,
              }}
            >
              <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                Unlock rule: previous course completed{' '}
                <strong style={{ fontWeight: 600 }}>and</strong> its assessment passed
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column (Dates, Certificate, Enrolled) */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Card 1: Dates */}
            <Paper elevation={0} sx={BUILDER_CARD_SX}>
              <Box sx={BUILDER_CARD_HEADER_SX}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Dates
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DateField label="Start date" value={startDate} onChange={setStartDate} />

                <DateField label="End date" value={endDate} onChange={setEndDate} />

                <DateField label="Completion deadline" value={deadline} onChange={setDeadline} />
              </Box>
            </Paper>

            {/* Card 2: Certificate */}
            <Paper elevation={0} sx={BUILDER_CARD_SX}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.8,
                  borderBottom: '1px solid #ECEAE5',
                  backgroundColor: '#FAF9F6',
                }}
              >
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Certificate
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={generateCertificate}
                      onChange={(e) => setGenerateCertificate(e.target.checked)}
                      sx={{ color: '#E6873C', '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1F1E1C' }}>
                      Generate automatically on completion
                    </Typography>
                  }
                />

                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C', mb: 0.6 }}>
                    Certificate template
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={certificateTemplate}
                      onChange={(e) => {
                        setCertificateTemplate(e.target.value);
                        setIsDirty(true);
                      }}
                      sx={{
                        borderRadius: '6px',
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                      }}
                    >
                      <MenuItem value="Financial Inclusion Certificate">Financial Inclusion Certificate</MenuItem>
                      <MenuItem value="Field Trainer Completion Certificate">Field Trainer Completion Certificate</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>

            {/* Card 3: Enrolled */}
            <Paper elevation={0} sx={BUILDER_CARD_SX}>
              <Box sx={BUILDER_CARD_HEADER_SX}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#1F1E1C' }}>
                  Enrolled
                </Typography>
                <Tooltip title="Enrol users or groups">
                  <IconButton
                    size="small"
                    onClick={() => setIsEnrolModalOpen(true)}
                    sx={{
                      color: '#1F1E1C',
                      border: '1px solid #D6D3CC',
                      borderRadius: '6px',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        backgroundColor: '#FDF3E9',
                        borderColor: '#E6873C',
                        color: '#E6873C',
                      },
                    }}
                  >
                    <PersonAddAlt1OutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                  {enrolledSummary.groups}
                </Typography>
                <Typography sx={{ fontSize: '14px', color: '#1F1E1C' }}>
                  {enrolledSummary.users}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Enrol Dialog */}
      <EnrolLearningPathModal
        open={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        learningPathTitle={pathTitle}
        onEnrolSuccess={(count, type) => {
          if (type === 'groups') {
            setEnrolledSummary((prev) => ({
              ...prev,
              groups: `${count} groups enrolled`,
            }));
          } else {
            setEnrolledSummary((prev) => ({
              ...prev,
              users: `${count} individual users enrolled`,
            }));
          }
        }}
      />

      {/* Add Course to Sequence Dialog */}
      <Dialog
        open={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '18px' }}>
          Add Course or Assessment to Sequence
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#6B6862', mb: 2 }}>
            Select a course from Sunbird composite search results to append to this learning pathway:
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedCourseToAdd}
              onChange={(e) => setSelectedCourseToAdd(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: '6px',
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
              }}
            >
              <MenuItem value="" disabled>
                Select Course
              </MenuItem>
              {coursesList.map((c) => (
                <MenuItem key={c.identifier} value={c.identifier}>
                  {c.cleanTitle || c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setIsAddCourseModalOpen(false)}
            sx={{ textTransform: 'none', color: '#6B6862' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selectedCourseToAdd}
            onClick={handleAddCourseToSequence}
            sx={{
              backgroundColor: '#E6873C',
              color: '#FFFFFF',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#C66C23' },
            }}
          >
            Add to Sequence
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'], nextI18NextConfig as any)),
    },
  };
};
