import "./App.css";
import ImageViewer from "./components/ImageViewer/ImageViewer";
import BasicSpeedDial from "./components/BasicSpeedDial/BasicSpeedDial";
import Navbar from "./components/Navbar/Navbar";
import { Box } from "@mui/material";
import { useState } from "react";

function App() {
  const [image, setImage] = useState();

  return (
    <Box sx={{ height: "100vh" }}>
      <Navbar />
      <ImageViewer image={image}/>
      <BasicSpeedDial setImage={setImage}/>
    </Box>
  );
}

export default App;
