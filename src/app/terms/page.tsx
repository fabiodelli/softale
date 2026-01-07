export default function TermsPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-slate-600">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: December 2025</p>

            <div className="space-y-8 prose prose-slate max-w-none">
                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using <strong>Softale</strong> ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Description of Service</h2>
                    <p>
                        Softale provides a platform for audio storytelling, sleep aids, and meditation ("Content"). We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Accounts</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account. We reserve the right to terminate accounts that violate our policies.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Intellectual Property</h2>
                    <p>
                        All content provided on Softale, including audio tracks, scripts, and artwork, is the property of Softale or its content creators and is protected by copyright laws. You may not distribute, modify, or resell any content without explicit permission.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Subscriptions and Payments</h2>
                    <p>
                        Some parts of the Service may be accessed via a paid subscription. All payments are processed securely via third-party providers (Stripe). Subscriptions automatically renew unless cancelled.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Limitation of Liability</h2>
                    <p>
                        The Service is provided "as is". Softale shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.
                    </p>
                </section>
            </div>
        </main>
    );
}
