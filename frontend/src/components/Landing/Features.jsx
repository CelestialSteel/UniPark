export default function Features() {
    const features = [
        {
            icon: '',
            title: 'Real-time Telemetry',
            description: 'Live occupancy data refreshed every 15 seconds across all monitored parking structures',
        },
        {
            icon: '',
            title: 'Security Dashboard',
            description: 'Advanced monitoring tools for security personnel to manage permits and zone violations',
        },
        {
            icon: '',
            title: 'Usage Analytics',
            description: 'Historical data analysis to help university planners optimize future campus infrastructure',
        },
    ];

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-dark mb-4">
                        Engineered for Reliability
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Our infrastructure combines IoT sensor arrays with intelligent predictive modeling to ensure you never waste time hunting for a spot.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-lg transition"
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-dark mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
