import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock
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

const revenueData = [
  { name: "Seg", value: 1200 },
  { name: "Ter", value: 1800 },
  { name: "Qua", value: 1400 },
  { name: "Qui", value: 2200 },
  { name: "Sex", value: 2800 },
  { name: "Sáb", value: 3200 },
  { name: "Dom", value: 800 },
];

const appointmentsData = [
  { name: "09:00", value: 2 },
  { name: "10:00", value: 4 },
  { name: "11:00", value: 3 },
  { name: "12:00", value: 1 },
  { name: "13:00", value: 0 },
  { name: "14:00", value: 5 },
  { name: "15:00", value: 4 },
  { name: "16:00", value: 3 },
  { name: "17:00", value: 2 },
  { name: "18:00", value: 1 },
];

const todayAppointments = [
  { time: "09:00", client: "João Silva", service: "Corte + Barba", barber: "Carlos" },
  { time: "10:00", client: "Pedro Santos", service: "Corte Degradê", barber: "Carlos" },
  { time: "10:30", client: "Lucas Oliveira", service: "Barba", barber: "Miguel" },
  { time: "11:00", client: "Rafael Costa", service: "Corte Máquina", barber: "Carlos" },
  { time: "14:00", client: "Bruno Almeida", service: "Corte + Barba", barber: "Miguel" },
];

const stats = [
  {
    label: "Receita Hoje",
    value: "R$ 1.250",
    change: "+12%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Agendamentos",
    value: "18",
    change: "+5",
    trend: "up",
    icon: Calendar,
  },
  {
    label: "Ticket Médio",
    value: "R$ 69",
    change: "+8%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "Clientes Novos",
    value: "7",
    change: "-2",
    trend: "down",
    icon: Users,
  },
];

export const DashboardOverview = () => {
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
                stat.trend === "up" ? "text-success" : "text-destructive"
              }`}>
                {stat.trend === "up" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
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
              <AreaChart data={revenueData}>
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
                  formatter={(value: number) => [`R$ ${value}`, "Receita"]}
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
              <BarChart data={appointmentsData}>
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
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        
        <div className="space-y-3">
          {todayAppointments.map((appointment, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <div className="flex items-center gap-2 text-primary font-medium min-w-[60px]">
                <Clock className="w-4 h-4" />
                {appointment.time}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{appointment.client}</p>
                <p className="text-sm text-muted-foreground">{appointment.service}</p>
              </div>
              <div className="text-right">
                <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {appointment.barber}
                </span>
              </div>
            </div>
          ))}
        </div>

        {todayAppointments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        )}
      </div>
    </div>
  );
};
