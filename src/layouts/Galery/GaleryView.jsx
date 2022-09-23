import IconButton from "@mui/material/IconButton";
import { useEffect, useState, useContext } from "react";
import {
  Box,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  DeleteForever,
  MoreVert,
  PanoramaPhotosphere,
} from "@mui/icons-material";
import {
  handleDeleteUserImage,
  handleQueryUserAlbums,
} from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import storage from "../../firebase.storage";
import { deleteObject, ref } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";


const GaleryView = () => {
  const [albums, setAlbums] = useState([]);
  const { currentUser } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [pending, setPending] = useState(true);
  const [menuItem, setMenuItem] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate()

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuItem(
      albums.filter((image) => image.id === event.currentTarget.value)[0]
    );
  };
  const handleClose = () => {
    setAnchorEl(null);
    setMenuItem(null);
  };

  useEffect(() => {
    handleQueryUserAlbums(currentUser.id).then((images) => {
      setAlbums(images);
      setPending(images.length >= 1 ? false : 'Nenhum item a ser exibido');
      console.log(images)
    });
  }, [shareOpen]);

 
  const matches = useMediaQuery("(min-width:600px)");
  return (
    <>
      {pending && (
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {pending === true ? <CircularProgress align="center" /> : <Typography>{pending}</Typography>}
        </Box>
      )}
      <ImageList
        sx={{ width: "100%", height: { xs: "71vh", md: "74vh", xl: "80vh" } }}
      >
        {albums.map((item) => (
          <ImageListItem key={item.path} cols={matches ? 1 : 4} gap={18}>
            <img
              src={`${item.items[0].path}?w=124&fit=crop&auto=format`}
              srcSet={`${item.items[0].path}?w=124&fit=crop&auto=format&dpr=2 2x`}
              alt={item.title}
              // loading="lazy"
            />
            <ImageListItemBar
              title={item.title}
              subtitle={item.createdAt}
              actionIcon={
                <>
                  <IconButton
                    sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                    aria-label={`info about ${item.title}`}
                    aria-controls={open ? "long-menu" : undefined}
                    aria-expanded={open ? "true" : undefined}
                    aria-haspopup="true"
                    value={item.id}
                    onClick={handleClick}
                  >
                    <MoreVert />
                  </IconButton>
                  <Menu
                    id="long-menu"
                    MenuListProps={{
                      "aria-labelledby": "long-button",
                    }}
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                      style: {
                        maxHeight: 48 * 4.5,
                        width: "20ch",
                      },
                    }}
                  >
                    <MenuItem
                      onClick={() => navigate(`/&?image=${menuItem?.id}`)}
                    >
                      <ListItemIcon>
                        <PanoramaPhotosphere />
                      </ListItemIcon>
                      <ListItemText>Ver em 360°</ListItemText>
                    </MenuItem>
                    <MenuItem >
                      <ListItemIcon>
                        <DeleteForever />
                      </ListItemIcon>
                      <ListItemText>Apagar</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>
    </>
  );
};

export default GaleryView;
