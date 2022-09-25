import IconButton from "@mui/material/IconButton";
import { useEffect, useState, useContext } from "react";
import {
  Box,
  Checkbox,
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Collections,
  CreateNewFolder,
  DeleteForever,
  MoreVert,
  PanoramaPhotosphere,
  PermMedia,
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
import CircularProgress from "@mui/material/CircularProgress";
import CreateAlbum from "../../components/CreateAlbum/CreateAlbum";
import ActionsButton from "../../components/ActionsButton/ActionsButton";
import DeleteModal from "../../components/DeleteModal/DeleteModal";
import SnackMessage from "../../components/SnackMessage/SnackMessage";

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
    handleQueryUserImages(currentUser?.id)
      .then((images) => {
        setImages(images);
        setPending(false);
      })
      .catch((e) => setPending("Não foi possível carregar esta galeria."));
  }, [shareOpen]);

  // section to handle delete image
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const handleOpenDeleteConfirm = () => setDeleteConfirm(true);
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm(false);
    setImageDelete(null);
  };
  const [imageDelete, setImageDelete] = useState(null);

  useEffect(() => {
    if (imageDelete) handleOpenDeleteConfirm();
  }, [imageDelete]);

  const handleDeleteImage = async () => {
    handleCloseDeleteConfirm();
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
      handleClose: handleSnackClose,
    });

    const imageRef = ref(storage, imageDelete.path);
    deleteObject(imageRef)
      .then(() => {
        handleDeleteUserImage(imageDelete.id);

        setImages(images.filter((image) => image.id != imageDelete.id));
        setImageDelete(null);
        setPendingMessage({
          open: true,
          message: "Deletada com sucesso!",
          severity: "success",
          handleClose: handleSnackClose,
        });
      })
      .catch((error) => {
        setPendingMessage({
          open: true,
          message: "Erro ao deletar!",
          severity: "error",
          handleClose: handleSnackClose,
        });
      });
  };
  const matches = useMediaQuery("(min-width:600px)");

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

  // section to handle album create
  const [albumModal, setAlbumModal] = useState(false);
  const handleAlbumModalOpen = () => setAlbumModal(true);
  const handleAlbumModalClose = () => setAlbumModal(false);
  const [groupSelect, setGroupSelect] = useState({});

  const pageOptions = [
    {
      icon: <PermMedia />,
      name: "Albums",
      action: () => navigate("/albums"),
    },
    {
      icon: <CreateNewFolder />,
      name: "Criar Album",
      action: handleAlbumModalOpen,
      disabled:
        Object.values(groupSelect).filter((item) => item === true).length === 0,
    },
    {
      icon: <PanoramaPhotosphere />,
      name: "Início",
      action: () => navigate("/"),
    },
  ];
  return (
    <Container maxWidth="xl" sx={{ height: "100%", overflow: "none" }}>
      <Typography
        variant="h6"
        noWrap
        component="a"
        sx={{
          mr: 2,
          pt: 1,
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
      <ImageList sx={{ width: "100%", height: "75vh" }}>
        {images.map((item) => (
          <ImageListItem key={item.path} cols={matches ? 1 : 4} gap={18}>
            <img
              src={`${item.path}?w=248&fit=crop&auto=format`}
              srcSet={`${item.path}?w=248&fit=crop&auto=format&dpr=2 2x`}
              alt={item.title}
              // loading="lazy"
            />
            <ImageListItemBar
              title={
                <Box
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/?image=${item.id}`)}
                >
                  {item.title}
                </Box>
              }
              subtitle={item.createdAt}
              actionIcon={
                <>
                  <IconButton>
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
                    onClick={() => setImageDelete(item)}
                  >
                    <DeleteForever />
                  </IconButton>
                </>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>
      <ActionsButton options={pageOptions} invertColor />
      <DeleteModal
        title="Deletar imagem"
        content={
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography variant="span">
              Você tem certeza de que deseja deletar essa imagem?
            </Typography>
            <Typography variant="span">
              Essa ação não poderá ser desfeita!
            </Typography>
          </Box>
        }
        open={deleteConfirm}
        handleClose={handleCloseDeleteConfirm}
        handleConfirm={handleDeleteImage}
      />
      <SnackMessage pendingMessage={pendingMessage} />
    </Container>
  );
};

export default ImagesView;
