import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceVendorInput {
  vendor_name: string;
  description?: string | null;
  category: string;
  location?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  whatsapp_link?: string | null;
  logo_url?: string | null;
  is_verified?: boolean;
}

export function useAdminServiceVendors() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["service-vendors"] });

  const addVendor = useMutation({
    mutationFn: async (vendor: ServiceVendorInput) => {
      const { error } = await supabase.from("service_vendors").insert(vendor);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Vendor added successfully");
    },
    onError: (e) => {
      toast.error("Failed to add vendor");
      console.error(e);
    },
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: ServiceVendorInput & { id: string }) => {
      const { error } = await supabase
        .from("service_vendors")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Vendor updated successfully");
    },
    onError: (e) => {
      toast.error("Failed to update vendor");
      console.error(e);
    },
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_vendors")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Vendor deleted successfully");
    },
    onError: (e) => {
      toast.error("Failed to delete vendor");
      console.error(e);
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("vendor-logos")
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage
      .from("vendor-logos")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  return { addVendor, updateVendor, deleteVendor, uploadLogo };
}
