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
import { useTranslation } from '@shared-lib';

interface AlertFormProps {
  onSubmit: (data: { actionType: string; message: string }) => void;
  isCflIncharge?: boolean;
  hasARM?: boolean;
}

const AlertForm: React.FC<AlertFormProps> = ({ onSubmit, isCflIncharge, hasARM = true }) => {
  const { t } = useTranslation();
  const [actionType, setActionType] = useState('feedback');
  const [message, setMessage] = useState('');

  const userRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || '') : '';
  const isARM = userRole === 'ARM';
  const isDistrictIncharge = userRole === 'District Incharge' || userRole === 'DI' || userRole === 'DISTRICT INCHARGE';

  React.useEffect(() => {
    setActionType('feedback');
  }, []);

  const handleSubmit = () => {
    onSubmit({ actionType, message });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <FormControl fullWidth>
        <InputLabel sx={{ fontFamily: 'Open Sans', fontSize: '13px', color: '#1A1A1A', fontWeight: 600 }}>{t("CFL_DASHBOARD.ACTION_TYPE")}</InputLabel>
        <Select
          value={actionType}
          label={t("CFL_DASHBOARD.ACTION_TYPE")}
          onChange={(e) => setActionType(e.target.value)}
          sx={{ borderRadius: '8px', bgcolor: '#fff', fontFamily: 'Open Sans', fontSize: '14px', fontWeight: 400, color: '#1A1A1A' }}
        >
          <MenuItem value="feedback" sx={{ fontFamily: 'Open Sans', fontSize: '14px', fontWeight: 400, color: '#1A1A1A' }}>
            {isARM
              ? 'Share feedback to District Incharge'
              : isDistrictIncharge
              ? 'Share feedback to Trainer/CFL Incharge'
              : 'Share feedback to trainer'}
          </MenuItem>
          {(!isARM && hasARM) && (
            <MenuItem value="raiseToDI" sx={{ fontFamily: 'Open Sans', fontSize: '14px', fontWeight: 400, color: '#1A1A1A' }}>Raise to ARM</MenuItem>
          )}
        </Select>
      </FormControl>

      <Box>
        <Typography sx={{ fontFamily: 'Open Sans', fontSize: '13px', color: '#1A1A1A', fontWeight: 600, mb: 1 }}>{t("CFL_DASHBOARD.MESSAGE")}</Typography>
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setMessage(e.target.value);
            }
          }}
          inputProps={{ maxLength: 500 }}
          error={message.length >= 500}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#fff',
            },
            '& .MuiInputBase-input': {
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: '10px',
              color: '#555555',
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography sx={{ fontSize: '10px', color: message.length >= 500 ? '#EF4444' : 'transparent', fontWeight: 500 }}>
            {message.length >= 500 ? 'You reached the character limit.' : ' '}
          </Typography>
          <Typography align="right" sx={{ fontSize: '10px', color: message.length >= 500 ? '#EF4444' : '#999' }}>
            {message.length}/500 characters
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, bgcolor: '#fff', borderTop: '1px solid #E5E7EB', zIndex: 10 }}>
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
            fontSize: '15px',
            fontFamily:'Open Sans',
            py: 1.5,
            '&:hover': { bgcolor: '#d67a32' },
            '&.Mui-disabled': { bgcolor: '#ccc', color: '#fff' }
          }}
        >
         {t("CFL_DASHBOARD.CREATE_ALERT")}
        </Button>
      </Box>
    </Box>
  );
};

export default AlertForm;
