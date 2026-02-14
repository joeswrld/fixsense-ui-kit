import { useState, useMemo } from "react";
import { useServiceVendors, ServiceVendor } from "@/hooks/useServiceVendors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Phone, Mail, MessageCircle, MapPin, ShieldCheck, Building2,
} from "lucide-react";

const ServiceVendorCard = ({ vendor }: { vendor: ServiceVendor }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 rounded-lg flex-shrink-0">
            <AvatarImage src={vendor.logo_url || undefined} alt={vendor.vendor_name} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-lg">
              {vendor.vendor_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{vendor.vendor_name}</h3>
              {vendor.is_verified && (
                <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>

            <Badge variant="secondary" className="text-xs">
              {vendor.category}
            </Badge>

            {vendor.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{vendor.description}</p>
            )}

            {vendor.location && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {vendor.location}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {vendor.contact_phone && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`tel:${vendor.contact_phone}`}>
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </a>
                </Button>
              )}
              {vendor.whatsapp_link && (
                <Button size="sm" variant="outline" asChild>
                  <a href={vendor.whatsapp_link} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {vendor.contact_email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${vendor.contact_email}`}>
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ServiceVendorDirectory = () => {
  const { data: vendors, isLoading } = useServiceVendors();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const categories = useMemo(() => {
    if (!vendors) return [];
    return [...new Set(vendors.map((v) => v.category))].sort();
  }, [vendors]);

  const locations = useMemo(() => {
    if (!vendors) return [];
    return [...new Set(vendors.filter((v) => v.location).map((v) => v.location!))].sort();
  }, [vendors]);

  const filtered = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter((v) => {
      if (verifiedOnly && !v.is_verified) return false;
      if (categoryFilter !== "all" && v.category !== categoryFilter) return false;
      if (locationFilter !== "all" && v.location !== locationFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.vendor_name.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q)) ||
          (v.location && v.location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [vendors, search, categoryFilter, locationFilter, verifiedOnly]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Service Vendor Directory
        </CardTitle>
        <CardDescription>Find verified service professionals for your appliances</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <Label htmlFor="verified-only" className="text-sm whitespace-nowrap">Verified only</Label>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold mb-1">No vendors found</h3>
            <p className="text-sm">
              {vendors && vendors.length > 0
                ? "Try adjusting your filters"
                : "Service vendors will appear here once added by administrators"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((vendor) => (
              <ServiceVendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
