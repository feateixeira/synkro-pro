import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  UserCog,
  BarChart3,
  Settings,
  X,
  Globe,
  Copy,
  Image,
  Award,
  CreditCard,
  Bell,
  History
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import synkroLogo from "@/assets/synkro-logo.png";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  bookingSlug?: string;
  onCopyLink?: () => void;
}

const navItems = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "services", label: "Serviços", icon: Briefcase },
  { id: "team", label: "Equipe", icon: UserCog },
  { id: "gallery", label: "Galeria", icon: Image },
  { id: "loyalty", label: "Fidelidade", icon: Award },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "plans", label: "Planos", icon: CreditCard },
];

export const DashboardSidebar = ({ isOpen, onClose, activeTab, onTabChange, bookingSlug, onCopyLink }: DashboardSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img src={synkroLogo} alt="Synkro" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-lg font-bold text-sidebar-foreground">Synkro</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              activeTab === item.id ? "text-primary" : "text-muted-foreground"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-2 mt-auto border-t border-sidebar-border/50 bg-sidebar">
        {bookingSlug && (
          <div className="flex items-center gap-2 mb-4">
            <Link
              to={`/book/${bookingSlug}`}
              target="_blank"
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
            >
              <Globe className="w-5 h-5 text-muted-foreground" />
              Página de Agendamento
            </Link>
            {onCopyLink && (
              <button
                onClick={onCopyLink}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                title="Copiar link"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => {
              onTabChange("notification-history");
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "notification-history"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <History className={cn(
              "w-5 h-5",
              activeTab === "notification-history" ? "text-primary" : "text-muted-foreground"
            )} />
            Histórico de Envios
          </button>
          <button
            onClick={() => {
              onTabChange("notifications");
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "notifications"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Bell className={cn(
              "w-5 h-5",
              activeTab === "notifications" ? "text-primary" : "text-muted-foreground"
            )} />
            Notificações
          </button>
          <button
            onClick={() => {
              onTabChange("settings");
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "settings"
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Settings className={cn(
              "w-5 h-5",
              activeTab === "settings" ? "text-primary" : "text-muted-foreground"
            )} />
            Configurações
          </button>
        </div>
      </div>
    </aside>
  );
};
