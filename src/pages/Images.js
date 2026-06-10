import { useRef, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { PageActionHeader } from "@/components/common/PageActionHeader";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { ImageCard } from "@/components/common/ImageCard";
import { UploadImageDialog } from "@/components/images/UploadImageDialog";
import { EditImageDialog } from "@/components/images/EditImageDialog";
import { ShareImageDialog } from "@/components/images/ShareImageDialog";
import { MoveImageToProjectDialog } from "@/components/images/MoveImageToProjectDialog";
import { deleteImage } from "@/services/images/imageService";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useLooseImagesPage } from "@/hooks/useLooseImagesPage";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";
import { IMAGE_ACCEPT } from "@/utils/imageConstants";
import { validateImageFile } from "@/utils/imageValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  APP_MODAL_FOOTER_CLASSES,
  appAlertContentClassName,
} from "@/components/common/AppModal";
import { toast } from "@/hooks/use-toast";
import { showImageUploadBlockedToast } from "@/utils/planToast";

export const Images = () => {
  const { user } = useAuth();
  const { canUploadImage, limits, usage, refreshUsage, applyUsageDelta } =
    usePlanLimits();
  const {
    cardImages,
    images,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    loadMore,
    addImage,
    updateImage,
    removeImage,
  } = useLooseImagesPage();
  const sentinelRef = useInfiniteScrollSentinel({
    hasMore,
    loadingMore,
    onLoadMore: loadMore,
  });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [openImageMenu, setOpenImageMenu] = useState(null);
  const [imageToEdit, setImageToEdit] = useState(null);
  const [editOpenFilePicker, setEditOpenFilePicker] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [imageToShare, setImageToShare] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [imageToMove, setImageToMove] = useState(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  const handleAddImageClick = () => {
    if (!canUploadImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      showImageUploadBlockedToast(limits, usage, file.size, toast)
    ) {
      void refreshUsage();
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Formato inválido",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setShowUploadDialog(true);
  };

  const handleUploadComplete = async (uploadedImage) => {
    addImage(uploadedImage);
    applyUsageDelta({
      imageCount: 1,
      storageBytes: uploadedImage.sizeBytes ?? 0,
    });
    void refreshUsage();

    toast({
      title: "Imagem adicionada",
      description: `"${uploadedImage.title}" foi salva com sucesso.`,
    });

    setSelectedFile(null);
  };

  const handleUploadDialogChange = (open) => {
    setShowUploadDialog(open);
    if (!open) {
      setSelectedFile(null);
    }
  };

  const handleEditImage = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setEditOpenFilePicker(false);
    setImageToEdit(image);
  };

  const handleReplaceImageClick = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setEditOpenFilePicker(true);
    setImageToEdit(image);
  };

  const handleShareImageClick = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setImageToShare(image);
    setShowShareDialog(true);
  };

  const handleAddToProjectClick = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setImageToMove(image);
    setShowMoveDialog(true);
  };

  const handleMoveDialogChange = (open) => {
    setShowMoveDialog(open);
    if (!open) {
      setImageToMove(null);
    }
  };

  const handleMoveComplete = async () => {
    if (!imageToMove) {
      return;
    }

    removeImage(imageToMove.id);
    setImageToMove(null);
  };

  const handleEditComplete = ({ title, image }) => {
    if (!imageToEdit) {
      return;
    }

    const updates = { title };

    if (image) {
      updates.originalUrl = image.originalUrl;
      updates.previewUrl = image.previewUrl;
      updates.storagePath = image.storagePath;
      updates.sizeBytes = image.sizeBytes;
      updates.width = image.width;
      updates.height = image.height;
      updates.originalFileType = image.originalFileType;
      updates.optimizedFileType = image.optimizedFileType;
    }

    updateImage(imageToEdit.id, updates);
    setImageToEdit(null);
    setEditOpenFilePicker(false);

    if (image) {
      const previousSizeBytes = imageToEdit.sizeBytes ?? 0;
      const nextSizeBytes = image.sizeBytes ?? 0;
      applyUsageDelta({ storageBytes: nextSizeBytes - previousSizeBytes });
      void refreshUsage();
    }

    toast({
      title: "Imagem atualizada",
      description: image
        ? `"${title}" foi atualizada com sucesso.`
        : "O nome foi salvo com sucesso.",
    });
  };

  const handleEditDialogChange = (open) => {
    if (!open) {
      setImageToEdit(null);
      setEditOpenFilePicker(false);
    }
  };

  const handleDeleteImageClick = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setImageToDelete(image);
    setShowDeleteImageDialog(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete || !user?.uid) {
      return;
    }

    setIsDeletingImage(true);

    try {
      await deleteImage(user.uid, null, imageToDelete.id);
      removeImage(imageToDelete.id);
      applyUsageDelta({
        imageCount: -1,
        storageBytes: -(imageToDelete.sizeBytes ?? 0),
      });
      void refreshUsage();

      toast({
        title: "Imagem excluída",
        description: `"${imageToDelete.title}" foi removida.`,
      });

      setImageToDelete(null);
      setShowDeleteImageDialog(false);
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleVisibilitySaved = (visibility) => {
    if (!imageToShare) {
      return;
    }

    updateImage(imageToShare.id, { visibility });
    setImageToShare((current) =>
      current ? { ...current, visibility } : current,
    );
  };

  if (loadingInitial && images.length === 0) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageActionHeader
        title="Imagens"
        subtitle="Gerencie sua galeria de imagens"
        actionLabel="Adicionar imagem"
        actionIcon={<Plus size={20} />}
        onAction={handleAddImageClick}
        actionDisabled={!canUploadImage}
        dataTestId="images-page-title"
        actionDataTestId="loose-add-image-btn"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleFileSelected}
        className="sr-only"
        data-testid="loose-add-image-input"
      />

      {!canUploadImage && (
        <div className="mb-6">
          <UpgradePrompt
            variant="warning"
            message={`Você atingiu os limites do plano ${limits.displayName}.`}
            secondaryMessage="Faça upgrade para continuar enviando imagens."
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 mb-6" data-testid="images-error">
          Não foi possível carregar as imagens. Tente recarregar a página.
        </p>
      )}

      {!error && !loadingInitial && cardImages.length === 0 ? (
        <EmptyStateCard
          dataTestId="loose-images-empty"
          title="Nenhuma imagem enviada"
          description="Envie panoramas 360° sem precisar criar um projeto."
          actionLabel="Adicionar imagem"
          actionIcon={<Plus size={20} />}
          actionDisabled={!canUploadImage}
          onAction={handleAddImageClick}
          actionDataTestId="loose-empty-add-image-btn"
        />
      ) : cardImages.length > 0 ? (
        <>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="loose-images-grid"
          >
            {cardImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                href={`/viewer/${image.id}`}
                variant="private"
                isMenuOpen={openImageMenu === image.id}
                onMenuToggle={() =>
                  setOpenImageMenu((current) =>
                    current === image.id ? null : image.id,
                  )
                }
                onEdit={() => handleEditImage(image.id)}
                onReplace={() => handleReplaceImageClick(image.id)}
                onShare={() => handleShareImageClick(image.id)}
                onAddToProject={() => handleAddToProjectClick(image.id)}
                onDelete={() => handleDeleteImageClick(image.id)}
                dataTestId={`loose-image-card-${image.id}`}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" aria-hidden="true" />

          {loadingMore && (
            <div
              className="flex items-center justify-center py-8"
              data-testid="images-loading-more"
            >
              <Loader2 size={20} className="animate-spin text-zinc-400" />
            </div>
          )}

          {!hasMore && !loadingMore && (
            <p
              className="text-center text-sm text-zinc-500 py-8"
              data-testid="images-all-loaded"
            >
              Todos os itens foram carregados.
            </p>
          )}
        </>
      ) : null}

      <UploadImageDialog
        open={showUploadDialog}
        onOpenChange={handleUploadDialogChange}
        file={selectedFile}
        userId={user?.uid}
        projectId={null}
        onUploadComplete={handleUploadComplete}
        onPlanLimitReached={refreshUsage}
      />

      <EditImageDialog
        open={Boolean(imageToEdit)}
        onOpenChange={handleEditDialogChange}
        imageId={imageToEdit?.id}
        userId={user?.uid}
        projectId={null}
        initialTitle={imageToEdit?.title ?? ""}
        currentPreviewUrl={
          imageToEdit?.previewUrl || imageToEdit?.originalUrl || ""
        }
        currentWidth={imageToEdit?.width ?? 0}
        currentHeight={imageToEdit?.height ?? 0}
        currentSizeBytes={imageToEdit?.sizeBytes ?? 0}
        currentFileType={
          imageToEdit?.optimizedFileType || imageToEdit?.originalFileType || ""
        }
        openFilePickerOnOpen={editOpenFilePicker}
        onEditComplete={handleEditComplete}
      />

      <ShareImageDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        image={imageToShare}
        userId={user?.uid}
        onVisibilitySaved={handleVisibilitySaved}
      />

      <MoveImageToProjectDialog
        open={showMoveDialog}
        onOpenChange={handleMoveDialogChange}
        image={imageToMove}
        userId={user?.uid}
        onMoveComplete={handleMoveComplete}
      />

      <AlertDialog
        open={showDeleteImageDialog}
        onOpenChange={(open) => {
          setShowDeleteImageDialog(open);
          if (!open) {
            setImageToDelete(null);
          }
        }}
      >
        <AlertDialogContent className={appAlertContentClassName("lg")}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Excluir imagem</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 break-words">
              Tem certeza que deseja excluir esta imagem? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={APP_MODAL_FOOTER_CLASSES}>
            <AlertDialogCancel className="mt-0 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteImage}
              disabled={isDeletingImage}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="confirm-delete-loose-image-btn"
            >
              {isDeletingImage ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
