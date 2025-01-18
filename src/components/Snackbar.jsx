import React from 'react';
import { Snackbar as MuiSnackbar, Alert } from '@mui/material';

const Snackbar = ({ open, onClose, message, severity = 'info', autoHideDuration = 6000 }) => {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          borderRadius: '8px',
          minWidth: '300px',
          '& .MuiAlert-icon': {
            fontSize: '24px'
          }
        }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
