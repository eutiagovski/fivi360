import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getImageById } from "@/services/images/imageService";
import { resolveLegacyShareImageRedirectPath } from "@/utils/publicAccess";

export const LegacyShareImageRedirect = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      if (!imageId) {
        navigate("/share/standalone/unknown", { replace: true });
        return;
      }

      try {
        const image = await getImageById(imageId);
        const targetPath = resolveLegacyShareImageRedirectPath(image);

        if (cancelled) {
          return;
        }

        navigate(targetPath ?? `/share/standalone/${imageId}`, {
          replace: true,
        });
      } catch {
        if (!cancelled) {
          navigate(`/share/standalone/${imageId}`, { replace: true });
        }
      }
    }

    redirect();

    return () => {
      cancelled = true;
    };
  }, [imageId, navigate]);

  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 fade-in"
      data-testid="legacy-share-image-redirect"
    >
      <Loader2 size={32} className="animate-spin text-zinc-400" />
      <p className="text-sm text-zinc-400">Redirecionando...</p>
    </div>
  );
};
