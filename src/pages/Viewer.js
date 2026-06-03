import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { PanoramaViewer } from "@/components/viewer/PanoramaViewer";
import { ViewerNavControls } from "@/components/viewer/ViewerNavControls";
import { HotspotFormDialog } from "@/components/viewer/HotspotFormDialog";
import { HotspotInfoDialog } from "@/components/viewer/HotspotInfoDialog";
import { HotspotManagerPanel } from "@/components/viewer/HotspotManagerPanel";
import { useViewerImage } from "@/hooks/useViewerImage";
import { useHotspots } from "@/hooks/useHotspots";
import { useAuth } from "@/hooks/useAuth";
import { PremiumFeatureModal } from "@/components/plans/PremiumFeatureModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useToast } from "@/hooks/use-toast";
import { isPlanLimitError } from "@/services/plans/planService";
import {
  HOTSPOT_TYPE_SCENE,
  createHotspot,
  createSceneHotspot,
  deleteHotspot,
  updateHotspot,
  updateSceneHotspot,
} from "@/services/hotspots/hotspotService";

const ERROR_MESSAGES = {
  not_found: "Imagem não encontrada.",
  unauthorized: "Acesso não autorizado.",
  load_failed: "Não foi possível carregar o panorama.",
};

const HEADER_BUTTON =
  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors";
const HEADER_BUTTON_ACTIVE =
  "bg-white text-black border-white hover:bg-zinc-200";
const HEADER_BUTTON_IDLE =
  "bg-black/60 backdrop-blur-xl border-white/10 text-white hover:bg-black/80";

export const Viewer = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { hotspotsEnabled, loading: planLoading } = usePlanLimits();
  const {
    image,
    project,
    projectImages,
    previousImage,
    nextImage,
    loading,
    error,
  } = useViewerImage(imageId);
  const { hotspots, loading: hotspotsLoading, refresh: refreshHotspots } =
    useHotspots(imageId);

  const [manageMode, setManageMode] = useState(false);
  const [placingMode, setPlacingMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [infoHotspot, setInfoHotspot] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const panoramaUrl = image?.originalUrl || image?.previewUrl || "";
  const backHref = image?.projectId
    ? `/projects/${image.projectId}`
    : "/images";

  const resetFormState = useCallback(() => {
    setFormOpen(false);
    setFormError("");
    setPendingCoords(null);
    setEditingHotspot(null);
    setPlacingMode(false);
  }, []);

  useEffect(() => {
    setManageMode(false);
    setPlacingMode(false);
    setPendingCoords(null);
    setFormOpen(false);
    setEditingHotspot(null);
    setDeleteTarget(null);
    setInfoHotspot(null);
  }, [imageId]);

  const handleToggleManage = () => {
    if (!hotspotsEnabled) {
      setPremiumModalOpen(true);
      return;
    }

    setManageMode((prev) => {
      const next = !prev;
      if (!next) {
        setPlacingMode(false);
        setPendingCoords(null);
        setFormOpen(false);
        setDeleteTarget(null);
      }
      return next;
    });
  };

  const handleStartPlacing = () => {
    if (!hotspotsEnabled) {
      setPremiumModalOpen(true);
      return;
    }

    setPlacingMode(true);
    setPendingCoords(null);
    setEditingHotspot(null);
    setFormMode("create");
    setFormOpen(false);
  };

  const handleCancelPlacing = () => {
    setPlacingMode(false);
    setPendingCoords(null);
  };

  const handlePlacementClick = useCallback((coords) => {
    setPendingCoords(coords);
    setFormMode("create");
    setEditingHotspot(null);
    setFormError("");
    setFormOpen(true);
    setPlacingMode(false);
  }, []);

  const handleEditHotspot = (hotspot) => {
    setEditingHotspot(hotspot);
    setFormMode("edit");
    setFormError("");
    setFormOpen(true);
    setPlacingMode(false);
  };

  const getSceneHotspotLabel = useCallback(
    (hotspot) => {
      const destination = projectImages.find(
        (img) => img.id === hotspot.targetImageId,
      );
      return destination?.title
        ? `Ir para ${destination.title}`
        : "Ir para";
    },
    [projectImages],
  );

  const handleSceneHotspotClick = useCallback(
    (hotspot) => {
      if (hotspot.targetImageId) {
        navigate(`/viewer/${hotspot.targetImageId}`);
      }
    },
    [navigate],
  );

  const handleFormSubmit = async (formData) => {
    if (!user?.uid || !image) {
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      if (formMode === "edit" && editingHotspot) {
        if (editingHotspot.type === HOTSPOT_TYPE_SCENE) {
          await updateSceneHotspot(editingHotspot.id, {
            imageId: image.id,
            userId: user.uid,
            projectId: image.projectId ?? "",
            targetImageId: formData.targetImageId,
          });
        } else {
          await updateHotspot(editingHotspot.id, {
            imageId: image.id,
            userId: user.uid,
            title: formData.title,
            description: formData.description,
          });
        }
        toast({
          title: "Hotspot atualizado",
          description: "As alterações foram salvas.",
        });
      } else {
        if (!pendingCoords) {
          throw new Error("Posição do hotspot não definida.");
        }

        if (formData.type === HOTSPOT_TYPE_SCENE) {
          await createSceneHotspot({
            imageId: image.id,
            userId: user.uid,
            projectId: image.projectId ?? "",
            pitch: pendingCoords.pitch,
            yaw: pendingCoords.yaw,
            targetImageId: formData.targetImageId,
          });
        } else {
          await createHotspot({
            imageId: image.id,
            userId: user.uid,
            projectId: image.projectId ?? "",
            pitch: pendingCoords.pitch,
            yaw: pendingCoords.yaw,
            title: formData.title,
            description: formData.description,
          });
        }
        toast({
          title: "Hotspot criado",
          description: "O marcador foi adicionado ao panorama.",
        });
      }

      await refreshHotspots();
      resetFormState();
    } catch (err) {
      if (isPlanLimitError(err)) {
        toast({
          variant: "destructive",
          title: "Limite do plano",
          description: err.message,
        });
        resetFormState();
      } else {
        setFormError(
          err instanceof Error
            ? err.message
            : "Não foi possível salvar o hotspot.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !user?.uid || !image) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteHotspot(deleteTarget.id, image.id, user.uid);
      await refreshHotspots();
      toast({
        title: "Hotspot excluído",
        description: "O marcador foi removido da imagem.",
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível excluir o hotspot.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 fade-in"
        data-testid="viewer-loading"
      >
        <Loader2 size={32} className="animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-400">Carregando panorama...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-6 fade-in"
        data-testid="viewer-error"
      >
        <p className="text-lg text-white text-center">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.load_failed}
        </p>
        <Link
          to={backHref}
          className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div
      className="h-screen flex flex-col bg-[#050505] fade-in overflow-hidden"
      data-testid="viewer-page"
    >
      <header className="flex-shrink-0 z-50 p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <Link
            to={backHref}
            data-testid="back-to-project"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:bg-black/80 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </Link>

          <div className="min-w-0 flex-1 order-3 sm:order-none w-full sm:w-auto basis-full sm:basis-auto">
            <p
              className="text-sm text-zinc-400 truncate"
              data-testid="viewer-project-name"
            >
              {project?.title || "Projeto"}
            </p>
            <h1
              className="text-lg md:text-xl font-light text-white truncate"
              data-testid="image-name"
            >
              {image?.title || "Sem título"}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleToggleManage}
            disabled={planLoading}
            data-testid="manage-hotspots-btn"
            className={`${HEADER_BUTTON} ${
              manageMode ? HEADER_BUTTON_ACTIVE : HEADER_BUTTON_IDLE
            }`}
          >
            <MapPin size={18} />
            <span className="hidden sm:inline">
              {manageMode ? "Fechar gestão" : "Gerenciar hotspots"}
            </span>
            <span className="sm:hidden">{manageMode ? "Fechar" : "Hotspots"}</span>
          </button>

          <ViewerNavControls
            previousImage={previousImage}
            nextImage={nextImage}
          />
        </div>
      </header>

      <div
        className="flex-1 min-h-0 relative"
        data-testid="viewer-container"
      >
        {panoramaUrl ? (
          <PanoramaViewer
            panoramaUrl={panoramaUrl}
            className="absolute inset-0"
            hotspots={hotspots}
            placementMode={placingMode}
            onPlacementClick={handlePlacementClick}
            onInfoHotspotClick={setInfoHotspot}
            onSceneHotspotClick={handleSceneHotspotClick}
            getSceneHotspotLabel={getSceneHotspotLabel}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-400">URL do panorama indisponível.</p>
          </div>
        )}

        {manageMode && (
          <HotspotManagerPanel
            hotspots={hotspots}
            loading={hotspotsLoading}
            projectImages={projectImages}
            placingMode={placingMode}
            onStartPlacing={handleStartPlacing}
            onCancelPlacing={handleCancelPlacing}
            onEditHotspot={handleEditHotspot}
            onDeleteHotspot={setDeleteTarget}
            deleteTarget={deleteTarget}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </div>

      <HotspotFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) {
            resetFormState();
          } else {
            setFormOpen(open);
          }
        }}
        mode={formMode}
        initialType={editingHotspot?.type}
        initialTitle={editingHotspot?.type !== HOTSPOT_TYPE_SCENE ? editingHotspot?.title ?? "" : ""}
        initialDescription={
          editingHotspot?.type !== HOTSPOT_TYPE_SCENE
            ? editingHotspot?.description ?? ""
            : ""
        }
        initialTargetImageId={
          editingHotspot?.type === HOTSPOT_TYPE_SCENE
            ? editingHotspot.targetImageId
            : ""
        }
        currentImageId={image?.id ?? ""}
        projectImages={projectImages}
        isSaving={isSaving}
        error={formError}
        onSubmit={handleFormSubmit}
      />

      <HotspotInfoDialog
        hotspot={infoHotspot}
        open={Boolean(infoHotspot)}
        onOpenChange={(open) => {
          if (!open) {
            setInfoHotspot(null);
          }
        }}
      />

      <PremiumFeatureModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        feature="hotspots"
      />
    </div>
    </TooltipProvider>
  );
};
