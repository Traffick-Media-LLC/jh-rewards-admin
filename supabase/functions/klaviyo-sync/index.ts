import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const klaviyoApiKey = Deno.env.get('KLAVIYO_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, data } = requestBody;
    console.log(`Klaviyo sync called - Action: ${action}, Data:`, JSON.stringify(data).substring(0, 200));

    if (!klaviyoApiKey) {
      console.error('Klaviyo API key not configured');
      throw new Error('Klaviyo API key not configured');
    }

    switch (action) {
      case 'sync_profile':
        return await syncProfile(data);
      case 'sync_code_redemption':
        return await syncCodeRedemption(data);
      case 'sync_order_placed':
        return await syncOrderPlaced(data);
      case 'sync_order_fulfilled':
        return await syncOrderFulfilled(data);
      case 'manual_sync_all':
        return await manualSyncAll();
      case 'test_connection':
        return await testConnection();
      case 'sync_recent_orders':
        return await syncRecentOrders();
      default:
        console.error(`Unknown action received: ${action}`);
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Klaviyo sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function syncProfile(profileData: any) {
  const profile = {
    type: 'profile',
    attributes: {
      email: profileData.email,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone_number: profileData.phone,
      properties: {
        points_balance: profileData.points_balance,
        marketing_emails: profileData.marketing_emails,
        created_at: profileData.created_at
      }
    }
  };

  const response = await fetch('https://a.klaviyo.com/api/profiles/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({ data: profile })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo profile sync failed: ${error}`);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Profile synced to Klaviyo' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncCodeRedemption(data: any) {
  const event = {
    type: 'event',
    attributes: {
      profile: {
        email: data.profile.email
      },
      metric: {
        name: 'Code Redeemed'
      },
      properties: {
        points_earned: data.points_earned,
        code: data.code,
        timestamp: new Date().toISOString()
      }
    }
  };

  const response = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({ data: event })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo code redemption sync failed: ${error}`);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Code redemption synced to Klaviyo' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncOrderPlaced(data: any) {
  const event = {
    type: 'event',
    attributes: {
      profile: {
        email: data.profile.email
      },
      metric: {
        name: 'Placed Order'
      },
      properties: {
        order_id: data.order.id,
        total_points: data.order.total_points,
        items: data.order.items,
        timestamp: data.order.created_at
      }
    }
  };

  const response = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({ data: event })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo order placed sync failed: ${error}`);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Order placed synced to Klaviyo' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncOrderFulfilled(data: any) {
  const event = {
    type: 'event',
    attributes: {
      profile: {
        email: data.profile.email
      },
      metric: {
        name: 'Fulfilled Order'
      },
      properties: {
        order_id: data.order.id,
        tracking_number: data.order.tracking_number,
        timestamp: new Date().toISOString()
      }
    }
  };

  const response = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
      'Content-Type': 'application/json',
      'revision': '2024-10-15'
    },
    body: JSON.stringify({ data: event })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Klaviyo order fulfilled sync failed: ${error}`);
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Order fulfilled synced to Klaviyo' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function manualSyncAll() {
  let syncedProfiles = 0;
  let errors = 0;

  // Get all profiles with marketing emails enabled
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('marketing_emails', true);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  // Sync profiles in batches
  for (const profile of profiles || []) {
    try {
      await syncProfile(profile);
      syncedProfiles++;
    } catch (error) {
      console.error(`Failed to sync profile ${profile.id}:`, error);
      errors++;
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncedProfiles} profiles to Klaviyo`,
      syncedProfiles,
      errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function syncRecentOrders() {
  let syncedOrders = 0;
  let errors = 0;

  // Get recent orders (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!inner(*)
    `)
    .eq('profiles.marketing_emails', true)
    .gte('created_at', sevenDaysAgo.toISOString());

  if (ordersError) {
    throw new Error(`Failed to fetch recent orders: ${ordersError.message}`);
  }

  // Sync orders
  for (const order of orders || []) {
    try {
      await syncOrderPlaced({ order, profile: order.profiles });
      syncedOrders++;
    } catch (error) {
      console.error(`Failed to sync order ${order.id}:`, error);
      errors++;
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Synced ${syncedOrders} recent orders to Klaviyo`,
      syncedOrders,
      errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function testConnection() {
  try {
    const response = await fetch('https://a.klaviyo.com/api/accounts/', {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'revision': '2024-10-15'
      }
    });

    if (!response.ok) {
      throw new Error(`Klaviyo API connection failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Klaviyo connection successful',
        account: data.data?.[0]?.attributes?.contact_information?.company_name || 'Connected'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    throw new Error(`Klaviyo connection test failed: ${error.message}`);
  }
}