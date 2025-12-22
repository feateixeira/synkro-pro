import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: "49",
    yearlyPrice: "499",
    description: "Perfeito para quem está começando",
    features: [
      "Agendamento Online",
      "1 Barbeiro",
      "Até 100 Clientes",
      "Dashboard Básico",
      "Suporte por E-mail",
    ],
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: "99",
    yearlyPrice: "990",
    description: "Ideal para barbearias em crescimento",
    features: [
      "Agendamento Online",
      "Até 5 Barbeiros",
      "Clientes Ilimitados",
      "Dashboard Completo",
      "Relatórios Avançados",
      "Sistema de Comissões",
      "Suporte Prioritário",
    ],
    popular: true,
  },
  {
    name: "Elite",
    monthlyPrice: "199",
    yearlyPrice: "1.699",
    description: "Para quem quer o máximo",
    features: [
      "Agendamento Online",
      "Barbeiros Ilimitados",
      "Clientes Ilimitados",
      "Dashboard Completo",
      "Relatórios Avançados",
      "Sistema de Comissões",
      "API WhatsApp Integrada",
      "Suporte VIP 24/7",
      "Treinamento Personalizado",
    ],
    popular: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);

  const getYearlySavings = (monthlyPrice: string, yearlyPrice: string) => {
    const monthly = parseFloat(monthlyPrice) * 12;
    const yearly = parseFloat(yearlyPrice.replace(".", ""));
    const savings = monthly - yearly;
    const percentage = Math.round((savings / monthly) * 100);
    return { savings, percentage };
  };

  return (
    <section id="pricing" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">Planos e Preços</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Escolha o plano ideal
            <br />
            <span className="text-gradient">para sua barbearia</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Todos os planos incluem 5 dias de teste grátis. Cancele quando quiser.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-background transition-transform duration-300 ${
                  isYearly ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isYearly && (
              <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">
                Economize até 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const savings = getYearlySavings(plan.monthlyPrice, plan.yearlyPrice);
            const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "border-2 border-primary bg-card shadow-2xl shadow-primary/10"
                    : "glass-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-gradient-gold text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      MAIS POPULAR
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-bold text-foreground">R$</span>
                  <span className="text-5xl font-bold text-gradient">{displayPrice}</span>
                  <span className="text-muted-foreground">/{isYearly ? 'ano' : 'mês'}</span>
                </div>

                {isYearly && (
                  <p className="text-sm text-primary mb-4">
                    Economia de R$ {savings.savings} ({savings.percentage}% off)
                  </p>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Começar teste grátis
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    size="sm"
                    onClick={() => navigate('/auth?subscribe=true')}
                  >
                    Ou assinar agora
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm mb-4">Pagamento seguro com</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <span className="text-lg font-semibold">Mercado Pago</span>
            <span className="text-lg font-semibold">Stripe</span>
            <span className="text-lg font-semibold">PIX</span>
          </div>
        </div>
      </div>
    </section>
  );
};
