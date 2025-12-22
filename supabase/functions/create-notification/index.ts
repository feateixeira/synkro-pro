import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  barbershop_id: string;
  appointment_id: string;
  type: "new_appointment" | "appointment_canceled" | "appointment_reminder";
  client_name: string;
  service_name?: string;
  date: string;
  time: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log("Creating notification:", payload);

    // Get barbershop owner
    const { data: barbershop, error: barbershopError } = await supabase
      .from("barbershops")
      .select("owner_id, name")
      .eq("id", payload.barbershop_id)
      .single();

    if (barbershopError || !barbershop) {
      console.error("Barbershop not found:", barbershopError);
      return new Response(
        JSON.stringify({ error: "Barbershop not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build notification content based on type
    let title: string;
    let message: string;

    switch (payload.type) {
      case "new_appointment":
        title = "Novo Agendamento";
        message = `${payload.client_name} agendou ${payload.service_name || "um serviço"} para ${payload.date} às ${payload.time}`;
        break;
      case "appointment_canceled":
        title = "Agendamento Cancelado";
        message = `${payload.client_name} cancelou o agendamento de ${payload.date} às ${payload.time}`;
        break;
      case "appointment_reminder":
        title = "Lembrete de Agendamento";
        message = `${payload.client_name} tem um agendamento em breve - ${payload.date} às ${payload.time}`;
        break;
      default:
        title = "Notificação";
        message = "Você tem uma nova notificação";
    }

    // Create notification for barbershop owner
    const { error: insertError } = await supabase
      .from("notifications")
      .insert({
        barbershop_id: payload.barbershop_id,
        user_id: barbershop.owner_id,
        type: payload.type,
        title,
        message,
        appointment_id: payload.appointment_id,
      });

    if (insertError) {
      console.error("Error inserting notification:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create notification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also notify team members if they are linked to users
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("email")
      .eq("barbershop_id", payload.barbershop_id)
      .eq("is_active", true);

    if (teamMembers && teamMembers.length > 0) {
      // Get user IDs for team members by email
      for (const member of teamMembers) {
        if (member.email) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("email", member.email)
            .single();

          if (profile?.user_id && profile.user_id !== barbershop.owner_id) {
            await supabase
              .from("notifications")
              .insert({
                barbershop_id: payload.barbershop_id,
                user_id: profile.user_id,
                type: payload.type,
                title,
                message,
                appointment_id: payload.appointment_id,
              });
          }
        }
      }
    }

    console.log("Notification created successfully");
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in create-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
