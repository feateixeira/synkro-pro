import { UserPlus, Settings, Calendar, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastre-se gratuitamente em menos de 2 minutos. Sem cartão de crédito.",
  },
  {
    number: "02",
    icon: Settings,
    title: "Configure sua barbearia",
    description: "Adicione seus serviços, profissionais e horários de funcionamento.",
  },
  {
    number: "03",
    icon: Calendar,
    title: "Compartilhe o link",
    description: "Envie o link de agendamento para seus clientes via WhatsApp ou redes sociais.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Acompanhe os resultados",
    description: "Gerencie agendamentos e veja sua receita crescer com relatórios em tempo real.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      {/* Floating orbs */}
      <div className="absolute top-10 left-20 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-10 right-20 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-10 w-2 h-2 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4 animate-bounce-subtle">
            Simples e Rápido
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece a usar o Synkro em minutos. Sem complicação, sem burocracia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
              
              <div className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2">
                {/* Step number */}
                <span className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </span>
                
                {/* Icon */}
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Pronto para transformar sua barbearia?
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
          >
            Começar Agora — É Grátis
          </a>
        </div>
      </div>
    </section>
  );
};
