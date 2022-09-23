import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import AdbIcon from "@mui/icons-material/Adb";
import { PanoramaPhotosphere } from "@mui/icons-material";
import { handleSignIn, handleSignOut } from "../../firebase.auth";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { dispatch, currentUser } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    const user = await handleSignIn();
    if (user) {
      console.log(user);
      dispatch({
        type: "LOGGIN",
        payload: {
          name: user.displayName,
          picture: user.photoURL,
          email: user.email,
          id: user.uid,
        },
      });
    }
  };

  const handleGoogleLogout = async () => {
    const response = await handleSignOut();

    dispatch({
      type: "LOGOUT",
    });
  };

  const navigate = useNavigate();

  const pages = ["Perfil", "Galeria", "Sair"];
  const actions = [
    { label: "Imagens", icon: "", action: () => navigate("galeria") },
    { label: "Sair", icon: "", action: () => handleGoogleLogout() },
  ];

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PanoramaPhotosphere
                sx={{ display: { xs: "none", md: "flex" }, mr: 2 }}
              />

              <Typography
                variant="h6"
                noWrap
                component="a"
                // href="/"
                onClick={() => navigate("/")}
                sx={{
                  mr: 2,
                  display: { xs: "none", md: "flex" },
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  color: "inherit",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Future Image Viewer 360
              </Typography>

              <PanoramaPhotosphere
                sx={{ display: { xs: "flex", md: "none" }, mr: 2 }}
              />
              <Typography
                variant="h5"
                noWrap
                component="a"
                // href="/"
                onClick={() => navigate("/")}
                sx={{
                  mr: 2,
                  display: { xs: "flex", md: "none" },
                  flexGrow: 1,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  color: "inherit",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                FIVI 360
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              {/* <Box sx={{ flexGrow: 0, display: { xs: "none", md: "flex" } }}>
                {currentUser?.name ? (
                  <>
                    {actions.map((page) => (
                      <Button
                        key={page.label}
                        onClick={() => {
                          handleCloseNavMenu();
                          page.action();
                        }}
                        sx={{ my: 2, color: "white", display: "block" }}
                      >
                        {page.label}
                      </Button>
                    ))}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleGoogleSignIn}
                      sx={{ my: 2, color: "white", display: "block" }}
                    >
                      Entrar
                    </Button>
                  </>
                )}
              </Box> */}

              {/* <Box sx={{ flexGrow: 0, display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="small"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{
                    display: { xs: "block", md: "none" },
                  }}
                >
                  {currentUser?.name ? (
                    <>
                      {actions.map((page) => (
                        <MenuItem
                          key={page.label}
                          onClick={() => {
                            handleCloseNavMenu();
                            page.action();
                          }}
                        >
                          <Typography textAlign="center">
                            {page.label}
                          </Typography>
                        </MenuItem>
                      ))}
                    </>
                  ) : (
                    <>
                      <MenuItem onClick={handleGoogleSignIn}>
                        <Typography textAlign="center">
                          Entrar no App
                        </Typography>
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </Box> */}
              <Box sx={{ flexGrow: 0 }}>
                {currentUser ? (
                  <>
                    <Tooltip title="Open settings">
                      <IconButton
                        onClick={
                          currentUser ? handleOpenUserMenu : handleGoogleSignIn
                        }
                        sx={{ p: 0 }}
                      >
                        <Avatar
                          alt={currentUser?.name}
                          src={currentUser?.picture}
                        />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleGoogleSignIn}
                      sx={{ color: "white", display: "block" }}
                    >
                      Entrar
                    </Button>
                  </>
                )}

                <Menu
                  sx={{ mt: "45px" }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {actions.map((page) => (
                    <MenuItem
                      key={page.label}
                      onClick={() => {
                        handleCloseNavMenu();
                        page.action();
                      }}
                    >
                      <Typography textAlign="center">{page.label}</Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
export default Navbar;
