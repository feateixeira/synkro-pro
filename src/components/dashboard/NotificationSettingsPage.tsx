import { useState, useEffect } from "react";
import { Bell, Calendar, Clock, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";

interface NotificationSettingsPageProps {
  barbershopId: string;
}

const NotificationSettingsPage = ({ barbershopId }: NotificationSettingsPageProps) => {
  const { preferences, isLoading, upsertPreferences, isUpdating } = useNotificationPreferences(barbershopId);

  const [newAppointment, setNewAppointment] = useState(true);
  const [appointmentCanceled, setAppointmentCanceled] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState("30");

  useEffect(() => {
    if (preferences) {
      setNewAppointment(preferences.new_appointment);
      setAppointmentCanceled(preferences.appointment_canceled);
      setAppointmentReminder(preferences.appointment_reminder);
      setReminderMinutes(preferences.reminder_minutes.toString());
    }
  }, [preferences]);

  const handleSave = () => {
    upsertPreferences({
      new_appointment: newAppointment,
      appointment_canceled: appointmentCanceled,
      appointment_reminder: appointmentReminder,
      reminder_minutes: parseInt(reminderMinutes),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações de Notificações</h1>
        <p className="text-muted-foreground">Personalize quais notificações você deseja receber</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tipos de Notificação
          </CardTitle>
          <CardDescription>
            Escolha quais eventos devem gerar notificações para você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-appointment" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Novo agendamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba uma notificação quando um cliente fizer um novo agendamento
              </p>
            </div>
            <Switch
              id="new-appointment"
              checked={newAppointment}
              onCheckedChange={setNewAppointment}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="canceled" className="flex items-center gap-2">
                <X className="h-4 w-4 text-destructive" />
                Agendamento cancelado
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba uma notificação quando um agendamento for cancelado
              </p>
            </div>
            <Switch
              id="canceled"
              checked={appointmentCanceled}
              onCheckedChange={setAppointmentCanceled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Lembrete de agendamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes antes dos agendamentos
              </p>
            </div>
            <Switch
              id="reminder"
              checked={appointmentReminder}
              onCheckedChange={setAppointmentReminder}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo de Antecedência
          </CardTitle>
          <CardDescription>
            Configure quanto tempo antes do agendamento você deseja receber o lembrete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="reminder-time">Lembrar com antecedência de:</Label>
            <Select
              value={reminderMinutes}
              onValueChange={setReminderMinutes}
              disabled={!appointmentReminder}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="1440">1 dia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
