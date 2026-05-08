import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';

interface AlertFormProps {
  onSubmit: (data: { actionType: string; message: string }) => void;
}

const AlertForm: React.FC<AlertFormProps> = ({ onSubmit }) => {
  const [actionType, setActionType] = useState('feedback');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onSubmit({ actionType, message });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontSize: '14px', color: '#1C2B4A', fontWeight: 600 }}>Action Type</InputLabel>
        <Select
          value={actionType}
          label="Action Type"
          onChange={(e) => setActionType(e.target.value)}
          sx={{ borderRadius: '8px', bgcolor: '#fff' }}
        >
          <MenuItem value="feedback">Share feedback to trainer</MenuItem>
          <MenuItem value="di">Raise to DI</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Typography sx={{ fontSize: '14px', color: '#1C2B4A', fontWeight: 600, mb: 1 }}>Message</Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#fff',
            }
          }}
        />
        <Typography align="right" sx={{ fontSize: '10px', color: '#999', mt: 0.5 }}>
          {message.length}/300 characters
        </Typography>
      </Box>

      <Button
        fullWidth
        variant="contained"
        onClick={handleSubmit}
        disabled={!message.trim()}
        sx={{
          bgcolor: '#E6873C',
          color: '#fff',
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '16px',
          py: 1.5,
          mt: 4,
          '&:hover': { bgcolor: '#d67a32' },
          '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' }
        }}
      >
        Send Alert
      </Button>
    </Box>
  );
};

export default AlertForm;
