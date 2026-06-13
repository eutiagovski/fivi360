import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trackEvent } from '@/services/analytics/analyticsService';
import { createProject } from '@/services/projects/projectService';
import { showPlanLimitToast } from '@/utils/planToast';
import {
  getVisibilityOptionsForPlan,
  VISIBILITY_OPTIONS,
} from '@/utils/visibility';

export const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreateProject, publicVisibilityEnabled, loading: planLoading, limits } =
    usePlanLimits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    description: '',
    visibility: 'private',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const projectId = await createProject(user.uid, {
        title: formData.title,
        clientName: formData.clientName,
        description: formData.description,
        visibility: formData.visibility,
      });

      trackEvent('create_project', {
        has_description: Boolean(formData.description.trim()),
      });

      toast({
        title: 'Projeto criado',
        description: 'Seu projeto foi salvo com sucesso.',
      });

      navigate(`/projects/${projectId}`);
    } catch (error) {
      if (!showPlanLimitToast(error, toast)) {
        toast({
          title: 'Erro ao criar projeto',
          description: 'Não foi possível salvar o projeto. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions = getVisibilityOptionsForPlan(publicVisibilityEnabled);

  const selectedVisibility = VISIBILITY_OPTIONS.find(
    (option) => option.value === formData.visibility,
  );

  if (planLoading) {
    return (
      <div className="p-8 md:p-12 lg:p-16 flex justify-center">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!canCreateProject) {
    return (
      <div className="p-8 md:p-12 lg:p-16 fade-in">
        <Link
          to="/projects"
          data-testid="back-to-projects-new"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Voltar para projetos
        </Link>

        <div
          className="max-w-2xl mx-auto text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-8"
          data-testid="new-project-limit-blocked"
        >
          <h2
            className="text-2xl font-light text-white mb-4 tracking-tight"
            data-testid="new-project-limit-title"
          >
            Limite de projetos atingido
          </h2>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            {`Você atingiu o limite de projetos do plano ${limits.displayName}. Faça upgrade para criar projetos ilimitados.`}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/plan"
              data-testid="new-project-view-plans-btn"
              className="w-full sm:w-auto px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors"
            >
              Ver planos
            </Link>
            <Link
              to="/projects"
              data-testid="new-project-back-projects-btn"
              className="w-full sm:w-auto px-8 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-full font-medium btn-scale hover:bg-zinc-700 transition-colors"
            >
              Voltar para projetos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <Link
        to="/projects"
        data-testid="back-to-projects-new"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Voltar para projetos
      </Link>

      <PageHeader
        title="Criar novo projeto"
        subtitle="Preencha as informações do seu projeto"
        dataTestId="new-project-title"
      />

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-2">
                Nome do projeto *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                data-testid="input-project-name"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ex: Residência Moderna"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="clientName" className="block text-sm font-medium text-zinc-400 mb-2">
                Nome do cliente
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                data-testid="input-project-client"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                data-testid="input-project-description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Descreva seu projeto..."
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">
                Visibilidade
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {visibilityOptions.map((option) => (
                  <label
                    key={option.value}
                    data-testid={`status-option-${option.value}`}
                    className={`
                      relative flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all
                      ${
                        formData.visibility === option.value
                          ? 'bg-white text-black border-2 border-white'
                          : 'bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:border-zinc-600'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              {selectedVisibility && (
                <p className="text-xs text-zinc-500 mt-2">
                  {selectedVisibility.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full justify-center">
           
            <Link
              to="/projects"
              data-testid="cancel-create-project-btn"
              className="px-8 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-full font-medium btn-scale hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="create-project-submit-btn"
              className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-medium btn-scale hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              Criar projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
