
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserCircle, GraduationCap, ArrowLeft } from "lucide-react";

const SignupPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 font-sans">
            <div className="w-full max-w-md">
                <Link to="/">
                    <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-indigo-600 transition-colors gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back Home
                    </Button>
                </Link>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Create Account</h1>
                    <p className="text-slate-500">Choose your role to get started</p>
                </div>

                <div className="grid gap-4">
                    <Button disabled className="w-full h-auto p-0 border-0 bg-transparent hover:bg-transparent opacity-50 cursor-not-allowed text-left">
                        <div className="w-full bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex items-center gap-4 grayscale">
                            <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center">
                                <UserCircle className="h-6 w-6 text-slate-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-slate-700">Student Signup</h3>
                                <p className="text-xs text-slate-400">Please ask your teacher for credentials</p>
                            </div>
                        </div>
                    </Button>

                    <Link to="/teacher/signup">
                        <div className="bg-white hover:bg-indigo-50 p-6 rounded-[24px] border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">Teacher Signup</h3>
                                    <p className="text-sm text-slate-500">Create a new teacher account</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
