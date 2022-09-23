import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import {
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Switch,
} from "@mui/material";
import { CopyAll } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { handleUpdateImage } from "../../firebase.firestore";

const ShareModal = ({
  image,
  open,
  handleClose,
}) => {
  const [values, setValues] = useState({share: image.share});
  
  const handleSubmit = () => {
    handleUpdateImage(image.id, values);
    handleClose()
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Compartilhar "{image?.title}"</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Permitir que outras pessoas vejam essa imagem?
        </DialogContentText>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                defaultChecked={values.share}
                onChange={(e) =>
                  setValues({ ...values, share: e.target.checked })
                }
              />
            }
            label="Compartilhar"
          />
        </FormGroup>
        {values.share && (
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Link da imagem"
            type="email"
            fullWidth
            variant="standard"
            value={`https://fivi360.web.app/?image=${image.id}`}
            InputProps={{
              endAdornment: (
                <InputAdornment position="start">
                  <IconButton>
                    <CopyAll />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Voltar</Button>
        <Button onClick={handleSubmit}>Compartilhar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareModal;