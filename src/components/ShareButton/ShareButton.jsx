import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { CopyAll, Share } from "@mui/icons-material";
import { useState } from "react";

const ShareButton = ({ item, link }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const shareLink = link ? link : window.location.href;

  console.log(item)

  return (
    <IconButton>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Compartilhar "{item?.title}"</DialogTitle>
        <DialogContent>
          <TextField
            size="small"
            multiline
            autoFocus
            id="name"
            label={item?.items ? "Link para o album" : "Link para a imagem"}
            type="email"
            fullWidth
            variant="standard"
            value={shareLink}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <CopyAll
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                      }}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Ok</Button>
          {/* <Button onClick={handleSubmit}>Compartilhar</Button> */}
        </DialogActions>
      </Dialog>
      <Share onClick={handleOpen} />
    </IconButton>
  );
};

export default ShareButton;
