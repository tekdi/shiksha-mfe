import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FunctionsIcon from '@mui/icons-material/Functions';
import { useTheme } from '@mui/material/styles';
import useAIStudioStore from '../../store/aiStudioStore';
import { GlossaryOutput, GlossaryTerm } from '../../utils/AIContentTypes';
import { v4 as uuidv4 } from 'uuid';
import LatexRenderer from './cards/LatexRenderer';

const GlossaryEditor = () => {
  const theme = useTheme<any>();
  const { generatedOutputs, updateOutput } = useAIStudioStore();
  const output = generatedOutputs['glossary'] as GlossaryOutput;

  if (!output) return null;

  const handleUpdate = (id: string, field: keyof GlossaryTerm, value: string) => {
    const newTerms = output.terms.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    updateOutput('glossary', { ...output, terms: newTerms });
  };

  const handleAdd = () => {
    const newItem: GlossaryTerm = {
      id: uuidv4(),
      term: 'New Term',
      definition: 'Enter definition...',
      context: '',
      relatedTerms: [],
      latex: null,
    };
    updateOutput('glossary', { ...output, terms: [...output.terms, newItem] });
  };

  const handleDelete = (id: string) => {
    const newTerms = output.terms.filter(t => t.id !== id);
    updateOutput('glossary', { ...output, terms: newTerms });
  };

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F8F9FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Term</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Definition</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>LaTeX (Optional)</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {output.terms.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ verticalAlign: 'top', width: '20%' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    value={item.term}
                    onChange={(e) => handleUpdate(item.id, 'term', e.target.value)}
                    InputProps={{ style: { fontWeight: 600 } }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '45%' }}>
                  <TextField
                    fullWidth
                    multiline
                    variant="standard"
                    value={item.definition}
                    onChange={(e) => handleUpdate(item.id, 'definition', e.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: 'top', width: '25%' }}>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="e.g. E = mc^2"
                    value={item.latex || ''}
                    onChange={(e) => handleUpdate(item.id, 'latex', e.target.value)}
                    InputProps={{
                      startAdornment: <FunctionsIcon sx={{ mr: 1, color: 'text.disabled' }} />,
                      style: { fontFamily: 'monospace', fontSize: '0.9rem' }
                    }}
                    sx={{ mb: 1 }}
                  />
                  {item.latex && (
                    <Box sx={{ mt: 1, p: 1, border: '1px dashed #ccc', borderRadius: '4px', minHeight: '30px' }}>
                      <LatexRenderer latex={item.latex} inline />
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                  <IconButton onClick={() => handleDelete(item.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ mt: 4, py: 2, borderStyle: 'dashed' }}
      >
        Add Glossary Term
      </Button>
    </Box>
  );
};

export default GlossaryEditor;
