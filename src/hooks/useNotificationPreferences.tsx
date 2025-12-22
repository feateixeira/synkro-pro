import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  id: string;
  user_id: string;
  barbershop_id: string;
  new_appointment: boolean;
  appointment_canceled: boolean;
  appointment_reminder: boolean;
  reminder_minutes: number;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = (barbershopId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!barbershopId,
  });

  const upsertPreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !barbershopId) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            barbershop_id: barbershopId,
            ...updates,
          },
          { onConflict: "user_id,barbershop_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Preferências salvas",
        description: "Suas configurações de notificação foram atualizadas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    },
  });

  return {
    preferences,
    isLoading,
    upsertPreferences: upsertPreferences.mutate,
    isUpdating: upsertPreferences.isPending,
  };
};
