import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, BarChart3, Users, Scissors, Star, TrendingUp, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "2.500+", label: "Barbearias ativas" },
    { value: "150k+", label: "Agendamentos/mês" },
    { value: "98%", label: "Satisfação" },
    { value: "35%", label: "Aumento médio de receita" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Animated floating orbs */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-6 h-6 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-10 w-5 h-5 bg-primary/25 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-primary/35 rounded-full animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Animated lines */}
      <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-1/3 w-px h-40 bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-0 right-1/3 w-px h-32 bg-gradient-to-t from-transparent via-primary/25 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative z-10 mx-auto max-w-6xl text-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary mb-6 fade-in-up backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          14 dias grátis • Sem cartão de crédito • Cancele quando quiser
        </div>

        {/* Rating Badge */}
        <div className="flex items-center justify-center gap-1 mb-6 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-primary text-primary" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground ml-2">
            4.9/5 de <span className="text-foreground font-medium">2.847 avaliações</span>
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
          Gerencie sua barbearia
          <br />
          <span className="text-gradient">como um profissional</span>
        </h1>

        {/* Subheading */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
          Agendamentos, finanças, comissões e CRM em uma única plataforma. 
          Aumente seu faturamento e profissionalize sua operação.
        </p>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10 fade-in-up" style={{ animationDelay: '0.25s' }}>
          {stats.map((stat, index) => (
            <div key={index} className="glass-card px-4 py-3 text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button 
            variant="hero" 
            size="xl" 
            className="pulse-gold group w-full sm:w-auto"
            onClick={() => navigate('/auth')}
          >
            Começar gratuitamente
            <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button 
            variant="hero-outline" 
            size="xl"
            className="w-full sm:w-auto"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver funcionalidades
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-12 fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Dados seguros</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Setup em 5 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>ROI garantido</span>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 fade-in-up" style={{ animationDelay: '0.4s' }}>
          {[
            { icon: Calendar, label: "Agenda Inteligente" },
            { icon: BarChart3, label: "Dashboard Financeiro" },
            { icon: Users, label: "CRM de Clientes" },
            { icon: Scissors, label: "Multi-barbeiros" },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass-card flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-300"
            >
              <feature.icon className="w-4 h-4 text-primary" />
              {feature.label}
            </div>
          ))}
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="border-gradient p-1 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">app.synkro.com/dashboard</span>
              </div>
              <div className="p-6 space-y-4">
                {/* Mock Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Receita Hoje", value: "R$ 1.250", change: "+12%" },
                    { label: "Agendamentos", value: "18", change: "+5" },
                    { label: "Ticket Médio", value: "R$ 69", change: "+8%" },
                    { label: "Clientes Novos", value: "7", change: "+3" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-secondary/50 rounded-lg p-4 text-left">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{stat.value}</p>
                      <p className="text-xs text-success mt-1">{stat.change}</p>
                    </div>
                  ))}
                </div>
                {/* Mock Chart */}
                <div className="bg-secondary/30 rounded-lg p-4 h-40 flex items-end justify-around gap-2">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <div
                      key={i}
                      className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-primary rounded-t transition-all duration-500"
                      style={{ height: `${height}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
