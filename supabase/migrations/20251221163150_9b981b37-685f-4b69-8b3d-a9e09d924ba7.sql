-- Adicionar coluna stripe_customer_id à tabela barbershops para armazenar ID do cliente Stripe
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;