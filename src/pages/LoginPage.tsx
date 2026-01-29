import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const LoginPage = () => {
    const [loginMode, setLoginMode] = useState<'student' | 'teacher'>('student');
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, role, loading: authLoading } = useAuth();

    // No auto-redirect here to ensure the login page is ALWAYS visible when visited.
    // This allows users to explicitly see the portal and switch accounts if needed.

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Handle student register number strategy if needed
        let loginEmail = identifier.trim();
        if (loginMode === 'student' && !loginEmail.includes('@')) {
            loginEmail = `${loginEmail}@student.eduflow.com`;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else if (data.user) {
            // Fetch profile manually to redirect immediately
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile) {
                if (profile.role === 'teacher') navigate("/teacher/dashboard");
                else if (profile.role === 'student') {
                    // Check if student is active
                    const { data: student } = await supabase
                        .from('students')
                        .select('is_active')
                        .eq('auth_user_id', data.user.id)
                        .single();

                    if (student && !student.is_active) {
                        await supabase.auth.signOut();
                        toast.error('Your account is inactive. Please contact your department.');
                        setLoading(false);
                        return;
                    }
                    navigate("/student/dashboard");
                }
            } else {
                toast.error("Profile not found. Please contact support.");
                setLoading(false);
            }
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <Loader2 className="h-12 w-12 animate-spin text-[#6C8BFF]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-6 font-poppins relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6C8BFF]/10 rounded-full blur-[140px] opacity-20" />
                <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-[#E38AD6]/10 rounded-full blur-[120px] opacity-20" />
            </div>

            <div className="absolute top-8 left-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2 text-[#7A80B8] hover:text-[#6C8BFF] font-black hover:bg-white/20 rounded-xl transition-all uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>

            <Card className="glass-card w-full max-w-lg border-white/40 overflow-hidden shadow-2xl rounded-[40px] animate-in zoom-in-95 duration-500">
                <CardHeader className="pt-12 pb-6 text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-[28px] flex items-center justify-center mb-2 border border-white/30 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-700">
                        <GraduationCap className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-4xl font-black text-[#1E2455] tracking-tighter uppercase leading-tight">Login</CardTitle>
                        <CardDescription className="text-[#3A3F6B] font-bold opacity-70 tracking-tight text-md mt-2">
                            Select your role to continue.
                        </CardDescription>
                    </div>
                </CardHeader>

                <div className="px-10 pb-8 mt-2">
                    <div className="flex p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setLoginMode('student')}
                            className={cn(
                                "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                                loginMode === 'student'
                                    ? "bg-white text-[#6C8BFF] shadow-lg scale-[1.02]"
                                    : "text-[#7A80B8] hover:text-[#1E2455]"
                            )}
                        >
                            STUDENT
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMode('teacher')}
                            className={cn(
                                "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                                loginMode === 'teacher'
                                    ? "bg-white text-[#E38AD6] shadow-lg scale-[1.02]"
                                    : "text-[#7A80B8] hover:text-[#1E2455]"
                            )}
                        >
                            FACULTY
                        </button>
                    </div>
                </div>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-10 pb-8 animate-in fade-in slide-in-from-top-4 duration-500" key={loginMode}>


                        <div className="space-y-3">
                            <Label htmlFor="identifier" className="text-[#1E2455] font-black uppercase text-[10px] tracking-widest pl-1">
                                {loginMode === 'student' ? 'Register Number' : 'Email Address'}
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-5 h-5 w-5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                                <Input
                                    id="identifier"
                                    type="text"
                                    placeholder={loginMode === 'student' ? "e.g. 2024CS001" : "faculty@institution.edu"}
                                    className="glass-input pl-14 h-15 text-lg font-black text-[#1E2455] placeholder-[#7A80B8]/40"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="password" className="text-[#1E2455] font-black uppercase text-[10px] tracking-widest pl-1">Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-5 h-5 w-5 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="glass-input pl-14 h-15 text-lg font-black text-[#1E2455] placeholder-[#7A80B8]/40"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-8 px-10 pb-12">
                        <Button type="submit" className={cn(
                            "w-full h-16 text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                            loginMode === 'student' ? "pastel-button-primary" : "bg-gradient-to-r from-[#E38AD6] to-[#6C8BFF] text-white hover:opacity-90"
                        )} disabled={loading}>
                            {loading && <Loader2 className="h-6 w-6 animate-spin mr-3" />}
                            {loginMode === 'student' ? 'LOGIN AS STUDENT' : 'LOGIN AS FACULTY'}
                        </Button>
                        <div className="flex flex-col gap-4 items-center">
                            <Link to="/forgot-password" size="sm" className="text-[10px] text-[#7A80B8] hover:text-[#6C8BFF] font-black uppercase tracking-[0.3em] transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
