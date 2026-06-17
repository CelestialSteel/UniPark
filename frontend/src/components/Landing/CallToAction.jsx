import { Link } from 'react-router-dom';

export default function CallToAction() {
    return (
        <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center rounded-3xl border border-white/10 bg-white/5 px-6 py-12 shadow-2xl backdrop-blur-sm sm:px-10">
                <h2 className="text-4xl font-bold mb-4 text-white">
                    Ready to find your spot?
                </h2>
                <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
                    Access the full dashboard to view maps, permit status, and personalized parking recommendations.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-white text-slate-900 px-8 py-3 rounded-md border border-white/20 hover:bg-slate-100 transition font-bold text-lg shadow-lg"
                >
                    Enter Student Portal
                </Link>
            </div>
        </section>
    );
}
