import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useServices = (barbershopId: string | null) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    if (!barbershopId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error("Error fetching services:", error);
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (service: Omit<Service, "id" | "created_at" | "updated_at" | "barbershop_id">) => {
    if (!barbershopId) return null;

    try {
      const { data, error } = await supabase
        .from("services")
        .insert({
          ...service,
          barbershop_id: barbershopId,
        })
        .select()
        .single();

      if (error) throw error;

      setServices((prev) => [...prev, data]);
      toast({
        title: "Serviço criado!",
        description: `${service.name} foi adicionado.`,
      });
      return data;
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setServices((prev) => prev.map((s) => (s.id === id ? data : s)));
      toast({
        title: "Serviço atualizado!",
      });
      return data;
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) throw error;

      setServices((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "Serviço removido!",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({
        title: "Erro ao remover serviço",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    services,
    isLoading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices,
  };
};
