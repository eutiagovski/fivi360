import { Box, CircularProgress, Typography } from "@mui/material";
import React from "react";

const LoadingBox = ({ pending }) => {
  return (
    <div>
      {pending && (
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: "90vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {pending === true ? (
            <CircularProgress align="center" />
          ) : (
            <Typography>{pending}</Typography>
          )}
        </Box>
      )}
    </div>
  );
};

export default LoadingBox;
