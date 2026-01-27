
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
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-info/20 rounded-full blur-[100px] opacity-20" />
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider mb-8 animate-fade-in shadow-lg shadow-primary/5">
                        <Zap className="h-4 w-4" />
                        Next-Gen Assessment Platform
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-slate-50 tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
                        Quiz Management <span className="text-primary text-glow">System</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        A professional platform for online internal assessments, scheduling quizzes, and tracking performance with precision and ease.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/student/login">
                            <Button size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-xl shadow-primary/20 transition-all flex items-center gap-3">
                                <Users className="h-5 w-5" />
                                Student Login
                            </Button>
                        </Link>
                        <Link to="/teacher/login">
                            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-800 hover:border-primary hover:bg-primary/5 text-lg font-bold transition-all flex items-center gap-3 text-slate-300">
                                <GraduationCap className="h-5 w-5" />
                                Teacher Login
                            </Button>
                        </Link>
                    </div>

                    {/* Dashboard Preview Placeholder */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="aspect-[16/9] bg-[#020617] rounded-3xl border border-slate-800 shadow-2xl p-4 overflow-hidden group">
                            <div className="w-full h-full bg-[#0F172A] rounded-2xl border border-slate-800 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-info/5" />
                                <div className="flex flex-col items-center gap-4 relative z-10 text-slate-600">
                                    <div className="h-20 w-20 rounded-3xl bg-slate-900 shadow-sm flex items-center justify-center border border-slate-800">
                                        <BrainCircuit className="h-10 w-10 text-primary/30" />
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-widest opacity-50">Enterprise Dashboard Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-card/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-50 mb-4 tracking-tight">Powerful Features</h2>
                        <p className="text-lg text-slate-400 font-medium">Everything you need to manage academic assessments at scale.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-card p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-primary/5 hover:border-primary/50 hover:-translate-y-1 transition-all group">
                                <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 transition-colors", feature.color)}>
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-50 mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed font-medium text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase mb-6 tracking-wider text-center">
                                About QUIZ MANAGEMENT SYSTEM
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-card-foreground mb-6 tracking-tight">Professional Assessment Framework</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                                QUIZ MANAGEMENT SYSTEM is a sophisticated academic platform designed specifically for higher education institutions. We focus on bridging the gap between traditional manual workflows and digital efficiency through seamless quiz management.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Student dashboard for scheduled quizzes + results",
                                    "Teacher dashboard for quiz creation + user management",
                                    "Real-time leaderboard and tracking"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-bold">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10">
                                <Link to="/about">
                                    <Button size="lg" variant="ghost" className="rounded-xl px-0 hover:bg-transparent text-primary font-bold flex items-center gap-2 group">
                                        Learn more about our mission
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-primary rounded-[60px] relative overflow-hidden rotate-3 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-info opacity-90" />
                                <div className="absolute inset-0 p-12 flex flex-col justify-end text-white">
                                    <GraduationCap className="h-16 w-16 mb-6 opacity-40" />
                                    <h4 className="text-3xl font-bold mb-4">Academic Excellence</h4>
                                    <p className="text-white/80 text-lg opacity-80 leading-relaxed">
                                        Empowering educators with tools that simplify complexity and maximize student potential.
                                    </p>
                                </div>
                            </div>
                            {/* Decorative blocks */}
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-slate-900 rounded-3xl shadow-xl p-6 flex items-center justify-center rotate-[-12deg] border border-slate-800">
                                <Trophy className="h-12 w-12 text-yellow" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-card/30 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4 tracking-tight">How It Works</h2>
                        <p className="text-lg text-slate-400 font-medium">Simple steps to academic success.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] border-t-2 border-dashed border-slate-800 z-0" />
                                )}
                                <div className="bg-card p-8 rounded-3xl border border-slate-800 shadow-sm relative z-10 hover:border-primary/50 transition-all">
                                    <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-primary/20">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-50 mb-3">{step.title}</h3>
                                    <p className="text-slate-400 font-medium leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-primary rounded-[48px] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8 relative z-10 tracking-tight">Ready to transform your assessment process?</h2>
                        <p className="text-xl text-white/90 mb-12 relative z-10 max-w-2xl mx-auto font-medium opacity-90">
                            Join QUIZ MANAGEMENT SYSTEM today and experience a smarter way to manage academic quizzes and student growth.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <Link to="/signup">
                                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-primary hover:bg-slate-50 text-xl font-black shadow-xl">
                                    Get Started Free
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
