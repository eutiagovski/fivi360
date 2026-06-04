import { Link } from "react-router-dom";
import { Orbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const primaryBtnClass =
  "bg-white text-black rounded-full px-6 py-3 font-medium btn-scale hover:bg-zinc-200 h-auto text-base";

const secondaryBtnClass =
  "border border-zinc-700 text-white rounded-full px-6 py-3 hover:bg-zinc-900 bg-transparent h-auto text-base";

export function LandingHero() {
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <Badge
              variant="outline"
              className="mb-6 border-zinc-700 text-zinc-300 rounded-full px-4 py-1.5 font-normal"
            >
              Plano Starter gratuito — sem cartão
            </Badge>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter text-white mb-6"
              data-testid="landing-hero-title"
            >
              Apresente projetos em 360°
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Transforme panoramas em experiências imersivas. Organize por projetos, adicione
              hotspots e compartilhe com clientes por link — ou publique seu portfólio online.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button className={primaryBtnClass} asChild>
                <Link to="/register" data-testid="landing-hero-register-btn">
                  Começar Gratuitamente
                </Link>
              </Button>
              <Button variant="outline" className={secondaryBtnClass} asChild>
                <a href="#demo" data-testid="landing-hero-demo-btn">
                  Ver Demonstração
                </a>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              className="relative w-full max-w-lg aspect-[4/3] rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden card-hover"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/40 via-transparent to-zinc-900/60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="rounded-full border border-zinc-700 bg-zinc-900/80 p-6">
                  <Orbit className="h-12 w-12 text-zinc-400" strokeWidth={1.25} />
                </div>
                <p className="text-sm text-zinc-500 text-center">
                  Experiência 360° interativa
                </p>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
