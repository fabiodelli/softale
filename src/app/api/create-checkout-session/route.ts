import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { userId, email, priceId } = await request.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        // Check if user already has a Stripe customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        let customerId = profile?.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: { supabase_user_id: userId },
            });
            customerId = customer.id;

            // Save customer ID to profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        // Create checkout session with 14-day free trial
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            shipping_address_collection: {
                allowed_countries: ['US', 'GB', 'CA', 'AU', 'CH', 'NZ', 'JP', 'SG', 'BR', 'MX', 'IN'], // Non-EU Whitelist
            },
            line_items: [
                {
                    price: priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 14,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?canceled=true`,
            metadata: {
                supabase_user_id: userId,
            },
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Checkout session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
