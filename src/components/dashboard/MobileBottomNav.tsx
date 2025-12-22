import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Image, 
  MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Briefcase, 
  UserCog, 
  Award, 
  BarChart3, 
  CreditCard, 
  Settings 
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainNavItems = [
  { id: "overview", label: "Início", icon: LayoutDashboard },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "gallery", label: "Galeria", icon: Image },
];

const moreNavItems = [
  { id: "services", label: "Serviços", icon: Briefcase },
  { id: "team", label: "Equipe", icon: UserCog },
  { id: "loyalty", label: "Fidelidade", icon: Award },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "settings", label: "Configurações", icon: Settings },
];

export const MobileBottomNav = ({ activeTab, onTabChange }: MobileBottomNavProps) => {
  const isMoreActive = moreNavItems.some(item => item.id === activeTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-200",
              activeTab === item.id && "bg-primary/20"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                activeTab === item.id && "scale-110"
              )} />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-all duration-200",
              activeTab === item.id && "font-semibold"
            )}>
              {item.label}
            </span>
          </button>
        ))}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                isMoreActive && "bg-primary/20"
              )}>
                <MoreHorizontal className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isMoreActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isMoreActive && "font-semibold"
              )}>
                Mais
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            side="top" 
            className="w-48 mb-2"
          >
            {moreNavItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "gap-3 cursor-pointer",
                  activeTab === item.id && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
};
