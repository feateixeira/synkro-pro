import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  barbershop_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  commission_percentage: number | null;
  is_active: boolean | null;
  specialties: string[] | null;
  bio: string | null;
  revenue_goal: number | null;
  created_at: string;
  updated_at: string;
}

export const useTeam = (barbershopId: string | null) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeam = useCallback(async () => {
    if (!barbershopId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("name");

      if (error) throw error;
      setTeam(data || []);
    } catch (error: any) {
      console.error("Error fetching team:", error);
      toast({
        title: "Erro ao carregar equipe",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const addMember = async (member: Omit<TeamMember, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .insert(member)
        .select()
        .single();

      if (error) throw error;

      setTeam((prev) => [...prev, data]);
      toast({
        title: "Membro adicionado!",
        description: `${member.name} foi adicionado à equipe.`,
      });
      return data;
    } catch (error: any) {
      console.error("Error adding team member:", error);
      toast({
        title: "Erro ao adicionar membro",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setTeam((prev) => prev.map((m) => (m.id === id ? data : m)));
      toast({
        title: "Membro atualizado!",
      });
      return data;
    } catch (error: any) {
      console.error("Error updating team member:", error);
      toast({
        title: "Erro ao atualizar membro",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTeam((prev) => prev.filter((m) => m.id !== id));
      toast({
        title: "Membro removido!",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateMember(id, { is_active: isActive });
  };

  const updateRevenueGoal = async (id: string, goal: number | null) => {
    return updateMember(id, { revenue_goal: goal });
  };

  return {
    team,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    toggleActive,
    updateRevenueGoal,
    refetch: fetchTeam,
  };
};
