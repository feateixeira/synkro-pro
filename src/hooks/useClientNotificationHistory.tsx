import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClientNotificationHistory {
  id: string;
  barbershop_id: string;
  appointment_id: string | null;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  notification_type: string;
  channel: string;
  message: string;
  status: string;
  sent_at: string;
  created_at: string;
}

export const useClientNotificationHistory = () => {
  const [barbershopId, setBarbershopId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarbershopId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("barbershop_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.barbershop_id) {
        setBarbershopId(profile.barbershop_id);
      }
    };
    fetchBarbershopId();
  }, []);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["client-notification-history", barbershopId],
    queryFn: async () => {
      if (!barbershopId) return [];

      const { data, error } = await supabase
        .from("client_notification_history")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as ClientNotificationHistory[];
    },
    enabled: !!barbershopId,
  });

  return {
    history,
    isLoading,
  };
};
