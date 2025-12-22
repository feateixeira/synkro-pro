import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GalleryImage {
  id: string;
  barbershop_id: string;
  barber_id: string | null;
  image_url: string;
  title: string | null;
  description: string | null;
  is_featured: boolean;
  created_at: string;
}

export const useGallery = (barbershopId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery-images", barbershopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("barbershop_id", barbershopId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!barbershopId,
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ 
      file, 
      barberId, 
      title, 
      description 
    }: { 
      file: File; 
      barberId?: string; 
      title?: string; 
      description?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${barbershopId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      // Insert into gallery_images table
      const { data, error } = await supabase
        .from("gallery_images")
        .insert({
          barbershop_id: barbershopId,
          barber_id: barberId || null,
          image_url: publicUrl,
          title: title || null,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", barbershopId] });
      toast({
        title: "✅ Imagem adicionada!",
        description: "Foto adicionada ao portfólio com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const image = images.find(img => img.id === imageId);
      if (image) {
        // Extract file path from URL
        const urlParts = image.image_url.split('/gallery/');
        if (urlParts[1]) {
          await supabase.storage.from('gallery').remove([urlParts[1]]);
        }
      }

      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", barbershopId] });
      toast({
        title: "✅ Imagem removida!",
        description: "Foto removida do portfólio",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ imageId, isFeatured }: { imageId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_featured: isFeatured })
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images", barbershopId] });
    },
  });

  const getBarberImages = (barberId: string) => {
    return images.filter(img => img.barber_id === barberId);
  };

  const getFeaturedImages = () => {
    return images.filter(img => img.is_featured);
  };

  return {
    images,
    isLoading,
    uploadImage: uploadImageMutation.mutate,
    isUploading: uploadImageMutation.isPending,
    deleteImage: deleteImageMutation.mutate,
    isDeleting: deleteImageMutation.isPending,
    toggleFeatured: toggleFeaturedMutation.mutate,
    getBarberImages,
    getFeaturedImages,
  };
};
