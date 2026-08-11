"use client";

import React from "react";
import { Box, Typography, TextField, InputAdornment, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface ProfileFieldProps {
  label: string;
  value: string;
  isEditable?: boolean;
  onEditClick?: () => void;
  readOnly?: boolean;
  onValueChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  isEditable = false,
  onEditClick,
  readOnly = true,
  onValueChange,
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: "13px",
          color: "#1A1A1A",
          mb: 0.5,
          fontWeight: 600,
          fontFamily: "Open Sans",
        }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        value={value}
        onChange={onValueChange}
        disabled={readOnly && !isEditable}
        variant="outlined"
        InputProps={{
          readOnly: readOnly,
          endAdornment: isEditable ? (
            <InputAdornment position="end">
              <IconButton onClick={onEditClick} edge="end" size="small">
                <EditIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: {
            height: "48px",
            backgroundColor: readOnly && !isEditable ? "#F9FAFB" : "#FFFFFF",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 400,
            fontFamily: "Open Sans",
            color: readOnly && !isEditable ? "#9CA3AF" : "#1A1A1A",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E5E7EB",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#E5E7EB",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: isEditable ? "#E6873C" : "#E5E7EB",
            },
          },
        }}
      />
    </Box>
  );
};

export default ProfileField;
