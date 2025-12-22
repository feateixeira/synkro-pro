import { useState, useEffect } from "react";
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Loader2,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity,
  PieChart as PieChartIcon,
  Rocket,
  Brain,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Settings2,
  X
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
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
  ComposedChart
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useTeam } from "@/hooks/useTeam";
import { useBarbershop } from "@/hooks/useBarbershop";
import { TeamGoalsSection } from "./TeamGoalsSection";
import { TeamPerformanceHistory } from "./TeamPerformanceHistory";
import { format, subDays, subMonths, parseISO, startOfMonth, endOfMonth, differenceInDays, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// Linear regression helper for trend prediction
const calculateLinearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  
  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n || 0;
  
  return { slope, intercept };
};

interface ReportsPageProps {
  barbershopId: string;
  revenueGoal: number | null;
  onUpdateRevenueGoal: (goal: number | null) => Promise<boolean>;
}

const GRADIENT_COLORS = {
  primary: ['#F59E0B', '#D97706'],
  success: ['#10B981', '#059669'],
  info: ['#3B82F6', '#2563EB'],
  purple: ['#8B5CF6', '#7C3AED'],
  pink: ['#EC4899', '#DB2777'],
  danger: ['#EF4444', '#DC2626'],
};

const CHART_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export const ReportsPage = ({ barbershopId, revenueGoal, onUpdateRevenueGoal }: ReportsPageProps) => {
  const { appointments, isLoading } = useAppointments(barbershopId);
  const { clients } = useClients(barbershopId);
  const { services } = useServices(barbershopId);
  const { team, updateRevenueGoal: updateTeamMemberGoal } = useTeam(barbershopId);
  const [period, setPeriod] = useState("30");
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const pendingAppointments = appointments.filter((a) => a.status === "pending" || a.status === "confirmed");

  // Calculate period stats
  const periodStart = subDays(new Date(), parseInt(period));
  const periodAppointments = completedAppointments.filter((a) => {
    const date = parseISO(a.date);
    return date >= periodStart;
  });

  // Previous period for comparison
  const previousPeriodStart = subDays(periodStart, parseInt(period));
  const previousPeriodAppointments = completedAppointments.filter((a) => {
    const date = parseISO(a.date);
    return date >= previousPeriodStart && date < periodStart;
  });

  const totalRevenue = periodAppointments.reduce((sum, a) => sum + Number(a.price), 0);
  const previousRevenue = previousPeriodAppointments.reduce((sum, a) => sum + Number(a.price), 0);
  const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  const totalAppointments = periodAppointments.length;
  const previousAppointmentsCount = previousPeriodAppointments.length;
  const appointmentsChange = previousAppointmentsCount > 0 
    ? ((totalAppointments - previousAppointmentsCount) / previousAppointmentsCount) * 100 
    : 0;

  const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
  const previousAvgTicket = previousAppointmentsCount > 0 
    ? previousRevenue / previousAppointmentsCount 
    : 0;
  const avgTicketChange = previousAvgTicket > 0 
    ? ((avgTicket - previousAvgTicket) / previousAvgTicket) * 100 
    : 0;

  // New clients in period
  const newClientsInPeriod = clients.filter((c) => {
    const date = parseISO(c.created_at);
    return date >= periodStart;
  }).length;

  // Current month revenue for goal tracking
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const currentMonthAppointments = completedAppointments.filter((a) => {
    const date = parseISO(a.date);
    return date >= currentMonthStart && date <= currentMonthEnd;
  });
  const currentMonthRevenue = currentMonthAppointments.reduce((sum, a) => sum + Number(a.price), 0);
  
  // Days remaining in current month
  const today = new Date();
  const daysInMonth = differenceInDays(currentMonthEnd, currentMonthStart) + 1;
  const daysPassed = differenceInDays(today, currentMonthStart) + 1;
  const daysRemaining = daysInMonth - daysPassed;
  const progressPercent = revenueGoal && revenueGoal > 0 ? Math.min(100, (currentMonthRevenue / revenueGoal) * 100) : 0;
  
  // Calculate daily rate needed to meet goal
  const revenueNeeded = revenueGoal ? Math.max(0, revenueGoal - currentMonthRevenue) : 0;
  const dailyRateNeeded = daysRemaining > 0 ? revenueNeeded / daysRemaining : 0;
  const currentDailyRate = daysPassed > 0 ? currentMonthRevenue / daysPassed : 0;
  
  // Alert conditions
  const isBelowGoal = revenueGoal && currentMonthRevenue < revenueGoal;
  const projectedMonthRevenue = currentDailyRate * daysInMonth;
  const projectedShortfall = revenueGoal ? revenueGoal - projectedMonthRevenue : 0;
  const isProjectedToMiss = revenueGoal && projectedMonthRevenue < revenueGoal;
  const showAlert = revenueGoal && isProjectedToMiss && !alertDismissed && daysPassed > 5;

  // Goal save handler
  const handleSaveGoal = async () => {
    setIsSavingGoal(true);
    const goalValue = newGoal ? parseFloat(newGoal.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const success = await onUpdateRevenueGoal(goalValue);
    if (success) {
      setGoalDialogOpen(false);
      setNewGoal("");
    }
    setIsSavingGoal(false);
  };

  const handleRemoveGoal = async () => {
    setIsSavingGoal(true);
    const success = await onUpdateRevenueGoal(null);
    if (success) {
      setGoalDialogOpen(false);
      setNewGoal("");
    }
    setIsSavingGoal(false);
  };

  // Revenue by day with smooth curve
  const revenueByDay = Array.from({ length: Math.min(parseInt(period), 30) }, (_, i) => {
    const daysToShow = Math.min(parseInt(period), 30);
    const date = subDays(new Date(), daysToShow - 1 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayAppointments = completedAppointments.filter((a) => a.date === dateStr);
    const revenue = dayAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    const count = dayAppointments.length;
    return {
      name: format(date, parseInt(period) > 14 ? "dd/MM" : "EEE", { locale: ptBR }),
      revenue,
      appointments: count,
      date: dateStr,
    };
  });

  // Appointments by hour (for heatmap style)
  const appointmentsByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourStr = String(hour).padStart(2, "0");
    const count = periodAppointments.filter((a) => 
      a.start_time?.startsWith(hourStr)
    ).length;
    return {
      hour: `${hourStr}:00`,
      count,
      fill: count > 5 ? CHART_COLORS[0] : count > 2 ? CHART_COLORS[1] : count > 0 ? CHART_COLORS[2] : 'hsl(0, 0%, 16%)',
    };
  }).filter((h) => parseInt(h.hour) >= 8 && parseInt(h.hour) <= 21);

  // Revenue by service (pie chart)
  const revenueByService = services.map((service) => {
    const serviceAppointments = periodAppointments.filter((a) => a.service_id === service.id);
    const revenue = serviceAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    return {
      name: service.name,
      value: revenue,
      count: serviceAppointments.length,
    };
  }).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);

  // Revenue by barber with radial chart
  const revenueByBarber = team.map((member, index) => {
    const barberAppointments = periodAppointments.filter((a) => a.barber_id === member.id);
    const revenue = barberAppointments.reduce((sum, a) => sum + Number(a.price), 0);
    const commission = revenue * (member.commission_percentage || 0) / 100;
    const maxRevenue = Math.max(...team.map(t => {
      const apps = periodAppointments.filter(a => a.barber_id === t.id);
      return apps.reduce((sum, a) => sum + Number(a.price), 0);
    }));
    return {
      name: member.name,
      revenue,
      commission,
      count: barberAppointments.length,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      percentage: maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0,
    };
  }).filter((b) => b.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Status distribution
  const statusDistribution = [
    { name: "Concluídos", value: completedAppointments.length, fill: "#10B981" },
    { name: "Pendentes", value: appointments.filter(a => a.status === "pending").length, fill: "#F59E0B" },
    { name: "Confirmados", value: appointments.filter(a => a.status === "confirmed").length, fill: "#3B82F6" },
    { name: "Cancelados", value: appointments.filter(a => a.status === "canceled").length, fill: "#EF4444" },
  ].filter(s => s.value > 0);

  // Top clients
  const topClients = clients
    .filter((c) => (c.total_spent || 0) > 0)
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5);

  // Weekly comparison
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = subDays(new Date(), i * 7);
    const weekStart = subDays(weekEnd, 6);
    const weekApps = completedAppointments.filter((a) => {
      const date = parseISO(a.date);
      return date >= weekStart && date <= weekEnd;
    });
    return {
      week: `Sem ${4 - i}`,
      revenue: weekApps.reduce((sum, a) => sum + Number(a.price), 0),
      appointments: weekApps.length,
    };
  }).reverse();

  // Revenue Forecast - Monthly data for last 6 months + 3 month prediction
  const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthApps = completedAppointments.filter((a) => {
      const date = parseISO(a.date);
      return date >= monthStart && date <= monthEnd;
    });
    return {
      x: i,
      month: format(monthDate, "MMM", { locale: ptBR }),
      monthFull: format(monthDate, "MMMM yyyy", { locale: ptBR }),
      revenue: monthApps.reduce((sum, a) => sum + Number(a.price), 0),
      appointments: monthApps.length,
      isActual: true,
    };
  });

  // Calculate trend using linear regression
  const regressionData = monthlyRevenueData.map(d => ({ x: d.x, y: d.revenue }));
  const { slope, intercept } = calculateLinearRegression(regressionData);
  
  // Generate predictions for next 3 months
  const forecastData = [
    ...monthlyRevenueData.map(d => ({
      ...d,
      predicted: intercept + slope * d.x,
      isForecast: false,
    })),
    ...Array.from({ length: 3 }, (_, i) => {
      const futureMonth = addMonths(new Date(), i + 1);
      const xValue = 6 + i;
      const predictedRevenue = Math.max(0, intercept + slope * xValue);
      return {
        x: xValue,
        month: format(futureMonth, "MMM", { locale: ptBR }),
        monthFull: format(futureMonth, "MMMM yyyy", { locale: ptBR }),
        revenue: null as number | null,
        appointments: null as number | null,
        predicted: predictedRevenue,
        isActual: false,
        isForecast: true,
      };
    }),
  ];

  // Calculate forecast metrics (using monthlyRevenueData for chart, currentMonthRevenue already defined above for goals)
  const lastMonthChartRevenue = monthlyRevenueData[monthlyRevenueData.length - 1]?.revenue || 0;
  const nextMonthPrediction = forecastData.find(d => d.isForecast)?.predicted || 0;
  const forecastGrowth = lastMonthChartRevenue > 0 
    ? ((nextMonthPrediction - lastMonthChartRevenue) / lastMonthChartRevenue) * 100 
    : 0;
  const quarterForecast = forecastData
    .filter(d => d.isForecast)
    .reduce((sum, d) => sum + (d.predicted || 0), 0);
  
  // Trend confidence based on R² (simplified)
  const avgY = regressionData.reduce((sum, d) => sum + d.y, 0) / regressionData.length || 0;
  const ssTotal = regressionData.reduce((sum, d) => sum + Math.pow(d.y - avgY, 2), 0);
  const ssResidual = regressionData.reduce((sum, d) => sum + Math.pow(d.y - (intercept + slope * d.x), 2), 0);
  const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
  const trendConfidence = Math.max(0, Math.min(100, rSquared * 100));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    gradient,
    prefix = "",
    suffix = ""
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: any; 
    gradient: string[];
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-5 group hover:border-primary/30 transition-all duration-300">
      {/* Glow effect */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${gradient[0]}20, ${gradient[1]}10)` }}
          >
            <Icon className="w-6 h-6" style={{ color: gradient[0] }} />
          </div>
          {change !== undefined && (
            <Badge 
              variant="outline" 
              className={`gap-1 ${change >= 0 ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}
            >
              {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">
          {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value}{suffix}
        </p>
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-3 shadow-2xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Receita') || entry.dataKey === 'revenue' 
                ? `R$ ${entry.value?.toFixed(2)}` 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Goal Alert */}
      {showAlert && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 via-orange-500/10 to-yellow-500/10 border border-red-500/30 p-5 animate-pulse">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/20 shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                Alerta de Meta de Receita
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Com a taxa atual de <span className="text-foreground font-medium">R$ {currentDailyRate.toFixed(2)}/dia</span>, 
                você está projetado para fechar o mês com <span className="text-red-400 font-medium">R$ {projectedMonthRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>, 
                ficando <span className="text-red-400 font-medium">R$ {projectedShortfall.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> abaixo da meta.
              </p>
              <p className="text-sm text-yellow-400 mt-2">
                💡 Para atingir a meta, você precisa faturar <span className="font-bold">R$ {dailyRateNeeded.toFixed(2)}/dia</span> nos próximos {daysRemaining} dias.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setAlertDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Header with glow */}
      <div className="relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                Analytics Dashboard
                <Sparkles className="w-5 h-5 text-primary" />
              </h2>
              <p className="text-muted-foreground">Insights de performance em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Revenue Goal Dialog */}
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`gap-2 ${revenueGoal ? 'border-primary/50 text-primary' : ''}`}
                >
                  {revenueGoal ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  {revenueGoal ? `Meta: R$ ${revenueGoal.toLocaleString('pt-BR')}` : 'Definir Meta'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Meta de Receita Mensal
                  </DialogTitle>
                  <DialogDescription>
                    Defina uma meta de receita mensal para receber alertas automáticos quando estiver abaixo do esperado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Meta mensal (R$)</label>
                    <Input
                      type="text"
                      placeholder="Ex: 10000"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value.replace(/[^\d.,]/g, ''))}
                      className="bg-secondary/50"
                    />
                  </div>
                  
                  {revenueGoal && (
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Meta atual:</span>
                        <span className="font-medium text-foreground">R$ {revenueGoal.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Receita do mês:</span>
                        <span className={`font-medium ${currentMonthRevenue >= revenueGoal ? 'text-green-400' : 'text-yellow-400'}`}>
                          R$ {currentMonthRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-medium text-foreground">{progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              progressPercent >= 100 ? 'bg-green-500' : 
                              progressPercent >= 70 ? 'bg-primary' : 
                              progressPercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveGoal} 
                      disabled={isSavingGoal || !newGoal}
                      className="flex-1"
                    >
                      {isSavingGoal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Salvar Meta
                    </Button>
                    {revenueGoal && (
                      <Button 
                        variant="outline" 
                        onClick={handleRemoveGoal}
                        disabled={isSavingGoal}
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Revenue Goal Progress Card (when goal is set) */}
      {revenueGoal && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-5">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Meta do Mês ({format(new Date(), 'MMMM', { locale: ptBR })})
              </h3>
              <Badge 
                className={`${
                  progressPercent >= 100 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                  progressPercent >= 70 ? 'bg-primary/20 text-primary border-primary/30' : 
                  progressPercent >= 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {progressPercent >= 100 ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Meta Atingida!</>
                ) : (
                  <>{progressPercent.toFixed(0)}% concluído</>
                )}
              </Badge>
            </div>
            
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="text-2xl font-bold text-foreground">R$ {revenueGoal.toLocaleString('pt-BR')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Faturado</p>
                <p className={`text-2xl font-bold ${progressPercent >= 100 ? 'text-green-400' : 'text-primary'}`}>
                  R$ {currentMonthRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Falta</p>
                <p className={`text-2xl font-bold ${revenueNeeded <= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                  R$ {revenueNeeded.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dias restantes</p>
                <p className="text-2xl font-bold text-foreground">{daysRemaining}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${
                    progressPercent >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 
                    progressPercent >= 70 ? 'bg-gradient-to-r from-primary to-amber-400' : 
                    progressPercent >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
                    'bg-gradient-to-r from-red-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              {dailyRateNeeded > 0 && progressPercent < 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Você precisa de <span className="text-foreground font-medium">R$ {dailyRateNeeded.toFixed(2)}/dia</span> para atingir a meta
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Team Goals Section */}
      <TeamGoalsSection 
        team={team} 
        appointments={appointments} 
        onUpdateMemberGoal={updateTeamMemberGoal} 
      />

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Receita Total"
          value={totalRevenue}
          change={revenueChange}
          icon={DollarSign}
          gradient={GRADIENT_COLORS.primary}
          prefix="R$ "
        />
        <StatCard 
          title="Atendimentos"
          value={totalAppointments}
          change={appointmentsChange}
          icon={Calendar}
          gradient={GRADIENT_COLORS.success}
        />
        <StatCard 
          title="Ticket Médio"
          value={avgTicket}
          change={avgTicketChange}
          icon={Target}
          gradient={GRADIENT_COLORS.info}
          prefix="R$ "
        />
        <StatCard 
          title="Novos Clientes"
          value={newClientsInPeriod}
          icon={Users}
          gradient={GRADIENT_COLORS.purple}
        />
      </div>

      {/* Main Revenue Chart */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Evolução de Receita e Atendimentos
              </h3>
              <p className="text-sm text-muted-foreground">Comparativo diário no período</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueByDay}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="appointmentsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(0, 0%, 45%)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(0, 0%, 45%)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(0, 0%, 45%)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="Receita"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: 'hsl(0, 0%, 4%)' }}
                  name="Atendimentos"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border border-cyan-500/20">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  Previsão de Receita
                  <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                    IA
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Análise preditiva baseada em tendência histórica
                </p>
              </div>
            </div>
            
            {/* Forecast KPIs */}
            <div className="flex gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-xl bg-secondary/60 border border-border/30">
                <p className="text-xs text-muted-foreground">Próximo mês</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-cyan-400">
                    R$ {nextMonthPrediction.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                  <Badge 
                    className={`text-xs ${forecastGrowth >= 0 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {forecastGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {Math.abs(forecastGrowth).toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              <div className="px-4 py-2 rounded-xl bg-secondary/60 border border-border/30">
                <p className="text-xs text-muted-foreground">Previsão trimestral</p>
                <span className="text-lg font-bold text-purple-400">
                  R$ {quarterForecast.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              
              <div className="px-4 py-2 rounded-xl bg-secondary/60 border border-border/30">
                <p className="text-xs text-muted-foreground">Confiança</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden w-16">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${trendConfidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{trendConfidence.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData}>
                <defs>
                  <linearGradient id="actualRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#06B6D4"/>
                    <stop offset="100%" stopColor="#A855F7"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(0, 0%, 45%)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(0, 0%, 45%)" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value?.toLocaleString('pt-BR') || 0}`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload;
                      return (
                        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl p-4 shadow-2xl">
                          <p className="text-sm font-medium text-foreground mb-2 capitalize">{data?.monthFull || label}</p>
                          {data?.revenue !== null && (
                            <p className="text-sm text-cyan-400">
                              Receita real: R$ {data.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {data?.predicted !== undefined && (
                            <p className="text-sm text-purple-400">
                              {data?.isForecast ? 'Previsão' : 'Tendência'}: R$ {data.predicted?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          {data?.isForecast && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Rocket className="w-3 h-3" /> Projeção baseada em tendência
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Actual Revenue */}
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  fill="url(#actualRevenueGradient)"
                  name="Receita Real"
                  connectNulls={false}
                />
                
                {/* Trend/Prediction Line */}
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="url(#trendLineGradient)" 
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload?.isForecast) {
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={6} fill="#A855F7" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#A855F7" />
                        </g>
                      );
                    }
                    return null;
                  }}
                  activeDot={{ r: 6, stroke: '#A855F7', strokeWidth: 2, fill: 'hsl(0, 0%, 4%)' }}
                  name="Tendência"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-cyan-500" />
              <span className="text-muted-foreground">Receita Real</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #06B6D4, #06B6D4 4px, transparent 4px, transparent 6px, #A855F7 6px, #A855F7 10px)' }} />
              <span className="text-muted-foreground">Tendência</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Previsão</span>
            </div>
          </div>
          
          {/* Insight Card */}
          {slope !== 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Rocket className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {slope > 0 ? '📈 Tendência de Crescimento' : '📉 Tendência de Queda'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {slope > 0 
                      ? `Com base nos últimos 6 meses, sua receita está crescendo em média R$ ${Math.abs(slope).toFixed(0)} por mês. Continue assim!`
                      : `A análise mostra uma redução média de R$ ${Math.abs(slope).toFixed(0)} por mês. Considere estratégias para reverter essa tendência.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue by Service - Pie Chart */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
          
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-blue-400" />
            Receita por Serviço
          </h3>
          
          {revenueByService.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByService}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {revenueByService.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Sem dados no período</p>
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {revenueByService.slice(0, 5).map((service, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate max-w-[120px]">{service.name}</span>
                </div>
                <span className="font-medium text-foreground">R$ {service.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
          
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Status dos Agendamentos
          </h3>
          
          {statusDistribution.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80}
                      stroke="hsl(0, 0%, 45%)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 8, 8, 0]}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Summary */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusDistribution.map((status, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ background: status.fill }}
                    />
                    <span className="text-muted-foreground">{status.name}:</span>
                    <span className="font-medium text-foreground">{status.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Sem agendamentos</p>
              </div>
            </div>
          )}
        </div>

        {/* Horário de Pico */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
          
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            Horários de Pico
          </h3>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsByHour}>
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(0, 0%, 45%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Atendimentos">
                  {appointmentsByHour.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Horário mais movimentado:</span>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {appointmentsByHour.reduce((max, h) => h.count > max.count ? h : max, appointmentsByHour[0])?.hour || "N/A"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Two Column - Barbers & Weekly */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance by Barber */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            Performance da Equipe
          </h3>
          
          {revenueByBarber.length > 0 ? (
            <div className="space-y-4">
              {revenueByBarber.map((barber, index) => (
                <div 
                  key={index} 
                  className="relative p-4 rounded-xl bg-secondary/50 border border-border/30 overflow-hidden group hover:border-primary/30 transition-all"
                >
                  {/* Progress bar background */}
                  <div 
                    className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                    style={{ 
                      background: `linear-gradient(90deg, ${barber.fill} ${barber.percentage}%, transparent ${barber.percentage}%)` 
                    }}
                  />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: `${barber.fill}30`, color: barber.fill }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{barber.name}</p>
                        <p className="text-sm text-muted-foreground">{barber.count} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: barber.fill }}>
                        R$ {barber.revenue.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Comissão: R$ {barber.commission.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Sem dados de equipe</p>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Comparison */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
          
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Comparativo Semanal
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis 
                  dataKey="week" 
                  stroke="hsl(0, 0%, 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(0, 0%, 45%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                  name="Receita"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Growth indicator */}
          {weeklyData.length >= 2 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Crescimento última semana:</span>
              {(() => {
                const lastWeek = weeklyData[weeklyData.length - 1]?.revenue || 0;
                const prevWeek = weeklyData[weeklyData.length - 2]?.revenue || 0;
                const growth = prevWeek > 0 ? ((lastWeek - prevWeek) / prevWeek) * 100 : 0;
                return (
                  <Badge 
                    className={growth >= 0 
                      ? "bg-green-500/20 text-green-400 border-green-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(growth).toFixed(1)}%
                  </Badge>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Team Performance History Section */}
      <TeamPerformanceHistory team={team} appointments={appointments} />

      {/* Top Clients */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border/50 p-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            Top Clientes VIP
          </h3>
          
          {topClients.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topClients.map((client, index) => (
                <div 
                  key={client.id} 
                  className="relative p-4 rounded-xl bg-secondary/50 border border-border/30 text-center group hover:border-primary/30 hover:bg-secondary/70 transition-all"
                >
                  {/* Medal for top 3 */}
                  {index < 3 && (
                    <div 
                      className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' :
                        'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      }`}
                    >
                      {index + 1}º
                    </div>
                  )}
                  
                  <div 
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                  >
                    <span className="text-primary font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.total_visits || 0} visitas</p>
                  <p className="text-xl font-bold text-primary mt-2">
                    R$ {(client.total_spent || 0).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum cliente com histórico ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
