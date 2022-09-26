import { useContext, useRef, useState, useEffect } from "react";

import { handleQueryAlbum } from "../../firebase.firestore";
import { handleQueryImage } from "../../firebase.firestore";

import { Pannellum } from "pannellum-react";

import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Collections,
  PanoramaPhotosphere,
  PermMedia,
  Upload,
} from "@mui/icons-material";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ActionsButton from "../../components/ActionsButton/ActionsButton";
import SnackMessage from "../../components/SnackMessage/SnackMessage";
import SaveButton from "../../components/SaveButton/SaveButton";
import ShareButton from "../../components/ShareButton/ShareButton";
import InfoButton from "../../components/InfoButton/InfoButton";
import UploadButton from "../../components/UploadButton/UploadButton";
import LoveButton from "../../components/LoveButton/LoveButton";
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
      icon: <LoveButton />,
      name: "Sobre",
    },
    {
      name: "Album",
      icon: <IconButton><PermMedia /></IconButton>,
      action: handleBackToAlbum,
    },
    {
      name: "Anterior",
      icon: <IconButton><ArrowBack /></IconButton>,
      action: handleNavBackward,
      disabled: navIndex === 0,
    },
    {
      name: "Próxima",
      icon: <IconButton><ArrowForward /></IconButton>,
      action: handleNavFoward,
      disabled: navIndex === albumItems.length - 1,
    },
    {
      icon: <InfoButton item={image} />,
      name: "Informações",
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
            user: result.user,
          });
          setPending(false);
        };
        xhr.open("GET", result.path);
        xhr.send();
      });
    }
  }, [image.id, pendingMessage]);

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

  // actions in the cta
  const actions = [
    {
      icon: <LoveButton />,
      name: "Sobre",
    },
    {
      icon: (
        <IconButton>
          <PermMedia />
        </IconButton>
      ),
      name: "Albums",
      action: () => navigate("/albums"),
      disabled: !currentUser,
    },
    {
      icon: (
        <IconButton>
          <Collections />
        </IconButton>
      ),
      name: "Galera",
      action: () => navigate("/imagens"),
      disabled: !currentUser,
    },
    {
      icon: <ShareButton />,
      name: "Compartilhar",
      disabled: !image.id || currentUser?.id !== image.user,
    },

    {
      icon: (
        <SaveButton
          item={image}
          setPendingMessage={setPendingMessage}
          setImage={setImage}
        />
      ),
      name: "Salvar",
      disabled: !image.imageUrl || image.id || !currentUser,
    },
    {
      icon: <InfoButton item={image} />,
      name: "Informações",
      disabled: !image.title,
    },
    {
      icon: (
        <IconButton>
          <PanoramaPhotosphere
            onClick={() => {
              navigate("/");
              setImage({});
            }}
          />
        </IconButton>
      ),
      name: "Início",
      disabled: !image.id
    },
    {
      icon: <UploadButton setImage={setImage}/>,
      name: "Carregar",
      disabled: image.id
    },
  ];

  return (
    <>
      <Box sx={{ height: "100%", mt: 0.2, display: "flex" }}>
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
              setImage={setImage}
              album={album}
            />
            <Pannellum
              width="100%"
              height="100%"
              image={image.imageUrl}
              vOffset={1}
              pitch={0}
              yaw={100}
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

      <SnackMessage
        pendingMessage={{ ...pendingMessage, handleClose: handleSnackClose }}
      />
    </>
  );
};

export default Viewer;
