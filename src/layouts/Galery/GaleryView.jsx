import IconButton from "@mui/material/IconButton";
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
  DeleteForever,
  MoreVert,
  PanoramaPhotosphere,
  Share,
} from "@mui/icons-material";
import { handleQueryUserAlbums } from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import ActionsButton from "../../components/ActionsButton/ActionsButton";

const GaleryView = () => {
  const [albums, setAlbums] = useState([]);
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
      albums.filter((image) => image.id === event.currentTarget.value)[0]
    );
  };
  const handleClose = () => {
    setAnchorEl(null);
    setMenuItem(null);
  };

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
      <Container maxWidth="xl">
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
                src={`${item.items[0].path}?w=124&fit=crop&auto=format`}
                srcSet={`${item.items[0].path}?w=124&fit=crop&auto=format&dpr=2 2x`}
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
                    {/* <IconButton
                      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                      aria-label={`info about ${item.title}`}
                      aria-controls={open ? "long-menu" : undefined}
                      aria-expanded={open ? "true" : undefined}
                      aria-haspopup="true"
                    >
                      <Share />
                    </IconButton>
                    <IconButton
                      sx={{ color: "rgba(255, 255, 255, 0.54)", mr: 1 }}
                      aria-label={`info about ${item.title}`}
                      aria-controls={open ? "long-menu" : undefined}
                      aria-expanded={open ? "true" : undefined}
                      aria-haspopup="true"
                    >
                      <DeleteForever />
                    </IconButton> */}
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
