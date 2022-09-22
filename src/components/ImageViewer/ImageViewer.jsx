import React, { useState } from "react";
import { Pannellum } from "pannellum-react";

const ImageViewer = ({ image }) => {
  return (
    <Pannellum
      width="100%"
      height="100%"
      image={image}
      pitch={10}
      yaw={180}
      hfov={110}
      autoLoad
      showZoomCtrl={false}
    >
      {/* <Pannellum.Hotspot
        type="custom"
        pitch={12.41}
        yaw={117.76}
        handleClick={(evt, name) => console.log(name)}
        name="image info"
      /> */}
    </Pannellum>
  );
};

export default ImageViewer;
