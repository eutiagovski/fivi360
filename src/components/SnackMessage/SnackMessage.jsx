import { Stack, Snackbar, Alert } from "@mui/material";
import { forwardRef, useState } from "react";

const CustomAlert = forwardRef(function CustomAlert(props, ref) {
  return <Alert elevation={6} ref={ref} variant="filled" {...props} />;
});

const SnackMessage = ({ pendingMessage }) => {
  const { open, handleClose, severity, message } = pendingMessage;
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        size='small'
      >
        <CustomAlert
          onClose={handleClose}
          severity={severity}
          sx={{ width: "100%" }}
        >
          {message}
        </CustomAlert>
      </Snackbar>
    </Stack>
  );
};

export default SnackMessage;
