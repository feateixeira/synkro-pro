import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useTeam } from "@/hooks/useTeam";
import { format, subDays, startOfWeek, endOfWeek, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardOverviewProps {
  barbershopId: string;
}

export const DashboardOverview = ({ barbershopId }: DashboardOverviewProps) => {
  const { appointments, isLoading: loadingAppointments } = useAppointments(barbershopId);
  const { clients, isLoading: loadingClients } = useClients(barbershopId);
  const { services } = useServices(barbershopId);
  const { team } = useTeam(barbershopId);

  const isLoading = loadingAppointments || loadingClients;

  // Calculate stats
  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter((a) => a.date === today);
  const completedToday = todayAppointments.filter((a) => a.status === "completed");
  const revenueToday = completedToday.reduce((sum, a) => sum + Number(a.price), 0);

  // This week's revenue
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekAppointments = appointments.filter((a) => {
    const date = parseISO(a.date);
    return date >= weekStart && a.status === "completed";
  });
  const weekRevenue = thisWeekAppointments.reduce((sum, a) => sum + Number(a.price), 0);

  // Calculate average ticket
  const avgTicket = completedToday.length > 0 
    ? revenueToday / completedToday.length 
    : 0;

  // New clients this week
  const newClientsThisWeek = clients.filter((c) => {
    const created = parseISO(c.created_at);
    return created >= weekStart;
  }).length;

  // Weekly revenue data for chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayAppointments = appointments.filter(
      (a) => a.date === dateStr && a.status === "completed"
    );
    const revenue = dayAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    return {
      name: format(date, "EEE", { locale: ptBR }),
      value: revenue,
    };
  });

  // Appointments by hour for today
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const hourStr = `${String(hour).padStart(2, "0")}:`;
    const count = todayAppointments.filter((a) => a.start_time.startsWith(hourStr)).length;
    return {
      name: `${String(hour).padStart(2, "0")}:00`,
      value: count,
    };
  });

  const stats = [
    {
      label: "Receita Hoje",
      value: `R$ ${revenueToday.toFixed(0)}`,
      change: "+12%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      label: "Agendamentos Hoje",
      value: String(todayAppointments.length),
      change: `${completedToday.length} concluídos`,
      trend: "up" as const,
      icon: Calendar,
    },
    {
      label: "Ticket Médio",
      value: `R$ ${avgTicket.toFixed(0)}`,
      change: "+8%",
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      label: "Clientes Novos",
      value: String(newClientsThisWeek),
      change: "esta semana",
      trend: newClientsThisWeek > 0 ? "up" as const : "down" as const,
      icon: Users,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return "Serviço";
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "Serviço";
  };

  const getBarberName = (barberId: string) => {
    const barber = team.find((m) => m.id === barberId);
    return barber?.name || "Barbeiro";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === "up" ? "text-green-500" : "text-muted-foreground"
              }`}>
                {stat.trend === "up" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : null}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card p-5">
          <h3 className="font-display text-lg font-semibold mb-4">Receita Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(43, 96%, 56%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(0, 0%, 55%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(0, 0%, 55%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 8%)",
                    border: "1px solid hsl(0, 0%, 16%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(45, 10%, 95%)" }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Receita"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(43, 96%, 56%)" 
                  strokeWidth={2}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Hour */}
        <div className="glass-card p-5">
          <h3 className="font-display text-lg font-semibold mb-4">Agendamentos por Hora</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(0, 0%, 55%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(0, 0%, 55%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 8%)",
                    border: "1px solid hsl(0, 0%, 16%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(45, 10%, 95%)" }}
                  formatter={(value: number) => [value, "Agendamentos"]}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(43, 96%, 56%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Agenda de Hoje</h3>
          <span className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        
        {todayAppointments.length > 0 ? (
          <div className="space-y-3">
            {todayAppointments.slice(0, 5).map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-2 text-primary font-medium min-w-[60px]">
                  <Clock className="w-4 h-4" />
                  {appointment.start_time.slice(0, 5)}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {getInitials(appointment.client_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{appointment.client_name}</p>
                  <p className="text-sm text-muted-foreground">{getServiceName(appointment.service_id)}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {getBarberName(appointment.barber_id)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        )}
      </div>
    </div>
  );
};
