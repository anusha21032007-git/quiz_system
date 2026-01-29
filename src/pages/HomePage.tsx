
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
        <div className="min-h-screen bg-[#F8F9FE] text-foreground font-poppins scroll-smooth selection:bg-[#6C8BFF]/20 selection:text-[#1E2455]">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-48 overflow-hidden mesh-background">
                {/* Background Decoration */}
                <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                    <div className="hero-glow bg-[#6C8BFF] top-[-10%] left-[-10%] animate-pulse" />
                    <div className="hero-glow bg-[#E38AD6] bottom-[10%] right-[-5%] animate-pulse" style={{ animationDelay: '2s' }} />

                    {/* Floating Bubbles */}
                    <div className="absolute top-1/4 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-20 w-80 h-80 bg-[#6C8BFF]/5 rounded-full blur-3xl animate-float-delayed" />
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/40 border border-white/60 text-[#1E2455] font-black text-[11px] uppercase tracking-[0.3em] mb-12 animate-fade-in shadow-xl backdrop-blur-xl">
                        < Zap className="h-5 w-5 text-[#6C8BFF] fill-[#6C8BFF] animate-pulse" />
                        Next-Gen Assessment Architecture
                    </div>

                    <h1 className="text-7xl lg:text-[10rem] font-black text-[#1E2455] tracking-tighter mb-12 max-w-6xl mx-auto leading-[0.85] uppercase">
                        Mastery.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C8BFF] via-[#E38AD6] to-[#6C8BFF] bg-[length:200%_auto] animate-gradient-mask">
                            Assessment.
                        </span>
                    </h1>

                    <p className="text-xl lg:text-2xl text-[#3A3F6B]/80 mb-20 max-w-4xl mx-auto leading-relaxed font-bold italic opacity-80">
                        The definitive administrative protocol for high-fidelity simulations, real-time merit indexing, and optimized pedagogy.
                    </p>

<<<<<<< HEAD
=======
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <Link to="/student/login">
                            < Button className="pastel-button-primary h-20 px-16 text-[12px] font-black tracking-[0.4em] shadow-[0_20px_50px_rgba(108,139,255,0.3)] hover:shadow-[0_25px_60px_rgba(108,139,255,0.5)] uppercase flex items-center gap-6">
                                <Users className="h-6 w-6" />
                                STUDENT PORTAL
                            </Button>
                        </Link>
                        <Link to="/teacher/login">
                            < Button variant="outline" className="h-20 px-14 rounded-full border-white/80 bg-white/40 backdrop-blur-2xl hover:bg-white/70 text-[#1E2455] text-[12px] font-black tracking-[0.4em] transition-all flex items-center gap-6 shadow-xl hover:shadow-glass-hover hover:-translate-y-2 uppercase">
                                <GraduationCap className="h-6 w-6 text-[#6C8BFF]" />
                                FACULTY ACCESS
                            </Button>
                        </Link>
                    </div>
>>>>>>> b205ec2 (working)

                    {/* Dashboard Preview Placeholder */}
                    <div className="mt-40 relative max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-24 duration-1000">
                        <div className="aspect-[21/9] glass-card p-6 overflow-hidden group border-white/80 shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[48px]">
                            <div className="w-full h-full bg-white/30 rounded-[32px] border border-white/60 flex items-center justify-center relative overflow-hidden backdrop-blur-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF]/10 to-[#E38AD6]/10" />
                                <div className="flex flex-col items-center gap-10 relative z-10 text-[#7A80B8]">
                                    <div className="h-32 w-32 rounded-[40px] bg-white/70 shadow-2xl flex items-center justify-center border border-white/90 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                        <BrainCircuit className="h-16 w-16 text-[#6C8BFF]" />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-[0.6em] text-[#1E2455] opacity-60">Architectural Context Preview</span>
                                </div>
                                {/* Decorative elements inside preview */}
                                <div className="absolute top-12 left-12 w-64 h-4 bg-white/60 rounded-full" />
                                <div className="absolute top-24 left-12 w-96 h-4 bg-white/40 rounded-full" />
                                <div className="absolute bottom-12 right-12 w-64 h-64 bg-[#6C8BFF]/20 rounded-full blur-3xl animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl -z-10" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-32">
                        <div className="inline-block h-2 w-24 bg-gradient-to-r from-[#6C8BFF] to-[#E38AD6] rounded-full mb-8" />
                        <h2 className="text-5xl lg:text-7xl font-black text-[#1E2455] mb-8 tracking-tighter uppercase leading-none">Core Capabilities</h2>
                        <p className="text-xl text-[#7A80B8] font-bold italic opacity-70">The high-fidelity instrumentation for modular academic precision.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {features.map((feature, index) => (
                            <div key={index} className="glass-card p-12 group border-white hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-[100px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                                <div className={cn("inline-flex items-center justify-center w-20 h-20 rounded-[24px] mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-xl border border-white/50", feature.color)}>
                                    <feature.icon className="h-10 w-10" />
                                </div>
                                <h3 className="text-3xl font-black text-[#1E2455] mb-6 uppercase tracking-tight leading-none">{feature.title}</h3>
                                <p className="text-[#3A3F6B] leading-relaxed font-bold text-base opacity-70 italic group-hover:opacity-100 transition-opacity">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-48 overflow-hidden mesh-background relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <div className="space-y-12">
                            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/50 text-[#6C8BFF] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl border border-white overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative">Framework & Ethos</span>
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-black text-[#1E2455] tracking-tighter uppercase leading-[0.9] max-w-lg">Advanced Academic Ecosystem</h2>
                            <p className="text-xl text-[#3A3F6B] leading-relaxed font-bold italic opacity-70">
                                QUIZ MASTER is a high-fidelity administrative ecosystem engineered specifically for elite university integration. We facilitate the transition from legacy workflows to maximum efficiency.
                            </p>

                            <ul className="space-y-8">
                                {[
                                    "Student interface for verified simulations",
                                    "Administrative core for quiz management",
                                    "High-fidelity merit registry & indexing"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-6 text-[#1E2455] font-black uppercase text-xs tracking-[0.2em] group">
                                        <div className="h-12 w-12 rounded-[18px] bg-white shadow-xl flex items-center justify-center text-[#6C8BFF] border border-white/80 group-hover:scale-110 group-hover:bg-[#6C8BFF] group-hover:text-white transition-all duration-500">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-8">
                                <Link to="/about">
                                    <Button size="lg" className="h-16 px-12 rounded-full bg-white text-[#1E2455] font-black text-[11px] tracking-[0.3em] shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all uppercase flex items-center gap-4 group">
                                        Mission Statement
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-3" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative pt-20 lg:pt-0">
                            <div className="aspect-square glass-card rounded-[80px] relative overflow-hidden transform rotate-3 shadow-[0_60px_120px_rgba(0,0,0,0.15)] border-white border-2 group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#6C8BFF] via-[#E38AD6] to-[#6C8BFF] opacity-90 transition-opacity duration-1000 group-hover:opacity-100" />
                                <div className="absolute inset-0 p-20 flex flex-col justify-end text-white relative z-10">
                                    < GraduationCap className="h-32 w-32 mb-12 opacity-30 transform -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700" />
                                    <h4 className="text-5xl font-black mb-8 uppercase tracking-tighter leading-none">Management Core</h4>
                                    <p className="text-white text-xl font-bold italic opacity-90 leading-relaxed max-w-sm">
                                        Empowering administrators with modular instrumentation to catalyze development.
                                    </p>
                                </div>
                                <div className="absolute top-12 right-12 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
                            </div>

                            <div className="absolute -bottom-16 -left-16 w-56 h-56 glass-card bg-white/50 p-12 flex items-center justify-center rounded-[48px] transform -rotate-12 border-white/80 shadow-2xl group cursor-pointer hover:rotate-0 transition-all duration-700">
                                <Trophy className="h-24 w-24 text-[#FFB86C] drop-shadow-lg group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-48 relative bg-white/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-32">
                        <div className="inline-block h-2 w-24 bg-gradient-to-r from-[#4EE3B2] to-[#6C8BFF] rounded-full mb-8" />
                        <h2 className="text-5xl lg:text-7xl font-black text-[#1E2455] mb-8 tracking-tighter uppercase leading-none">Operational Protocol</h2>
                        <p className="text-xl text-[#7A80B8] font-bold italic opacity-70">Modular steps for high-fidelity success.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-16 relative">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group perspective-1000">
                                {index < 2 && (
                                    <div className="hidden lg:block absolute top-1/2 left-[80%] w-[40%] h-[2px] border-t-4 border-dotted border-[#6C8BFF]/20 z-0 -translate-y-1/2" />
                                )}
                                <div className="glass-card p-12 relative z-10 border-white hover:bg-white/80 transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] rounded-[40px]">
                                    <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] text-white flex items-center justify-center font-black text-2xl mb-10 shadow-[0_15px_30px_rgba(108,139,255,0.3)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                        0{index + 1}
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1E2455] mb-6 uppercase tracking-tight leading-none">{step.title}</h3>
                                    <p className="text-base text-[#3A3F6B] font-bold italic leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-48 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="glass-card bg-gradient-to-br from-[#1E2455] to-[#3A3F6B] rounded-[80px] p-24 lg:p-40 text-center relative overflow-hidden shadow-[0_100px_200px_rgba(30,36,85,0.3)] border-white/10 group">
                        {/* Animated background highlights */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6C8BFF]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E38AD6]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[120px] group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-mesh animate-pulse opacity-10 pointer-events-none" />

                        <h2 className="text-6xl lg:text-[9rem] font-black text-white mb-12 relative z-10 tracking-[ -0.05em] uppercase leading-[0.8] animate-in fade-in zoom-in duration-1000">
                            Initialize<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#6C8BFF] to-white bg-[length:200%_auto] animate-gradient-mask">Success.</span>
                        </h2>
                        <p className="text-xl lg:text-2xl text-white/70 mb-20 relative z-10 max-w-3xl mx-auto font-bold italic leading-relaxed">
                            Synchronize with the elite QUIZ MASTER architecture today and experience the high-fidelity future of academic intelligence.
                        </p>
<<<<<<< HEAD
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <Link to="/login">
                                <Button size="lg" className="h-20 px-12 rounded-[24px] bg-white text-[#6C8BFF] hover:bg-slate-50 text-xs font-black tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase">
                                    ACCESS PORTAL
=======
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-10 relative z-10">
                            <Link to="/signup">
                                < Button className="h-24 px-20 rounded-[32px] bg-white text-[#1E2455] hover:bg-slate-50 text-[14px] font-black tracking-[0.4em] shadow-2xl hover:scale-110 active:scale-95 transition-all uppercase">
                                    Generate Access Role
>>>>>>> b205ec2 (working)
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
