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
  DeleteForever,
  MoreVert,
  Share,
} from "@mui/icons-material";
import {
  handleQueryUserAlbums,
} from "../../firebase.firestore";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

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
              cursor: "pointer",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            ALBUMS
          </Typography>
          <Box>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
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
          sx={{ width: "100%", height: { xs: "71vh", md: "74vh", xl: "80vh" } }}
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
                title={<>
                  <Box sx={{cursor:'pointer'}} onClick={() => navigate(`/album?album=${item.id}`)}>{item.title}</Box>
                </>}
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
      </Container>
    </>
  );
};

export default GaleryView;
