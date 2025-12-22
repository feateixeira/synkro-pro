import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, Star, Zap, Crown, Loader2, 
  CheckCircle2, CreditCard, Calendar
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlansPageProps {
  barbershopId: string;
  currentPlan?: string;
  subscriptionStatus?: string;
}

// Stripe Price IDs
const STRIPE_PRICES = {
  starter_monthly: "price_1SgpLdCExqLeeA62CjXITBFt",
  starter_yearly: "price_1SgpNACExqLeeA62rdo5PMnr",
  professional_monthly: "price_1SgpQCCExqLeeA62N26Y2en4",
  professional_yearly: "price_1SgpRUCExqLeeA62FgKmgFNR",
  enterprise_monthly: "price_1SgpThCExqLeeA62jUqEDOMY",
  enterprise_yearly: "price_1SgpW7CExqLeeA62QqYuYtkM",
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49.99,
    yearlyPrice: 499.00,
    monthlyPriceId: STRIPE_PRICES.starter_monthly,
    yearlyPriceId: STRIPE_PRICES.starter_yearly,
    description: "Para barbearias iniciantes",
    features: [
      "1 barbeiro",
      "Agendamento online",
      "Programa de fidelidade",
      "Suporte por email",
    ],
    icon: Star,
    popular: false,
  },
  {
    id: "professional",
    name: "Profissional",
    monthlyPrice: 99.90,
    yearlyPrice: 990.00,
    monthlyPriceId: STRIPE_PRICES.professional_monthly,
    yearlyPriceId: STRIPE_PRICES.professional_yearly,
    description: "Para barbearias em crescimento",
    features: [
      "Até 5 barbeiros",
      "Agendamento online",
      "Programa de fidelidade",
      "Galeria de portfólio",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    icon: Zap,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 169.99,
    yearlyPrice: 1699.00,
    monthlyPriceId: STRIPE_PRICES.enterprise_monthly,
    yearlyPriceId: STRIPE_PRICES.enterprise_yearly,
    description: "Para redes de barbearias",
    features: [
      "Barbeiros ilimitados",
      "Múltiplas unidades",
      "Agendamento online",
      "Programa de fidelidade",
      "Galeria de portfólio",
      "Relatórios avançados",
      "API personalizada",
      "Suporte 24/7",
    ],
    icon: Crown,
    popular: false,
  },
];

export const PlansPage = ({ barbershopId, currentPlan, subscriptionStatus }: PlansPageProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Check for payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true" || urlParams.get("payment") === "success") {
      setPaymentSuccess(true);
      toast({
        title: "🎉 Pagamento confirmado!",
        description: "Sua assinatura foi ativada com sucesso",
      });
      // Clean URL
      window.history.replaceState({}, "", "/dashboard?tab=plans");
    }
    if (urlParams.get("canceled") === "true" || urlParams.get("payment") === "canceled") {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/dashboard?tab=plans");
    }
  }, [toast]);

  const handleSubscribe = async (planId: string, priceId: string) => {
    setIsProcessing(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { priceId, barbershopId },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No checkout URL returned");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Erro ao iniciar checkout",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { savings, percentage };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">
          Escolha seu Plano
        </h2>
        <p className="text-muted-foreground mt-2">
          Desbloqueie todo o potencial da sua barbearia
        </p>
        {subscriptionStatus === "trialing" && (
          <Badge className="mt-4 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            Você está no período de teste
          </Badge>
        )}
        {paymentSuccess && subscriptionStatus === "active" && (
          <Badge className="mt-4 bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Assinatura ativa
          </Badge>
        )}
      </div>

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Mensal
            </TabsTrigger>
            <TabsTrigger value="yearly" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Anual
              <Badge variant="secondary" className="ml-1 text-xs">-17%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          const priceId = billingPeriod === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
          const period = billingPeriod === "monthly" ? "mês" : "ano";
          const isCurrentPlan = currentPlan?.toLowerCase().includes(plan.id) && subscriptionStatus === "active";
          const { savings, percentage } = getYearlySavings(plan.monthlyPrice, plan.yearlyPrice);
          
          return (
            <div
              key={plan.id}
              className={`relative glass-card p-6 flex flex-col ${
                plan.popular ? "border-2 border-primary" : ""
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  plan.popular ? "bg-primary/20" : "bg-secondary"
                }`}>
                  <Icon className={`w-6 h-6 ${plan.popular ? "text-primary" : "text-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">R$ {price.toFixed(2).replace(".", ",")}</span>
                  <span className="text-muted-foreground">/{period}</span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-sm text-green-500 mt-1">
                    Economize R$ {savings.toFixed(2).replace(".", ",")} ({percentage}% de desconto)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button variant="outline" disabled className="w-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Plano Atual
                </Button>
              ) : (
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id, priceId)}
                  disabled={isProcessing !== null}
                >
                  {isProcessing === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Assinar Agora
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Pagamento seguro via Stripe • Cartão de Crédito, Débito ou PIX</p>
        <p className="mt-1">Cancele a qualquer momento</p>
      </div>
    </div>
  );
};
