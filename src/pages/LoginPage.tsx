
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
        <div className="min-h-screen flex items-center justify-center bg-transparent p-6 font-poppins">
            <div className="absolute top-8 left-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2 text-[#7A80B8] hover:text-[#6C8BFF] font-black hover:bg-white/20 rounded-xl transition-all uppercase tracking-widest text-[10px]">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>

            <Card className="glass-card w-full max-w-md border-white/40 overflow-hidden shadow-2xl">
                <CardHeader className="pt-12 pb-8 text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#6C8BFF] to-[#E38AD6] rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-md transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <GraduationCap className="h-9 w-9 text-white" />
                    </div>
                    <CardTitle className="text-4xl font-black text-[#1E2455] tracking-tighter uppercase leading-tight">Faculty Access</CardTitle>
                    <CardDescription className="text-[#3A3F6B] font-bold opacity-70 tracking-tight text-sm">
                        Synchronize with the QUIZ MASTER administration protocol.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-10 pb-8">
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-[#1E2455] font-black uppercase text-[10px] tracking-widest pl-1">Authorized Email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="faculty@institution.edu"
                                    className="glass-input pl-12 h-12 text-[#1E2455] font-bold"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-[#1E2455] font-black uppercase text-[10px] tracking-widest pl-1">Security Key</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-[#7A80B8] group-focus-within:text-[#6C8BFF] transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="glass-input pl-12 h-12 text-[#1E2455] font-bold"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-8 px-10 pb-12">
                        <Button type="submit" className="pastel-button-primary w-full h-14 text-xs tracking-widest" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} SIGN IN PROTOCOL
                        </Button>
                        <p className="text-[11px] text-center text-[#7A80B8] font-black uppercase tracking-widest">
                            New administrator? <Link to="/signup" className="text-[#6C8BFF] hover:underline font-black">Generate Role</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;
