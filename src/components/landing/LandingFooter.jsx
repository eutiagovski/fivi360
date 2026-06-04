import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const LEGAL_LINKS = [
  { label: "Termos de Uso", to: "/termos" },
  { label: "Política de Privacidade", to: "/privacidade" },
];

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 mt-auto" data-testid="landing-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-xl font-light tracking-tighter text-white mb-2">
              FIVI<span className="font-medium">360</span>
            </p>
            <p className="text-sm text-zinc-500 max-w-sm">
              Plataforma para apresentar projetos com imagens panorâmicas 360°.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Links legais">
            {LEGAL_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-8 bg-zinc-800" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-zinc-500">
          <p>&copy; {year} FIVI360. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/register" className="hover:text-white transition-colors">
              Cadastrar
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
