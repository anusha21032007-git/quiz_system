
import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-6">
                            <div className="bg-indigo-600 rounded-xl p-2 text-white">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-slate-900 leading-tight">EduFlow</span>
                                <span className="text-[10px] text-slate-500 font-medium tracking-wide">QUIZ MANAGEMENT SYSTEM</span>
                            </div>
                        </Link>
                        <p className="text-slate-600 mb-6 max-w-sm leading-relaxed">
                            A professional platform for online internal assessments, scheduling quizzes, and tracking performance with precision and ease.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <Github className="h-4 w-4" />
                            </a>
                            <a href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" className="text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-slate-600 hover:text-indigo-600 transition-colors">About Us</Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-600 hover:text-indigo-600 transition-colors">Sign In</Link>
                            </li>
                            <li>
                                <Link to="/signup" className="text-slate-600 hover:text-indigo-600 transition-colors">Sign Up</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-600">
                                <Mail className="h-4 w-4 text-indigo-600" />
                                <span>support@eduflow.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500 font-medium">
                        © {new Date().getFullYear()} EduFlow. All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <a href="#" className="text-sm text-slate-500 hover:text-slate-700 font-medium">Privacy Policy</a>
                        <a href="#" className="text-sm text-slate-500 hover:text-slate-700 font-medium">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
