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
import { Save } from "@mui/icons-material";
import { useEffect } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import storage from "../../firebase.storage";
import { AuthContext } from "../../context/AuthContext";
import { handleAddDoc } from "../../firebase.firestore";
import { useNavigate } from "react-router-dom";

const SaveButton = ({ disabled, item, setPendingMessage, setImage }) => {
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

  useEffect(() => {
    if (item)
      setValues({ title: item.title, text: item.text, author: item.author });
    if (item.item)
      setValues({
        title: item.item.title,
        text: item.item.text,
        author: item.item.author,
      });
  }, [item]);

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
    uploadBytes(storageRef, item.imageFile).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        const details = {
          user: currentUser.id,
          createdAt: new Date().toISOString(),
          path: `${url}`,
          author: currentUser.name,
          title: values.title?.length >= 1 ? values.title : "Sem título",
          imageRef: snapshot.metadata.fullPath,
        };
        handleAddDoc(details).then((id) => {
          setPendingMessage({
            open: true,
            message: "Salvo com sucesso!",
            severity: "success",
          });
          setImage({ ...item, id: id, ...details });
          navigate(`/?image=${id}`);
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
      <Save onClick={handleOpen} />
    </IconButton>
  );
};

export default SaveButton;
