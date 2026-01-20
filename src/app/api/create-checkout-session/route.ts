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
        console.log('🛒 Checkout request:', { userId, email, priceId });

        if (!userId || !email) {
            console.error('❌ Missing userId or email');
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        // Check if user already has a Stripe customer
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        console.log('👤 Profile lookup:', { profile, profileError });

        let customerId = profile?.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            console.log('🆕 Creating new Stripe customer...');
            const customer = await stripe.customers.create({
                email,
                metadata: { supabase_user_id: userId },
            });
            customerId = customer.id;
            console.log('✅ Created Stripe customer:', customerId);

            // Save customer ID to profile
            const { data: updateData, error: updateError } = await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId)
                .select();

            console.log('📝 Saved stripe_customer_id:', { updateData, updateError });
        } else {
            console.log('♻️ Using existing Stripe customer:', customerId);
        }

        // Create checkout session with 14-day free trial
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
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

        console.log('✅ Checkout session created:', session.id);
        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: unknown) {
        console.error('❌ Checkout session error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

