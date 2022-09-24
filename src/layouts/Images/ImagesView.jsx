import IconButton from "@mui/material/IconButton";
import { useEffect, useState, useContext } from "react";
import {
  Box,
  Checkbox,
  Container,
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
  Add,
  DeleteForever,
  MoreVert,
  PanoramaPhotosphere,
  Workspaces,
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
import CreateAlbum from "../../components/CreateAlbum/CreateAlbum";
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
    if (window.confirm("Tem certeza de que deseja deletar esta imagem?")) {
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
    }
  };
  const matches = useMediaQuery("(min-width:600px)");

  const [albumModal, setAlbumModal] = useState(false);
  const handleAlbumModalOpen = () => setAlbumModal(true);
  const handleAlbumModalClose = () => setAlbumModal(false);
  const [groupSelect, setGroupSelect] = useState({});

  return (
    <Box sx={{ height: "70vh" }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItens: "center",
            width: "100%",
            mt: 1,
          }}
        >
          <Typography
            variant="h6"
            noWrap
            component="a"
            sx={{
              mr: 2,
              display: "flex",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            GALERIA
          </Typography>
          <Box>
            {Object.values(groupSelect).filter((item) => !!item).length >= 1 ? (
              <IconButton>
                <Workspaces onClick={handleAlbumModalOpen} />
              </IconButton>
            ) : (
              <IconButton>
                <Add onClick={() => navigate("/")} />
              </IconButton>
            )}

            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
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
        <CreateAlbum
          images={groupSelect}
          open={albumModal}
          handleClose={handleAlbumModalClose}
        />
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
                title={<Box sx={{ cursor: "pointer" }} onClick={() => navigate(`/?image=${item.id}`)}>{item.title}</Box>}
                subtitle={item.createdAt}
                actionIcon={
                  <>
                    <IconButton
                    // sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                    // aria-label={`info about ${item.title}`}
                    // aria-controls={open ? "long-menu" : undefined}
                    // aria-expanded={open ? "true" : undefined}
                    // aria-haspopup="true"
                    // value={item.id}
                    // onClick={handleClick}
                    >
                      <Checkbox
                        size="small"
                        name={item.id}
                        onChange={(e) =>
                          setGroupSelect({
                            ...groupSelect,
                            [e.target.name]: e.target.checked,
                          })
                        }
                      />
                    </IconButton>

                    <IconButton
                      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                      aria-label={`info about ${item.title}`}
                      aria-controls={open ? "long-menu" : undefined}
                      aria-expanded={open ? "true" : undefined}
                      aria-haspopup="true"
                      value={item.id}
                      onClick={() => handleDeleteImage(item.id)}
                    >
                      <DeleteForever />
                    </IconButton>
                  </>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Container>
    </Box>
  );
};

export default ImagesView;
