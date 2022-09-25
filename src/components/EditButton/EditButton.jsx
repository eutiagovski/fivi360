import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { useEffect } from "react";
import {
  handleQueryAlbum,
  handleUpdateImage,
  handleUpdateUserAlbum,
} from "../../firebase.firestore";

const EditButton = ({ disabled, item, setPendingMessage }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [values, setValues] = useState({});
  const inputs = [
    { label: "Titulo", type: "text", name: "title" },
    { label: "Autor", type: "text", name: "author" },
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

  const handleSubmit = async () => {
    handleClose();
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
    });
    if (item.items) {
      const updated = { ...item, ...values };
      handleUpdateUserAlbum(updated).then(() =>
        setPendingMessage({
          open: true,
          message: "Sucesso",
          severity: "success",
        })
      );
      return;
    }
    if (item.imageRef) {
      const updated = {
        ...item,
        ...values,
        text: values.text ? values.text : "",
      };
      handleUpdateImage(updated).then(() =>
        setPendingMessage({
          open: true,
          message: "Sucesso",
          severity: "success",
        })
      );
      return;
    }
    if (item.album && item.item) {
      handleQueryAlbum(item.album).then((album) => {
        const m = album.items.map((albumItem) => {
          return albumItem.id === item.item.id
            ? { ...albumItem, ...values }
            : albumItem;
        });
        const updateAlbum = { ...album, items: m };
        console.log(updateAlbum)
        handleUpdateUserAlbum(updateAlbum).then(() =>
          setPendingMessage({
            open: true,
            message: "Sucesso",
            severity: "success",
          })
        );
      });
      return;
    }
  };
  return (
    <IconButton disabled={disabled}>
      <Edit onClick={handleOpen} />
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Editar "{item.title}"</DialogTitle>
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
    </IconButton>
  );
};

export default EditButton;
