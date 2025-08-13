import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jh-rewards.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const shopifyWebhookSecret = Deno.env.get('SHOPIFY_API_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(shopifyWebhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(body)
  );

  const expectedSignatureBase64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
  return expectedSignatureBase64 === signature;
}

async function handleFulfillmentUpdate(fulfillmentData: any) {
  console.log('Processing fulfillment update:', fulfillmentData.id);

  const orderId = fulfillmentData.order_id.toString();
  const status = fulfillmentData.status; // 'pending', 'open', 'success', 'cancelled', 'error', 'failure'
  const trackingNumber = fulfillmentData.tracking_number;
  const trackingUrls = fulfillmentData.tracking_urls;
  const trackingUrl = trackingUrls && trackingUrls.length > 0 ? trackingUrls[0] : null;

  // Map Shopify fulfillment status to our fulfillment status
  let fulfillmentStatus = 'pending';
  if (status === 'success') {
    fulfillmentStatus = 'fulfilled';
  } else if (status === 'cancelled' || status === 'error' || status === 'failure') {
    fulfillmentStatus = 'cancelled';
  } else if (status === 'open') {
    fulfillmentStatus = 'processing';
  }

  // Update local order with fulfillment information
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      fulfillment_status: fulfillmentStatus,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('shopify_order_id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update order fulfillment:', updateError);
    throw new Error(`Failed to update order fulfillment: ${updateError.message}`);
  }

  console.log(`Updated order ${order.id} fulfillment status to ${fulfillmentStatus}`);
  return order;
}

async function handleOrderFulfilled(orderData: any) {
  console.log('Processing order fulfilled:', orderData.id);

  const orderId = orderData.id.toString();

  // Update local order status to fulfilled
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'fulfilled',
      fulfillment_status: 'fulfilled',
      updated_at: new Date().toISOString(),
    })
    .eq('shopify_order_id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update fulfilled order:', updateError);
    throw new Error(`Failed to update fulfilled order: ${updateError.message}`);
  }

  console.log(`Marked order ${order.id} as fulfilled`);
  return order;
}

async function handleOrderCancelled(orderData: any) {
  console.log('Processing order cancellation:', orderData.id);

  const orderId = orderData.id.toString();

  // Get the local order to find the user and points spent
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('shopify_order_id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Order not found for cancellation:', orderError);
    throw new Error('Order not found for cancellation');
  }

  // Only process if not already cancelled
  if (order.status === 'cancelled') {
    console.log('Order already cancelled, skipping');
    return order;
  }

  // Create refund transaction
  const { data: refundTransaction, error: refundError } = await supabase
    .from('points_transactions')
    .insert({
      user_id: order.user_id,
      type: 'refund',
      points: order.total_points, // Positive amount for refund
      description: `Refund for cancelled order ${order.id}`,
      metadata: {
        original_order_id: order.id,
        shopify_order_id: orderId,
        reason: 'order_cancelled'
      }
    })
    .select()
    .single();

  if (refundError) {
    console.error('Failed to create refund transaction:', refundError);
    throw new Error(`Failed to refund points: ${refundError.message}`);
  }

  // Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      fulfillment_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update cancelled order:', updateError);
    throw new Error(`Failed to update cancelled order: ${updateError.message}`);
  }

  console.log(`Cancelled order ${order.id} and refunded ${order.total_points} points`);
  return updatedOrder;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    console.log(`Received webhook: ${topic} from ${shopDomain}`);

    if (!signature) {
      console.error('Missing webhook signature');
      return new Response('Missing signature', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const webhookData = JSON.parse(body);
    let result = null;

    // Handle different webhook topics
    switch (topic) {
      case 'fulfillments/create':
      case 'fulfillments/update':
        result = await handleFulfillmentUpdate(webhookData);
        break;

      case 'orders/fulfilled':
        result = await handleOrderFulfilled(webhookData);
        break;

      case 'orders/cancelled':
        result = await handleOrderCancelled(webhookData);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        return new Response('Webhook received', { 
          headers: corsHeaders 
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      topic,
      processed: !!result,
      order_id: result?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Webhook processing failed',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});