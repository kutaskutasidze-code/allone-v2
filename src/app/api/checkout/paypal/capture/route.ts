import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token'); // PayPal order ID
  const origin = request.headers.get('origin') || 'https://allone.ge';

  if (!token) {
    return NextResponse.redirect(`${origin}/products?error=missing_token`);
  }

  try {
    const supabase = createAdminClient();

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the payment
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.redirect(`${origin}/products?error=payment_failed`);
    }

    // Get capture ID
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Update purchase status in database
    const { data: purchase, error: updateError } = await supabase
      .from('purchases')
      .update({
        status: 'completed',
        paypal_capture_id: captureId,
        purchased_at: new Date().toISOString(),
      })
      .eq('paypal_order_id', token)
      .select('*, products(*)')
      .single();

    if (updateError) {
      console.error('Failed to update purchase:', updateError);
    }

    // Link to user if logged in
    const customId = captureData.purchase_units?.[0]?.custom_id;
    if (customId) {
      try {
        const { email } = JSON.parse(customId);
        // Check if user exists
        const { data: userData } = await supabase.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === email);

        if (user) {
          await supabase
            .from('purchases')
            .update({ user_id: user.id })
            .eq('paypal_order_id', token);
        }
      } catch (e) {
        console.error('Failed to link user:', e);
      }
    }

    // Redirect to success page
    const downloadToken = purchase?.download_token;
    return NextResponse.redirect(`${origin}/dashboard/purchases?success=true&token=${downloadToken}`);

  } catch (error) {
    console.error('Capture error:', error);
    return NextResponse.redirect(`${origin}/products?error=capture_failed`);
  }
}
