import "./App.css";

import Navbar from "./components/Navbar/Navbar";

import { Box, CssBaseline, Toolbar, Typography } from "@mui/material";
import { Route, Routes } from "react-router-dom";

import Galery from "./layouts/Galery/Galery";
import Viewer from "./layouts/Viewer/Viewer";
import ImagesView from "./layouts/Images/ImagesView";
import GaleryView from "./layouts/Galery/GaleryView";
import GaleryDetails from "./layouts/Galery/GaleryDetails";

function App() {
  return (
    <Box
    >
      <CssBaseline />
      <Navbar />
      <Toolbar />
      <Box sx={window.innerHeight <= 700 ? {height: '91vh'} : {height: '92.5vh'}}>
        <Routes>
          <Route path="*" element={<Viewer />} />
          <Route path="imagens" element={<ImagesView />} />
          <Route path="albums" element={<GaleryView />} />
          <Route path="album" element={<GaleryDetails />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
