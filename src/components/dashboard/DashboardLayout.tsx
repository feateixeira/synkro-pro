import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOverview } from "./DashboardOverviewNew";
import { AgendaPage } from "./AgendaPage";
import { ClientsPage } from "./ClientsPage";
import { ServicesPage } from "./ServicesPage";
import { TeamPage } from "./TeamPage";
import { ReportsPage } from "./ReportsPage";
import { GalleryPage } from "./GalleryPage";
import { LoyaltyPage } from "./LoyaltyPage";
import { PlansPage } from "./PlansPage";
import { SubscriptionSettingsPage } from "./SubscriptionSettingsPage";
import { SettingsPage } from "./SettingsPage";
import NotificationSettingsPage from "./NotificationSettingsPage";
import NotificationHistoryPage from "./NotificationHistoryPage";
import { Onboarding } from "./Onboarding";
import { MobileBottomNav } from "./MobileBottomNav";
import { useBarbershop } from "@/hooks/useBarbershop";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Copy, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";

interface DashboardLayoutProps {
  user: User;
}

export const DashboardLayout = ({ user }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { barbershop, profile, isLoading, needsOnboarding, createBarbershop, updateRevenueGoal, refetch } = useBarbershop(user);
  const { initializeDefaultHours } = useWorkingHours(barbershop?.id || null);

  const handleSettingsUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  // Calculate trial days remaining
  const trialDaysRemaining = barbershop?.trial_ends_at 
    ? Math.max(0, differenceInDays(parseISO(barbershop.trial_ends_at), new Date()))
    : 0;

  const isTrialExpired = trialDaysRemaining === 0 && barbershop?.subscription_status === 'trialing';
  const needsPaywall = isTrialExpired && barbershop?.subscription_status !== 'active';

  useEffect(() => {
    if (barbershop?.id) {
      initializeDefaultHours();
    }
  }, [barbershop?.id]);

  // Redirect to plans if trial expired and not active
  useEffect(() => {
    if (needsPaywall && activeTab !== 'plans') {
      setActiveTab('plans');
      toast({
        title: "Período de teste expirado",
        description: "Escolha um plano para continuar usando o BarberPro.",
        variant: "destructive",
      });
    }
  }, [needsPaywall, activeTab]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const copyBookingLink = () => {
    if (barbershop) {
      const link = `${window.location.origin}/book/${barbershop.slug}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "Compartilhe com seus clientes.",
      });
    }
  };

  const handleTabChange = (tab: string) => {
    // If paywall is active, only allow plans tab
    if (needsPaywall && tab !== 'plans') {
      toast({
        title: "Acesso bloqueado",
        description: "Assine um plano para continuar usando o sistema.",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={createBarbershop} />;
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        bookingSlug={barbershop.slug}
        onCopyLink={copyBookingLink}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Trial Banner */}
        {showTrialBanner && barbershop.subscription_status === 'trialing' && trialDaysRemaining > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-4 py-2">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Restam <strong>{trialDaysRemaining}</strong> {trialDaysRemaining === 1 ? 'dia' : 'dias'} de teste gratuito
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 h-7 text-xs border-amber-500/50 hover:bg-amber-500/20"
                  onClick={() => handleTabChange('plans')}
                >
                  Ver Planos
                </Button>
              </div>
              <button 
                onClick={() => setShowTrialBanner(false)}
                className="text-amber-300 hover:text-amber-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Expired Trial Banner */}
        {needsPaywall && (
          <div className="bg-gradient-to-r from-red-500/20 to-rose-500/20 border-b border-red-500/30 px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-red-200">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">
                Seu período de teste expirou. Assine um plano para continuar usando o BarberPro.
              </span>
            </div>
          </div>
        )}

        <DashboardHeader 
          user={user}
          barbershopName={barbershop.name}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {activeTab === "overview" && <DashboardOverview barbershopId={barbershop.id} />}
          {activeTab === "agenda" && <AgendaPage barbershopId={barbershop.id} />}
          {activeTab === "clients" && <ClientsPage barbershopId={barbershop.id} />}
          {activeTab === "services" && <ServicesPage barbershopId={barbershop.id} />}
          {activeTab === "team" && <TeamPage barbershopId={barbershop.id} />}
          {activeTab === "gallery" && <GalleryPage barbershopId={barbershop.id} />}
          {activeTab === "loyalty" && <LoyaltyPage barbershopId={barbershop.id} />}
          {activeTab === "reports" && (
            <ReportsPage 
              barbershopId={barbershop.id} 
              revenueGoal={barbershop.revenue_goal}
              onUpdateRevenueGoal={updateRevenueGoal}
            />
          )}
          {activeTab === "plans" && (
            <PlansPage 
              barbershopId={barbershop.id} 
              currentPlan={barbershop.plan || undefined}
              subscriptionStatus={barbershop.subscription_status}
            />
          )}
          {activeTab === "subscription" && (
            <SubscriptionSettingsPage 
              barbershopId={barbershop.id} 
              subscriptionStatus={barbershop.subscription_status}
            />
          )}
          {activeTab === "settings" && profile && (
            <SettingsPage 
              barbershopId={barbershop.id} 
              barbershop={barbershop}
              profile={profile}
              onUpdate={handleSettingsUpdate}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationSettingsPage barbershopId={barbershop.id} />
          )}
          {activeTab === "notification-history" && (
            <NotificationHistoryPage />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
