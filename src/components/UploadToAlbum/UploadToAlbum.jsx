import { useContext, useState } from "react";

import {
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Upload } from "@mui/icons-material";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import storage from "../../firebase.storage";
import { AuthContext } from "../../context/AuthContext";
import { handleAddDoc, handleUpdateUserAlbum } from "../../firebase.firestore";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { useEffect } from "react";

const UploadToAlbum = ({ album, setPendingMessage }) => {
  const [image, setImage] = useState(null);

  // handle image file input
  const hiddenFileInput = useRef(null);
  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };
  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    var file = URL.createObjectURL(fileUploaded);
    setImage({ imageUrl: file, imageFile: fileUploaded });
    handleOpen()
  };


  const { currentUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const navigate = useNavigate();

  const [values, setValues] = useState({});
  const inputs = [
    { label: "Titulo", type: "text", name: "title" },
    { label: "Descrição", type: "text", name: "text" },
  ];

  const handleSubmit = () => {
    handleClose();
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
    });
    const storageRef = ref(
      storage,
      `/${currentUser.id}/${new Date().toISOString()}`
    );

    // upload image to gc
    uploadBytes(storageRef, image.imageFile).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        const details = {
          user: currentUser.id,
          createdAt: new Date().toISOString(),
          path: `${url}`,
          author: currentUser.name,
          title: values.title?.length >= 1 ? values.title : "Sem título",
          text: values.text?.length >= 1 ? values.text : "Sem texto",
          imageRef: snapshot.metadata.fullPath,
        };
        handleAddDoc(details).then((id) => {
          setPendingMessage({
            open: true,
            message: "Salvo com sucesso!",
            severity: "success",
          });
          setImage({ ...image, id: id, ...details });
          const newItem = {...details, id: id}
          const newAlbum = {
            ...album, 
            items: [...album.items, newItem]
          }

          handleUpdateUserAlbum(newAlbum)
        });
      });
    });
  };

  

  return (
    <IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Salvar Imagem</DialogTitle>
        <DialogContent>
          {inputs.map((input) => (
            <TextField
              size="small"
              autoFocus
              id="title"
              label={input.label}
              type={input.type}
              fullWidth
              variant="standard"
              name={input.name}
              multiline
              value={values[input.name]}
              onChange={(e) =>
                setValues({ ...values, [e.target.name]: e.target.value })
              }
              shrink
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Voltar</Button>
          <Button onClick={handleSubmit} autoFocus>
            Contiuar
          </Button>
        </DialogActions>
      </Dialog>
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

export default UploadToAlbum;
