import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log('✅ Webhook verified:', event.type);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown verification error';
        console.error('❌ Webhook signature verification failed:', message);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                console.log('📦 checkout.session.completed - userId:', userId, 'subscription:', session.subscription);

                if (userId) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .update({
                            is_premium: true,
                            subscription_id: session.subscription as string,
                            subscription_status: 'active',
                        })
                        .eq('id', userId)
                        .select();

                    console.log('📝 Update result:', { data, error });
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                console.log('📦', event.type, '- customerId:', customerId, 'status:', subscription.status);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                console.log('👤 Found profile:', profile);

                if (profile) {
                    // Handle both 'active' and 'trialing' as premium
                    const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

                    const { data, error } = await supabase
                        .from('profiles')
                        .update({
                            subscription_status: subscription.status,
                            is_premium: isPremium,
                            subscription_id: subscription.id,
                            subscription_end_date: (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
                                ? new Date((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000).toISOString()
                                : null,
                        })
                        .eq('id', profile.id)
                        .select();

                    console.log('📝 Update result:', { data, error });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                console.log('📦 customer.subscription.deleted - customerId:', customerId);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .update({
                            is_premium: false,
                            subscription_status: 'canceled',
                            subscription_id: null,
                        })
                        .eq('id', profile.id)
                        .select();

                    console.log('📝 Update result:', { data, error });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                console.log('📦 invoice.payment_failed - customerId:', customerId);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await supabase
                        .from('profiles')
                        .update({ subscription_status: 'past_due' })
                        .eq('id', profile.id);
                }
                break;
            }

            default:
                console.log('⚠️ Unhandled event type:', event.type);
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        console.error('❌ Webhook handler error:', error);
        const message = error instanceof Error ? error.message : 'Unknown handler error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

