export default function TermsPage() {
    return (
        <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-slate-600">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: January 11, 2026</p>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-8 text-amber-900 text-sm">
                <strong>IMPORTANT MEDICAL DISCLAIMER:</strong> Softale is a wellness and relaxation tool, NOT a medical device. We do not diagnose or treat medical conditions like clinical insomnia or anxiety disorders. Always consult a physician for medical advice.
            </div>

            <div className="space-y-8 prose prose-slate max-w-none">
                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Agreement to Terms</h2>
                    <p>
                        By creating an account or accessing <strong>Softale</strong> ("the Service"), you agree to be bound by these Terms. If you do not agree, you must discontinue use immediately.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Medical Disclaimer</h2>
                    <p>
                        The Content provided by Softale (audio stories, meditations, soundscapes) is for entertainment and relaxation purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Never disregard professional medical advice because of something you have heard on the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Subscriptions & Billing</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Free Trial:</strong> We may offer a limited free trial. You will not be charged if you cancel at least 24 hours before the trial ends.</li>
                        <li><strong>Billing Cycle:</strong> Subscriptions are billed in advance on a monthly or annual basis. Your subscription automatically renews unless cancelled.</li>
                        <li><strong>Cancellation:</strong> You may cancel your subscription at any time via your Account Settings. You will continue to have access until the end of your current billing period.</li>
                        <li><strong>Refunds:</strong> Payments are non-refundable, and there are no credits for partially used periods, except where required by law (e.g., EU Right of Withdrawal within 14 days of initial purchase).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">4. User Conduct</h2>
                    <p>
                        You agree not to share your account credentials or resell access to the Service. We reserve the right to terminate accounts that abuse the platform or violate these terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Intellectual Property</h2>
                    <p>
                        All audio, text, graphics, and code are the property of Softale or its licensors. You are granted a limited license to listen to the Content for personal, non-commercial use only.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Softale shall not be liable for any indirect, incidental, or consequential damages. The Service is provided "AS IS" without warranties of any kind.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Contact Us</h2>
                    <p>
                        For questions regarding these Terms or for support, please contact us at <a href="mailto:support@softale.app" className="text-indigo-600 hover:underline">support@softale.app</a>.
                    </p>
                </section>
            </div>
        </main>
    );
}
