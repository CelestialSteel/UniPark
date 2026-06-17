import Header from '../Common/Header';
import Footer from '../Common/Footer';
import Hero from './Hero';
import Features from './Features';
import CallToAction from './CallToAction';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                <Hero />
                <Features />
                <CallToAction />
            </main>
            <Footer />
        </div>
    );
}
