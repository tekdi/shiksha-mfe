"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";
import { getContrastTextColor } from "@learner/utils/colorUtils";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  primaryColor?: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  primaryColor = "#E6873C",
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Enable Location</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          We need your device location to verify your attendance. Please enable
          location access when prompted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          No, go back
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            backgroundColor: primaryColor,
            color: getContrastTextColor(primaryColor),
            "&:hover": {
              backgroundColor: primaryColor,
              opacity: 0.9,
            },
          }}
        >
          Turn On
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationModal;

