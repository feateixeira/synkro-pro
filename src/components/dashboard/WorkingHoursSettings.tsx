import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Save } from "lucide-react";

interface WorkingHoursSettingsProps {
  barbershopId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

interface DaySchedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const WorkingHoursSettings = ({ barbershopId }: WorkingHoursSettingsProps) => {
  const { toast } = useToast();
  const { workingHours, isLoading, updateWorkingHour, refetch } = useWorkingHours(barbershopId);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize schedules from working hours
  useEffect(() => {
    if (workingHours.length > 0) {
      const mappedSchedules = DAYS_OF_WEEK.map(day => {
        const existing = workingHours.find(wh => wh.day_of_week === day.value);
        return {
          id: existing?.id,
          day_of_week: day.value,
          start_time: existing?.start_time?.slice(0, 5) || "09:00",
          end_time: existing?.end_time?.slice(0, 5) || "18:00",
          is_active: existing?.is_active ?? false,
        };
      });
      setSchedules(mappedSchedules);
    } else {
      // Initialize with default values if no working hours exist
      const defaultSchedules = DAYS_OF_WEEK.map(day => ({
        day_of_week: day.value,
        start_time: day.value === 0 ? "09:00" : "09:00",
        end_time: day.value === 0 ? "18:00" : (day.value === 6 ? "17:00" : "19:00"),
        is_active: day.value !== 0, // Sunday off by default
      }));
      setSchedules(defaultSchedules);
    }
  }, [workingHours]);

  const updateSchedule = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.day_of_week === dayOfWeek 
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = schedules.map(async (schedule) => {
        if (schedule.id) {
          // Update existing
          return updateWorkingHour(schedule.id, {
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_active: schedule.is_active,
          });
        } else {
          // Create new
          const { supabase } = await import("@/integrations/supabase/client");
          const { error } = await supabase
            .from("working_hours")
            .insert({
              barbershop_id: barbershopId,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_active: schedule.is_active,
            });
          if (error) throw error;
        }
      });

      await Promise.all(promises);
      
      toast({
        title: "Horários salvos!",
        description: "Os horários de funcionamento foram atualizados.",
      });
      
      setHasChanges(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Horários de Funcionamento
        </CardTitle>
        <CardDescription>
          Configure os dias e horários em que sua barbearia está aberta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const dayInfo = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week);
            
            return (
              <div 
                key={schedule.day_of_week}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
                  schedule.is_active 
                    ? "bg-secondary/50 border-border" 
                    : "bg-muted/30 border-transparent"
                }`}
              >
                {/* Day Toggle */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <Switch
                    checked={schedule.is_active}
                    onCheckedChange={(checked) => updateSchedule(schedule.day_of_week, "is_active", checked)}
                  />
                  <Label className={`font-medium ${!schedule.is_active && "text-muted-foreground"}`}>
                    {dayInfo?.label}
                  </Label>
                </div>

                {/* Time Selectors */}
                {schedule.is_active && (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={schedule.start_time}
                      onValueChange={(value) => updateSchedule(schedule.day_of_week, "start_time", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <span className="text-muted-foreground">às</span>

                    <Select
                      value={schedule.end_time}
                      onValueChange={(value) => updateSchedule(schedule.day_of_week, "end_time", value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.filter(time => time > schedule.start_time).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!schedule.is_active && (
                  <span className="text-sm text-muted-foreground italic">
                    Fechado
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <Button 
          onClick={handleSaveAll} 
          disabled={isSaving || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Horários
        </Button>
      </CardContent>
    </Card>
  );
};
