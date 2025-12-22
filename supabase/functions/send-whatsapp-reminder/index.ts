import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  reminder_sent: boolean;
  barbershop_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time and 2 hours from now
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    const todayDate = now.toISOString().split('T')[0];
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const twoHoursLaterHour = String(twoHoursFromNow.getHours()).padStart(2, '0');
    const twoHoursLaterMinute = String(twoHoursFromNow.getMinutes()).padStart(2, '0');
    const threeHoursLaterHour = String(threeHoursFromNow.getHours()).padStart(2, '0');
    const threeHoursLaterMinute = String(threeHoursFromNow.getMinutes()).padStart(2, '0');
    
    const startTimeWindow = `${twoHoursLaterHour}:${twoHoursLaterMinute}`;
    const endTimeWindow = `${threeHoursLaterHour}:${threeHoursLaterMinute}`;

    console.log(`Checking appointments for ${todayDate} between ${startTimeWindow} and ${endTimeWindow}`);

    // Get appointments that are 2 hours from now and haven't had reminders sent
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select('id, client_name, client_phone, date, start_time, reminder_sent, barbershop_id')
      .eq('date', todayDate)
      .eq('reminder_sent', false)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', startTimeWindow)
      .lt('start_time', endTimeWindow);

    if (fetchError) {
      console.error('Error fetching appointments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} appointments to send reminders`);

    const remindersToSend: { id: string; phone: string; message: string }[] = [];

    for (const appointment of appointments || []) {
      // Get barbershop info
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('name, phone, address')
        .eq('id', appointment.barbershop_id)
        .single();

      const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR');
      const formattedTime = appointment.start_time.slice(0, 5);
      
      const message = `Olá ${appointment.client_name}! 👋

🔔 *Lembrete de Agendamento*

📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
📍 Local: ${barbershop?.name || 'Nossa barbearia'}
${barbershop?.address ? `📌 Endereço: ${barbershop.address}` : ''}

Te esperamos! 💈✨

_Este é um lembrete automático._`;

      remindersToSend.push({
        id: appointment.id,
        phone: appointment.client_phone.replace(/\D/g, ''),
        message
      });

      // Mark reminder as sent
      await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appointment.id);

      console.log(`Reminder prepared for ${appointment.client_name} at ${appointment.client_phone}`);
    }

    // Return the reminders that need to be sent
    // In a real implementation, you would integrate with WhatsApp Business API here
    return new Response(
      JSON.stringify({
        success: true,
        reminders_prepared: remindersToSend.length,
        reminders: remindersToSend.map(r => ({
          id: r.id,
          phone: r.phone,
          whatsapp_link: `https://wa.me/55${r.phone}?text=${encodeURIComponent(r.message)}`
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-whatsapp-reminder function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
