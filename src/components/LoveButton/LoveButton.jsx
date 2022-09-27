import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
  Box,
  MenuItem,
} from "@mui/material";
import { Favorite } from "@mui/icons-material";
import { useState } from "react";

const LoveButton = ({ item }) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>FIVI 360</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="span">
              O FIVI360, é um visualizador imersivo e intuitivo de imagens
              panorâmicas (360°).
            </Typography>
            <Link href="https://github.com/eutiagovski/fivi360" target="_blank">
              Coheça o projeto
            </Link>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Ok</Button>
        </DialogActions>
      </Dialog>
      <MenuItem onClick={handleOpen}>
        <Box
          mr={1}
          spacing={1}
          sx={{
            display: "flex",
            alignItems: "center",
            width: " 100%",
          }}
        >
          <IconButton>
            <Favorite />
          </IconButton>

          <Typography textAlign="center" ml={2}>
            Conheça o Projeto
          </Typography>
        </Box>
      </MenuItem>
    </>
  );
};

export default LoveButton;
