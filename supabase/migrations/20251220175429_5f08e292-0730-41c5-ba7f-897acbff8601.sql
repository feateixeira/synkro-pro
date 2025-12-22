-- Add payment customer id to barbershops
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS payment_customer_id TEXT;

-- Create loyalty_cards table
CREATE TABLE public.loyalty_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, client_id)
);

-- Enable RLS on loyalty_cards
ALTER TABLE public.loyalty_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_cards
CREATE POLICY "Users can view loyalty cards in their barbershop"
ON public.loyalty_cards FOR SELECT
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

CREATE POLICY "Users can manage loyalty cards in their barbershop"
ON public.loyalty_cards FOR ALL
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

-- Create loyalty_coupons table for generated coupons
CREATE TABLE public.loyalty_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 100,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loyalty_coupons
ALTER TABLE public.loyalty_coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_coupons
CREATE POLICY "Users can view coupons in their barbershop"
ON public.loyalty_coupons FOR SELECT
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

CREATE POLICY "Users can manage coupons in their barbershop"
ON public.loyalty_coupons FOR ALL
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gallery_images
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for gallery_images
CREATE POLICY "Public can view gallery images"
ON public.gallery_images FOR SELECT
USING (true);

CREATE POLICY "Users can manage gallery images in their barbershop"
ON public.gallery_images FOR ALL
USING (barbershop_id = get_user_barbershop_id(auth.uid()));

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own gallery images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

-- Add trigger for updated_at on loyalty_cards
CREATE TRIGGER update_loyalty_cards_updated_at
BEFORE UPDATE ON public.loyalty_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add loyalty point and generate coupon if 10 points
CREATE OR REPLACE FUNCTION public.add_loyalty_point(
  _barbershop_id UUID,
  _client_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _loyalty_card loyalty_cards%ROWTYPE;
  _coupon_code TEXT;
  _result JSONB;
BEGIN
  -- Get or create loyalty card
  INSERT INTO public.loyalty_cards (barbershop_id, client_id, points, total_points_earned)
  VALUES (_barbershop_id, _client_id, 1, 1)
  ON CONFLICT (barbershop_id, client_id)
  DO UPDATE SET 
    points = loyalty_cards.points + 1,
    total_points_earned = loyalty_cards.total_points_earned + 1,
    updated_at = now()
  RETURNING * INTO _loyalty_card;
  
  -- Check if client has 10 or more points
  IF _loyalty_card.points >= 10 THEN
    -- Generate unique coupon code
    _coupon_code := 'FIDELIDADE-' || upper(substr(md5(random()::text), 1, 8));
    
    -- Create coupon
    INSERT INTO public.loyalty_coupons (barbershop_id, client_id, code, discount_percent)
    VALUES (_barbershop_id, _client_id, _coupon_code, 100);
    
    -- Reset points
    UPDATE public.loyalty_cards 
    SET points = 0, updated_at = now()
    WHERE id = _loyalty_card.id;
    
    _result := jsonb_build_object(
      'success', true,
      'points', 0,
      'total_points', _loyalty_card.total_points_earned,
      'coupon_generated', true,
      'coupon_code', _coupon_code
    );
  ELSE
    _result := jsonb_build_object(
      'success', true,
      'points', _loyalty_card.points,
      'total_points', _loyalty_card.total_points_earned,
      'coupon_generated', false
    );
  END IF;
  
  RETURN _result;
END;
$$;