"use client";

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Loader2, Mail, Lock, ArrowLeft, User } from 'lucide-react';

const TeacherSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
          full_name: fullName,
          role: 'teacher'
        }
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Registration successful! Please check your email.');
      navigate('/teacher/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute top-8 left-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2 text-slate-400 hover:text-primary font-bold">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md border border-slate-800 shadow-2xl shadow-primary/5 bg-card rounded-[32px] overflow-hidden">
        <CardHeader className="pt-10 pb-6 text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-50 tracking-tight uppercase leading-none">Teacher Signup</CardTitle>
          <CardDescription className="text-slate-500 font-bold tracking-tight italic">Join the QUIZ MANAGEMENT SYSTEM academic platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 px-8 pb-8">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-300 font-bold text-xs uppercase tracking-widest pl-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Jane Doe"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-[14px] transition-all"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-bold text-xs uppercase tracking-widest pl-1">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="professor@college.edu"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-[14px] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-bold text-xs uppercase tracking-widest pl-1">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  className="pl-10 h-12 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600 focus:bg-slate-900/50 focus:border-primary focus:ring-primary/20 rounded-[14px] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 px-8 pb-10">
            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-[14px] text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null} Create Account
            </Button>
            <p className="text-sm text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Already have an account? <Link to="/teacher/login" className="text-primary font-black hover:underline ml-1">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TeacherSignup;