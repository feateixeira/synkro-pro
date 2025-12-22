import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { useTeam } from "@/hooks/useTeam";
import { 
  TrendingUp, Users, DollarSign, BarChart3, 
  Crown, Calendar, UserCheck, Percent
} from "lucide-react";
import { 
  format, parseISO, startOfMonth, endOfMonth, 
  subMonths, differenceInDays 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface OwnerDashboardProps {
  barbershopId: string;
  barbershopName: string;
  trialEndsAt: string;
  subscriptionStatus: string;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export const OwnerDashboard = ({ 
  barbershopId, 
  barbershopName,
  trialEndsAt,
  subscriptionStatus 
}: OwnerDashboardProps) => {
  const { appointments } = useAppointments(barbershopId);
  const { services } = useServices(barbershopId);
  const { clients } = useClients(barbershopId);
  const { team } = useTeam(barbershopId);

  // Calculate metrics
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // This month's data
  const thisMonthAppointments = appointments.filter(a => {
    const date = parseISO(a.date);
    return date >= monthStart && date <= monthEnd && a.status === "completed";
  });

  const lastMonthAppointments = appointments.filter(a => {
    const date = parseISO(a.date);
    return date >= lastMonthStart && date <= lastMonthEnd && a.status === "completed";
  });

  const thisMonthRevenue = thisMonthAppointments.reduce((sum, a) => sum + Number(a.price), 0);
  const lastMonthRevenue = lastMonthAppointments.reduce((sum, a) => sum + Number(a.price), 0);
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) 
    : "100";

  // LTV Calculation (Average revenue per client)
  const clientRevenue: Record<string, number> = {};
  appointments.filter(a => a.status === "completed").forEach(a => {
    const key = a.client_phone;
    clientRevenue[key] = (clientRevenue[key] || 0) + Number(a.price);
  });
  const clientRevenueValues = Object.values(clientRevenue);
  const avgLTV = clientRevenueValues.length > 0
    ? clientRevenueValues.reduce((a, b) => a + b, 0) / clientRevenueValues.length
    : 0;

  // Retention Rate
  const returningClients = clientRevenueValues.filter(v => v > 0).length;
  const totalClients = clients.length;
  const retentionRate = totalClients > 0 ? (returningClients / totalClients * 100).toFixed(1) : "0";

  // Barber ranking
  const barberStats = team.map(barber => {
    const barberAppointments = appointments.filter(
      a => a.barber_id === barber.id && a.status === "completed"
    );
    const revenue = barberAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    const count = barberAppointments.length;
    return {
      name: barber.name.split(" ")[0],
      revenue,
      count,
      id: barber.id,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Revenue by day of week
  const dayOfWeekRevenue: Record<number, number> = {};
  thisMonthAppointments.forEach(a => {
    const dayOfWeek = parseISO(a.date).getDay();
    dayOfWeekRevenue[dayOfWeek] = (dayOfWeekRevenue[dayOfWeek] || 0) + Number(a.price);
  });
  
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekdayData = dayNames.map((name, i) => ({
    name,
    value: dayOfWeekRevenue[i] || 0,
  }));

  // Service popularity
  const serviceStats = services.map(service => {
    const serviceAppointments = appointments.filter(
      a => a.service_id === service.id && a.status === "completed"
    );
    return {
      name: service.name,
      value: serviceAppointments.length,
    };
  }).filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  // Trial days remaining
  const trialEnd = new Date(trialEndsAt);
  const daysRemaining = Math.max(0, differenceInDays(trialEnd, now));

  return (
    <div className="space-y-6">
      {/* Trial Banner (if applicable) */}
      {subscriptionStatus === "trialing" && (
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Período de teste gratuito</p>
              <p className="text-sm text-muted-foreground">
                {daysRemaining > 0 
                  ? `Restam ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""} de teste`
                  : "Seu período de teste expirou"
                }
              </p>
            </div>
          </div>
          <a href="/plans" className="text-sm font-medium text-primary hover:underline">
            Ver planos →
          </a>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Dashboard - {barbershopName}
        </h2>
        <p className="text-muted-foreground">
          {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <span className={`text-xs font-medium ${Number(revenueGrowth) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {Number(revenueGrowth) >= 0 ? "+" : ""}{revenueGrowth}%
            </span>
          </div>
          <p className="text-2xl font-bold">R$ {thisMonthRevenue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Faturamento do Mês</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {avgLTV.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">LTV Médio</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{clients.length}</p>
          <p className="text-xs text-muted-foreground">Total de Clientes</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Percent className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{retentionRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Retenção</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Day */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Faturamento por Dia da Semana
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(0)}`, "Faturamento"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Popularity */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4">Serviços Mais Populares</h3>
          {serviceStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {serviceStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Nenhum serviço concluído ainda
            </div>
          )}
        </div>
      </div>

      {/* Barber Ranking */}
      <div className="glass-card p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-500" />
          Ranking de Barbeiros
        </h3>
        
        {barberStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda
          </p>
        ) : (
          <div className="space-y-3">
            {barberStats.map((barber, index) => (
              <div 
                key={barber.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-secondary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? "bg-yellow-500 text-black" :
                    index === 1 ? "bg-gray-400 text-black" :
                    index === 2 ? "bg-orange-700 text-white" :
                    "bg-secondary text-foreground"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{barber.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {barber.count} atendimento{barber.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">R$ {barber.revenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">faturado</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
