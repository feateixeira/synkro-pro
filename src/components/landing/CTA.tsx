import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
      
      {/* Animated rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary/10 rounded-full animate-pulse-ring" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary/5 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] border border-primary/5 rounded-full animate-pulse-ring" style={{ animationDelay: '1s' }} />
      
      {/* Floating particles */}
      <div className="absolute top-20 left-1/4 w-3 h-3 bg-primary/30 rounded-full animate-float" />
      <div className="absolute bottom-20 right-1/4 w-4 h-4 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-10 w-2 h-2 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 left-10 w-3 h-3 bg-primary/25 rounded-full animate-float" style={{ animationDelay: '3s' }} />

      <div className="container mx-auto max-w-4xl relative z-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary mb-8 animate-bounce-subtle">
          <Zap className="w-4 h-4" />
          Oferta por tempo limitado
        </div>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Pronto para transformar
          <br />
          <span className="text-gradient">sua barbearia?</span>
        </h2>

        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Comece agora com 14 dias grátis. Sem compromisso, sem cartão de crédito. 
          Experimente todas as funcionalidades do plano Pro.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            variant="hero" 
            size="xl" 
            className="pulse-gold group w-full sm:w-auto hover:scale-105 transition-transform duration-300"
            onClick={() => navigate('/auth')}
          >
            Começar teste grátis
            <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button 
            variant="ghost" 
            size="xl"
            className="w-full sm:w-auto hover:scale-105 transition-transform duration-300"
          >
            Falar com vendas
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mt-8">
          Mais de 2.500 barbearias já confiam no Synkro
        </p>
      </div>
    </section>
  );
};
