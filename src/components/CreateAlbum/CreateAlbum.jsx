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

const CreateAlbum = ({ images, open, handleClose }) => {
  const { currentUser } = useContext(AuthContext);
  const [values, setValues] = useState({});
  const navigate = useNavigate();


  const handleSubmit = async () => {
    // handleClose();

    const items = await Promise.all(
      Object.keys(images).map(p => {
        return handleQueryImage(p).then(i => {return i});
      })
    );
    
    const album = {
      title: values.title,
      text: values.text ? values.text : "",
      items: items,
      createdAt: new Date().toISOString(),
      author: currentUser.name,
      user: currentUser.id,
    };
    
    console.log(album);
    handleAddUserAlbum(album).then((id) => navigate(`/albums/?album=${id}`));
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Criar Album</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>
          
        </DialogContentText> */}

        <TextField
          autoFocus
          margin="dense"
          id="title"
          label="Título do Album"
          type="text"
          fullWidth
          variant="standard"
          InputProps={{}}
          onChange={(e) => setValues({...values, title: e.target.value})}
        />
        <TextField
          autoFocus
          margin="dense"
          id="title"
          label="Descrição do Album"
          type="text"
          fullWidth
          variant="standard"
          InputProps={{}}
          onChange={(e) => setValues({...values, text: e.target.value})}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Voltar</Button>
        <Button onClick={handleSubmit}>Criar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAlbum;
