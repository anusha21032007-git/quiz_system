
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
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-8">
                        <Link to="/">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent text-slate-400 hover:text-primary transition-colors font-bold">
                                <ArrowLeft className="h-4 w-4" /> Back to Home
                            </Button>
                        </Link>
                    </div>

                    <div className="max-w-3xl">
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-50 mb-8 tracking-tight uppercase leading-tight">
                            About <span className="text-primary">Quiz Management System</span>
                        </h1>
                        <p className="text-xl text-slate-400 leading-relaxed font-medium mb-12">
                            QUIZ MANAGEMENT SYSTEM is an advanced academic assessment platform designed to streamline the evaluation process for educational institutions. We bridge the gap between traditional testing and modern technology, providing a seamless experience for both teachers and students.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 mb-20">
                        {visions.map((item, index) => (
                            <div key={index} className="p-8 rounded-[32px] bg-card border border-slate-800 shadow-xl group hover:border-primary/30 transition-all duration-300">
                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                                    <item.icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-50 mb-3">{item.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-primary rounded-[48px] p-12 lg:p-16 text-white overflow-hidden relative shadow-2xl shadow-primary/20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-30" />

                        <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                            <div>
                                <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Our Core Capabilities</h2>
                                <p className="text-white/80 mb-8 text-lg font-medium leading-relaxed">
                                    Built for the demanding needs of modern universities, QUIZ MANAGEMENT SYSTEM provides a robust infrastructure for academic excellence.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Student dashboard for scheduled quizzes + results",
                                        "Teacher dashboard for quiz creation + user management",
                                        "Real-time leaderboard and tracking",
                                        "AI-powered question generation from PDFs",
                                        "Secure and timed assessment windows"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="mt-1 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 border border-white/20 shadow-sm">
                                                <CheckCircle2 className="h-3 w-3" />
                                            </div>
                                            <span className="font-bold text-slate-50">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="p-10 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-center w-full max-w-sm shadow-xl">
                                    <GraduationCap className="h-16 w-16 text-white mx-auto mb-6 opacity-40" />
                                    <div className="text-5xl font-black mb-2">100%</div>
                                    <div className="text-white font-bold uppercase tracking-widest text-xs opacity-80">Academic Focused</div>
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
