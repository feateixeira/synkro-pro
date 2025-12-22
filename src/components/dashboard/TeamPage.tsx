import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeam, TeamMember } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Pencil, Loader2, UserCog, Phone, Mail, Percent, 
  Plus, Trash2, UserPlus, Camera, Upload
} from "lucide-react";

interface TeamPageProps {
  barbershopId: string;
}

export const TeamPage = ({ barbershopId }: TeamPageProps) => {
  const { team, isLoading, addMember, updateMember, deleteMember, toggleActive } = useTeam(barbershopId);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    commission_percentage: "50",
    bio: "",
    specialties: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      commission_percentage: "50",
      bio: "",
      specialties: "",
    });
    setEditingMember(null);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone || "",
      email: member.email || "",
      commission_percentage: String(member.commission_percentage || 50),
      bio: member.bio || "",
      specialties: member.specialties?.join(", ") || "",
    });
    setPreviewUrl(member.avatar_url);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (memberId: string): Promise<string | null> => {
    if (!selectedFile) return editingMember?.avatar_url || null;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${memberId}-${Date.now()}.${fileExt}`;
      const filePath = `${barbershopId}/${fileName}`;

      // Delete old avatar if exists
      if (editingMember?.avatar_url) {
        const oldPath = editingMember.avatar_url.split("/team-avatars/")[1];
        if (oldPath) {
          await supabase.storage.from("team-avatars").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("team-avatars")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("team-avatars")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
      return editingMember?.avatar_url || null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberData = {
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      commission_percentage: parseFloat(formData.commission_percentage),
      bio: formData.bio || null,
      specialties: formData.specialties 
        ? formData.specialties.split(",").map(s => s.trim()).filter(Boolean)
        : null,
    };

    if (editingMember) {
      // Upload avatar first if there's a new file
      const avatarUrl = await uploadAvatar(editingMember.id);
      await updateMember(editingMember.id, { ...memberData, avatar_url: avatarUrl });
    } else {
      // For new members, create first then upload avatar
      const newMember = await addMember({
        ...memberData,
        barbershop_id: barbershopId,
        avatar_url: null,
        is_active: true,
        revenue_goal: null,
      });
      
      // If member was created and we have a file, upload and update
      if (newMember && selectedFile) {
        const avatarUrl = await uploadAvatar(newMember.id);
        if (avatarUrl) {
          await updateMember(newMember.id, { avatar_url: avatarUrl });
        }
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover ${name} da equipe?`)) {
      await deleteMember(id);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeMembers = team.filter(m => m.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Equipe</h2>
          <p className="text-muted-foreground">
            {activeMembers.length} membro{activeMembers.length !== 1 ? "s" : ""} ativo{activeMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openAddDialog} variant="hero" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar Membro
        </Button>
      </div>

      {/* Team List */}
      {team.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserCog className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h3 className="font-display text-xl font-semibold mb-2">Nenhum membro na equipe</h3>
          <p className="text-muted-foreground mb-6">
            Adicione os barbeiros da sua equipe para gerenciar agendamentos e comissões.
          </p>
          <Button onClick={openAddDialog} variant="hero" className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Primeiro Membro
          </Button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Membro</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        {member.specialties && member.specialties.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {member.specialties.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {member.phone}
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {member.email}
                        </div>
                      )}
                      {!member.phone && !member.email && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {member.commission_percentage || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={member.is_active ?? true}
                        onCheckedChange={(checked) => toggleActive(member.id, checked)}
                      />
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(member.id, member.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Editar Membro" : "Adicionar Membro"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                    {formData.name ? getInitials(formData.name) : <Camera className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {previewUrl ? "Trocar Foto" : "Adicionar Foto"}
              </Button>
            </div>

            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do barbeiro"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-9"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="commission">Porcentagem de Comissão</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Porcentagem que o barbeiro recebe por cada serviço
              </p>
            </div>

            <div>
              <Label htmlFor="specialties">Especialidades</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="Degradê, Barba, Navalhado (separado por vírgula)"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Breve descrição sobre o barbeiro..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  editingMember ? "Salvar" : "Adicionar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
