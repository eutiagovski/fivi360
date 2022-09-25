import {
  PanoramaPhotosphere,
} from "@mui/icons-material";
import { SpeedDial, SpeedDialAction } from "@mui/material";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ActionsButton = ({options, invertColor}) => {

  const navigate = useNavigate();
  
  // const options = albumNavOptions;
  return (
    <SpeedDial
      ariaLabel="SpeedDial basic example"
      sx={{ position: "absolute", bottom: 16, right: 16 }}
      icon={<PanoramaPhotosphere />}
      FabProps={{
        sx: {
          bgcolor: invertColor ? "#FFF" : "#121212",
          "&:hover": {
            bgcolor: invertColor ? "#999" : "#333",
          },
          color: invertColor ? "#121212" : "#FFF",
        },
      }}
    >
      {options?.filter(item => !item.disabled).map((option) => (
        <SpeedDialAction
          key={option.name}
          icon={option.icon}
          tooltipTitle={option.name}
          onClick={option.action}
        />
      ))}
    </SpeedDial>
  );
};

export default ActionsButton;
