-- ===== BARBERPRO SAAS DATABASE SCHEMA =====

-- Enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'inactive');

-- Enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'canceled', 'no_show');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'barber', 'admin');

-- ===== BARBERSHOPS (Tenants) =====
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 days'),
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== USER PROFILES =====
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'barber',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, barbershop_id)
);

-- ===== SERVICES =====
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== CLIENTS =====
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  preferences TEXT,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== APPOINTMENTS =====
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== BLOCKED TIMES (lunch breaks, days off) =====
CREATE TABLE public.blocked_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== WORKING HOURS =====
CREATE TABLE public.working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== COMMISSIONS =====
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===== SUBSCRIPTION PLANS =====
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  max_barbers INTEGER DEFAULT 1,
  max_clients INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.plans (name, display_name, price, features, max_barbers, max_clients) VALUES
('starter', 'Starter', 49.90, '["Agendamento Online", "1 Barbeiro", "Até 100 Clientes", "Dashboard Básico"]', 1, 100),
('pro', 'Pro', 99.90, '["Agendamento Online", "Até 5 Barbeiros", "Clientes Ilimitados", "Dashboard Completo", "Relatórios Avançados", "Comissões"]', 5, NULL),
('elite', 'Elite', 199.90, '["Agendamento Online", "Barbeiros Ilimitados", "Clientes Ilimitados", "Dashboard Completo", "Relatórios Avançados", "Comissões", "API WhatsApp", "Suporte Prioritário"]', NULL, NULL);

-- ===== ENABLE ROW LEVEL SECURITY =====
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- ===== SECURITY DEFINER FUNCTIONS =====

-- Get user's barbershop ID
CREATE OR REPLACE FUNCTION public.get_user_barbershop_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barbershop_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Check if user has role in barbershop
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== RLS POLICIES =====

-- Plans are public
CREATE POLICY "Plans are viewable by everyone" ON public.plans FOR SELECT USING (true);

-- Barbershops
CREATE POLICY "Owners can view their barbershops" ON public.barbershops
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their barbershops" ON public.barbershops
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create barbershops" ON public.barbershops
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles
CREATE POLICY "Users can view profiles in their barbershop" ON public.profiles
  FOR SELECT USING (
    user_id = auth.uid() OR 
    barbershop_id = public.get_user_barbershop_id(auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Roles
CREATE POLICY "Users can view roles in their barbershop" ON public.user_roles
  FOR SELECT USING (
    user_id = auth.uid() OR 
    barbershop_id = public.get_user_barbershop_id(auth.uid())
  );

CREATE POLICY "Owners can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- Services
CREATE POLICY "Users can view services in their barbershop" ON public.services
  FOR SELECT USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

CREATE POLICY "Owners can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE id = barbershop_id AND owner_id = auth.uid())
  );

-- Public policy for booking engine
CREATE POLICY "Public can view active services by barbershop slug" ON public.services
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.barbershops WHERE id = barbershop_id
    )
  );

-- Clients
CREATE POLICY "Users can view clients in their barbershop" ON public.clients
  FOR SELECT USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

CREATE POLICY "Users can manage clients in their barbershop" ON public.clients
  FOR ALL USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

-- Appointments
CREATE POLICY "Users can view appointments in their barbershop" ON public.appointments
  FOR SELECT USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

CREATE POLICY "Users can manage appointments in their barbershop" ON public.appointments
  FOR ALL USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

-- Public can create appointments (booking engine)
CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Blocked Times
CREATE POLICY "Users can view blocked times in their barbershop" ON public.blocked_times
  FOR SELECT USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

CREATE POLICY "Users can manage blocked times" ON public.blocked_times
  FOR ALL USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

-- Working Hours
CREATE POLICY "Users can view working hours in their barbershop" ON public.working_hours
  FOR SELECT USING (barbershop_id = public.get_user_barbershop_id(auth.uid()));

CREATE POLICY "Owners can manage working hours" ON public.working_hours
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE id = barbershop_id AND owner_id = auth.uid())
  );

-- Commissions
CREATE POLICY "Users can view their own commissions" ON public.commissions
  FOR SELECT USING (
    barber_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    barbershop_id = public.get_user_barbershop_id(auth.uid())
  );

CREATE POLICY "Owners can manage commissions" ON public.commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE id = barbershop_id AND owner_id = auth.uid())
  );

-- ===== TRIGGERS =====

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply update triggers
CREATE TRIGGER update_barbershops_updated_at BEFORE UPDATE ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== INDEXES =====
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_barbershop_id ON public.profiles(barbershop_id);
CREATE INDEX idx_appointments_date ON public.appointments(date);
CREATE INDEX idx_appointments_barbershop_id ON public.appointments(barbershop_id);
CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
CREATE INDEX idx_clients_barbershop_id ON public.clients(barbershop_id);
CREATE INDEX idx_services_barbershop_id ON public.services(barbershop_id);
CREATE INDEX idx_barbershops_slug ON public.barbershops(slug);