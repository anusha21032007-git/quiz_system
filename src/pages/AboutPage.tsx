
import React from "react";
import { Link } from "react-router-dom";
import {
    GraduationCap,
    CheckCircle2,
    ArrowLeft,
    Shield,
    Target,
    Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-8">
                        <Link to="/">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent text-slate-500 hover:text-indigo-600 transition-colors font-bold">
                                <ArrowLeft className="h-4 w-4" /> Back to Home
                            </Button>
                        </Link>
                    </div>

                    <div className="max-w-3xl">
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 tracking-tight">
                            About <span className="text-indigo-600">EduFlow</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed font-medium mb-12">
                            EduFlow is an advanced academic quiz management system designed to streamline the assessment process for educational institutions. We bridge the gap between traditional testing and modern technology, providing a seamless experience for both teachers and students.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 mb-20">
                        {visions.map((item, index) => (
                            <div key={index} className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-6">
                                    <item.icon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-600 rounded-[48px] p-12 lg:p-16 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                        <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Our Core Capabilities</h2>
                                <p className="text-indigo-100 mb-8 text-lg font-medium opacity-90 leading-relaxed">
                                    Built for the demanding needs of modern universities, EduFlow provides a robust infrastructure for academic excellence.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Student dashboard for scheduled quizzes + results",
                                        "Teacher dashboard for quiz creation + user management",
                                        "Real-time leaderboard and tracking",
                                        "AI-powered question generation from PDFs",
                                        "Secure and timed assessment windows"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                                                <CheckCircle2 className="h-3 w-3" />
                                            </div>
                                            <span className="font-bold">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center w-full max-w-sm">
                                    <GraduationCap className="h-16 w-16 text-white mx-auto mb-6 opacity-40" />
                                    <div className="text-4xl font-black mb-2">100%</div>
                                    <div className="text-indigo-100 font-bold uppercase tracking-widest text-sm">Academic Focused</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

const visions = [
    {
        title: "Integrity First",
        description: "We prioritize assessment security and academic honesty in every feature we build.",
        icon: Shield
    },
    {
        title: "Goal Oriented",
        description: "Designed to help students track their growth and achieve their learning objectives.",
        icon: Target
    },
    {
        title: "Collaboration",
        description: "Fostering a productive environment for teachers and students to interact effectively.",
        icon: Users2
    }
];

export default AboutPage;
