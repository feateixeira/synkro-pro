import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Appointment {
  id: string;
  team_member_id: string | null;
  date: string;
  price: number;
  status: string;
}

interface TeamPerformanceHistoryProps {
  team: TeamMember[];
  appointments: Appointment[];
}

export const TeamPerformanceHistory = ({ team, appointments }: TeamPerformanceHistoryProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");
  const [monthsToShow, setMonthsToShow] = useState<number>(6);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const data: { month: string; monthLabel: string; [key: string]: number | string }[] = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });

      const monthEntry: { month: string; monthLabel: string; [key: string]: number | string } = {
        month: monthKey,
        monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      };

      team.forEach((member) => {
        const memberRevenue = appointments
          .filter((apt) => {
            if (apt.team_member_id !== member.id) return false;
            if (apt.status === "canceled") return false;
            const aptDate = parseISO(apt.date);
            return aptDate >= monthStart && aptDate <= monthEnd;
          })
          .reduce((sum, apt) => sum + apt.price, 0);

        monthEntry[member.id] = memberRevenue;
      });

      data.push(monthEntry);
    }

    return data;
  }, [team, appointments, monthsToShow]);

  const performanceSummary = useMemo(() => {
    if (monthlyData.length < 2) return [];

    return team.map((member) => {
      const currentMonth = monthlyData[monthlyData.length - 1]?.[member.id] as number || 0;
      const previousMonth = monthlyData[monthlyData.length - 2]?.[member.id] as number || 0;
      const totalRevenue = monthlyData.reduce((sum, month) => sum + (month[member.id] as number || 0), 0);
      const avgRevenue = totalRevenue / monthlyData.length;

      let trend: "up" | "down" | "stable" = "stable";
      let percentChange = 0;

      if (previousMonth > 0) {
        percentChange = ((currentMonth - previousMonth) / previousMonth) * 100;
        if (percentChange > 5) trend = "up";
        else if (percentChange < -5) trend = "down";
      } else if (currentMonth > 0) {
        trend = "up";
        percentChange = 100;
      }

      return {
        member,
        currentMonth,
        previousMonth,
        totalRevenue,
        avgRevenue,
        trend,
        percentChange,
      };
    });
  }, [team, monthlyData]);

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
  ];

  const filteredTeam = selectedMemberId === "all" 
    ? team 
    : team.filter((m) => m.id === selectedMemberId);

  if (team.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Performance
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={monthsToShow.toString()} onValueChange={(v) => setMonthsToShow(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="monthLabel" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                  labelFormatter={(label) => `Mês: ${label}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {filteredTeam.map((member, index) => (
                  <Line
                    key={member.id}
                    type="monotone"
                    dataKey={member.id}
                    name={member.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[index % colors.length], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {performanceSummary.map(({ member, currentMonth, avgRevenue, trend, percentChange }, index) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  >
                    {member.avatar_url ? (
                      <img 
                        src={member.avatar_url} 
                        alt={member.name} 
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Média: R$ {avgRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {currentMonth.toFixed(2)}</p>
                  <div className={`flex items-center gap-1 text-sm ${
                    trend === "up" ? "text-green-600" :
                    trend === "down" ? "text-red-600" :
                    "text-muted-foreground"
                  }`}>
                    {trend === "up" && <TrendingUp className="h-4 w-4" />}
                    {trend === "down" && <TrendingDown className="h-4 w-4" />}
                    {trend === "stable" && <Minus className="h-4 w-4" />}
                    <span>{percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
