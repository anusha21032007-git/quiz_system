"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SignupPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name, // Pass full_name to user metadata
                    role: 'teacher' 
                }
            }
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success("Account created! Please check your email or sign in.");
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="absolute top-8 left-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2 text-slate-500 hover:text-indigo-600 font-bold">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md border-0 shadow-2xl shadow-indigo-100/50 rounded-[32px] overflow-hidden">
                <CardHeader className="pt-10 pb-6 text-center space-y-2">
                    <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">Create Account</CardTitle>
                    <CardDescription className="text-slate-500 font-medium tracking-tight">
                        Join EduFlow and start managing quizzes with ease
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4 px-8 pb-8">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-bold">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    className="pl-10 h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 rounded-xl"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-bold">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@college.edu"
                                    className="pl-10 h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 rounded-xl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700 font-bold">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-11 bg-slate-50 border-slate-100 focus:bg-white focus:ring-indigo-500 rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 px-8 pb-10">
                        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-lg font-bold shadow-lg shadow-indigo-100" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Create Account
                        </Button>
                        <p className="text-sm text-center text-slate-500 font-medium">
                            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default SignupPage;