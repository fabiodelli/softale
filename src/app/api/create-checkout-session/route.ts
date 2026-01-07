import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { priceId } = await req.json();

        if (!priceId) {
            return new NextResponse('Price ID is required', { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email, username')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        // Create Stripe Customer if not exists
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email || profile?.email,
                name: profile?.username || user.user_metadata?.name,
                metadata: {
                    userId: user.id
                }
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: `${origin}/?success=true`,
            cancel_url: `${origin}/upgrade?canceled=true`,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {
                    userId: user.id
                }
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}
