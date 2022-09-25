import { Info } from "@mui/icons-material";
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
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const InfoButton = ({ item }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const navigate = useNavigate();

  const [values, setValues] = useState({});
  const inputs = [
    { label: "Titulo", type: "text", name: "title" },
    { label: "Autor", type: "text", name: "author" },
    { label: "Descrição", type: "text", name: "text" },
    { label: "Data Criação", type: "text", name: "createdAt" },
  ];

  useEffect(() => {
    if (item)
      setValues({
        title: item.title,
        text: item.text,
        author: item.author,
        createdAt: item.createdAt,
      });
    if (item.item)
      setValues({
        title: item.item.title,
        text: item.item.text,
        author: item.item.author,
        createdAt: item.item.createdAt,
      });
  }, [item]);

  return (
    <IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{item.title}</DialogTitle>
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
                disabled
                shrink
                sx={{mb:1}}
              />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Voltar</Button>
        </DialogActions>
      </Dialog>
      <Info onClick={handleOpen} />
    </IconButton>
  );
};

export default InfoButton;
