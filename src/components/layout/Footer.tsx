
import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-[#020617] border-t border-slate-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <div className="bg-primary rounded-xl p-2 text-white shadow-lg shadow-primary/20">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-lg text-slate-50 leading-tight uppercase tracking-tighter">QUIZ MANAGEMENT SYSTEM</span>
                                <span className="text-[10px] text-primary font-bold tracking-widest text-center sm:text-left uppercase">PREMIUM ACADEMIC PORTAL</span>
                            </div>
                        </Link>
                        <p className="text-slate-400 mb-6 max-w-sm leading-relaxed font-medium">
                            A professional platform for online internal assessments, scheduling quizzes, and tracking performance with precision and ease.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-primary hover:border-primary/50 transition-all">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-primary hover:border-primary/50 transition-all">
                                <Github className="h-4 w-4" />
                            </a>
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-primary hover:border-primary/50 transition-all">
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-50 mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-slate-400 hover:text-primary transition-colors font-medium">Home</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-400 hover:text-primary transition-colors font-medium">About Us</Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-400 hover:text-primary transition-colors font-medium">Sign In</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-slate-50 mb-6">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-400 font-medium">
                                <Mail className="h-4 w-4 text-primary" />
                                <span>support@eduflow.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">
                        © {new Date().getFullYear()} QUIZ MANAGEMENT SYSTEM. All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <a href="#" className="text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors">Privacy Policy</a>
                        <a href="#" className="text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
