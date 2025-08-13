import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { CodeRedemptionEmail } from "./_templates/code-redemption-email.tsx";
import { OrderConfirmationEmail } from "./_templates/order-confirmation-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://jh-rewards.lovable.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'code_redemption' | 'order_confirmation';
  to: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await authSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { type, to, data }: EmailRequest = await req.json();

    let html: string;
    let subject: string;

    switch (type) {
      case 'welcome':
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            firstName: data.firstName || 'Juice Head',
            pointsBalance: data.pointsBalance || 0
          })
        );
        subject = "Welcome to Juice Head Rewards! 🎉";
        break;

      case 'code_redemption':
        html = await renderAsync(
          React.createElement(CodeRedemptionEmail, {
            firstName: data.firstName || 'Juice Head',
            pointsEarned: data.pointsEarned,
            totalPoints: data.totalPoints,
            code: data.code
          })
        );
        subject = `You earned ${data.pointsEarned} points! 🎯`;
        break;

      case 'order_confirmation':
        html = await renderAsync(
          React.createElement(OrderConfirmationEmail, {
            firstName: data.firstName || 'Juice Head',
            orderNumber: data.orderNumber,
            items: data.items,
            totalPoints: data.totalPoints
          })
        );
        subject = `Order Confirmation - #${data.orderNumber}`;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Juice Head Rewards <noreply@juiceheadrewards.com>",
      to: [to],
      subject,
      html,
    });

    console.log(`Email sent successfully:`, { type, to, emailId: emailResponse.data?.id });

    // Log email for tracking
    await supabase.from('email_logs').insert({
      email_type: type,
      recipient: to,
      subject,
      status: 'sent',
      resend_id: emailResponse.data?.id,
      metadata: data
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending email:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);