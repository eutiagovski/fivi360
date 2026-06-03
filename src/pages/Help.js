import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';

export const Help = () => {
  return (
    <div className="p-8 md:p-12 lg:p-16 fade-in">
      <PageHeader
        title="Ajuda"
        subtitle="Central de suporte e orientações sobre o FIVI360"
        dataTestId="help-title"
      />

      <div className="max-w-2xl rounded-2xl border border-zinc-800 bg-[#121212] p-6 md:p-8">
        <p className="text-zinc-400 leading-relaxed">
          Em breve você encontrará aqui tutoriais, perguntas frequentes e canais de contato.
          Enquanto isso, ajuste seu perfil e portfólio em{' '}
          <Link to="/settings" className="text-white underline underline-offset-4 hover:text-zinc-300">
            Configurações
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
