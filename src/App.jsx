import "./App.css";

import Navbar from "./components/Navbar/Navbar";

import { Box, CssBaseline, Toolbar, Typography } from "@mui/material";
import { Route, Routes } from "react-router-dom";

import Galery from "./layouts/Galery/Galery";
import Viewer from "./layouts/Viewer/Viewer";
import ImagesView from "./layouts/Images/ImagesView";

function App() {
  console.log(window.innerHeight)
  return (
    <Box
    >
      <CssBaseline />
      <Navbar />
      <Toolbar />
      <Box sx={window.innerHeight <= 700 ? {height: '91vh'} : {height: '92.5vh'}}>
        <Routes>
          <Route path="*" element={<Viewer />} />
          <Route path="ver" element={<Viewer />} />
          <Route path="galeria" element={<Galery />} />
          <Route path="imagens" element={<ImagesView />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
