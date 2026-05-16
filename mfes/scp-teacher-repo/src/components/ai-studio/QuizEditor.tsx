import React, { useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { AIGatewayService } from '../../services/AIGatewayService';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import useAIStudioStore from '../../store/aiStudioStore';
import { QuizOutput, QuizQuestion } from '../../utils/AIContentTypes';
import MCQQuestionCard from './cards/MCQQuestionCard';
import FITBQuestionCard from './cards/FITBQuestionCard';
import MatchPairCard from './cards/MatchPairCard';

const SortableQuestion = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: 'relative' }}>
      <Box 
        {...attributes} 
        {...listeners} 
        sx={{ 
          position: 'absolute', 
          left: -24, 
          top: 20, 
          color: '#BDC3C7',
          cursor: 'grab',
          zIndex: 10,
          '&:hover': { color: 'primary.main' }
        }}
      >
        <DragIndicatorIcon />
      </Box>
      {children}
    </Box>
  );
};

const QuizEditor = () => {
  const { generatedOutputs, updateOutput, sourceText } = useAIStudioStore();
  const output = generatedOutputs['quiz'] as QuizOutput;
  const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!output) return null;

  const handleRegenerate = async (id: string) => {
    setRegeneratingIds(prev => [...prev, id]);
    try {
      // @ts-ignore - Assuming API returns questions directly for single items as per request
      const result = await AIGatewayService.generateAssessment({
        source_text: sourceText,
        question_types: [output.questionType],
        question_count: 1,
        difficulty: output.questions.find(q => q.id === id)?.difficulty || 'medium',
        title: 'Regenerated',
      });
      
      if (result && (result as any).questions && (result as any).questions.length > 0) {
        const newQ = { ...(result as any).questions[0], id }; // keep same ID
        handleUpdate(newQ);
      }
    } catch (err) {
      console.error('Regeneration failed', err);
    } finally {
      setRegeneratingIds(prev => prev.filter(qId => qId !== id));
    }
  };

  const renderQuestionCard = (question: QuizQuestion) => {
    const commonProps = {
      key: question.id,
      onUpdate: (q: any) => handleUpdate(q),
      onDelete: () => handleDelete(question.id),
      onRegenerate: () => handleRegenerate(question.id),
      isRegenerating: regeneratingIds.includes(question.id)
    };

    switch (output.questionType) {
      case 'mcq':
        return (
          <SortableQuestion id={question.id}>
            <MCQQuestionCard {...commonProps} question={question as any} />
          </SortableQuestion>
        );
      case 'fill_in_the_blanks':
        return (
          <SortableQuestion id={question.id}>
            <FITBQuestionCard {...commonProps} question={question as any} />
          </SortableQuestion>
        );
      case 'match_the_pair':
        return (
          <SortableQuestion id={question.id}>
            <MatchPairCard {...commonProps} question={question as any} />
          </SortableQuestion>
        );
      default:
        return null;
    }
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = output.questions.findIndex(q => q.id === active.id);
      const newIndex = output.questions.findIndex(q => q.id === over?.id);
      const reordered = arrayMove(output.questions, oldIndex, newIndex);
      updateOutput('quiz', { ...output, questions: reordered });
    }
  };

  const handleUpdate = (updatedQuestion: QuizQuestion) => {
    const newQuestions = output.questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    updateOutput('quiz', { ...output, questions: newQuestions });
  };

  const handleDelete = (id: string) => {
    const newQuestions = output.questions.filter(q => q.id !== id);
    updateOutput('quiz', { ...output, questions: newQuestions });
  };

  const handleAdd = () => {
    // Basic template based on type
    let newItem: any;
    if (output.questionType === 'mcq') {
      newItem = { id: Date.now().toString(), question: 'New Question?', answers: [{ text: '', correct: true, feedback: '' }], difficulty: 'medium', bloomsLevel: 'remember' };
    } else if (output.questionType === 'fill_in_the_blanks') {
      newItem = { id: Date.now().toString(), sentence: 'The *answer* is here.', blanks: [{ answer: 'answer', tip: '' }], difficulty: 'medium', bloomsLevel: 'remember' };
    } else {
      newItem = { id: Date.now().toString(), instruction: 'Match the following:', pairs: [{ left: '', right: '' }], distractors: [], difficulty: 'medium', bloomsLevel: 'remember' };
    }
    
    updateOutput('quiz', { ...output, questions: [...output.questions, newItem] });
  };

  return (
    <Box sx={{ pl: 3 }}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={output.questions.map(q => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={4}>
            {output.questions.map((q) => renderQuestionCard(q))}
          </Stack>
        </SortableContext>
      </DndContext>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mt: 4, py: 2, borderStyle: 'dashed' }}
      >
        Add Question
      </Button>
    </Box>
  );
};

export default QuizEditor;
