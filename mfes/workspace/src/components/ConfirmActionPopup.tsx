import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Grid,
  IconButton,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import { getFormFields } from '../services/ContentService';
import { Publish } from '../utils/app.constant';
import React, { useEffect, useState } from 'react';
interface ConfirmActionPopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (checkedItems: string[], comment?: any) => void;
  actionType: any;
}

const ConfirmActionPopup: React.FC<ConfirmActionPopupProps> = ({
  open,
  onClose,
  onConfirm,
  actionType,
}) => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [usabilityOptions, setUsabilityOptions] = useState<string[]>([]);
  const [contentDetailsOptions, setContentDetailsOptions] = useState<string[]>(
    []
  );
  const [comment, setComment] = useState<string>('');

  const handleCheckboxChange = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Handle select all for both usability and content details options
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allOptions = [...usabilityOptions, ...contentDetailsOptions];
      setCheckedItems(allOptions);
    } else {
      setCheckedItems([]);
    }
  };

  const handleClose = () => {
    setCheckedItems([]);
    setComment('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(checkedItems, comment);
  };

  const allOptions = [...usabilityOptions, ...contentDetailsOptions];
  const allChecked =
    allOptions.length > 0 &&
    allOptions.every((option) => checkedItems.includes(option));
  useEffect(() => {
    const fetchFields = async () => {
      try {
        if (open) {
          const data = await getFormFields();

          const contents = (data as any)?.result?.form?.data?.fields[0]
            ?.contents;
          let usabilityCheckList: any = [];
          let contentDetailsCheckList: any = [];
          contents.forEach((item: any) => {
            if (item.name === 'Usability') {
              usabilityCheckList = item.checkList;
            } else if (item.name === 'Content details') {
              contentDetailsCheckList = item.checkList;
            }
          });
          setUsabilityOptions(usabilityCheckList);
          setContentDetailsOptions(contentDetailsCheckList);
        }
      } catch (err) {
        console.error('data', err);
      } finally { /* empty */ }
    };
    fetchFields();
  }, [open]);
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 550,
    bgcolor: 'background.paper',
    boxShadow: 24,
    borderRadius: '16px',
  };
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box
          sx={{
            color: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 10px',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              margin: 0,
              fontFamily: 'inherit',
              lineHeight: '24px',
              fontWeight: 500,
              fontSize: '16px',
            }}
          >
            {actionType === Publish.PUBLISH
              ? 'Confirm Publish Action'
              : 'Confirm Reject Action'}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'black' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box
          p={2}
          sx={{
            maxHeight: '49vh',
            minHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Typography gutterBottom>
            {actionType === 'publish'
              ? `Please confirm that ALL the following items are verified (by ticking the checkboxes) before you can ${actionType}.`
              : 'Please select the reason(s) for rejection by ticking the checkboxes below and provide a comment to proceed with rejecting the action:'}
          </Typography>

          {/* Global Select All */}
          {allOptions.length > 0 && (
            <Box
              sx={{
                mb: 2,
                p: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Checkbox
                checked={allChecked}
                onChange={(e) => handleSelectAll(e.target.checked)}
                sx={{ color: 'black', '&.Mui-checked': { color: 'black' } }}
              />
              <Box
                sx={{
                  fontWeight: 600,
                  color: 'black',
                  marginLeft: '10px',
                }}
              >
                Select All
              </Box>
            </Box>
          )}

          <Grid container spacing={2} mt={2}>
            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  mb: 1,
                  marginLeft: '10px',
                }}
                variant="h6"
              >
                Usability
              </Typography>

              {usabilityOptions.map((option) => (
                <Grid container spacing={2} key={option}>
                  <Grid xs={2} item>
                    <Checkbox
                      checked={checkedItems.includes(option)}
                      onChange={() => handleCheckboxChange(option)}
                      sx={{
                        color: 'black',
                        '&.Mui-checked': { color: 'black' },
                      }}
                    />
                  </Grid>
                  <Grid xs={10} item>
                    <Box sx={{ marginTop: '8px', marginLeft: '6px' }}>
                      {option}
                    </Box>
                  </Grid>
                </Grid>
              ))}
            </Grid>
            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: '500',
                  mb: 1,
                  marginLeft: '10px',
                }}
                variant="h6"
              >
                Content Details
              </Typography>

              {contentDetailsOptions.map((option) => (
                <Grid container spacing={2} key={option}>
                  <Grid xs={2} item>
                    <Checkbox
                      checked={checkedItems.includes(option)}
                      onChange={() => handleCheckboxChange(option)}
                      sx={{
                        color: 'black',
                        '&.Mui-checked': { color: 'black' },
                      }}
                    />
                  </Grid>
                  <Grid xs={10} item>
                    <Box sx={{ marginTop: '8px', marginLeft: '6px' }}>
                      {option}
                    </Box>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {actionType === 'reject' && (
            <TextField
              label="Write your comment"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </Box>

        <Divider />

        <Box display="flex" justifyContent="flex-end" p={2}>
          <Button
            onClick={handleClose}
            color="primary"
            sx={{ minWidth: 120, textTransform: 'capitalize' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            sx={{
              minWidth: 120,
              textTransform: 'capitalize',
              borderRadius: '50px',
              ml: 2,
            }}
            disabled={
              (comment === '' && actionType === Publish.REJECT) ||
              (actionType === Publish.PUBLISH && !allChecked)
            }
          >
            {actionType === Publish.PUBLISH ? 'Publish' : 'Reject'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmActionPopup;
