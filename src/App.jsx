import "./App.css";

import Navbar from "./components/Navbar/Navbar";

import { Box, CssBaseline, Toolbar } from "@mui/material";
import { Route, Routes } from "react-router-dom";

import Viewer from "./layouts/Viewer/Viewer";
import ImagesView from "./layouts/Images/ImagesView";
import GaleryView from "./layouts/Galery/GaleryView";
import GaleryDetails from "./layouts/Galery/GaleryDetails";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { currentUser } = useContext(AuthContext);
  return (
    <Box sx={{ height: "100vh" }}>
      <CssBaseline />
      <Navbar />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          pt: { xs: 7, md: 8 },
        }}
        
      >
        <Routes>
          <Route path="*" element={<Viewer />} />
          <Route path="album" element={<GaleryDetails />} />
          {currentUser && (
            <>
              <Route path="imagens" element={<ImagesView />} />
              <Route path="albums" element={<GaleryView />} />
            </>
          )}
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
