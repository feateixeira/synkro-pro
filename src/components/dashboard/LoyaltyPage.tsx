import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLoyalty } from "@/hooks/useLoyalty";
import { useClients } from "@/hooks/useClients";
import { 
  Loader2, Gift, Star, Ticket, Search, Plus,
  Check, Clock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LoyaltyPageProps {
  barbershopId: string;
}

export const LoyaltyPage = ({ barbershopId }: LoyaltyPageProps) => {
  const { loyaltyCards, coupons, isLoading, addPoint, isAddingPoint, useCoupon, getClientCoupons } = useLoyalty(barbershopId);
  const { clients } = useClients(barbershopId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPointDialogOpen, setIsAddPointDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Cliente";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredCards = loyaltyCards.filter(card => {
    const client = clients.find(c => c.id === card.client_id);
    return client?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCoupons = coupons.filter(c => !c.is_used && new Date(c.expires_at) > new Date());
  const usedCoupons = coupons.filter(c => c.is_used);

  const handleAddPoint = () => {
    if (!selectedClientId) return;
    addPoint(selectedClientId, {
      onSuccess: () => {
        setIsAddPointDialogOpen(false);
        setSelectedClientId("");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Programa de Fidelidade</h2>
          <p className="text-muted-foreground">
            10 pontos = 1 corte grátis. Cada serviço vale 1 ponto.
          </p>
        </div>
        <Button variant="hero" onClick={() => setIsAddPointDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Validar Ponto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/20">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold">{loyaltyCards.length}</p>
          <p className="text-sm text-muted-foreground">Cartões Ativos</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20">
            <Ticket className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{activeCoupons.length}</p>
          <p className="text-sm text-muted-foreground">Cupons Disponíveis</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20">
            <Gift className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{usedCoupons.length}</p>
          <p className="text-sm text-muted-foreground">Cupons Usados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loyalty Cards */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Cartões de Fidelidade</h3>
        
        {filteredCards.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cartão de fidelidade ainda"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCards.map((card) => {
              const clientName = getClientName(card.client_id);
              const clientCoupons = getClientCoupons(card.client_id);
              
              return (
                <div key={card.id} className="glass-card p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(clientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: {card.total_points_earned} pontos
                        </p>
                      </div>
                    </div>
                    {clientCoupons.length > 0 && (
                      <Badge className="bg-green-500 text-white">
                        <Ticket className="w-3 h-3 mr-1" />
                        {clientCoupons.length} cupom(s)
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{card.points}/10 pontos</span>
                      <span className="text-muted-foreground">
                        {10 - card.points} para corte grátis
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded-full transition-colors ${
                            i < card.points ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Client Coupons */}
                  {clientCoupons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-medium mb-2">Cupons disponíveis:</p>
                      <div className="space-y-2">
                        {clientCoupons.map((coupon) => (
                          <div key={coupon.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                            <div>
                              <code className="text-sm font-mono text-green-500">{coupon.code}</code>
                              <p className="text-xs text-muted-foreground">
                                Expira: {format(parseISO(coupon.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => useCoupon(coupon.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Usar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Point Dialog */}
      <Dialog open={isAddPointDialogOpen} onOpenChange={setIsAddPointDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validar Ponto de Fidelidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                {(() => {
                  const card = loyaltyCards.find(c => c.client_id === selectedClientId);
                  const points = card?.points || 0;
                  return (
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {points}/10 pontos atuais
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Após validar: {points + 1}/10 pontos
                      </p>
                      {points + 1 >= 10 && (
                        <Badge className="mt-2 bg-green-500 text-white">
                          🎉 Cupom de corte grátis será gerado!
                        </Badge>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPointDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPoint} disabled={!selectedClientId || isAddingPoint}>
              {isAddingPoint ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Validar Ponto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
