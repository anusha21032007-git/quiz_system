
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
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-60" />
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-8 animate-fade-in">
                        <Zap className="h-4 w-4" />
                        Next-Gen Assessment Platform
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
                        Quiz Management <span className="text-indigo-600">System</span>
                    </h1>

                    <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        A professional platform for online internal assessments, scheduling quizzes, and tracking performance with precision and ease.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/student/login">
                            <Button size="lg" className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-xl shadow-indigo-100 transition-all flex items-center gap-3">
                                <Users className="h-5 w-5" />
                                Student Login
                            </Button>
                        </Link>
                        <Link to="/teacher/login">
                            <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-lg font-bold transition-all flex items-center gap-3 text-slate-700">
                                <GraduationCap className="h-5 w-5" />
                                Teacher Login
                            </Button>
                        </Link>
                    </div>

                    {/* Dashboard Preview Placeholder */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="aspect-[16/9] bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 overflow-hidden group">
                            <div className="w-full h-full bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-blue-50/50" />
                                <div className="flex flex-col items-center gap-4 relative z-10 text-slate-400">
                                    <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center">
                                        <BrainCircuit className="h-10 w-10 text-indigo-200" />
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-widest opacity-50">Enterprise Dashboard Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Powerful Features</h2>
                        <p className="text-lg text-slate-600 font-medium">Everything you need to manage academic assessments at scale.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                                <div className={cn("inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 transition-colors", feature.color)}>
                                    <feature.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed font-medium text-sm">
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase mb-6 tracking-wider">
                                About EduFlow
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Professional Assessment Framework</h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                                EduFlow is a sophisticated academic platform designed specifically for higher education institutions. We focus on bridging the gap between traditional manual workflows and digital efficiency through seamless quiz management.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Student dashboard for scheduled quizzes + results",
                                    "Teacher dashboard for quiz creation + user management",
                                    "Real-time leaderboard and tracking"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10">
                                <Link to="/about">
                                    <Button size="lg" variant="ghost" className="rounded-xl px-0 hover:bg-transparent text-indigo-600 font-bold flex items-center gap-2 group">
                                        Learn more about our mission
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-indigo-600 rounded-[60px] relative overflow-hidden rotate-3 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-700 opacity-90" />
                                <div className="absolute inset-0 p-12 flex flex-col justify-end text-white">
                                    <GraduationCap className="h-16 w-16 mb-6 opacity-40" />
                                    <h4 className="text-3xl font-bold mb-4">Academic Excellence</h4>
                                    <p className="text-indigo-50 text-lg opacity-80 leading-relaxed">
                                        Empowering educators with tools that simplify complexity and maximize student potential.
                                    </p>
                                </div>
                            </div>
                            {/* Decorative blocks */}
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white rounded-3xl shadow-xl p-6 flex items-center justify-center rotate-[-12deg] border border-slate-100">
                                <Trophy className="h-12 w-12 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">How It Works</h2>
                        <p className="text-lg text-slate-600 font-medium">Simple steps to academic success.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="relative group">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-[2px] border-t-2 border-dashed border-slate-200 z-0" />
                                )}
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative z-10 hover:shadow-lg transition-all">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-lg shadow-indigo-100">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed">
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
                    <div className="bg-indigo-600 rounded-[48px] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-200">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8 relative z-10 tracking-tight">Ready to transform your assessment process?</h2>
                        <p className="text-xl text-indigo-50 mb-12 relative z-10 max-w-2xl mx-auto font-medium opacity-90">
                            Join EduFlow today and experience a smarter way to manage academic quizzes and student growth.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                            <Link to="/signup">
                                <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 text-xl font-black shadow-xl">
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
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "AI Quiz Generation",
        description: "Automatically generate high-quality quiz questions from PDFs and academic materials using advanced AI technologies.",
        icon: BrainCircuit,
        color: "bg-purple-50 text-purple-600"
    },
    {
        title: "Performance Analytics",
        description: "Gain deep insights into student performance with visual reports, trend analysis, and comprehensive statistics.",
        icon: BarChart3,
        color: "bg-emerald-50 text-emerald-600"
    },
    {
        title: "Secure Attempt Rules",
        description: "Maintain assessment integrity with flexible quiz rules, time limits, and session monitoring features.",
        icon: ShieldCheck,
        color: "bg-orange-50 text-orange-600"
    },
    {
        title: "Leaderboard & Ranking",
        description: "Foster healthy competition among students with real-time leaderboards and transparent department rankings.",
        icon: Trophy,
        color: "bg-yellow-50 text-yellow-600"
    },
    {
        title: "Instant Results",
        description: "Reduce waiting time with automated grading and instant result publishing for both students and faculty.",
        icon: Clock,
        color: "bg-rose-50 text-rose-600"
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
