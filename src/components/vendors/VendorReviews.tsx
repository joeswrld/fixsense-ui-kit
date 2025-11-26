import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, MessageSquare, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface VendorReview {
  id: string;
  rating: number;
  review: string | null;
  cost: number | null;
  service_date: string | null;
  created_at: string;
  appliances: {
    name: string;
    type: string;
  } | null;
}

interface VendorReviewsProps {
  vendorId: string;
  vendorName: string;
}

export const VendorReviews = ({ vendorId, vendorName }: VendorReviewsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [selectedAppliance, setSelectedAppliance] = useState("");
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_ratings')
        .select(`
          *,
          appliances (name, type)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VendorReview[];
    },
  });

  const { data: appliances = [] } = useQuery({
    queryKey: ['user-appliances'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('appliances')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (newReview: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('vendor_ratings')
        .insert({
          vendor_id: vendorId,
          user_id: user.id,
          ...newReview,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats', vendorId] });
      toast.success("Review submitted successfully");
      setIsDialogOpen(false);
      setRating(5);
      setReview("");
      setCost("");
      setServiceDate("");
      setSelectedAppliance("");
    },
    onError: (error) => {
      toast.error("Failed to submit review");
      console.error(error);
    },
  });

  const handleSubmit = () => {
    createReviewMutation.mutate({
      rating,
      review: review || null,
      cost: cost ? parseFloat(cost) : null,
      service_date: serviceDate || null,
      appliance_id: selectedAppliance || null,
    });
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:fill-yellow-400 hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reviews & Ratings</CardTitle>
              <CardDescription>
                {reviews.length} review{reviews.length !== 1 ? 's' : ''} • Average: {avgRating} ⭐
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Review {vendorName}</DialogTitle>
                  <DialogDescription>Share your experience with this vendor</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating *</Label>
                    {renderStars(rating, true, setRating)}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appliance">Appliance (Optional)</Label>
                    <Select value={selectedAppliance} onValueChange={setSelectedAppliance}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appliance" />
                      </SelectTrigger>
                      <SelectContent>
                        {appliances.map(appliance => (
                          <SelectItem key={appliance.id} value={appliance.id}>
                            {appliance.name} ({appliance.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-date">Service Date (Optional)</Label>
                    <Input
                      id="service-date"
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (Optional)</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="Enter service cost"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Review (Optional)</Label>
                    <Textarea
                      id="review"
                      placeholder="Share details about your experience..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSubmit} disabled={createReviewMutation.isPending} className="w-full">
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {review.appliances && (
                      <p className="text-sm text-muted-foreground">
                        Service: {review.appliances.name} ({review.appliances.type})
                      </p>
                    )}

                    {review.service_date && (
                      <p className="text-sm text-muted-foreground">
                        Service Date: {format(new Date(review.service_date), 'MMM d, yyyy')}
                      </p>
                    )}

                    {review.cost && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>₦{review.cost.toLocaleString()}</span>
                      </div>
                    )}

                    {review.review && (
                      <p className="text-sm">{review.review}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};