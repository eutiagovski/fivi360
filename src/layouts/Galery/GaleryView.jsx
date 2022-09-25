import { useEffect, useState, useContext } from "react";
import {
  Box,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  useMediaQuery,
  Container,
} from "@mui/material";
import {
  Collections,
  PanoramaPhotosphere,
} from "@mui/icons-material";
import { handleQueryUserAlbums } from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import ActionsButton from "../../components/ActionsButton/ActionsButton";

const GaleryView = () => {
  const [albums, setAlbums] = useState([]);
  const { currentUser } = useContext(AuthContext);

  const [pending, setPending] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const navigate = useNavigate();

  

  useEffect(() => {
    handleQueryUserAlbums(currentUser.id).then((images) => {
      setAlbums(images);
      setPending(images.length >= 1 ? false : "Nenhum item a ser exibido");
    });
  }, [shareOpen]);

  const matches = useMediaQuery("(min-width:600px)");

  const pageOptions = [
    {
      icon: <Collections />,
      name: "Galera",
      action: () => navigate("/imagens"),
    },
    {
      icon: <PanoramaPhotosphere />,
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
            p:1,
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
          ALBUMS
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
        <ImageList
          sx={{ width: "100%", height: '75vh' }}
        >
          {albums.map((item) => (
            <ImageListItem key={item.path} cols={matches ? 1 : 4} gap={18}>
              <img
                src={`${item.items[0]?.path}?w=124&fit=crop&auto=format`}
                srcSet={`${item.items[0]?.path}?w=124&fit=crop&auto=format&dpr=2 2x`}
                alt={item.title}
                // loading="lazy"
              />
              <ImageListItemBar
                title={
                  <>
                    <Box
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/album?album=${item.id}`)}
                    >
                      {item.title}
                    </Box>
                  </>
                }
                subtitle={item.createdAt}
                actionIcon={
                  <>
                    
                  </>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
        <ActionsButton options={pageOptions} invertColor />
      </Container>
    </>
  );
};

export default GaleryView;
