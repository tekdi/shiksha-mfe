import React, { useState, useEffect } from 'react';
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
  Radio,
  IconButton,
  Tooltip,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { createContent, getContentRead } from '@/services/ContentLibraryService';
import { getCourseList } from '@/services/CourseService';
import useUnsavedChangesGuard from '@/hooks/useUnsavedChangesGuard';
import { ContentFormHeader, FormAlerts, FormCardHeader, CARD_SX, OUTLINED_FIELD_SX, LabeledTextField } from '@/components/content/ContentFormParts';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface AssessmentQuestion {
  id: string;
  questionNumber: number;
  type: string;
  tags: string;
  prompt: string;
  options: QuestionOption[];
}

const EDIT_LINKED_OPTIONS = [
  'Course 0 · Introduction to Swadhaar FinAccess',
  'Course 1 · Introduction to Saving',
  'None',
];

const EMPTY_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q-1',
    questionNumber: 1,
    type: 'Multiple choice – single answer',
    tags: 'Topic: General · Difficulty: Medium',
    prompt: '',
    options: [
      { id: 'opt-1-1', text: '', isCorrect: true },
      { id: 'opt-1-2', text: '', isCorrect: false },
    ],
  },
];

const SAMPLE_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q-1',
    questionNumber: 1,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Saving · Difficulty: Medium · Module: Course 1',
    prompt: 'What is the primary reason to maintain an emergency saving fund?',
    options: [
      { id: 'opt-1-1', text: 'To fund unexpected medical or household crises without borrowing', isCorrect: true },
      { id: 'opt-1-2', text: 'To invest in high-risk speculative financial schemes', isCorrect: false },
      { id: 'opt-1-3', text: 'To avoid maintaining a bank savings account', isCorrect: false },
    ],
  },
  {
    id: 'q-2',
    questionNumber: 2,
    type: 'Multiple choice – single answer',
    tags: 'Topic: Digital banking · Difficulty: Easy · Module: Course 1',
    prompt: 'Which of the following is a key feature of formal savings in banks?',
    options: [
      { id: 'opt-2-1', text: 'Safe deposit with regulated interest and security', isCorrect: true },
      { id: 'opt-2-2', text: 'High risk of complete capital loss', isCorrect: false },
      { id: 'opt-2-3', text: 'No record of deposited funds', isCorrect: false },
    ],
  },
];

/** Maps a loaded assessment name to the linked-course option shown in edit mode. */
const linkedContentFromName = (assessmentName?: string): string | null => {
  if (assessmentName?.includes('Course 0')) return 'Course 0 · Swadhaar FinAccess Overview';
  if (assessmentName?.includes('Course 1')) return 'Course 1 · Introduction to Saving';
  return null;
};

export interface AssessmentBuilderProps {
  /** Omit for the create page; pass the route id ('new' or an existing id) for the builder route. */
  assessmentId?: string;
}

export function AssessmentBuilder({ assessmentId }: Readonly<AssessmentBuilderProps>) {
  const router = useRouter();
  const isCreatePage = assessmentId === undefined;
  const isNew = isCreatePage || assessmentId === 'new';

  const [name, setName] = useState(isCreatePage ? '' : 'Course 1 Assessment – Introduction to Saving');
  const [linkedContent, setLinkedContent] = useState(isCreatePage ? 'None' : 'Course 1 · Introduction to Saving');
  const [linkedOptions, setLinkedOptions] = useState<string[]>(isCreatePage ? ['None'] : EDIT_LINKED_OPTIONS);
  const [timeLimit, setTimeLimit] = useState('15');
  const [description, setDescription] = useState(
    'Let us now test your understanding of the concepts covered in this course.'
  );

  // Settings
  const [passMark, setPassMark] = useState('70%');
  const [attempts, setAttempts] = useState('Unlimited');
  const [shuffle, setShuffle] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);

  // Loading & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Navigation guard against unsaved changes
  const isDirty = isCreatePage && Boolean(name.trim() && !successMsg && !loading);
  useUnsavedChangesGuard(
    isDirty,
    'You have unsaved changes to this assessment. Are you sure you want to leave this page?'
  );

  // Load existing assessment details when editing an existing id
  useEffect(() => {
    if (isNew || !assessmentId) return;
    getContentRead(assessmentId)
      .then((res: any) => {
        const content = res?.content || res;
        if (!content) return;
        if (content.name || content.title) setName(content.name || content.title);
        if (content.description) setDescription(content.description);
        if (content.duration) setTimeLimit(String(content.duration));
        const linked = linkedContentFromName(content.name);
        if (linked) setLinkedContent(linked);
      })
      .catch((err) => {
        console.error('Failed to load assessment details:', err);
      });
  }, [assessmentId, isNew]);

  // Load actual courses for linkedContent dropdown (create page)
  useEffect(() => {
    if (!isCreatePage) return;
    getCourseList({ limit: 50 })
      .then((res) => {
        if (res?.content?.length > 0) {
          const names = res.content.map((c) => c.name).filter(Boolean);
          setLinkedOptions(['None', ...names]);
        }
      })
      .catch((err) => {
        console.error('Failed to load courses for assessment:', err);
      });
  }, [isCreatePage]);

  // Questions List
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(isCreatePage ? EMPTY_QUESTIONS : SAMPLE_QUESTIONS);

  // Question actions
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });
    setQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQ: AssessmentQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: questions.length + 1,
      type: 'Multiple choice – single answer',
      tags: 'Topic: General · Difficulty: Medium',
      prompt: '',
      options: [
        { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
        { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
      ],
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, idx) => idx !== index);
    updated.forEach((q, idx) => {
      q.questionNumber = idx + 1;
    });
    setQuestions(updated);
  };

  const handleUpdatePrompt = (index: number, prompt: string) => {
    const updated = [...questions];
    updated[index].prompt = prompt;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].text = text;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIndex;
    });
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({
      id: `opt-${Date.now()}`,
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Assessment name is required.');
      return;
    }
    setError(null);
    if (!isCreatePage) {
      setSuccessMsg(`Assessment "${name}" saved successfully.`);
      setTimeout(() => {
        router.push('/content?tab=assessments');
      }, 1000);
      return;
    }
    setLoading(true);
    try {
      await createContent({
        name: name.trim(),
        description: description.trim(),
        mimeType: 'application/vnd.sunbird.questionset',
        primaryCategory: 'Practice Question Set',
        duration: timeLimit ? Number(timeLimit) : undefined,
        passMark,
        attempts,
        shuffle,
        showExplanations,
        linkedTo: linkedContent !== 'None' ? linkedContent : undefined,
        questionsCount: questions.length,
      });

      setSuccessMsg(`Assessment "${name}" created successfully.`);
      setTimeout(() => {
        router.push('/content?tab=assessments');
      }, 900);
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to create assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 1, maxWidth: 1400, mx: 'auto' }}>
      <ContentFormHeader
        sectionLabel="Assessments"
        sectionHref="/content?tab=assessments"
        title={isNew ? 'Create assessment' : name}
        saveLabel="Save and assign"
        onCancel={() => router.push('/content?tab=assessments')}
        onSaveDraft={handleSave}
        saveDraftLabel="Save"
        onSave={handleSave}
      />

      <FormAlerts
        error={error}
        successMsg={successMsg}
        onCloseError={() => setError(null)}
        onCloseSuccess={() => setSuccessMsg(null)}
      />

      {/* Main 2-Column Grid matching Prototype L10 */}
      <Grid container spacing={3}>
        {/* Left Column (8 cols): Assessment Details + Questions List */}
        <Grid item xs={12} lg={8}>
          {/* Card 1: Details */}
          <Paper elevation={0} sx={{ ...CARD_SX, mb: 3 }}>
            <FormCardHeader title="Details" />

            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Name */}
              <LabeledTextField label="Name *" value={name} onChange={setName} placeholder="e.g. Course 1 Assessment – Introduction to Saving" />

              {/* Linked Content & Time limit */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                      Linked content
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={linkedContent}
                        onChange={(e) => setLinkedContent(e.target.value)}
                        sx={{
                          borderRadius: '6px',
                          backgroundColor: '#FFFFFF',
                          fontSize: '14px',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1F1E1C' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E6873C' },
                        }}
                      >
                        {linkedOptions.map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt === 'None' ? 'None (Standalone assessment)' : opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LabeledTextField label="Time limit (min)" value={timeLimit} onChange={setTimeLimit} placeholder="e.g. 15" />
                </Grid>
              </Grid>

              {/* Description */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions shown to learners before starting..."
                  sx={OUTLINED_FIELD_SX}
                />
              </Box>
            </Box>
          </Paper>

          {/* Questions Section Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#1F1E1C' }}>
              Questions ({questions.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={handleAddQuestion}
                sx={{
                  borderColor: '#D6D3CC',
                  color: '#1F1E1C',
                  fontSize: '13px',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '6px',
                  height: 32,
                  px: 1.5,
                  backgroundColor: '#FFFFFF',
                  '&:hover': {
                    borderColor: '#E6873C',
                    backgroundColor: '#FDF3E9',
                    color: '#E6873C',
                  },
                }}
              >
                + New question
              </Button>
            </Box>
          </Box>

          {/* Questions List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {questions.map((q, qIndex) => (
              <Box key={q.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                {/* Up/Down Arrow Stack */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', pt: 1 }}>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton
                        size="small"
                        disabled={qIndex === 0}
                        onClick={() => handleMoveQuestion(qIndex, 'up')}
                        sx={{
                          width: 24,
                          height: 20,
                          padding: 0,
                          borderRadius: '3px',
                          border: '1px solid #D6D3CC',
                          backgroundColor: '#FFFFFF',
                          color: '#3D3B37',
                          '&:hover': { backgroundColor: '#F3F4F6' },
                          '&.Mui-disabled': { opacity: 0.35 },
                        }}
                      >
                        <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton
                        size="small"
                        disabled={qIndex === questions.length - 1}
                        onClick={() => handleMoveQuestion(qIndex, 'down')}
                        sx={{
                          width: 24,
                          height: 20,
                          padding: 0,
                          borderRadius: '3px',
                          border: '1px solid #D6D3CC',
                          backgroundColor: '#FFFFFF',
                          color: '#3D3B37',
                          '&:hover': { backgroundColor: '#F3F4F6' },
                          '&.Mui-disabled': { opacity: 0.35 },
                        }}
                      >
                        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {/* Question Card */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    border: '1px solid #D6D3CC',
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      px: 2.2,
                      py: 1.5,
                      borderBottom: '1px solid #ECEAE5',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#FAF9F6',
                    }}
                  >
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F1E1C' }}>
                      Question {q.questionNumber}
                    </Typography>

                    {questions.length > 1 && (
                      <Tooltip title="Remove question">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          sx={{
                            color: '#8A867F',
                            '&:hover': { color: '#DC2626', backgroundColor: '#FEE2E2' },
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ p: 2.2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Prompt */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                        Question prompt *
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={q.prompt}
                        onChange={(e) => handleUpdatePrompt(qIndex, e.target.value)}
                        placeholder="Type the question text here..."
                        sx={OUTLINED_FIELD_SX}
                      />
                    </Box>

                    {/* Options */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#6B6862' }}>
                        Options (select the correct answer)
                      </Typography>

                      {q.options.map((opt, optIndex) => (
                        <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="Mark as correct answer">
                            <Radio
                              checked={opt.isCorrect}
                              onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                              sx={{
                                color: '#BDB9B1',
                                '&.Mui-checked': { color: '#16A34A' },
                              }}
                            />
                          </Tooltip>

                          <TextField
                            fullWidth
                            size="small"
                            value={opt.text}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '6px',
                                backgroundColor: opt.isCorrect ? '#F0FDF4' : '#FFFFFF',
                                fontSize: '13px',
                                '& fieldset': { borderColor: opt.isCorrect ? '#86EFAC' : '#D6D3CC' },
                                '&:hover fieldset': { borderColor: '#1F1E1C' },
                                '&.Mui-focused fieldset': { borderColor: '#E6873C' },
                              },
                            }}
                          />
                        </Box>
                      ))}

                      <Box sx={{ mt: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => handleAddOption(qIndex)}
                          sx={{
                            color: '#E6873C',
                            textTransform: 'none',
                            fontSize: '12px',
                            fontWeight: 600,
                            p: 0,
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                          }}
                        >
                          + Add option
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Right Column (4 cols): Settings & Assigned To */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Card 2: Settings */}
            <Paper elevation={0} sx={CARD_SX}>
              <FormCardHeader title="Settings" />

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Passing score
                  </Typography>
                  <TextField
                    size="small"
                    value={passMark}
                    onChange={(e) => setPassMark(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                        fontSize: '13px',
                        '& fieldset': { borderColor: '#BDB9B1' },
                        '&:hover fieldset': { borderColor: '#1F1E1C' },
                        '&.Mui-focused fieldset': { borderColor: '#E6873C' },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  <Typography component="label" sx={{ fontSize: '13px', fontWeight: 600, color: '#1F1E1C' }}>
                    Attempts allowed
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={attempts}
                      onChange={(e) => setAttempts(e.target.value)}
                      sx={{
                        borderRadius: '6px',
                        fontSize: '13px',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BDB9B1' },
                      }}
                    >
                      <MenuItem value="Unlimited">Unlimited</MenuItem>
                      <MenuItem value="3">3 attempts</MenuItem>
                      <MenuItem value="2">2 attempts</MenuItem>
                      <MenuItem value="1">1 attempt</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shuffle}
                      onChange={(e) => setShuffle(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                      Shuffle questions for learners
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showExplanations}
                      onChange={(e) => setShowExplanations(e.target.checked)}
                      sx={{ '&.Mui-checked': { color: '#E6873C' } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '13px', color: '#1F1E1C' }}>
                      Show correct answers after submission
                    </Typography>
                  }
                />
              </Box>
            </Paper>

            {/* Card 3: Assigned to */}
            <Paper elevation={0} sx={CARD_SX}>
              <FormCardHeader title="Assigned to" />

              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontSize: '14px', color: '#6B6862' }}>
                  Not assigned to any groups yet.
                </Typography>
                <Typography variant="caption" sx={{ color: '#8A867F', fontSize: '12px' }}>
                  Assign to groups or learners using &ldquo;Save and assign&rdquo;.
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AssessmentBuilder;
