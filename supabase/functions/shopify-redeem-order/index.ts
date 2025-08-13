import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jh-rewards.lovable.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface RedeemOrderRequest {
  cartItems: Array<{
    productId: string;
    qty: number;
    variantId?: string;
    selectedVariants?: Record<string, string>;
  }>;
  shippingAddress: {
    name: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  default_address?: {
    address1: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  total_price: string;
  financial_status: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const rawShopDomain = Deno.env.get('SHOPIFY_SHOP_DOMAIN')!;
const shopifyToken = Deno.env.get('SHOPIFY_ADMIN_API_TOKEN')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Normalize Shopify domain and build base URL
function normalizeShopDomain(value: string) {
  let v = value.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (v.endsWith('.myshopify.com')) return v;
  if (v.includes('.')) return v; // full host provided
  return `${v}.myshopify.com`;
}
function getShopBaseUrl() {
  const raw = Deno.env.get('SHOPIFY_SHOP_DOMAIN') || '';
  const host = normalizeShopDomain(raw);
  return `https://${host}/admin/api/2023-10`;
}

// Lightweight fetch wrapper with logging that preserves body for callers
async function shopifyFetch(baseUrl: string, path: string, init?: RequestInit) {
  const method = init?.method || 'GET';
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  console.log(`[Shopify] ${method} ${url}`);
  const res = await fetch(url, {
    ...init,
    headers: {
      'X-Shopify-Access-Token': shopifyToken,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  console.log(`[Shopify] ${method} ${url} -> ${res.status}`);
  return res;
}

async function searchOrCreateShopifyCustomer(
  baseUrl: string,
  email: string, 
  firstName: string, 
  lastName: string, 
  phone: string | null,
  address: RedeemOrderRequest['shippingAddress']
): Promise<ShopifyCustomer> {
  console.log(`Searching for Shopify customer: ${email}`);
  
  // Search for existing customer
  const searchResponse = await shopifyFetch(
    baseUrl,
    `/customers/search.json?query=email:${encodeURIComponent(email)}`
  );

  if (!searchResponse.ok) {
    const text = await searchResponse.clone().text();
    console.error('Failed to search Shopify customer body:', text);
    throw new Error(`Failed to search Shopify customer (status ${searchResponse.status}): ${text || searchResponse.statusText}`);
  }

  const searchData = await searchResponse.json();
  
  if (searchData.customers && searchData.customers.length > 0) {
    const existingCustomer = searchData.customers[0];
    console.log(`Found existing customer: ${existingCustomer.id}`);
    
    // Update customer address if different
    const currentAddress = existingCustomer.default_address;
    const needsAddressUpdate = !currentAddress || 
      currentAddress.address1 !== address.street ||
      currentAddress.city !== address.city ||
      currentAddress.province !== address.state ||
      currentAddress.zip !== address.postal_code ||
      currentAddress.country !== address.country;

    if (needsAddressUpdate) {
      console.log('Updating customer address');
      const updateResponse = await shopifyFetch(
        baseUrl,
        `/customers/${existingCustomer.id}.json`,
        {
          method: 'PUT',
          body: JSON.stringify({
            customer: {
              id: existingCustomer.id,
              default_address: {
                address1: address.street,
                city: address.city,
                province: address.state,
                zip: address.postal_code,
                country: address.country,
                phone: phone || address.phone,
              }
            }
          }),
        }
      );

      if (!updateResponse.ok) {
        const text = await updateResponse.clone().text();
        console.error('Failed to update customer address:', text);
      }
    }

    return existingCustomer;
  }

  // Create new customer
  console.log('Creating new Shopify customer');
  const createResponse = await shopifyFetch(
    baseUrl,
    `/customers.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        customer: {
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || address.phone,
          addresses: [{
            address1: address.street,
            city: address.city,
            province: address.state,
            zip: address.postal_code,
            country: address.country,
            phone: phone || address.phone,
            default: true,
          }]
        }
      }),
    }
  );

  if (!createResponse.ok) {
    const text = await createResponse.clone().text();
    console.error('Failed to create Shopify customer:', text);
    throw new Error(`Failed to create Shopify customer (status ${createResponse.status}): ${text || createResponse.statusText}`);
  }

  const createData = await createResponse.json();
  console.log(`Created new customer: ${createData.customer.id}`);
  return createData.customer;
}

async function createShopifyOrder(
  baseUrl: string,
  customer: ShopifyCustomer,
  lineItems: Array<{ variant_id: number; quantity: number; price: string }>,
  shippingAddress: RedeemOrderRequest['shippingAddress'],
  pointsSpent: number,
  rewardSkus: string[],
  idempotencyKey: string
): Promise<ShopifyOrder> {
  console.log(`Creating Shopify order with idempotency key: ${idempotencyKey}`);

  const orderData = {
    order: {
      customer: {
        id: customer.id,
      },
      line_items: lineItems,
      shipping_address: {
        first_name: shippingAddress.name.split(' ')[0] || '',
        last_name: shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address1: shippingAddress.street,
        city: shippingAddress.city,
        province: shippingAddress.state,
        zip: shippingAddress.postal_code,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
      billing_address: {
        first_name: shippingAddress.name.split(' ')[0] || '',
        last_name: shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address1: shippingAddress.street,
        city: shippingAddress.city,
        province: shippingAddress.state,
        zip: shippingAddress.postal_code,
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
      shipping_lines: [{
        title: 'Free Shipping - Rewards',
        price: '0.00',
        code: 'REWARDS_FREE',
      }],
      financial_status: 'paid',
      tags: 'Rewards,Points',
      note_attributes: [
        { name: 'points_spent', value: pointsSpent.toString() },
        { name: 'reward_sku', value: rewardSkus.join(',') },
        { name: 'source', value: 'rewards_redemption' },
      ],
      // Note: Do NOT include transactions for zero-dollar orders to avoid 422 errors
      total_tax: '0.00',
      currency: 'USD',
    }
  };

  console.log('Order payload preview:', {
    line_items: orderData.order.line_items.length,
    includes_transactions: !!(orderData.order as any).transactions,
    shipping_price: orderData.order.shipping_lines?.[0]?.price,
    financial_status: orderData.order.financial_status,
  });

  const response = await shopifyFetch(
    baseUrl,
    `/orders.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!response.ok) {
    const errorText = await response.clone().text();
    console.error('Shopify order creation failed:', errorText);
    throw new Error(`Failed to create Shopify order (status ${response.status}): ${errorText || response.statusText}`);
  }

  const orderResult = await response.json();
  console.log(`Created Shopify order: ${orderResult.order.id}`);
  return orderResult.order;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { cartItems, shippingAddress }: RedeemOrderRequest = await req.json();
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('No items in cart');
    }

    // Get user profile and current points
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Calculate total points needed
    const productIds = cartItems.map(item => item.productId);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError || !products) {
      throw new Error('Failed to load products');
    }

let totalPointsNeeded = 0;
const lineItems: Array<{ variant_id: number; quantity: number; price: string }> = [];
const rewardSkus: string[] = [];

for (const cartItem of cartItems) {
  const product = products.find(p => p.id === cartItem.productId);
  if (!product) {
    throw new Error(`Product not found: ${cartItem.productId}`);
  }

  if (!product.shopify_variant_id) {
    throw new Error(`Product ${product.name} is not configured for Shopify fulfillment`);
  }

  totalPointsNeeded += product.price_cents * cartItem.qty;
  
  const variantIdStr = cartItem.variantId || product.shopify_variant_id;
  if (!variantIdStr) {
    throw new Error(`No Shopify variant configured for product ${product.name}`);
  }
  const variantId = Number(variantIdStr);
  if (!Number.isFinite(variantId)) {
    throw new Error(`Invalid Shopify variant id for product ${product.name}: ${variantIdStr}`);
  }
  
  lineItems.push({
    variant_id: variantId,
    quantity: cartItem.qty,
    price: '0.00', // $0 for rewards
  });

  rewardSkus.push(product.sku || product.id);
}

// Validate Shopify configuration early to avoid deducting points if misconfigured
let shopBaseUrl: string;
try {
  shopBaseUrl = getShopBaseUrl();
} catch (cfgError) {
  throw new Error(`Shopify configuration error: ${(cfgError as any)?.message || cfgError}`);
}
if (!shopifyToken || !shopifyToken.trim()) {
  throw new Error('Shopify Admin API token not configured');
}

    // Check if user has enough points
    if (profile.points_balance < totalPointsNeeded) {
      throw new Error(`Insufficient points. Need ${totalPointsNeeded}, have ${profile.points_balance}`);
    }

    // Generate idempotency key
    const idempotencyKey = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Start database transaction - deduct points first
const { data: pointsTransaction, error: pointsError } = await supabase
  .from('points_transactions')
  .insert({
    user_id: user.id,
    type: 'redeem',
    points: -totalPointsNeeded,
    description: `Redeemed ${cartItems.length} reward${cartItems.length > 1 ? 's' : ''}`,
    metadata: { 
      cart_items: cartItems,
      idempotency_key: idempotencyKey 
    }
  })
  .select()
  .single();

    if (pointsError) {
      throw new Error('Failed to deduct points');
    }

    let shopifyCustomer: ShopifyCustomer;
    let shopifyOrder: ShopifyOrder;

    try {
      // Upsert Shopify customer
      shopifyCustomer = await searchOrCreateShopifyCustomer(
        shopBaseUrl,
        profile.email || user.email!,
        profile.first_name || '',
        profile.last_name || '',
        profile.phone,
        shippingAddress
      );

      // Update profile with Shopify customer ID if not already set
      if (!profile.shopify_customer_id) {
        await supabase
          .from('profiles')
          .update({ shopify_customer_id: shopifyCustomer.id.toString() })
          .eq('id', user.id);
      }

      // Create Shopify order
      shopifyOrder = await createShopifyOrder(
        shopBaseUrl,
        shopifyCustomer,
        lineItems,
        shippingAddress,
        totalPointsNeeded,
        rewardSkus,
        idempotencyKey
      );

    } catch (shopifyError) {
      // Rollback points transaction if Shopify operations fail
      console.error('Shopify operation failed, rolling back points:', shopifyError);
      
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          type: 'adjustment',
          points: totalPointsNeeded,
          description: `Rollback - Shopify order creation failed`,
          metadata: { 
            original_transaction_id: pointsTransaction.id,
            error: shopifyError.message 
          }
        });

      throw new Error(`Order creation failed: ${shopifyError.message}`);
    }

    // Create local order record
    const { data: localOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_points: totalPointsNeeded,
        items: cartItems,
        status: 'processing',
        shipping_name: shippingAddress.name,
        shipping_phone: shippingAddress.phone,
        shipping_street: shippingAddress.street,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_postal_code: shippingAddress.postal_code,
        shipping_country: shippingAddress.country,
        shopify_order_id: shopifyOrder.id.toString(),
        shopify_order_name: shopifyOrder.name,
        shopify_order_number: shopifyOrder.order_number,
        shopify_financial_status: 'paid',
        fulfillment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create local order record:', orderError);
      // Order was created in Shopify but failed locally - log for manual reconciliation
    }

    console.log(`Order redeemed successfully: Local ID ${localOrder?.id}, Shopify ID ${shopifyOrder.id}`);

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: localOrder?.id,
        shopify_order_id: shopifyOrder.id,
        shopify_order_number: shopifyOrder.order_number,
        shopify_order_name: shopifyOrder.name,
        total_points: totalPointsNeeded,
        status: 'processing',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Redemption error:', error);
    
    // Return appropriate error status code
    const errorMessage = (error as any)?.message || 'Order redemption failed';
    const statusCode = errorMessage.includes('Insufficient points') ? 400 : 
                      errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('not found') ? 404 : 500;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});