import {
  Box,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  useMediaQuery,
  Container,
  IconButton,
} from "@mui/material";

import {
  Collections,
  PanoramaPhotosphere,
  PermMedia,
  Share,
} from "@mui/icons-material";

import { handleQueryAlbum } from "../../firebase.firestore";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

import queryString from "query-string";
import DeleteButton from "../../components/DeleteButton/DeleteButton";
import ActionsButton from "../../components/ActionsButton/ActionsButton";
import EditButton from "../../components/EditButton/EditButton";
import SnackMessage from "../../components/SnackMessage/SnackMessage";
import LoadingBox from "../../components/LoadingBox/LoadingBox";
import ShareButton from "../../components/ShareButton/ShareButton";
import InfoButton from "../../components/InfoButton/InfoButton";

const GaleryDetails = () => {
  var { album } = queryString.parse(window.location.search);
  const [albumDetails, setAlbumDetails] = useState({});
  const { currentUser } = useContext(AuthContext);
  const [pending, setPending] = useState(true);
  const navigate = useNavigate();

  const [openShare, setOpenShare] = useState(false);
  const handleShareOpen = () => setOpenShare(true);
  const handleShareClose = () => setOpenShare(false);

  // section to handle snackbar messages
  const [pendingMessage, setPendingMessage] = useState({
    open: false,
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
    handleQueryAlbum(album).then((album) => {
      if (!album.items) return setPending("Este album não existe.");
      setAlbumDetails(album);
      setPending(album.items.length >= 1 ? false : "Nenhum item a ser exibido");
    });
  }, [pendingMessage]);

  const matches = useMediaQuery("(min-width:600px)");

  const pageOptions = [
    {
      icon: <IconButton><PermMedia /></IconButton>,
      name: "Ir para Albums",
      action: () => navigate("/albums"),
      disabled: !currentUser || currentUser?.id !== albumDetails.user,
    },
    {
      icon: <IconButton><Collections /></IconButton>,
      name: "Ir para Galera",
      action: () => navigate("/imagens"),
      disabled: !currentUser || currentUser?.id !== albumDetails.user,
    },
    {
      icon: (
        <DeleteButton
          item={albumDetails}
          setPendingMessage={setPendingMessage}
        />
      ),
      name: "Deletar Álbum",
      disabled: !currentUser || currentUser?.id !== albumDetails.user,
    },
    {
      icon: <ShareButton />,
      name: "Compartilhar Álbum",
      disabled: !currentUser || currentUser?.id !== albumDetails.user,
    },
    {
      icon: (
        <EditButton item={albumDetails} setPendingMessage={setPendingMessage} />
      ),
      name: "Editar Álbum",
      disabled: !currentUser || currentUser?.id !== albumDetails.user,
    },
    {
      icon: (
        <InfoButton item={albumDetails} />
      ),
      name: "Informações do Álbum",
    },
    {
      icon: (
        <IconButton>
          <PanoramaPhotosphere />
        </IconButton>
      ),
      name: "Início",
      action: () => navigate("/"),
    },
  ];

  return (
    <>
      <Container maxWidth="xxl">
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
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          ALBUM
        </Typography>
        <Typography
          variant="h6"
          noWrap
          component="a"
          sx={{
            mr: 2,
            display: "flex",
            fontFamily: "monospace",
            fontWeight: 500,
            // letterSpacing: ".3rem",
            color: "inherit",
            textDecoration: "none",
            cursor: "pointer",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {albumDetails.title}
        </Typography>

        <LoadingBox pending={pending} />
        <ImageList sx={{ width: "100%", height: "72vh" }}>
          {albumDetails.items?.map((item) => (
            <ImageListItem key={item.path} cols={matches ? 1 : 4} gap={18}>
              <img
                src={`${item.path}?w=124&fit=crop&auto=format`}
                srcSet={`${item.path}?w=124&fit=crop&auto=format&dpr=2 2x`}
                alt={item.title}
                // loading="lazy"
              />
              <ImageListItemBar
                title={
                  <>
                    <Box
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        navigate(`/?image=${item.id}&album=${albumDetails.id}`)
                      }
                    >
                      {item.title}
                    </Box>
                  </>
                }
                subtitle={item.createdAt}
                actionIcon={
                  <>
                    {currentUser?.id === albumDetails.user && (
                      <>
                      <InfoButton item={item} />
                        <EditButton
                          item={{ album: albumDetails.id, item: item }}
                          setPendingMessage={setPendingMessage}
                        />
                        <DeleteButton
                          item={{ album: albumDetails.id, item: item }}
                          setPendingMessage={setPendingMessage}
                        />
                      </>
                    )}
                  </>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
        <ActionsButton options={pageOptions} invertColor />
        <SnackMessage
          pendingMessage={{ ...pendingMessage, handleClose: handleSnackClose }}
        />
      </Container>
    </>
  );
};

export default GaleryDetails;
