import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, Loader2, Calendar as CalendarIcon, Clock, 
  User, Phone, Check, Star, ChevronLeft 
} from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  instagram: string | null;
  whatsapp: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[] | null;
}

interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  team_member_id: string | null;
  barber_id: string | null;
}

interface WorkingHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | null;
}

interface BlockedTime {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean | null;
}

const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    currentMinutes += 30; // 30 minute intervals
  }
  
  return slots;
};

const defaultTimeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00"
];

const PublicBooking = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step: 1=Barber, 2=Service, 3=Date, 4=Time, 5=ClientInfo
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<TeamMember | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      try {
        // Fetch barbershop by slug
        const { data: shop, error: shopError } = await supabase
          .from("barbershops")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (shopError || !shop) {
          console.error("Barbershop not found:", shopError);
          setIsLoading(false);
          return;
        }

        setBarbershop(shop);

        // Fetch services
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes, description")
          .eq("barbershop_id", shop.id)
          .eq("is_active", true)
          .order("name");

        setServices(servicesData || []);

        // Fetch team members
        const { data: teamData } = await supabase
          .from("team_members")
          .select("id, name, avatar_url, bio, specialties")
          .eq("barbershop_id", shop.id)
          .eq("is_active", true)
          .order("name");

        setTeamMembers(teamData || []);

        // Fetch working hours
        const { data: hoursData } = await supabase
          .from("working_hours")
          .select("id, day_of_week, start_time, end_time, is_active")
          .eq("barbershop_id", shop.id)
          .eq("is_active", true)
          .order("day_of_week");

        setWorkingHours(hoursData || []);

        // Fetch blocked times
        const { data: blockedData } = await supabase
          .from("blocked_times")
          .select("id, date, start_time, end_time, is_recurring")
          .eq("barbershop_id", shop.id);

        setBlockedTimes(blockedData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Fetch appointments when barber and date are selected
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!barbershop || !selectedBarber || !selectedDate) return;

      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { data } = await supabase
        .from("appointments")
        .select("id, date, start_time, end_time, team_member_id, barber_id")
        .eq("barbershop_id", barbershop.id)
        .eq("date", dateStr)
        .neq("status", "canceled");

      setAppointments(data || []);
    };

    fetchAppointments();
  }, [barbershop, selectedBarber, selectedDate]);

  const getAvailableTimeSlots = () => {
    if (!selectedBarber || !selectedDate) return [];

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Find working hours for this day
    const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    
    // If no working hours for this day, return empty
    if (!dayHours || !dayHours.is_active) return [];

    // Generate time slots based on working hours
    const timeSlots = generateTimeSlots(
      dayHours.start_time.slice(0, 5), 
      dayHours.end_time.slice(0, 5)
    );

    // Filter appointments for the selected barber
    const barberAppointments = appointments.filter(
      (a) => a.team_member_id === selectedBarber.id
    );

    // Get booked times
    const bookedTimes = barberAppointments.map((a) => a.start_time.slice(0, 5));

    // Get blocked times for this date (recurring or specific)
    const blockedForDate = blockedTimes.filter(bt => 
      bt.is_recurring || bt.date === dateStr
    );

    // Check if a time slot is blocked
    const isTimeBlocked = (time: string): boolean => {
      const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
      
      return blockedForDate.some(bt => {
        const startMinutes = parseInt(bt.start_time.slice(0, 2)) * 60 + parseInt(bt.start_time.slice(3, 5));
        const endMinutes = parseInt(bt.end_time.slice(0, 2)) * 60 + parseInt(bt.end_time.slice(3, 5));
        return timeMinutes >= startMinutes && timeMinutes < endMinutes;
      });
    };

    // Filter out booked and blocked times
    return timeSlots.filter((time) => 
      !bookedTimes.includes(time) && !isTimeBlocked(time)
    );
  };

  // Check if a date is available (has working hours)
  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    return dayHours?.is_active ?? false;
  };

  const handleSubmit = async () => {
    if (!barbershop || !selectedBarber || !selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      return;
    }

    setIsSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + selectedService.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

      const { error } = await supabase.from("appointments").insert({
        barbershop_id: barbershop.id,
        team_member_id: selectedBarber.id,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTime,
        end_time: endTime,
        price: selectedService.price,
        status: "pending",
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Agendamento realizado!",
        description: "Você receberá uma confirmação em breve.",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Erro ao agendar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 4) setSelectedTime(null);
      if (step === 3) setSelectedDate(undefined);
      if (step === 2) setSelectedService(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Scissors className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
          <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  const handleNewBooking = () => {
    setSuccess(false);
    setStep(1);
    setSelectedBarber(null);
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setClientName("");
    setClientPhone("");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            Seu horário foi reservado. Você receberá um lembrete no WhatsApp.
          </p>
          <div className="bg-secondary/50 rounded-lg p-4 text-left space-y-2">
            <p><strong>Profissional:</strong> {selectedBarber?.name}</p>
            <p><strong>Serviço:</strong> {selectedService?.name}</p>
            <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
            <p><strong>Horário:</strong> {selectedTime}</p>
            <p><strong>Local:</strong> {barbershop.name}</p>
          </div>
          <Button 
            onClick={handleNewBooking} 
            className="mt-6 w-full"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Fazer Novo Agendamento
          </Button>
        </div>
      </div>
    );
  }

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      {barbershop.cover_image_url && (
        <div className="relative h-40 sm:h-56 w-full overflow-hidden">
          <img 
            src={barbershop.cover_image_url} 
            alt={`Capa de ${barbershop.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      {/* Header */}
      <header className={cn(
        "border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-10",
        barbershop.cover_image_url && "relative -mt-12 mx-4 sm:mx-auto max-w-2xl rounded-t-xl"
      )}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {barbershop.logo_url ? (
              <img 
                src={barbershop.logo_url} 
                alt={barbershop.name} 
                className="w-12 h-12 rounded-lg object-cover border-2 border-background shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center shadow-lg">
                <Scissors className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display font-bold text-foreground text-lg">{barbershop.name}</h1>
              {barbershop.address && (
                <p className="text-sm text-muted-foreground">{barbershop.address}</p>
              )}
            </div>
            {barbershop.whatsapp && (
              <a 
                href={`https://wa.me/${barbershop.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
          {barbershop.description && (
            <p className="text-sm text-muted-foreground mt-3">{barbershop.description}</p>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s}
              className={cn(
                "flex-1 h-1 rounded-full mx-1 transition-all duration-300",
                s <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Passo {step} de 5
        </p>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-8">
        {/* Back Button */}
        {step > 1 && (
          <Button 
            variant="ghost" 
            onClick={goBack} 
            className="mb-4 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        )}

        {/* Step 1: Select Barber */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Escolha o Profissional</h2>
              <p className="text-muted-foreground">Selecione quem vai te atender</p>
            </div>

            {teamMembers.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">Nenhum profissional disponível no momento.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedBarber(member);
                      setStep(2);
                    }}
                    className={cn(
                      "glass-card p-4 text-left transition-all hover:border-primary/50 flex items-center gap-4",
                      selectedBarber?.id === member.id && "border-primary"
                    )}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-lg">{member.name}</p>
                      {member.specialties && member.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.specialties.slice(0, 3).map((spec, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Escolha o Serviço</h2>
              <p className="text-muted-foreground">
                Atendimento com <strong>{selectedBarber?.name}</strong>
              </p>
            </div>

            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(3);
                  }}
                  className={cn(
                    "glass-card p-4 text-left transition-all hover:border-primary/50",
                    selectedService?.id === service.id && "border-primary"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {service.duration_minutes} minutos
                      </p>
                    </div>
                    <span className="text-lg font-bold text-primary ml-4">
                      R$ {service.price.toFixed(0)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Escolha a Data</h2>
              <p className="text-muted-foreground">
                {selectedService?.name} com {selectedBarber?.name}
              </p>
            </div>

            <div className="glass-card p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                  if (date) setStep(4);
                }}
                disabled={(date) => isBefore(date, startOfToday()) || !isDateAvailable(date)}
                locale={ptBR}
                className="mx-auto"
              />
            </div>
          </div>
        )}

        {/* Step 4: Select Time */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Escolha o Horário</h2>
              <p className="text-muted-foreground">
                {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            {availableTimeSlots.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum horário disponível para {selectedBarber?.name} neste dia.
                </p>
                <Button variant="outline" onClick={() => setStep(3)}>
                  Escolher outra data
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      setStep(5);
                    }}
                    className={cn(
                      "p-3 rounded-lg border border-border text-center transition-all hover:border-primary hover:bg-primary/10",
                      selectedTime === time && "border-primary bg-primary/10"
                    )}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-sm font-medium">{time}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Client Info */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Seus Dados</h2>
              <p className="text-muted-foreground">Para confirmar seu agendamento</p>
            </div>

            <div className="glass-card p-4 space-y-4">
              {/* Summary */}
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedBarber?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {selectedBarber && getInitials(selectedBarber.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedBarber?.name}</span>
                </div>
                <p><strong>Serviço:</strong> {selectedService?.name}</p>
                <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy")}</p>
                <p><strong>Horário:</strong> {selectedTime}</p>
                <p className="text-lg font-bold text-primary pt-2 border-t border-border">
                  Total: R$ {selectedService?.price.toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="pl-10"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">WhatsApp *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || !clientName || !clientPhone}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicBooking;
