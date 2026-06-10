import { useParams } from "react-router-dom";
import { PublicImageViewer } from "@/components/public/PublicImageViewer";

export const PublicPortfolioImage = () => {
  const { slug, projectId, imageId } = useParams();

  return (
    <PublicImageViewer
      imageId={imageId}
      accessMode="portfolio"
      expectedProjectId={projectId}
      portfolioSlug={slug}
      backHref={`/u/${slug}/project/${projectId}`}
      backLabel="Voltar ao projeto"
      imageNavBasePath={`/u/${slug}/project/${projectId}/image`}
      buildImagePath={(targetImageId) =>
        `/u/${slug}/project/${projectId}/image/${targetImageId}`
      }
    />
  );
};
