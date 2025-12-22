import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const isSuccess = url.searchParams.get("success");
  const sessionId = url.searchParams.get("session_id");
  const isCanceled = url.searchParams.get("canceled");

  // Handle redirect from Stripe checkout
  if (isSuccess === "true" && sessionId) {
    logStep("Handling success redirect", { sessionId });
    
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === "paid" && session.client_reference_id) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );
        
        // Update barbershop subscription status
        await supabaseAdmin
          .from("barbershops")
          .update({
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            trial_used: true,
          })
          .eq("id", session.client_reference_id);
        
        logStep("Updated barbershop subscription via redirect", { 
          barbershopId: session.client_reference_id 
        });
      }
    } catch (error) {
      logStep("Error processing success redirect", { error: String(error) });
    }
    
    return Response.redirect("https://fjznsdvtgqymoiznnbkm.lovableproject.com/dashboard?tab=plans&payment=success");
  }

  if (isCanceled === "true") {
    return Response.redirect("https://fjznsdvtgqymoiznnbkm.lovableproject.com/dashboard?tab=plans&payment=canceled");
  }

  // Handle webhook from Stripe
  try {
    logStep("Processing webhook");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature || !webhookSecret) {
      logStep("Missing signature or webhook secret, processing without verification");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
    
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    
    logStep("Webhook event received", { type: event.type });
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const barbershopId = session.client_reference_id || session.metadata?.barbershop_id;
        
        if (barbershopId && session.payment_status === "paid") {
          await supabaseAdmin
            .from("barbershops")
            .update({
              subscription_status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              trial_used: true,
            })
            .eq("id", barbershopId);
          
          logStep("Updated barbershop on checkout.session.completed", { barbershopId });
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const barbershopId = session.client_reference_id || session.metadata?.barbershop_id;
        
        if (barbershopId) {
          await supabaseAdmin
            .from("barbershops")
            .update({
              subscription_status: "active",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              trial_used: true,
            })
            .eq("id", barbershopId);
          
          logStep("Updated barbershop on async_payment_succeeded (PIX)", { barbershopId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const status = subscription.status === "active" ? "active" : 
                       subscription.status === "past_due" ? "past_due" :
                       subscription.status === "canceled" ? "canceled" : "inactive";
        
        await supabaseAdmin
          .from("barbershops")
          .update({ subscription_status: status })
          .eq("stripe_customer_id", customerId);
        
        logStep("Updated subscription status", { customerId, status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        await supabaseAdmin
          .from("barbershops")
          .update({ 
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);
        
        logStep("Subscription canceled", { customerId });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        await supabaseAdmin
          .from("barbershops")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);
        
        logStep("Invoice paid, subscription active", { customerId });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        await supabaseAdmin
          .from("barbershops")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        
        logStep("Invoice payment failed", { customerId });
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
