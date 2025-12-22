import { 
  Calendar, 
  BarChart3, 
  Users, 
  CreditCard, 
  Bell, 
  Smartphone,
  Clock,
  TrendingUp,
  UserCheck,
  Percent,
  MessageSquare,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Calendário interativo com suporte a múltiplos barbeiros simultâneos. Bloqueie horários e gerencie intervalos facilmente.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Financeiro",
    description: "Visualize receita em tempo real, ticket médio, e acompanhe a saúde financeira do seu negócio com gráficos claros.",
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description: "Registre preferências, histórico de cortes e receba alertas de clientes que não retornam há muito tempo.",
  },
  {
    icon: Percent,
    title: "Sistema de Comissões",
    description: "Defina porcentagens para cada barbeiro e gere relatórios de fechamento quinzenal ou mensal automaticamente.",
  },
  {
    icon: Globe,
    title: "Booking Online",
    description: "Página de agendamento personalizada para seus clientes. Sem fricção: apenas nome e WhatsApp para agendar.",
  },
  {
    icon: MessageSquare,
    title: "Lembretes Automáticos",
    description: "Envie lembretes via WhatsApp 2 horas antes do horário. Reduza faltas e aumente a satisfação do cliente.",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Configure horários de funcionamento por dia da semana e gerencie folgas e intervalos de almoço.",
  },
  {
    icon: TrendingUp,
    title: "Relatórios Avançados",
    description: "Analise tendências, períodos de pico e otimize sua operação com insights baseados em dados reais.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Interface otimizada para celular. Gerencie sua barbearia de qualquer lugar, a qualquer momento.",
  },
  {
    icon: UserCheck,
    title: "Multi-Barbeiros",
    description: "Adicione colaboradores com permissões específicas. Cada um visualiza apenas seus agendamentos e comissões.",
  },
  {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    description: "Receba assinatura recorrente via Mercado Pago ou Stripe. Gestão de planos simplificada.",
  },
  {
    icon: Bell,
    title: "Notificações Push",
    description: "Receba alertas de novos agendamentos, cancelamentos e lembretes importantes em tempo real.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-0 w-px h-64 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-1/3 right-0 w-px h-48 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
      
      {/* Floating particles */}
      <div className="absolute top-40 right-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold tracking-wider uppercase mb-4 animate-bounce-subtle">
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Tudo que você precisa em
            <br />
            <span className="text-gradient">um só lugar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas para transformar sua barbearia em um negócio profissional e escalável.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card p-6 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-primary group-hover:animate-bounce-subtle" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
