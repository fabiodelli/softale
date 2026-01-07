import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new NextResponse('Missing signature or secret', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const customerId = session.customer as string;

                if (userId) {
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            is_premium: true,
                            stripe_customer_id: customerId,
                            // Ideally calculate end date, but for now just mark premium
                            subscription_status: 'active'
                        })
                        .eq('id', userId);
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const isPremium = subscription.status === 'active' || subscription.status === 'trialing';

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        is_premium: isPremium,
                        subscription_status: subscription.status,
                        premium_until: new Date(subscription.current_period_end * 1000).toISOString()
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await supabaseAdmin
                    .from('profiles')
                    .update({
                        is_premium: false,
                        subscription_status: 'canceled'
                    })
                    .eq('stripe_customer_id', customerId);
                break;
            }
        }
    } catch (error: any) {
        console.error('Error handling webhook event:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
