export default function About() {
    const teamMembers = [
        {
            name: "Griffin Sitati",
            role: "Co-Founder & Developer",
            bio: "Griffin Sitati is a third-year student at Strathmore University pursuing Informatics and Computer Science. He aspires to build creative solutions to global problems and is also an aspiring novelist.",
            initials: "GS",
            github: "https://github.com/CelestialSteel",
            linkedin: "#",
            image: "" // Add your image path here when ready, e.g., import from assets
        },
        {
            name: "Dalton Mule",
            role: "Co-Founder & Developer",
            bio: "Dalton Mule is a third-year student at Strathmore University pursuing Informatics and Computer Science. He loves building, solving complex problems, and is an avid chess player.",
            initials: "DM",
            github: "https://github.com/Dmu1e",
            linkedin: "#",
            image: "" // Add your image path here when ready, e.g., import from assets
        }
    ];

    return (
        <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-16">
            <div className="max-w-7xl mx-auto space-y-20">

                {/* About UniPark Section */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-semibold tracking-wide uppercase">
                            <span>Our Mission</span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-dark tracking-tight sm:text-5xl">
                            About <span className="text-primary">UniPark</span>
                        </h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            UniPark is an advanced, intelligent parking management system custom-engineered for Strathmore University. Our web application streamlines campus commutes, helps drivers find available parking spots in seconds, and empowers campus security to monitor vehicular movement with high precision and security.
                        </p>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-primary">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A2 2 0 013 15.556V6.444a2 2 0 011.553-1.956l5.447-2.724a2 2 0 011.553 0l5.447 2.724A2 2 0 0119 6.444v9.112a2 2 0 01-1.553 1.956l-5.447 2.724a2 2 0 01-1.553 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-dark">Real-Time Parking Tracking</h3>
                                    <p className="mt-1 text-gray-600">Track and find active vacant spots around the campus dynamically, minimizing search time and reducing congestion.</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-50 text-primary">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-bold text-dark">Vehicular Security</h3>
                                    <p className="mt-1 text-gray-600">Enhanced security systems designed to authenticate and track entry/exit logs of vehicles inside the campus premises.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:mt-0 mt-8">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200 to-indigo-100 rounded-3xl transform rotate-2 opacity-50 scale-105 filter blur-lg"></div>
                        <div className="relative bg-gray-50 border border-gray-200 p-8 rounded-3xl shadow-xl flex flex-col justify-center h-full">
                            <h4 className="text-xl font-bold text-dark mb-4">Why UniPark?</h4>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-3 text-gray-700">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Frictionless entry and exit for registered vehicles</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-700">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Predictive analytics for peak occupancy periods</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-700">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Centralized dashboard for campus security administrators</span>
                                </li>
                                <li className="flex items-center space-x-3 text-gray-700">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Intuitive mobile-friendly driver application interface</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Meet the Team Section */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-semibold tracking-wide uppercase">
                            <span>The Creators</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-dark sm:text-4xl tracking-tight">
                            Meet the Team
                        </h2>
                        <p className="max-w-2xl mx-auto text-xl text-gray-600">
                            The minds behind the development and deployment of UniPark.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    {/* Image Section / Placeholder for future replacement */}
                                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Stylized Initials Badge overlay */}
                                        <div className="absolute bottom-0 right-0 bg-primary text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow">
                                            {member.initials}
                                        </div>
                                    </div>

                                    {/* Text Info */}
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors">
                                            {member.name}
                                        </h3>
                                        <p className="text-sm font-semibold text-primary">
                                            {member.role}
                                        </p>
                                        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                                            {member.bio}
                                        </p>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="flex justify-center space-x-4 pt-6 mt-6 border-t border-gray-100">
                                    <a
                                        href={member.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-dark transition-colors"
                                        title="GitHub Profile"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                    <a
                                        href={member.linkedin}
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="LinkedIn Profile"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}