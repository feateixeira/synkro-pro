import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  preferences: string | null;
  last_visit_at: string | null;
  total_visits: number | null;
  total_spent: number | null;
  created_at: string;
  updated_at: string;
}

export const useClients = (barbershopId: string | null) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    if (!barbershopId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (client: Omit<Client, "id" | "created_at" | "updated_at" | "barbershop_id" | "last_visit_at" | "total_visits" | "total_spent">) => {
    if (!barbershopId) return null;

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...client,
          barbershop_id: barbershopId,
        })
        .select()
        .single();

      if (error) throw error;

      setClients((prev) => [...prev, data]);
      toast({
        title: "Cliente cadastrado!",
        description: `${client.name} foi adicionado.`,
      });
      return data;
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setClients((prev) => prev.map((c) => (c.id === id ? data : c)));
      toast({
        title: "Cliente atualizado!",
      });
      return data;
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) throw error;

      setClients((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Cliente removido!",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    clients,
    isLoading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
};
