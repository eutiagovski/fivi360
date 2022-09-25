import { DeleteForever } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  handleDeleteUserAlbum,
  handleDeleteUserImage,
  handleQueryAlbum,
  handleUpdateUserAlbum,
} from "../../firebase.firestore";
import { useNavigate } from "react-router-dom";

const DeleteButton = ({ disabled, item, setPendingMessage }) => {
  const [open, setOpen] = useState(false);
  const handleConfirmOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    handleClose();
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
    });

    if (item.album && item.item) {
      handleQueryAlbum(item.album).then((album) => {
        const m = album.items.filter((albumItem) => {
          return albumItem.id !== item.item.id;
        });
        const updateAlbum = { ...album, items: m };
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
    if (item.items) {
      handleDeleteUserAlbum(item.id).then((resp) => navigate("/albums"));
      return;
    }

    if (item.imageRef) {
      handleDeleteUserImage(item.id).then(() =>
        setPendingMessage({
          open: true,
          message: "Sucesso",
          severity: "success",
        })
      );
    }
  };
  return (
    <IconButton disabled={disabled}>
      <DeleteForever onClick={handleConfirmOpen} />
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Deletar "{item.title}"
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza de que deseja deletar esta{" "}
            {item.items ? "album" : "imagem"}?
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            Essa ação não podera ser desfeita.
          </DialogContentText>
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

export default DeleteButton;
