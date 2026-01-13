'use client';

import { useCookie } from '@/context/CookieContext';
import { Shield, Cookie, Settings } from 'lucide-react';

export default function CookiePolicyPage() {
    const { openBanner, consent } = useCookie();

    return (
        <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
            <header className="mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider mb-4 border border-indigo-100">
                    <Shield className="w-4 h-4" />
                    Legal
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Cookie Policy</h1>
                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                    Transparency about how we use your data to create a better audio experience.
                </p>
            </header>

            <section className="space-y-12">
                {/* --- Current Status & Controls --- */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-slate-400" />
                                Your Preferences
                            </h2>
                            <p className="text-slate-600">
                                Current Status: {' '}
                                <span className={`font-bold uppercase tracking-wide px-2 py-0.5 rounded text-sm ${consent === 'accepted' ? 'bg-emerald-100 text-emerald-800' : consent === 'declined' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>
                                    {consent ? consent : 'Not Set'}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={openBanner}
                            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold font-medium shadow-sm hover:shadow-md hover:border-indigo-300 transition flex items-center gap-2"
                        >
                            <Cookie className="w-4 h-4" />
                            Manage Cookie Settings
                        </button>
                    </div>
                </div>

                {/* --- Policy Content --- */}
                <div className="prose prose-slate max-w-none">
                    <h3>1. What are Cookies?</h3>
                    <p>
                        Cookies are small text files that are placed on your device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                    </p>

                    <h3>2. How We Use Cookies</h3>
                    <p>
                        Softale uses cookies to:
                    </p>
                    <ul>
                        <li><strong>Essential functionality:</strong> Keep you logged in and ensure the audio player works continuously as you navigate.</li>
                        <li><strong>Preferences:</strong> Remember your volume settings and last played mood.</li>
                        <li><strong>Analytics (Optional):</strong> Understand how our app is used so we can improve features. We use aggregated, anonymous data for this.</li>
                    </ul>

                    <h3>3. Third-Party Services</h3>
                    <p>
                        We may use trusted third-party services like Stripe (for payments) and Supabase (for authentication) that may also set cookies to function securely.
                    </p>

                    <h3>4. Controlling Cookies</h3>
                    <p>
                        You can change your cookie preferences at any time by clicking the "Manage Cookie Settings" button above. Most web browsers also allow some control of most cookies through the browser settings.
                    </p>

                    <p className="text-sm text-slate-400 mt-8 pt-8 border-t border-slate-200">
                        Last updated: {new Date().getFullYear()}
                    </p>
                </div>
            </section>
        </main>
    );
}
