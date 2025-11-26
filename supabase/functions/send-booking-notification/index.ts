import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from("vendor_bookings")
      .select(`
        *,
        vendors (name, contact_email),
        appliances (name, type),
        profiles (email, full_name)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      throw new Error("Booking not found");
    }

    const vendor = booking.vendors as any;
    const appliance = booking.appliances as any;
    const user = booking.profiles as any;

    const statusText = action === 'create' ? 'Scheduled' : 
                       action === 'update' ? 'Updated' : 
                       action === 'cancel' ? 'Cancelled' : booking.status;

    // Send email to user
    const userEmailContent = `
      <h2>Booking ${statusText}</h2>
      <p>Hello ${user.full_name},</p>
      <p>Your service booking has been ${statusText.toLowerCase()}.</p>
      <h3>Booking Details:</h3>
      <ul>
        <li><strong>Vendor:</strong> ${vendor.name}</li>
        <li><strong>Service Type:</strong> ${booking.service_type}</li>
        <li><strong>Appliance:</strong> ${appliance ? `${appliance.name} (${appliance.type})` : 'Not specified'}</li>
        <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${booking.scheduled_time}</li>
        <li><strong>Status:</strong> ${booking.status}</li>
      </ul>
      ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
      <p>If you have any questions, please contact the vendor directly.</p>
    `;

    await resend.emails.send({
      from: "FixSense <onboarding@resend.dev>",
      to: [user.email],
      subject: `Service Booking ${statusText} - ${vendor.name}`,
      html: userEmailContent,
    });

    // Send email to vendor if they have an email
    if (vendor.contact_email) {
      const vendorEmailContent = `
        <h2>New Service Booking ${statusText}</h2>
        <p>Hello ${vendor.name},</p>
        <p>A service booking has been ${statusText.toLowerCase()}.</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Customer:</strong> ${user.full_name} (${user.email})</li>
          <li><strong>Service Type:</strong> ${booking.service_type}</li>
          <li><strong>Appliance:</strong> ${appliance ? `${appliance.name} (${appliance.type})` : 'Not specified'}</li>
          <li><strong>Date:</strong> ${new Date(booking.scheduled_date).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${booking.scheduled_time}</li>
          <li><strong>Status:</strong> ${booking.status}</li>
        </ul>
        ${booking.notes ? `<p><strong>Customer Notes:</strong> ${booking.notes}</p>` : ''}
      `;

      await resend.emails.send({
        from: "FixSense <onboarding@resend.dev>",
        to: [vendor.contact_email],
        subject: `Service Booking ${statusText} - ${new Date(booking.scheduled_date).toLocaleDateString()}`,
        html: vendorEmailContent,
      });
    }

    console.log(`Booking notifications sent for booking ${bookingId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error sending booking notifications:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});