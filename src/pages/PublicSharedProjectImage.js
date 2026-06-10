import { useParams } from "react-router-dom";
import { PublicImageViewer } from "@/components/public/PublicImageViewer";

export const PublicSharedProjectImage = () => {
  const { projectId, imageId } = useParams();

  return (
    <PublicImageViewer
      imageId={imageId}
      accessMode="shared-project"
      expectedProjectId={projectId}
      backHref={`/share/project/${projectId}`}
      backLabel="Voltar ao projeto"
      imageNavBasePath={`/share/project/${projectId}/image`}
      buildImagePath={(targetImageId) =>
        `/share/project/${projectId}/image/${targetImageId}`
      }
    />
  );
};
