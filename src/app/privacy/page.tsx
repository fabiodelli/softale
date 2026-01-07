export default function PrivacyPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-slate-600">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mb-8">Last updated: December 2025</p>

            <div className="space-y-8 prose prose-slate max-w-none">
                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us. This may include your name, email address, and payment information.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li>Provide, maintain, and improve our Service.</li>
                        <li>Process transactions and send related information.</li>
                        <li>Monitor and analyze trends, usage, and activities.</li>
                        <li>Personalize your experience (e.g., "Continue Listening").</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Cookies and Tracking</h2>
                    <p>
                        We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies, but some parts of our Service may not function properly without them.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Third-Party Services</h2>
                    <p>
                        We use trusted third-party services to operate our business:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        <li><strong>Supabase:</strong> For authentication and database hosting.</li>
                        <li><strong>Stripe:</strong> For secure payment processing. We do not store your credit card details.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Security</h2>
                    <p>
                        We strive to use commercially acceptable means to protect your Personal Data, but remember that no method of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@softale.com.
                    </p>
                </section>
            </div>
        </main>
    );
}
