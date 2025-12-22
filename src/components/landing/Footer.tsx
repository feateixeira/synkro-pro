import { Instagram, Facebook, Youtube, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import synkroLogo from "@/assets/synkro-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={synkroLogo} alt="Synkro" className="w-10 h-10 rounded-xl" />
              <span className="font-display text-xl font-bold text-foreground">Synkro</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              A plataforma completa para gestão de barbearias. Simplifique sua operação e aumente seu faturamento.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-2">
              {["Funcionalidades", "Preços", "Integrações", "API"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-2">
              {["Sobre nós", "Blog", "Carreiras", "Contato"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2">
              {["Central de Ajuda", "Comunidade", "Status", "Termos de Uso"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 Synkro. Todos os direitos reservados.
          </p>
          
          <div className="flex items-center gap-4">
            {[Instagram, Facebook, Youtube, Mail].map((Icon, index) => (
              <a
                key={index}
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
