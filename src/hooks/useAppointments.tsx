import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Appointment {
  id: string;
  barbershop_id: string;
  barber_id: string;
  client_id: string | null;
  client_name: string;
  client_phone: string;
  service_id: string | null;
  team_member_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  status: "pending" | "confirmed" | "completed" | "canceled" | "no_show";
  notes: string | null;
  reminder_sent: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useAppointments = (barbershopId: string | null) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async (date?: string) => {
    if (!barbershopId) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const sendNotification = async (
    appointmentData: Appointment, 
    type: "new_appointment" | "appointment_canceled" | "appointment_reminder",
    serviceName?: string
  ) => {
    try {
      await supabase.functions.invoke("create-notification", {
        body: {
          barbershop_id: appointmentData.barbershop_id,
          appointment_id: appointmentData.id,
          type,
          client_name: appointmentData.client_name,
          service_name: serviceName,
          date: appointmentData.date,
          time: appointmentData.start_time,
        },
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const createAppointment = async (appointment: Omit<Appointment, "id" | "created_at" | "updated_at" | "reminder_sent">, serviceName?: string) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert(appointment)
        .select()
        .single();

      if (error) throw error;

      setAppointments((prev) => [...prev, data].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      }));
      
      // Send notification for new appointment
      await sendNotification(data, "new_appointment", serviceName);
      
      toast({
        title: "Agendamento criado!",
        description: `${appointment.client_name} - ${appointment.date} às ${appointment.start_time}`,
      });
      return data;
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)));
      toast({
        title: "Agendamento atualizado!",
      });
      return data;
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const cancelAppointment = async (id: string) => {
    const appointment = appointments.find(a => a.id === id);
    const result = await updateAppointment(id, { status: "canceled" });
    
    // Send notification for canceled appointment
    if (result && appointment) {
      await sendNotification(result, "appointment_canceled");
    }
    
    return result;
  };

  const completeAppointment = async (id: string) => {
    return updateAppointment(id, { status: "completed" });
  };

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    refetch: fetchAppointments,
  };
};
