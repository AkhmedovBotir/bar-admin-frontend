import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

const DeleteDialog = ({ open, onClose, onConfirm, loading, title, description }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          minWidth: '400px'
        }
      }}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography>
          {description}
        </Typography>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Bekor qilish
        </Button>
        <LoadingButton
          variant="contained"
          onClick={onConfirm}
          loading={loading}
          color="error"
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none'
          }}
        >
          O'chirish
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
