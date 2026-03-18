import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const newsletterSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = newsletterSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Create Supabase client with service role for inserting without auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return Response.json(
        { success: true, message: 'You\'re already subscribed!' },
        { status: 200 }
      );
    }

    // Insert new subscriber
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase(),
        subscribed_at: new Date().toISOString(),
      });

    if (dbError) {
      // If table doesn't exist, save as a lead instead
      if (dbError.code === '42P01') {
        await supabase.from('leads').insert({
          name: 'Newsletter Subscriber',
          email: email.toLowerCase(),
          source: 'newsletter',
          status: 'new',
        });
      } else {
        console.error('Newsletter subscription error:', dbError);
        return Response.json(
          { error: 'Failed to subscribe. Please try again.' },
          { status: 500 }
        );
      }
    }

    return Response.json(
      { success: true, message: 'Successfully subscribed!' },
      { status: 201 }
    );
  } catch (err) {
    console.error('Newsletter error:', err);
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
