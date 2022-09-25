import IconButton from "@mui/material/IconButton";
import { useEffect, useState, useContext } from "react";
import {
  Box,
  Checkbox,
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  CreateNewFolder,
  PanoramaPhotosphere,
  PermMedia,
} from "@mui/icons-material";
import {
  handleQueryUserImages,
} from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CreateAlbum from "../../components/CreateAlbum/CreateAlbum";
import ActionsButton from "../../components/ActionsButton/ActionsButton";
import SnackMessage from "../../components/SnackMessage/SnackMessage";
import DeleteButton from "../../components/DeleteButton/DeleteButton";
import EditButton from "../../components/EditButton/EditButton";
import LoadingBox from "../../components/LoadingBox/LoadingBox";
import InfoButton from "../../components/InfoButton/InfoButton";

const ImagesView = () => {
  const [images, setImages] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const [pending, setPending] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    handleQueryUserImages(currentUser?.id)
      .then((images) => {
        setImages(images);
        setPending(images.length >= 1 ? false : "Nenhum item a ser exibido");
      })
      .catch((e) => setPending("Não foi possível carregar esta galeria."));
  }, [shareOpen, pendingMessage.open]);

  const matches = useMediaQuery("(min-width:600px)");

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
    <Container maxWidth="xxl" >
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

      <LoadingBox pending={pending}/>
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
                  <InfoButton item={item} />
                  <EditButton
                    item={item}
                    setPendingMessage={setPendingMessage}
                  />
                  <DeleteButton
                    item={item}
                    setPendingMessage={setPendingMessage}
                  />
                </>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>
      <ActionsButton options={pageOptions} invertColor />
     
      <SnackMessage pendingMessage={{...pendingMessage, handleClose: handleSnackClose}} />
    </Container>
  );
};

export default ImagesView;
