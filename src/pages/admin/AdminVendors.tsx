import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServiceVendors, ServiceVendor } from "@/hooks/useServiceVendors";
import { useAdminServiceVendors, ServiceVendorInput } from "@/hooks/useAdminServiceVendors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, ShieldCheck, ShieldX, Loader2, Upload, Building2,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "AC Repair", "Washing Machine", "Refrigerator", "Electrical",
  "Plumbing", "HVAC", "General Appliance", "Kitchen Appliance",
  "Water Heater", "Generator", "Solar", "Other",
];

const emptyForm: ServiceVendorInput = {
  vendor_name: "", description: "", category: "", location: "",
  contact_phone: "", contact_email: "", whatsapp_link: "", logo_url: "", is_verified: false,
};

const AdminVendors = () => {
  const { data: vendors, isLoading } = useServiceVendors();
  const { addVendor, updateVendor, deleteVendor, uploadLogo } = useAdminServiceVendors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceVendorInput>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (v: ServiceVendor) => {
    setEditingId(v.id);
    setForm({
      vendor_name: v.vendor_name,
      description: v.description || "",
      category: v.category,
      location: v.location || "",
      contact_phone: v.contact_phone || "",
      contact_email: v.contact_email || "",
      whatsapp_link: v.whatsapp_link || "",
      logo_url: v.logo_url || "",
      is_verified: v.is_verified,
    });
    setDialogOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setForm((f) => ({ ...f, logo_url: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.vendor_name || !form.category) {
      toast.error("Name and category are required");
      return;
    }
    if (editingId) {
      updateVendor.mutate({ id: editingId, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      addVendor.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteVendor.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const toggleVerified = (v: ServiceVendor) => {
    updateVendor.mutate({ id: v.id, ...v, is_verified: !v.is_verified });
  };

  const setField = (key: keyof ServiceVendorInput, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vendor Management</h1>
            <p className="text-muted-foreground">Manage service vendors visible to all users</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-32" /></CardContent></Card>
            ))}
          </div>
        ) : !vendors || vendors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold mb-1">No vendors yet</h3>
              <p className="text-sm">Add your first service vendor to the directory</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <Card key={v.id} className="relative">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
                      <AvatarImage src={v.logo_url || undefined} className="object-cover" />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                        {v.vendor_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{v.vendor_name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">{v.category}</Badge>
                    </div>
                    <Badge
                      variant={v.is_verified ? "default" : "outline"}
                      className="cursor-pointer gap-1 flex-shrink-0"
                      onClick={() => toggleVerified(v)}
                    >
                      {v.is_verified ? (
                        <><ShieldCheck className="w-3 h-3" /> Verified</>
                      ) : (
                        <><ShieldX className="w-3 h-3" /> Unverified</>
                      )}
                    </Badge>
                  </div>
                  {v.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                  )}
                  {v.location && (
                    <p className="text-xs text-muted-foreground">{v.location}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteId(v.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update vendor details" : "Add a new service vendor to the directory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input value={form.vendor_name} onChange={(e) => setField("vendor_name", e.target.value)} placeholder="e.g. ABC Repair Services" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setField("description", e.target.value)} placeholder="Short description of services..." />
            </div>
            <div className="space-y-2">
              <Label>Location / Service Area</Label>
              <Input value={form.location || ""} onChange={(e) => setField("location", e.target.value)} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.contact_phone || ""} onChange={(e) => setField("contact_phone", e.target.value)} placeholder="+234..." />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.contact_email || ""} onChange={(e) => setField("contact_email", e.target.value)} placeholder="contact@vendor.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Link</Label>
              <Input value={form.whatsapp_link || ""} onChange={(e) => setField("whatsapp_link", e.target.value)} placeholder="https://wa.me/234..." />
            </div>
            <div className="space-y-2">
              <Label>Logo / Profile Image</Label>
              <div className="flex items-center gap-3">
                {form.logo_url && (
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={form.logo_url} className="object-cover" />
                    <AvatarFallback className="rounded-lg">?</AvatarFallback>
                  </Avatar>
                )}
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploading ? "Uploading..." : "Upload Logo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_verified || false} onCheckedChange={(v) => setField("is_verified", v)} />
              <Label>Mark as Verified</Label>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={addVendor.isPending || updateVendor.isPending}
              className="w-full"
            >
              {(addVendor.isPending || updateVendor.isPending) ? "Saving..." : editingId ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this vendor from the directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteVendor.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminVendors;
