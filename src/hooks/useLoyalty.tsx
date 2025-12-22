import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LoyaltyCard {
  id: string;
  barbershop_id: string;
  client_id: string;
  points: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCoupon {
  id: string;
  barbershop_id: string;
  client_id: string;
  code: string;
  discount_percent: number;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

export const useLoyalty = (barbershopId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loyaltyCards = [], isLoading: isLoadingCards } = useQuery({
    queryKey: ["loyalty-cards", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_cards")
        .select("*")
        .eq("barbershop_id", barbershopId);
      
      if (error) throw error;
      return data as LoyaltyCard[];
    },
    enabled: !!barbershopId,
  });

  const { data: coupons = [], isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["loyalty-coupons", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_coupons")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LoyaltyCoupon[];
    },
    enabled: !!barbershopId,
  });

  const addPointMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { data, error } = await supabase.rpc("add_loyalty_point", {
        _barbershop_id: barbershopId,
        _client_id: clientId,
      });
      
      if (error) throw error;
      return data as { 
        success: boolean; 
        points: number; 
        total_points: number;
        coupon_generated: boolean; 
        coupon_code?: string 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards", barbershopId] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-coupons", barbershopId] });
      
      if (data.coupon_generated && data.coupon_code) {
        toast({
          title: "🎉 Cupom Gerado!",
          description: `Cliente completou 10 pontos! Cupom: ${data.coupon_code}`,
        });
      } else {
        toast({
          title: "✅ Ponto adicionado!",
          description: `Cliente agora tem ${data.points}/10 pontos`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar ponto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const useCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const { data, error } = await supabase
        .from("loyalty_coupons")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", couponId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-coupons", barbershopId] });
      toast({
        title: "✅ Cupom utilizado!",
        description: "Desconto aplicado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao usar cupom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getClientLoyalty = (clientId: string) => {
    return loyaltyCards.find(card => card.client_id === clientId);
  };

  const getClientCoupons = (clientId: string) => {
    return coupons.filter(coupon => coupon.client_id === clientId && !coupon.is_used);
  };

  return {
    loyaltyCards,
    coupons,
    isLoading: isLoadingCards || isLoadingCoupons,
    addPoint: addPointMutation.mutate,
    isAddingPoint: addPointMutation.isPending,
    useCoupon: useCouponMutation.mutate,
    isUsingCoupon: useCouponMutation.isPending,
    getClientLoyalty,
    getClientCoupons,
  };
};
