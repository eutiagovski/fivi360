import { useContext, useRef, useState, useEffect } from "react";

import { handleAddDoc, handleQueryAlbum } from "../../firebase.firestore";
import storage from "../../firebase.storage";
import { handleQueryImage } from "../../firebase.firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { Pannellum } from "pannellum-react";

import { Box, CircularProgress, TextField, Typography } from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Collections,
  PanoramaPhotosphere,
  PermMedia,
  Save,
  Share,
  Upload,
} from "@mui/icons-material";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DialogModal from "../../components/DialogModal/DialogModal";
import ShareModal from "../../components/ShareModal/ShareModal";
import ActionsButton from "../../components/ActionsButton/ActionsButton";
import SnackMessage from "../../components/SnackMessage/SnackMessage";
const queryString = require("query-string");

const Viewer = () => {
  const { currentUser } = useContext(AuthContext);

  var { image, album } = queryString.parse(window.location.search);
  var [image, setImage] = useState({ id: image });

  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // section to handle snackbar messages
  const [pendingMessage, setPendingMessage] = useState({
    open: false,
    vertical: "top",
    horizontal: "center",
    message: "",
    sevrity: "",
  });
  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setPendingMessage(false);
  };

  // section to handle album navigation
  const [albumItems, setAlbumItems] = useState([]);
  const [navIndex, setNavIndex] = useState(0);
  useEffect(() => {
    if (album) {
      handleQueryAlbum(album).then((album) => {
        setAlbumItems(album.items);
        setNavIndex(album.items.findIndex((item) => item.id === image.id));
        console.log(album.items.findIndex((item) => item.id === image.id));
      });
    }
  }, []);

  const handleNavFoward = () => {
    navigate(`/?image=${albumItems[navIndex + 1].id}&album=${album}`);
    setImage({ ...image, id: albumItems[navIndex + 1].id });
    setNavIndex(navIndex + 1);
  };
  const handleNavBackward = () => {
    navigate(`/?image=${albumItems[navIndex - 1].id}&album=${album}`);
    setImage({ ...image, id: albumItems[navIndex - 1].id });
    setNavIndex(navIndex - 1);
  };

  const handleBackToAlbum = () => {
    navigate(`/album?album=${album}`);
  };

  const albumNavOptions = [
    {
      name: "Voltar para Galeria",
      icon: <PermMedia />,
      action: handleBackToAlbum,
    },
    {
      name: "Imagem Anterior",
      icon: <ArrowBack />,
      action: handleNavBackward,
      disabled: navIndex === 0,
    },
    {
      name: "Próxima Imagem",
      icon: <ArrowForward />,
      action: handleNavFoward,
      disabled: navIndex === albumItems.length - 1,
    },
  ];

  useEffect(() => {
    if (image.id) {
      setPending(true);
      handleQueryImage(image.id).then((result) => {
        // This can be downloaded directly:
        const xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.onload = (event) => {
          const blob = xhr.response;
          var file = URL.createObjectURL(blob);
          setImage({
            ...image,
            imageUrl: file,
            title: result.title,
            author: result.author,
            id: result.id,
            createdAt: result.createdAt,
            share: result.share,
          });
          setPending(false);
        };
        xhr.open("GET", result.path);
        xhr.send();
      });
    }
  }, [shareOpen, image.id]);

  // handle image file input
  const hiddenFileInput = useRef(null);
  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };
  const handleChange = (event) => {
    const fileUploaded = event.target.files[0];
    var file = URL.createObjectURL(fileUploaded);
    setImage({ imageUrl: file, imageFile: fileUploaded });
  };

  // section to handle save image to galery
  const [modalOpen, setModalOpen] = useState(false);
  const handleModalClose = () => setModalOpen(false);
  const handleModalOpen = () => setModalOpen(true);
  const [imageTitle, setImageTitle] = useState(new Date().toISOString());

  const handleSubmit = () => {
    setPendingMessage({
      open: true,
      message: "Aguarde ...",
      severity: "warning",
      handleClose: handleSnackClose,
    });
    const storageRef = ref(
      storage,
      `/${currentUser.id}/${new Date().toISOString()}`
    );

    // upload image to gc
    uploadBytes(storageRef, image.imageFile).then((snapshot) => {
      getDownloadURL(snapshot.ref).then((url) => {
        const values = {
          user: currentUser.id,
          createdAt: new Date().toISOString(),
          path: `${url}`,
          author: currentUser.name,
          title: imageTitle.length >= 1 ? imageTitle : new Date().toISOString(),
          imageRef: snapshot.metadata.fullPath,
        };

        handleAddDoc(values).then((resp) =>
          setImage({ ...image, id: resp, title: imageTitle })
        );
        setPendingMessage({
          open: true,
          message: "Salvo com sucesso!",
          severity: "success",
          handleClose: handleSnackClose,
        });
      });
    });
    setImageTitle("");
    setModalOpen(false);
  };

  const modalContent = () => {
    const inputs = [{ label: "Título da imagem", type: "text", name: "title" }];
    return (
      <>
        {inputs.map((input) => (
          <TextField
            autoFocus
            id="title"
            size='small'
            label="Título da Imagem"
            type="text"
            fullWidth
            variant="standard"
            size="small"
            onChange={(e) => setImageTitle(e.target.value)}
          />
        ))}
      </>
    );
  };

  // section to handle share button
  const handleShareClose = () => setShareOpen(false);
  const handleShareOpen = () => {
    setShareOpen(true);
  };
  const handleShareSubmit = () => {};

  // actions in the cta
  const actions = [
    {
      icon: <PermMedia />,
      name: "Albums",
      action: () => navigate("/albums"),
      disabled: !currentUser,
    },
    {
      icon: <Collections />,
      name: "Galera",
      action: () => navigate("/imagens"),
      disabled: !currentUser,
    },
    {
      icon: <Share color={image.share ? "success" : "inherit"} />,
      name: "Compartilhar Imagem",
      disabled: !image.id,
      action: handleShareOpen,
    },

    {
      icon: <Save />,
      name: "Salvar na Galeria",
      action: handleModalOpen,
      disabled: !image.imageUrl || image.id || !currentUser,
    },
    {
      icon: <Upload />,
      name: "Carregar Imagem",
      action: handleClick,
    },
  ];

  return (
    <>
      <Box sx={{ height: '100%', mt: 0.2, display: "flex" }}>
        {pending ? (
          <Box
            sx={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {pending === true && <CircularProgress align="center" />}
            {pending !== true && <Typography>{pending}</Typography>}
          </Box>
        ) : (
          <>
            <ActionsButton
              options={album ? albumNavOptions : actions}
              handleClick
            />
            <Pannellum
              width="100%"
              height="100%"
              image={image.imageUrl}
              // haov={180}
              // vaov={90}
              vOffset={1}
              pitch={0}
              yaw={100}
              // hfov={100}
              // maxHfov={120}
              // minHfov={80}
              autoLoad
              author={image.author && `${image.author}, ${image.createdAt}`}
              title={image.title}
              orientationOnByDefault={false}
              compass={false}
              draggable
              keyboardZoom
              mouseZoom
              preview=""
              previewAuthor=""
              previewTitle=""
              showControls
              showFullscreenCtrl
              showZoomCtrl
              hotspotDebug={false}
            ></Pannellum>
          </>
        )}
      </Box>

      <input
        type="file"
        ref={hiddenFileInput}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <DialogModal
        open={modalOpen}
        handleClose={handleModalClose}
        handleSubmit={handleSubmit}
        title="Salvar Imagem"
        text="Adicione esta foto a sua galeria."
        content={modalContent()}
      />

      <ShareModal
        open={shareOpen}
        handleClose={handleShareClose}
        handleSubmit={handleShareSubmit}
        image={image}
      />

      <SnackMessage pendingMessage={pendingMessage} />
    </>
  );
};

export default Viewer;
