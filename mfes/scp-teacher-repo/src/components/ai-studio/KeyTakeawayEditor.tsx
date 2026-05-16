import React from 'react';
import { Box, Card, CardContent, TextField, IconButton, Button, Stack, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useAIStudioStore from '../../store/aiStudioStore';
import { KeyTakeawaysOutput, KeyTakeaway } from '../../utils/AIContentTypes';
import { v4 as uuidv4 } from 'uuid';

const SortableTakeaway = ({ item, handleUpdate, handleDelete }: { item: KeyTakeaway, handleUpdate: any, handleDelete: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      variant="outlined" 
      sx={{ 
        position: 'relative', 
        bgcolor: '#F8F9FA',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
      }}
    >
      <Box 
        {...attributes} 
        {...listeners} 
        sx={{ 
          position: 'absolute', 
          left: 8, 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: '#BDC3C7',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' }
        }}
      >
        <DragIndicatorIcon />
      </Box>
      <CardContent sx={{ ml: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="standard"
            label="Title"
            value={item.title}
            onChange={(e) => handleUpdate(item.id, 'title', e.target.value)}
            InputProps={{ style: { fontWeight: 600, fontSize: '1.1rem' } }}
          />
          <Chip 
            label={`Conf: ${(item.confidence * 100).toFixed(0)}%`} 
            size="small" 
            color={item.confidence > 0.9 ? 'success' : 'warning'} 
            variant="outlined" 
          />
          <IconButton onClick={() => handleDelete(item.id)} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          multiline
          rows={2}
          variant="outlined"
          label="Summary"
          value={item.summary}
          onChange={(e) => handleUpdate(item.id, 'summary', e.target.value)}
          sx={{ mb: 2, bgcolor: '#fff' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TextField
            size="small"
            label="Page Ref"
            value={item.pageRef}
            onChange={(e) => handleUpdate(item.id, 'pageRef', e.target.value)}
            sx={{ width: '100px' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const KeyTakeawayEditor = () => {
  const { generatedOutputs, updateOutput } = useAIStudioStore();
  const output = generatedOutputs['key_takeaways'] as KeyTakeawaysOutput;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!output) return null;

  const handleUpdate = (id: string, field: keyof KeyTakeaway, value: string) => {
    const newTakeaways = output.takeaways.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    updateOutput('key_takeaways', { ...output, takeaways: newTakeaways });
  };

  const handleAdd = () => {
    const newItem: KeyTakeaway = {
      id: uuidv4(),
      title: 'New Takeaway',
      summary: 'Enter summary here...',
      pageRef: 'N/A',
      confidence: 1,
    };
    updateOutput('key_takeaways', { ...output, takeaways: [...output.takeaways, newItem] });
  };

  const handleDelete = (id: string) => {
    const newTakeaways = output.takeaways.filter(t => t.id !== id);
    updateOutput('key_takeaways', { ...output, takeaways: newTakeaways });
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = output.takeaways.findIndex(t => t.id === active.id);
      const newIndex = output.takeaways.findIndex(t => t.id === over?.id);
      const reordered = arrayMove(output.takeaways, oldIndex, newIndex);
      updateOutput('key_takeaways', { ...output, takeaways: reordered });
    }
  };

  return (
    <Box>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={output.takeaways.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={3}>
            {output.takeaways.map((item) => (
              <SortableTakeaway 
                key={item.id} 
                item={item} 
                handleUpdate={handleUpdate} 
                handleDelete={handleDelete} 
              />
            ))}
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
        Add Key Takeaway
      </Button>
    </Box>
  );
};

export default KeyTakeawayEditor;
