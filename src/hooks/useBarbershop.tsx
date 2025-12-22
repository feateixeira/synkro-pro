import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  instagram: string | null;
  whatsapp: string | null;
  owner_id: string;
  subscription_status: string;
  trial_ends_at: string;
  plan: string | null;
  revenue_goal: number | null;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  barbershop_id: string | null;
  commission_percentage: number | null;
  is_active: boolean | null;
}

export const useBarbershop = (user: User | null) => {
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // First check if user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError);
      }

      if (profileData) {
        setProfile(profileData);

        if (profileData.barbershop_id) {
          // Fetch barbershop data
          const { data: shopData, error: shopError } = await supabase
            .from("barbershops")
            .select("*")
            .eq("id", profileData.barbershop_id)
            .single();

          if (shopError) {
            console.error("Barbershop error:", shopError);
          } else {
            setBarbershop(shopData);
          }
        } else {
          // Check if user is owner of any barbershop
          const { data: ownedShop } = await supabase
            .from("barbershops")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (ownedShop) {
            setBarbershop(ownedShop);
            // Update profile with barbershop_id
            await supabase
              .from("profiles")
              .update({ barbershop_id: ownedShop.id })
              .eq("user_id", user.id);
          } else {
            setNeedsOnboarding(true);
          }
        }
      } else {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error("Error fetching barbershop data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const createBarbershop = async (name: string, phone?: string, address?: string) => {
    if (!user) return null;

    try {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Create barbershop
      const { data: newShop, error: shopError } = await supabase
        .from("barbershops")
        .insert({
          name,
          slug,
          phone,
          address,
          owner_id: user.id,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Create or update profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({ barbershop_id: newShop.id })
          .eq("user_id", user.id);
      } else {
        await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
          barbershop_id: newShop.id,
        });
      }

      // Create owner role
      await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "owner",
        barbershop_id: newShop.id,
      });

      setBarbershop(newShop);
      setNeedsOnboarding(false);

      toast({
        title: "Barbearia criada!",
        description: `${name} está pronta para uso.`,
      });

      return newShop;
    } catch (error: any) {
      console.error("Error creating barbershop:", error);
      toast({
        title: "Erro ao criar barbearia",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRevenueGoal = async (goal: number | null) => {
    if (!barbershop) return false;

    try {
      const { error } = await supabase
        .from("barbershops")
        .update({ revenue_goal: goal })
        .eq("id", barbershop.id);

      if (error) throw error;

      setBarbershop({ ...barbershop, revenue_goal: goal });

      toast({
        title: "Meta atualizada!",
        description: goal ? `Meta de receita definida para R$ ${goal.toLocaleString('pt-BR')}` : "Meta de receita removida",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating revenue goal:", error);
      toast({
        title: "Erro ao atualizar meta",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    barbershop,
    profile,
    isLoading,
    needsOnboarding,
    createBarbershop,
    updateRevenueGoal,
    refetch: fetchData,
  };
};
