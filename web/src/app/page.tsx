'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, MapPin, Database, Activity, Scale, Server, ArrowRight, Fingerprint } from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();

    const features = [
        { icon: Users, title: 'Citizen Engagement', desc: 'Securely submit tips, report incidents, and track public safety alerts anonymously.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { icon: MapPin, title: 'Patrol Active Dispatch', desc: 'Live geolocation routing and immediate incident workspace for first responders.', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { icon: Shield, title: 'Detective CID', desc: 'Biometric-locked case directories and chain-of-custody evidence registry.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { icon: Database, title: 'Forensic Analysis', desc: 'Direct lab integration and secure upload for DNA, digital, and physical evidence reports.', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
        { icon: Activity, title: 'Supervisor Oversight', desc: 'City-wide analytics and real-time officer monitoring dashboards.', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        { icon: Scale, title: 'Judicial / Prosecutor', desc: 'Integrated docket scheduling, warrant generation, and executive caseload tracking.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none opacity-50 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none opacity-40" />
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none opacity-30" />

            {/* Navbar */}
            <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Guardian<span className="text-blue-400">Net</span></span>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-[#171717] px-6 font-medium text-neutral-200 border border-[#262626] hover:border-blue-500/50 transition-colors duration-300"
                >
                    <span className="relative flex items-center gap-2 text-sm font-semibold">
                        <Fingerprint className="w-4 h-4 text-blue-400" />
                        Access Portal
                    </span>
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                        <div className="relative h-full w-8 bg-white/5" />
                    </div>
                </button>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
                {/* Hero Section */}
                <div className="text-center max-w-4xl mx-auto mb-24">
                    <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
                        <Server className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Next Generation Infrastructure</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        Civic Justice, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Unified and Secured.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        GuardianNet provides a seamless, interconnected platform for citizens, active dispatch, forensic labs, and the judicial system.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center justify-center group"
                        >
                            Authenticate Now
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="group bg-[#121212] border border-[#262626] hover:border-white/20 p-8 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className={`${f.bg} ${f.border} border w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                                <f.icon className={`w-7 h-7 ${f.color}`} />
                            </div>

                            <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2026 GuardianNet Systems. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">Security Audit</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
