"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import React from "react";
import { useTenant } from "@learner/context/TenantContext";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  SubHeading?: string;
  children?: React.ReactNode;
  btnText: string;
  handlePrimaryAction: () => void;
  secondaryBtnText?: string;
  handleSecondaryAction?: () => void;
  selectedDate?: Date;
}

const ModalComponent: React.FC<ModalProps> = ({
  open,
  onClose,
  heading,
  SubHeading,
  children,
  btnText,
  handlePrimaryAction,
  secondaryBtnText = "Back",
  handleSecondaryAction,
}) => {
  const { contentFilter } = useTenant();
  const primaryColor = contentFilter?.theme?.primaryColor || "#E6873C";
  const secondaryColor = contentFilter?.theme?.secondaryColor || "#1A1A1A";

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
        },
      }}
    >
      <DialogTitle
        sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          gap: 1,
          pb: 2,
        }}
      >
        <Typography component="div" variant="h6" sx={{ color: secondaryColor, fontWeight: 600 }}>
          {heading}
        </Typography>
        <CloseSharpIcon
          sx={{ 
            cursor: "pointer",
            color: secondaryColor,
            "&:hover": {
              color: primaryColor,
            },
          }}
          onClick={onClose}
          aria-label="Close"
        />
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        {SubHeading ? (
          <Typography variant="body2" mb={1.5} sx={{ color: alpha(secondaryColor, 0.7) }}>
            {SubHeading}
          </Typography>
        ) : null}
        <Box>{children}</Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, gap: 2 }}>
        {secondaryBtnText ? (
          <Button
            variant="outlined"
            onClick={handleSecondaryAction ?? onClose}
            sx={{
              borderColor: alpha(secondaryColor, 0.3),
              color: secondaryColor,
              textTransform: "none",
              fontWeight: 500,
              px: 3,
              "&:hover": {
                borderColor: secondaryColor,
                backgroundColor: alpha(secondaryColor, 0.05),
              },
            }}
          >
            {secondaryBtnText}
          </Button>
        ) : null}
        <Button 
          variant="contained" 
          onClick={handlePrimaryAction}
          sx={{
            backgroundColor: primaryColor,
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.4)}`,
            "&:hover": {
              backgroundColor: primaryColor,
              boxShadow: `0 6px 16px ${alpha(primaryColor, 0.5)}`,
              opacity: 0.9,
            },
          }}
        >
          {btnText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalComponent;

