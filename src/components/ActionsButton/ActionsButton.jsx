import { PanoramaPhotosphere } from "@mui/icons-material";
import { SpeedDial, SpeedDialAction } from "@mui/material";
import { useRef } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const ActionsButton = ({ options, invertColor, setImage, album }) => {
  const { currentUser } = useContext(AuthContext);

  // handle image file input
  const hiddenFileInput = useRef(null);
  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };
  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    var file = URL.createObjectURL(fileUploaded);
    setImage({ imageUrl: file, imageFile: fileUploaded });
  };

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
      onClick={(currentUser || album) ? null : handleClick}
    >

      {(currentUser || album) &&
        options
          ?.filter((item) => !item.disabled)
          .map((option) => (
            <SpeedDialAction
              key={option.name}
              icon={option.icon}
              tooltipTitle={option.name}
              tooltipOpen={option.name}
              onClick={option.action}
            />
          ))}

      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </SpeedDial>
  );
};

export default ActionsButton;
