import { Link } from 'react-router-dom';

export default function CallToAction() {
    return (
        <section className="bg-primary text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-4">
                    Ready to find your spot?
                </h2>
                <p className="text-lg text-blue-100 mb-8">
                    Access the full dashboard to view maps, permit status, and personalized parking recommendations.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-white text-primary px-8 py-3 rounded-md hover:bg-gray-100 transition font-bold text-lg"
                >
                    Enter Student Portal
                </Link>
            </div>
        </section>
    );
}
