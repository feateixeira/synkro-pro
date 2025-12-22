import { useState } from "react";
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
import { useGallery, GalleryImage } from "@/hooks/useGallery";
import { useTeam } from "@/hooks/useTeam";
import { 
  Plus, Loader2, Upload, Trash2, Star, StarOff, Image as ImageIcon,
  Camera
} from "lucide-react";

interface GalleryPageProps {
  barbershopId: string;
}

export const GalleryPage = ({ barbershopId }: GalleryPageProps) => {
  const { images, isLoading, uploadImage, isUploading, deleteImage, toggleFeatured } = useGallery(barbershopId);
  const { team } = useTeam(barbershopId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    barber_id: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ title: "", description: "", barber_id: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    uploadImage(
      {
        file: selectedFile,
        barberId: formData.barber_id || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      }
    );
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
          <h2 className="font-display text-2xl font-bold text-foreground">Galeria & Portfólio</h2>
          <p className="text-muted-foreground">
            Mostre seus melhores trabalhos para atrair novos clientes
          </p>
        </div>
        <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
          <Camera className="w-4 h-4 mr-2" />
          Adicionar Foto
        </Button>
      </div>

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma foto ainda</h3>
          <p className="text-muted-foreground mb-4">
            Adicione fotos dos seus melhores cortes para impressionar seus clientes
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar primeira foto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden">
              <img
                src={image.image_url}
                alt={image.title || "Corte de cabelo"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/40"
                    onClick={() => toggleFeatured({ imageId: image.id, isFeatured: !image.is_featured })}
                  >
                    {image.is_featured ? (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="w-4 h-4 text-white" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-red-500/80"
                    onClick={() => deleteImage(image.id)}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </div>
                
                <div>
                  {image.title && (
                    <p className="text-white font-medium text-sm">{image.title}</p>
                  )}
                  {image.barber_id && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {team.find(t => t.id === image.barber_id)?.name || "Barbeiro"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Featured indicator */}
              {image.is_featured && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-yellow-500 text-black">
                    <Star className="w-3 h-3 mr-1 fill-black" />
                    Destaque
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Foto ao Portfólio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Preview */}
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Degradê moderno"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o estilo do corte..."
                rows={2}
              />
            </div>

            <div>
              <Label>Barbeiro</Label>
              <Select
                value={formData.barber_id}
                onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o barbeiro (opcional)" />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
