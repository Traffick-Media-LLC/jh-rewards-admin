
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jh-rewards.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('STREAMLINE_CLIENT_ID');
    const clientSecret = Deno.env.get('STREAMLINE_CLIENT_SECRET');
    const apiUrl = Deno.env.get('STREAMLINE_API_URL');

    if (!clientId || !clientSecret || !apiUrl) {
      console.error('Missing API credentials or URL');
      throw new Error('Missing API credentials or URL');
    }

    console.log('Attempting to authenticate with Streamline API');
    console.log('Client ID exists:', !!clientId);
    console.log('Client Secret exists:', !!clientSecret);

    const authPayload = {
      client_id: clientId,
      client_secret: clientSecret,
    };

    console.log('Auth payload prepared:', { client_id: clientId, client_secret: '[HIDDEN]' });

    const response = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authPayload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response text:', responseText);

    if (!response.ok) {
      console.error('Authentication failed with status:', response.status);
      console.error('Response body:', responseText);
      throw new Error(`Authentication failed: ${response.status} - ${responseText}`);
    }

    let authData;
    try {
      authData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from API');
    }

    console.log('Authentication successful, parsed data:', authData);

    return new Response(JSON.stringify(authData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in streamline-auth function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
