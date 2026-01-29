
import React from "react";
import { Link } from "react-router-dom";
import {
    GraduationCap,
    ArrowRight,
    Zap,
    BarChart3,
    ShieldCheck,
    Trophy,
    Clock,
    BrainCircuit,
    CheckCircle2,
    Calendar,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const HomePage = () => {
    return (
        <div className="min-h-screen bg-transparent text-foreground font-poppins scroll-smooth">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-36 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6C8BFF]/10 rounded-full blur-[140px] opacity-30" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#E38AD6]/10 rounded-full blur-[120px] opacity-30" />
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/40 border border-white/60 text-[#6C8BFF] font-black text-[10px] uppercase tracking-[0.2em] mb-10 animate-fade-in shadow-sm backdrop-blur-md">
                        <Zap className="h-4 w-4 fill-[#6C8BFF]" />
                        Next-Gen Assessment Ecosystem
                    </div>

                    <h1 className="text-6xl lg:text-8xl font-black text-[#1E2455] tracking-tighter mb-10 max-w-5xl mx-auto leading-[0.95]">
                        Intelligence. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6]">Assessment.</span><br />Success.
                    </h1>

                    <p className="text-lg lg:text-xl text-[#3A3F6B]/70 mb-14 max-w-3xl mx-auto leading-relaxed font-bold italic">
                        The definitive administrative protocol for high-fidelity academic simulations, real-time merit indexing, and optimized pedagogy.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/student/login">
                            <Button size="lg" className="pastel-button-primary h-16 px-10 text-xs tracking-[0.15em]">
                                <Users className="h-5 w-5" />
                                STUDENT PORTAL
                            </Button>
                        </Link>
                        <Link to="/teacher/login">
                            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/60 bg-white/40 backdrop-blur-md hover:bg-white/60 text-[#1E2455] text-[10px] font-black tracking-[0.2em] transition-all flex items-center gap-3 shadow-md hover:shadow-glass-hover hover:-translate-y-1">
                                <GraduationCap className="h-5 w-5 text-[#6C8BFF]" />
                                FACULTY ACCESS
                            </Button>
                        </Link>
                    </div>

                    {/* Dashboard Preview Placeholder */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="aspect-[16/9] glass-card p-4 overflow-hidden group border-white/60 shadow-glass-hover">
                            <div className="w-full h-full bg-white/40 rounded-[24px] border border-white/50 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF]/5 to-[#E38AD6]/5" />
                                <div className="flex flex-col items-center gap-6 relative z-10 text-[#7A80B8]">
                                    <div className="h-24 w-24 rounded-[32px] bg-white/60 shadow- glass flex items-center justify-center border border-white/70 group-hover:scale-110 transition-transform duration-700">
                                        <BrainCircuit className="h-12 w-12 text-[#6C8BFF]" />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-[0.4em] text-[#1E2455]">Neural Dashboard Matrix</span>
                                </div>
                                {/* Decorative elements inside preview */}
                                <div className="absolute top-10 left-10 w-32 h-3 font-black bg-white/60 rounded-full" />
                                <div className="absolute top-20 left-10 w-48 h-3 bg-white/40 rounded-full" />
                                <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#6C8BFF]/10 rounded-full blur-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 relative">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] -z-10" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] mb-6 tracking-tighter uppercase">Core Capabilities</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] mx-auto rounded-full mb-8" />
                        <p className="text-lg text-[#7A80B8] font-bold italic">The essential toolkit for modular academic precision.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {features.map((feature, index) => (
                            <div key={index} className="glass-card p-10 group border-white/50 hover:shadow-glass-hover transition-all duration-500">
                                <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm", feature.color)}>
                                    <feature.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black text-[#1E2455] mb-4 uppercase tracking-tight">{feature.title}</h3>
                                <p className="text-[#3A3F6B]/80 leading-relaxed font-bold text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#6C8BFF]/10 text-[#6C8BFF] text-[10px] font-black uppercase mb-10 tracking-[0.2em] shadow-sm border border-[#6C8BFF]/20">
                                ETHOS & ARCHITECTURE
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] mb-8 tracking-tighter uppercase leading-[1.1]">The Professional Framework</h2>
                            <p className="text-lg text-[#3A3F6B]/70 mb-10 leading-relaxed font-bold italic">
                                QUIZ MASTER is a modular administrative ecosystem synthesized specifically for elite academic integration. We engineer the transition from legacy workflows to neural efficiency via seamless simulation management.
                            </p>

                            <ul className="space-y-6">
                                {[
                                    "Neural student interface for verified simulations",
                                    "Administrative core for module synthesis",
                                    "High-fidelity merit registry & indexing"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-[#1E2455] font-black uppercase text-[11px] tracking-widest">
                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] flex items-center justify-center text-white shadow-md">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-12">
                                <Link to="/about">
                                    <Button size="lg" variant="ghost" className="rounded-xl px-0 hover:bg-transparent text-[#6C8BFF] font-black flex items-center gap-3 group transition-all">
                                        ANALYZE MISSION STATEMENT
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square glass-card rounded-[60px] relative overflow-hidden transform rotate-2 shadow-2xl border-white/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] opacity-90" />
                                <div className="absolute inset-0 p-16 flex flex-col justify-end text-white relative z-10">
                                    <GraduationCap className="h-20 w-20 mb-8 opacity-40 transform -rotate-12" />
                                    <h4 className="text-4xl font-black mb-6 uppercase tracking-tighter">Academic Synthesis</h4>
                                    <p className="text-white/90 text-lg font-bold italic opacity-90 leading-relaxed">
                                        Empowering administrators with modular instrumentation to catalyze student cognitive development.
                                    </p>
                                </div>
                                {/* Subtle animated particles or highlights */}
                                <div className="absolute top-10 right-10 w-20 h-20 bg-white/20 rounded-full blur-3xl animate-pulse" />
                            </div>
                            {/* Decorative blocks */}
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 glass-card bg-white/40 p-8 flex items-center justify-center rounded-[32px] transform -rotate-6 border-white/60 shadow-glass-hover group">
                                <Trophy className="h-16 w-16 text-[#FFB86C] group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-32 relative">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] -z-10" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl lg:text-5xl font-black text-[#1E2455] mb-6 tracking-tighter uppercase">Operational Protocol</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-[#4EE3B2] to-[#6C8BFF] mx-auto rounded-full mb-8" />
                        <p className="text-lg text-[#7A80B8] font-bold italic">Synthesized steps for modular success.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-16 left-[70%] w-full h-[2px] border-t-2 border-dashed border-[#7A80B8]/20 z-0" />
                                )}
                                <div className="glass-card p-10 relative z-10 border-white/50 hover:shadow-glass-hover transition-all duration-500 hover:-translate-y-2">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] text-white flex items-center justify-center font-black text-xl mb-8 shadow-lg group-hover:scale-110 transition-transform">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-2xl font-black text-[#1E2455] mb-4 uppercase tracking-tight">{step.title}</h3>
                                    <p className="text-[#3A3F6B]/80 font-bold italic leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="glass-card bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[64px] p-16 lg:p-24 text-center relative overflow-hidden shadow-2xl border-white/30 group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-125 transition-transform duration-1000" />

                        <h2 className="text-4xl lg:text-7xl font-black text-white mb-10 relative z-10 tracking-tighter uppercase leading-[0.95]">
                            Initialize<br />Transformation.
                        </h2>
                        <p className="text-lg lg:text-xl text-white/90 mb-16 relative z-10 max-w-2xl mx-auto font-bold italic opacity-95">
                            Synchronize with the QUIZ MASTER architecture today and experience the high-fidelity future of academic simulations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <Link to="/signup">
                                <Button size="lg" className="h-20 px-12 rounded-[24px] bg-white text-[#6C8BFF] hover:bg-slate-50 text-xs font-black tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase">
                                    GENERATE ACCESS ROLE
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

const features = [
    {
        title: "Smart Quiz Scheduling",
        description: "Effortlessly schedule internal assessments with precise time windows and automated reminders for students.",
        icon: Calendar,
        color: "bg-info/10 text-info"
    },
    {
        title: "AI Quiz Generation",
        description: "Automatically generate high-quality quiz questions from PDFs and academic materials using advanced AI technologies.",
        icon: BrainCircuit,
        color: "bg-pink/10 text-pink"
    },
    {
        title: "Performance Analytics",
        description: "Gain deep insights into student performance with visual reports, trend analysis, and comprehensive statistics.",
        icon: BarChart3,
        color: "bg-success/10 text-success"
    },
    {
        title: "Secure Attempt Rules",
        description: "Maintain assessment integrity with flexible quiz rules, time limits, and session monitoring features.",
        icon: ShieldCheck,
        color: "bg-orange/10 text-orange"
    },
    {
        title: "Leaderboard & Ranking",
        description: "Foster healthy competition among students with real-time leaderboards and transparent department rankings.",
        icon: Trophy,
        color: "bg-yellow/10 text-yellow"
    },
    {
        title: "Instant Results",
        description: "Reduce waiting time with automated grading and instant result publishing for both students and faculty.",
        icon: Clock,
        color: "bg-teal/10 text-teal"
    }
];

const steps = [
    {
        title: "Teacher creates quiz",
        description: "Design assessments manually or let our AI generate questions from your course materials in seconds."
    },
    {
        title: "Students attempt quiz",
        description: "Students participate in scheduled assessments through a secure, distraction-free examination interface."
    },
    {
        title: "Automated Results",
        description: "Grading is handled instantly, updating dashboards and leaderboards with real-time performance data."
    }
];

export default HomePage;
