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
import {
  Collections,
  Logout,
  PanoramaPhotosphere,
  PermMedia,
  PhotoLibrary,
} from "@mui/icons-material";
import { handleSignIn, handleSignOut } from "../../firebase.auth";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoveButton from "../LoveButton/LoveButton";

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { dispatch, currentUser } = useContext(AuthContext);

  const handleGoogleSignIn = async () => {
    const user = await handleSignIn();
    if (user) {
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

  const actions = [
    // { label: "Coheça o Projeto", icon: <LoveButton /> },
    { label: "Sair", icon: <Logout />, onClick: () => handleGoogleLogout() },
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
      <Container maxWidth="xxl">
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
                        handleCloseUserMenu();
                        page.onClick();
                      }}
                    >
                      <Box
                        mr={1}
                        spacing={1}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          // justifyContent: "space-between",
                          width: " 100%",
                        }}
                      >
                        {page.icon}
                        <Typography textAlign="center" ml={2}>
                          {page.label}
                        </Typography>
                      </Box>
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
