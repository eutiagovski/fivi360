import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { handleAddUserAlbum, handleQueryImage } from "../../firebase.firestore";
import { useNavigate } from "react-router-dom";
import { DialogContentText } from "@mui/material";
import SnackMessage from "../SnackMessage/SnackMessage";

const CreateAlbum = ({ images, open, handleClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [values, setValues] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
      handleClose: handleSnackClose,
    });

    const items = await Promise.all(
      Object.keys(images).map((p) => {
        return handleQueryImage(p).then((i) => {
          return i;
        });
      })
    );

    const album = {
      title: values.title ? values.title : "Sem título",
      text: values.text ? values.text : "",
      items: items,
      createdAt: new Date().toISOString(),
      author: currentUser.name,
      user: currentUser.id,
    };

    handleAddUserAlbum(album).then((id) => {
      setPendingMessage({
        open: true,
        message: "Criado com sucesso!",
        severity: "success",
        handleClose: handleSnackClose,
      });
      navigate(`/album&album=${id}`);
    });
    handleClose();

  };

  // section to handle snackbar messages
  const [pendingMessage, setPendingMessage] = useState({
    open: false,
    vertical: "top",
    horizontal: "center",
    message: "",
    severity: "",
  });
  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setPendingMessage(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Criar Album</DialogTitle>
      <DialogContent>
        <DialogContentText>Criar um novo álbum de imagens:</DialogContentText>

        <TextField
          size="small"
          autoFocus
          id="title"
          label="Título do Album"
          type="text"
          fullWidth
          variant="standard"
          multiline
          onChange={(e) => setValues({ ...values, title: e.target.value })}
        />
        <TextField
          size="small"
          autoFocus
          id="text"
          label="Descrição do Album"
          type="text"
          fullWidth
          multiline
          variant="standard"
          onChange={(e) => setValues({ ...values, text: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Voltar</Button>
        <Button onClick={handleSubmit}>Criar</Button>
      </DialogActions>
      <SnackMessage pendingMessage={pendingMessage} />
    </Dialog>
  );
};

export default CreateAlbum;
