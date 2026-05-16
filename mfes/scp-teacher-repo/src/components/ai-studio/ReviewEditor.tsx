import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Button, Divider, Badge } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useAIStudioStore from '../../store/aiStudioStore';
import KeyTakeawayEditor from './KeyTakeawayEditor';
import GlossaryEditor from './GlossaryEditor';
import QuizEditor from './QuizEditor';
import LessonEditor from './LessonEditor';
import EditorToolbar from './EditorToolbar';
import BloomsChart from './BloomsChart';
import { QuizOutput } from '../../utils/AIContentTypes';

const ReviewEditor = () => {
  const theme = useTheme<any>();
  const { generatedOutputs, selectedOutputTypes, setStep } = useAIStudioStore();
  const [activeTab, setActiveTab] = useState(0);

  const availableTabs = selectedOutputTypes.filter((type: string) => generatedOutputs[type]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderActiveEditor = () => {
    const type = availableTabs[activeTab];
    switch (type) {
      case 'key_takeaways':
        return <KeyTakeawayEditor />;
      case 'glossary':
        return <GlossaryEditor />;
      case 'quiz':
        const quizOutput = generatedOutputs['quiz'] as QuizOutput;
        return (
          <Box>
            <Box sx={{ mb: 3 }}>
              <BloomsChart questions={quizOutput.questions} />
            </Box>
            <QuizEditor />
          </Box>
        );
      case 'lesson':
        return <LessonEditor />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h2" sx={{ m: 0 }}>Review & Edit</Typography>
        <EditorToolbar />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        The AI has generated the following interactive content. You can add, edit, or delete items.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="editor tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          {availableTabs.map((type: string) => (
            <Tab 
              key={type} 
              label={type.replace('_', ' ').toUpperCase()} 
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ minHeight: '400px' }}>
        {renderActiveEditor()}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => setStep(1)}>Back</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setStep(4)}
          sx={{ px: 6, borderRadius: '100px' }}
        >
          Finalize & Export
        </Button>
      </Box>
    </Box>
  );
};

export default ReviewEditor;
