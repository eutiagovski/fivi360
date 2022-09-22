import {
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Backdrop,
} from "@mui/material";
import { useRef, useState } from "react";
import { DeleteForever, Share, Upload } from "@mui/icons-material";

export default function BasicSpeedDial({ setImage }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Create a reference to the hidden file input element
  const hiddenFileInput = useRef(null);

  // Programatically click the hidden file input element
  // when the Button component is clicked
  const handleClick = (event) => {
    hiddenFileInput.current.click();
  }; // Call a function (passed as a prop from the parent component)
  // to handle the user-selected file
  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    const file = URL.createObjectURL(fileUploaded)
    setImage(file)
  };

  const actions = [
    // { icon: <SaveIcon />, name: "Save" },
    { icon: <DeleteForever />, name: "Limpar", onClick: () => setImage('') },
    // { icon: <Share />, name: "Compartilhar Imagem" },
    { icon: <Upload />, name: "Carregar Imagem", onClick: handleClick },
  ];

  return (
    <>
      <Backdrop open={open} />
      <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        sx={{ position: "absolute", bottom: 16, right: 16, color: "#000" }}
        icon={<SpeedDialIcon />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        FabProps={{
          sx: {
            bgcolor: "#000",
            "&:hover": {
              bgcolor: "#111",
            },
            color: "#FFF",
          },
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </>
  );
}
