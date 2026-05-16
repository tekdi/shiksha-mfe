import React, { useState } from 'react';
import { Box, Button, Typography, Radio, RadioGroup, FormControlLabel, FormLabel, Slider, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAIStudioStore from '../../store/aiStudioStore';
import { QuestionType, Difficulty } from '../../utils/AIContentTypes';
import Loader from '../Loader';
import { AIGatewayService } from '../../services/AIGatewayService';
import { v4 as uuidv4 } from 'uuid';

const QuizConfigPanel = () => {
  const theme = useTheme<any>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    quizConfig, 
    setQuizConfig, 
    setStep, 
    selectedOutputTypes,
    selectedFile,
    startPipeline,
    setGeneratedOutputs,
    updateOutput
  } = useAIStudioStore();

  const handleTypeChange = (event: React.MouseEvent<HTMLElement>, newType: QuestionType) => {
    if (newType !== null) {
      setQuizConfig({ questionType: newType });
    }
  };

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuizConfig({ difficulty: event.target.value as Difficulty });
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Step 1: Upload the file to the gateway
      const ingestionResult = await AIGatewayService.uploadDocument(selectedFile);
      
      // Step 2: Extract initial analysis and store it
      const initialOutputs: any = {};
      if (ingestionResult.llm_analysis?.takeaways?.length > 0) {
        initialOutputs['key_takeaways'] = {
          type: 'key_takeaways',
          sourceFile: ingestionResult.filename,
          generatedAt: new Date().toISOString(),
          takeaways: ingestionResult.llm_analysis.takeaways.map((t: any) => ({
            ...t,
            id: t.id || uuidv4()
          }))
        };
      }
      
      if (ingestionResult.llm_analysis?.glossary?.length > 0) {
        initialOutputs['glossary'] = {
          type: 'glossary',
          sourceFile: ingestionResult.filename,
          generatedAt: new Date().toISOString(),
          terms: ingestionResult.llm_analysis.glossary.map((t: any) => ({
            ...t,
            id: t.id || uuidv4()
          }))
        };
      }
      
      setGeneratedOutputs(initialOutputs);
      
      // Step 3: Start a pipeline job for the assessment
      const jobId = ingestionResult.file_id;
      startPipeline(jobId);
      
      // Step 3b: Asynchronously generate interactive content so it is ready by Review phase
      const mockSourceText = "Mock source text for " + ingestionResult.filename;
      
      if (selectedOutputTypes.includes('quiz')) {
        AIGatewayService.generateAssessment({
          source_text: mockSourceText,
          question_types: [quizConfig.questionType],
          question_count: quizConfig.count,
          difficulty: quizConfig.difficulty,
          title: "Generated Assessment"
        }).then(res => {
          updateOutput('quiz', { 
            ...res, 
            sourceFile: ingestionResult.filename,
            questionType: res.questionType as QuestionType 
          });
        }).catch(err => console.error("Quiz generation failed:", err));
      }
      
      if (selectedOutputTypes.includes('lesson')) {
        AIGatewayService.generateMicroLesson({
          title: "Generated Lesson",
          source_text: mockSourceText,
          branding: {
            logo_url: "",
            primary_color: "#123B5D",
            secondary_color: "#F5A623",
            font_family: "Inter, Arial, sans-serif"
          }
        }).then(res => {
          updateOutput('lesson', { 
            type: 'lesson', 
            sourceFile: ingestionResult.filename,
            generatedAt: new Date().toISOString(),
            slides: res.slides,
            htmlContent: res.html_content,
            branding: {
              logoUrl: "",
              primaryColor: "#123B5D",
              secondaryColor: "#F5A623",
              fontFamily: "Inter, Arial, sans-serif"
            }
          });
        }).catch(err => console.error("Lesson generation failed:", err));
      }
      
      // We don't await the tasks here, they will complete in the background 
      // while the pipeline animation plays
      
      // Step 4: Advance to the Processing step (index 2)
      setStep(2);
    } catch (err: any) {
      console.error('Pipeline start failed:', err);
      setError(err.message || 'Failed to start AI pipeline. Please check if the gateway is running.');
      setIsGenerating(false);
    }
  };

  const hasQuizSelected = selectedOutputTypes.includes('quiz');

  return (
    <Box>
      <Loader showBackdrop={isGenerating} loadingText="Initiating AI Pipeline..." />
      
      <Typography variant="h2" gutterBottom>
        Configuration & Parameters
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
          {error}
        </Alert>
      )}
      
      {hasQuizSelected ? (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ mb: 6 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>Question Format</FormLabel>
            <ToggleButtonGroup
              value={quizConfig.questionType}
              exclusive
              onChange={handleTypeChange}
              aria-label="question type"
              fullWidth
              sx={{ gap: 2, '& .MuiToggleButton-root': { borderRadius: '8px !important', border: '1px solid #ddd !important' } }}
            >
              <ToggleButton value="mcq">Multiple Choice</ToggleButton>
              <ToggleButton value="fill_in_the_blanks">Fill in Blanks</ToggleButton>
              <ToggleButton value="match_the_pair">Match Pair</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ mb: 6 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>Question Count: {quizConfig.count}</FormLabel>
            <Slider
              value={quizConfig.count}
              onChange={(e, val) => setQuizConfig({ count: val as number })}
              min={1}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ color: theme.palette.primary.main }}
            />
          </Box>

          <Box sx={{ mb: 6 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>Difficulty Level</FormLabel>
            <RadioGroup
              row
              value={quizConfig.difficulty}
              onChange={handleDifficultyChange}
            >
              <FormControlLabel value="easy" control={<Radio />} label="Easy" />
              <FormControlLabel value="medium" control={<Radio />} label="Medium" />
              <FormControlLabel value="hard" control={<Radio />} label="Hard" />
            </RadioGroup>
          </Box>
        </Box>
      ) : (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 4 }}>
            You've selected non-interactive outputs. Click generate to begin extraction.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={() => setStep(0)}>Back</Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          sx={{ px: 6, borderRadius: '100px' }}
          disabled={isGenerating}
        >
          Generate AI Content
        </Button>
      </Box>
    </Box>
  );
};

export default QuizConfigPanel;
