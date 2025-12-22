import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { useTeam } from "@/hooks/useTeam";
import { useLoyalty } from "@/hooks/useLoyalty";
import { 
  Calendar, Clock, User, Check, Phone, MessageCircle,
  Gift, TrendingUp, Users, DollarSign
} from "lucide-react";
import { format, parseISO, isToday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BarberDashboardProps {
  barbershopId: string;
  barberId: string;
  barberName: string;
}

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

export const BarberDashboard = ({ barbershopId, barberId, barberName }: BarberDashboardProps) => {
  const { appointments, updateAppointment } = useAppointments(barbershopId);
  const { services } = useServices(barbershopId);
  const { clients } = useClients(barbershopId);
  const { addPoint, isAddingPoint } = useLoyalty(barbershopId);

  // Filter appointments for this barber
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const myAppointments = appointments.filter(a => a.barber_id === barberId);
  const todayAppointments = myAppointments.filter(a => a.date === todayStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  
  const pendingTasks = todayAppointments.filter(a => a.status === "confirmed" || a.status === "pending");
  const completedToday = todayAppointments.filter(a => a.status === "completed");
  const todayRevenue = completedToday.reduce((sum, a) => sum + Number(a.price), 0);

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return "Serviço";
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "Serviço";
  };

  const getClientId = (phone: string) => {
    const client = clients.find(c => c.phone === phone);
    return client?.id;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleComplete = async (appointmentId: string, clientPhone: string) => {
    // Mark as completed
    await updateAppointment(appointmentId, { status: "completed" });
    
    // Add loyalty point if client exists
    const clientId = getClientId(clientPhone);
    if (clientId) {
      addPoint(clientId);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${name}! 👋 Tudo pronto para te atender. Te esperamos! 💈`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary/20 text-primary text-xl">
              {getInitials(barberName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-2xl font-bold">Olá, {barberName.split(" ")[0]}!</h2>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{todayAppointments.length}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{completedToday.length}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">R${todayRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Faturado</p>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Próximos Atendimentos
          </h3>
          <Badge variant="secondary">{pendingTasks.length} pendente(s)</Badge>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">Nenhum atendimento pendente! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((appointment) => (
              <div key={appointment.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center p-2 bg-primary/10 rounded-lg min-w-[60px]">
                      <p className="text-lg font-bold text-primary">
                        {appointment.start_time.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{appointment.client_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getServiceName(appointment.service_id)}
                      </p>
                      <Badge className={cn("mt-1 border text-xs", statusColors[appointment.status])}>
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWhatsApp(appointment.client_phone, appointment.client_name)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleComplete(appointment.id, appointment.client_phone)}
                      disabled={isAddingPoint}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Finalizar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Concluídos Hoje
          </h3>
          <div className="space-y-2">
            {completedToday.map((appointment) => (
              <div key={appointment.id} className="glass-card p-3 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {appointment.start_time.slice(0, 5)}
                  </span>
                  <span>{appointment.client_name}</span>
                </div>
                <Badge variant="secondary">R$ {Number(appointment.price).toFixed(0)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
