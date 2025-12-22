import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Target, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, Settings2, Trophy, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TeamMember } from "@/hooks/useTeam";
import { Appointment } from "@/hooks/useAppointments";

interface TeamGoalsSectionProps {
  team: TeamMember[];
  appointments: Appointment[];
  onUpdateMemberGoal: (memberId: string, goal: number | null) => Promise<any>;
}

export const TeamGoalsSection = ({ 
  team, 
  appointments, 
  onUpdateMemberGoal 
}: TeamGoalsSectionProps) => {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [goalValue, setGoalValue] = useState("");

  const activeTeam = team.filter(m => m.is_active);

  // Calculate current month revenue per team member
  const memberStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return activeTeam.map(member => {
      const memberAppointments = appointments.filter(
        a => 
          a.team_member_id === member.id &&
          a.status === "completed" &&
          new Date(a.date) >= monthStart &&
          new Date(a.date) <= monthEnd
      );

      const revenue = memberAppointments.reduce((sum, a) => sum + Number(a.price || 0), 0);
      const appointmentCount = memberAppointments.length;
      const goal = member.revenue_goal;
      const progressPercent = goal ? Math.min((revenue / goal) * 100, 100) : 0;
      const remaining = goal ? Math.max(goal - revenue, 0) : 0;
      const isOnTrack = goal ? revenue >= (goal * (now.getDate() / endOfMonth(now).getDate())) : true;

      return {
        member,
        revenue,
        appointmentCount,
        goal,
        progressPercent,
        remaining,
        isOnTrack,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [activeTeam, appointments]);

  const openGoalDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setGoalValue(member.revenue_goal?.toString() || "");
    setIsGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!selectedMember) return;
    
    const goal = goalValue ? parseFloat(goalValue) : null;
    await onUpdateMemberGoal(selectedMember.id, goal);
    setIsGoalDialogOpen(false);
    setSelectedMember(null);
    setGoalValue("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const topPerformer = memberStats[0];

  if (activeTeam.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Metas da Equipe
        </h3>
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "MMMM yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Top Performer Card */}
      {topPerformer && topPerformer.revenue > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={topPerformer.member.avatar_url || undefined} />
                  <AvatarFallback className="bg-amber-500/20 text-amber-600">
                    {getInitials(topPerformer.member.name)}
                  </AvatarFallback>
                </Avatar>
                <Trophy className="absolute -top-1 -right-1 w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Destaque do mês</p>
                <p className="font-semibold text-foreground">{topPerformer.member.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-600">
                  R$ {topPerformer.revenue.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topPerformer.appointmentCount} atendimentos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Goals Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {memberStats.map(({ member, revenue, appointmentCount, goal, progressPercent, remaining, isOnTrack }) => (
          <Card key={member.id} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {appointmentCount} atendimento{appointmentCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openGoalDialog(member)}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Receita</span>
                  <span className="font-semibold text-foreground">
                    R$ {revenue.toLocaleString("pt-BR")}
                  </span>
                </div>

                {goal ? (
                  <>
                    <Progress value={progressPercent} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {isOnTrack ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={isOnTrack ? "text-green-600" : "text-amber-600"}>
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        Meta: R$ {goal.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {remaining > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Faltam R$ {remaining.toLocaleString("pt-BR")} para a meta
                      </p>
                    )}
                    {progressPercent >= 100 && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Meta atingida!
                      </Badge>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => openGoalDialog(member)}
                  >
                    <Target className="w-4 h-4" />
                    Definir Meta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goal Setting Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Meta de Receita - {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="goal">Meta Mensal (R$)</Label>
              <Input
                id="goal"
                type="number"
                min="0"
                step="100"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                placeholder="Ex: 5000"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe vazio para remover a meta
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGoal}>
              Salvar Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};