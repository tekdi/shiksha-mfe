import React, { useState } from "react";
import { useTranslation } from "@shared-lib";
import { Box, TextField, CircularProgress, InputAdornment, IconButton, Typography } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface NameEditFieldProps {
  label: string;
  initialValue: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel: () => void;
}

const NameEditField: React.FC<NameEditFieldProps> = ({
  label,
  initialValue,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!value.trim()) {
      setError(t('LEARNER_APP.PROFILE.NAME_REQUIRED'));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSave(value);
    } catch (err: any) {
      console.error(err);
      if (err?.message !== 'validation_failed') {
        setError(t('LEARNER_APP.PROFILE.UPDATE_FAILED'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: "13px",
          fontFamily:'Open Sans',
          color: "#1A1A1A",
          mb: 0.5,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          // Allow only alphanumeric characters and spaces
          const filteredValue = newValue.replace(/[^a-zA-Z0-9\s]/g, "");
          setValue(filteredValue);
          setError("");
        }}
        variant="outlined"
        error={!!error}
        helperText={error}
        autoFocus
        InputProps={{
          sx: {
            height: "48px",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "Open Sans",
            color:'#1A1A1A',
            fontWeight: 400,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E6873C",
              borderWidth: "2px",
            },
          },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                onClick={onCancel} 
                size="small" 
                sx={{ color: "#F01616" }}
              >
                <CancelIcon />
              </IconButton>
              <IconButton 
                onClick={handleSave} 
                disabled={loading} 
                size="small"
                sx={{ color: "#4CAF50" }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default NameEditField;
