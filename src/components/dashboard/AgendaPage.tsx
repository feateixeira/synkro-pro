import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { useServices, Service } from "@/hooks/useServices";
import { useTeam, TeamMember } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Loader2, Calendar as CalendarIcon, Clock, Phone, 
  User, Check, X, ChevronLeft, ChevronRight, MessageCircle,
  Users, Bell
} from "lucide-react";
import { 
  format, addDays, startOfWeek, isSameDay, parseISO, 
  startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addMonths,
  isWithinInterval, endOfWeek
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AgendaPageProps {
  barbershopId: string;
}

type ViewMode = "day" | "week" | "month";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  completed: "bg-green-500/20 text-green-500 border-green-500/30",
  canceled: "bg-red-500/20 text-red-500 border-red-500/30",
  no_show: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

export const AgendaPage = ({ barbershopId }: AgendaPageProps) => {
  const { appointments, isLoading, createAppointment, updateAppointment, refetch } = useAppointments(barbershopId);
  const { services } = useServices(barbershopId);
  const { team } = useTeam(barbershopId);
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);
  
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    service_id: "",
    barber_id: "",
    notes: "",
  });

  // Listen for new appointments in real-time
  useEffect(() => {
    const channel = supabase
      .channel('new-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${barbershopId}`
        },
        (payload) => {
          console.log('New appointment:', payload);
          setNewAppointmentCount(prev => prev + 1);
          toast({
            title: "🔔 Novo Agendamento!",
            description: `${payload.new.client_name} agendou para ${format(parseISO(payload.new.date), "dd/MM")} às ${payload.new.start_time.slice(0, 5)}`,
          });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershopId, refetch, toast]);

  // Get filtered appointments based on view mode and selected barber
  const getFilteredAppointments = () => {
    let filtered = appointments;
    
    // Filter by barber
    if (selectedBarberId !== "all") {
      filtered = filtered.filter(a => a.barber_id === selectedBarberId);
    }

    // Filter by date range based on view mode
    if (viewMode === "day") {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      filtered = filtered.filter(a => a.date === dateString);
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = filtered.filter(a => {
        const appointmentDate = parseISO(a.date);
        return isWithinInterval(appointmentDate, { start: weekStart, end: weekEnd });
      });
    } else if (viewMode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      filtered = filtered.filter(a => {
        const appointmentDate = parseISO(a.date);
        return isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      });
    }

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();
  const dateString = format(selectedDate, "yyyy-MM-dd");
  const dayAppointments = appointments.filter(a => a.date === dateString);

  // Get week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get month dates
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get appointment counts
  const getAppointmentCountForDate = (date: Date, barberId?: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments.filter(a => {
      const matchesDate = a.date === dateStr;
      const matchesBarber = barberId && barberId !== "all" ? a.barber_id === barberId : true;
      return matchesDate && matchesBarber;
    }).length;
  };

  const getWeekAppointmentCount = (barberId?: string) => {
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return appointments.filter(a => {
      const appointmentDate = parseISO(a.date);
      const inWeek = isWithinInterval(appointmentDate, { start: weekStart, end: weekEnd });
      const matchesBarber = barberId && barberId !== "all" ? a.barber_id === barberId : true;
      return inWeek && matchesBarber;
    }).length;
  };

  const getMonthAppointmentCount = (barberId?: string) => {
    return appointments.filter(a => {
      const appointmentDate = parseISO(a.date);
      const inMonth = isWithinInterval(appointmentDate, { start: monthStart, end: monthEnd });
      const matchesBarber = barberId && barberId !== "all" ? a.barber_id === barberId : true;
      return inMonth && matchesBarber;
    }).length;
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      service_id: "",
      barber_id: "",
      notes: "",
    });
    setSelectedTimeSlot(null);
  };

  const openCreateDialog = (time?: string, barberId?: string) => {
    resetForm();
    if (time) setSelectedTimeSlot(time);
    if (barberId && barberId !== "all") {
      setFormData((prev) => ({ ...prev, barber_id: barberId }));
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const service = services.find((s) => s.id === formData.service_id);
    if (!service || !selectedTimeSlot) return;

    // Calculate end time based on service duration
    const [hours, minutes] = selectedTimeSlot.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration_minutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    const barberId = formData.barber_id || (selectedBarberId !== "all" ? selectedBarberId : team[0]?.id) || "";

    await createAppointment({
      barbershop_id: barbershopId,
      barber_id: barberId,
      team_member_id: barberId || null,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      service_id: formData.service_id,
      date: dateString,
      start_time: selectedTimeSlot,
      end_time: endTime,
      price: service.price,
      status: "confirmed",
      notes: formData.notes || null,
      client_id: null,
    });

    // Notify about new appointment
    try {
      const barber = team.find(t => t.id === barberId);
      await supabase.functions.invoke('notify-new-appointment', {
        body: {
          appointment_id: '', // Will be filled by the edge function
          barbershop_id: barbershopId,
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          date: dateString,
          start_time: selectedTimeSlot,
          service_name: service.name,
          barber_name: barber?.name
        }
      });
    } catch (error) {
      console.log('Notification sent or failed silently');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleStatusChange = async (id: string, status: Appointment["status"]) => {
    await updateAppointment(id, { status });
  };

  const openWhatsApp = (phone: string, name: string, date: string, time: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedDate = format(parseISO(date), "dd/MM", { locale: ptBR });
    const message = encodeURIComponent(
      `Olá ${name}! 👋\n\nLembrando do seu agendamento:\n📅 Data: ${formattedDate}\n⏰ Horário: ${time}\n\nTe esperamos! 💈`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAppointmentAtSlot = (time: string, barberId?: string) => {
    return dayAppointments.find((a) => {
      const matchesTime = a.start_time.slice(0, 5) === time;
      if (barberId && barberId !== "all") {
        return matchesTime && a.barber_id === barberId;
      }
      return matchesTime;
    });
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

  const navigatePeriod = (direction: number) => {
    if (viewMode === "day") {
      setSelectedDate(d => addDays(d, direction));
    } else if (viewMode === "week") {
      setSelectedDate(d => addWeeks(d, direction));
    } else {
      setSelectedDate(d => addMonths(d, direction));
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Agenda</h2>
          <p className="text-muted-foreground">
            {viewMode === "day" && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            {viewMode === "week" && `Semana de ${format(weekStart, "dd/MM")} a ${format(addDays(weekStart, 6), "dd/MM")}`}
            {viewMode === "month" && format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newAppointmentCount > 0 && (
            <Badge className="bg-green-500 text-white animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              {newAppointmentCount} novo(s)
            </Badge>
          )}
          <Button variant="hero" onClick={() => openCreateDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* View Mode & Barber Filter */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {/* View Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Mês
            </Button>
          </div>

          {/* Barber Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {team.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {getAppointmentCountForDate(selectedDate, selectedBarberId !== "all" ? selectedBarberId : undefined)}
            </p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {getWeekAppointmentCount(selectedBarberId !== "all" ? selectedBarberId : undefined)}
            </p>
            <p className="text-xs text-muted-foreground">Semana</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {getMonthAppointmentCount(selectedBarberId !== "all" ? selectedBarberId : undefined)}
            </p>
            <p className="text-xs text-muted-foreground">Mês</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePeriod(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePeriod(1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week View */}
        {(viewMode === "day" || viewMode === "week") && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const count = getAppointmentCountForDate(day, selectedBarberId !== "all" ? selectedBarberId : undefined);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if (viewMode === "week") setViewMode("day");
                  }}
                  className={cn(
                    "p-3 rounded-lg text-center transition-all relative",
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <p className="text-xs uppercase text-muted-foreground">
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p className="text-lg font-semibold">{format(day, "d")}</p>
                  {count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "absolute -top-1 -right-1 h-5 min-w-5 text-xs",
                        isSameDay(day, selectedDate) ? "bg-background text-foreground" : ""
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-1">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            {monthDays.map((day) => {
              const count = getAppointmentCountForDate(day, selectedBarberId !== "all" ? selectedBarberId : undefined);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setViewMode("day");
                  }}
                  className={cn(
                    "p-2 rounded-lg text-center transition-all relative min-h-[60px]",
                    isSameDay(day, selectedDate)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  )}
                >
                  <p className="text-sm">{format(day, "d")}</p>
                  {count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "mt-1 h-4 text-[10px]",
                        isSameDay(day, selectedDate) ? "bg-background text-foreground" : ""
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Schedule - Only show in day view */}
      {viewMode === "day" && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">
              {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? "s" : ""}{" "}
              {selectedBarberId !== "all" ? `para ${getBarberName(selectedBarberId)}` : ""}
            </h3>
          </div>

          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {timeSlots.map((time) => {
              const appointment = getAppointmentAtSlot(time, selectedBarberId !== "all" ? selectedBarberId : undefined);
              
              return (
                <div
                  key={time}
                  className={cn(
                    "flex items-center gap-4 p-4 transition-colors",
                    appointment ? "bg-secondary/30" : "hover:bg-secondary/20"
                  )}
                >
                  <div className="w-16 text-sm font-medium text-muted-foreground">
                    {time}
                  </div>

                  {appointment ? (
                    <div className="flex-1 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">
                            {getInitials(appointment.client_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {appointment.client_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getServiceName(appointment.service_id)}</span>
                            <span>•</span>
                            <span>{getBarberName(appointment.barber_id)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={cn("border", statusColors[appointment.status])}>
                          {statusLabels[appointment.status]}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openWhatsApp(
                            appointment.client_phone,
                            appointment.client_name,
                            appointment.date,
                            appointment.start_time
                          )}
                          title="Enviar lembrete WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        </Button>

                        {appointment.status === "confirmed" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStatusChange(appointment.id, "completed")}
                              title="Marcar como concluído"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStatusChange(appointment.id, "no_show")}
                              title="Não compareceu"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCreateDialog(time, selectedBarberId)}
                      className="flex-1 py-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + Adicionar agendamento
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week/Month List View */}
      {(viewMode === "week" || viewMode === "month") && filteredAppointments.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">
              {filteredAppointments.length} agendamento{filteredAppointments.length !== 1 ? "s" : ""}{" "}
              {viewMode === "week" ? "nesta semana" : "neste mês"}
              {selectedBarberId !== "all" ? ` para ${getBarberName(selectedBarberId)}` : ""}
            </h3>
          </div>

          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredAppointments
              .sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.start_time.localeCompare(b.start_time);
              })
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="w-24">
                    <p className="text-sm font-medium">{format(parseISO(appointment.date), "dd/MM", { locale: ptBR })}</p>
                    <p className="text-sm text-muted-foreground">{appointment.start_time.slice(0, 5)}</p>
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {getInitials(appointment.client_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {appointment.client_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getServiceName(appointment.service_id)}</span>
                        <span>•</span>
                        <span>{getBarberName(appointment.barber_id)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge className={cn("border", statusColors[appointment.status])}>
                    {statusLabels[appointment.status]}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openWhatsApp(
                      appointment.client_phone,
                      appointment.client_name,
                      appointment.date,
                      appointment.start_time
                    )}
                  >
                    <MessageCircle className="w-4 h-4 text-green-500" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {(viewMode === "week" || viewMode === "month") && filteredAppointments.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">
            Nenhum agendamento {viewMode === "week" ? "nesta semana" : "neste mês"}
            {selectedBarberId !== "all" ? ` para ${getBarberName(selectedBarberId)}` : ""}
          </p>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <div className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{format(selectedDate, "dd/MM/yyyy")}</span>
                </div>
              </div>
              <div>
                <Label>Horário *</Label>
                <Select value={selectedTimeSlot || ""} onValueChange={setSelectedTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="client_name">Nome do Cliente *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="pl-9"
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="client_phone">WhatsApp *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  className="pl-9"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Serviço *</Label>
              <Select
                value={formData.service_id}
                onValueChange={(value) => setFormData({ ...formData, service_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter((s) => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Barbeiro</Label>
              <Select
                value={formData.barber_id || (selectedBarberId !== "all" ? selectedBarberId : "")}
                onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações opcionais"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.client_name || !formData.client_phone || !formData.service_id || !selectedTimeSlot}>
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
