-- Create table for client notification history
CREATE TABLE public.client_notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'reminder', 'confirmation', 'cancellation'
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email'
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view notification history in their barbershop"
ON public.client_notification_history
FOR SELECT
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

CREATE POLICY "Service role can insert notification history"
ON public.client_notification_history
FOR INSERT
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_client_notification_history_barbershop ON public.client_notification_history(barbershop_id);
CREATE INDEX idx_client_notification_history_sent_at ON public.client_notification_history(sent_at DESC);