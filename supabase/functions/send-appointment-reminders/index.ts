import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration: send reminder X minutes before appointment
const REMINDER_MINUTES_BEFORE = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting appointment reminder check...");

    // Get current time in Brazil timezone (most barbershops are in Brazil based on the app)
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];
    
    // Calculate the time window for reminders (now + REMINDER_MINUTES_BEFORE)
    const reminderTime = new Date(now.getTime() + REMINDER_MINUTES_BEFORE * 60 * 1000);
    const reminderTimeStr = reminderTime.toTimeString().slice(0, 5); // HH:MM format
    const currentTimeStr = now.toTimeString().slice(0, 5);

    console.log(`Looking for appointments between ${currentTimeStr} and ${reminderTimeStr} on ${todayDate}`);

    // Find appointments that are:
    // 1. Today
    // 2. Start time is within the reminder window
    // 3. Status is pending or confirmed
    // 4. Reminder not yet sent
    const { data: upcomingAppointments, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        barbershop_id,
        client_name,
        client_phone,
        date,
        start_time,
        service_id,
        team_member_id,
        services:service_id (name)
      `)
      .eq("date", todayDate)
      .gte("start_time", currentTimeStr)
      .lte("start_time", reminderTimeStr)
      .in("status", ["pending", "confirmed"])
      .eq("reminder_sent", false);

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${upcomingAppointments?.length || 0} appointments needing reminders`);

    if (!upcomingAppointments || upcomingAppointments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments needing reminders", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notificationsSent = 0;
    let errors: string[] = [];

    for (const appointment of upcomingAppointments) {
      try {
        // Get barbershop owner
        const { data: barbershop, error: barbershopError } = await supabase
          .from("barbershops")
          .select("owner_id, name")
          .eq("id", appointment.barbershop_id)
          .single();

        if (barbershopError || !barbershop) {
          console.error(`Barbershop not found for appointment ${appointment.id}`);
          errors.push(`Barbershop not found for ${appointment.id}`);
          continue;
        }

        const serviceName = (appointment.services as any)?.name || "serviço agendado";
        const reminderMessage = `Olá ${appointment.client_name}! Lembrete: você tem ${serviceName} às ${appointment.start_time} na ${barbershop.name}. Até logo!`;

        // Create notification for owner
        const { error: notifyError } = await supabase
          .from("notifications")
          .insert({
            barbershop_id: appointment.barbershop_id,
            user_id: barbershop.owner_id,
            type: "appointment_reminder",
            title: "Lembrete de Agendamento",
            message: `${appointment.client_name} tem ${serviceName} em ${REMINDER_MINUTES_BEFORE} minutos (${appointment.start_time})`,
            appointment_id: appointment.id,
          });

        if (notifyError) {
          console.error(`Error creating notification for appointment ${appointment.id}:`, notifyError);
          errors.push(`Notification failed for ${appointment.id}: ${notifyError.message}`);
          continue;
        }

        // Log to client notification history
        const { error: historyError } = await supabase
          .from("client_notification_history")
          .insert({
            barbershop_id: appointment.barbershop_id,
            appointment_id: appointment.id,
            client_name: appointment.client_name,
            client_phone: appointment.client_phone,
            notification_type: "reminder",
            channel: "whatsapp",
            message: reminderMessage,
            status: "sent",
          });

        if (historyError) {
          console.error(`Error logging notification history for appointment ${appointment.id}:`, historyError);
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appointment.id);

        if (updateError) {
          console.error(`Error updating reminder_sent for appointment ${appointment.id}:`, updateError);
          errors.push(`Update failed for ${appointment.id}: ${updateError.message}`);
          continue;
        }

        notificationsSent++;
        console.log(`Reminder sent for appointment ${appointment.id} - ${appointment.client_name}`);

      } catch (appointmentError) {
        const errorMessage = appointmentError instanceof Error ? appointmentError.message : "Unknown error";
        console.error(`Error processing appointment ${appointment.id}:`, errorMessage);
        errors.push(`Processing failed for ${appointment.id}: ${errorMessage}`);
      }
    }

    console.log(`Reminder job completed. Sent: ${notificationsSent}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notificationsSent} reminders`,
        total_appointments: upcomingAppointments.length,
        notifications_sent: notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
