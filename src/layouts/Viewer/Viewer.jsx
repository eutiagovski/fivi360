import { useContext, useRef, useState, useEffect } from "react";

import { handleAddDoc } from "../../firebase.firestore";
import storage from "../../firebase.storage";
import { handleQueryImage } from "../../firebase.firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { Pannellum } from "pannellum-react";

import { Box, CircularProgress, TextField, Typography } from "@mui/material";
import {
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Backdrop,
} from "@mui/material";
import { Cached, Collections, Save, Share, Upload } from "@mui/icons-material";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DialogModal from "../../components/DialogModal/DialogModal";
import ShareModal from "../../components/ShareModal/ShareModal";
const queryString = require("query-string");

const Viewer = () => {
  const [errorMessage, setErrorMessage] = useState(false);
  var { image } = queryString.parse(window.location.search);
  var [image, setImage] = useState({ loadImage: image });
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [pending, setPending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (image.loadImage) {
      setPending(true);
      handleQueryImage(image.loadImage).then((result) => {
        if (result.share || result.user === currentUser?.id) {
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
              share: result.share
            });
            setPending(false);
          };
          xhr.open("GET", result.path);
          xhr.send();
        } else {
          setPending("Desculpe, essa imagem não pode ser exibida.");
        }
      });
    }
  }, [shareOpen]);

  // call to action button
  const BasicSpeedDial = () => {
    const { currentUser } = useContext(AuthContext);

    // section to handle the cta button
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // handle image file input
    const hiddenFileInput = useRef(null);
    const handleClick = (event) => {
      hiddenFileInput.current.click();
    };
    const handleChange = (event) => {
      const fileUploaded = event.target.files[0];
      var file = URL.createObjectURL(fileUploaded);
      setImage({ ...image, imageUrl: file, imageFile: fileUploaded });
    };

    // section to handle save image to galery
    const [modalOpen, setModalOpen] = useState(false);
    const handleModalClose = () => setModalOpen(false);
    const handleModalOpen = () => setModalOpen(true);
    const [imageTitle, setImageTitle] = useState(new Date().toISOString());

    const handleSubmit = () => {
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
            title:
              imageTitle.length >= 1 ? imageTitle : new Date().toISOString(),
            imageRef: snapshot.metadata.fullPath,
          };

          handleAddDoc(values).then((resp) =>
            setImage({ ...image, id: resp, title: imageTitle })
          );
        });
      });
      setImageTitle("");
      setModalOpen(false);
    };

    const modalContent = () => {
      const inputs = [
        { label: "Título da imagem", type: "text", name: "title" },
      ];
      return (
        <>
          {inputs.map((input) => (
            <TextField
              autoFocus
              margin="dense"
              id="title"
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
    const handleShareOpen = () => {setShareOpen(true)};
    const handleShareSubmit = () => {};

   

    // actions in the cta
    const actions = [
      {
        icon: <Collections />,
        name: "Ir para Galera",
        onClick: () => navigate("imagens"),
      },
      {
        icon: <Share color={image.share ? 'success' : 'inherit'}/>,
        name: "Compartilhar Imagem",
        disabled: !image.id,
        onClick: handleShareOpen,
      },

      {
        icon: <Save />,
        name: "Salvar na Galeria",
        onClick: handleModalOpen,
        disabled: !image.imageUrl || image.id,
      },
      {
        icon: <Upload />,
        name: "Carregar Imagem",
        onClick:handleClick
      },
    ];

    return (
      <>
        <Backdrop open={open} />
        <SpeedDial
          ariaLabel="SpeedDial tooltip example"
          sx={{ position: "absolute", bottom: 16, right: 16, color: "#000" }}
          icon={<SpeedDialIcon />}
          onClose={handleClose}
          // onClick={
          //   !image.imageUrl ? handleClick : currentUser ? null : handleClick
          // }
          onOpen={handleOpen}
          open={open}
          FabProps={{
            sx: {
              bgcolor: "#000",
              "&:hover": {
                bgcolor: "#111",
              },
              color: "#FFF",
            },
          }}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              disabled={action.disabled}
            />
          ))}
        </SpeedDial>

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
      </>
    );
  };

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
            {pending != true && <Typography>{pending}</Typography>}
          </Box>
        ) : (
          <>
            <BasicSpeedDial />
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
    </>
  );
};

export default Viewer;
