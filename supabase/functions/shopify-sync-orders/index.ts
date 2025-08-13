import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jh-rewards.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SHOPIFY_TOKEN = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN')!;
const SHOP_DOMAIN_RAW = Deno.env.get('SHOPIFY_SHOP_DOMAIN')!;

function normalizeShopDomain(value: string) {
  let v = value.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (v.endsWith('.myshopify.com')) return v;
  if (v.includes('.')) return v;
  return `${v}.myshopify.com`;
}
function getShopBaseUrl() {
  const host = normalizeShopDomain(SHOP_DOMAIN_RAW || '');
  return `https://${host}/admin/api/2023-10`;
}

async function shopifyFetch(path: string) {
  const url = `${getShopBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  return res;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Create Supabase client with anon key for user context
    const supabase = createClient(
      SUPABASE_URL, 
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find this user's recent orders that may need syncing
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('id, shopify_order_id, shopify_order_name, shopify_order_number, status, fulfillment_status, tracking_number, tracking_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (ordersErr) throw ordersErr;

    const toSync = (orders || []).filter(o => o.shopify_order_id);

    const updated: string[] = [];
    for (const order of toSync) {
      try {
        const res = await shopifyFetch(`/orders/${order.shopify_order_id}.json?fields=id,name,order_number,fulfillment_status,fulfillments`);
        if (!res.ok) {
          console.warn('Shopify fetch failed for order', order.shopify_order_id, res.status);
          continue;
        }
        const data = await res.json();
        const shopOrder = data.order || data; // some responses nest under order

        const fulfillment_status: string | null = shopOrder.fulfillment_status || null;
        let tracking_number: string | null = null;
        let tracking_url: string | null = null;

        const fulfillments = Array.isArray(shopOrder.fulfillments) ? shopOrder.fulfillments : [];
        if (fulfillments.length > 0) {
          const latest = fulfillments[fulfillments.length - 1];
          tracking_number = latest?.tracking_number || latest?.tracking_numbers?.[0] || null;
          const urls = latest?.tracking_urls || latest?.tracking_url ? [latest.tracking_url] : [];
          tracking_url = urls[0] || null;
        }

        // Only update if there's new info
        const needsUpdate = (
          (fulfillment_status && fulfillment_status !== order.fulfillment_status) ||
          (tracking_number && tracking_number !== order.tracking_number) ||
          (tracking_url && tracking_url !== order.tracking_url) ||
          (!order.shopify_order_name && shopOrder.name) ||
          (!order.shopify_order_number && shopOrder.order_number)
        );

        if (!needsUpdate) continue;

        const updateData: any = {
          fulfillment_status: fulfillment_status ?? order.fulfillment_status,
          tracking_number: tracking_number ?? order.tracking_number,
          tracking_url: tracking_url ?? order.tracking_url,
          status: fulfillment_status === 'fulfilled' ? 'fulfilled' : order.status,
        };

        // Backfill name and number if missing
        if (!order.shopify_order_name && shopOrder.name) {
          updateData.shopify_order_name = shopOrder.name;
        }
        if (!order.shopify_order_number && shopOrder.order_number) {
          updateData.shopify_order_number = shopOrder.order_number;
        }

        const { error: updErr } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (!updErr) updated.push(order.id as unknown as string);
      } catch (e) {
        console.error('Sync error for order', order.id, e);
      }
    }

    return new Response(JSON.stringify({ success: true, updated_count: updated.length, updated_ids: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('shopify-sync-orders error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
