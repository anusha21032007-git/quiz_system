
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            // Check session to determine where to go or just go to a default
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Determine role from metadata or profile table if needed
                // For now, let's just go to teacher which is common for email login
                navigate("/teacher");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="absolute top-8 left-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2 text-slate-400 hover:text-primary font-bold hover:bg-slate-800">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md border border-slate-800 bg-card shadow-2xl rounded-[32px] overflow-hidden">
                <CardHeader className="pt-10 pb-6 text-center space-y-2">
                    <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-lg shadow-primary/5">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-50 tracking-tight">Sign In</CardTitle>
                    <CardDescription className="text-slate-400 font-medium tracking-tight">
                        Enter your credentials to access QUIZ MANAGEMENT SYSTEM
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 px-8 pb-8">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300 font-bold">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@college.edu"
                                    className="pl-10 h-11 bg-slate-900/50 border-slate-800 focus:bg-slate-900 focus:ring-primary/20 focus:border-primary text-slate-200 rounded-xl transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300 font-bold">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 bg-slate-900/50 border-slate-800 focus:bg-slate-900 focus:ring-primary/20 focus:border-primary text-slate-200 rounded-xl transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 px-8 pb-10">
                        <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all duration-300" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Sign In
                        </Button>
                        <p className="text-sm text-center text-slate-500 font-medium">
                            Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
