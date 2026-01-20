import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/products - List user's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, config, system_prompt, agent_config } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['automation', 'voice_agent', 'rag_bot', 'webapp'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check user's product limit
    const { count } = await supabase
      .from('user_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get user's tier limit (default to free tier limit of 3)
    const { data: profile } = await supabase
      .from('profiles')
      .select('pricing_tier_id')
      .eq('id', user.id)
      .single();

    let maxProducts = 3; // Free tier default
    if (profile?.pricing_tier_id) {
      const { data: tier } = await supabase
        .from('pricing_tiers')
        .select('max_products')
        .eq('id', profile.pricing_tier_id)
        .single();

      if (tier?.max_products && tier.max_products !== -1) {
        maxProducts = tier.max_products;
      } else if (tier?.max_products === -1) {
        maxProducts = Infinity;
      }
    }

    if ((count || 0) >= maxProducts) {
      return NextResponse.json(
        { error: `Product limit reached. Upgrade your plan to create more products.` },
        { status: 403 }
      );
    }

    // Create the product
    const { data: product, error } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name,
        description,
        type,
        config: config || {},
        system_prompt,
        agent_config: agent_config || {},
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // Record usage event
    await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_product_id: product.id,
      p_event_type: 'api_call',
      p_quantity: 1,
      p_metadata: { action: 'create_product', type }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
