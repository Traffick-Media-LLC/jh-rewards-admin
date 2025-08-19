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
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', { 
      _role: 'admin' 
    });
    
    if (roleError || !hasAdminRole) {
      throw new Error('Admin privileges required');
    }

    // Log the admin action
    console.log(`Admin Klaviyo sync called by user: ${user.id}`);
    await logAdminAction(user.id, 'klaviyo_sync_admin', req);

    const requestBody = await req.json();
    const { action, data } = requestBody;
    console.log(`Admin Klaviyo sync - Action: ${action}, User: ${user.id}`);

    if (!klaviyoApiKey) {
      console.error('Klaviyo API key not configured');
      throw new Error('Klaviyo API key not configured');
    }

    switch (action) {
      case 'test_connection':
        return await testConnection(user.id);
      case 'manual_sync_all':
        return await manualSyncAll(user.id);
      case 'sync_recent_orders':
        return await syncRecentOrders(user.id);
      default:
        console.error(`Unknown admin action received: ${action}`);
        throw new Error(`Unknown admin action: ${action}`);
    }
  } catch (error) {
    console.error('Admin Klaviyo sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { 
        status: error.message.includes('Admin privileges') || error.message.includes('Authorization') ? 403 : 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function logAdminAction(adminUserId: string, action: string, req: Request) {
  try {
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action_type: action,
      resource_type: 'klaviyo_integration',
      details: {
        user_agent: req.headers.get('User-Agent'),
        timestamp: new Date().toISOString()
      },
      ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For')
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

async function syncProfileToKlaviyo(profileData: any) {
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
    const errorText = await response.text();
    console.error(`Error syncing profile to Klaviyo: ${response.status} ${errorText}`);
    
    // Handle duplicate profile error gracefully
    if (response.status === 409) {
      console.log(`Profile ${profileData.email} already exists in Klaviyo, skipping...`);
      return { success: true, skipped: true };
    }
    
    throw new Error(`Klaviyo API error: ${response.status} ${errorText}`);
  }

  return { success: true, skipped: false };
}

async function syncOrderPlacedToKlaviyo(orderData: any, profileData: any) {
  const event = {
    type: 'event',
    attributes: {
      profile: {
        email: profileData.email
      },
      metric: {
        name: 'Placed Order'
      },
      properties: {
        order_id: orderData.id,
        total_points: orderData.total_points,
        items: orderData.items,
        timestamp: orderData.created_at
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
    const errorText = await response.text();
    throw new Error(`Klaviyo API error: ${response.status} ${errorText}`);
  }

  return { success: true };
}

async function testConnection(adminUserId: string) {
  console.log(`Testing Klaviyo connection for admin user: ${adminUserId}`);
  
  try {
    const response = await fetch('https://a.klaviyo.com/api/accounts/', {
      method: 'GET',
      headers: {
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'revision': '2024-10-15'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Klaviyo API connection failed: ${response.status} ${errorText}`);
      throw new Error(`Klaviyo API connection failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const accountName = data.data?.[0]?.attributes?.contact_information?.company_name || 'Connected';
    
    console.log(`Klaviyo connection successful for admin ${adminUserId}: ${accountName}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Klaviyo connection successful: ${accountName}`,
        account: accountName,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Klaviyo connection test failed for admin ${adminUserId}:`, error);
    throw new Error(`Klaviyo connection test failed: ${error.message}`);
  }
}

async function manualSyncAll(adminUserId: string) {
  console.log(`Starting manual sync all profiles for admin user: ${adminUserId}`);
  
  let syncedProfiles = 0;
  let skippedProfiles = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    // Get all profiles with marketing emails enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('marketing_emails', true);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles with marketing emails enabled`);

    // Sync profiles in batches to avoid overwhelming Klaviyo API
    const batchSize = 10;
    for (let i = 0; i < (profiles?.length || 0); i += batchSize) {
      const batch = profiles!.slice(i, i + batchSize);
      
      for (const profile of batch) {
        try {
          const result = await syncProfileToKlaviyo(profile);
          if (result.skipped) {
            skippedProfiles++;
          } else {
            syncedProfiles++;
          }
          console.log(`Synced profile ${profile.email} (${syncedProfiles + skippedProfiles}/${profiles!.length})`);
        } catch (error: any) {
          console.error(`Failed to sync profile ${profile.id} (${profile.email}):`, error.message);
          errors++;
          errorDetails.push(`${profile.email}: ${error.message}`);
        }
      }
      
      // Add a small delay between batches
      if (i + batchSize < (profiles?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const message = `Sync completed: ${syncedProfiles} synced, ${skippedProfiles} skipped, ${errors} errors`;
    console.log(`Manual sync all completed for admin ${adminUserId}: ${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        syncedProfiles,
        skippedProfiles,
        errors,
        errorDetails: errorDetails.slice(0, 10), // Limit error details
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`Manual sync all failed for admin ${adminUserId}:`, error);
    throw error;
  }
}

async function syncRecentOrders(adminUserId: string) {
  console.log(`Starting sync recent orders for admin user: ${adminUserId}`);
  
  let syncedOrders = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
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

    console.log(`Found ${orders?.length || 0} recent orders from users with marketing emails enabled`);

    // Sync orders in batches
    const batchSize = 5;
    for (let i = 0; i < (orders?.length || 0); i += batchSize) {
      const batch = orders!.slice(i, i + batchSize);
      
      for (const order of batch) {
        try {
          await syncOrderPlacedToKlaviyo(order, order.profiles);
          syncedOrders++;
          console.log(`Synced order ${order.id} (${syncedOrders}/${orders!.length})`);
        } catch (error: any) {
          console.error(`Failed to sync order ${order.id}:`, error.message);
          errors++;
          errorDetails.push(`Order ${order.id}: ${error.message}`);
        }
      }
      
      // Add a small delay between batches
      if (i + batchSize < (orders?.length || 0)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const message = `Recent orders sync completed: ${syncedOrders} synced, ${errors} errors`;
    console.log(`Sync recent orders completed for admin ${adminUserId}: ${message}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        syncedOrders,
        errors,
        errorDetails: errorDetails.slice(0, 10), // Limit error details
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error(`Sync recent orders failed for admin ${adminUserId}:`, error);
    throw error;
  }
}