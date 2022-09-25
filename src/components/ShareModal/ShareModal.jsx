import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { IconButton, InputAdornment } from "@mui/material";
import { CopyAll } from "@mui/icons-material";

const ShareModal = ({ image, open, handleClose, type }) => {
  const shareImageLink = window.location.href
  const shareAlbumLink = window.location.href

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Compartilhar "{image?.title}"</DialogTitle>
      <DialogContent>
        <TextField
        size='small'
          multiline
          autoFocus
          id="name"
          label={image.items ? "Link para o album" : "Link para a imagem"}
          type="email"
          fullWidth
          variant="standard"
          value={image.items ? shareAlbumLink : shareImageLink}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <CopyAll
                    onClick={() => {
                      navigator.clipboard.writeText(
                        image.items ? shareAlbumLink : shareImageLink
                      );
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
  );
};

export default ShareModal;
