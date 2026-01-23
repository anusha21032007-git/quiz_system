
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserCircle, GraduationCap, ArrowLeft } from "lucide-react";

const LoginPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 font-sans">
            <div className="w-full max-w-md">
                <Link to="/">
                    <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-indigo-600 transition-colors gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back Home
                    </Button>
                </Link>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500">Choose your portal to login</p>
                </div>

                <div className="grid gap-4">
                    <Link to="/student/login">
                        <div className="bg-white hover:bg-indigo-50 p-6 rounded-[24px] border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UserCircle className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">Student Login</h3>
                                    <p className="text-sm text-slate-500">Access your quizzes and results</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link to="/teacher/login">
                        <div className="bg-white hover:bg-emerald-50 p-6 rounded-[24px] border border-slate-100 hover:border-emerald-100 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">Teacher Login</h3>
                                    <p className="text-sm text-slate-500">Manage courses and students</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        Don't have an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
