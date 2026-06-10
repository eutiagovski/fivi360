import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Share2,
  Trash2,
  Pencil,
  Loader2,
  X,
  Check,
  MoreHorizontal,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { SectionHeader } from '@/components/common/SectionHeader';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { ImageCard } from '@/components/common/ImageCard';
import { UploadImageDialog } from '@/components/images/UploadImageDialog';
import { EditImageDialog } from '@/components/images/EditImageDialog';
import { deleteImage, moveImageToUnassigned } from '@/services/images/imageService';
import { AuthLoadingScreen } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useProjectImages } from '@/hooks/useProjectImages';
import { IMAGE_ACCEPT } from '@/utils/imageConstants';
import { validateImageFile } from '@/utils/imageValidation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  APP_MODAL_FOOTER_CLASSES,
  appAlertContentClassName,
} from '@/components/common/AppModal';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import {
  deleteProjectCascade,
  updateProject,
} from '@/services/projects/projectService';
import { emitProjectDeleted } from '@/utils/dataSyncEvents';
import {
  hasProjectCover,
  ProjectCoverPlaceholder,
} from '@/components/common/ProjectCoverPlaceholder';
import { ShareImageDialog } from '@/components/images/ShareImageDialog';
import { ShareProjectDialog } from '@/components/projects/ShareProjectDialog';
import { PlanLimitButton } from '@/components/plans/PlanLimitButton';
import { UpgradePrompt } from '@/components/plans/UpgradePrompt';
import { showImageUploadBlockedToast, showPlanLimitToast } from '@/utils/planToast';
import {
  getVisibilityOptionsForPlan,
  visibilityToLabel,
  VISIBILITY_OPTIONS,
} from '@/utils/visibility';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PROJECT_MENU_ITEM_CLASS =
  'gap-3 rounded-lg px-4 py-3 text-sm text-zinc-300 cursor-pointer focus:bg-zinc-800 focus:text-white';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    canUploadImage,
    limits,
    usage,
    publicVisibilityEnabled,
    refreshUsage,
    applyUsageDelta,
  } = usePlanLimits();
  const { project, loading, notFound, refetch, patchProject } = useProject(id);
  const visibilityOptions = getVisibilityOptionsForPlan(publicVisibilityEnabled);
  const {
    cardImages,
    images,
    loading: imagesLoading,
    addImage,
    updateImage,
    removeImage,
  } = useProjectImages(id);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [openImageMenu, setOpenImageMenu] = useState(null);
  const [imageToEdit, setImageToEdit] = useState(null);
  const [editOpenFilePicker, setEditOpenFilePicker] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [imageToShare, setImageToShare] = useState(null);
  const [showShareImageDialog, setShowShareImageDialog] = useState(false);
  const [imageToMoveToLoose, setImageToMoveToLoose] = useState(null);
  const [showMoveToLooseDialog, setShowMoveToLooseDialog] = useState(false);
  const [isMovingToLoose, setIsMovingToLoose] = useState(false);

  const startEditing = () => {
    if (!project) {
      return;
    }

    setEditForm({
      title: project.title,
      clientName: project.clientName,
      description: project.description,
      visibility: project.visibility,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!project || !editForm) {
      return;
    }

    setIsSaving(true);

    try {
      await updateProject(project.id, {
        title: editForm.title,
        clientName: editForm.clientName,
        description: editForm.description,
        visibility: editForm.visibility,
      });

      toast({
        title: 'Projeto atualizado',
        description: 'As alterações foram salvas.',
      });

      setIsEditing(false);
      setEditForm(null);
      await refetch();
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível atualizar o projeto.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImageClick = () => {
    if (!canUploadImage) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

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
        title: 'Formato inválido',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setShowUploadDialog(true);
  };

  const handleUploadComplete = async (uploadedImage) => {
    const wasFirstImage = images.length === 0;
    addImage(uploadedImage);
    applyUsageDelta({
      imageCount: 1,
      storageBytes: uploadedImage.sizeBytes ?? 0,
    });
    void refreshUsage();

    if (wasFirstImage) {
      await refetch();
    }

    toast({
      title: 'Imagem adicionada',
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
    setShowShareImageDialog(true);
  };

  const handleImageVisibilitySaved = (visibility) => {
    if (!imageToShare) {
      return;
    }

    updateImage(imageToShare.id, { visibility });
    setImageToShare((current) =>
      current ? { ...current, visibility } : current,
    );
  };

  const handleEditComplete = ({ title, image, coverImage }) => {
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

    if (coverImage !== null && coverImage !== undefined) {
      patchProject({ coverImage });
    }

    setImageToEdit(null);
    setEditOpenFilePicker(false);

    if (image) {
      const previousSizeBytes = imageToEdit.sizeBytes ?? 0;
      const nextSizeBytes = image.sizeBytes ?? 0;
      applyUsageDelta({ storageBytes: nextSizeBytes - previousSizeBytes });
      void refreshUsage();
    }

    toast({
      title: 'Imagem atualizada',
      description: image
        ? `"${title}" foi atualizada com sucesso.`
        : 'O nome foi salvo com sucesso.',
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

  const handleMoveToLooseClick = (imageId) => {
    const image = images.find((item) => item.id === imageId);
    if (!image) {
      return;
    }

    setOpenImageMenu(null);
    setImageToMoveToLoose(image);
    setShowMoveToLooseDialog(true);
  };

  const handleConfirmMoveToLoose = async () => {
    if (!project || !imageToMoveToLoose || !user?.uid) {
      return;
    }

    setIsMovingToLoose(true);

    try {
      const { coverImage } = await moveImageToUnassigned(
        user.uid,
        imageToMoveToLoose.id,
        project.coverImage,
      );

      removeImage(imageToMoveToLoose.id);

      if (coverImage !== null) {
        patchProject({ coverImage });
      }

      toast({
        title: 'Imagem movida',
        description: `"${imageToMoveToLoose.title}" foi enviada para imagens soltas.`,
      });

      setImageToMoveToLoose(null);
      setShowMoveToLooseDialog(false);
    } catch {
      toast({
        title: 'Erro ao mover imagem',
        description: 'Não foi possível mover a imagem para imagens soltas.',
        variant: 'destructive',
      });
    } finally {
      setIsMovingToLoose(false);
    }
  };

  const handleConfirmDeleteImage = async () => {
    if (!project || !imageToDelete || !user?.uid) {
      return;
    }

    setIsDeletingImage(true);

    try {
      const { coverImage } = await deleteImage(
        user.uid,
        project.id,
        imageToDelete.id,
        project.coverImage,
      );

      removeImage(imageToDelete.id);
      applyUsageDelta({
        imageCount: -1,
        storageBytes: -(imageToDelete.sizeBytes ?? 0),
      });
      void refreshUsage();

      if (coverImage !== null) {
        patchProject({ coverImage });
      }

      toast({
        title: 'Imagem excluída',
        description: `"${imageToDelete.title}" foi removida.`,
      });

      setImageToDelete(null);
      setShowDeleteImageDialog(false);
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a imagem.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !user?.uid) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProjectCascade(project.id, user.uid);

      emitProjectDeleted({
        projectId: project.id,
        imageIds: result.imageIds,
      });

      applyUsageDelta({
        projectCount: -1,
        imageCount: -result.deletedImageCount,
        storageBytes: -result.deletedStorageBytes,
      });
      void refreshUsage();

      toast({
        title: 'Projeto excluído',
        description: `"${project.title}" e todo o seu conteúdo foram removidos.`,
      });
      navigate('/projects');
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível excluir o projeto.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (notFound || !project) {
    return (
      <div className="p-8 md:p-12 lg:p-16 fade-in">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Voltar para projetos
        </Link>
        <h1 className="text-3xl font-light text-white mb-2" data-testid="project-not-found">
          Projeto não encontrado
        </h1>
        <p className="text-zinc-400">Este projeto não existe ou você não tem acesso.</p>
      </div>
    );
  }

  const hasCover = hasProjectCover(project.coverImage);
  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (option) => option.value === (editForm?.visibility ?? project.visibility),
  );

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <Link
        to="/projects"
        data-testid="back-to-projects"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Voltar para projetos
      </Link>
      {!canUploadImage && (
          <div className="mb-6">
            <UpgradePrompt
              variant="warning"
              message={`Você atingiu os limites do plano ${limits.displayName}.`}
              secondaryMessage="Faça upgrade para continuar enviando imagens."
            />
          </div>
        )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-8 md:p-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3">
            {hasCover ? (
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-64 object-cover rounded-xl"
                data-testid="project-cover"
              />
            ) : (
              <ProjectCoverPlaceholder variant="detail" dataTestId="project-cover-empty" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col gap-4 mb-4 lg:flex-row lg:items-start lg:justify-between lg:gap-4 min-w-0">
              <div className="min-w-0 flex-1 w-full">
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    data-testid="edit-project-title"
                    className="w-full text-4xl sm:text-5xl font-light tracking-tighter text-white mb-2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-white"
                  />
                ) : (
                  <h1
                    className="text-4xl sm:text-5xl font-light tracking-tighter text-white mb-2 break-words"
                    data-testid="project-name"
                  >
                    {project.title || 'Sem título'}
                  </h1>
                )}

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {visibilityOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center justify-center p-2 rounded-lg cursor-pointer text-xs font-medium ${
                          editForm.visibility === option.value
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={editForm.visibility === option.value}
                          onChange={handleEditChange}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">
                    {visibilityToLabel(project.visibility)}
                  </div>
                )}

                {!isEditing && (
                  <div className="lg:hidden mt-2 space-y-1">
                    {project.clientName && (
                      <p className="text-sm text-zinc-400" data-testid="project-client-mobile">
                        Cliente: {project.clientName}
                      </p>
                    )}
                    {project.description && (
                      <p
                        className="text-sm text-zinc-400 line-clamp-2"
                        data-testid="project-description-mobile-short"
                      >
                        {project.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      data-testid="save-project-btn"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      Salvar
                    </button>
                    <button
                      onClick={cancelEditing}
                      data-testid="cancel-edit-project-btn"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors"
                    >
                      <X size={18} />
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      data-testid="edit-project-btn"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil size={18} />
                      Editar
                    </button>
                    <button
                      onClick={() => setShowShareDialog(true)}
                      data-testid="share-project-btn"
                      className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors"
                    >
                      <Share2 size={18} />
                      Compartilhar
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      data-testid="delete-project-btn"
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-red-400 rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>

              {isEditing ? (
                <div className="flex lg:hidden items-center gap-2 w-full min-w-0">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    data-testid="save-project-btn-mobile"
                    className="flex flex-1 min-w-0 items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    Salvar
                  </button>
                  <button
                    onClick={cancelEditing}
                    data-testid="cancel-edit-project-btn-mobile"
                    className="flex flex-1 min-w-0 items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex lg:hidden items-center gap-2 w-full min-w-0">
                  <button
                    onClick={() => setShowShareDialog(true)}
                    data-testid="share-project-btn-mobile"
                    className="flex flex-1 min-w-0 items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium btn-scale hover:bg-zinc-200 transition-colors"
                  >
                    <Share2 size={18} className="shrink-0" />
                    Compartilhar
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        data-testid="project-more-menu-btn"
                        aria-label="Mais opções do projeto"
                        className="flex shrink-0 items-center justify-center p-2 px-3 bg-zinc-800 border border-zinc-700 text-white rounded-xl font-medium btn-scale hover:bg-zinc-700 transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="bottom"
                      sideOffset={8}
                      collisionPadding={16}
                      className="w-52 min-w-0 max-w-[min(13rem,calc(100vw-2rem))] rounded-xl border-zinc-800 bg-zinc-900 p-1 text-zinc-300 shadow-xl z-50"
                      data-testid="project-more-menu-content"
                    >
                      <DropdownMenuItem
                        className={PROJECT_MENU_ITEM_CLASS}
                        onSelect={startEditing}
                        data-testid="edit-project-menu-item"
                      >
                        <Pencil size={16} />
                        Editar projeto
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={`${PROJECT_MENU_ITEM_CLASS} text-red-400 focus:text-red-300`}
                        onSelect={() => setShowDeleteDialog(true)}
                        data-testid="delete-project-menu-item"
                      >
                        <Trash2 size={16} />
                        Excluir projeto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {project.clientName && !isEditing && (
              <p
                className="hidden lg:block text-sm text-zinc-400 mb-3"
                data-testid="project-client"
              >
                Cliente: {project.clientName}
              </p>
            )}

            {isEditing && (
              <div className="mb-4">
                <label htmlFor="clientName" className="block text-xs text-zinc-500 mb-1">
                  Cliente
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={editForm.clientName}
                  onChange={handleEditChange}
                  data-testid="edit-project-client"
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
            )}

            {isEditing ? (
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows={4}
                data-testid="edit-project-description"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white resize-none"
              />
            ) : (
              <p
                className="hidden lg:block text-base text-zinc-300 leading-relaxed"
                data-testid="project-description"
              >
                {project.description || 'Sem descrição.'}
              </p>
            )}

            {isEditing && selectedVisibility && (
              <p className="text-xs text-zinc-500 mt-2">{selectedVisibility.description}</p>
            )}

            <div className="mt-6 flex items-center gap-4 text-sm text-zinc-400">
              <span data-testid="project-image-count">
                {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={handleFileSelected}
          className="sr-only"
          data-testid="add-image-input"
        />
        {/* {!canUploadImage && (
          <div className="mb-6">
            <UpgradePrompt
              variant="limit"
              message={`Você atingiu os limites do plano ${limits.displayName}.`}
              secondaryMessage="Faça upgrade para continuar enviando imagens."
            />
          </div>
        )} */}

        <SectionHeader
          title="Imagens panorâmicas"
          dataTestId="images-section-title"
          actions={
            <PlanLimitButton
              disabled={!canUploadImage}
              onClick={handleAddImageClick}
              dataTestId="add-image-btn"
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
          <EmptyStateCard
            dataTestId="images-empty"
            title="Nenhuma imagem adicionada"
            description="Adicione sua primeira imagem 360° para começar a montar este projeto."
            actionLabel="Adicionar imagem"
            actionIcon={<Plus size={20} />}
            actionDisabled={!canUploadImage}
            onAction={handleAddImageClick}
            actionDataTestId="images-empty-add-image-btn"
          />
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="images-grid"
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
                onMoveToLoose={() => handleMoveToLooseClick(image.id)}
                onDelete={() => handleDeleteImageClick(image.id)}
                dataTestId={`image-card-${image.id}`}
              />
            ))}
          </div>
        )}
      </div>

      <UploadImageDialog
        open={showUploadDialog}
        onOpenChange={handleUploadDialogChange}
        file={selectedFile}
        userId={user?.uid}
        projectId={id}
        onUploadComplete={handleUploadComplete}
        onPlanLimitReached={refreshUsage}
      />

      <EditImageDialog
        open={Boolean(imageToEdit)}
        onOpenChange={handleEditDialogChange}
        imageId={imageToEdit?.id}
        userId={user?.uid}
        projectId={id}
        initialTitle={imageToEdit?.title ?? ''}
        currentPreviewUrl={
          imageToEdit?.previewUrl || imageToEdit?.originalUrl || ''
        }
        currentWidth={imageToEdit?.width ?? 0}
        currentHeight={imageToEdit?.height ?? 0}
        currentSizeBytes={imageToEdit?.sizeBytes ?? 0}
        currentFileType={
          imageToEdit?.optimizedFileType || imageToEdit?.originalFileType || ''
        }
        projectCoverImage={project?.coverImage ?? ''}
        openFilePickerOnOpen={editOpenFilePicker}
        onEditComplete={handleEditComplete}
      />

      <AlertDialog
        open={showMoveToLooseDialog}
        onOpenChange={(open) => {
          if (isMovingToLoose && !open) {
            return;
          }
          setShowMoveToLooseDialog(open);
          if (!open) {
            setImageToMoveToLoose(null);
          }
        }}
      >
        <AlertDialogContent className={appAlertContentClassName('lg')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Mover para imagens soltas</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 break-words">
              Esta imagem será removida deste projeto e ficará disponível na
              galeria de imagens soltas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={APP_MODAL_FOOTER_CLASSES}>
            <AlertDialogCancel
              disabled={isMovingToLoose}
              className="mt-0 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmMoveToLoose}
              disabled={isMovingToLoose}
              className="bg-white text-black hover:bg-zinc-200"
              data-testid="confirm-move-to-loose-btn"
            >
              {isMovingToLoose ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteImageDialog}
        onOpenChange={(open) => {
          setShowDeleteImageDialog(open);
          if (!open) {
            setImageToDelete(null);
          }
        }}
      >
        <AlertDialogContent className={appAlertContentClassName('lg')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Excluir imagem</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 break-words">
              Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
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
              data-testid="confirm-delete-image-btn"
            >
              {isDeletingImage ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareImageDialog
        open={showShareImageDialog}
        onOpenChange={setShowShareImageDialog}
        image={imageToShare}
        userId={user?.uid}
        onVisibilitySaved={handleImageVisibilitySaved}
      />

      <ShareProjectDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        project={project}
        onVisibilitySaved={refetch}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={appAlertContentClassName('lg')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 break-words">
              Esta ação removerá permanentemente o projeto, suas imagens, hotspots e arquivos
              armazenados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={APP_MODAL_FOOTER_CLASSES}>
            <AlertDialogCancel className="mt-0 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="confirm-delete-project-detail-btn"
            >
              {isDeleting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Excluir permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
