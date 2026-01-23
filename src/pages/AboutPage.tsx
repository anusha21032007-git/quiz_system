
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 font-sans">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Button>
                    </Link>
                </div>

                <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100">
                    <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">About EduFlow</h1>

                    <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                        <p>
                            EduFlow is an advanced academic quiz management system designed to streamline the assessment process for educational institutions.
                        </p>
                        <p>
                            We bridge the gap between traditional testing and modern technology, providing a seamless experience for both teachers and students.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 bg-indigo-50 rounded-2xl">
                                <h3 className="font-bold text-indigo-900 mb-2">For Teachers</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-sm text-indigo-800">
                                        <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                        <span>AI-powered Question Generation</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-indigo-800">
                                        <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                        <span>Real-time Analytics Dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-indigo-800">
                                        <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0" />
                                        <span>Automated Grading</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-6 bg-emerald-50 rounded-2xl">
                                <h3 className="font-bold text-emerald-900 mb-2">For Students</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-sm text-emerald-800">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <span>Instant Feedback & Results</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-emerald-800">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <span>Cross-device Compatibility</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-emerald-800">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <span>Progress Tracking</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
