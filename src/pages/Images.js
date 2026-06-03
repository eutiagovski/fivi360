import { useRef, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionHeader } from "@/components/common/SectionHeader";
import { ImageCard } from "@/components/common/ImageCard";
import { UploadImageDialog } from "@/components/images/UploadImageDialog";
import { EditImageDialog } from "@/components/images/EditImageDialog";
import { ShareImageDialog } from "@/components/images/ShareImageDialog";
import { MoveImageToProjectDialog } from "@/components/images/MoveImageToProjectDialog";
import { deleteImage } from "@/services/images/imageService";
import { AuthLoadingScreen } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { PlanLimitButton } from "@/components/plans/PlanLimitButton";
import { UpgradePrompt } from "@/components/plans/UpgradePrompt";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useLooseImages } from "@/hooks/useLooseImages";
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
import { toast } from "@/hooks/use-toast";

export const Images = () => {
  const { user } = useAuth();
  const { canUploadImage, limits } = usePlanLimits();
  const {
    cardImages,
    images,
    loading: imagesLoading,
    addImage,
    updateImage,
    removeImage,
  } = useLooseImages();
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
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
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

  if (imagesLoading && images.length === 0) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageHeader
        title="Imagens"
        subtitle="Panoramas 360° sem projeto"
        dataTestId="images-page-title"
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
            variant="limit"
            message={`Você atingiu os limites do plano ${limits.displayName}.`}
            secondaryMessage="Faça upgrade para continuar enviando imagens."
          />
        </div>
      )}

      <SectionHeader
        title="Galeria"
        dataTestId="loose-images-section-title"
        actions={
          <PlanLimitButton
            disabled={!canUploadImage}
            onClick={handleAddImageClick}
            dataTestId="loose-add-image-btn"
          >
            <Plus size={20} />
            Adicionar imagem
          </PlanLimitButton>
        }
      />

      {imagesLoading ? (
        <div className="flex items-center justify-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      ) : cardImages.length === 0 ? (
        <div
          className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl"
          data-testid="loose-images-empty"
        >
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhuma imagem adicionada
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Envie panoramas 360° sem precisar criar um projeto.
          </p>
          <PlanLimitButton
            disabled={!canUploadImage}
            onClick={handleAddImageClick}
            dataTestId="loose-empty-add-image-btn"
          >
            <Plus size={20} />
            Adicionar imagem
          </PlanLimitButton>
        </div>
      ) : (
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
      )}

      <UploadImageDialog
        open={showUploadDialog}
        onOpenChange={handleUploadDialogChange}
        file={selectedFile}
        userId={user?.uid}
        projectId={null}
        onUploadComplete={handleUploadComplete}
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
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imagem</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir esta imagem? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
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
