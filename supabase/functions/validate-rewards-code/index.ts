
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// More restrictive CORS headers for security
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jh-rewards.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Rate limiting: Track requests per IP with cleanup
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 600000); // 10 minutes
const RATE_LIMIT_WINDOW = 60000; // 1 minute  
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const existing = requestCounts.get(clientIP);
  
  if (!existing || now > existing.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  existing.count++;
  return false;
}

// Input validation functions
function validateRewardCode(code: string): { isValid: boolean; normalizedCode: string } {
  if (!code || typeof code !== 'string') {
    return { isValid: false, normalizedCode: '' };
  }
  
  const normalizedCode = code.trim().toUpperCase();
  
  // Check format: alphanumeric, 3-20 characters
  if (!/^[A-Z0-9]{3,20}$/.test(normalizedCode)) {
    return { isValid: false, normalizedCode: '' };
  }
  
  return { isValid: true, normalizedCode };
}

function sanitizeClientInfo(clientInfo: any): any {
  if (!clientInfo || typeof clientInfo !== 'object') {
    return {};
  }
  
  // Only allow specific safe fields
  const allowedFields = ['platform', 'version', 'userAgent'];
  const sanitized: any = {};
  
  for (const field of allowedFields) {
    if (clientInfo[field] && typeof clientInfo[field] === 'string') {
      // Truncate to prevent oversized data
      sanitized[field] = clientInfo[field].substring(0, 200);
    }
  }
  
  return sanitized;
}

// Prefix-to-points mapping
const PREFIX_POINTS: Record<string, number> = {
  "1M": 100,
  "3M": 100,
  "PC": 25,
  "3K": 50,
  "5K": 50,
  "TT": 2000,
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(clientIP)) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { code, clientInfo, webProfileId } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authorization token is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize inputs
    const codeValidation = validateRewardCode(code);
    if (!codeValidation.isValid) {
      console.log('Invalid code format received:', { code: code?.substring?.(0, 10) + '...' });
      return new Response(JSON.stringify({ error: 'Invalid code format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sanitizedClientInfo = sanitizeClientInfo(clientInfo);
    const normalizedCode = codeValidation.normalizedCode;
    const prefix = normalizedCode.slice(0, 2);
    const mappedPoints = PREFIX_POINTS[prefix] ?? 0;

    console.log('Validating rewards code:', { normalizedCode, prefix, mappedPoints, userId: user.id });

    // Check if code was already redeemed by this user
    const { data: existingRedemption, error: checkError } = await supabase
      .from('redeemed_codes')
      .select('id, points_awarded, created_at')
      .eq('user_id', user.id)
      .eq('code', normalizedCode)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing redemption:', checkError);
      throw new Error('Failed to check redemption status');
    }

    if (existingRedemption) {
      console.log('Code already redeemed:', { normalizedCode, userId: user.id, previousRedemption: existingRedemption });
      return new Response(JSON.stringify({
        success: false,
        error: 'Code has already been redeemed',
        data: {
          valid: false,
          points: 0,
          prefix,
          normalizedCode,
          alreadyRedeemed: true,
          previousRedemption: existingRedemption
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // First, get authentication token
    const clientId = Deno.env.get('STREAMLINE_CLIENT_ID');
    const clientSecret = Deno.env.get('STREAMLINE_CLIENT_SECRET');
    const apiUrl = Deno.env.get('STREAMLINE_API_URL');

    if (!clientId || !clientSecret || !apiUrl) {
      console.error('Missing API credentials or URL');
      throw new Error('Missing API credentials or URL');
    }

    console.log('Getting auth token...');
    
    const authResponse = await fetch(`${apiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log('Auth response status:', authResponse.status);

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Auth failed:', errorText);
      throw new Error(`Failed to authenticate with Streamline API: ${authResponse.status} - ${errorText}`);
    }

    const authText = await authResponse.text();
    console.log('Auth response text length:', authText.length);

    let authData: any;
    try {
      authData = JSON.parse(authText);
    } catch (parseError) {
      console.error('Failed to parse auth JSON:', parseError);
      throw new Error('Invalid JSON response from auth API');
    }

    console.log('Auth data keys received:', Object.keys(authData || {}));

    // Extract token from the nested data structure
    const bearerToken = authData.data?.token || authData.access_token;

    if (!bearerToken) {
      console.error('No token found in response:', authData);
      throw new Error('No access token received from authentication');
    }

    console.log('Bearer token received, length:', String(bearerToken).length);

    // Format client info according to API specification using sanitized data
    const formattedClientInfo = {
      CONTENT_TYPE: "application/json",
      HTTP_ACCEPT: "*/*",
      HTTP_ACCEPT_ENCODING: "gzip, deflate, br",
      HTTP_ACCEPT_LANGUAGE: sanitizedClientInfo?.language || "en-US,en;q=0.9",
      HTTP_HOST: new URL(apiUrl).hostname,
      HTTP_ORIGIN: req.headers.get('origin') || 'unknown',
      HTTP_REFERER: sanitizedClientInfo?.referrer || req.headers.get('referer') || 'unknown',
      HTTP_USER_AGENT: sanitizedClientInfo?.userAgent || req.headers.get('user-agent') || 'unknown',
      HTTP_X_FORWARDED_FOR: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      REQUEST_METHOD: "POST",
      REQUEST_URI: "/code"
    };

    // Now validate the code using the correct format
    const validatePayload = {
      Code: normalizedCode, // Capital C as per API spec
      WebProfileId: webProfileId || "123456", // Default or provided WebProfileId
      client_info: formattedClientInfo,
    };

    console.log('Validating with payload (client_info redacted):', { ...validatePayload, client_info: '[FORMATTED]' });

    const validateResponse = await fetch(`${apiUrl}/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(validatePayload),
    });

    console.log('Validation response status:', validateResponse.status);
    console.log('Validation response headers:', Object.fromEntries(validateResponse.headers.entries()));

    const validationText = await validateResponse.text();
    console.log('Validation response text length:', validationText.length);
    console.log('Full API response:', validationText);

    let validationData: any;
    try {
      validationData = JSON.parse(validationText);
      console.log('Parsed API response:', JSON.stringify(validationData, null, 2));
    } catch (parseError) {
      console.error('Failed to parse validation JSON:', parseError);
      // If parsing fails, return the raw text as error structure
      validationData = { error: 'Invalid response format', raw_response: validationText };
    }

    // Check for various ways the API might indicate the code was already redeemed
    const alreadyRedeemed = validationData?.redeemed === true || 
                           validationData?.used === true || 
                           validationData?.status === 'redeemed' || 
                           validationData?.status === 'used' ||
                           validationData?.error?.includes?.('already') ||
                           validationData?.message?.includes?.('already') ||
                           validationData?.error?.includes?.('redeemed') ||
                           validationData?.message?.includes?.('redeemed');

    // Determine validity: prioritize API "valid" flag, then check for HTTP errors
    const apiValidFlag = validationData?.data?.valid ?? validationData?.valid;
    
    // If API explicitly says valid: false, check if already redeemed by someone else
    if (apiValidFlag === false) {
      console.log('API marked code as invalid:', { normalizedCode, apiResponse: validationData });
      
      // Check if this code has been redeemed by ANY user
      const { data: globalRedemption, error: globalCheckError } = await supabase
        .from('redeemed_codes')
        .select('id, points_awarded, created_at')
        .eq('code', normalizedCode)
        .maybeSingle();

      if (globalCheckError) {
        console.error('Error checking for global redemption:', globalCheckError);
        // If we can't check, treat as invalid
        return new Response(JSON.stringify({
          success: false,
          error: 'Sorry this code is invalid',
          data: {
            ...validationData,
            valid: false,
            points: 0,
            prefix,
            normalizedCode,
            alreadyRedeemed: false,
          },
          status: validateResponse.status,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (globalRedemption) {
        // Code was redeemed by someone else
        console.log('Code was redeemed by another user:', { normalizedCode, redemption: globalRedemption });
        return new Response(JSON.stringify({
          success: false,
          error: 'Code has already been redeemed',
          data: {
            ...validationData,
            valid: false,
            points: 0,
            prefix,
            normalizedCode,
            alreadyRedeemed: true,
          },
          status: validateResponse.status,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Code is truly invalid
        return new Response(JSON.stringify({
          success: false,
          error: 'Sorry this code is invalid',
          data: {
            ...validationData,
            valid: false,
            points: 0,
            prefix,
            normalizedCode,
            alreadyRedeemed: false,
          },
          status: validateResponse.status,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For codes that passed API validation, check other conditions
    const computedValid = apiValidFlag !== false && validateResponse.ok;
    
    // If code was already redeemed according to API, mark as invalid
    const finalValid = computedValid && !alreadyRedeemed;

    // If valid, use mapped points based on prefix; otherwise zero
    const awardedPoints = finalValid ? mappedPoints : 0;

    console.log('Computed validation result:', {
      prefix,
      mappedPoints,
      computedValid,
      alreadyRedeemed,
      finalValid,
      awardedPoints,
    });

    // If code is valid and not already redeemed, record the redemption and award points
    if (finalValid && awardedPoints > 0) {
      // Record the redemption in our database
      const { error: redemptionError } = await supabase
        .from('redeemed_codes')
        .insert({
          user_id: user.id,
          code: normalizedCode,
          points_awarded: awardedPoints,
          api_response: validationData
        });

      if (redemptionError) {
        console.error('Failed to record redemption:', redemptionError);
        throw new Error('Failed to record code redemption');
      }

      // Award points to the user
      const { error: pointsError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          type: 'earn',
          points: awardedPoints,
          description: `Redeemed code: ${normalizedCode}`,
          metadata: { code: normalizedCode, api_response: validationData }
        });

      if (pointsError) {
        console.error('Failed to award points:', pointsError);
        throw new Error('Failed to award points for code redemption');
      }

      console.log('Successfully redeemed code:', { normalizedCode, userId: user.id, points: awardedPoints });
    }

    // Merge our normalized fields into the returned payload for the frontend
    const unifiedData = {
      ...validationData,
      valid: finalValid,
      points: awardedPoints,
      prefix,
      normalizedCode,
      alreadyRedeemed: alreadyRedeemed || false,
    };

    return new Response(JSON.stringify({
      success: finalValid,
      data: unifiedData,
      status: validateResponse.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in validate-rewards-code function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || 'Unknown error',
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
