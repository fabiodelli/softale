export default function PrivacyPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-slate-600">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: January 11, 2026</p>

            <div className="space-y-8 prose prose-slate max-w-none">
                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
                    <p>
                        Softale ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and website (the "Service").
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Account Data:</strong> Email address, name, and password (encrypted).</li>
                        <li><strong>Usage Data:</strong> Listening history, mood preferences, and app interaction logs.</li>
                        <li><strong>Payment Data:</strong> We do NOT store credit card numbers. All payments are processed securely by Stripe, Inc.</li>
                        <li><strong>Device Data:</strong> IP address, device type, and operating system version for analytics.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
                    <p>We use your data to:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Provide and personalize the Service (e.g., suggesting stories based on mood).</li>
                        <li>Process subscription payments and prevent fraud.</li>
                        <li>Send service updates and promotional emails (opt-out available).</li>
                        <li>Analyze usage trends to improve our content catalog.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Sharing & Third Parties</h2>
                    <p>We do not sell your personal data. We share data only with trusted infrastructure providers:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Supabase:</strong> Database and Authentication services.</li>
                        <li><strong>Stripe:</strong> Payment processing.</li>
                        <li><strong>Vercel:</strong> Cloud hosting and analytics.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Retention & Security</h2>
                    <p>
                        We retain your data as long as your account is active. Upon account deletion, personal data is removed from our live databases within 30 days. We use industry-standard encryption (SSL/TLS) for data in transit and at rest.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights (General)</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Access the personal data we hold about you.</li>
                        <li>Request correction of inaccurate data.</li>
                        <li>Request deletion of your account and data ("Right to be Forgotten").</li>
                        <li>Withdraw consent for marketing communications.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Contact Us</h2>
                    <p>
                        To exercise your rights or for privacy questions, contact our Data Protection Officer at <a href="mailto:privacy@softale.app" className="text-indigo-600 hover:underline">privacy@softale.app</a>.
                    </p>
                </section>
            </div>
        </main>
    );
}
