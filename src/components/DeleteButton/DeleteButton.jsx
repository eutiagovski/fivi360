import { DeleteForever } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";

const DeleteButton = ({disabled}) => {
  return (
    <IconButton
      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
      disabled={disabled}
    >
      <DeleteForever />
    </IconButton>
  );
};

export default DeleteButton;
