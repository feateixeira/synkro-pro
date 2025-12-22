import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Loader2, CalendarIcon, Clock, Plus, Trash2, 
  Ban, Coffee, Calendar as CalendarIconOutline, Repeat
} from "lucide-react";

interface BlockedTimesSettingsProps {
  barbershopId: string;
}

interface BlockedTime {
  id: string;
  barbershop_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  is_recurring: boolean | null;
  barber_id: string | null;
}

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

const PRESET_BLOCKS = [
  { label: "Horário de Almoço", start: "12:00", end: "13:00", icon: Coffee },
  { label: "Intervalo Tarde", start: "15:00", end: "15:30", icon: Coffee },
];

export const BlockedTimesSettings = ({ barbershopId }: BlockedTimesSettingsProps) => {
  const { toast } = useToast();
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const fetchBlockedTimes = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_times")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("date", { ascending: true });

      if (error) throw error;
      setBlockedTimes(data || []);
    } catch (error: any) {
      console.error("Error fetching blocked times:", error);
      toast({
        title: "Erro ao carregar bloqueios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedTimes();
  }, [barbershopId]);

  const handleAddBlock = async () => {
    if (!selectedDate && !isRecurring) {
      toast({
        title: "Selecione uma data",
        description: "Escolha a data para bloquear ou marque como recorrente.",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Horário inválido",
        description: "O horário de início deve ser anterior ao de término.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("blocked_times")
        .insert({
          barbershop_id: barbershopId,
          date: isRecurring ? "2000-01-01" : format(selectedDate!, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
          reason: reason || null,
          is_recurring: isRecurring,
        });

      if (error) throw error;

      toast({
        title: "Bloqueio adicionado!",
        description: isRecurring 
          ? "O horário será bloqueado todos os dias." 
          : `Horário bloqueado em ${format(selectedDate!, "dd/MM/yyyy")}.`,
      });

      // Reset form
      setSelectedDate(undefined);
      setStartTime("12:00");
      setEndTime("13:00");
      setReason("");
      setIsRecurring(false);
      setIsDialogOpen(false);
      
      fetchBlockedTimes();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar bloqueio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blocked_times")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Bloqueio removido!",
      });
      
      fetchBlockedTimes();
    } catch (error: any) {
      toast({
        title: "Erro ao remover bloqueio",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const applyPreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  // Group blocked times
  const recurringBlocks = blockedTimes.filter(b => b.is_recurring);
  const specificBlocks = blockedTimes.filter(b => !b.is_recurring);

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Bloqueio de Horários
            </CardTitle>
            <CardDescription>
              Bloqueie horários para intervalos, feriados ou compromissos
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Bloqueio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Bloqueio</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* Recurring Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="recurring">Repetir todos os dias</Label>
                  </div>
                  <Switch
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {/* Date Picker (only if not recurring) */}
                {!isRecurring && (
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate 
                            ? format(selectedDate, "PPP", { locale: ptBR }) 
                            : "Selecione uma data"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Preset Buttons */}
                <div className="space-y-2">
                  <Label>Atalhos</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BLOCKS.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset.start, preset.end)}
                        className="gap-1"
                      >
                        <preset.icon className="w-3 h-3" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Término</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.filter(t => t > startTime).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Almoço, Feriado, Compromisso..."
                  />
                </div>

                <Button 
                  onClick={handleAddBlock} 
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Adicionar Bloqueio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recurring Blocks */}
        {recurringBlocks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Repeat className="w-4 h-4" />
              Bloqueios Diários
            </h4>
            <div className="space-y-2">
              {recurringBlocks.map((block) => (
                <div 
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Coffee className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {block.reason || "Bloqueio diário"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specific Date Blocks */}
        {specificBlocks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CalendarIconOutline className="w-4 h-4" />
              Bloqueios Específicos
            </h4>
            <div className="space-y-2">
              {specificBlocks.map((block) => (
                <div 
                  key={block.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Ban className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(block.date + "T12:00:00"), "dd/MM/yyyy")} • {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {block.reason || "Bloqueio"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {blockedTimes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum horário bloqueado</p>
            <p className="text-sm">Adicione bloqueios para intervalos ou feriados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
