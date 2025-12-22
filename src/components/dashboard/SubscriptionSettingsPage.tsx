import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, Calendar, FileText, ExternalLink, 
  Loader2, Settings, CheckCircle2, AlertCircle,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string | null;
  created: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

interface SubscriptionInfo {
  subscribed: boolean;
  plan: string | null;
  price_id: string | null;
  subscription_end: string | null;
  invoices: Invoice[];
}

interface SubscriptionSettingsPageProps {
  barbershopId: string;
  subscriptionStatus?: string;
}

export const SubscriptionSettingsPage = ({ 
  barbershopId, 
  subscriptionStatus 
}: SubscriptionSettingsPageProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setSubscriptionInfo(data);
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
      toast({
        title: "Erro ao carregar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No portal URL returned");

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Erro ao abrir portal",
        description: error.message || "Você precisa ter uma assinatura ativa primeiro",
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Pago</Badge>;
      case "open":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case "void":
        return <Badge className="bg-muted text-muted-foreground">Cancelado</Badge>;
      case "uncollectible":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status || "Desconhecido"}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl font-bold text-foreground">
          Configurações de Assinatura
        </h2>
        <p className="text-muted-foreground mt-2">
          Gerencie sua assinatura, faturas e métodos de pagamento
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Sua Assinatura
          </CardTitle>
          <CardDescription>
            Informações sobre seu plano atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionInfo?.subscribed ? (
            <>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{subscriptionInfo.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      Renova em {subscriptionInfo.subscription_end ? 
                        format(new Date(subscriptionInfo.subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) :
                        "—"
                      }
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  Ativo
                </Badge>
              </div>

              <Button 
                onClick={handleManageSubscription}
                disabled={isOpeningPortal}
                className="w-full sm:w-auto"
              >
                {isOpeningPortal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Abrindo...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Gerenciar Assinatura
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Altere seu plano, método de pagamento ou cancele sua assinatura
              </p>
            </>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="font-medium">Nenhuma assinatura ativa</p>
                <p className="text-sm text-muted-foreground">
                  {subscriptionStatus === "trialing" 
                    ? "Você está no período de teste. Escolha um plano para continuar após o trial."
                    : "Escolha um plano para desbloquear todas as funcionalidades."
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>
            Suas últimas faturas e pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionInfo?.invoices && subscriptionInfo.invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionInfo.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(invoice.created), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.number || "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.hosted_invoice_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(invoice.hosted_invoice_url!, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          {invoice.invoice_pdf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(invoice.invoice_pdf!, "_blank")}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma fatura encontrada</p>
              <p className="text-sm">As faturas aparecerão aqui após seu primeiro pagamento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Para alterar seu método de pagamento, clique em "Gerenciar Assinatura"</p>
          <p>• Para fazer upgrade ou downgrade, acesse a aba "Planos"</p>
          <p>• Para cancelar sua assinatura, use o portal de gerenciamento</p>
          <p>• Pagamentos via PIX são processados automaticamente em até 24h</p>
        </CardContent>
      </Card>
    </div>
  );
};
