import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  appointment_id: string;
  barbershop_id: string;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  service_name?: string;
  barber_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotifyPayload = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('New appointment notification:', payload);

    // Get barbershop info
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('name, phone, owner_id')
      .eq('id', payload.barbershop_id)
      .single();

    if (!barbershop) {
      throw new Error('Barbershop not found');
    }

    // Get owner profile for notification
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('user_id', barbershop.owner_id)
      .single();

    const formattedDate = new Date(payload.date).toLocaleDateString('pt-BR');
    const formattedTime = payload.start_time.slice(0, 5);

    // Message for the barbershop owner
    const ownerMessage = `🔔 *Novo Agendamento!*

👤 Cliente: ${payload.client_name}
📱 Telefone: ${payload.client_phone}
📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
${payload.service_name ? `💇 Serviço: ${payload.service_name}` : ''}
${payload.barber_name ? `✂️ Barbeiro: ${payload.barber_name}` : ''}

Acesse o sistema para mais detalhes.`;

    // Confirmation message for the client
    const clientMessage = `Olá ${payload.client_name}! ✅

Seu agendamento foi *confirmado*!

📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
📍 Local: ${barbershop.name}
${payload.service_name ? `💇 Serviço: ${payload.service_name}` : ''}

Você receberá um lembrete 2 horas antes do horário.

Qualquer dúvida, entre em contato: ${barbershop.phone || 'pelo chat'}

Te esperamos! 💈`;

    const clientPhone = payload.client_phone.replace(/\D/g, '');
    const ownerPhone = (ownerProfile?.phone || barbershop.phone || '').replace(/\D/g, '');

    const response = {
      success: true,
      notifications: {
        client: {
          phone: clientPhone,
          whatsapp_link: `https://wa.me/55${clientPhone}?text=${encodeURIComponent(clientMessage)}`
        },
        owner: ownerPhone ? {
          phone: ownerPhone,
          whatsapp_link: `https://wa.me/55${ownerPhone}?text=${encodeURIComponent(ownerMessage)}`
        } : null
      }
    };

    console.log('Notifications prepared:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in notify-new-appointment function:', error);
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
