require('dotenv').config({ path: '../.env' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize WhatsApp Client with production resilience
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './auth_info' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED (Scan this code):');
    qrcode.generate(qr, { small: true });
    console.log('Aguardando leitura do QR Code...');
});

client.on('ready', () => {
    console.log('✅ Cliente WhatsApp está pronto e conectado!');
    startScheduler();
});

client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
    // Client will try to reconnect automatically with LocalAuth, 
    // but pm2 will also restart the process if it crashes.
});


// Handle incoming messages for confirmation
client.on('message', async msg => {
    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const senderNumber = contact.number; // e.g., '5511999999999'

    // Simple confirmation logic
    // Check if message contains 'sim', 'confirmar', 'ok'
    const messageContent = msg.body.toLowerCase();
    if (['sim', 'confirmar', 'ok', 'confirmo'].some(word => messageContent.includes(word))) {

        // Find pending/confirmed appointment for this phone number for today or tomorrow
        const today = new Date().toISOString().split('T')[0];

        // We need to match the phone number format. 
        // Typically Supabase stores as (11) 99999-9999 or similar.
        // We'll search by trying to match the raw digits.

        // Fetch appointments that are not completed/canceled
        // Note: This is a simplified search. Ideally we'd have exact phone matching.
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*')
            .gte('date', today)
            .in('status', ['confirmed', 'pending']); // Assuming 'confirmed' means initial booking, we want to maybe introduce a 'verified' state? 
        // Or just keep it as confirmed but maybe log the interaction.
        // If the user request is "Perguntando se pode confirmar", maybe the initial status is 'pending'?
        // The prompt says "Perguntando se pode confirmar o seu horario marcado".
        // If the status is already 'confirmed', we can just reply "Obrigado!".

        if (error) {
            console.error('Error checking appointments for reply:', error);
            return;
        }

        // Filter by phone number match
        const matchingAppointment = appointments.find(appt => {
            const storedPhone = appt.client_phone.replace(/\D/g, '');
            return senderNumber === storedPhone || senderNumber === `55${storedPhone}` || `55${senderNumber}` === storedPhone;
        });

        if (matchingAppointment) {
            if (matchingAppointment.status === 'pending') {
                // Update to confirmed
                const { error: updateError } = await supabase
                    .from('appointments')
                    .update({ status: 'confirmed' })
                    .eq('id', matchingAppointment.id);

                if (!updateError) {
                    await chat.sendMessage('✅ Seu horário foi confirmado com sucesso! Obrigado.');
                    console.log(`Appointment ${matchingAppointment.id} confirmed by user.`);
                }
            } else {
                await chat.sendMessage('👍 Seu horário já está confirmado! Te aguardamos.');
            }
        }
    }
});

client.initialize();

// Scheduler Logic
function startScheduler() {
    console.log('Iniciando agendador de lembretes (verificação a cada minuto)...');

    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Format to HH:mm
        const targetTime = twoHoursFromNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const currentDate = now.toISOString().split('T')[0];

        // We want to find appointments that:
        // 1. Are scheduled for TODAY
        // 2. Start time matches targetTime (approx 2 hours from now)
        // 3. Reminder NOT sent yet

        // Because cron runs every minute, we check if start_time starts with our target HH:mm
        // Supposing start_time is "14:30:00" and targetTime is "14:30"

        console.log(`[${now.toLocaleTimeString('pt-BR', { hour12: false })}] Verificando agendamentos para hoje ${currentDate} às ${targetTime}...`);

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                *,
                barbershops (
                    name,
                    phone
                ),
                services (
                    name
                )
            `)
            .eq('date', currentDate)
            .eq('reminder_sent', false)
            .ilike('start_time', `${targetTime}%`) // Match start of time string
            .neq('status', 'canceled')
            .neq('status', 'no_show');

        if (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return;
        }

        if (appointments && appointments.length > 0) {
            console.log(`Encontrados ${appointments.length} agendamentos para enviar lembrete.`);

            for (const appt of appointments) {
                await sendReminder(appt);
            }
        }
    });
}

async function sendReminder(appointment) {
    try {
        const clientPhone = appointment.client_phone.replace(/\D/g, '');
        // Append country code 55 if not present (assuming Brazil)
        const formattedPhone = clientPhone.startsWith('55') ? clientPhone : `55${clientPhone}`;
        const chatId = `${formattedPhone}@c.us`;

        const serviceName = appointment.services ? appointment.services.name : 'serviço';
        const barbershopName = appointment.barbershops ? appointment.barbershops.name : 'Barbearia';

        const message = `Olá ${appointment.client_name}! 👋\n\n` +
            `Lembrando do seu agendamento na *${barbershopName}*:\n\n` +
            `🗓️ Hoje (${appointment.date.split('-').reverse().join('/')})\n` +
            `⏰ às ${appointment.start_time.slice(0, 5)}\n` +
            `💇‍♂️ Serviço: ${serviceName}\n\n` +
            `Pode confirmar sua presença? Responda com *"SIM"* para confirmar.`;

        await client.sendMessage(chatId, message);
        console.log(`Lembrete enviado para ${appointment.client_name} (${formattedPhone})`);

        // Update database to mark reminder as sent
        await supabase
            .from('appointments')
            .update({ reminder_sent: true })
            .eq('id', appointment.id);

    } catch (err) {
        console.error(`Falha ao enviar mensagem para agendamento ${appointment.id}:`, err);
    }
}
