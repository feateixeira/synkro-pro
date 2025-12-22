import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorkingHour {
  id: string;
  barbershop_id: string;
  barber_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | null;
  created_at: string;
}

const DEFAULT_WORKING_HOURS = [
  { day_of_week: 1, start_time: "09:00", end_time: "19:00" }, // Monday
  { day_of_week: 2, start_time: "09:00", end_time: "19:00" }, // Tuesday
  { day_of_week: 3, start_time: "09:00", end_time: "19:00" }, // Wednesday
  { day_of_week: 4, start_time: "09:00", end_time: "19:00" }, // Thursday
  { day_of_week: 5, start_time: "09:00", end_time: "19:00" }, // Friday
  { day_of_week: 6, start_time: "09:00", end_time: "17:00" }, // Saturday
];

export const useWorkingHours = (barbershopId: string | null) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkingHours = useCallback(async () => {
    if (!barbershopId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("day_of_week");

      if (error) throw error;
      setWorkingHours(data || []);
    } catch (error: any) {
      console.error("Error fetching working hours:", error);
      toast({
        title: "Erro ao carregar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchWorkingHours();
  }, [fetchWorkingHours]);

  const initializeDefaultHours = async () => {
    if (!barbershopId) return;

    try {
      const { data: existing } = await supabase
        .from("working_hours")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .limit(1);

      if (existing && existing.length > 0) return;

      const hours = DEFAULT_WORKING_HOURS.map((h) => ({
        ...h,
        barbershop_id: barbershopId,
        is_active: true,
      }));

      const { error } = await supabase.from("working_hours").insert(hours);

      if (error) throw error;

      await fetchWorkingHours();
    } catch (error: any) {
      console.error("Error initializing working hours:", error);
    }
  };

  const updateWorkingHour = async (id: string, updates: Partial<WorkingHour>) => {
    try {
      const { data, error } = await supabase
        .from("working_hours")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setWorkingHours((prev) => prev.map((h) => (h.id === id ? data : h)));
      return data;
    } catch (error: any) {
      console.error("Error updating working hours:", error);
      toast({
        title: "Erro ao atualizar horário",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    workingHours,
    isLoading,
    initializeDefaultHours,
    updateWorkingHour,
    refetch: fetchWorkingHours,
  };
};
