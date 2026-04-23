import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { FilterForm } from '@shared-lib';
import React from 'react';

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply?: (data: any) => void;
  filterValues: any;
  filterFramework?: any;
  staticFilter?: any;
}

const FilterDialog = ({
  open,
  onClose,
  onApply,
  filterValues,
  filterFramework,
  staticFilter,
}: FilterDialogProps) => {
  const handleFilterChange = (data: any) => {
    onApply?.(data);
  };

  return (
    <Dialog
      fullWidth
      open={open}
      sx={{
        borderRadius: '16px',
        '& .MuiDialog-paper': { backgroundColor: '#FEF7FF' },
      }}
      onClose={onClose}
    >
      <DialogTitle>Filters</DialogTitle>
      <IconButton
        sx={(theme) => ({
          position: 'absolute',
          top: 8,
          right: 8,
          color: theme.palette.grey[500],
        })}
        onClick={onClose}
        aria-label="close"
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <FilterForm
          onApply={handleFilterChange}
          orginalFormData={filterValues}
        />
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(FilterDialog);
