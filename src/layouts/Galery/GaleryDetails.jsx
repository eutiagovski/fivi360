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
  DeleteForever,
  MoreVert,
  PanoramaPhotosphere,
  Share,
} from "@mui/icons-material";

import { handleQueryAlbum } from "../../firebase.firestore";

import CircularProgress from "@mui/material/CircularProgress";
import ShareModal from "../../components/ShareModal/ShareModal";

import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";

import queryString from "query-string";

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

  const matches = useMediaQuery("(min-width:600px)");
  return (
    <>
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
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            ALBUM
          </Typography>
          <Box>
            <IconButton
              disabled={pending || currentUser?.id !== albumDetails.user}
            >
              <Add />
            </IconButton>
            <IconButton
              disabled={pending || currentUser?.id !== albumDetails.user}
              onClick={handleShareOpen}
            >
              <Share />
            </IconButton>
            <IconButton
              disabled={pending || currentUser?.id !== albumDetails.user}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItens: "center",
            width: "100%",
            mt: 1,
          }}
        ></Box>
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
              fontWeight: 500,
              // letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            {albumDetails.title}
          </Typography>
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
            {pending === true ? (
              <CircularProgress align="center" />
            ) : (
              <Typography>{pending}</Typography>
            )}
          </Box>
        )}
        <ImageList
          sx={{ width: "100%", height: { xs: "75vh", md: "74vh", xl: "80vh" } }}
        >
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
                      onClick={() => navigate(`/?image=${item.id}`)}
                    >
                      {item.title}
                    </Box>
                  </>
                }
                subtitle={item.createdAt}
                actionIcon={
                  <>
                    <IconButton
                      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                      onClick={() => navigate(`/?image=${item.id}`)}
                      disabled={
                        pending || currentUser?.id !== albumDetails.user
                      }
                    >
                      <PanoramaPhotosphere />
                    </IconButton>
                    <IconButton
                      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                      disabled={
                        pending || currentUser?.id !== albumDetails.user
                      }
                    >
                      <DeleteForever />
                    </IconButton>
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
      </Container>
    </>
  );
};

export default GaleryDetails;
