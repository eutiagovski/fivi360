import { Upload } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const UploadButton = ({ setImage }) => {
  const navigate = useNavigate();
  // handle image file input
  const hiddenFileInput = useRef(null);
  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };
  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    var file = URL.createObjectURL(fileUploaded);
    setImage({ imageUrl: file, imageFile: fileUploaded });
    navigate("/");
  };

  return (
    <IconButton>
      <Upload onClick={handleClick} />
      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </IconButton>
  );
};

export default UploadButton;
