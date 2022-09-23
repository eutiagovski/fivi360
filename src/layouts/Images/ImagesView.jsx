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
  handleQueryUserImages,
} from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import storage from "../../firebase.storage";
import { deleteObject, ref } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import SwipeableViews from "react-swipeable-views";
import CircularProgress from "@mui/material/CircularProgress";
import ShareModal from "../../components/ShareModal/ShareModal";
const ImagesView = () => {
  const [images, setImages] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pending, setPending] = useState(true);
  const [menuItem, setMenuItem] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();

  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuItem(
      images.filter((image) => image.id === event.currentTarget.value)[0]
    );
  };
  const handleClose = () => {
    setAnchorEl(null);
    setMenuItem(null);
  };

  useEffect(() => {
    handleQueryUserImages(currentUser.id).then((images) => {
      setImages(images);
      setPending(false);
    });
  }, [shareOpen]);

  const handleDeleteImage = async (item) => {
    const imageRef = ref(storage, item.path);
    deleteObject(imageRef)
      .then(() => {
        alert("Imagem deletada com sucesso!");
        handleDeleteUserImage(item.id);

        setImages(images.filter((image) => image.id != item.id));
      })
      .catch((error) => {
        // Uh-oh, an error occurred!
      });
  };
  const matches = useMediaQuery("(min-width:600px)");
  const handleShareOpen = () => setShareOpen(true);
  const handleShareClose = () => setShareOpen(false);
  return (
    <Box sx={{height: '70vh'}}>
      <Typography
        variant="h6"
        noWrap
        component="a"
        sx={{
          mr: 2,
          display:'flex',
          fontFamily: "monospace",
          fontWeight: 700,
          letterSpacing: ".3rem",
          color: "inherit",
          textDecoration: "none",
          cursor: "pointer",
          justifyContent: 'center',
          pt:1
        }}
      >
        GALERIA 
      </Typography>
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
          <CircularProgress align="center" />
        </Box>
      )}
      <ImageList sx={{ width: "100%", height: { xs: "80vh", sm: "80vh" } }}>
        {images.map((item) => (
          <ImageListItem key={item.path} cols={matches ? 1 : 4} gap={18}>
            <img
              src={`${item.path}?w=248&fit=crop&auto=format`}
              srcSet={`${item.path}?w=248&fit=crop&auto=format&dpr=2 2x`}
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
                    <MenuItem onClick={() => handleDeleteImage(menuItem)}>
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
    </Box>
  );
};

export default ImagesView;
