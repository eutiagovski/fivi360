import { useParams } from "react-router-dom";
import { PublicImageViewer } from "@/components/public/PublicImageViewer";

export const PublicStandaloneImage = () => {
  const { imageId } = useParams();

  return (
    <PublicImageViewer
      imageId={imageId}
      accessMode="standalone"
      subtitle="Imagem compartilhada"
    />
  );
};
