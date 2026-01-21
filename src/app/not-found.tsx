import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Not Found</h2>
                <p className="text-slate-500 mb-6">Could not find requested resource</p>
                <Link
                    href="/"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
                >
                    Return Home
                </Link>
            </div>
        </div>
    )
}
