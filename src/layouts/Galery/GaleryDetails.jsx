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
  Add,
  Collections,
  DeleteForever,
  Edit,
  MoreVert,
  PanoramaPhotosphere,
  PermMedia,
  Share,
} from "@mui/icons-material";

import { handleQueryAlbum } from "../../firebase.firestore";

import CircularProgress from "@mui/material/CircularProgress";
import ShareModal from "../../components/ShareModal/ShareModal";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

import queryString from "query-string";
import DeleteButton from "../../components/DeleteButton/DeleteButton";
import ActionsButton from "../../components/ActionsButton/ActionsButton";

const GaleryDetails = () => {
  const [albumDetails, setAlbumDetails] = useState({});
  const [pending, setPending] = useState(true);
  const navigate = useNavigate();
  var { album } = queryString.parse(window.location.search);
  const { currentUser } = useContext(AuthContext);

  const [openShare, setOpenShare] = useState(false);
  const handleShareOpen = () => setOpenShare(true);
  const handleShareClose = () => setOpenShare(false);

  useEffect(() => {
    handleQueryAlbum(album).then((album) => {
      setAlbumDetails(album);
      setPending(album.items.length >= 1 ? false : "Nenhum item a ser exibido");
      // if (album.user === currentUser?.id || album.share) {
      // } else {
      //   setPending("Este album não está disponível.");
      // }
    });
  }, []);

  // section to handle

  const matches = useMediaQuery("(min-width:600px)");

  const pageOptions = [
    {
      icon: <PermMedia />,
      name: "Ir para Albums",
      action: () => navigate("/albums"),
      disabled: !currentUser,
    },
    {
      icon: <Collections />,
      name: "Ir para Galera",
      action: () => navigate("/imagens"),
      disabled: !currentUser,
    },
    {
      icon: <DeleteForever />,
      name: "Deletar Álbum",
    },
    {
      icon: <Share />,
      name: "Compartilhar Álbum",
      action: handleShareOpen,
      disabled: !currentUser || currentUser?.id === albumDetails.id,
    },
    {
      icon: <Edit />,
      name: "Editar Álbum",
    },
    {
      icon: <PanoramaPhotosphere />,
      name: "Início",
      action: () => navigate("/"),
    },
  ];

  return (
    <>
      <Container maxWidth="xl">
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
            {pending === true ? (
              <CircularProgress align="center" />
            ) : (
              <Typography>{pending}</Typography>
            )}
          </Box>
        )}
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
                    {currentUser?.id === albumDetails.user && <DeleteButton />}
                  </>
                }
              />
            </ImageListItem>
          ))}
          <ShareModal
            open={openShare}
            image={albumDetails}
            handleClose={handleShareClose}
          />
        </ImageList>
        <ActionsButton options={pageOptions} invertColor />
      </Container>
    </>
  );
};

export default GaleryDetails;
